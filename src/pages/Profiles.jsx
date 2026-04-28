import { useEffect, useState, useCallback } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { apiRequest } from "../lib/api.js";

const GENDERS = ["", "male", "female"];
const AGE_GROUPS = ["", "child", "teenager", "adult", "senior"];
const SORT_FIELDS = ["", "age", "created_at", "gender_probability"];
const SORT_ORDERS = ["", "asc", "desc"];
const LIMITS = [10, 25, 50, 100];

export default function Profiles() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

  const filters = {
    gender: searchParams.get("gender") ?? "",
    country: searchParams.get("country") ?? "",
    ageGroup: searchParams.get("age_group") ?? "",
    minAge: searchParams.get("min_age") ?? "",
    maxAge: searchParams.get("max_age") ?? "",
    sortBy: searchParams.get("sort_by") ?? "",
    order: searchParams.get("order") ?? "",
    page: Number.parseInt(searchParams.get("page") ?? "1", 10),
    limit: Number.parseInt(searchParams.get("limit") ?? "25", 10),
  };

  const fetchProfiles = useCallback(
    async (cancelled = false) => {
      if (cancelled) return;
      setLoading(true);
      setError(null);
      try {
        const query = {
          page: filters.page,
          limit: filters.limit,
        };
        if (filters.gender) query.gender = filters.gender;
        if (filters.country) query.country_id = filters.country.toUpperCase();
        if (filters.ageGroup) query.age_group = filters.ageGroup;
        if (filters.minAge) query.min_age = filters.minAge;
        if (filters.maxAge) query.max_age = filters.maxAge;
        if (filters.sortBy) query.sort_by = filters.sortBy;
        if (filters.order) query.order = filters.order;

        const response = await apiRequest("GET", "/api/profiles", { query });
        if (!cancelled) setData(response);
      } catch (err) {
        if (!cancelled) setError(err.message || "Failed to load profiles");
      } finally {
        if (!cancelled) setLoading(false);
      }
      // eslint-disable-next-line react-hooks/exhaustive-deps
    },
    [searchParams],
  );

  useEffect(() => {
    let cancelled = false;
    (async () => {
      await fetchProfiles(cancelled);
    })();
    return () => {
      cancelled = true;
    };
  }, [fetchProfiles]);

  function handleFilterSubmit(event) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const params = new URLSearchParams();
    for (const [key, value] of formData.entries()) {
      if (value) params.set(key, String(value));
    }
    params.set("page", "1");
    setSearchParams(params);
  }

  function handleClear() {
    setSearchParams(new URLSearchParams());
  }

  function changePage(newPage) {
    const params = new URLSearchParams(searchParams);
    params.set("page", String(newPage));
    setSearchParams(params);
  }

  function changeLimit(event) {
    const params = new URLSearchParams(searchParams);
    params.set("limit", event.target.value);
    params.set("page", "1");
    setSearchParams(params);
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Profiles</h1>
        <p className="text-neutral-600 mt-2">
          Browse and filter all profiles in the system.
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

      {loading ? (
        <div className="text-neutral-500">Loading...</div>
      ) : error ? (
        <div className="text-red-600">
          <p>Could not load profiles.</p>
          <p className="text-sm text-neutral-500 mt-1">{error}</p>
        </div>
      ) : data?.data?.length === 0 ? (
        <div className="text-neutral-500 py-8 text-center border border-neutral-200 rounded-md">
          No profiles match your filters.
        </div>
      ) : (
        <>
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
                {data?.data?.map((p) => (
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

          <div className="flex items-center justify-between text-sm">
            <div className="text-neutral-500">
              Page {data?.page} of {data?.total_pages} · {data?.total} total
            </div>

            <div className="flex items-center gap-3">
              <label className="text-neutral-500">
                Per page:{" "}
                <select
                  value={filters.limit}
                  onChange={changeLimit}
                  className="input py-1"
                >
                  {LIMITS.map((l) => (
                    <option key={l} value={l}>
                      {l}
                    </option>
                  ))}
                </select>
              </label>

              <button
                type="button"
                onClick={() => changePage(filters.page - 1)}
                disabled={!data?.links?.prev}
                className="px-3 py-1.5 border border-neutral-200 rounded-md disabled:opacity-40 hover:bg-neutral-50 transition-colors"
              >
                Prev
              </button>
              <button
                type="button"
                onClick={() => changePage(filters.page + 1)}
                disabled={!data?.links?.next}
                className="px-3 py-1.5 border border-neutral-200 rounded-md disabled:opacity-40 hover:bg-neutral-50 transition-colors"
              >
                Next
              </button>
            </div>
          </div>
        </>
      )}
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
