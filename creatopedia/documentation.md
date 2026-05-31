# PromptHub Platform Documentation

Welcome to **PromptHub**, a premium, full-featured platform designed for AI content creators to deliver high-performing prompts (Midjourney, Runway, Claude, ChatGPT, etc.) directly to their audience.

This document serves as the comprehensive user and administrator guide for using PromptHub, highlighting its complete architecture, functionalities, and step-by-step user workflows.

---

## 🚀 System Overview

PromptHub bridges the gap between creators on platforms like Instagram/TikTok and their viewers by providing a branded, lightning-fast, mobile-first experience. Creators share customized short links (e.g., `milan.prompthub.app/creative-writing`) that direct users to beautiful, conversion-optimized landing pages.

### Core Architecture
- **Framework:** Next.js (App Router)
- **Styling:** Tailwind CSS (Custom visual design system)
- **Database & Backend:** Supabase (PostgreSQL, Real-Time Analytics, Auth, Storage)
- **Third-Party Integrations:** Instagram OAuth, Meta APIs, and PostHog Events tracking

---

## 📁 Repository Structure & Key Files

Understanding the file structure helps you locate specific features and understand the overall routing of PromptHub:

```
prompthub/
├── app/
│   ├── (admin)/
│   │   ├── admin/
│   │   │   ├── ads/                # Ad placements & campaign management
│   │   │   ├── analytics/          # Dashboards, conversion tables & charts
│   │   │   ├── categories/         # Create & organize categories
│   │   │   ├── prompts/            # Manage prompt CRUD
│   │   │   └── settings/           # Personalize profile, theme colors & Instagram settings
│   ├── (public)/
│   │   └── [subdomain]/
│   │       ├── [slug]/             # Public view of individual prompts
│   │       └── page.tsx            # Creator profile hub & prompt directory
│   ├── api/                        # Backend REST endpoints for ingestion
│   ├── login/                      # Admin login workflow
│   ├── terms/                      # Terms and Conditions page
│   └── privacy-policy/             # Privacy Policy page for OAuth compliance
├── components/
│   ├── admin/                      # Form controls, Sidebar, Category Manager, etc.
│   └── public/                     # CreatorBar, PromptGate, VideoEmbed, AdBanner
├── docs/                           # Internal implementation plans & schema
├── lib/                            # Supabase clients & utility functions
└── supabase/
    └── migrations/                 # PostgreSQL schema migrations
```

---

## 🛠️ Main Functionalities

### 1. Advanced Creator Profiles & Hub
Every creator has a dedicated subdomain/handle that generates their personalized public directory.
- **Customization:** Add creator avatar, name, bio, social media URLs (Instagram, TikTok), and accent colors.
- **Dynamic Content Feed:** View creator's prompt collections, categorized neatly with custom filters.
- **Instagram Profile Card:** Connect and display direct live feeds from Instagram via official Meta oEmbed integrations.

### 2. Full-Featured Prompt Management
The Admin Panel features a comprehensive, non-intrusive prompt management system:
- **Rich Prompt Fields:** Enter prompt title, customizable slug, full instructional text, and description.
- **Categorization:** Create and assign prompts to unique categories to help your audience discover content faster.
- **Multi-Media Content Uploads:** Attach custom image thumbnails or directly host PDFs via integrated file upload storage.
- **Reel & Video Embeds:** Insert URLs to Instagram or TikTok videos, automatically rendered directly within public prompt views.
- **AI Specific Meta Tags:** Assign custom tags for AI tool (e.g., Midjourney, Claude, ChatGPT, Runway, Pika, etc.) and Output Type (e.g., image, video, text, code).

### 3. Smart Prompt Access Controls (Gating)
Monetize and convert visitors by adjusting the **Gate Type** for each individual prompt:
- **Open Access:** Audience can view and use prompt text and details instantly.
- **Email Access:** Blurs content and prompts the visitor to submit their email address to unlock the full text. Ideal for building direct email subscriber lists.
- **Payment Access (Paid prompts):** Blurs prompt content, showing a payment wall (Phase 2 Stripe integration stub).

