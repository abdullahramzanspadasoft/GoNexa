# LinkedIn OAuth Redirect URI Fix

## Problem
Error: "The redirect_uri does not match the registered value"

## Solution

### Step 1: Check Your Environment Variables

Make sure your `.env` file has:
```env
NEXTAUTH_URL=http://localhost:3000
LINKEDIN_CLIENT_ID=your-linkedin-client-id
LINKEDIN_CLIENT_SECRET=your-linkedin-client-secret
LINKEDIN_REDIRECT_URI=http://localhost:3000/auth/callback
```

**Important Notes:**
- No trailing slash in redirect URI
- Use `http://` for localhost, `https://` for production
- Must match EXACTLY what's in LinkedIn Developer Portal

### Step 2: Add Redirect URI in LinkedIn Developer Portal

1. Go to [LinkedIn Developer Portal](https://www.linkedin.com/developers/apps)
2. Select your app
3. Go to **Auth** tab
4. Under **Authorized redirect URLs for your app**, add:
   - For localhost: `http://localhost:3000/auth/callback`
   - For production: `https://yourdomain.com/auth/callback`

**Critical:** The redirect URI must match EXACTLY:
- ✅ `http://localhost:3000/auth/callback` (correct)
- ❌ `http://localhost:3000/auth/callback/` (wrong - trailing slash)
- ❌ `https://localhost:3000/auth/callback` (wrong - https for localhost)
- ❌ `http://localhost:3000/auth/callbacks` (wrong - different path)

### Step 3: Verify Your Configuration

After updating, check the console logs when connecting. You should see:
```
LinkedIn OAuth Configuration: {
  clientId: "...",
  redirectUri: "http://localhost:3000/auth/callback",
  baseUrl: "http://localhost:3000"
}
```

### Step 4: Common Issues

1. **Trailing Slash**: Remove any trailing slash from redirect URI
2. **Protocol Mismatch**: Use `http://` for localhost, not `https://`
3. **Port Mismatch**: Make sure port matches (usually 3000)
4. **Path Mismatch**: Must be exactly `/auth/callback`

### Step 5: Test

1. Restart your development server
2. Try connecting LinkedIn again
3. Check browser console and server logs for any errors

## Production Setup

For production, update your environment variables:
```env
NEXTAUTH_URL=https://yourdomain.com
LINKEDIN_REDIRECT_URI=https://yourdomain.com/auth/callback
```

And add the production URL to LinkedIn Developer Portal.
