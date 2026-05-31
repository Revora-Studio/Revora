# Revora Studio

Revora Studio is a full-stack hospitality growth website with a React/Vite client and an Express API. It includes public marketing pages, consultation lead capture, client signup/login, a client portal, and an admin lead-management dashboard.

## Project Structure

```text
REVORA/
  client/   React + Vite frontend
  server/   Express API, auth, storage, MongoDB models
```

## Tech Stack

- Frontend: React, TypeScript, Vite, React Router, Framer Motion, Tailwind CSS, Lucide icons
- Backend: Node.js, Express, TypeScript, MongoDB/Mongoose, JWT auth, bcrypt, Zod
- Storage: MongoDB in production, local JSON fallback for development

## Local Setup

Install dependencies in both apps:

```bash
cd client
npm install

cd ../server
npm install
```

Create `server/.env` from `server/.env.example`:

```env
PORT=5000
TRUSTED_ORIGIN=http://127.0.0.1:3000,http://localhost:3000,https://your-frontend-domain.vercel.app
MONGO_URI=mongodb+srv://username:password@cluster.example.mongodb.net/revora
ADMIN_INVITE_CODE=replace-this-with-a-private-admin-invite-code
ADMIN_JWT_SECRET=replace-this-with-a-long-random-secret
CLIENT_JWT_SECRET=replace-this-with-another-long-random-secret
CLOUDINARY_CLOUD_NAME=your-cloudinary-cloud-name
CLOUDINARY_API_KEY=your-cloudinary-api-key
CLOUDINARY_API_SECRET=your-cloudinary-api-secret
```

Create `client/.env` from `client/.env.example` when the frontend is running separately:

```env
VITE_API_URL=http://127.0.0.1:5000
```

Run the backend:

```bash
cd server
npm run dev
```

Run the frontend in another terminal:

```bash
cd client
npm run dev
```

Open the client at `http://127.0.0.1:3000`.

On Windows PowerShell, if `npm` is blocked by execution policy, use `npm.cmd` instead:

```bash
npm.cmd run dev
```

## Admin Flow

Admin credentials are not hardcoded in environment variables.

1. Open `/login`.
2. Choose `Admin`.
3. Switch to `Signup`.
3. Create an admin account with your email, password, and `ADMIN_INVITE_CODE`.
4. Login from the same page.
5. You will be sent to `/admin`.

Admin passwords are hashed before storage. When MongoDB is connected, admins are stored in MongoDB. Local JSON storage is only a fallback for development.

## Client Flow

- `/signup` creates a client account.
- `/login` handles both client and admin login/signup.
- `/portal` shows and edits the client profile.
- Business type supports preset categories plus `Other`, where users can type a custom value.
- Client accounts are stored in MongoDB when `MONGO_URI` is connected. Local JSON storage is only a fallback for development.

## Contact Email

The public contact email is centralized here:

```text
client/src/data/contact.ts
```

Replace this value with your own email:

```ts
export const contactEmail = "revora.infi@gmail.com";
```

It is reused in the footer, home CTA, and portal help CTA.

## Restaurant Names

The home page restaurant/brand logo strip is managed from the admin dashboard.

1. Open `/admin`.
2. Login as admin.
3. Use the `Public restaurants` section.
4. Add or delete restaurant names.

The public website reads the list from `/api/restaurants`. MongoDB is used in production, with local JSON fallback for development.

## Website Content

Services and case studies are created only from the admin dashboard. Public page loads do not seed or create MongoDB records.

If MongoDB has no services or case studies yet, the frontend displays built-in fallback content until an admin adds real content.

## Image Uploads

Admin case study images and client avatar uploads are sent to Cloudinary by the backend.

Put Cloudinary secrets in the backend environment, not in the Vercel frontend:

```env
CLOUDINARY_CLOUD_NAME=your-cloudinary-cloud-name
CLOUDINARY_API_KEY=your-cloudinary-api-key
CLOUDINARY_API_SECRET=your-cloudinary-api-secret
```

Cloudinary stores the image file. MongoDB stores only the returned image URL.

## Validation

Frontend:

```bash
cd client
npm run lint
npm run build
```

Backend:

```bash
cd server
npm run lint
```

## Production Build

Build the frontend first:

```bash
cd client
npm install
npm run build
```

Then start the backend:

```bash
cd ../server
npm install
npm run start
```

The Express server serves the built frontend from `client/dist` and exposes API routes under `/api`.

## Deployment Notes

Set these production environment variables:

```env
PORT=5000
TRUSTED_ORIGIN=https://your-production-domain.com
MONGO_URI=your-production-mongodb-uri
ADMIN_INVITE_CODE=your-private-admin-invite-code
ADMIN_JWT_SECRET=long-random-secret
CLIENT_JWT_SECRET=another-long-random-secret
CLOUDINARY_CLOUD_NAME=your-cloudinary-cloud-name
CLOUDINARY_API_KEY=your-cloudinary-api-key
CLOUDINARY_API_SECRET=your-cloudinary-api-secret
```

If the frontend is deployed on Vercel and the backend is deployed separately, set this Vercel environment variable:

```env
VITE_API_URL=https://your-backend-domain.com
```

## Routing Model

The app uses a simple MERN-style routing split:

- Backend/API routes always start with `/api`.
- React routes are everything else, such as `/`, `/admin`, `/services`, `/case-studies`, `/login`, and `/portal`.
- Unknown `/api/...` routes return JSON `404`.
- Unknown frontend routes are handled by React and redirected by the app.
- `client/vercel.json` rewrites frontend routes to `index.html` so refreshes work on Vercel.

Local development:

```text
client -> Vite dev server
server -> Express API at /api
```

Production with separate frontend/backend:

```text
Vercel frontend -> VITE_API_URL -> backend /api
Backend CORS -> TRUSTED_ORIGIN -> Vercel frontend URL
```

Use MongoDB for production. Local JSON fallback storage may be wiped on many hosting platforms.

Health check endpoint:

```text
GET /api/health
```

Expected response:

```json
{
  "status": "ok",
  "app": "revora-mern-api"
}
```
