# Firebase Login App Redirect Configuration

## Issue
Your phone store app is trying to redirect to `https://general-managerment.web.app/` but the redirect may not be working properly.

## Solution Steps

### 1. Update Your Login App's Redirect URL

In your login app (the one hosted at `https://general-managerment.web.app/`), find the retail button click handler and update the redirect URL:

```javascript
const handleRetailClick = async () => {
  try {
    // Your authentication logic here
    
    // After successful authentication, redirect to the phone store
    window.location.href = 'https://phone-store-topaz.vercel.app/dashboard';
  } catch (error) {
    console.error('Login error:', error);
  }
};
```

### 2. Firebase Console Configuration

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project: `management-project-bf767`
3. Go to **Authentication** > **Settings** > **Authorized domains**
4. Make sure these domains are added:
   - `general-managerment.web.app`
   - `phone-store-topaz.vercel.app`
   - `localhost` (for development)

### 3. Test the Flow

1. Go to: `https://general-managerment.web.app/`
2. Click the "Retail" button
3. It should authenticate and redirect to: `https://phone-store-topaz.vercel.app/dashboard`

### 4. Debugging Steps

If it's still not working, check:

1. **Browser Console**: Look for any error messages
2. **Network Tab**: Check if the redirect is happening
3. **Firebase Auth**: Verify authentication is successful

### 5. Common Issues

- **CORS errors**: Make sure both domains are in Firebase authorized domains
- **Authentication state**: Ensure the user is actually authenticated before redirect
- **URL format**: Remove trailing slashes if causing issues

## Updated URLs in Phone Store App

✅ **Login App URL**: `https://general-managerment.web.app/`
✅ **Phone Store URL**: `https://phone-store-topaz.vercel.app/dashboard`

The phone store app is now configured to redirect to your Firebase hosted login app when authentication is needed.