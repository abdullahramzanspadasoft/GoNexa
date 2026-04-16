# Error Explanation (Roman Urdu)

## Error: redirect_uri_mismatch

**Problem Kya Hai?**

Jab aap "Continue with Google" button click karte hain, to:
1. Aapka app Google ko bhejta hai ek redirect URI (callback URL)
2. Google check karta hai ke yeh URI unke system mein registered hai ya nahi
3. Agar match nahi hota, to Google error deta hai: "redirect_uri_mismatch"

**Kyun Ho Raha Hai?**

NextAuth automatically use karta hai yeh URL:
- `http://localhost:3000/api/auth/callback/google`

Lekin aapne Google Cloud Console mein sirf yeh add kiya hai:
- `http://localhost:3000/callback/aouth`

Isliye Google ko dono URLs match nahi ho rahe.

**Solution Kya Hai?**

Google Cloud Console mein **DONO** redirect URIs add karni hain:

1. ✅ `http://localhost:3000/api/auth/callback/google` (NextAuth ka default - **ZAROORI HAI**)
2. ✅ `http://localhost:3000/callback/aouth` (Aapka custom callback)

## Steps to Fix (Step by Step)

### Step 1: Google Cloud Console Mein Jaao
1. https://console.cloud.google.com/apis/credentials par jao
2. Apne OAuth 2.0 Client ID par click karo

### Step 2: Redirect URIs Add Karo
"Authorized redirect URIs" section mein yeh **DONO** URLs add karo:

```
http://localhost:3000/api/auth/callback/google
http://localhost:3000/callback/aouth
```

### Step 3: Save Karo
"Save" button click karo

### Step 4: Server Restart Karo
Apne development server ko restart karo:
```bash
npm run dev
```

### Step 5: Test Karo
"Continue with Google" button try karo

## Important Notes

- ✅ `.env.local` file mein `NEXTAUTH_URL=http://localhost:3000` hona chahiye (sirf base URL, callback path nahi)
- ✅ Environment variables mein underscores (`_`) use karo, asterisks (`*`) nahi
- ✅ Dono redirect URIs Google Cloud Console mein honi chahiye

## Flow Kaise Kaam Karta Hai

1. User "Continue with Google" click karta hai
2. NextAuth Google ko redirect karta hai with: `http://localhost:3000/api/auth/callback/google`
3. Google user ko authenticate karta hai
4. Google redirect karta hai: `http://localhost:3000/api/auth/callback/google?code=...`
5. NextAuth code process karta hai aur session banata hai
6. NextAuth redirect karta hai: `http://localhost:3000/callback/aouth`
7. Aapka custom callback check karta hai session aur dashboard par redirect karta hai

Yeh sab automatically hota hai - aapko kuch extra code nahi likhna!
