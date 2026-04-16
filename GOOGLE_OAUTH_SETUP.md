# Google OAuth Setup Guide

## Fixing "Error 401: disabled_client"

This error occurs when your Google OAuth client has been disabled in Google Cloud Console. Follow these steps to fix it:

## Step 1: Go to Google Cloud Console

1. Visit [Google Cloud Console](https://console.cloud.google.com/)
2. Select your project (or create a new one if needed)
3. Navigate to **APIs & Services** > **Credentials**

## Step 2: Check Your OAuth 2.0 Client

1. Look for your OAuth 2.0 Client ID in the credentials list
2. If it shows as **DISABLED**, click on it to edit
3. Click **ENABLE** to re-enable the client
4. If the client doesn't exist, create a new one (see Step 3)

## Step 3: Create a New OAuth 2.0 Client (if needed)

1. Click **+ CREATE CREDENTIALS** > **OAuth client ID**
2. If prompted, configure the OAuth consent screen first:
   - Choose **External** (unless you have a Google Workspace)
   - Fill in the required fields:
     - App name: Your app name
     - User support email: Your email
     - Developer contact: Your email
   - Add scopes: `email`, `profile`, `openid`
   - Add test users (if in testing mode)
   - Save and continue

3. Create OAuth Client:
   - Application type: **Web application**
   - Name: Your app name
   - **Authorized JavaScript origins:**
     - `http://localhost:3000` (for development)
     - `https://yourdomain.com` (for production)
   - **Authorized redirect URIs:**
     - `http://localhost:3000/api/auth/callback/google` (for development)
     - `https://yourdomain.com/api/auth/callback/google` (for production)
   - Click **CREATE**

## Step 4: Copy Your Credentials

1. After creating/enabling the OAuth client, you'll see:
   - **Client ID** (starts with something like `123456789-abc...`)
   - **Client secret** (starts with `GOCSPX-...`)

2. Add these to your `.env` or `.env.local` file:

```env
GOOGLE_CLIENT_ID=your-client-id-here
GOOGLE_CLIENT_SECRET=your-client-secret-here
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-random-secret-here
```

## Step 5: Generate NEXTAUTH_SECRET

Run this command to generate a secure secret:

```bash
openssl rand -base64 32
```

Or use an online generator: https://generate-secret.vercel.app/32

## Step 6: Restart Your Development Server

After updating your `.env` file:

```bash
npm run dev
```

## Important Notes

1. **Redirect URI must match exactly**: The redirect URI in Google Cloud Console must match exactly what NextAuth uses: `{NEXTAUTH_URL}/api/auth/callback/google`

2. **For Production**: Make sure to:
   - Add your production domain to authorized origins
   - Add your production callback URL to authorized redirect URIs
   - Update `NEXTAUTH_URL` in your production environment

3. **OAuth Consent Screen**: If your app is in testing mode, only test users can sign in. To allow all users:
   - Go to OAuth consent screen
   - Click **PUBLISH APP**
   - Complete verification if required

## Troubleshooting

- **Still getting disabled_client error?**
  - Double-check that the OAuth client is enabled in Google Cloud Console
  - Verify your Client ID and Secret are correct in `.env`
  - Make sure you're using the correct project in Google Cloud Console

- **Redirect URI mismatch?**
  - Ensure the redirect URI in Google Cloud Console exactly matches: `{NEXTAUTH_URL}/api/auth/callback/google`
  - Check that `NEXTAUTH_URL` is set correctly in your `.env` file

- **Access blocked error?**
  - Check if your app is in testing mode and you're not a test user
  - Verify OAuth consent screen is properly configured
  - Check if your Google account has access to the app
