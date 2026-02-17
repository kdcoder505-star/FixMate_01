# Bug Fix Report: "Ticket Not Found"

## Issue
Users encountered "Ticket not found" errors when trying to view complaint details.
This was caused by the application querying for a field explicitly named `id` within the document (e.g., `where('id', '==', '...')`), whereas Firestore stores the ID as the document key/path, not as a field inside the document.

## Fix Applied
I updated `js/firebase-adapter.js` to intelligently handle queries for the `id` column.

### Technical Details
- Modified `FirebaseQueryBuilder.eq(column, value)`:
  - Added a check: `if (column === 'id')`
  - If true, it now uses `firebase.firestore.FieldPath.documentId()` to query against the document key.
  - Otherwise, it behaves as before.
- Modified `FirebaseQueryBuilder.in(column, values)`:
  - Applied the same logic to support `in` queries on IDs.

### Cleanup
- I also cleaned up the codebase by removing commented-out code related to server-side sorting (`.order()`) which was previously removed to fix index errors.

## Verification
1.  **Refresh your browser** (Clear cache if needed to ensure `firebase-adapter.js` is reloaded).
2.  Navigate to **My Complaints** (Student) or **Complaints** (Admin).
3.  Click on any complaint card.
4.  The "Ticket not found" error should be resolved, and the details page should load correctly.
