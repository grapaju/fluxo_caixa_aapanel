-- Active: 1771624913052@@127.0.0.1@5432@fluxocash
# FluxoCash API (Fastify + Prisma)

## Dev (local)
> Na raiz do monorepo (`D:\fluxo-caixa`), use `npm run dev` para iniciar frontend + backend juntos.
> Portas fixas no dev: frontend `5173` e backend `3001`.

1. Copie `.env.example` para `.env`.
2. Instale deps: `npm install`
3. Crie o banco local PostgreSQL (idempotente): `npm run db:create:local`
4. Gere Prisma Client: `npm run prisma:generate`
5. Crie/aplique migrations no banco local: `npm run prisma:migrate:local`
6. Rode a API: `npm run dev`

## PostgreSQL local (testes)
- Padrão esperado no `.env`: `postgresql://postgres:postgres@127.0.0.1:5432/fluxocash?schema=public`
- Comandos Prisma (`prisma:generate`, `prisma:migrate:local`, `prisma:deploy`) usam `DATABASE_URL` do `.env`.
- Se necessário, ajuste usuário/senha/porta via variáveis do shell para o script:
	- `PGHOST`, `PGPORT`, `PGUSER`, `PGPASSWORD`, `FLUXOCASH_DB_NAME`

## VPS com aaPanel (produção)
1. Instale PostgreSQL pelo `App Store` do aaPanel.
2. Crie database `fluxocash` e usuário dedicado (ex.: `fluxocash_user`) com senha forte.
3. Garanta conexão local da API para o PostgreSQL (mesma VPS): host `127.0.0.1`, porta `5432`.
4. Configure `DATABASE_URL` de produção no ambiente da API.
5. Execute deploy das migrations: `npm run prisma:deploy`
6. Suba a API e valide `GET /health`.

## Auth
- `POST /auth/signup` { email, password } (somente se `ALLOW_SIGNUP=true`; padrão: desabilitado)
- `POST /auth/login` { email, password } -> { accessToken, user } + cookie `refresh_token`
- `POST /auth/refresh` -> { accessToken, user } + cookie
- `POST /auth/logout`

## API
- Prefixo: `/api` (precisa `Authorization: Bearer <accessToken>`)

