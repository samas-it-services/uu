# Agent 4: Finance Module Agent Checklist
## Finance & Expense Management Specialist

---

## Role Overview

**Responsibilities**: Expense submission workflow, receipt handling, approval workflow, budget tracking, financial reports, sensitive data protection.

**Files Owned**:
- `src/pages/finance/**`
- `src/components/modules/finance/**`
- `src/services/api/expenses.ts`
- `src/hooks/useExpenses.ts`
- `src/types/expense.ts`

---

## Phase 3 Tasks

### Data Models
- [ ] Create `src/types/expense.ts`:
  ```typescript
  interface Expense {
    id: string;
    userId: string;
    projectId?: string;
    amount: number;
    currency: string;
    category: string;
    description: string;
    expenseDate: Timestamp;
    receiptURL: string;
    receiptPath: string;
    status: ExpenseStatus;
    reviewedBy?: string;
    reviewedAt?: Timestamp;
    rejectionReason?: string;
    comments: ExpenseComment[];
    createdAt: Timestamp;
    updatedAt: Timestamp;
  }
  
  type ExpenseStatus = 'draft' | 'submitted' | 'under_review' | 'approved' | 'rejected' | 'needs_info';
  ```

### API Service
- [ ] Create `src/services/api/expenses.ts`
- [ ] Implement `getExpenses(filters)` - with pagination
- [ ] Implement `getExpenseById(id)`
- [ ] Implement `getUserExpenses(userId)`
- [ ] Implement `getProjectExpenses(projectId)` - check access
- [ ] Implement `getPendingApprovals()` - finance only
- [ ] Implement `createExpense(data)`
- [ ] Implement `updateExpense(id, data)`
- [ ] Implement `deleteExpense(id)` - draft only
- [ ] Implement `submitExpense(id)`
- [ ] Implement `approveExpense(id)`
- [ ] Implement `rejectExpense(id, reason)`
- [ ] Implement `requestMoreInfo(id, comment)`

### React Query Hooks
- [ ] Create `src/hooks/useExpenses.ts`
- [ ] `useExpenses(filters)` - list with filters
- [ ] `useExpense(id)` - single expense
- [ ] `useUserExpenses()` - current user's expenses
- [ ] `usePendingApprovals()` - approval queue
- [ ] `useCreateExpense()` - mutation
- [ ] `useUpdateExpense()` - mutation
- [ ] `useSubmitExpense()` - mutation
- [ ] `useApproveExpense()` - mutation
- [ ] `useRejectExpense()` - mutation

### Receipt Upload
- [ ] Create `uploadReceipt(file, userId, expenseId)` function
- [ ] Validate file type (jpg, png, pdf)
- [ ] Validate file size (max 10MB)
- [ ] Generate unique storage path
- [ ] Upload to Firebase Storage
- [ ] Return download URL
- [ ] Handle upload progress
- [ ] Handle upload errors

### Expense List Page
- [ ] Create `src/pages/finance/ExpensesPage.tsx`
- [ ] Implement expense table/cards
- [ ] Add status filter (all, pending, approved, rejected)
- [ ] Add date range filter
- [ ] Add category filter
- [ ] Add search by description
- [ ] Show different views for different roles:
  - [ ] Employee: own expenses only
  - [ ] Finance Manager: all expenses
  - [ ] Project Manager: project expenses only (no sensitive data)
- [ ] Add pagination

### Expense Detail Page
- [ ] Create `src/pages/finance/ExpenseDetailPage.tsx`
- [ ] Display expense details
- [ ] Show receipt preview (image/PDF)
- [ ] Show approval history
- [ ] Show comments thread
- [ ] Show action buttons based on status and role

### New Expense Form
- [ ] Create `src/pages/finance/NewExpensePage.tsx`
- [ ] Amount input with currency
- [ ] Category dropdown
- [ ] Project dropdown (optional)
- [ ] Description textarea
- [ ] Date picker
- [ ] Receipt upload with preview
- [ ] Form validation with Zod
- [ ] Save as draft option
- [ ] Submit for approval option

### Approval Workflow
- [ ] Create `src/pages/finance/ApprovalsPage.tsx` (Finance only)
- [ ] List pending expenses
- [ ] Quick approve/reject actions
- [ ] Bulk approve option
- [ ] Show expense details inline
- [ ] Implement approve with notification
- [ ] Implement reject with required reason
- [ ] Implement "needs more info" with comment
- [ ] Create audit log entries

### Budget Tracking
- [ ] Create budget summary component
- [ ] Track budget per project
- [ ] Track budget per category
- [ ] Show budget vs actual
- [ ] Alert at 80%, 90%, 100% thresholds
- [ ] Visualize with charts

### Financial Reports
- [ ] Create `src/pages/finance/ReportsPage.tsx`
- [ ] Monthly expense summary
- [ ] Category breakdown (pie chart)
- [ ] Project cost analysis
- [ ] Trend charts (line chart)
- [ ] Implement PDF export (jsPDF)
- [ ] Implement Excel export (SheetJS)
- [ ] Date range selection

### Sensitive Data Protection
- [ ] Verify project managers cannot see:
  - [ ] Expenses from other projects
  - [ ] Overall company financials
  - [ ] Profit margins
  - [ ] Billing rates
- [ ] Only show aggregated data to project managers
- [ ] Hide sensitive columns in reports

---

## Testing Requirements

- [ ] Test expense CRUD operations
- [ ] Test approval workflow transitions
- [ ] Test receipt upload
- [ ] Test permission checks
- [ ] Test project-scoped access
- [ ] Test report generation
- [ ] Test export functionality

---

## Acceptance Criteria

- [ ] Users can submit expenses with receipts
- [ ] Receipts upload to Firebase Storage
- [ ] Finance managers see approval queue
- [ ] Approve/reject workflow works
- [ ] Rejection requires reason
- [ ] Notifications sent on status changes
- [ ] Reports export to PDF/Excel
- [ ] Project managers can only see their project expenses
- [ ] Project managers cannot see sensitive financial data
- [ ] Audit logs capture all actions
