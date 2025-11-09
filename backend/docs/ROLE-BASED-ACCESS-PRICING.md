# Role-Based Access Control - Pricing Page

## Overview
The Pricing page now has different views and permissions based on user role (Manager vs Staff).

---

## Manager View (Full Access)

### Permissions
- ✅ View pending discount suggestions
- ✅ Approve discount suggestions
- ✅ Reject discount suggestions
- ✅ Modify suggested discount percentage
- ✅ Run pricing analysis manually
- ✅ View statistics and potential revenue

### UI Elements
- **Page Title**: "Dynamic Pricing"
- **Subtitle**: "Review and approve AI-suggested discounts"
- **Buttons Visible**:
  - "Run Analysis" button (header)
  - "Approve" button (per suggestion)
  - "Reject" button (per suggestion)
  - "Run Analysis Now" button (empty state)

### API Endpoint
- `GET /api/discount-suggestions/pending` - Fetches pending suggestions

---

## Staff View (Read-Only)

### Permissions
- ✅ View approved discount suggestions only
- ❌ Cannot approve/reject suggestions
- ❌ Cannot run pricing analysis
- ❌ Cannot modify discount percentages

### UI Elements
- **Page Title**: "Dynamic Pricing"
- **Subtitle**: "View approved discount suggestions"
- **Buttons Hidden**:
  - "Run Analysis" button (not shown)
  - "Approve" button (replaced with status badge)
  - "Reject" button (replaced with status badge)
- **Status Badge Shown**: 
  - "✓ Approved" for approved items
  - "⏳ Pending Manager Approval" for pending items

### API Endpoint
- `GET /api/discount-suggestions/approved` - Fetches approved suggestions only

---

## Implementation Details

### Frontend Changes
**File**: `frontend/src/pages/Pricing.tsx`

```javascript
// Get user role from localStorage
const currentUser = JSON.parse(localStorage.getItem("pms_user") || "{}");
const userRole = currentUser.role || "staff";
const isManager = userRole === "manager";

// Conditional API endpoint
const endpoint = isManager 
  ? "http://localhost:5000/api/discount-suggestions/pending"
  : "http://localhost:5000/api/discount-suggestions/approved";

// Conditional UI rendering
{isManager ? (
  <>
    <Button onClick={handleApproveClick}>Approve</Button>
    <Button onClick={handleRejectClick}>Reject</Button>
  </>
) : (
  <Badge>✓ Approved</Badge>
)}
```

### Backend Changes
**Files**: 
- `backend/src/routes/discountSuggestion.routes.js`
- `backend/src/controllers/discountSuggestion.controller.js`

**New Endpoint Added**:
```javascript
// GET /api/discount-suggestions/approved
router.get('/approved', getApprovedSuggestions);
```

**Controller Function**:
```javascript
export const getApprovedSuggestions = async (req, res) => {
  // Fetches only suggestions with status = 'approved'
  // Ordered by updated_at descending (most recent first)
}
```

---

## User Experience

### Manager Login Flow
1. Manager logs in
2. Navigates to Pricing page
3. Sees pending discount suggestions
4. Can click "Run Analysis" to generate new suggestions
5. Reviews each suggestion
6. Clicks "Approve" or "Reject" with reasons
7. Upon approval, label auto-generates for printing

### Staff Login Flow
1. Staff logs in
2. Navigates to Pricing page
3. Sees only approved discount suggestions
4. Views discount details (read-only)
5. Can see which items have active discounts
6. Cannot modify or approve/reject anything
7. "Run Analysis" button is hidden

---

## Empty States

### Manager Empty State
**Message**: "No Pending Suggestions"
**Description**: "There are no discount suggestions at this time. Run the analysis to generate new suggestions."
**Action**: "Run Analysis Now" button visible

### Staff Empty State
**Message**: "No Approved Discounts"
**Description**: "There are no approved discounts at this time. Check back later."
**Action**: No button shown (staff cannot trigger analysis)

---

## Security Considerations

### Current Implementation
- Role check is done on frontend using localStorage
- Backend endpoints are open (no auth middleware yet)

### Recommended Enhancements
1. Add authentication middleware to backend routes
2. Verify user role on backend before returning data
3. Add audit logging for approve/reject actions
4. Implement session management

### Future Backend Security
```javascript
// Example middleware
import { verifyManagerRole } from '../middleware/auth.middleware.js';

router.post('/analyze', verifyManagerRole, triggerPricingAnalysis);
router.put('/:id/approve', verifyManagerRole, approveSuggestion);
router.put('/:id/reject', verifyManagerRole, rejectSuggestion);
```

---

## Testing Checklist

### Manager Role Testing
- [ ] Login as manager
- [ ] Verify "Run Analysis" button is visible
- [ ] Verify pending suggestions are shown
- [ ] Click "Approve" and verify discount is applied
- [ ] Click "Reject" and verify reason is required
- [ ] Verify label auto-generates after approval
- [ ] Check stats update after approval/rejection

### Staff Role Testing
- [ ] Login as staff
- [ ] Verify "Run Analysis" button is hidden
- [ ] Verify only approved suggestions are shown
- [ ] Verify approve/reject buttons are replaced with badges
- [ ] Verify empty state shows appropriate message
- [ ] Verify no action buttons in empty state

### Edge Cases
- [ ] Test with no user in localStorage (defaults to staff)
- [ ] Test with invalid role in localStorage
- [ ] Test switching between manager and staff accounts
- [ ] Test with mixed approved/pending suggestions

---

## Database Schema Reference

### discount_suggestions table
```sql
status VARCHAR CHECK (status IN ('pending', 'approved', 'rejected', 'expired'))
```

**Status Values**:
- `pending` - Shown to managers only
- `approved` - Shown to both managers and staff
- `rejected` - Not shown in UI
- `expired` - Not shown in UI

---

## Related Files

- Frontend: `frontend/src/pages/Pricing.tsx`
- Backend Routes: `backend/src/routes/discountSuggestion.routes.js`
- Backend Controller: `backend/src/controllers/discountSuggestion.controller.js`
- Auth Context: `frontend/src/contexts/AuthContext.tsx` (for user role)

---

## Date Implemented
November 9, 2025

## Status
✅ Implemented and Ready for Testing
