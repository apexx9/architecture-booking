/**
 * Cross-tab coordination for the session refresh.
 *
 * The session is two httpOnly cookies, so every tab in the browser shares one
 * refresh token. The server rotates that token on every refresh and treats a
 * second use of the same token as theft, which it answers by revoking the whole
 * session family. That makes two tabs refreshing at the same instant fatal: the
 * loser of the race logs the user out of every tab.
 *
 * This module is how the tabs coordinate instead of colliding:
 *
 * - `withRefreshLock` serialises refreshes across tabs using the Web Locks API,
 *   the primitive browsers provide for exactly this.
 * - `markRefreshed` / `wasRefreshedRecently` let a tab that waited for the lock
 *   notice that another tab already rotated, so it replays its request instead of
 *   rotating again. The timestamp lives in `localStorage` because that is the one
 *   store every tab of the same origin can both read and write.
 * - The broadcast channel tells the other tabs the outcome, so they can adopt a
 *   new session, or sign out together when it is genuinely over.
 *
 * Nothing here touches a token value. The tokens stay in cookies the JavaScript
 * here cannot read.
 */

/** Cross-tab mutex name. Any page in this origin that refreshes uses it. */
const REFRESH_LOCK = "renove:auth-refresh";

/** Broadcast channel name for session outcomes. */
const SESSION_CHANNEL = "renove:auth-session";

/**
 * How long a completed refresh counts as "just happened" for another tab.
 *
 * Long enough to cover the window between one tab's rotation and its peers
 * noticing the broadcast, short enough that an idle user whose access token has
 * genuinely expired still gets a real refresh.
 */
const REFRESHED_WINDOW_MS = 5_000;

const REFRESHED_AT_KEY = "renove:auth:refreshed-at";

export type SessionEvent =
  /** A refresh succeeded. Queued requests can be replayed. */
  | { type: "refreshed" }
  /**
   * The session is definitively over — signed out, or a refresh failed
   * everywhere. Every tab has to drop its in-memory user, or one tab keeps
   * showing a shell whose session no longer exists.
   */
  | { type: "signed-out"; reason?: string };

function storage(): Storage | null {
  try {
    // Private-mode Safari and hardened browser profiles throw on access rather
    // than returning null, so this has to be a real try/catch.
    return window.localStorage;
  } catch {
    return null;
  }
}

/** Records that this browser has just rotated its refresh token. */
export function markRefreshed() {
  const store = storage();

  try {
    store?.setItem(REFRESHED_AT_KEY, String(Date.now()));
  } catch {
    // A full or blocked store costs us the fast path, not correctness: the lock
    // and the broadcast still hold.
  }
}

/**
 * Whether a refresh completed in this browser within the reuse window.
 *
 * A tab that gets here has just acquired the refresh lock and is therefore the
 * only one rotating. If a rotation already landed moments ago, doing another one
 * would be a second rotation for no reason — and, on a server that revokes the
 * family on reuse, the fastest way to sign the user out.
 */
export function wasRefreshedRecently(): boolean {
  const store = storage();

  if (!store) return false;

  const raw = store.getItem(REFRESHED_AT_KEY);

  if (!raw) return false;

  const at = Number(raw);

  if (!Number.isFinite(at)) return false;

  // A tab that has been asleep past the window has genuinely expired; clear it
  // so a stale timestamp from a previous session cannot suppress a refresh.
  if (Date.now() - at > REFRESHED_WINDOW_MS) {
    store.removeItem(REFRESHED_AT_KEY);

    return false;
  }

  return true;
}

/**
 * Runs `task` with exclusive access across every tab of this origin.
 *
 * Falls back to running `task` directly when the Web Locks API is unavailable,
 * which degrades to single-tab behaviour — the same behaviour the app had before.
 */
export async function withRefreshLock<T>(task: () => Promise<T>): Promise<T> {
  const locks =
    typeof navigator !== "undefined"
      ? (navigator.locks as LockManager | undefined)
      : undefined;

  if (!locks?.request) {
    return task();
  }

  return locks.request(REFRESH_LOCK, { mode: "exclusive" }, task);
}

let channel: BroadcastChannel | null | undefined;

/** The shared channel, created on first use. `null` where unsupported. */
function sessionChannel(): BroadcastChannel | null {
  if (channel !== undefined) return channel;

  if (typeof BroadcastChannel === "undefined") {
    channel = null;

    return channel;
  }

  channel = new BroadcastChannel(SESSION_CHANNEL);

  return channel;
}

/** Tells the other tabs what just happened. */
export function broadcastSessionEvent(event: SessionEvent) {
  try {
    sessionChannel()?.postMessage(event);
  } catch {
    // A structured-clone failure or a closed channel must never break the
    // request that produced the event.
  }
}

/** Subscribes to other tabs' session events. Returns an unsubscribe function. */
export function subscribeToSessionEvents(
  handler: (event: SessionEvent) => void,
): () => void {
  const bus = sessionChannel();

  if (!bus) {
    return () => undefined;
  }

  const listener = (message: MessageEvent) => {
    const event = message.data as SessionEvent | null;

    if (!event || (event.type !== "refreshed" && event.type !== "signed-out")) {
      return;
    }

    handler(event);
  };

  bus.addEventListener("message", listener);

  return () => bus.removeEventListener("message", listener);
}