import { useState } from "react";

const API_URL = import.meta.env.VITE_API_URL;
const API_VERSION = "1";

function getErrorMessage(rawBody, status) {
  let message = rawBody || `HTTP ${status}`;
  try {
    const parsed = JSON.parse(rawBody);
    if (parsed && typeof parsed.message === "string") {
      message = parsed.message;
    }
  } catch {
    message = String(message);
  }
  return message;
}

export default function Upload() {
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState(null);
  const [result, setResult] = useState(null);

  async function handleSubmit(event) {
    event.preventDefault();
    if (!file) return;

    setUploading(true);
    setError(null);
    setResult(null);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const csrfToken = document.cookie
        .split("; ")
        .find((row) => row.startsWith("csrf_token="))
        ?.split("=")[1];
      console.log("CSRF token:", csrfToken);

      const headers = {
        Accept: "application/json",
        "X-API-Version": API_VERSION,
        "X-CSRF-Token": csrfToken,
      };

      const response = await fetch(
        new URL("/api/profiles/upload", API_URL).toString(),
        {
          method: "POST",
          credentials: "include",
          headers,
          body: formData,
        },
      );

      const rawBody = await response.text();

      if (!response.ok) {
        throw new Error(getErrorMessage(rawBody, response.status));
      }

      if (!rawBody) {
        setResult(null);
        return;
      }

      try {
        setResult(JSON.parse(rawBody));
      } catch {
        throw new Error("Invalid JSON in upload response");
      }
    } catch (err) {
      setError(err.message || "Upload failed");
    } finally {
      setUploading(false);
    }
  }

  const summary = result?.data ?? result;
  const reasons = summary?.reasons;
  const reasonEntries = Array.isArray(reasons)
    ? reasons.map((reason, index) => [String(index + 1), reason])
    : reasons && typeof reasons === "object"
      ? Object.entries(reasons)
      : [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Upload CSV</h1>
        <p className="text-neutral-600 mt-2">
          Upload a CSV file to bulk import profiles.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4 max-w-2xl">
        <label className="block">
          <span className="text-xs text-neutral-500 mb-1 block">CSV file</span>
          <input
            type="file"
            accept=".csv"
            onChange={(e) => setFile(e.target.files?.[0] ?? null)}
            className="input"
          />
        </label>

        <button
          type="submit"
          disabled={uploading || !file}
          className="inline-flex items-center gap-2 px-4 py-2 bg-black text-white rounded-md text-sm font-medium hover:bg-neutral-800 transition-colors disabled:opacity-40"
        >
          {uploading ? (
            <>
              <Spinner />
              Uploading...
            </>
          ) : (
            "Upload CSV"
          )}
        </button>
      </form>

      {error ? (
        <div className="text-red-600">
          <p>Upload failed.</p>
          <p className="text-sm text-neutral-500 mt-1">{error}</p>
        </div>
      ) : null}

      {summary ? (
        <div className="border border-neutral-200 rounded-md divide-y divide-neutral-200">
          <Row label="Total rows" value={summary.total_rows ?? "—"} />
          <Row label="Inserted" value={summary.inserted ?? "—"} />
          <Row label="Skipped" value={summary.skipped ?? "—"} />
          <div className="px-4 py-3">
            <div className="text-sm text-neutral-500">Reasons</div>
            {reasonEntries.length === 0 ? (
              <div className="text-sm text-neutral-600 mt-1">None</div>
            ) : (
              <ul className="mt-2 text-sm text-neutral-600 list-disc pl-5 space-y-1">
                {reasonEntries.map(([key, value]) => (
                  <li key={key}>
                    <span className="font-medium text-neutral-700">{key}</span>
                    {": "}
                    <span>{String(value)}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
}

function Row({ label, value }) {
  return (
    <div className="flex items-center justify-between px-4 py-3">
      <div className="text-sm text-neutral-500">{label}</div>
      <div className="text-sm">{value}</div>
    </div>
  );
}

function Spinner() {
  return (
    <svg
      className="h-4 w-4 animate-spin"
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      aria-hidden="true"
    >
      <circle
        className="opacity-25"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="4"
      />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 0 1 8-8v4a4 4 0 0 0-4 4H4z"
      />
    </svg>
  );
}
