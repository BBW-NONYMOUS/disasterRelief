# ReliefNet QA Report (running)

- App under test: http://localhost:8000 (Laravel `php artisan serve`, MySQL `reliefnetdb`, database queue with an external worker)
- Date: 2026-10-15
- Method: The live app was driven over HTTP exactly as the Inertia SPA calls it (session cookie, XSRF token, `X-Inertia` headers, Referer). Results were checked against the database and `storage/logs/laravel.log`.
- Limitation: No browser automation was available. Visual rendering, JS console errors and button wiring in the React UI are **NOT TESTED** yet.

## Test accounts (password `password`)

| Role | Account | Scope |
|---|---|---|
| Super Admin | superadmin@reliefnet.test | all |
| Admin | admin@reliefnet.test | Barangay Poblacion (1) |
| Admin | admin2@reliefnet.test | Barangay San Isidro (2) |
| Purok President | purok@reliefnet.test | Purok 1 / Brgy 1 |
| Resident | resident@reliefnet.test | Purok 1 / Brgy 1 |
| Donor | donor@reliefnet.test | none |

## QA test records created

- Assistance request #2: food, "QA-TEST food request …". Now **approved**.
- Assistance request #3: food, "QA mismatch", purok 2. Still **pending**.
- Assistance request #4: water, "QA-TEST reject path …". Now **rejected**.
- No donations were created (blocked, see BUG-001).

## Role / page access matrix (observed HTTP results)

| Page | Super Admin | Admin | Purok Pres. | Resident | Donor | Guest |
|---|---|---|---|---|---|---|
| dashboard | 200 | 200 | 200 | 200 | 200 | → login |
| assistance-requests (list) | 200 | 200 (own brgy) | 200 (own purok) | 200 (own) | 200 (approved, anonymized) | → login |
| assistance-requests/create | 403 | 403 | 403 | 200 | 403 | → login |
| disaster-reports (list) | 200 | 200 | 200 | 200 | 200 | → login |
| disaster-reports/create | 403 | 403 | 200 | 200 | 403 | → login |
| donations (list) | 200 | 200 | 403 | 403 | 200 (own) | → login |
| donations/create | 403 | 403 | 403 | 403 | 200 | → login |
| households | 200 | 200 | 200 | 403 | 403 | → login |
| inventory | 200 | 200 | 403 | 403 | 403 | → login |
| distributions | 200 | 200 | 200 | 403 | 403 | → login |
| users | 200 | 200 | 403 | 403 | 403 | → login |
| barangays / puroks | 200 | 403 | 403 | 403 | 403 | → login |
| evaluations (list) | 200 | 403 | 403 | 403 | 403 | → login |
| evaluations/create | 200 | 200 | 200 | 200 | 200 | → login |
| reports | 200 | 200 | 403 | 403 | 403 | → login |
| activity-logs / access-control | 200 | 403 | 403 | 403 | 403 | → login |
| profile | 200 | 200 | 200 | 200 | 200 | → login |

## Results

| ID | Role | Scenario | Status |
|---|---|---|---|
| AUTH-001 | All 5 roles | Login lands on the role-specific dashboard | PASS |
| AUTH-002 | Guest | Every protected page redirects to /login | PASS |
| VAL-001 | Resident | Empty request form gives 5 required-field errors | PASS |
| VAL-002 | Resident | Quantity 0, bad type and bad urgency are rejected | PASS |
| E2E-001 | Resident → Purok Pres. → Admin → Resident | Submit (pending), verify (verified, priority high, verifier recorded), approve (approved, approver recorded); resident sees status and remarks after re-login | PASS |
| E2E-001N | Resident | Notifications for "now Verified" and "now Approved" were delivered (asynchronously, about 3–4 s through the queue) | PASS |
| E2E-002 | Purok Pres. | Reject without a reason is blocked ("Give a reason…"); reject with a reason sets status to rejected and the resident sees the remarks and gets a notification | PASS |
| TRN-001 | Admin | Re-approving an approved request is refused with an error flash; status unchanged | PASS |
| TRN-002 | Admin | Approving a rejected request is refused | PASS |
| SEC-001 | Resident | POST approve on own request returns 403 | PASS |
| SEC-002 | Donor | Opening a pending request returns 403 | PASS |
| SEC-004 | Admin (brgy 2) | View or approve a brgy 1 request returns 403 | PASS |
| SEC-005 | Resident | Delete permission is removed once the request is approved | PASS |
| PRIV-001 | Donor | Approved-request list and detail are anonymized: no requester, household, goods text or remarks | PASS |
| DON-VAL-1..3 | Donor | Empty form, goods with no items, past schedule date, cash < 100 cents are all rejected | PASS |
| **DON-001** | Donor | Submit a valid **goods** donation | **FAIL – HTTP 500** |
| **DON-002** | Donor | Submit a valid **cash** pledge | **FAIL – HTTP 500** |
| DON-003..007, SEC-D1..D4 | Donor/Admin | Receive, partial receive, duplicate receive, inventory, notifications, cross-barangay, webhook | BLOCKED by BUG-001 |

