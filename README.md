# Insighta Web Portal

The web interface for the Insighta Labs+ profile intelligence platform. Built with React and Vite, styled with Tailwind, deployed on Vercel.

This is one of three repositories that make up the system:

- Backend: https://github.com/Yiranubari/profile-intelligence
- CLI: https://github.com/Yiranubari/insighta-cli
- Web portal: this repo

Live URL: https://insighta-web-seven.vercel.app

## What it does

A simple web interface for non technical users to browse and search the profile database. After signing in with GitHub, you get six pages:

- Login: a single button that starts the GitHub OAuth flow.
- Dashboard: shows total profile count and recently created profiles.
- Profiles: paginated list with filters for gender, country, age group, age range, sorting, and limit. Filter state is reflected in the URL so links can be shared.
- Profile detail: full information for one profile.
- Search: natural language query box. Try things like "young males from nigeria" or "adult women in kenya".
- Account: your username, email, role, and a logout button.

## Running locally

You need Node.js 18 or newer.
npm install
npm run dev

The dev server starts at http://localhost:5173.

By default the portal points at the deployed backend on Railway. If you want to point it at a local backend during development, create a `.env.local` file in the repo root:
VITE_API_URL=http://localhost:8081

`.env.local` is gitignored. The committed `.env.production` keeps the Railway URL for production builds.

## How auth works

The portal uses cookie based sessions. The flow is:

1. The user clicks "Continue with GitHub" on the login page.
2. The browser navigates to the backend's `/auth/github?client_type=web` endpoint.
3. The backend redirects to GitHub for sign in.
4. After GitHub sends the user back to the backend, the backend creates or updates the user, issues an access token and a refresh token, and sets them as HTTP only cookies. A separate `csrf_token` cookie is also set, this one readable by JavaScript.
5. The backend redirects the browser to the portal's `/dashboard` route.
6. On every page load the AuthContext calls `/auth/me`. If it succeeds, the user is logged in. If it returns 401, the context calls `/auth/refresh` once, retries `/auth/me`, and only redirects to `/login` if that also fails.

The access token cookie is HTTP only, so JavaScript on the portal cannot read it. The browser sends it automatically on every request to the backend because we use `credentials: 'include'` on fetch and the backend allows credentials in CORS.

## CSRF protection

For state changing requests (POST, PUT, PATCH, DELETE), the backend uses a double submit cookie pattern. On login the backend sets a `csrf_token` cookie that is readable by JavaScript. Before any state changing request, the portal's HTTP helper reads that cookie and sends its value as an `X-CSRF-Token` header. The backend compares the cookie value and the header value with a constant time check. If they do not match, the request is rejected with a 403.

GET requests skip this check, since they are read only.

## Token expiry and refresh

Access tokens expire after 3 minutes and refresh tokens after 5 minutes. When `/auth/me` returns 401, the AuthContext calls `/auth/refresh`. The refresh token cookie is sent automatically. The backend issues a new pair of tokens, rotates them, and updates both cookies. The portal then retries `/auth/me`. If refresh fails, the user is sent to the login page.

We do not auto retry on every 401 inside individual page components. Only the auth context does that, on initial mount. A 401 from a regular API call surfaces as an `UnauthorizedError` and the page handles it however makes sense (usually by showing an error message).

## Roles

Users have one of two roles, `admin` or `analyst`. Role is included in the `/auth/me` response and exposed via `useAuth()` as `isAdmin`. The portal does not currently use this for UI gating since all six TRD required pages are read only. Admin only actions like creating profiles are handled through the CLI. If a 403 ever comes back from the backend (for example if an analyst tried to call a write endpoint), the HTTP helper throws `ForbiddenError` and the page surfaces a clear message.

## Styling

Tailwind for utilities, no UI library. The visual style is intentionally minimal: black on white, sans serif (Inter), generous whitespace, no gradients. The full color palette comes from Tailwind's neutral scale. Buttons are black with white text, rounded with `rounded-md`, and darken slightly on hover. Borders use `border-neutral-200`.

The shared `.input` class in `src/index.css` covers all form inputs.

## Project layout
src/
main.jsx                    # entry, mounts <App />
App.jsx                     # router, AuthProvider, route guards
index.css                   # tailwind directives, input class
components/
Layout.jsx                # nav header, outlet for child routes
contexts/
auth-context.js           # createContext only
AuthContext.jsx           # provider component
useAuth.js                # hook
lib/
api.js                    # fetch wrapper, error classes, githubAuthUrl
pages/
Login.jsx
Dashboard.jsx
Profiles.jsx
ProfileDetail.jsx
Search.jsx
Account.jsx

## Deployment

The portal deploys automatically from `main` to Vercel. The Railway backend's `WEB_PORTAL_URL` and CORS allow list both reference the Vercel URL, so cookies flow correctly between the two domains. Cookies use `Secure` and `SameSite=None` flags in production, which is required for cross site cookie behavior.

A `vercel.json` at the repo root rewrites every path to `/index.html` so the React router can handle deep links like `/profiles/<id>`.

## Development scripts
npm install
npm run dev          # vite dev server with HMR
npm run build        # production build into dist/
npm run preview      # serve the built dist/ locally
npm run lint         # eslint

CI runs lint and build on every PR to main.
