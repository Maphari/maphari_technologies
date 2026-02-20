# Project Request End-to-End Checklist

Use this checklist to validate the full client-to-delivery workflow across Client, Admin, and Staff dashboards.

## 1. New User Onboarding Tours
- [ ] Login as a brand-new `CLIENT`; onboarding tour appears once.
- [ ] Login as a brand-new `ADMIN`; onboarding tour appears once.
- [ ] Login as a brand-new `STAFF`; onboarding tour appears once.
- [ ] Tour can be dismissed and does not reappear immediately on refresh.

## 2. Client Request Creation
- [ ] Open Client Dashboard -> `Projects` -> `Request New Project`.
- [ ] Complete wizard step-by-step and verify `Next` is disabled until required fields are valid.
- [ ] Download agreement template.
- [ ] Upload signed agreement in `Project Files`.
- [ ] Select uploaded signed agreement in step 4.
- [ ] Check required acknowledgment: domain/hosting and third-party costs are client-paid.

## 3. Estimate + Deposit Gate (50%)
- [ ] Click `Review Estimate & Terms` and confirm estimate modal shows:
- [ ] Estimated total.
- [ ] 50% deposit amount.
- [ ] 30% milestone amount.
- [ ] 20% final amount.
- [ ] Confirm request generates deposit invoice/payment records.
- [ ] Request is submitted only after deposit is confirmed.

## 4. Admin Queue Intake + Assignment
- [ ] Open Admin Dashboard -> `Clients & Projects`.
- [ ] New request appears in `Project Requests Queue`.
- [ ] Request row shows agreement/deposit/request details.
- [ ] Add decision note.
- [ ] Manual assignment: select one or more staff users.
- [ ] Auto assignment: click `Auto pick free staff` and verify selection updates.
- [ ] Approve request and verify project status moves forward.
- [ ] Reject path works and logs decision reason.

## 5. Staff Visibility and Work Start
- [ ] Assigned staff can see the approved project in Staff dashboard.
- [ ] Unassigned staff do not see unauthorized project details.
- [ ] Staff can update progress/milestones according to permissions.

## 6. Milestone Payment Controls (30% + Final 20%)
- [ ] In Admin queue, mark 30% payment with invoice/payment IDs.
- [ ] In Admin queue, mark final 20% payment with invoice/payment IDs.
- [ ] Status badge text updates (`pending` -> `paid`) correctly.
- [ ] Attempt handoff before final 20% is blocked.
- [ ] Handoff after final 20% is allowed.

## 7. Change Request Flow with Pricing Uplift
- [ ] Client submits change request from `Projects` tab.
- [ ] Admin reviews and approves estimated change request.
- [ ] If priced (`estimatedCostCents > 0`), client approval requires:
- [ ] Signed addendum file selection.
- [ ] Additional payment invoice ID.
- [ ] Additional payment ID.
- [ ] Client can reject change request.

## 8. Document Center and Auditability
- [ ] Client `Document Center` lists agreement/addendum files.
- [ ] Admin `Document Center` shows contract docs and queue counters.
- [ ] Records persist across refresh/session.

## 9. Messaging / Thread Routing Regression Check
- [ ] In Client Messages tab, empty state (`No threads yet.`) renders correctly.
- [ ] Message thread assignment still routes by project/client context after backend assignment changes.

## 10. Cross-Browser Smoke
- [ ] Safari (latest stable on macOS): top nav + styles render correctly.
- [ ] Chrome (latest stable): same flows behave identically.
- [ ] Verify no missing CSS/modules in either browser.

## 11. API and Validation Checks
- [ ] Backend rejects request submission without signed agreement file ID.
- [ ] Backend rejects request submission without verified deposit payment.
- [ ] Backend enforces payment checkpoint logic for completion/handoff.

## 12. Recommended Test Accounts
- [ ] `client_new` (fresh onboarding)
- [ ] `client_existing` (has active project)
- [ ] `admin_ops`
- [ ] `staff_available_1`, `staff_available_2`, `staff_busy`

## 13. Exit Criteria
- [ ] All checklist items pass in local/staging.
- [ ] No console errors in major flows.
- [ ] No blocking lint/type errors in touched apps/services.
