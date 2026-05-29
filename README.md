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
CLIENT_URL=http://127.0.0.1:3000
MONGO_URI=mongodb+srv://username:password@cluster.example.mongodb.net/revora
ADMIN_INVITE_CODE=replace-this-with-a-private-admin-invite-code
ADMIN_JWT_SECRET=replace-this-with-a-long-random-secret
CLIENT_JWT_SECRET=replace-this-with-another-long-random-secret
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

1. Open `/admin`.
2. Switch to `Signup`.
3. Create an admin account with your email, password, and `ADMIN_INVITE_CODE`.
4. Login with that stored admin account.

Admin passwords are hashed before storage. When MongoDB is connected, admins are stored in MongoDB. Local JSON storage is only a fallback for development.

## Client Flow

- `/signup` creates a client account.
- `/login` logs a client into the portal.
- `/portal` shows and edits the client profile.
- Business type supports preset categories plus `Other`, where users can type a custom value.

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
CLIENT_URL=https://your-production-domain.com
MONGO_URI=your-production-mongodb-uri
ADMIN_INVITE_CODE=your-private-admin-invite-code
ADMIN_JWT_SECRET=long-random-secret
CLIENT_JWT_SECRET=another-long-random-secret
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

