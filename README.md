# EduPath SA

> **Your marks. Your options. Your future.**
> AI-Powered Education and Career Pathway Platform for South African Students

---

## Overview

EduPath SA is a full-stack web application built with **React + Vite** and **Supabase**, featuring **Google Gemini AI** for personalised study pathway recommendations. It guides South African learners from school through to higher education and beyond.

---

## Features

| Module | Description |
|---|---|
| **AI Pathway Advisor** | Enter school subjects and marks → Google Gemini analyses your profile and recommends degrees, diplomas, TVET programmes and alternative routes |
| **Application Tracker** | Track applications to universities and TVET colleges with status, deadlines and document checklists |
| **Funding & NSFAS Directory** | Browse and bookmark bursaries, scholarships and NSFAS guidance with eligibility matching |
| **Study Cost Calculator** | Estimate tuition, accommodation, food, data and other costs; calculate your funding gap |
| **Wellness & Support** | Crisis contacts, counselling services, disability support and student wellbeing tips |
| **Academic Progress** | Set academic goals, track milestones and access free learning resources |

---

## Tech Stack

- **Frontend:** React 18, Vite, Tailwind CSS, React Router v6
- **Backend / Database:** Supabase (PostgreSQL + Row Level Security + Auth)
- **AI:** Google Gemini 1.5 Flash API
- **Icons:** Lucide React
- **Notifications:** react-hot-toast

---

## Setup Instructions

### 1. Prerequisites

- Node.js 18 or later
- A [Supabase](https://supabase.com) account (free tier is sufficient)
- A [Google AI Studio](https://aistudio.google.com) API key for Gemini

### 2. Clone / unzip and install

```bash
cd edupath-sa
npm install
```

### 3. Create your Supabase project

1. Go to [supabase.com](https://supabase.com) and create a new project.
2. In your project dashboard, go to **SQL Editor**.
3. Copy the contents of `supabase/schema.sql` and run it.
   - This creates all tables, RLS policies, triggers and seed data.

### 4. Configure environment variables

```bash
cp .env.example .env
```

Open `.env` and fill in:

```
VITE_SUPABASE_URL=https://your-project-ref.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
VITE_GEMINI_API_KEY=your-gemini-api-key
```

**Where to find these:**
- Supabase URL and anon key: Supabase Dashboard → Settings → API
- Gemini API key: [aistudio.google.com](https://aistudio.google.com) → Get API Key

> ⚠️ **Security note:** For production, move the Gemini API call to a Supabase Edge Function so the key is never exposed in browser code. The current setup is suitable for a student prototype.

### 5. Run the development server

```bash
npm run dev
```

Open [http://localhost:5173](http://localhost:5173)

### 6. Build for production

```bash
npm run build
```

Deploy the `dist/` folder to Vercel, Netlify or any static host.

---

## Supabase Configuration

### Enable email auth

In Supabase Dashboard → Authentication → Providers → Email: make sure Email is enabled.

For development, you can disable email confirmation:
Authentication → Settings → **Disable email confirmations** (optional, for testing only).

### Row Level Security

All tables have RLS enabled. Policies ensure:
- Students can only read/write their own data
- Funding and support resources are publicly readable
- Only admins can manage content

---

## Project Structure

```
src/
├── context/
│   └── AuthContext.jsx          # Supabase auth + profile state
├── lib/
│   ├── supabase.js              # Supabase client
│   └── gemini.js                # Google Gemini AI integration
├── pages/
│   ├── Landing.jsx              # Public landing page
│   ├── Login.jsx
│   ├── Register.jsx
│   ├── Dashboard.jsx            # Student home dashboard
│   ├── PathwayAdvisor.jsx       # 🤖 AI Pathway Advisor (Gemini)
│   ├── ApplicationTracker.jsx  # Application status tracker
│   ├── FundingDirectory.jsx     # Bursaries & NSFAS
│   ├── CostCalculator.jsx       # Study budget calculator
│   ├── WellnessSupport.jsx      # Wellness & crisis support
│   ├── AcademicProgress.jsx     # Goals & learning resources
│   └── Profile.jsx              # User profile
├── components/
│   ├── Layout.jsx               # App shell
│   ├── Sidebar.jsx
│   ├── TopBar.jsx
│   └── Spinner.jsx
├── App.jsx                      # Routes
├── main.jsx
└── index.css                    # Tailwind + custom classes
supabase/
└── schema.sql                   # Full DB schema + seed data
```

---

## Disclaimer

EduPath SA is an educational guidance tool. All AI recommendations and funding eligibility matches are for information purposes only — they are not a guarantee of admission or funding approval. Always verify information against official institution and funder websites.

---

*Built for South African learners · DataFyre AI, Data Engineering & Software Solutions*
