import { API_URL } from "@/lib/api/config";

export type HealthState = "ok" | "degraded" | "unreachable";

export type HealthSnapshot = {
  state: HealthState;

  /** When the API answered, ISO string. Null when it could not be reached. */
  timestamp: string | null;

  uptimeSeconds: number | null;

  database: {
    status: "up" | "down";
    latencyMs: number | null;
  } | null;
};

const TIMEOUT_MS = 5_000;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function readString(value: unknown): string | null {
  return typeof value === "string" ? value : null;
}

function readNumber(value: unknown): number | null {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

/**
 * Reads the API's public `GET /health` readiness report for the marketing
 * status page. Never throws: an unreachable API is a state this page has to
 * render, not an error it can propagate.
 */
export async function fetchHealthSnapshot(): Promise<HealthSnapshot> {
  const unreachable: HealthSnapshot = {
    state: "unreachable",
    timestamp: null,
    uptimeSeconds: null,
    database: null,
  };

  let body: unknown;

  try {
    const response = await fetch(`${API_URL}/health`, {
      cache: "no-store",
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });

    body = await response.json();
  } catch {
    return unreachable;
  }

  if (!isRecord(body)) {
    return unreachable;
  }

  const checks = isRecord(body.checks) ? body.checks : null;
  const database = checks && isRecord(checks.database) ? checks.database : null;

  return {
    // A 503 carries a full report too, so trust the body's own status field.
    state: body.status === "ok" ? "ok" : "degraded",
    timestamp: readString(body.timestamp),
    uptimeSeconds: readNumber(body.uptimeSeconds),
    database: database
      ? {
          status: database.status === "up" ? "up" : "down",
          latencyMs: readNumber(database.latencyMs),
        }
      : null,
  };
}
