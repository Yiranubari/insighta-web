import { useCallback, useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { apiRequest } from "../lib/api.js";

const API_URL = import.meta.env.VITE_API_URL;
const API_VERSION = "1";

const GENDERS = ["", "male", "female"];
const AGE_GROUPS = ["", "child", "teenager", "adult", "senior"];
const SORT_FIELDS = ["", "age", "created_at", "gender_probability"];
const SORT_ORDERS = ["", "asc", "desc"];

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

function getFilenameFromHeader(header) {
  if (!header) return null;
  const utfMatch = header.match(/filename\*=UTF-8''([^;]+)/i);
  if (utfMatch?.[1]) {
    return decodeURIComponent(utfMatch[1]);
  }
  const quotedMatch = header.match(/filename="([^"]+)"/i);
  if (quotedMatch?.[1]) return quotedMatch[1];
  const plainMatch = header.match(/filename=([^;]+)/i);
  return plainMatch?.[1]?.trim() || null;
}

export default function Export() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [downloading, setDownloading] = useState(false);
  const [error, setError] = useState(null);
  const [previewData, setPreviewData] = useState(null);
  const [previewError, setPreviewError] = useState(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [submitted, setSubmitted] = useState(searchParams.toString() !== "");

  const filters = {
    gender: searchParams.get("gender") ?? "",
    country: searchParams.get("country") ?? "",
    ageGroup: searchParams.get("age_group") ?? "",
    minAge: searchParams.get("min_age") ?? "",
    maxAge: searchParams.get("max_age") ?? "",
    sortBy: searchParams.get("sort_by") ?? "",
    order: searchParams.get("order") ?? "",
  };

  function handleFilterSubmit(event) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const params = new URLSearchParams();
    for (const [key, value] of formData.entries()) {
      if (value) params.set(key, String(value));
    }
    setSearchParams(params);
    setSubmitted(true);
  }

  function handleClear() {
    setSearchParams(new URLSearchParams());
    setSubmitted(false);
    setPreviewData(null);
    setPreviewError(null);
  }

  const fetchPreview = useCallback(
    async (cancelled = false) => {
      if (!submitted) return;
      if (cancelled) return;
      setPreviewLoading(true);
      setPreviewError(null);
      try {
        const query = {};
        const gender = searchParams.get("gender");
        const country = searchParams.get("country");
        const ageGroup = searchParams.get("age_group");
        const minAge = searchParams.get("min_age");
        const maxAge = searchParams.get("max_age");
        const sortBy = searchParams.get("sort_by");
        const order = searchParams.get("order");

        if (gender) query.gender = gender;
        if (country) query.country_id = country.toUpperCase();
        if (ageGroup) query.age_group = ageGroup;
        if (minAge) query.min_age = minAge;
        if (maxAge) query.max_age = maxAge;
        if (sortBy) query.sort_by = sortBy;
        if (order) query.order = order;

        const response = await apiRequest("GET", "/api/profiles", { query });
        if (!cancelled) setPreviewData(response);
      } catch (err) {
        if (!cancelled) {
          setPreviewError(err.message || "Failed to load profiles");
          setPreviewData(null);
        }
      } finally {
        if (!cancelled) setPreviewLoading(false);
      }
    },
    [searchParams, submitted],
  );

  useEffect(() => {
    let cancelled = false;
    (async () => {
      await fetchPreview(cancelled);
    })();
    return () => {
      cancelled = true;
    };
  }, [fetchPreview]);

  async function handleDownload() {
    setDownloading(true);
    setError(null);

    try {
      const url = new URL("/api/profiles/export", API_URL);
      url.searchParams.set("format", "csv");

      const gender = searchParams.get("gender");
      const country = searchParams.get("country");
      const ageGroup = searchParams.get("age_group");
      const minAge = searchParams.get("min_age");
      const maxAge = searchParams.get("max_age");
      const sortBy = searchParams.get("sort_by");
      const order = searchParams.get("order");

      if (gender) url.searchParams.set("gender", gender);
      if (country) url.searchParams.set("country_id", country.toUpperCase());
      if (ageGroup) url.searchParams.set("age_group", ageGroup);
      if (minAge) url.searchParams.set("min_age", minAge);
      if (maxAge) url.searchParams.set("max_age", maxAge);
      if (sortBy) url.searchParams.set("sort_by", sortBy);
      if (order) url.searchParams.set("order", order);

      const response = await fetch(url.toString(), {
        method: "GET",
        credentials: "include",
        headers: {
          Accept: "text/csv",
          "X-API-Version": API_VERSION,
        },
      });

      if (!response.ok) {
        const rawBody = await response.text();
        throw new Error(getErrorMessage(rawBody, response.status));
      }

      const blob = await response.blob();
      const contentDisposition = response.headers.get("content-disposition");
      const filename =
        getFilenameFromHeader(contentDisposition) || "profiles-export.csv";

      const blobUrl = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = blobUrl;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(blobUrl);
    } catch (err) {
      setError(err.message || "Export failed");
    } finally {
      setDownloading(false);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Export CSV</h1>
        <p className="text-neutral-600 mt-2">
          Download profile data with the same filters as the profiles list.
        </p>
      </div>

      <form
        onSubmit={handleFilterSubmit}
        className="border border-neutral-200 rounded-md p-4 grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4"
      >
        <Field label="Gender">
          <select name="gender" defaultValue={filters.gender} className="input">
            {GENDERS.map((g) => (
              <option key={g || "any"} value={g}>
                {g || "Any"}
              </option>
            ))}
          </select>
        </Field>

        <Field label="Country (2-letter code)">
          <input
            type="text"
            name="country"
            defaultValue={filters.country}
            placeholder="e.g. NG"
            maxLength={2}
            className="input uppercase"
          />
        </Field>

        <Field label="Age group">
          <select
            name="age_group"
            defaultValue={filters.ageGroup}
            className="input"
          >
            {AGE_GROUPS.map((g) => (
              <option key={g || "any"} value={g}>
                {g || "Any"}
              </option>
            ))}
          </select>
        </Field>

        <Field label="Min age">
          <input
            type="number"
            name="min_age"
            defaultValue={filters.minAge}
            min={0}
            max={150}
            className="input"
          />
        </Field>

        <Field label="Max age">
          <input
            type="number"
            name="max_age"
            defaultValue={filters.maxAge}
            min={0}
            max={150}
            className="input"
          />
        </Field>

        <Field label="Sort by">
          <select
            name="sort_by"
            defaultValue={filters.sortBy}
            className="input"
          >
            {SORT_FIELDS.map((f) => (
              <option key={f || "default"} value={f}>
                {f || "Default"}
              </option>
            ))}
          </select>
        </Field>

        <Field label="Order">
          <select name="order" defaultValue={filters.order} className="input">
            {SORT_ORDERS.map((o) => (
              <option key={o || "default"} value={o}>
                {o || "Default"}
              </option>
            ))}
          </select>
        </Field>

        <div className="flex items-end gap-2">
          <button
            type="submit"
            className="px-4 py-2 bg-black text-white rounded-md text-sm font-medium hover:bg-neutral-800 transition-colors"
          >
            Apply
          </button>
          <button
            type="button"
            onClick={handleClear}
            className="px-4 py-2 border border-neutral-200 rounded-md text-sm font-medium hover:bg-neutral-50 transition-colors"
          >
            Clear
          </button>
        </div>
      </form>

      {!submitted ? null : previewLoading ? (
        <div className="text-neutral-500">Loading...</div>
      ) : previewError ? (
        <div className="text-red-600">
          <p>Could not load profiles.</p>
          <p className="text-sm text-neutral-500 mt-1">{previewError}</p>
        </div>
      ) : previewData?.data?.length === 0 ? (
        <div className="text-neutral-500 py-8 text-center border border-neutral-200 rounded-md">
          No profiles match these filters.
        </div>
      ) : previewData?.data ? (
        <>
          <div className="text-sm text-neutral-500">
            {previewData?.total?.toLocaleString() ?? "0"} profiles match these
            filters
          </div>

          <div className="border border-neutral-200 rounded-md overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-neutral-50 text-left text-neutral-600">
                <tr>
                  <th className="px-4 py-3 font-medium">Name</th>
                  <th className="px-4 py-3 font-medium">Gender</th>
                  <th className="px-4 py-3 font-medium">Age</th>
                  <th className="px-4 py-3 font-medium">Group</th>
                  <th className="px-4 py-3 font-medium">Country</th>
                  <th className="px-4 py-3 font-medium">Created</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-200">
                {previewData?.data?.map((p) => (
                  <tr
                    key={p.id}
                    className="hover:bg-neutral-50 transition-colors"
                  >
                    <td className="px-4 py-3">
                      <Link
                        to={`/profiles/${p.id}`}
                        className="font-medium hover:underline"
                      >
                        {p.name}
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-neutral-600">
                      {p.gender || "—"}
                    </td>
                    <td className="px-4 py-3 text-neutral-600">
                      {p.age ?? "—"}
                    </td>
                    <td className="px-4 py-3 text-neutral-600">
                      {p.age_group || "—"}
                    </td>
                    <td className="px-4 py-3 text-neutral-600">
                      {p.country_name && p.country_id
                        ? `${p.country_name} (${p.country_id})`
                        : p.country_name || p.country_id || "—"}
                    </td>
                    <td className="px-4 py-3 text-neutral-500 text-xs">
                      {new Date(p.created_at).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      ) : null}

      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={handleDownload}
          disabled={downloading}
          className="inline-flex items-center gap-2 px-4 py-2 bg-black text-white rounded-md text-sm font-medium hover:bg-neutral-800 transition-colors disabled:opacity-40"
        >
          {downloading ? (
            <>
              <Spinner />
              Preparing...
            </>
          ) : (
            "Download CSV"
          )}
        </button>
      </div>

      {error ? (
        <div className="text-red-600">
          <p>Export failed.</p>
          <p className="text-sm text-neutral-500 mt-1">{error}</p>
        </div>
      ) : null}
    </div>
  );
}

function Field({ label, children }) {
  return (
    <label className="block">
      <span className="text-xs text-neutral-500 mb-1 block">{label}</span>
      {children}
    </label>
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
