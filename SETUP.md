# Crit Agenda: accounts and setup

Do these in order. Steps 1 and 2 put the app on your iPhone. Step 3 is for the database and login later.
You never need to send anyone a password. Sign in yourself, and send only the things listed under "Send me".

## 1. GitHub (stores the code, free)

1. Create an account: https://github.com/signup
2. Create an empty **private** repository: https://github.com/new
   - Name: `crit-agenda`
   - Do NOT tick "Add a README", ".gitignore" or a licence.
3. **Send me:** the repository address, like `https://github.com/YOUR-NAME/crit-agenda`.

I will connect this folder to it and push. A GitHub sign-in window opens on your computer; sign in there.

## 2. Cloudflare Pages (puts the app online, free)

1. Create an account: https://dash.cloudflare.com/sign-up
2. In the dashboard: **Workers & Pages** > **Create** > **Pages** > **Connect to Git**.
3. Allow Cloudflare to see your `crit-agenda` repository and select it.
4. Build settings:
   - Framework preset: **Vite** (or "None")
   - Build command: `npm run build`
   - Build output directory: `dist`
   - Environment variable: `NODE_VERSION` = `22`
5. Press **Save and Deploy**. After about a minute you get an address like `https://crit-agenda.pages.dev`.
6. **Send me:** that address.

If the dashboard shows "Workers" only and no "Pages" option, tell me what you see and I'll adjust.

### Put it on your iPhone

1. Open the `.pages.dev` address in **Safari** (not Chrome).
2. Tap **Share** > **Add to Home Screen** > **Add**.
3. Open the app from the new icon.

Important: the Home Screen app has its own storage, separate from Safari. Use only the Home Screen app for real data.
Until the database is connected, data lives on that phone only. Use **Notifications > Your data > Export a backup** now and then.

## 3. Supabase (database and login, free tier), do this after steps 1 and 2 work

1. Create an account (signing in with GitHub is easiest): https://supabase.com/dashboard/sign-up
2. **New project**: https://supabase.com/dashboard/new
   - Name: `crit-agenda`
   - Database password: let it generate one and **save it in a password manager. Do not send it to anyone.**
   - Region: the one closest to you.
3. When the project is ready, open **Project Settings** > **API** (the menu names may differ slightly).
4. **Send me two things:**
   - **Project URL** (looks like `https://abcdxyz.supabase.co`)
   - **Publishable key** (older name: `anon` key). It is meant to be public.
5. **Never send:** the database password, the `service_role` key, or the `secret` key. Those stay private.

After I add login, you will turn off public signups in **Authentication** so only you can use the app. I'll walk you through it.

## 4. Push notifications (later)

I generate the push keys on your computer. You paste the private one into Supabase's secret settings yourself.
It never goes into the code or the chat.

---

## Run it on your computer

```
npm install
npm run dev        # development, opens at http://localhost:5173
npm run build      # production build into dist/
npm run preview    # serve the production build locally
```

The original single-file prototype is in `prototype/planner.html`.
