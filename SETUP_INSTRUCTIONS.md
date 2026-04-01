# Code Royale - Setup Instructions

## ✅ Frontend Setup (Already Done)
- React + Vite
- Running on http://localhost:3000
- Environment: `.env.local` configured with GAS API URL

## ⚠️ Backend Setup (REQUIRED - You Must Do This!)

### Step 1: Get Your Google Apps Script Deployment URL

1. Open your **Google Sheet** where you want the data stored
2. Click **Extensions → Apps Script**
3. You should see the script editor with the code
4. Click the **Deploy** button (top right)
5. Click **Manage Deployments** (or create new if none exists)
6. If no deployment exists:
   - Click **Create Deployment**
   - Select **Type: Web app**
   - Click **Deploy**
7. Copy the deployment URL (example: `https://script.google.com/macros/s/ABC123XYZ/exec`)

### Step 2: Update Frontend .env.local

Replace the VITE_API_URL in `.env.local` with your actual deployment URL:

```bash
VITE_API_URL=https://script.google.com/macros/s/YOUR_ACTUAL_SCRIPT_ID/exec
```

**IMPORTANT**: Use `/exec` NOT `/dev`

### Step 3: Redeploy After Code Changes

Every time you update `google-apps-script.js`, you MUST redeploy:

1. In Google Apps Script editor, click **Deploy**
2. Click **Manage Deployments**
3. Click the pencil icon on existing deployment
4. Delete and create a new deployment
5. Copy the new URL
6. Update `.env.local` if the URL changed

### Step 4: Restart Frontend Dev Server

After updating `.env.local`, restart the dev server:
```bash
npm run dev
```

### Step 5: Test

1. Open http://localhost:3000
2. Open **DevTools (F12)** → **Console**
3. Click **Settings button (⚙️)** → **Admin card**
4. Check console for logs showing:
   - `API_BASE loaded: https://script.google.com/macros/s/.../exec`
   - `API Request: POST to /exec`
   - Response status and data

---

## ❌ Common Issues

### "Failed to fetch" Error
- **Cause**: Wrong deployment URL or GAS not deployed
- **Fix**: Verify you're using `/exec` endpoint and redeploy GAS

### Empty console logs
- **Cause**: .env.local not loaded
- **Fix**: Restart dev server after editing .env.local

### 404 or "Not Found"
- **Cause**: Google Apps Script hasn't been deployed
- **Fix**: Deploy from Apps Script editor (see Step 1)

---

## 🔗 Deployment URLs Format

✅ **CORRECT** (for deployed web apps):
```
https://script.google.com/macros/s/AKfycbY...Xyz/exec
```

❌ **WRONG** (won't work for frontend):
```
https://script.google.com/macros/s/AKfycbY...Xyz/dev
https://script.google.com/macros/d/PROJECT_ID/usercallable
```

---

## 📝 Troubleshooting Checklist

- [ ] Google Apps Script deployed (has `/exec` URL)
- [ ] `.env.local` has correct `/exec` URL (not `/dev`)
- [ ] Dev server restarted after `.env.local` change
- [ ] Console shows correct `API_BASE` value
- [ ] No CORS errors in console

If still stuck, open DevTools Console and try:
```javascript
// In browser console
await fetch('https://script.google.com/macros/s/YOUR_URL/exec?action=ping')
  .then(r => r.json())
  .then(d => console.log(d))
  .catch(e => console.error(e))
```

If this fails, your GAS deployment URL is wrong or not deployed.
