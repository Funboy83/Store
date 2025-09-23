// DEBUGGING STEPS for your login app:

// 1. First, add console.log to see if the click is registered:
const handleRetailClick = () => {
  console.log("🔥 RETAIL BUTTON CLICKED!"); // Should appear in browser console
  alert("Retail button was clicked!"); // Should show popup
};

// 2. If that works, test authentication:
const handleRetailClick = () => {
  console.log("🔥 RETAIL BUTTON CLICKED!");
  
  if (auth.currentUser) {
    console.log("✅ User is logged in:", auth.currentUser.email);
    alert(`Logged in as: ${auth.currentUser.email}`);
  } else {
    console.log("❌ No user logged in");
    alert("No user logged in!");
  }
};

// 3. If authentication works, test the redirect:
const handleRetailClick = () => {
  console.log("🔥 RETAIL BUTTON CLICKED!");
  
  if (auth.currentUser) {
    const url = 'http://localhost:3000/dashboard';
    console.log("🚀 Redirecting to:", url);
    
    // Test with alert first
    alert(`About to redirect to: ${url}`);
    
    // Then uncomment this line:
    // window.location.href = url;
  } else {
    alert("Please log in first");
  }
};

// 4. FINAL WORKING VERSION:
const handleRetailClick = async () => {
  console.log("🔥 RETAIL BUTTON CLICKED!");
  
  try {
    if (!auth.currentUser) {
      alert("Please log in first");
      return;
    }

    console.log("✅ User authenticated:", auth.currentUser.email);

    const isDev = window.location.hostname === 'localhost';
    const phoneStoreUrl = isDev 
      ? 'http://localhost:3000/dashboard'
      : 'https://phone-store-topaz.vercel.app/dashboard';

    console.log("🚀 Redirecting to:", phoneStoreUrl);
    
    window.location.href = phoneStoreUrl;

  } catch (error) {
    console.error("❌ Error:", error);
    alert("Error: " + error.message);
  }
};