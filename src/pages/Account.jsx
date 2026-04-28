import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/useAuth.js";

export default function Account() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  async function handleLogout() {
    await logout();
    navigate("/login", { replace: true });
  }

  return (
    <div className="max-w-2xl space-y-10">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Account</h1>
        <p className="text-neutral-600 mt-2">
          Your account details and session controls.
        </p>
      </div>

      <div className="border border-neutral-200 rounded-md divide-y divide-neutral-200">
        <Row label="Username" value={`@${user?.username ?? "—"}`} />
        <Row label="Email" value={user?.email || "—"} />
        <Row label="Role" value={user?.role ?? "—"} />
        <Row label="GitHub ID" value={user?.id ?? "—"} mono />
      </div>

      <div className="border border-neutral-200 rounded-md p-6">
        <h2 className="font-semibold">Session</h2>
        <p className="text-sm text-neutral-600 mt-1">
          Sign out of the web portal. Your CLI session is unaffected.
        </p>
        <button
          type="button"
          onClick={handleLogout}
          className="mt-4 px-4 py-2 bg-black text-white rounded-md text-sm font-medium hover:bg-neutral-800 transition-colors"
        >
          Log out
        </button>
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
