import { Outlet, NavLink, Link } from "react-router-dom";
import { useAuth } from "../contexts/useAuth.js";

export default function Layout() {
  const { user, logout } = useAuth();

  return (
    <div className="min-h-screen flex flex-col">
      <header className="border-b border-neutral-200">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link
            to="/dashboard"
            className="font-semibold text-lg tracking-tight"
          >
            Insighta Labs+
          </Link>

          <nav className="flex items-center gap-6 text-sm">
            <NavLink
              to="/dashboard"
              className={({ isActive }) =>
                isActive
                  ? "text-black font-medium"
                  : "text-neutral-600 hover:text-black"
              }
            >
              Dashboard
            </NavLink>
            <NavLink
              to="/profiles"
              className={({ isActive }) =>
                isActive
                  ? "text-black font-medium"
                  : "text-neutral-600 hover:text-black"
              }
            >
              Profiles
            </NavLink>
            <NavLink
              to="/search"
              className={({ isActive }) =>
                isActive
                  ? "text-black font-medium"
                  : "text-neutral-600 hover:text-black"
              }
            >
              Search
            </NavLink>
            <NavLink
              to="/account"
              className={({ isActive }) =>
                isActive
                  ? "text-black font-medium"
                  : "text-neutral-600 hover:text-black"
              }
            >
              Account
            </NavLink>
          </nav>

          <div className="flex items-center gap-4 text-sm">
            <span className="text-neutral-600">@{user?.username}</span>
            <button
              type="button"
              onClick={logout}
              className="text-neutral-600 hover:text-black"
            >
              Logout
            </button>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-6xl mx-auto px-6 py-8 w-full">
        <Outlet />
      </main>
    </div>
  );
}
