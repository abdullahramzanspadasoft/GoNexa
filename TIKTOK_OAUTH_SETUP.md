# TikTok OAuth Setup Guide

## Fixing "client_key" Error

This error occurs when your TikTok OAuth client_key is missing, invalid, or misconfigured. Follow these steps to fix it:

## Step 1: Go to TikTok Developer Portal

1. Visit [TikTok for Developers](https://developers.tiktok.com/)
2. Sign in with your TikTok account
3. Navigate to **My Apps** or **Developer Portal**

## Step 2: Create or Access Your App

1. Click **Create App** or select an existing app
2. Fill in the required information:
   - App name
   - App description
   - Category
   - Website URL
3. Submit for review if required

## Step 3: Get Your OAuth Credentials

1. In your app dashboard, go to **Basic Information** or **OAuth 2.0**
2. You'll find:
   - **Client Key** (also called App ID) - This is your `TIKTOK_CLIENT_KEY`
   - **Client Secret** - This is your `TIKTOK_CLIENT_SECRET`

## Step 4: Configure Redirect URI

1. In your app settings, find **Redirect URI** or **Callback URL**
2. Add the following redirect URIs:
   - For development: `http://localhost:3000/auth/tiktok/callback`
   - For production: `https://yourdomain.com/auth/tiktok/callback`
3. **Important**: The redirect URI must match EXACTLY what you configure in your environment variables

## Step 5: Configure Environment Variables

Add these to your `.env` or `.env.local` file:

```env
# TikTok OAuth Configuration
TIKTOK_CLIENT_KEY=your-client-key-here
TIKTOK_CLIENT_SECRET=your-client-secret-here
TIKTOK_REDIRECT_URI=http://localhost:3000/auth/tiktok/callback

# Required for redirect URI generation
NEXTAUTH_URL=http://localhost:3000
```

**Example with your client key:**
```env
TIKTOK_CLIENT_KEY=6j37m7mgcto6r
TIKTOK_CLIENT_SECRET=your-actual-client-secret-here
TIKTOK_REDIRECT_URI=http://localhost:3000/auth/tiktok/callback
NEXTAUTH_URL=http://localhost:3000
```

## Step 6: Verify Your Configuration

1. Make sure there are **no extra spaces** in your environment variables
2. The `client_key` should be alphanumeric (no special characters)
3. The redirect URI in TikTok Developer Portal must match exactly with `TIKTOK_REDIRECT_URI`

## Step 7: Restart Your Development Server

After updating your `.env` file:

```bash
npm run dev
```

## Common Issues and Solutions

### Issue: "client_key" error persists

**Solutions:**
1. **Verify the client_key is correct:**
   - Double-check the client_key in TikTok Developer Portal
   - Make sure there are no extra spaces or quotes in your `.env` file
   - The client_key should match exactly (case-sensitive)

2. **Check redirect URI mismatch:**
   - The redirect URI in TikTok Developer Portal must match your `TIKTOK_REDIRECT_URI`
   - Common mistake: missing trailing slash or protocol mismatch
   - For localhost: must be `http://localhost:3000/auth/tiktok/callback` (not `https://`)

3. **Verify client_secret:**
   - Make sure `TIKTOK_CLIENT_SECRET` is set
   - The client_secret is required for token exchange

4. **Check app status:**
   - Ensure your TikTok app is approved and active
   - Some features require app review before they work

### Issue: "Redirect URI mismatch"

**Solution:**
- Go to TikTok Developer Portal > Your App > OAuth 2.0 settings
- Add the exact redirect URI: `http://localhost:3000/auth/tiktok/callback`
- Make sure it matches your `TIKTOK_REDIRECT_URI` environment variable exactly

### Issue: "Invalid client_key format"

**Solution:**
- TikTok client keys are alphanumeric strings
- Remove any special characters, spaces, or quotes
- Example format: `6j37m7mgcto6r`

### Issue: Token exchange fails

**Solutions:**
1. Verify both `TIKTOK_CLIENT_KEY` and `TIKTOK_CLIENT_SECRET` are set correctly
2. Check that your app has the required permissions/scopes
3. Ensure your app is not in sandbox mode (if it is, only test users can authenticate)

## Required Scopes

The app uses the following TikTok OAuth scopes:
- `user.info.basic` - To get user profile information

Make sure these scopes are enabled in your TikTok app settings.

## Production Deployment

For production:

1. Update your environment variables:
   ```env
   TIKTOK_CLIENT_KEY=your-production-client-key
   TIKTOK_CLIENT_SECRET=your-production-client-secret
   TIKTOK_REDIRECT_URI=https://yourdomain.com/auth/tiktok/callback
   NEXTAUTH_URL=https://yourdomain.com
   ```

2. Add the production redirect URI in TikTok Developer Portal:
   - `https://yourdomain.com/auth/tiktok/callback`

3. Make sure your production app is approved by TikTok

## Testing

After configuration:

1. Go to your dashboard
2. Click "Connect" on TikTok
3. You should be redirected to TikTok for authorization
4. After authorizing, you'll be redirected back to your dashboard

If you still see errors, check:
- Browser console for detailed error messages
- Server logs for OAuth flow errors
- TikTok Developer Portal for app status

## Need Help?

- [TikTok Developer Documentation](https://developers.tiktok.com/doc/)
- [TikTok OAuth 2.0 Guide](https://developers.tiktok.com/doc/oauth2-overview/)