## Defects

### BUG-001: Every donation submission fails with HTTP 500 (Critical)
- **Steps:** Log in as donor@reliefnet.test, open Donations, then Create. Add 1 item (20 pack "QA-TEST rice") with delivery "deliver", then submit. A cash pledge of ₱500 fails the same way.
- **Expected:** The donation is saved and the donation page shows "Donation recorded. Thank you!"
- **Actual:** HTTP 500. Nothing is saved; the donor's history is unchanged.
- **Evidence:** `laravel.log` 2026-10-15 05:19:04 shows `SQLSTATE[42S22]: Column not found: 1054 Unknown column 'disaster_report_id' in 'field list' … insert into donations`.
- **Root cause:** `php artisan migrate:status` shows 3 **Pending** migrations. The code already uses their columns:
  - `2026_10_15_100001_add_disaster_report_to_donations_table` (`donations.disaster_report_id`): breaks donation create.
  - `2026_10_15_100002_add_merge_support_to_disaster_reports_table` (`merged_into_id`, `merged_at`): will break disaster-report **merge**.
  - `2026_10_15_100003_add_prefers_sms_to_users_table` (`users.prefers_sms`): expected to break **profile update**, user create/edit and the `SendDisasterSmsAlerts` job (it queries `prefers_sms`). Not yet observed.
- **Fix:** Run `php artisan migrate`. It only adds nullable or defaulted columns, so it is low risk and each migration has a `down()`. No code change is needed.
- **Retest:** Repeat DON-001 and DON-002, then continue DON-003..007 and SEC-D1..D4.

### OBS-001: Payment webhook accepts unsigned requests outside production (Low / config risk)
- An unsigned POST to `/webhooks/payment` returned `200 OK`. The log says "PayMongo webhook accepted WITHOUT signature verification (no secret configured, non-production)".
- This is intentional for local development. It becomes a real hole if a staging or demo server runs with `APP_ENV` other than production and an empty `PAYMONGO_WEBHOOK_SECRET`: anyone could mark pledges as paid.
- **Suggestion:** Skip verification only when `APP_ENV=local` or `testing`, and require the secret everywhere else.
- Whether a forged webhook changes a donation could not be tested yet (BUG-001).

### OBS-002: A resident can file a request for a different purok in the same barangay (Informational / design question)
- The resident lives in Purok 1 but submitted request #3 for Purok 2, and it was accepted. Confirm whether that is intended (for example, reporting on behalf of a neighbour).

### OBS-003: Raw field names in validation messages (Low, UX)
- Examples: "The barangay id field is required." and "The amount cents field must be at least 100." The second one shows **cents** to a donor who types pesos.
- **Suggestion:** Add attribute names and messages in the validators or `lang/en/validation.php`, and phrase the cash minimum as "at least ₱1.00".

### OBS-004: Grammar in the transition error (Low)
- The message reads "Cannot move a Approved request to Approved." It should say "an Approved". The source is `AssistanceRequestController::transition`.

### OBS-005: Duplicate "now Resolved" notifications in existing data (Unconfirmed)
- On 2026-07-01 each official received "Landslide report … is now Resolved" twice. This could be a double-resolve. It will be checked in the disaster-report workflow tests.

## Change: Add/Edit forms open as modals (2026-10-15)

Every "+ Add …" and "Edit" link on list pages, detail pages and the dashboard now opens its form in a modal over the current page instead of navigating away. The `/…/create` and `/…/edit` URLs still work as full pages, and Ctrl/middle-click still opens them in a new tab. The backend is unchanged.

Browser-tested in Chrome as each role (16 behaviour checks + 20 link checks, all passing):
- The form opens over the page and the URL does not change.
- Validation errors appear inside the modal and the modal stays open.
- Cancel, ✕ and Escape close the modal. Clicking outside does **not** close it, so typed data is not lost by accident.
- A successful save closes the modal, refreshes the list and shows the success message.
- The disaster-report map picker works inside the modal.
- The layout works at phone width (400px).
- No console errors.

### BUG-002: Maps drew on top of dialogs (Medium) — fixed
- **Seen:** On the donor dashboard, the disaster map and its locate button covered the "Make a Donation" modal. This also affected the existing "Restrict access" modal on any page with a map.
- **Cause:** Leaflet panes use z-index 400–1000, and `DisasterMap` overlays use `z-[1000]`, which is above the dialog's `z-50`.
- **Fix:** Added `.leaflet-container { z-index: 0 }` in `app.css`, and `isolate` on the `DisasterMap` wrapper.
- **Retest:** MOD-015 and MOD-016 pass on desktop and at 400px.

