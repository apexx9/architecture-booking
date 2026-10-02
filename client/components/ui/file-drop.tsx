"use client";

import { useId, useRef, useState, type DragEvent, type ReactNode } from "react";
import { Upload, X, FileText } from "lucide-react";
import { FieldError } from "@/components/ui/field-error";

/**
 * File selection surface.
 *
 * Stops at the boundary on purpose. §13.1 and §41.1 describe the upload as
 * client → signed upload URL → object storage → queue → worker, but neither section
 * specifies an endpoint, request shape or completion callback. Building the upload
 * half would mean inventing an API contract, which is not a frontend call. This
 * handles selection, validation and removal, and hands `File` objects upward.
 */

export interface FileDropProps {
  files: File[];
  onFilesChange: (files: File[]) => void;
  /** Native `accept` string, e.g. `".pdf,.dwg"` or `"image/*"`. */
  accept?: string;
  /** Bytes. Files above this are rejected with an explanation. */
  maxSize?: number;
  maxFiles?: number;
  disabled?: boolean;
  label?: string;
  hint?: ReactNode;
  children?: ReactNode;
  className?: string;
}

/** Human-readable byte size. Uses 1024-based units, which is what upload limits use. */
function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;

  const units = ["KB", "MB", "GB"];
  let value = bytes / 1024;
  let unitIndex = 0;

  while (value >= 1024 && unitIndex < units.length - 1) {
    value /= 1024;
    unitIndex += 1;
  }

  // One decimal below 10, so "9.4 MB" stays readable next to "128 MB".
  const rounded = value < 10 ? Math.round(value * 10) / 10 : Math.round(value);
  return `${rounded} ${units[unitIndex]}`;
}

const FileDrop = ({
  files,
  onFilesChange,
  accept,
  maxSize,
  maxFiles,
  disabled = false,
  label = "Choose files",
  hint,
  children,
  className,
}: FileDropProps) => {
  const inputId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);

  const addFiles = (incoming: FileList | null) => {
    if (!incoming || incoming.length === 0) return;

    const next: string[] = [];
    const accepted: File[] = [];

    for (const file of Array.from(incoming)) {
      if (maxSize !== undefined && file.size > maxSize) {
        next.push(
          `${file.name} is ${formatBytes(file.size)}, over the ${formatBytes(maxSize)} limit.`,
        );
        continue;
      }

      // Deduplicate by name and size: re-picking the same file should be a no-op.
      const duplicate = files.some(
        (existing) => existing.name === file.name && existing.size === file.size,
      );
      if (!duplicate) accepted.push(file);
    }

    let merged = [...files, ...accepted];

    if (maxFiles !== undefined && merged.length > maxFiles) {
      next.push(`You can attach up to ${maxFiles} ${maxFiles === 1 ? "file" : "files"}.`);
      merged = merged.slice(0, maxFiles);
    }

    setErrors(next);
    onFilesChange(merged);
  };

  const removeFile = (index: number) => {
    setErrors([]);
    onFilesChange(files.filter((_, position) => position !== index));
  };

  const handleDrop = (event: DragEvent<HTMLLabelElement>) => {
    event.preventDefault();
    setDragging(false);
    if (disabled) return;
    addFiles(event.dataTransfer.files);
  };

  const zoneStyles = [
    "block rounded-sm border border-dashed px-4 py-6 text-center",
    "transition-colors duration-150 motion-reduce:transition-none",
    "focus-within:outline-2 focus-within:-outline-offset-2 focus-within:outline-ink",
    disabled
      ? "cursor-not-allowed border-line bg-surface-sunken opacity-60"
      : dragging
        ? "cursor-copy border-ink bg-surface-subtle"
        : "cursor-pointer border-line-strong hover:border-ink/50 hover:bg-surface-subtle",
  ].join(" ");

  return (
    <div className={className}>
      {/*
        * The label *is* the drop target, and the file input lives inside it, so
        * clicking, keyboard focus and drag-and-drop are all handled by one element
        * that the browser already treats as a control.
        */}
      <label
        htmlFor={inputId}
        onDragOver={(event) => {
          event.preventDefault();
          if (!disabled) setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={handleDrop}
        className={zoneStyles}
      >
        <input
          ref={inputRef}
          id={inputId}
          type="file"
          multiple={maxFiles === undefined || maxFiles > 1}
          accept={accept}
          disabled={disabled}
          onChange={(event) => {
            addFiles(event.target.files);
            // Reset so picking the same file twice still fires a change event.
            event.target.value = "";
          }}
          className="sr-only"
        />

        <Upload className="mx-auto size-5 text-ink-subtle" aria-hidden="true" />
        <span className="mt-2 block text-[13px] font-medium text-ink">{label}</span>
        {hint ? (
          <span className="mt-1 block text-[12px] leading-[17px] text-ink-muted">{hint}</span>
        ) : null}
        {children}
      </label>

      {errors.length > 0 ? (
        <ul className="mt-2 space-y-1">
          {errors.map((message) => (
            <li key={message}>
              <FieldError>{message}</FieldError>
            </li>
          ))}
        </ul>
      ) : null}

      {files.length > 0 ? (
        <ul className="mt-3 space-y-1.5">
          {files.map((file, index) => (
            <li
              key={`${file.name}-${file.size}-${index}`}
              className="flex items-center gap-3 rounded-sm border border-line px-3 py-2"
            >
              <FileText className="size-4 shrink-0 text-ink-subtle" aria-hidden="true" />

              <span className="min-w-0 flex-1">
                <span className="block truncate text-[13px] text-ink">{file.name}</span>
                <span className="block text-[12px] text-ink-muted tabular-nums">
                  {formatBytes(file.size)}
                </span>
              </span>

              {/*
                * An explicit remove button rather than hover-only, per DESIGN.md.
                * The index is announced so a screen-reader user knows which file is
                * going, since the file names can repeat.
                */}
              <button
                type="button"
                onClick={() => removeFile(index)}
                disabled={disabled}
                aria-label={`Remove ${file.name}`}
                className="shrink-0 rounded-sm p-1 text-ink-subtle transition-colors duration-150 hover:bg-surface-sunken hover:text-ink motion-reduce:transition-none focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-ink disabled:cursor-not-allowed disabled:opacity-50"
              >
                <X className="size-3.5" aria-hidden="true" />
              </button>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
};

export default FileDrop;
export { formatBytes };
