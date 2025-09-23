# Authentication Integration Setup

This document provides instructions for completing the authentication integration between your login app and phone store dashboard.

## 📋 Setup Checklist

### Step 1: Update Firebase Configuration (Login App)
Your login app uses Firebase project: `management-project-bf767`
This phone store app uses Firebase project: `general-managerment`

**Option A: Use Same Firebase Project (Recommended)**
1. Update phone store app to use same Firebase project as login app
2. Copy Firebase config from login app to phone store `.env.local`

**Option B: Enable Cross-Project Authentication**
1. Set up Firebase Auth domain sharing between projects
2. Configure CORS settings for cross-origin authentication

### Step 2: Update Login App RetailClick Handler
In your login app's `src/MenuPage.tsx`, update the `handleRetailClick` function:

```tsx
const handleRetailClick = () => {
  // Get the current user's auth token
  if (auth.currentUser) {
    // Option 1: Redirect with auth state (Firebase handles this automatically)
    window.location.href = "https://phone-store-topaz.vercel.app/dashboard";
    
    // Option 2: If needed, pass additional data via URL params
    // const token = await auth.currentUser.getIdToken();
    // window.location.href = `https://phone-store-topaz.vercel.app/dashboard?token=${token}`;
  } else {
    alert("Please log in first");
  }
};
```

### Step 3: Update Configuration Files
1. **In Phone Store App** (`src/lib/auth-config.ts`):
   ```tsx
   export const AUTH_CONFIG = {
     loginAppUrl: 'https://your-deployed-login-app-url.com',
     loginAppUrls: {
       development: 'http://localhost:5173', // Your login app dev port
       production: 'https://your-deployed-login-app-url.com',
     }
   };
   ```

2. **In Login App** - Update the retail portal URL to point to your deployed phone store app

### Step 4: Firebase Environment Variables
Update your phone store app's `.env.local` to match your login app's Firebase project:

```env
NEXT_PUBLIC_FIREBASE_API_KEY=AIzaSyBmE1p_qhMVGGr_NDmOVvFY7ipyeNQVOC4
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=management-project-bf767.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=management-project-bf767
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=management-project-bf767.firebasestorage.app
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=200210418664
NEXT_PUBLIC_FIREBASE_APP_ID=1:200210418664:web:bb744d15f07f7ddffe725d
```

## 🚀 Authentication Flow

1. **User visits login app** → Authenticates with Firebase
2. **User clicks "Retail"** → Redirected to phone store dashboard
3. **Phone store app checks auth** → Firebase verifies user automatically
4. **If authenticated** → Shows dashboard
5. **If not authenticated** → Redirects back to login app

## 🔒 Security Features Implemented

- ✅ **Protected Routes**: All dashboard routes require authentication
- ✅ **Automatic Redirects**: Unauthenticated users sent to login app
- ✅ **User Context**: User info displayed in header
- ✅ **Logout Functionality**: Returns user to login app
- ✅ **Loading States**: Shows spinner while checking auth
- ✅ **Error Handling**: Graceful handling of auth errors

## 🛠 Next Steps

1. **Deploy both apps** and get their URLs
2. **Update configuration files** with actual URLs
3. **Test the authentication flow**:
   - Login → Menu → Retail → Dashboard
   - Logout → Returns to login
   - Direct dashboard access → Redirects to login
4. **Optional**: Add user roles/permissions if needed

## 📚 Files Modified

### Phone Store App
- `src/lib/firebase.ts` - Added Firebase Auth
- `src/lib/auth-context.tsx` - Authentication context
- `src/lib/auth-config.ts` - Configuration
- `src/components/auth/protected-route.tsx` - Route protection
- `src/app/layout.tsx` - Auth provider
- `src/app/dashboard/layout.tsx` - Protected routes
- `src/components/layout/header.tsx` - User info & logout

### Login App (To Update)
- `src/MenuPage.tsx` - Update retail click handler

## 🎯 Testing Checklist

- [ ] User can login in login app
- [ ] User can navigate to retail portal
- [ ] Phone store dashboard loads with user data
- [ ] User info shows in header
- [ ] Logout returns to login app
- [ ] Direct dashboard access redirects to login
- [ ] Works in both development and production