### 4. Advanced Ad Placement System
Sponsor your pages and monetize directly with customized programmatic banner advertisements:
- **Campaign Controls:** Setup campaigns with custom images, links, title overlays, call-to-actions, and view trackers.
- **Multiple Placement Options:** Automatically mount ads in dedicated zones: `Above Prompt`, `Below Prompt`, `Popup Modal`, and `Creator Page`.
- **Targeting and Scheduling:** Restrict ads to specific active dates or enable globally across all creator prompts.

### 5. Seamless Instagram Workflow & Automation
Speed up prompt creation and engagement by utilizing existing Instagram content:
- **Meta OAuth Connection:** Easily authenticate your Instagram business or creator profile via your settings page.
- **Automated Metadata Extraction:** Use the `Pick from Instagram` button when creating prompts. Select any post from your active Instagram media grid to automatically populate the prompt title, video embed, and description fields.

### 6. Analytics & Performance Tracking
Keep an eye on conversion rates and overall performance via the integrated insights engine:
- **Real-Time Visualizations:** Dynamic metrics for daily page views, click-through rates, and exact copy actions.
- **Email Ingestion:** View and export all leads and email captures directly from your admin panel.
- **Engagement Conversion Metrics:** Track exactly which prompts are getting high views-to-copies conversions.

---

## 👤 How Users are Going to Use This Software

### For Visitors (End-Users / Content Seekers)

#### 1. Discovery
- Visitors click links from Instagram Reels, TikTok descriptions, or open the direct creator profile URL (e.g., `https://milan.prompthub.app`).
- They can browse the creator's gallery, search for specific phrases, or filter via custom categories.

#### 2. Unlock/Use
- When clicking a prompt card, visitors land on the dedicated prompt detail page.
- **Unlocking content:** If the prompt is gated behind an email prompt, visitors enter their email address. This automatically updates the page to reveal the full high-fidelity prompt.
- **Direct Usage:** Visitors click the **"Copy Prompt"** button, which copies the prompt text to their clipboard. This enables them to paste it directly into AI engines (e.g., Midjourney, ChatGPT, Claude).

#### 3. Interacting with Extras
- Visitors can watch embedded Reels or short-form videos describing how the prompt was constructed or its results.
- They can view and read through attached PDFs or images for complete tutorials and instructions.

---

### For AI Content Creators (Administrators)

#### Step 1: Initialize Your Workspace
1. **Login:** Direct your browser to `/login` and sign in with your email and password.
2. **Profile Creation:** Go to **Settings** to set up your name, handle, profile picture, social URLs, and brand color. Your brand color will dynamically theme your public profile.

#### Step 2: Connect Socials (Optional but Recommended)
1. In your **Control Center**, locate the **Instagram Settings** tab.
2. Click **Connect Instagram** to authorize Meta permissions. Once connected, your latest post feed will instantly preview directly in your dashboard.

#### Step 3: Organize Your Offerings
1. Navigate to **Categories** from the dashboard sidebar.
2. Create new categories specific to your niche (e.g., *Photography*, *Copywriting*, *Social Media Marketing*).

#### Step 4: Post New Prompts
1. Click the **"New Prompt"** button to trigger the prompt editor.
2. **Instagram Boost (Optional):** Click `Select from Instagram` to automatically fill in details using a previous post's caption and URL.
3. **Manual Entry:** Fill out your prompt title, assign a category, insert your actual AI instructions, and attach dynamic tags (AI Tool, Output Type).
4. **Choose Access Model:** Set your access type to either `Open` or `Email Gated`.
5. **Publish:** Set your prompt to `Published` and save. It is instantly discoverable on your public profile.

#### Step 5: Monetize with Ads
1. Go to **Ads** from the sidebar to register a new Ad Client.
2. Create an **Ad Campaign** under that client. Upload a beautiful thumbnail, include a call-to-action link, choose active dates, and pick its display zone (e.g., `Above Prompt`).
3. Your advertisement will immediately go live on the designated pages.

#### Step 6: Review Performance
1. Visit the **Analytics** page to monitor how many visits your creator profile or prompts have received.
2. View detailed insights showing copies, unlocks, and direct conversions.
3. Review your newly generated email leads from the dashboard's email ingest table.

---

Built to provide maximum aesthetic appeal, modern visual polish, and performance for the AI creator economy.
