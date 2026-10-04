# Stitches by Liyah

Bespoke tailoring website — oxblood theme, stitch/needle motifs, animated with Framer Motion.

## Stack

- React + Vite
- Tailwind CSS v4 (via `@tailwindcss/vite`)
- Framer Motion (animations)
- React Router (Home / Gallery / Admin)
- Supabase (database, image storage, and admin auth)

## Pages

- **Home** — hero, up to 3 featured products, business contact info, and a contact form (saved to Supabase).
- **Gallery** (`/gallery`) — every product.
- **Admin** (`/admin`) — sign-in gated. Add/edit/delete products (with image upload), and read/delete inquiries submitted from the contact form.

## Setup

1. Copy `.env.example` to `.env` and fill in your Supabase project URL and anon key
   (Supabase dashboard → Project Settings → API).
2. In the Supabase SQL editor, run `supabase.sql` once — it creates the `products`
   and `inquiries` tables with the correct read/write policies.
3. In Supabase → Storage, create a **public** bucket named `products` (for product photos).
4. In Supabase → Authentication → Users, add one user (email + password) — that's
   the login for `/admin`. There's no public sign-up; only that one account can sign in.
5. Edit the placeholder address/email/phone in `src/components/Footer.jsx` (`CONTACT`).
6. `npm install`
7. `npm run dev`

## Build

```
npm run build
```
