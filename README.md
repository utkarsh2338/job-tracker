# 💼 JobTrack — Career Pipeline Intelligence

An editorial-grade, full-stack job application tracker built with **Next.js 14+ (App Router)**, **TypeScript**, **Prisma ORM**, **Tailwind CSS**, and **Framer Motion**. Designed for professionals seeking complete clarity, speed, and elegance in managing their career search.

![JobTrack Banner](https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?q=80&w=2070&auto=format&fit=crop)

---

## 🌟 Key Features

### 1. Unified Applications Table & Multifaceted Filters
- **Instant Search**: Real-time filtering across company names, job titles, and private notes.
- **Multifaceted Filters**: Filter by Stage (*Applied*, *Screening*, *Interviewing*, *Offer*, *Rejected*, *Archived*), Work Arrangement (*Remote*, *Hybrid*, *On-site*), and custom Tags.
- **Dynamic Sorting**: Sort by Applied Date, Company Name, Role Title, Compensation, or Stage.
- **Inline Stage Selector**: Shift stages directly with single-click dropdowns.

### 2. Drag & Drop Kanban Pipeline (`dnd-kit`)
- Visual multi-column stage management powered by `@dnd-kit`.
- Optimistic drag-and-drop updates with real-time database persistence.
- Automatic timeline event logging whenever a candidate moves across pipeline columns.
- Rewarding celebration confetti burst upon reaching the **Offer** stage.

### 3. 360° Application Detail Drawer
- **Activity Timeline**: Chronological log of screenings, technical loops, follow-ups, and custom notes.
- **Interview Hub**: Track upcoming rounds, interviewers, meeting URLs (Zoom/Google Meet), and completion statuses.
- **Recruiter Directory**: Store recruiter/hiring manager names, emails, and roles.
- **Attachments & Links**: Store references to resume versions, tailored cover letters, portfolios, and offer letters.

### 4. Interview Calendar & Day Agenda
- Monthly calendar grid highlighting scheduled interview rounds and urgent follow-up deadlines.
- Day Agenda view with quick launchers for video meeting links and completion toggles.
- Follow-up reminder badges for recruiter outreach.

### 5. Conversion Funnel & Analytics Suite (`Recharts`)
- **Stage Conversion Funnel**: Track drop-off rates across *Applied* ➔ *Screening* ➔ *Interviewing* ➔ *Offer*.
- **Weekly Volume Tracker**: Area chart showing application cadence over time.
- **Work Arrangement Breakdown**: Donut chart distribution of Remote vs. Hybrid vs. On-site applications.
- **Compensation Bracket Analysis**: Bar chart breakdown of target vs. offered salary tiers.

### 6. CSV Hub & Data Management
- **One-Click Export**: Export your complete application portfolio to standard CSV.
- **Drag-and-Drop CSV Import**: Bulk import roles with intelligent column mapping and duplicate prevention.
- **Tag Manager**: Create custom colored tags to organize applications by priorities (e.g. *Dream Job*, *Fintech*, *AI / ML*).

### 7. Global Command Palette (`Cmd+K` / `Ctrl+K`)
- Trigger anywhere via `Cmd+K` or `/`.
- Instant search across all tracked applications.
- Quick view switching, new application creation, and Dark/Light theme toggles.

---

## 🛠️ Technology Stack

