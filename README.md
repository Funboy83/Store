# Firebase Studio 🔥

A modern, production-ready Next.js dashboard application with Firebase integration. This clean, optimized version fixes deployment issues and provides reliable Firebase hosting options.

## ✨ Features

- ⚡ **Next.js 15** with App Router and TypeScript
- 🔥 **Firebase Integration** (Firestore, Auth, hosting)
- 🎨 **Modern UI** with Tailwind CSS and Radix UI components
- 📱 **Responsive Design** optimized for all devices
- 🤖 **AI Integration** with Google Genkit
- 📊 **Business Dashboard** with analytics and data visualization
- 🚀 **Optimized for Firebase deployment** with multiple hosting options

## 🚀 Quick Start

### 1. Clone and Install
```bash
git clone <repository-url>
cd studio
npm install
```

### 2. Firebase Setup
```bash
# Create .env.local from template
cp .env.example .env.local

# Add your Firebase config to .env.local
# Get values from https://console.firebase.google.com/
```

### 3. Development
```bash
npm run dev
# Open http://localhost:3000
```

### 4. Deploy to Firebase
```bash
# Option A: Firebase App Hosting (Recommended)
npm run firebase:apphosting

# Option B: Static Hosting
npm run firebase:hosting

# Option C: Use deployment wizard
deploy.bat  # Windows
./deploy.sh # Unix/Mac
```

## 📁 Project Structure

```
src/
├── app/                 # Next.js 13+ app router
│   ├── dashboard/       # Main dashboard pages
│   ├── globals.css      # Global styles
│   └── layout.tsx       # Root layout
├── components/          # Reusable UI components
├── lib/                 # Utilities and Firebase config
├── hooks/               # Custom React hooks
└── ai/                  # AI/Genkit integration
```

## 🔧 Configuration Files

- **`next.config.ts`** - Main Next.js config (App Hosting)
- **`next.config.static.ts`** - Static export config
- **`next.config.apphosting.ts`** - App Hosting config
- **`firebase.json`** - Firebase Hosting config
- **`apphosting.yaml`** - Firebase App Hosting config

## 🛠️ Available Scripts

| Script | Description |
|--------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Build for production |
| `npm run firebase:apphosting` | Deploy to Firebase App Hosting |
| `npm run firebase:hosting` | Deploy to Firebase Static Hosting |
| `npm run firebase:serve` | Test Firebase hosting locally |
| `npm run lint` | Run ESLint |
| `npm run typecheck` | Check TypeScript |
| `npm run clean` | Clean build artifacts |

## 🔐 Environment Setup

Create `.env.local` with your Firebase configuration:

```env
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=project_id.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=project_id.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
```

## 🚀 Deployment Options

### Firebase App Hosting (Recommended)
- ✅ Full Next.js features (SSR, API routes, dynamic routing)
- ✅ Automatic scaling
- ✅ Built-in CI/CD
- ✅ Environment variables support

### Firebase Static Hosting
- ✅ Fast global CDN
- ✅ Simple deployment
- ❌ No server-side features
- ❌ Static pages only

## 🔧 What Was Fixed

This cleaned-up version addresses common deployment issues:

1. **✅ Proper Firebase configuration** for both hosting types
2. **✅ Fixed TypeScript/ESLint issues** causing build failures
3. **✅ Optimized Next.js config** for Firebase deployment
4. **✅ Added deployment scripts** for easy deployment
5. **✅ Improved error handling** for missing Firebase config
6. **✅ Updated dependencies** and security fixes
7. **✅ Better documentation** and setup guides

## 📖 Documentation

- **[Deployment Guide](DEPLOYMENT_GUIDE.md)** - Comprehensive deployment instructions
- **[.env.example](.env.example)** - Environment variable template

## 🐛 Troubleshooting

### Build Issues
```bash
# Check for TypeScript errors
npm run typecheck

# Fix linting issues
npm run lint

# Clean and rebuild
npm run clean
npm run build
```

### Deployment Issues
```bash
# Ensure Firebase CLI is logged in
firebase login

# Check current project
firebase projects:list

# Set correct project
firebase use your-project-id
```

### Runtime Issues
- Check browser console for Firebase config errors
- Verify all environment variables are set
- Check Firebase project permissions and quotas

## 🎯 Key Improvements

- **Reliable builds**: Fixed TypeScript and build configuration issues
- **Multiple deployment options**: Support for both App Hosting and static hosting
- **Better error handling**: Graceful fallbacks when Firebase isn't configured
- **Cleaner codebase**: Removed problematic configurations and dependencies
- **Comprehensive documentation**: Step-by-step guides for deployment
- **Development-friendly**: Easier local development setup

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test the build: `npm run build`
5. Submit a pull request

## 📄 License

This project is open source and available under the [MIT License](LICENSE).

---

**Ready to deploy?** Follow the [Deployment Guide](DEPLOYMENT_GUIDE.md) for step-by-step instructions!