### Design pass: shadcn/ui Dialog layout
- **Single surface:** the modal is one surface. The bordered form card is dropped inside a modal by `FormShell` but kept on the full page.
- **Header:** `DialogHeader`, `DialogTitle` and `DialogDescription`, with a ✕ in the corner. Each form now has a one-line description.
- **Footer:** `FormActions` becomes the dialog footer. It is pinned to the bottom of long forms and stacks the buttons full-width on phones. Cancel is the shadcn outline `Button`.
- **Overlay and frame:** 50% overlay; the modal keeps a 1rem margin and rounded corners on phones.
- DES-001 and DES-002 pass: the footer is flush with the bottom of both short and scrolling forms.

### BUG-003: Dropdowns unreadable in dark mode (Medium) — fixed
- **Seen:** native `<select>` and `<textarea>` stayed white with light text in dark mode on every form, full page and modal.
- **Cause:** `@tailwindcss/forms` sets a white background.
- **Fix:** a base style in `app.css` (`bg-card text-foreground`) plus `color-scheme: dark` on `.dark`.

## Change: Sidebar regrouped (2026-10-15)
- **Sections:** the single "Menu" list is replaced by labelled sections. Dashboard sits on its own at the top, followed by **Emergency Response**, **Relief Operations**, **Reports & Audit** and **Administration**. Sections a role has no items in are hidden.
- **Evaluate System:** pinned at the bottom, above the profile.
- **Header and profile:** both use shadcn's large menu button, so they line up in the collapsed icon view.
- **Icons:** Barangays and Puroks have distinct icons (building and map pin).
- **Active state:** the active highlight now needs an exact path match.
- **Filipino:** the section labels have Filipino translations.
- **Verified in Chrome:** every role shows exactly the same links as before, only regrouped. The active highlight is correct, there are no console errors, and the collapsed and mobile views work.

## Change: Dashboard layout rearranged (2026-10-15)
- **Stat cards:** the column count now follows the number of cards, so rows are always full:
  - Super Admin: 6 cards, 3×2.
  - Admin: 9 cards, 3×3.
  - Purok President: 5 cards, one row of 5.
  - Donor: 3 cards in a row.
  - Resident: 2 cards in a row.

  On phones an odd last card spans the full row.
- **Panels:** all panels share one grid, two per row. Empty panels are skipped and an odd last panel spans the full width, so single panels no longer sit at half width beside empty space, and the extra gap on the resident dashboard is gone.
- **List rows:** text truncates and badges keep their size.

### BUG-004: Resident dashboard scrolled sideways on phones (Low) — fixed
- **Seen:** at 400px the page was 22px wider than the screen, because a long assistance-request title pushed the status badge off-screen.
- **Retest:** horizontal overflow is 0px for all five roles at 1366px and 400px.

### OBS-006: Report rows printed a stray "·" or "." (Low) — fixed
- **Seen:** when the reporter or barangay was missing, the meta line showed "Liza Flores ·" or a lone ".". Only the parts that exist are joined now.

## Change: Profile page redesigned (2026-10-15)
- **Layout:** moved from Breeze's `AuthenticatedLayout` (no sidebar, hard-coded grey/white, broken in dark mode) to the app's `AppLayout`.
- **Arrangement:** on large screens a profile summary card sits on the left and stays in view; on the right are shadcn `Card` sections, each with a title, a description and its Save button in the footer:
  - **Profile Information:** name and email side by side; SMS alerts as a toggle row.
  - **Update Password:** new and confirm side by side.
  - **Danger Zone:** red border; the delete confirmation dialog uses the shadcn layout.

  Phones get a single column.
- **Smaller fixes:** the Name field no longer grabs focus on page load. The sidebar's profile avatar stays visible when that item is highlighted.
- **Verified in Chrome:** a wrong current password shows "The password is incorrect." inside the card. There is no sideways scroll at 1366px or 400px, and dark mode works.

### BUG-001 (update): saving the profile also fails with HTTP 500
- **Steps:** Profile, then "Save changes" without changing anything.
- **Evidence:** `Unknown column 'prefers_sms' in 'field list'`. This is the pending migration `2026_10_15_100003_add_prefers_sms_to_users_table`, as predicted under BUG-001.
- **Not caused by the redesign:** the old page sent the same field.
- **Fix:** `php artisan migrate`, which still needs approval.

## Not yet tested
Fulfill and distribution workflow; disaster-report workflow (create, verify, confirm, merge, resolve, reject, edit, delete); households (create, verify); inventory CRUD and low-stock; user management (create, restrict, restore, role-assignment limits); barangays and puroks; evaluations and export; report PDF generate and download; access control; activity logs; profile and password; mark notifications as read; logout ending the session; all browser-level UI checks.
