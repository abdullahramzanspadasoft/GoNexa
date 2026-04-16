# LinkedIn Redirect URLs Check

## Current URLs in LinkedIn Developer Portal:
1. `http://localhost:3000/auth/callback/auths`
2. `http://localhost:3000/auth/callback`

## Code Analysis:

### Main Callback Route (Currently Used):
- **File**: `/src/app/auth/callback/route.ts`
- **URL**: `http://localhost:3000/auth/callback`
- **Used by**: `/api/linkedin/connect/route.ts` (default)

### Alternative Callback Route:
- **File**: `/src/app/auth/callback/auths/route.ts`
- **URL**: `http://localhost:3000/auth/callback/auths`
- **Used by**: Only if `LINKEDIN_REDIRECT_URI` is explicitly set to this URL

## Recommendation:

**Use ONLY**: `http://localhost:3000/auth/callback`

### Steps to Fix:

1. **In LinkedIn Developer Portal:**
   - Keep: `http://localhost:3000/auth/callback` ✅
   - Remove: `http://localhost:3000/auth/callback/auths` ❌ (if not needed)

2. **In your `.env` file:**
   ```env
   LINKEDIN_REDIRECT_URI=http://localhost:3000/auth/callback
   ```

3. **Or leave it empty** - code will use `/auth/callback` by default

## Why This Matters:

LinkedIn requires the redirect URI in the authorization request to match EXACTLY with one of the URLs in Developer Portal. If they don't match, you'll get the error:
> "The redirect_uri does not match the registered value"

## Current Code Behavior:

- If `LINKEDIN_REDIRECT_URI` is set → uses that value
- If `LINKEDIN_REDIRECT_URI` is NOT set → defaults to `http://localhost:3000/auth/callback`

## Solution:

**Option 1 (Recommended)**: Use only `/auth/callback`
- Remove `/auth/callback/auths` from LinkedIn Developer Portal
- Keep only: `http://localhost:3000/auth/callback`

**Option 2**: Keep both URLs
- Keep both URLs in LinkedIn Developer Portal
- Set `LINKEDIN_REDIRECT_URI=http://localhost:3000/auth/callback` in `.env`
- This ensures the code uses the correct one
