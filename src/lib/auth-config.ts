// Authentication configuration
export const AUTH_CONFIG = {
  // Update this with your deployed login app URL
  loginAppUrl: 'https://general-managerment.web.app', // Your Firebase hosted login app
  
  // Optionally set different URLs for different environments
  loginAppUrls: {
    development: 'http://localhost:5173', // Your login app dev server
    production: 'https://general-managerment.web.app', // Your Firebase hosted login app
  },
  
  // Get the appropriate login URL based on environment
  getLoginUrl: () => {
    if (typeof window === 'undefined') return AUTH_CONFIG.loginAppUrl;
    
    const environment = process.env.NODE_ENV;
    return AUTH_CONFIG.loginAppUrls[environment as keyof typeof AUTH_CONFIG.loginAppUrls] || AUTH_CONFIG.loginAppUrl;
  }
};

// This phone store app URL (to be used in your login app)
export const PHONE_STORE_CONFIG = {
  // This will be automatically set based on deployment
  appUrl: typeof window !== 'undefined' ? window.location.origin : '',
  
  // Manual URLs for different environments (update these after deployment)
  appUrls: {
    development: 'http://localhost:3000',
    production: 'https://phone-store-topaz.vercel.app', // Your actual Vercel deployment
  },
  
  getAppUrl: () => {
    if (typeof window !== 'undefined') return window.location.origin;
    
    const environment = process.env.NODE_ENV;
    return PHONE_STORE_CONFIG.appUrls[environment as keyof typeof PHONE_STORE_CONFIG.appUrls] || '';
  }
};