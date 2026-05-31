# PromptHub

A premium, branded prompt-delivery platform designed for AI content creators.

## 🚀 Overview

PromptHub allows creators to share high-performing AI prompts (Midjourney, Runway, Claude, etc.) behind a discovery hub. It features:
- **Subdomain Routing**: Each creator gets their own hub (e.g., `milan.prompthub.app`).
- **Premium UX**: High-fidelity landing page and public prompt views with integrated social reels.
- **Analytics**: Real-time tracking of views, copies, and email captures.
- **Admin Dashboard**: Full CRUD for prompts, engagement analytics, and brand customization.

## 🛠️ Tech Stack

- **Framework**: Next.js 16 (App Router)
- **Styling**: Tailwind CSS v4
- **Database**: Supabase (PostgreSQL + Auth + Storage)
- **Visualization**: Recharts
- **Validation**: Zod + React Hook Form

## 💻 Local Setup

1. **Clone the repository**
2. **Install dependencies**:
   ```bash
   npm install
   ```
3. **Environment Variables**:
   Copy `.env.local.example` to `.env.local` and fill in your Supabase credentials:
   ```bash
   NEXT_PUBLIC_SUPABASE_URL=your_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_key
   SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
   INSTAGRAM_ACCESS_TOKEN=your_token
   NEXT_PUBLIC_BASE_DOMAIN=localhost:3000
   ```
4. **Database Migration**:
   Run the SQL provided in `supabase/migrations/001_initial_schema.sql` within your Supabase SQL Editor.
5. **Storage Setup**:
   Create a bucket named `media` in Supabase Storage and set it to **Public**.
6. **Seed Data**:
   Initialize the test creator (Milan Ray) and sample prompts:
   ```bash
   npx ts-node scripts/seed.ts
   ```
7. **Run Development Server**:
   ```bash
   npm run dev
   ```

## 🔐 Admin Login (After Seeding)

- **URL**: `http://localhost:3000/login`
- **Email**: `milan@prompthub.app`
- **Password**: `milan123!`

## 🌐 Testing Subdomains Locally

To test the creator hub (e.g., `milan.localhost:3000`), add the following to your `/etc/hosts` file:
```
127.0.0.1 milan.localhost
```

## 🚢 Deployment

1. Connect to **Vercel**.
2. Add your custom domain (e.g., `prompthub.app`).
3. Add a **Wildcard Domain** (`*.prompthub.app`) in the Vercel dashboard.
4. Set `NEXT_PUBLIC_BASE_DOMAIN=prompthub.app` in your production environment variables.

---

Built with ❤️ for the AI Creator Community.
# creatopedia
# creatopedia
# creatopedia
# creatopedia
# creatopedia
