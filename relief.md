
RELIEFNET — Objectives Analysis, Architecture, Design System & API Plan
Oct 14, 2026 · @Sudo

1. Analysis of the objectives
   The objectives describe a solid 6-role, 2-platform system; the main fixes are numbering errors, a missing offline/verification path for field reporting, and no stated security, data-privacy or performance objectives. Scope is realistic for a capstone if payments are limited to one gateway (GCash/Maya via PayMongo) and SMS is optional.
   What is strong
   • Clear role separation (Resident, Donor, Purok President, Barangay Admin, Super Admin) that maps directly to permissions and screens.
   • Full relief lifecycle is covered: report → verify (purok) → confirm (barangay) → prioritize → distribute → record beneficiaries → report to LGU.
   • Transparency is built in (5.4 beneficiary records, 9.3 signed distribution reports, 3.5 donor can track distribution).
   • Evaluation criteria (functionality, usability, accuracy) line up with ISO/IEC 25010, which examiners expect.
   Issues to fix in the document

Problem
Suggested fix
10
Sub-items are numbered 9.1–9.4 under objective 10
Renumber to 10.1–10.4
9.3
Typo "signatoore"
"with e-signature of the receiving beneficiary and releasing officer"
6.2
"operations from / Different barangays" split across two lines
Merge into one sentence
5.2
"Prioritize request" and the "and" after 5.2 when 5.4 exists
"Prioritize requests"; move "and" to 5.3
1
"Purok President" listed as a user type but "Admin" (barangay) and "Super Admin" not defined
Add one sentence defining each role and its scope (purok, barangay, multi-barangay)
4.6
Statuses listed only for households
Define one status vocabulary for reports, requests, donations and households (see Design System)
7
"Manage donation inventory" has no owner
Assign to Barangay Admin; add stock-in, stock-out, expiry and low-stock alert
9
"notifications with sound alert"
Specify channels: in-app, push (mobile), SMS for residents without data
8
Dashboard lacks a map
Add "8.3 Map view of affected areas and incident pins" since 2.1 already captures locations
11
No security or reliability criteria
Add 11.4 Security (role access, data privacy under RA 10173) and 11.5 Reliability (works on weak connections)
Gaps the objectives should add
• Offline-first incident reporting: field reports during typhoons happen with no signal; queue and sync when online.
• Duplicate handling: several residents report the same flood; purok president merges reports into one incident.
• Donation matching: link a donor's pledge to a specific request or incident, not only to a barangay.
• Audit log for every status change (who, when) to back the transparency claim.
• Resident identity verification (household ID / barangay clearance) to stop fake assistance requests.
Consolidated requirements matrix
Capability
Resident
Donor
Purok Pres.
Brgy Admin
Super Admin
Report incident with photos + location
Create
View
Verify, merge
Confirm
View
Request relief / emergency assistance
Create, track
View
Prioritize households
Prioritize, approve
View
Donate (cash, in-kind, schedule delivery/pick-up)
—
Create, track
—
Receive, acknowledge
View
Donation inventory (stock-in/out, expiry)
—
—
—
Manage
View
Distribution and beneficiary records
View own
View summary
Record
Manage, sign
View
Household status (waiting / ongoing / completed)
View own
—
Update
Update
View
Dashboard (reports, donations, map)
Own barangay
Public summary
Own purok
Own barangay
All barangays
Notifications (in-app, push, SMS)
Yes
Yes
Yes
Yes
Yes
Reports (incident, received, distribution, printable)
—
Receipts
Purok summary
Generate, print
Consolidated
User and barangay management
Own profile
Own profile
Own profile
Users in barangay
Barangays + admins
2. System architecture
A single Laravel REST API serves both the Flutter mobile app and the React web portal; every role, screen and report is just a different view over the same eight modules. The stack below is an assumption chosen for a Philippine capstone (common tooling, free tiers, GCash support); Node/Express + React Native is a drop-in alternative with the same API contract.
Clients never talk to MySQL or external services directly; the API owns all writes, which is what makes the audit log and transparency reports trustworthy.
Core data model
Entity
Key fields
Relations
barangays
id, name, municipality, geo bounds
has many puroks, users
puroks
id, barangay_id, name
has many households
users
id, role (super_admin, admin, purok_president, resident, donor), barangay_id, purok_id, verified_at
belongs to barangay
households
id, purok_id, head_user_id, address, members_count, priority_level, status
has many requests, distributions
incidents
id, reporter_id, barangay_id, purok_id, type, description, lat, lng, affected_area, status, confirmed_by
has many photos, requests
incident_photos
id, incident_id, url, taken_at
—
relief_requests
id, household_id, incident_id, type (food, water, medicine, evacuation), urgency, status, prioritized_by
—
donations
id, donor_id, barangay_id, incident_id, kind (cash, in_kind), amount, items[], delivery_method, scheduled_at, payment_ref, status
has many inventory_movements
inventory_items
id, barangay_id, name, unit, qty_on_hand, expiry_date, low_stock_level
has many inventory_movements
inventory_movements
id, item_id, qty, direction (in, out), donation_id, distribution_id
—
distributions
id, barangay_id, household_id, items[], released_by, received_by, signature_url, released_at
—
notifications
id, user_id, channel (in_app, push, sms), title, body, read_at
—
audit_logs
id, user_id, entity, entity_id, action, before, after, created_at
—
Status vocabulary (one set for the whole system)
Entity
States, in order
Incident
reported → verified (purok) → confirmed (barangay) → resolved; or rejected / merged
Relief request
submitted → prioritized → ongoing → completed; or declined
Donation
pledged → paid or received → allocated → distributed
Household assistance
waiting → ongoing → completed
Core workflows

