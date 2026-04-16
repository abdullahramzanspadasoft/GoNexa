# LinkedIn OAuth Redirect URI Fix - FINAL SOLUTION

## Problem:
Error: "The redirect_uri does not match the registered value"
- URL shows: `redirect_uri=http://localhost:3000` (WRONG - missing `/auth/callback`)
- Should be: `redirect_uri=http://localhost:3000/auth/callback` (CORRECT)

## Solution:

### Step 1: Check Your `.env.local` or `.env` File

Make sure you have this EXACT line:
```env
LINKEDIN_REDIRECT_URI=http://localhost:3000/auth/callback
```

**IMPORTANT:**
- ✅ CORRECT: `http://localhost:3000/auth/callback`
- ❌ WRONG: `http://localhost:3000` (missing path)
- ❌ WRONG: `http://localhost:3000/` (trailing slash)
- ❌ WRONG: `http://localhost:3000/auth/callback/` (trailing slash)

### Step 2: LinkedIn Developer Portal

Go to [LinkedIn Developer Portal](https://www.linkedin.com/developers/apps) → Your App → Auth tab

**Add this EXACT URL:**
```
http://localhost:3000/auth/callback
```

**Remove these if they exist:**
- `http://localhost:3000` (wrong - no path)
- `http://localhost:3000/auth/callback/auths` (if not needed)

### Step 3: Restart Your Server

After updating `.env.local`:
```bash
# Stop the server (Ctrl+C)
# Then restart:
npm run dev
```

### Step 4: Test Again

Try connecting LinkedIn again. The redirect URI should now be:
```
http://localhost:3000/auth/callback
```

## Code Fix Applied:

The code now automatically fixes common mistakes:
- If `LINKEDIN_REDIRECT_URI` is set to just `http://localhost:3000`, it will add `/auth/callback`
- If it's missing, it defaults to `http://localhost:3000/auth/callback`

## Verification:

Check your server console logs. You should see:
```
LinkedIn OAuth Configuration: {
  redirectUri: "http://localhost:3000/auth/callback",
  ...
}
```

If you see `http://localhost:3000` (without path), your `.env.local` file has the wrong value!

## Still Not Working?

1. **Check `.env.local` file** - Make sure it has:
   ```env
   LINKEDIN_REDIRECT_URI=http://localhost:3000/auth/callback
   ```

2. **Check LinkedIn Developer Portal** - Make sure this EXACT URL is added:
   ```
   http://localhost:3000/auth/callback
   ```

3. **Clear browser cache** - Sometimes old redirect URIs are cached

4. **Check server logs** - Look for the exact redirect URI being used
