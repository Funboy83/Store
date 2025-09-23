# Admin Authentication System Setup

## What's Been Added

### 1. Enhanced Authentication Context (`src/lib/auth-context.tsx`)
- Added `isAdmin` and `userRole` properties
- Admin checking based on email addresses
- Enhanced user status tracking

### 2. Admin Email Configuration
Currently configured admin emails in `checkAdminStatus` function:
```typescript
const adminEmails = [
  'admin@example.com',
  'trindt.dev@gmail.com', // Add your admin email here
  'manager@phonestore.com',
];
```

### 3. Enhanced Header (`src/components/layout/header.tsx`)
- Shows username and admin badge
- Enhanced logout button with hover effects
- Better avatar display
- Admin status indicator

### 4. Admin Utilities (`src/hooks/use-admin.tsx`)
- `useAdmin()` hook for checking admin status
- `withAdminOnly()` HOC for protecting components
- Permission checking utilities

### 5. Admin Panel Component (`src/components/admin/admin-panel.tsx`)
- Displays admin-only content
- Shows user information
- Admin controls and management areas

### 6. User Profile Component (`src/components/auth/user-profile.tsx`)
- Compact user information display
- Admin status indicator
- Logout functionality

## How to Customize Admin Access

### Method 1: Email-based Admin (Current Implementation)
Edit the admin emails list in `src/lib/auth-context.tsx`:
```typescript
const adminEmails = [
  'your-admin@email.com',
  'another-admin@email.com',
];
```

### Method 2: Firebase Custom Claims (Advanced)
For production, consider using Firebase custom claims:

1. Set custom claims on Firebase backend:
```javascript
// Firebase Admin SDK
admin.auth().setCustomUserClaims(uid, { admin: true });
```

2. Update the `checkAdminStatus` function:
```typescript
const checkAdminStatus = async (user: User | null) => {
  if (!user) return { isAdmin: false, userRole: 'guest' };
  
  const token = await user.getIdTokenResult();
  const isAdmin = token.claims.admin === true;
  
  return {
    isAdmin,
    userRole: isAdmin ? 'admin' : 'user'
  };
};
```

## Usage Examples

### Check Admin Status in Components
```typescript
import { useAdmin } from '@/hooks/use-admin';

export function MyComponent() {
  const { isAdmin, canAccessAdminFeatures } = useAdmin();
  
  return (
    <div>
      {isAdmin && <AdminOnlyButton />}
      {canAccessAdminFeatures && <AdminPanel />}
    </div>
  );
}
```

### Protect Entire Components
```typescript
import { withAdminOnly } from '@/hooks/use-admin';

const AdminSettings = withAdminOnly(() => {
  return <div>Admin-only content</div>;
});
```

### Conditional Rendering
```typescript
import { useAuth } from '@/lib/auth-context';

export function SomeComponent() {
  const { isAdmin, userRole } = useAuth();
  
  return (
    <div>
      <h1>Welcome, {userRole}!</h1>
      {isAdmin ? (
        <AdminControls />
      ) : (
        <UserControls />
      )}
    </div>
  );
}
```

## Current Features

✅ **Username Display**: Shows user's display name or email  
✅ **Admin Detection**: Automatically detects admin users  
✅ **Logout Button**: Enhanced logout with proper styling  
✅ **Admin Badge**: Visual indicator for admin users  
✅ **Protected Components**: Components that only admins can see  
✅ **User Profile**: Compact user information display  
✅ **Admin Panel**: Comprehensive admin dashboard section  

## Testing

1. **Regular User**: Login with a non-admin email
   - Should see username without admin badge
   - Should not see admin panel content
   - Should see "Admin access required" messages

2. **Admin User**: Login with an admin email (like trindt.dev@gmail.com)
   - Should see username with admin badge
   - Should see full admin panel
   - Should have access to all admin features

## Security Notes

- Admin status is checked on the frontend only
- For production security, implement proper backend role verification
- Consider using Firebase custom claims for scalable role management
- Always validate admin permissions on API endpoints