1. Incident: resident submits report with photos and pin (queued offline if no signal) → purok president verifies households and merges duplicates → barangay admin confirms → dashboard and map update → push/SMS to affected purok.
2. Relief: resident or purok president files request → barangay admin prioritizes by household priority level → distribution recorded with e-signature → inventory decremented → household marked completed → resident and donor notified.
3. Donation: donor picks barangay/incident, type and delivery method → cash goes through PayMongo (webhook marks paid) → in-kind is scheduled for pick-up or delivery → admin acknowledges and stocks into inventory → donor sees allocation and distribution status.
   Cross-cutting rules
   • Role-based access enforced by Laravel policies; every mutation writes an audit_logs row.
   • Mobile app stores drafts in SQLite and syncs on reconnect with an idempotency key per report.
   • Photos are resized client-side to ≤ 1 MB before upload to save data.
   • All background work (push, SMS, PDF generation, webhook processing) runs on Redis queues so requests stay under 300 ms.
4. Design system
   RELIEFNET is used in the rain, on cheap phones, by stressed people, so the design system optimizes for large tap targets, high contrast, one action per screen, and status colors that mean the same thing everywhere. Build it once as design tokens shared by Flutter (ThemeData) and React (CSS variables / Tailwind config).
   Brand and color tokens
   Token
   Value
   Use
   primary
   #1565C0 (blue)
   Buttons, links, active nav, map incident pins
   primary-dark
   #0D47A1
   Pressed state, headers
   accent
   #FF8F00 (amber)
   Donation CTAs, highlights
   status-reported
   #757575 (gray)
   New, unverified
   status-verified
   #1E88E5 (blue)
   Verified by purok
   status-ongoing
   #F9A825 (amber)
   Prioritized / in progress
   status-completed
   #2E7D32 (green)
   Completed / distributed
   status-rejected
   #C62828 (red)
   Rejected, declined, emergency
   surface
   #FFFFFF / #121212 (dark)
   Cards and screens
   background
   #F5F7FA / #1E1E1E (dark)
   Page background
   text-primary
   #212121 / #FAFAFA
   Body text
   text-secondary
   #616161 / #BDBDBD
   Captions, timestamps
   Keep a 4.5:1 contrast ratio on all text; never use color alone for status, always pair it with the status word and an icon.
   Typography (Inter on web, Roboto on Android; both free)
   Style
   Size / weight
   Where
   Display
   28 / 700
   Dashboard counts
   H1
   24 / 600
   Screen titles
   H2
   20 / 600
   Card titles, section heads
   Body
   16 / 400
   Default text; never below 14 on mobile
   Label
   14 / 500
   Form labels, chips, tabs
   Caption
   12 / 400
   Timestamps, helper text
   Spacing, shape, motion
   • 8-pt grid: 4, 8, 16, 24, 32. Screen padding 16 on mobile, 24 on web.
   • Corner radius 12 for cards, 8 for inputs and buttons, full round for chips.
   • Minimum tap target 48 x 48 dp; primary button full-width at the bottom of mobile forms.
   • Elevation: flat cards with a 1 px border; one shadow level only for floating action button and dialogs.
   • Motion: 200 ms ease-out for transitions; no animation on lists longer than 20 items.
   Component library
   Component
   Variants
   Notes
   Button
   primary, secondary, danger, text; loading state
   Danger reserved for reject/decline and SOS
   Status chip
   reported, verified, ongoing, completed, rejected
   Same colors as tokens; icon + word
   Incident card
   compact (list), full (detail)
   Photo thumbnail, type icon, purok, time ago, status chip
   Request card
   household name, urgency bar, status chip
   Urgency bar uses amber to red
   Donation card
   cash vs in-kind badge, amount or item list, delivery chip
   Donor sees allocation progress bar
   Household row
   name, members, priority level, assistance status
   Purok president list view
   Map view
   pins by incident type, cluster at zoom-out, affected-area polygon
   Legend fixed bottom-left
   Photo uploader
   multi-select, compress, progress, retry
   Max 5 photos per report
   Signature pad
   draw, clear, confirm
   Stores PNG; shown on distribution receipt
   Stepper
   2 to 4 steps
   Donation flow, report flow
   Stat tile
   count, label, delta vs last 7 days
   Dashboard top row
   Data table (web)
   sortable, filter chips, export CSV/PDF
   Admin lists and reports
   Empty state
   illustration, one-line message, one CTA
   "No reports in your purok yet"
   Offline banner
   yellow strip, pending count, "will sync"
   Shown on mobile when queue is not empty
   Toast / alert
   success, warning, error; sound on critical
   Sound only for new incident in your area or SOS
   Role-specific navigation
   Role
   Bottom tabs (mobile) or sidebar (web)
   Resident
   Home (alerts), Report, My requests, Profile
   Donor
   Needs, Donate, My donations, Profile
   Purok President
   Reports, Households, Record distribution, Profile
   Barangay Admin (web)
   Dashboard, Incidents, Requests, Donations, Inventory, Distribution, Reports, Users
   Super Admin (web)
   Overview, Barangays, Admins, Consolidated reports, Settings
   Writing style in the UI
   • Plain English with Filipino labels where the LGU prefers (support en and fil string files from day one).
   • Status verbs in past tense on timelines ("Verified by Purok 3 President, 2:14 PM").
   • Errors say what to do next ("No signal. Your report is saved and will send when you are back online.").
