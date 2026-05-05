import { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { apiRequest, setCsrfToken } from "../lib/api.js";
import { useAuth } from "../contexts/useAuth.js";

export default function Dashboard() {
  const { user } = useAuth();
  const location = useLocation();
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const csrf = params.get("csrf");
    if (csrf) {
      setCsrfToken(csrf);
    }
  }, [location.search]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const response = await apiRequest("GET", "/api/profiles", {
          query: { limit: 5, sort_by: "created_at", order: "desc" },
        });
        if (!cancelled) setData(response);
      } catch (err) {
        if (!cancelled) setError(err.message || "Failed to load dashboard");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  if (loading) {
    return <div className="text-neutral-500">Loading...</div>;
  }

  if (error) {
    return (
      <div className="text-red-600">
        <p>Could not load dashboard.</p>
        <p className="text-sm text-neutral-500 mt-1">{error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-10">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">
          Welcome back, {user?.username}{" "}
        </h1>
        <p className="text-neutral-600 mt-2">
          Here&apos;s what&apos;s happening across your profile intelligence
          platform.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard
          label="Total profiles"
          value={data?.total?.toLocaleString() ?? "—"}
        />
        <StatCard
          label="Total pages"
          value={data?.total_pages?.toLocaleString() ?? "—"}
        />
        <StatCard label="Your role" value={user?.role ?? "—"} />
      </div>

      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">Recent profiles</h2>
          <Link
            to="/profiles"
            className="text-sm text-neutral-600 hover:text-black"
          >
            View all →
          </Link>
        </div>

        {data?.data?.length === 0 ? (
          <p className="text-neutral-500">No profiles yet.</p>
        ) : (
          <div className="border border-neutral-200 rounded-md divide-y divide-neutral-200">
            {data?.data?.map((p) => (
              <Link
                key={p.id}
                to={`/profiles/${p.id}`}
                className="flex items-center justify-between px-4 py-3 hover:bg-neutral-50 transition-colors"
              >
                <div>
                  <div className="font-medium">{p.name}</div>
                  <div className="text-sm text-neutral-500">
                    {[p.gender, p.age_group, p.country_name]
                      .filter(Boolean)
                      .join(" · ")}
                  </div>
                </div>
                <div className="text-sm text-neutral-400">
                  {new Date(p.created_at).toLocaleDateString()}
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function StatCard({ label, value }) {
  return (
    <div className="border border-neutral-200 rounded-md p-4">
      <div className="text-sm text-neutral-500">{label}</div>
      <div className="text-2xl font-semibold mt-1">{value}</div>
    </div>
  );
}
