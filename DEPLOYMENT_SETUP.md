# Auto-Deployment Setup Guide

## Option 1: Vercel (Recommended - Easiest)

### Step 1: Create Vercel Account
1. Go to https://vercel.com
2. Sign up with your GitHub account

### Step 2: Import Your Project
1. In Vercel dashboard, click **"Add New..."** → **"Project"**
2. Select **"Import Git Repository"**
3. Find `kirkelaht/vajangu-orders` and click **"Import"**

### Step 3: Configure Environment Variables
In Vercel project settings, add these environment variables:
- `NEXT_PUBLIC_SUPABASE_URL` = `https://hsyvletganvsdukyerlb.supabase.co`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` = (from your .env.local)
- `SUPABASE_SERVICE_ROLE_KEY` = (from your .env.local)
- `DATABASE_URL` = (from your .env.local)
- `ADMIN_PASSWORD` = `vajangu2025`
- `NEXT_PUBLIC_ADMIN_PASSWORD` = `vajangu2025`
- `MAILERSEND_API_KEY` = (from your .env.local)
- `NODE_ENV` = `production`

### Step 4: Deploy
1. Click **"Deploy"**
2. Vercel will automatically deploy on every push to `main` branch
3. You'll get a deployment URL (e.g., `vajangu-orders.vercel.app`)

### Step 5: Custom Domain (Optional)
- Go to Project Settings → Domains
- Add your custom domain

---

## Option 2: GitHub Actions (Alternative)

If you prefer GitHub Actions instead:

1. **Set up GitHub Secrets:**
   - Go to your GitHub repo: https://github.com/kirkelaht/vajangu-orders
   - Click **Settings** → **Secrets and variables** → **Actions**
   - Add all environment variables as secrets (same names as above)

2. **Workflow is already configured:**
   - File: `.github/workflows/deploy.yml`
   - Automatically runs on every push to `main`
   - You'll need to add deployment steps (e.g., deploy to your server)

---

## What Happens After Setup:

✅ **Every git push to `main`** automatically triggers a new deployment
✅ **Build logs** are visible in your deployment dashboard
✅ **Rollback** to previous deployments if needed
✅ **Preview deployments** for pull requests (if configured)

---

## Quick Start with Vercel:

```bash
# Install Vercel CLI (optional, for local testing)
npm i -g vercel

# Link your project (one-time setup)
vercel login
vercel link

# Or just go to vercel.com and import via web interface (easier!)
```

---

**Recommended**: Use Vercel web interface - it's the easiest way to set up auto-deployment!