5. API plan
   One versioned REST API (/api/v1) with 46 endpoints across 9 modules covers every objective; the mobile and web clients use the same contract, so build and test the API first.
   Conventions
   • Base URL https://api.reliefnet.ph/api/v1; JSON request and response; UTC timestamps in ISO 8601.
   • Auth: Authorization: Bearer <token></token> (Laravel Sanctum); tokens scoped per device so logout on one phone does not log out the web.
   • Roles enforced server-side: every list endpoint is automatically filtered to the caller's purok or barangay unless the role is super_admin.
   • Responses: { "data": ..., "meta": { "page", "per_page", "total" } }; errors { "message", "errors": { field: [..] } } with standard codes 400, 401, 403, 404, 422, 429, 500.
   • Pagination ?page=&per_page= (max 100); filtering ?status=&purok_id=&from=&to=; sorting ?sort=-created_at.
   • Idempotency: Idempotency-Key header required on POST /incidents, /relief-requests and /donations so offline retries never create duplicates.
   • Rate limit 60 requests/minute per user; 10/minute on login and OTP.
   • File uploads as multipart/form-data, images only (jpg, png, webp), max 5 MB each, 5 per incident.
   Endpoint catalog
   Module
   Method and path
   Who
   Objective
   Auth
   POST /auth/register
   Public (resident, donor)
   1
   Auth
   POST /auth/login · POST /auth/logout · POST /auth/refresh
   All
   1
   Auth
   POST /auth/otp/send · POST /auth/otp/verify
   Public
   1
   Auth
   GET /me · PATCH /me · POST /me/device-token
   All
   1, 9
   Users
   GET /users · POST /users · PATCH /users/{id} · DELETE /users/{id}
   Admin (own barangay), Super Admin
   1
   Users
   POST /users/{id}/verify
   Admin, Purok President
   1
   Barangays
   GET /barangays · POST /barangays · PATCH /barangays/{id}
   Super Admin
   6.1
   Barangays
   GET /barangays/{id}/puroks · POST /barangays/{id}/puroks
   Admin, Super Admin
   6.1
   Households
   GET /households · POST /households · PATCH /households/{id}
   Purok President, Admin
   4.2, 4.4
   Households
   PATCH /households/{id}/status
   Purok President, Admin
   4.6
   Households
   PATCH /households/{id}/priority
   Purok President, Admin
   4.4, 5.2
   Incidents
   GET /incidents · GET /incidents/{id}
   All (scoped)
   2.3, 3.1, 4.1, 8.1
   Incidents
   POST /incidents (multipart: photos[], lat, lng, affected_area)
   Resident
   2.1
   Incidents
   POST /incidents/{id}/photos
   Resident (owner)
   2.1
   Incidents
   POST /incidents/{id}/verify · POST /incidents/{id}/merge
   Purok President
   4.3
   Incidents
   POST /incidents/{id}/confirm · POST /incidents/{id}/reject
   Admin
   5.1
   Incidents
   GET /incidents/map?bbox=
   All
   8
   Relief requests
   GET /relief-requests · GET /relief-requests/{id}
   All (scoped)
   2.3, 3.1
   Relief requests
   POST /relief-requests
   Resident, Purok President
   2.2
   Relief requests
   PATCH /relief-requests/{id}/prioritize
   Admin
   5.2
   Relief requests
   PATCH /relief-requests/{id}/status
   Admin, Purok President
   4.6, 5.3
   Donations
   GET /donations · GET /donations/{id}
   Donor (own), Admin, Super Admin
   3.5, 8.2
   Donations
   POST /donations (kind, items[], delivery_method, scheduled_at)
   Donor
   3.2, 3.3
   Donations
   POST /donations/{id}/checkout → returns PayMongo checkout URL
   Donor
   3.4
   Donations
   POST /webhooks/paymongo
   PayMongo (signed)
   3.4
   Donations
   PATCH /donations/{id}/schedule · POST /donations/{id}/receive
   Donor / Admin
   3.3, 5.3
   Donations
   GET /donations/{id}/tracking
   Donor
   3.5
   Inventory
   GET /inventory · POST /inventory · PATCH /inventory/{id}
   Admin
   7
   Inventory
   POST /inventory/{id}/movements (in/out, qty, ref)
   Admin
   7
   Inventory
   GET /inventory/low-stock · GET /inventory/expiring
   Admin
   7
   Distribution
   GET /distributions · POST /distributions (items[], household_id)
   Admin, Purok President
   4.5, 5.3
   Distribution
   POST /distributions/{id}/signature (image)
   Admin, Purok President
   9.3
   Distribution
   GET /distributions/beneficiaries?incident_id=
   Admin, Super Admin, Donor (summary)
   5.4
   Dashboard
   GET /dashboard/summary · GET /dashboard/timeline
   All (scoped)
   8.1, 8.2
   Notifications
   GET /notifications · PATCH /notifications/{id}/read · POST /notifications/broadcast
   All / Admin
   9
   Reports
   GET /reports/incidents?format=pdf|csv
   Admin, Super Admin
   10.1
   Reports
   GET /reports/donations-received
   Admin, Super Admin
   10.2
   Reports
   GET /reports/distribution?incident_id= (with signatures)
   Admin, Super Admin
   10.3, 10.4
   Reports
   GET /reports/consolidated?barangay_ids=
   Super Admin
   6.2
   Audit
   GET /audit-logs?entity=&entity_id=
   Admin, Super Admin
   transparency
   Sample contracts
   POST /api/v1/incidents  (multipart)
   type=flood  description="Water waist-deep along Purok 3 road"
   lat=10.3157  lng=123.8854  affected_area="Purok 3, Sitio Mabolo"
   photos[]=<file></file>  photos[]=<file></file>
   Idempotency-Key: 7f3a-...

