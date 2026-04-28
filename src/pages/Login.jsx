import { githubAuthUrl } from "../lib/api.js";

export default function Login() {
  function handleLogin() {
    window.location.href = githubAuthUrl();
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-white px-6">
      <div className="w-full max-w-md text-center space-y-8">
        <div className="space-y-3">
          <h1 className="text-4xl font-bold tracking-tight">Insighta Labs+</h1>
          <p className="text-neutral-600">
            Sign in to access the profile intelligence platform.
          </p>
        </div>

        <button
          type="button"
          onClick={handleLogin}
          className="w-full inline-flex items-center justify-center gap-3 px-4 py-3 bg-black text-white rounded-md font-medium hover:bg-neutral-800 transition-colors"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="currentColor"
            className="w-5 h-5"
            aria-hidden="true"
          >
            <path d="M12 .5C5.65.5.5 5.65.5 12.05c0 5.1 3.29 9.42 7.86 10.95.58.1.79-.25.79-.55v-1.93c-3.2.7-3.87-1.54-3.87-1.54-.52-1.33-1.27-1.68-1.27-1.68-1.04-.71.08-.69.08-.69 1.15.08 1.76 1.18 1.76 1.18 1.02 1.75 2.69 1.25 3.35.96.1-.74.4-1.25.72-1.54-2.55-.29-5.24-1.28-5.24-5.69 0-1.26.45-2.29 1.18-3.1-.12-.29-.51-1.46.11-3.05 0 0 .96-.31 3.15 1.18a10.92 10.92 0 0 1 5.74 0c2.19-1.49 3.15-1.18 3.15-1.18.62 1.59.23 2.76.11 3.05.74.81 1.18 1.84 1.18 3.1 0 4.42-2.69 5.4-5.25 5.68.41.36.78 1.06.78 2.13v3.16c0 .31.21.66.8.55 4.56-1.53 7.85-5.85 7.85-10.95C23.5 5.65 18.35.5 12 .5z" />
          </svg>
          Continue with GitHub
        </button>

        <p className="text-xs text-neutral-500">
          By signing in, you agree to use this system per Insighta Labs+
          policies.
        </p>
      </div>
    </div>
  );
}
