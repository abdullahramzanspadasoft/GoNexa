# YouTube Connection Error Fix (Roman Urdu)

## Problem

"Failed to connect YouTube channel. Please try again." error aa raha hai.

## Main Issues Aur Solutions

### Issue 1: Redirect URI Missing (Sabse Common)

**Problem:** Google Cloud Console mein YouTube ka redirect URI add nahi hai.

**Solution:**
1. Google Cloud Console mein jao: https://console.cloud.google.com/apis/credentials
2. Apne OAuth 2.0 Client ID par click karo
3. "Authorized redirect URIs" section mein yeh URI add karo:
   ```
   http://localhost:3000/api/youtube/callback
   ```
4. Save karo

### Issue 2: Environment Variables

**Check karo `.env.local` file:**
```env
NEXTAUTH_URL=http://localhost:3000
GOOGLE_CLIENT_ID=553813181930-0d5b55gra5ea9feasmpicj5sqmg5c8mn.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=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
YOUTUBE_API_KEY=your-youtube-api-key-here
```

**Important:**
- `NEXTAUTH_URL` sirf base URL hona chahiye
- Variable names mein underscores (`_`) use karo
- YouTube API key optional hai, lekin recommended hai

### Issue 3: YouTube API Not Enabled

**Check karo:**
1. Google Cloud Console mein jao
2. "APIs & Services" > "Library" par jao
3. "YouTube Data API v3" search karo
4. Agar enabled nahi hai, to enable karo

### Issue 4: OAuth Consent Screen

**Check karo:**
1. Google Cloud Console > "APIs & Services" > "OAuth consent screen"
2. Make sure app properly configured hai
3. Test users add karo agar app "Testing" mode mein hai

## Complete Redirect URIs List

Google Cloud Console mein yeh **TEENO** URIs add karo:

```
http://localhost:3000/api/auth/callback/google
http://localhost:3000/callback/aouth
http://localhost:3000/api/youtube/callback
```

## Error Messages Ka Meaning

- **"redirect_uri_mismatch"** → Redirect URI Google Cloud Console mein add karo
- **"token_exchange_failed"** → Authorization code invalid ya expired
- **"channel_fetch_failed"** → YouTube API key issue ya permissions
- **"no_channel_found"** → Account mein YouTube channel nahi hai
- **"api_key_missing"** → YouTube API key `.env.local` mein add karo
- **"Invalid access token"** → Token invalid, dobara connect karo
- **"Access forbidden"** → API permissions check karo

## Steps to Fix

1. ✅ Google Cloud Console mein `http://localhost:3000/api/youtube/callback` add karo
2. ✅ YouTube Data API v3 enable karo
3. ✅ `.env.local` file check karo
4. ✅ Server restart karo: `npm run dev`
5. ✅ YouTube connect button try karo

## Debugging

Agar abhi bhi error aaye, to:

1. Browser console check karo (F12)
2. Server logs check karo (terminal mein)
3. Google Cloud Console mein OAuth logs check karo

Yeh sab karne ke baad YouTube connection properly kaam karega!