201 Created
{ "data": { "id": 412, "status": "reported", "purok_id": 3,
  "photos": [{ "url": "https://cdn.../412-1.jpg" }],
  "created_at": "2026-10-14T08:58:00Z" } }
POST /api/v1/donations
{ "kind": "cash", "amount": 1500, "currency": "PHP",
  "barangay_id": 7, "incident_id": 412 }

201 Created
{ "data": { "id": 88, "status": "pledged",
  "checkout_url": "https://checkout.paymongo.com/..." } }
Realtime and notification events (queued jobs, delivered via FCM push, in-app, and SMS for residents flagged prefers_sms)
Event
Recipients
Channel
incident.confirmed
Residents in affected purok, purok president
Push with sound, SMS
request.prioritized / request.completed
Requesting household
Push, SMS
donation.paid / donation.received
Donor, barangay admin
Push, in-app
donation.distributed
Donor
Push
inventory.low_stock
Barangay admin
In-app, email
broadcast.alert (typhoon signal, evacuation)
Everyone in barangay
Push with sound, SMS
For the live dashboard, use Laravel Reverb (WebSockets) or 15-second polling; polling is enough for a capstone demo.
Third-party APIs to prepare
Service
Why
What you need
PayMongo
GCash, Maya, card payments; webhooks
Business account, public + secret keys, webhook secret; test mode first
Firebase Cloud Messaging
Push notifications to Android/iOS
Firebase project, google-services.json, server key
Semaphore (or Twilio)
SMS alerts
Account, API key, sender name; approx. PHP 0.50 to 1.00 per SMS
Google Maps Platform
Map, geocoding, Places autocomplete
API key restricted by app package / domain
AWS S3 or Cloudinary
Photo and signature storage
Bucket + IAM key, or Cloudinary cloud name/key
Resend or Mailgun
Email for OTP and admin reports
API key, verified domain
PhilSMS / PAGASA RSS (optional)
Pull official weather bulletins into alerts
Public RSS feed, no key
Security checklist
• HTTPS only; HSTS; CORS limited to the web portal domain.
• Passwords hashed with bcrypt; OTP for resident registration via SMS.
• Verify PayMongo webhook signatures; never trust amount from the client.
• Signed, time-limited URLs for photos and signatures.
• Store only what RA 10173 (Data Privacy Act) allows; add a privacy notice at registration and a data-export/delete endpoint for residents.
5. Development roadmap and evaluation
Build in six two-week sprints, API first, so a working incident-to-distribution flow exists by sprint 3 and the remaining sprints add donations, reports and polish. Dates are left open until you confirm your defense schedule.
Sprints

