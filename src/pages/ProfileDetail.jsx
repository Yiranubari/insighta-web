import { useEffect, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { apiRequest, NotFoundError } from "../lib/api.js";

export default function ProfileDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const response = await apiRequest("GET", `/api/profiles/${id}`);
        if (!cancelled) setProfile(response.data);
      } catch (err) {
        if (cancelled) return;
        if (err instanceof NotFoundError) {
          setError("not_found");
        } else {
          setError(err.message || "Failed to load profile");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [id]);

  if (loading) {
    return <div className="text-neutral-500">Loading...</div>;
  }

  if (error === "not_found") {
    return (
      <div className="space-y-4">
        <h1 className="text-2xl font-bold tracking-tight">Profile not found</h1>
        <p className="text-neutral-600">No profile exists with that ID.</p>
        <button
          type="button"
          onClick={() => navigate("/profiles")}
          className="px-4 py-2 bg-black text-white rounded-md text-sm font-medium hover:bg-neutral-800 transition-colors"
        >
          Back to profiles
        </button>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-red-600">
        <p>Could not load profile.</p>
        <p className="text-sm text-neutral-500 mt-1">{error}</p>
      </div>
    );
  }

  return (
    <div className="max-w-3xl space-y-8">
      <div>
        <Link
          to="/profiles"
          className="text-sm text-neutral-600 hover:text-black"
        >
          ← Back to profiles
        </Link>
        <h1 className="text-3xl font-bold tracking-tight mt-2">
          {profile.name}
        </h1>
      </div>

      <div className="border border-neutral-200 rounded-md divide-y divide-neutral-200">
        <Row label="ID" value={profile.id} mono />
        <Row label="Gender" value={profile.gender || "—"} />
        <Row
          label="Gender probability"
          value={
            profile.gender_probability != null
              ? `${(profile.gender_probability * 100).toFixed(1)}%`
              : "—"
          }
        />
        <Row label="Age" value={profile.age ?? "—"} />
        <Row label="Age group" value={profile.age_group || "—"} />
        <Row
          label="Country"
          value={
            profile.country_name && profile.country_id
              ? `${profile.country_name} (${profile.country_id})`
              : profile.country_name || profile.country_id || "—"
          }
        />
        <Row
          label="Country probability"
          value={
            profile.country_probability != null
              ? `${(profile.country_probability * 100).toFixed(1)}%`
              : "—"
          }
        />
        <Row
          label="Created"
          value={new Date(profile.created_at).toLocaleString()}
        />
      </div>
    </div>
  );
}

function Row({ label, value, mono }) {
  return (
    <div className="flex items-center justify-between px-4 py-3">
      <div className="text-sm text-neutral-500">{label}</div>
      <div className={`text-sm ${mono ? "font-mono text-xs" : ""}`}>
        {value}
      </div>
    </div>
  );
}
