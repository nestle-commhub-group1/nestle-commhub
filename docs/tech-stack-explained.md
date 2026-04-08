# Nestlé CommHub — Tech Stack Explained

Plain-English explanation of every technology used in this project.

---

## FRONTEND

---

## React.js
**What it is:** A JavaScript library for building UIs out of reusable components.
**Why we chose it:** Industry standard with a large ecosystem and clear patterns.
**How we use it:** Every page (dashboard, tickets, login) is a React component.

---

## Vite
**What it is:** A fast build tool and development server for JavaScript apps.
**Why we chose it:** Near-instant startup and hot reload makes development much faster.
**How we use it:** `npm run dev` starts the dev server; `npm run build` creates the production files.

---

## Tailwind CSS
**What it is:** A CSS framework where you style elements using small utility classes in HTML.
**Why we chose it:** No separate CSS files needed — styles live right inside the JSX.
**How we use it:** All colours, spacing, and layout across the app uses Tailwind classes.

---

## React Router DOM
**What it is:** A library that handles page navigation in React without full page reloads.
**Why we chose it:** Lets us define separate URLs per page and protect routes by role.
**How we use it:** All routes are defined in `App.jsx`, wrapped in `<ProtectedRoute>`.

---

## Axios
**What it is:** A JavaScript library for making HTTP requests to an API.
**Why we chose it:** Cleaner syntax than `fetch`, and handles headers and errors well.
**How we use it:** Every API call to the backend (login, tickets, messages) uses Axios.

---

## Lucide React
**What it is:** A library of SVG icons packaged as React components.
**Why we chose it:** Consistent, scalable icons with no image files required.
**How we use it:** Icons like `<Send />`, `<Clock />`, `<AlertCircle />` are used throughout the UI.

---

## vite-plugin-pwa
**What it is:** A Vite plugin that turns the app into an installable Progressive Web App.
**Why we chose it:** Allows the app to be installed on mobile and work with poor connectivity.
**How we use it:** Currently disabled due to a version conflict with Vite 8 — pending fix.

---

## Progressive Web App (PWA)
**What it is:** A web app that can be installed on a phone like a native app.
**Why we chose it:** Retailers in the field may have limited internet — PWA improves reliability.
**How we use it:** The manifest defines the app name and icons; a service worker will cache assets when the plugin is re-enabled.

---

## BACKEND

---

## Node.js
**What it is:** A runtime that lets you run JavaScript on a server.
**Why we chose it:** Same language as the frontend — one language across the whole project.
**How we use it:** The entire backend runs inside Node.js.

---

## Express.js
**What it is:** A lightweight web framework for Node.js.
**Why we chose it:** Simple way to define API routes with minimal setup.
**How we use it:** `index.js` creates an Express app with routes like `/api/tickets` and `/api/auth`.

---

## JWT (JSON Web Tokens)
**What it is:** A signed token that proves who a user is without storing sessions on the server.
**Why we chose it:** Stateless — the frontend stores the token and sends it with every request.
**How we use it:** Issued at login/register, stored in `localStorage`, sent as `Authorization: Bearer <token>`.

---

## bcryptjs
**What it is:** A library that hashes passwords so they are never stored as plain text.
**Why we chose it:** Essential security practice — hashed passwords can't be stolen and reused.
**How we use it:** The `User` model auto-hashes the password before saving, and uses bcrypt to verify logins.

---

## Mongoose
**What it is:** A library for defining structured data models for MongoDB.
**Why we chose it:** Adds schema validation and useful hooks (like auto-hashing passwords) to MongoDB.
**How we use it:** Every data model — `User`, `Ticket`, `Notification` — is a Mongoose schema.

---

## cors
**What it is:** Express middleware that controls which websites can call the API.
**Why we chose it:** Browsers block cross-origin requests by default — CORS explicitly allows the frontend.
**How we use it:** Configured in `index.js` with a whitelist of allowed origins (localhost + Render URL).

---

## dotenv
**What it is:** Loads environment variables from a `.env` file into the app.
**Why we chose it:** Keeps secrets (database passwords, API keys) out of the source code.
**How we use it:** All sensitive values (`MONGO_URI`, `JWT_SECRET`, etc.) come from `.env` via `process.env`.

---

## nodemon
**What it is:** A dev tool that auto-restarts the server when you save a file.
**Why we chose it:** Removes the manual stop-restart cycle during development.
**How we use it:** `npm run dev` in the backend folder uses nodemon to watch for file changes.

---

## multer
**What it is:** Express middleware for handling file uploads.
**Why we chose it:** Required to parse files from HTTP form submissions.
**How we use it:** Available for file upload endpoints; ticket attachments are currently sent as base64 JSON.

---

## Cloudinary
**What it is:** A cloud service for storing and serving images and videos.
**Why we chose it:** Storing files in MongoDB or on the server is impractical at scale.
**How we use it:** Credentials stored in `.env`; uploaded ticket attachments can be sent to Cloudinary with the URL saved in the database.

---

## DATABASE

---

## MongoDB
**What it is:** A database that stores data as flexible JSON-like documents.
**Why we chose it:** Different user roles have different fields — MongoDB handles this naturally.
**How we use it:** All data (users, tickets, messages, notifications) is stored as MongoDB documents.

---

## MongoDB Atlas
**What it is:** MongoDB's managed cloud hosting service.
**Why we chose it:** Free tier, accessible from both local dev and the Render server, no setup required.
**How we use it:** The `MONGO_URI` in `.env` points to the Atlas cluster; Mongoose connects on startup.

---

## HOSTING

---

## Render (Web Service)
**What it is:** A cloud platform for hosting Node.js servers.
**Why we chose it:** Free tier, deploys automatically from GitHub, no manual server management.
**How we use it:** The `backend/` folder is deployed as a Web Service. A keep-alive ping every 14 minutes prevents the free tier from sleeping.

---

## Render (Static Site)
**What it is:** Render's CDN hosting for pre-built frontend files.
**Why we chose it:** The React build is just static files — no server needed, and it's free.
**How we use it:** `npm run build` produces the `dist/` folder which Render serves. A `_redirects` file handles React Router URLs.

---
## DEVELOPMENT TOOLS

---

## Git and GitHub
**What it is:** Git tracks code changes; GitHub hosts the repository online.
**Why we chose it:** Standard for version control and team collaboration. GitHub triggers auto-deploys on Render.
**How we use it:** All code is committed to a GitHub repo connected to Render for automatic deployment.

---

## Vite build tool
**What it is:** Vite's production build bundles and minifies all code into small files.
**Why we chose it:** Produces optimised output that loads fast for end users.
**How we use it:** `npm run build` inside `app/` generates the `dist/` folder for deployment.

---

## npm
**What it is:** The Node Package Manager — installs and manages JavaScript libraries.
**Why we chose it:** Standard tool in the JavaScript ecosystem; all dependencies are listed in `package.json`.
**How we use it:** `npm install` sets up dependencies; `npm run dev` starts development; `npm run build` deploys.