1. Foundation: repo, CI, Laravel project, MySQL schema and migrations, auth with roles, barangay/purok/household CRUD, design tokens in Flutter and React.
2. Incidents: report with photos and map pin (mobile), offline queue, purok verify/merge, admin confirm, push notification with sound, dashboard counts and map.
3. Relief and distribution: requests, prioritization, household status, distribution record with e-signature, inventory in/out, audit log.
4. Donations: donor flow (cash via PayMongo test mode, in-kind with schedule), webhook, receive and stock-in, donor tracking screen.
5. Reports and admin: incident, donations-received, distribution (with signatures) and consolidated reports as PDF/CSV; Super Admin multi-barangay management; SMS channel.
6. Hardening and evaluation: load test, security review, usability testing with real residents and barangay staff, bug fixes, deployment, user manual.
   Team split (3 to 4 members)
   Role
   Owns
   Backend lead
   Laravel API, database, queues, integrations
   Mobile dev
   Flutter app, offline sync, push, camera and map
   Web dev
   React portal, dashboard, reports, data tables
   QA / documentation
   Test cases, evaluation instruments, chapters 3 to 5
   Evaluation plan (ISO/IEC 25010)
   Criterion
   How to measure
   Instrument
   Functionality
   Every endpoint and screen passes its test case; count passed / total per objective 1 to 10
   Test-case checklist signed by adviser; automated API tests (PHPUnit)
   Usability
   Residents, purok presidents and admins complete 5 core tasks; time on task and errors
   System Usability Scale (10 items) with at least 30 respondents, target mean greater than 70
   Accuracy
   Reports match raw records: donation totals, beneficiary counts, inventory balance, map pin position within 20 m
   Reconciliation sheet comparing report output vs database for 3 sample incidents
   Security (recommended 11.4)
   Role bypass attempts fail; data privacy notice present
   OWASP ZAP scan; manual role tests
   Reliability (recommended 11.5)
   Reports queued offline sync without loss
   Airplane-mode test with 20 queued reports
   Open questions for you
   [ ] Which barangay or LGU will pilot the system, and will they allow real household data?
   [ ] Is a PayMongo business account possible, or should cash donations stay as pledge plus bank/GCash reference number?
   [ ] Android only, or do you also need iOS and a budget for an Apple developer account?
   [ ] Confirm the stack (Laravel + Flutter + React) or switch to Node + React Native.

