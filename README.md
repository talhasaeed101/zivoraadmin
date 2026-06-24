# Zivora Admin Panel

React admin dashboard for managing the Zivora jewelry catalog, orders, reviews, promo codes, and image uploads to Cloudflare R2.

## Tech Stack

- **Framework:** React 19
- **Build tool:** Vite 8
- **Routing:** React Router
- **Styling:** Custom CSS (luxury Zivora admin theme)

## Prerequisites

- Node.js 18+
- Zivora backend running at `http://localhost:3000`
- Default admin seeded (`npm run seed:admin` in backend)

## Environment Variables

Copy `.env.example` to `.env`:

| Variable | Description | Example |
|----------|-------------|---------|
| `VITE_API_URL` | Backend API base URL | `http://localhost:3000/api/v1` |

## Install

```bash
cd zivora-admin
npm install
```

## Run

**Development:**

```bash
npm run dev
```

Opens at **http://localhost:5174**.

**Production build:**

```bash
npm run build
```

**Preview production build:**

```bash
npm run preview
```

## Default Admin Login

| Field | Value |
|-------|-------|
| Email | `admin@zivora.com` |
| Password | `12345678` |

JWT is stored in `localStorage` as `zivora_admin_token`.

## Admin Modules

### Dashboard (`/`)

- Live stats: revenue, orders, customers, products, reviews, promo codes, average rating
- Recent orders table with links to order detail
- Top selling products
- Quick actions: add product, category, promo code, view orders

### Categories (`/categories`)

- List, search, create, edit, delete categories
- **R2 image upload** on category form (optional URL fallback)

### Products (`/products`)

- List, search, filter, create, edit, delete products
- **R2 multi-image upload** (up to 8) on product form
- Optional comma-separated external image URL fallback

### Orders (`/orders`)

- List with search and status filters
- Order detail page
- Update order status and payment status

### Reviews (`/reviews`)

- List and filter customer reviews
- Review detail — approve, reject, or delete

### Promo Codes (`/promo-codes`)

- Create/edit promo codes (percentage or fixed discount)
- Usage limits, date ranges, min order amount
- Search and filter by status

### R2 Uploads

Uploads happen from **Category Form** and **Product Form** before save:

| Action | API Endpoint |
|--------|--------------|
| Product images | `POST /api/v1/uploads/product-images` |
| Category image | `POST /api/v1/uploads/category-image` |

Requires backend R2 env variables to be configured. Returned public URLs are saved to category/product records.

## Protected Routes

All admin pages except `/login` require authentication. Unauthenticated users are redirected to login.

## Sidebar Navigation

Dashboard → Categories → Products → Orders → Reviews → Promo Codes → Logout

## Related Projects

- **Backend API:** `../zivorabackend`
- **Customer website:** `../zivora`
- **Demo guide:** `../DEMO_GUIDE.md`
