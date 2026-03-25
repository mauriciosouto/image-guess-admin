# Deploy público con autenticación

La app es **Next.js** y usa **PostgreSQL** (Prisma). Para tener una URL pública **restringida** (usuario/contraseña), la opción más simple incluida en el repo es **HTTP Basic Auth** vía `middleware.ts`.

## 1. Autenticación (Basic Auth)

En el servidor de producción definí **siempre** (y en **GitHub / Vercel / Render → Environment variables**):

| Variable | Ejemplo |
|----------|---------|
| `ADMIN_BASIC_AUTH_USER` | `admin` |
| `ADMIN_BASIC_AUTH_PASSWORD` | contraseña larga y aleatoria |

También necesitás **`DATABASE_URL`** apuntando a tu Postgres (ej. Neon, Supabase, RDS).

Comportamiento:

- **Producción** (`NODE_ENV=production`): si faltan user/pass, la app responde **503** (evita dejar el admin abierto por error).
- **Desarrollo**: si no configurás esas variables, el middleware no exige login (como hoy en local).

El navegador mostrará el cuadro nativo de usuario/contraseña.

### Alternativas (sin tocar código)

- **Cloudflare Access** (o Zero Trust) delante del dominio: login con email, OTP, etc.
- **Vercel** (plan Pro): “Password Protection” en el proyecto.

---

## 2. Deploy con GitHub → Vercel (recomendado)

No hace falta un workflow de deploy si conectás el repo en Vercel: cada push a `main` despliega solo.

1. [vercel.com](https://vercel.com) → **Add New Project** → importar el repo de GitHub.
2. **Environment variables**: `DATABASE_URL`, `ADMIN_BASIC_AUTH_USER`, `ADMIN_BASIC_AUTH_PASSWORD`.
3. **Build**: `npm run build` (default), **Install** `npm install` (ejecuta `postinstall` → `prisma generate`).
4. Asegurate de que la base acepte conexiones desde internet (SSL según tu proveedor; el proyecto ya documenta TLS relajado en dev en `lib/prisma.ts`).

Opcional: activá el workflow **CI** (`.github/workflows/ci.yml`) para lint/tests en cada PR/push; el deploy lo sigue haciendo Vercel.

### Deploy solo con GitHub Actions + Vercel

Si preferís desplegar desde Actions:

1. En Vercel: **Settings → Tokens** → crear token.
2. En el repo: **Settings → Secrets and variables → Actions**:
   - `VERCEL_TOKEN`
   - `VERCEL_ORG_ID`, `VERCEL_PROJECT_ID` (aparecen en el proyecto Vercel → Settings → General).

Podés usar la acción oficial o `npx vercel deploy --prod --token=...` en un job; mantené las mismas variables de entorno en el dashboard de Vercel para **runtime**.

---

## 3. Otros hosts (Render, Railway, Fly, Docker)

Misma idea:

- Comando: `npm run build` luego `npm run start` (o `next start`).
- Variables: `DATABASE_URL`, `ADMIN_BASIC_AUTH_*`, `NODE_ENV=production`.

En **Render**: Web Service + Postgres managed, env vars en el panel.

---

## 4. Checklist seguridad

- No commitees `.env`; usá secretos del proveedor.
- Rotá `ADMIN_BASIC_AUTH_PASSWORD` si se filtra.
- Basic Auth va **sin HTTPS** en texto plano en tránsito si no hay TLS; usá siempre **HTTPS** en producción (Vercel/Cloudflare lo dan por defecto).
