import { useState } from "react";
import { Link } from "react-router-dom";
import { apiRequest } from "../lib/api.js";

export default function Search() {
  const [query, setQuery] = useState("");
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    const trimmed = query.trim();
    if (!trimmed) return;

    setLoading(true);
    setError(null);
    setSubmitted(true);

    try {
      const response = await apiRequest("GET", "/api/profiles/search", {
        query: { q: trimmed, limit: 25 },
      });
      setData(response);
    } catch (err) {
      setError(err.message || "Search failed");
      setData(null);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Search</h1>
        <p className="text-neutral-600 mt-2">
          Find profiles using natural language. Try queries like{" "}
          <span className="font-mono text-sm bg-neutral-100 px-1.5 py-0.5 rounded">
            young males from nigeria
          </span>{" "}
          or{" "}
          <span className="font-mono text-sm bg-neutral-100 px-1.5 py-0.5 rounded">
            adult women in kenya
          </span>
          .
        </p>
      </div>

      <form onSubmit={handleSubmit} className="flex gap-2">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Describe who you're looking for..."
          className="input flex-1"
          autoFocus
        />
        <button
          type="submit"
          disabled={!query.trim() || loading}
          className="px-4 py-2 bg-black text-white rounded-md text-sm font-medium hover:bg-neutral-800 transition-colors disabled:opacity-40"
        >
          Search
        </button>
      </form>

      {!submitted ? null : loading ? (
        <div className="text-neutral-500">Searching...</div>
      ) : error ? (
        <div className="text-red-600">
          <p>Search failed.</p>
          <p className="text-sm text-neutral-500 mt-1">{error}</p>
        </div>
      ) : data?.data?.length === 0 ? (
        <div className="text-neutral-500 py-8 text-center border border-neutral-200 rounded-md">
          No profiles match that query.
        </div>
      ) : (
        <>
          <div className="text-sm text-neutral-500">
            {data?.total} result{data?.total === 1 ? "" : "s"}
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
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}
