# YA Mayorista

E-commerce mayorista con panel de administración y chatbot asistido por IA.

## Stack

- **`web/`** — App Next.js (App Router) desplegada en Vercel. Contiene el frontend, las Route Handlers de la API (`web/app/api/**`) y el backend del chatbot en Python (`web/backend/`, FastAPI).
- **Base de datos**: Postgres en [Neon](https://neon.tech). Schema documentado en `db/schema.sql`.
- **Storage de imágenes**: [Vercel Blob](https://vercel.com/docs/storage/vercel-blob).
- **Email de recuperación de contraseña**: [Resend](https://resend.com), integrado en `web/app/api/auth/`.

Sin dependencia de Supabase: la migración fue completa (DB, Storage, Auth, pagos).

## Desarrollo local

```bash
cd web
pnpm install
pnpm dev
```

Variables de entorno necesarias en `web/.env.local`: `DATABASE_URL` (Neon), `BLOB_READ_WRITE_TOKEN`, `RESEND_API_KEY`.

## Deploy

Un solo proyecto de Vercel (`yaproyect1-web`) con dos [services](https://vercel.com/docs/services), definidos en `vercel.json` en la raíz del repo: `web` (Next.js, `web/`) atiende todo, salvo `/api/chat`, que va a `backend` (FastAPI, `web/backend/`). Para probar los dos juntos en local: `vercel dev` desde la raíz. El chatbot está comentado en `web/src/components/layout/AppShell.tsx` a la espera de una `GEMINI_API_KEY` nueva; mientras tanto se muestra un botón de WhatsApp.
