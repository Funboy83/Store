# Firebase Deployment Guide

This guide provides step-by-step instructions for deploying your Firebase Studio project to Firebase hosting.

## Prerequisites

1. **Firebase CLI**: Install globally if not already installed
   ```bash
   npm install -g firebase-tools
   ```

2. **Firebase Project**: Create a project at [Firebase Console](https://console.firebase.google.com/)

3. **Environment Variables**: Configure your Firebase settings in `.env.local`

## Option 1: Firebase App Hosting (Recommended)

Firebase App Hosting is ideal for Next.js applications with dynamic routes and server-side features.

### Setup Steps:

1. **Login to Firebase**:
   ```bash
   firebase login
   ```

2. **Initialize Firebase App Hosting**:
   ```bash
   firebase init apphosting
   ```

3. **Configure Environment Variables**:
   - Copy `.env.example` to `.env.local`
   - Fill in your Firebase project configuration
   
4. **Deploy**:
   ```bash
   npm run firebase:apphosting
   ```

### Configuration Files Used:
- `apphosting.yaml` - App Hosting configuration
- `next.config.ts` - Default Next.js configuration (supports SSR)

## Option 2: Static Hosting

For static sites only (no dynamic server-side features).

### Setup Steps:

1. **Switch to Static Configuration**:
   ```bash
   copy next.config.static.ts next.config.ts
   ```

2. **Initialize Firebase Hosting**:
   ```bash
   firebase init hosting
   ```

3. **Build and Deploy**:
   ```bash
   npm run firebase:hosting
   ```

### Configuration Files Used:
- `firebase.json` - Static hosting configuration
- `next.config.static.ts` - Static export configuration

## Deployment Scripts

### Available Scripts:
```bash
# Build the project
npm run build

# Deploy to App Hosting (recommended)
npm run firebase:apphosting

# Deploy to Static Hosting
npm run firebase:hosting

# Test locally
npm run firebase:serve

# Run deployment wizard (Windows)
deploy.bat

# Run deployment wizard (Unix/Mac)
./deploy.sh
```

## Troubleshooting

### Common Issues:

1. **Build Failures**:
   - Check environment variables in `.env.local`
   - Run `npm run typecheck` to identify TypeScript issues
   - Run `npm run lint` to fix linting issues

2. **Deployment Failures**:
   - Ensure Firebase CLI is logged in: `firebase login`
   - Check Firebase project permissions
   - Verify correct project ID in `.firebaserc`

3. **Runtime Errors**:
   - Check Firebase configuration in browser console
   - Verify all required environment variables are set
   - Check Firebase project quotas and limits

### Environment Variables Required:
```env
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=project_id.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=project_id.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
```

## Production Checklist

Before deploying to production:

- [ ] All environment variables configured
- [ ] Firebase project set up with appropriate services enabled
- [ ] Build completes successfully (`npm run build`)
- [ ] TypeScript checks pass (`npm run typecheck`)
- [ ] No ESLint errors (`npm run lint`)
- [ ] Firebase CLI authenticated (`firebase login`)
- [ ] Correct Firebase project selected (`firebase use project-id`)

## Switching Between Deployment Types

### To App Hosting:
```bash
copy next.config.apphosting.ts next.config.ts
npm run firebase:apphosting
```

### To Static Hosting:
```bash
copy next.config.static.ts next.config.ts
npm run firebase:hosting
```

## Firebase Services Setup

Ensure these services are enabled in your Firebase project:
- Authentication (if using auth features)
- Firestore Database (for data storage)
- Storage (if using file uploads)
- App Hosting or Hosting (depending on deployment type)

## Performance Tips

1. **Optimize Images**: Use Next.js Image component with proper sizing
2. **Enable Caching**: Firebase hosting automatically caches static assets
3. **Monitor Performance**: Use Firebase Performance Monitoring
4. **Bundle Analysis**: Run `npm run build` and check bundle sizes

## Support

If you encounter issues:
1. Check the console for error messages
2. Review Firebase project settings
3. Ensure all dependencies are up to date
4. Check Firebase status page for service issues