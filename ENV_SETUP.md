# Environment Variables Setup Guide

## Critical Issues Fixed

1. ✅ **Environment variable names**: Use underscores (`_`) NOT asterisks (`*`)
2. ✅ **NEXTAUTH_URL**: Should be just the base URL, NOT the callback path
3. ✅ **Redirect paths**: Fixed to use absolute paths

## Create/Update Your `.env.local` File

Create a file named `.env.local` in the root directory with the following content:

```env
# NextAuth Configuration
# IMPORTANT: NEXTAUTH_URL should be just the base URL, NOT the callback path
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-secret-key-here-generate-with-openssl-rand-base64-32

# Google OAuth Configuration
# IMPORTANT: Use underscores (_) not asterisks (*) in variable names
GOOGLE_CLIENT_ID=553813181930-0d5b55gra5ea9feasmpicj5sqmg5c8mn.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=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

# Database Configuration (MongoDB)
MONGODB_URI=mongodb://localhost:27017/your-database-name
```

## Important Notes

### ❌ WRONG (What you had):
```env
GOOGLE*CLIENT*ID=...           # ❌ Asterisks instead of underscores
GOOGLE*CLIENT*SECRET=...      # ❌ Asterisks instead of underscores
NEXTAUTH_URL=http://localhost:3000/callback/aouth  # ❌ Includes callback path
```

### ✅ CORRECT (What you need):
```env
GOOGLE_CLIENT_ID=...          # ✅ Underscores
GOOGLE_CLIENT_SECRET=...      # ✅ Underscores
NEXTAUTH_URL=http://localhost:3000  # ✅ Just the base URL
```

## Google Cloud Console Configuration

Make sure you have BOTH redirect URIs added in Google Cloud Console:

1. `http://localhost:3000/api/auth/callback/google` (NextAuth default - REQUIRED)
2. `http://localhost:3000/callback/aouth` (Custom callback)

## Steps to Fix

1. **Create/Update `.env.local` file** with the correct format above
2. **Restart your development server** after updating environment variables:
   ```bash
   npm run dev
   ```
3. **Verify in Google Cloud Console** that both redirect URIs are added
4. **Test the "Continue with Google" button**

## Generate NEXTAUTH_SECRET

If you need to generate a secure secret, run:
```bash
openssl rand -base64 32
```

Then copy the output and use it as your `NEXTAUTH_SECRET` value.