---

6. Implementation notes — Oct 15, 2026 (appendix; records how the build deviates from or extends the plan above)

   Architecture as built
   • Single Laravel + Inertia.js (React) web application, not the REST /api/v1 + Flutter mobile split planned in section 2. Session auth (Breeze) instead of Sanctum tokens. The API plan in section 5 remains valid future work if a mobile client is added.
   • Map is Leaflet + OpenStreetMap (free, no key) instead of Google Maps Platform.
   • Realtime via Laravel Reverb (WebSockets); PDF via dompdf; queues via database driver.

   Status vocabulary as shipped (replaces the table in section 2)
   • Incident: reported → verified (purok) → confirmed (barangay) → resolved; or rejected / merged (merged reports carry merged_into_id pointing at the surviving incident).
   • Relief request: pending → verified → approved → fulfilled; or rejected.
   • Donation: pending → confirmed → delivered → distributed (cash is marked paid by the PayMongo webhook before confirmed).
   • Household assistance: waiting → ongoing → completed (matches the plan).

   Design system as shipped
   • shadcn/ui on Tailwind v3; every token from section 4 lives as CSS variables in resources/css/app.css (light + dark), consumed through tailwind.config.js.
   • Status chips always pair icon + word (StatusBadge); donation CTAs use the amber accent; 48 px tap targets on mobile form buttons; Inter typeface; persisted dark-mode toggle.

   Gap fixes from section 1, all implemented
   • Offline-first reporting: drafts queue in localStorage, offline banner shows the pending count, auto-resubmit on reconnect (photos are not queued — attach after sync).
   • Duplicate handling: purok president merges a duplicate into the surviving incident; its assistance requests and donations follow; audit trail records the merge.
   • Donation matching: donations optionally link to an active incident (disaster_report_id), validated to the chosen barangay.
   • Audit log: activity_logs on every mutation (LogsActivity trait) plus report_status_histories for the incident timeline.
   • Resident verification: household verification by the purok president; account restriction by the Super Admin.

   Notifications as shipped
   • In-app bell + WebAudio sound alert, realtime via Reverb.
   • SMS via Semaphore for confirmed incidents, sent to residents of the affected purok who opted in (prefers_sms + mobile number in Profile). Without SEMAPHORE_API_KEY the pipeline logs instead of sending, so demos cost nothing. Push/FCM remains future work (no mobile app).

   Languages
   • en/fil string catalog shipped (resources/js/lib/i18n.jsx) with an EN⇄FIL toggle in the header; navigation, status vocabulary, the resident report flow and the offline banner are translated, and untranslated strings fall back to English.

   Extras beyond the plan
   • Super Admin Access Control matrix (module on/off and full/view per role), account restriction/restore, ISO 25010 evaluation module with CSV export, client-side photo compression to ≤1 MB, image re-encoding server-side, signed time-limited signature URLs.
