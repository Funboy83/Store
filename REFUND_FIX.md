# Database Migration Required

## The Issue
The "NOT_FOUND: No document to update" error occurs because the refund process is trying to update documents (customers, inventory items) that don't exist in the current database path.

This happens because your data is split between:
- **Old path**: `cellphone-inventory-system/data` (where your existing data is)
- **New path**: `app-data/cellsmart-data` (where the app is looking)

## Quick Fix
You need to migrate your data to the unified path first.

### Steps:
1. **Go to the migration page**: Navigate to `/debug-database-unification` in your browser
2. **Check your data**: Click "Check All Database Paths" to see the current data distribution  
3. **Run migration**: Click "Auto-Migrate All Data" to copy all data to the unified path
4. **Verify**: Try the refund process again

### Alternative Quick Fix (If migration doesn't work immediately)
If you need to process the refund urgently before migration:

1. Go to Firebase Console
2. Navigate to your `app-data/cellsmart-data` path
3. Manually copy the customer and inventory item documents from the old path to new path
4. Then retry the refund

The refund process will work correctly once all your data is in the unified `app-data/cellsmart-data` path.