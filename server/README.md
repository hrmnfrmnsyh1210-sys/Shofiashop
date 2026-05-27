# Sofia Shop — Backend API

Backend untuk aplikasi POS Sofia Shop Tebas.

**Stack:** Express + TypeScript + Prisma + TiDB Cloud (MySQL).

**Arsitektur:** Backend Express dimount sebagai middleware di Vite dev server,
dan sebagai Vercel serverless function (`api/[[...slug]].ts`) di produksi.
Frontend & backend selalu di-serve dari **port yang sama** — `npm run dev` saja.

## Setup

1. **Install dependencies**:
   ```bash
   npm install
   ```
   (`postinstall` otomatis menjalankan `prisma generate`.)

2. **Setup environment**:
   ```bash
   cp .env.example .env
   ```
   Isi `DATABASE_URL` dengan connection string TiDB Cloud kamu dan
   generate `JWT_ACCESS_SECRET` / `JWT_REFRESH_SECRET` random yang kuat.

3. **Push schema ke TiDB**:
   ```bash
   npm run prisma:push
   ```
   Jika butuh database baru di cluster TiDB:
   ```bash
   npx tsx server/scripts/create-database.ts sofia_shop
   ```

4. **Seed admin + sample data**:
   ```bash
   npm run seed
   ```
   Admin default: `admin@sofiashop.local` / `ChangeMe123!`.

5. **Jalankan semuanya dengan satu perintah**:
   ```bash
   npm run dev
   ```
   Frontend di `http://localhost:3000`, backend di
   `http://localhost:3000/api/v1/*` (port yang sama, tanpa CORS).
   Health check: `GET http://localhost:3000/api/v1/health`.

   Backend hot-reload otomatis saat file di `server/src/` diubah.

## Deploy ke Vercel

1. Push repo ke GitHub, import project di Vercel.
2. Set environment variables di Vercel dashboard (copy dari `.env`):
   `DATABASE_URL`, `JWT_ACCESS_SECRET`, `JWT_REFRESH_SECRET`,
   `JWT_ACCESS_TTL`, `JWT_REFRESH_TTL`, `BCRYPT_ROUNDS`, `NODE_ENV=production`.
3. Vercel akan auto-detect Vite + jalankan `vercel-build` (= `prisma generate
   && vite build`). Folder `api/` di-deploy sebagai serverless function.
4. Selesai. Frontend di-serve dari CDN, `/api/*` ke serverless function.

## Pola pengembangan alternatif (opsional)

Kalau perlu jalankan backend tanpa Vite (misal untuk benchmarking atau
testing di luar browser):
```bash
npm run server:standalone   # listen di http://localhost:4000
```

## Struktur folder

```
server/
  prisma/
    schema.prisma      # data model
    seed.ts            # initial seed (admin + sample data)
  src/
    config/env.ts      # env loader (zod-validated)
    lib/               # prisma, jwt, password, helpers
    middleware/        # auth, validate, error
    modules/
      auth/            # /auth (login, register, refresh, me)
      categories/      # /categories
      products/        # /products
      members/         # /members (customer)
      transactions/    # /transactions (kasir/POS + online order)
      stock/           # /stock (movements + manual adjustment)
      reports/         # /reports (summary, top products, daily, low-stock)
      catalog/         # /catalog (PUBLIC — untuk toko online)
    routes.ts          # router mounting
    app.ts             # express app builder
    index.ts           # entry point
```

## Endpoint utama

Semua endpoint di-prefix `/api/v1`.

### Auth
- `POST /auth/login` — body: `{ email, password }`
- `POST /auth/refresh` — body: `{ refreshToken }`
- `POST /auth/logout` — body: `{ refreshToken }`
- `GET  /auth/me` *(Bearer)*
- `POST /auth/register` *(Bearer, ADMIN)* — buat user staff

### Kategori (ADMIN/MANAGER untuk write)
- `GET    /categories`
- `POST   /categories`
- `PATCH  /categories/:id`
- `DELETE /categories/:id`

### Produk (ADMIN/MANAGER untuk write)
- `GET    /products?search=&categoryId=&lowStock=true&page=1&pageSize=20&sort=-createdAt`
- `GET    /products/:id`
- `GET    /products/barcode/:barcode`
- `POST   /products`
- `PATCH  /products/:id`
- `DELETE /products/:id` (soft delete)

### Member / Customer
- `GET    /members?search=`
- `GET    /members/phone/:phone`
- `POST   /members`
- `PATCH  /members/:id`
- `POST   /members/:id/points` — body: `{ delta: number }`

### Transaksi / Kasir
- `GET  /transactions?channel=POS&status=PAID&from=2025-01-01&to=2025-12-31`
- `GET  /transactions/:id`
- `POST /transactions` — body sample POS:
  ```json
  {
    "channel": "POS",
    "paymentMethod": "CASH",
    "memberId": null,
    "discount": 0,
    "paymentAmount": 100000,
    "items": [
      { "productId": "cl…", "quantity": 2 }
    ]
  }
  ```
  Stock otomatis dikurangi & movement dicatat.
- `POST  /transactions/:id/void` *(ADMIN/MANAGER)* — kembalikan stock
- `PATCH /transactions/:id/online-status` — body: `{ onlineStatus: "SHIPPED" }`

### Stock
- `GET  /stock/movements?productId=&type=IN`
- `POST /stock/adjust` *(ADMIN/MANAGER)* — body:
  ```json
  { "productId": "cl…", "type": "IN", "quantity": 50, "reference": "PO-001" }
  ```
  Type `ADJUSTMENT` menggunakan `quantity` sebagai stok absolut target.

### Reports *(ADMIN/MANAGER)*
- `GET /reports/summary?from=&to=` — total penjualan, COGS, gross profit
- `GET /reports/top-products?from=&to=&limit=10`
- `GET /reports/daily-sales?from=&to=` — series harian (untuk chart)
- `GET /reports/low-stock`

### Katalog publik (tanpa auth — untuk toko online)
- `GET  /catalog/products?search=&categorySlug=&sort=newest`
- `GET  /catalog/products/:id`
- `GET  /catalog/categories`
- `POST /catalog/checkout` — body:
  ```json
  {
    "customerName": "Sofi",
    "customerPhone": "08123…",
    "shippingAddress": "Jl. …",
    "paymentMethod": "TRANSFER",
    "shippingFee": 15000,
    "items": [{ "productId": "cl…", "quantity": 1 }]
  }
  ```

## Catatan TiDB Cloud

TiDB tidak mendukung foreign key constraint tradisional, jadi
schema Prisma kami pakai `relationMode = "prisma"` — integritas
referensial dijaga di sisi aplikasi.

Untuk migrasi pertama ke TiDB Cloud, **gunakan `prisma db push`**
(lebih cocok untuk MySQL-compatible managed DB) atau `prisma migrate
deploy` kalau kamu sudah punya migration history.

## Auth flow ringkas

1. `POST /auth/login` → dapat `accessToken` (15m) + `refreshToken` (30d).
2. Kirim `Authorization: Bearer <accessToken>` di tiap request terproteksi.
3. Saat access token expired, panggil `POST /auth/refresh` dengan
   `refreshToken` → dapat pasangan token baru. Refresh token lama
   otomatis di-revoke (rotation).
4. `POST /auth/logout` mencabut refresh token.

## Role

- `ADMIN` — semua akses, termasuk register user lain.
- `MANAGER` — kelola produk, stock, void transaksi, lihat report.
- `CASHIER` — transaksi POS, lihat produk/member.
