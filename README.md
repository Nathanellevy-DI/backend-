# Travel Maps Backend

Backend API for Travel Maps application built with Express, Prisma, and PostgreSQL (Supabase).

## Deployment

This app is configured to deploy on Railway. Environment variables needed:

- `DATABASE_URL` - Supabase PostgreSQL connection string
- `JWT_SECRET` - Secret for JWT token signing
- `JWT_REFRESH_SECRET` - Secret for refresh tokens
- `CORS_ORIGIN` - Comma-separated list of allowed origins

## Local Development

```bash
npm install
npm run dev
```

## Build

```bash
npm run build
npm start
```
