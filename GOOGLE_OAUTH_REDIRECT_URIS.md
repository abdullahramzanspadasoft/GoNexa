# Google OAuth Redirect URIs - Complete Setup Guide

## Problem (Roman Urdu)

YouTube connection par bhi same `redirect_uri_mismatch` error aa raha hai kyunki Google Cloud Console mein saare required redirect URIs add nahi hain.

## Solution: Google Cloud Console Mein Ye Sab URIs Add Karo

### Step 1: Google Cloud Console Mein Jao
1. https://console.cloud.google.com/apis/credentials par jao
2. Apne OAuth 2.0 Client ID par click karo
3. "Authorized redirect URIs" section mein jao

### Step 2: Ye Sab URIs Add Karo

**ZAROORI - Dono Add Karo:**

1. ✅ `http://localhost:3000/api/auth/callback/google`
   - **Kyun:** NextAuth Google sign-in ke liye use karta hai
   - **Kahan use hota hai:** "Continue with Google" button

2. ✅ `http://localhost:3000/callback/aouth`
   - **Kyun:** Custom callback URL (aapka requirement)
   - **Kahan use hota hai:** After Google sign-in redirect

3. ✅ `http://localhost:3000/api/youtube/callback`
   - **Kyun:** YouTube channel connect karne ke liye
   - **Kahan use hota hai:** YouTube connect button

### Step 3: Final List

Google Cloud Console mein "Authorized redirect URIs" section mein ye **TEENO** URLs add karo:

```
http://localhost:3000/api/auth/callback/google
http://localhost:3000/callback/aouth
http://localhost:3000/api/youtube/callback
```

### Step 4: Save Karo
"Save" button click karo

### Step 5: Server Restart Karo
```bash
npm run dev
```

## Kaise Kaam Karta Hai

### Google Sign-In Flow:
1. User "Continue with Google" click karta hai
2. NextAuth redirect karta hai: `http://localhost:3000/api/auth/callback/google`
3. Google authenticate karta hai
4. Google redirect karta hai: `http://localhost:3000/api/auth/callback/google?code=...`
5. NextAuth process karta hai aur dashboard par redirect karta hai

### YouTube Connect Flow:
1. User YouTube connect button click karta hai
2. App redirect karta hai: `http://localhost:3000/api/youtube/callback`
3. Google YouTube permissions mangta hai
4. Google redirect karta hai: `http://localhost:3000/api/youtube/callback?code=...`
5. App YouTube channel connect karta hai

## Important Notes

- ✅ Har redirect URI ko exactly same add karo (no trailing slashes)
- ✅ `http://localhost:3000` use karo, `https://` nahi (local development ke liye)
- ✅ Production mein `https://yourdomain.com` use karna hoga
- ✅ Agar koi URI missing hai, to `redirect_uri_mismatch` error aayega

## Environment Variables Check

Apni `.env.local` file mein ye confirm karo:

```env
NEXTAUTH_URL=http://localhost:3000
GOOGLE_CLIENT_ID=553813181930-0d5b55gra5ea9feasmpicj5sqmg5c8mn.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=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
```

**Important:** 
- `NEXTAUTH_URL` mein sirf base URL (`http://localhost:3000`)
- Callback paths (`/callback/aouth`) nahi add karo
- Variable names mein underscores (`_`) use karo, asterisks (`*`) nahi

## Test Karo

1. Google Cloud Console mein teeno URIs add karo
2. Server restart karo
3. "Continue with Google" try karo - ab kaam karna chahiye
4. YouTube connect try karo - ab kaam karna chahiye

Yeh sab setup karne ke baad dono features properly kaam karenge!
