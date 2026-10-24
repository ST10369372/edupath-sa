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
| **AI Pathway Advisor** | Enter marks, preferred province and intended start year → get indicative APS variants, profile evidence, prerequisite gaps, researched sources, and personalised university, diploma, TVET and alternative routes. Report-card autofill runs locally on the device and does not upload the document. |
| **Application Tracker** | Track applications to universities and TVET colleges, plus save, complete and remove pathway next-step tasks |
| **Funding & NSFAS Directory** | Browse and bookmark bursaries, scholarships and NSFAS guidance with eligibility matching |
| **Study Cost Calculator** | Estimate tuition, accommodation, food, data and other costs; calculate your funding gap |
| **Wellness & Support** | Crisis contacts, counselling services, disability support and student wellbeing tips |
| **Academic Progress** | Set academic goals, track milestones and access free learning resources |

---

## Tech Stack

- **Frontend:** React 18, Vite, Tailwind CSS, React Router v6
- **Backend / Database:** Supabase (PostgreSQL + Row Level Security + Auth)
- **AI:** Google Gemini API through an authenticated Supabase Edge Function
- **Icons:** Lucide React
- **Notifications:** react-hot-toast

---

## Setup Instructions

### 1. Prerequisites

- Node.js 22 or later
- A [Supabase](https://supabase.com) account (free tier is sufficient)
- A [Google AI Studio](https://aistudio.google.com) API key for Gemini

### 2. Clone / unzip and install

```bash
cd edupath-sa
npm install
```

### 3. Create and configure your Supabase project

1. Go to [supabase.com](https://supabase.com) and create a new project.
2. In your project dashboard, go to **SQL Editor**.
3. Copy the contents of `supabase/schema.sql` and run it.
   - This creates the tables, Row Level Security policies, signup trigger and starter content used by the app.
   - If you already ran the earlier schema, run `supabase/migrations/20261024000000_pathway_planning.sql` in the SQL Editor to add saved pathways, pathway tasks and their RLS policies.
4. In **Authentication → Providers → Email**, enable email sign-in.

### 4. Configure environment variables

Copy `.env.example` to `.env`, then set the Supabase project URL and publishable (anon) key:

```
VITE_SUPABASE_URL=https://your-project-ref.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

**Where to find these:**
- Supabase URL and anon key: Supabase Dashboard → Settings → API

The Supabase publishable/anon key is intended for browser use; access to student records is restricted by the database's Row Level Security policies. Never put a Supabase service-role/secret key in the app.

### 5. Configure Gemini securely

1. Create a Gemini API key in [Google AI Studio](https://aistudio.google.com).
2. In Supabase Dashboard → **Edge Functions → Secrets**, add a secret named `GEMINI_API_KEY` with the new key. Do not add it to `.env`, Vite variables, or the Android app.
3. Install and sign in to the [Supabase CLI](https://supabase.com/docs/guides/cli):

   ```bash
   npx supabase@latest login
   ```

4. From the project root, link the project and deploy the authenticated function (replace the placeholder with the project reference from the Supabase URL):

   ```bash
   npx supabase@latest link --project-ref your-project-ref
   npx supabase@latest functions deploy gemini
   ```

The app calls this function for pathway recommendations, live funding checks and follow-up questions. Report-card autofill is separate: it uses bundled, on-device OCR and PDF text extraction, so report files are not sent to Gemini. The first OCR scan may take longer while the local recognition engine loads. Pathway research uses Google Search grounding and includes returned research links; learners should still verify admission rules on the official programme page. The function requires a signed-in account; guest mode cannot make Gemini requests. The API key remains on the server rather than inside the web bundle or APK.

### 6. Run the development server

```bash
npm run dev
```

Open [http://localhost:5173](http://localhost:5173)

### 7. Build for production

```bash
npm run build
```

Deploy the `dist/` folder to Vercel, Netlify or any static host.

### 8. Build the Android APK

EduPath SA uses Capacitor to package the web app as an Android application. Install:

- Node.js 22 or later
- Android Studio with the Android SDK and Android platform tools
- JDK 21 (Android Studio can provide its bundled runtime)

Add the Android project once:

```bash
npx cap add android
```

Build the web app and sync it into Android:

```bash
npm run android:sync
```

Then open the Android project in Android Studio:

```bash
npm run android:open
```

In Android Studio, wait for Gradle sync, then choose **Build → Build Bundle(s) / APK(s) → Build APK(s)**. The debug APK is generated under `android/app/build/outputs/apk/debug/`. For sharing outside development, create a signed release APK using **Build → Generate Signed Bundle / APK**.

In the Android app, the system Back button closes the navigation drawer first, then returns to the previous screen. A visible Back button is also available on app subpages and sign-in screens.

The app requires an internet connection for Supabase and Gemini features. Set the Supabase variables in `.env`, configure `GEMINI_API_KEY` as an Edge Function secret, and deploy the function before building the APK.

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
