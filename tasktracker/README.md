# Task Tracker — Setup Guide

## What you need
- A free Supabase account: https://supabase.com
- A free Netlify account: https://netlify.com

---

## Step 1 — Supabase: create your project

1. Go to https://supabase.com and sign in
2. Click **New project**, give it a name (e.g. "task-tracker"), pick a region close to Australia
3. Once it's ready, go to the **SQL Editor** (left sidebar)
4. Paste the entire contents of `supabase_schema.sql` and click **Run**

---

## Step 2 — Supabase: get your API keys

1. Go to **Project Settings → API** (gear icon in sidebar)
2. Copy your **Project URL** (looks like `https://abcdefg.supabase.co`)
3. Copy your **anon / public** key (long string under "Project API keys")

---

## Step 3 — Add your keys to the app

Open `js/config.js` and replace the two placeholder values:

```js
const SUPABASE_URL = 'https://YOUR_PROJECT_ID.supabase.co';  // ← paste here
const SUPABASE_ANON_KEY = 'YOUR_ANON_KEY';                   // ← paste here
```

---

## Step 4 — Supabase: enable magic link auth

1. Go to **Authentication → Providers** in Supabase
2. Make sure **Email** is enabled (it is by default)
3. Go to **Authentication → URL Configuration**
4. Add your Netlify URL to **Redirect URLs** once you have it (step 6 below)
   - Format: `https://your-site-name.netlify.app`

---

## Step 5 — Deploy to Netlify

**Option A — Drag and drop (easiest):**
1. Go to https://app.netlify.com
2. Drag the entire `tasktracker` folder onto the Netlify dashboard
3. Your site goes live instantly with a URL like `https://quirky-name-123.netlify.app`

**Option B — GitHub (recommended for updates):**
1. Push this folder to a GitHub repo
2. In Netlify: New site → Import from Git → select your repo
3. No build command needed, publish directory is `.` (root)
4. Click Deploy

---

## Step 6 — Final: add your Netlify URL to Supabase

1. Copy your live Netlify URL (e.g. `https://your-site.netlify.app`)
2. Go to Supabase → **Authentication → URL Configuration**
3. Add it under **Redirect URLs**
4. Also set it as the **Site URL**

That's it — visit your Netlify URL, enter your email, and you'll get a magic link. ✓

---

## Files in this project

```
tasktracker/
├── index.html          # App shell
├── netlify.toml        # Netlify routing config
├── supabase_schema.sql # Run this in Supabase SQL editor
├── css/
│   └── style.css       # All styles
└── js/
    ├── config.js       # ← Put your Supabase keys here
    └── app.js          # All app logic
```