| Layer | Technology |
| :--- | :--- |
| **Framework** | [Next.js 14+ (App Router)](https://nextjs.org/) |
| **Language** | [TypeScript](https://www.typescriptlang.org/) |
| **Database & ORM** | [Prisma ORM](https://www.prisma.io/) with SQLite (`file:./dev.db`) / PostgreSQL ready |
| **Styling** | [Tailwind CSS](https://tailwindcss.com/) with Luxury Editorial Tokens |
| **UI Primitives** | [Radix UI](https://www.radix-ui.com/) + [shadcn/ui](https://ui.shadcn.com/) |
| **Icons** | [Lucide React](https://lucide.dev/) |
| **Drag & Drop** | [@dnd-kit/core](https://dndkit.com/) |
| **Charts** | [Recharts](https://recharts.org/) |
| **Animations** | [Framer Motion](https://www.framer.com/motion/) + `canvas-confetti` |
| **Form & Validation** | [React Hook Form](https://react-hook-form.com/) + [Zod](https://zod.dev/) |
| **Date Utilities** | [date-fns](https://date-fns.org/) |

---

## 📁 Project Architecture

```
job-tracker/
├── app/
│   ├── actions/                  # Next.js Server Actions (Mutations)
│   │   ├── applications.ts       # Application CRUD, tags, timeline, interviews
│   │   └── data-management.ts    # CSV import/export and database actions
│   ├── analytics/page.tsx        # Analytics & Conversion Funnel page
│   ├── board/page.tsx            # Dedicated Kanban Board page
│   ├── calendar/page.tsx         # Interview Calendar page
│   ├── settings/page.tsx         # CSV Hub & Tag Management page
│   ├── globals.css               # Editorial luxury theme design tokens
│   ├── layout.tsx                # Root layout with fonts & ThemeProvider
│   └── page.tsx                  # Main Dashboard Server Component
├── components/
│   ├── analytics/                # Recharts visualizations
│   ├── applications/             # Table, 360° Drawer, Form Modal, Delete Dialog
│   ├── board/                    # dnd-kit Kanban Board & Column components
│   ├── calendar/                 # Calendar grid & day agenda
│   ├── common/                   # Command Palette, Company Avatar, Stat Cards
│   ├── layout/                   # Responsive Sidebar & Sticky Header
│   ├── settings/                 # CSV importer/exporter & tag editor
│   └── ui/                       # Radix UI primitives (Dialog, Select, Tabs, etc.)
├── lib/
│   ├── data.ts                   # Server-side data fetching queries
│   ├── prisma.ts                 # Prisma Client singleton
│   ├── schemas.ts                # Zod schemas for input validation
│   ├── types.ts                  # TypeScript interfaces and relations
│   └── utils.ts                  # Helpers, formatting, status colors, logo mappings
└── prisma/
    ├── schema.prisma             # Relational SQLite/Postgres schema
    └── seed.ts                   # Starter tag setup script
```

---

## 🚀 Getting Started

### 1. Prerequisites
- **Node.js**: `v18.17.0` or higher
- **npm** / **yarn** / **pnpm**

### 2. Installation
```bash
# Clone the repository
git clone https://github.com/your-username/job-tracker.git
cd job-tracker

# Install dependencies
npm install
```

### 3. Database Initialization
```bash
# Generate Prisma Client & apply migrations
npx prisma migrate dev --name init

# Initialize default starter tags
npm run prisma:seed
```

### 4. Run Development Server
```bash
npm run dev
```
Visit **[http://localhost:3000](http://localhost:3000)** in your browser.

---

## ⌨️ Keyboard Shortcuts

| Shortcut | Action |
| :--- | :--- |
| `Cmd + K` / `Ctrl + K` | Open Global Command Palette |
| `/` | Focus search bar / command bar |
| `Esc` | Close any open Drawer or Modal |

---

## 🌐 Production Deployment

### Option A: Deploy on Vercel (Recommended with PostgreSQL)

1. Push your repository to **GitHub**.
2. Go to [Vercel](https://vercel.com) and import your GitHub repository.
3. Attach a Postgres database (e.g. **Vercel Postgres**, **Supabase**, or **Neon**):
   - In `prisma/schema.prisma`, update datasource provider from `sqlite` to `postgresql`:
     ```prisma
     datasource db {
       provider = "postgresql"
       url      = env("DATABASE_URL")
     }
     ```
4. Set your `DATABASE_URL` environment variable in Vercel.
5. In your Build Command or post-install script, run:
   ```bash
   npx prisma migrate deploy
   ```
6. Click **Deploy**.

---

### Option B: Deploy on Railway / Render / Fly.io / VPS (with SQLite)

If hosting on a persistent virtual server or container with volume mounts:
```bash
# 1. Build Next.js production bundle
npm run build

# 2. Run database migrations
npx prisma migrate deploy

# 3. Start production server
npm start
```

---

## 📄 License

This project is licensed under the MIT License — feel free to use it for your personal career tracking or customize it for your portfolio.
