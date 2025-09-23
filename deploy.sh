#!/bin/bash

# Firebase Deployment Script
# This script handles both static hosting and app hosting deployment

echo "🔥 Firebase Deployment Script"
echo "=============================="

# Check if Firebase CLI is installed
if ! command -v firebase &> /dev/null; then
    echo "❌ Firebase CLI not found. Installing..."
    npm install -g firebase-tools
fi

# Check if user is logged in
firebase login:ci --interactive

# Environment setup
echo "📝 Checking environment configuration..."
if [ ! -f ".env.local" ]; then
    echo "⚠️  .env.local not found. Please copy .env.example to .env.local and configure your Firebase settings."
    exit 1
fi

# Build the project
echo "🏗️  Building project..."
npm run build

if [ $? -ne 0 ]; then
    echo "❌ Build failed. Please fix build errors before deploying."
    exit 1
fi

# Deploy based on user choice
echo "🚀 Choose deployment type:"
echo "1) Static Web Hosting (firebase.json)"
echo "2) App Hosting (apphosting.yaml)"
read -p "Enter choice (1 or 2): " choice

case $choice in
    1)
        echo "📦 Deploying to Firebase Static Hosting..."
        firebase deploy --only hosting
        ;;
    2)
        echo "🚀 Deploying to Firebase App Hosting..."
        firebase deploy --only apphosting
        ;;
    *)
        echo "❌ Invalid choice. Exiting."
        exit 1
        ;;
esac

echo "✅ Deployment complete!"