// Add this to your login app's src/MenuPage.tsx

const handleRetailClick = () => {
  // Check if user is authenticated
  if (auth.currentUser) {
    // Redirect to the phone store dashboard
    const phoneStoreUrl = process.env.NODE_ENV === 'development' 
      ? 'http://localhost:3000/dashboard'  // Your phone store dev server
      : 'https://phone-store-topaz.vercel.app/dashboard'; // Your actual Vercel deployment
    
    window.location.href = phoneStoreUrl;
  } else {
    alert("Please log in first");
  }
};