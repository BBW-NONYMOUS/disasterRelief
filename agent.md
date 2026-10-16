
# AGENTS.md — RELIEFNET

> **RELIEFNET: A Web-Mobile Based Disaster Monitoring and Relief Donation Management System**
>
> A platform that improves disaster information dissemination and ensures efficient, transparent management of donations and relief goods for communities.

This file guides AI coding agents (and human contributors) building RELIEFNET. Read it fully before generating code.

---

## 1. Product overview

RELIEFNET lets residents report disasters, donors give relief, barangay/purok officials verify and distribute aid, and administrators monitor everything from a dashboard. It must run as a **web + mobile** experience (responsive web app, mobile-friendly, with a native-like mobile UI).

### Core value

- Fast, accurate disaster reporting from the ground.
- Transparent donation tracking from pledge → delivery → distribution → beneficiary record.
- Consolidated reporting for LGU/barangay decision-making.

---

## 2. User roles

| Role                                                               | Scope                                                                                     |
| ------------------------------------------------------------------ | ----------------------------------------------------------------------------------------- |
| **Super Admin**                                              | Manages multiple barangay branches and their admins; consolidated cross-barangay reports. |
| **Admin (Community Administrator — LGU/Barangay Official)** | Confirms incidents, prioritizes aid, manages distribution within a barangay.              |
| **Purok President**                                          | Verifies affected households and reports within an assigned purok.                        |
| **Resident**                                                 | Reports incidents, requests assistance, tracks status.                                    |
| **Donor**                                                    | Views needs, donates, schedules delivery, tracks distribution.                            |

Every role requires account management (create, edit, deactivate, role assignment).

---

## 3. Functional requirements

### 3.1 Account management

- Manage accounts for Super Admin, Admin, Residents, Donor, Purok President.
- Role-based access control (RBAC) enforced on every route and API endpoint.

### 3.2 Residents can

- Report disaster incidents **with uploaded photos** and specified affected areas.
- Request emergency assistance and relief goods.
- View status of their reports and requests.

### 3.3 Donors can

- View disaster reports and assistance requests.
- Select donation types and delivery methods.
- Schedule donation delivery or pick-up.
- Donate through **digital payment methods**.
- View donation distribution status.

### 3.4 Purok Presidents can

- View disaster reports within their assigned purok.
- Verify affected households.
- Submit verified incident reports to barangay officials.
- Identify priority households for assistance.
- Record relief distribution activities.
- Record household status: `assistance waiting` | `ongoing` | `assistance completed`.

### 3.5 Community Administrators (LGU/Barangay) can

- Confirm reported disaster incidents.
- Prioritize requests for food and relief assistance.
- Manage donation distribution to affected households.
- Record and view beneficiaries who received donated items (transparency + proper distribution).

### 3.6 Super Admin can

- Manage multiple barangay branches and barangay administrators.
- Generate **consolidated reports** on disaster incidents, donations, and relief operations across different barangays.

### 3.7 System-wide

- Manage **donation inventory** (stock in/out, categories, quantities, expiry where relevant).
- **Dashboard** for monitoring: disaster reports & updates; donation status.
- **Notifications with sound alert** to users (new reports, status changes, distributions).
- Generate reports:
  - Disaster Incident Reports
  - Donation Received Reports
  - Donation Distribution Reports **with signature**
  - Printable reports submittable to LGU or barangay offices (PDF/print-ready).

### 3.8 Evaluation criteria (build to satisfy)

- **Functionality** — all features above work end to end.
- **Usability** — clear, mobile-first flows; minimal steps.
- **Accuracy** — data integrity across reporting, inventory, and distribution.

---

## 4. Architecture — Laravel + Inertia

**Stack:** Laravel (backend/monolith) + **Inertia.js** bridge + a single-page frontend (React or Vue). Inertia means **no separate REST API** for the app itself — controllers return Inertia responses that render frontend pages with props.

- **Backend:** Laravel (latest LTS), PHP 8.2+. Eloquent ORM, Form Requests for validation, Policies + Gates for authorization.
- **Frontend:** Inertia.js with **React + TypeScript** (or Vue 3 — pick one and stay consistent). Vite for bundling. TailwindCSS, mobile-first/responsive.
- **Starter kit:** Laravel Breeze (Inertia stack) or Jetstream (Inertia) for auth scaffolding.
- **Database:** MySQL or PostgreSQL. Use migrations, seeders, and factories.
- **Auth:** Laravel session-based auth (via Breeze/Jetstream). **No JWT needed** — Inertia rides on Laravel sessions.
- **RBAC:** Roles via `spatie/laravel-permission` (recommended) or an enum `role` column + Policies/Gates. Enforce with `can:` middleware and Policies on every controller action.
- **File storage:** Laravel Filesystem (`Storage`) — local disk in dev, S3-compatible in prod — for incident photos. Validate type/size in Form Requests.
- **Payments:** PH-friendly gateway (GCash/PayMaya via **PayMongo**, or Stripe) wrapped behind a service class / interface so it can be swapped. Handle webhooks in dedicated controllers with signature verification.
- **Notifications:** Laravel Notifications (database + broadcast channels). Real-time via **Laravel Echo + Reverb** (or Pusher). Play a **sound alert** on the client when a new broadcast arrives; always pair sound with a visual indicator.
- **Reports/Printing:** Server-side PDF via `barryvdh/laravel-dompdf` (or Spatie's `laravel-pdf` / Browsershot). Distribution report includes a **signature** field/image.
- **Queues:** Laravel Queues (database/Redis) for notifications, PDF generation, and payment webhooks.
- **Maps (optional but recommended):** Show affected areas / purok boundaries on the Inertia pages.

### Project structure notes

- Controllers return `Inertia::render('Page', [...props])` — keep pages under `resources/js/Pages/`.
- Share role/user/permissions and flash messages globally via `HandleInertiaRequests` middleware.
- Group routes by role in `routes/web.php` with role middleware.

---

## 5. Suggested data model (Eloquent)

Use migrations + Eloquent models. Table names plural snake_case, foreign keys `*_id`, timestamps on all tables.

```
users            (id, name, email, phone, password, role, barangay_id, purok_id, status)
barangays        (id, name, code, lgu_name)
puroks           (id, barangay_id, name, president_id)
households       (id, purok_id, head_name, address, members_count, priority_flag,
                  status[waiting|ongoing|completed], verified_at, verified_by)
disaster_reports (id, reporter_id, barangay_id, purok_id, type, description, affected_area,
                  status[reported|verified|confirmed|resolved|rejected], verified_at, verified_by)
report_status_histories (id, disaster_report_id, status, actor_id, note)
report_photos    (id, disaster_report_id, path)
assistance_requests (id, requester_id, disaster_report_id, barangay_id, purok_id, household_id,
                  type, quantity, goods_needed, urgency, priority[critical|high|normal],
                  status[pending|verified|approved|rejected|fulfilled], verified_by, approved_by, fulfilled_at)
donation_items   (id, donation_id, inventory_item_id, category, name, unit, quantity, received_quantity, distributed_quantity)
distribution_items (id, distribution_id, inventory_item_id, item_name, unit, quantity)
donation_allocations (id, donation_item_id, distribution_item_id, quantity)
stock_movements  (id, inventory_item_id, direction[in|out], quantity, balance_after, reason, source, user_id)
donations        (id, donor_id, barangay_id, type, amount, items, delivery_method[deliver|pickup],
                  scheduled_at, payment_status, status[pending|confirmed|delivered|distributed], received_at)
inventory_items  (id, barangay_id, category, name, quantity, unit, expiry_date)
distributions    (id, barangay_id, household_id, assistance_request_id, admin_id, items, quantity, signature_path,
                  status[waiting|ongoing|completed], distributed_at)
beneficiaries    (id, distribution_id, household_id, items_received, received_at)
notifications    (Laravel's built-in notifications table)
reports          (id, kind[incident|received|distribution], barangay_id, generated_by, file_path)
```

Model relationships to define: `User belongsTo Barangay/Purok`; `Barangay hasMany Puroks/Users`; `Purok hasMany Households`; `DisasterReport hasMany ReportPhotos/AssistanceRequests`; `Distribution hasMany Beneficiaries`, etc.

---

## 6. Key workflows

1. **Incident → Verification → Confirmation**
   Resident reports (photo + area) → Purok President verifies household/report → submits to Barangay → Admin confirms.
2. **Donation → Distribution → Beneficiary**
   Donor views needs → donates (digital payment / goods) → schedules delivery/pickup → item enters inventory → Admin/Purok distributes to prioritized households → records beneficiary + signature → donor sees distribution status.
3. **Reporting**
   Data from incidents, donations, and distributions rolls up into printable, signable reports for LGU/barangay submission; Super Admin consolidates across barangays.

---

## 7. Non-functional requirements

- **Mobile-first & responsive**; works on low-end phones and spotty connections (graceful loading, offline-tolerant where possible).
- **Secure:** hashed passwords, RBAC on every endpoint, validated file uploads (type/size), audited distribution records.
- **Transparent & auditable:** every distribution ties to a beneficiary record and signature.
- **Accessible:** keyboard focus, sufficient contrast, sound alerts have a visual equivalent.
- **Localization-ready:** English + Filipino strings.

---

## 8. Conventions for agents

- Enforce authorization with **Policies/Gates** on every controller action — never rely on the UI alone.
- Validate all input with **Form Requests**; validate uploads (mime/size) and sanitize.
- Controllers return `Inertia::render(...)`; keep business logic in **Service classes** or actions, not fat controllers.
- Verify payment **webhook signatures**; process them in queued jobs.
- Keep money as integer minor units or `decimal` casts — never floats for currency.
- Model status transitions explicitly (e.g. distribution: `waiting → ongoing → completed`) — guard invalid jumps.
- Every report must be reproducible and printable as **PDF**.
- Ship **migrations, seeders, and factories**. Seed one Super Admin, two barangays, and sample households for demos.
- Follow Laravel conventions: `php artisan make:*`, resourceful routes, Eloquent relationships, named routes.

---

## 9. Project folder structure

```
reliefnet/
├── app/
│   ├── Enums/
│   │   ├── UserRole.php              (super_admin, admin, purok_president, resident, donor)
│   │   ├── ReportStatus.php          (reported, verified, confirmed, resolved, rejected)
│   │   └── DistributionStatus.php    (waiting, ongoing, completed)
│   ├── Http/
│   │   ├── Controllers/
│   │   │   ├── DashboardController.php
│   │   │   ├── DisasterReportController.php
│   │   │   ├── AssistanceRequestController.php
│   │   │   ├── DonationController.php
│   │   │   ├── InventoryController.php
│   │   │   ├── DistributionController.php
│   │   │   ├── HouseholdController.php
│   │   │   ├── ReportController.php          (PDF generation)
│   │   │   ├── UserController.php            (account management)
│   │   │   └── PaymentWebhookController.php
│   │   ├── Middleware/
│   │   │   ├── HandleInertiaRequests.php     (shares auth + roles globally)
│   │   │   └── EnsureUserHasRole.php
│   │   └── Requests/                         (Form Requests — validation per action)
│   │       ├── StoreDisasterReportRequest.php
│   │       ├── StoreDonationRequest.php
│   │       └── ...
│   ├── Models/
│   │   ├── User.php  Barangay.php  Purok.php  Household.php
│   │   ├── DisasterReport.php  ReportPhoto.php  AssistanceRequest.php
│   │   ├── Donation.php  InventoryItem.php  Distribution.php  Beneficiary.php
│   │   └── Report.php
│   ├── Policies/                             (one per model — RBAC)
│   ├── Services/                             (business logic, kept out of controllers)
│   │   ├── PaymentService.php                (PayMongo interface)
│   │   ├── InventoryService.php
│   │   └── ReportPdfService.php
│   └── Notifications/                        (Laravel Notifications for alerts)
├── database/
│   ├── migrations/
│   ├── factories/
│   └── seeders/  (RoleSeeder, BarangaySeeder, DemoDataSeeder)
├── resources/
│   └── js/
│       ├── Pages/                            (Inertia pages by role/feature)
│       │   ├── Dashboard/
│       │   ├── DisasterReports/  (Index, Create, Show)
│       │   ├── Donations/  Inventory/  Distributions/  Households/
│       │   ├── Reports/  Users/
│       │   └── Auth/                          (from starter kit)
│       ├── Components/                        (shared UI: StatusBadge, PhotoUpload, SignaturePad)
│       ├── Layouts/                           (AppLayout, role-aware sidebar)
│       └── app.tsx
├── routes/
│   └── web.php                                (grouped by role middleware)
└── AGENTS.md
```

---

## 10. Build plan (phased, dependency-ordered)

Build in this order — each phase depends on the previous. Don't jump ahead; a working slice at each phase keeps the project demoable.

### Phase 0 — Project setup ✅ (you are here)

- [X] Create app with Laravel + Inertia (React) starter kit.
- [X] Configure `.env` database, run `php artisan migrate`.
- [X] `npm install` and `npm run dev` working.
- [ ] Install packages: `spatie/laravel-permission`, `barryvdh/laravel-dompdf`, `laravel/reverb`.
- [ ] Commit initial project to Git.

### Phase 1 — Foundation: roles, auth, layout

- [ ] Add `UserRole` enum + `role`, `barangay_id`, `purok_id`, `status` columns to `users`.
- [ ] Install Spatie permissions; seed the 5 roles (`RoleSeeder`).
- [ ] Add `HasRoles` to `User`; assign roles on registration.
- [ ] Share `auth.user` + `auth.roles` via `HandleInertiaRequests`.
- [ ] Build role-aware `AppLayout` with a sidebar that shows only permitted menu items.
- [ ] Add `EnsureUserHasRole` middleware; group routes by role.

- **Milestone:** each role logs in and sees a different (empty) dashboard.

### Phase 2 — Core data model

- [ ] Migrations + models + factories for: `Barangay`, `Purok`, `Household`, `DisasterReport`, `ReportPhoto`, `AssistanceRequest`, `Donation`, `InventoryItem`, `Distribution`, `Beneficiary`, `Report`.
- [ ] Define all Eloquent relationships (see §5).
- [ ] `BarangaySeeder` + `DemoDataSeeder` (1 super admin, 2 barangays, sample households).

- **Milestone:** `php artisan migrate:fresh --seed` builds a full demo database.

### Phase 3 — Resident flow (reporting)

- [ ] `DisasterReportController` + Policy + Form Request.
- [ ] Resident: create report with **photo upload** (`Storage`) + affected area.
- [ ] Resident: file assistance requests; view status of reports/requests.
- [ ] `StatusBadge` + `PhotoUpload` components.

- **Milestone:** a resident reports an incident with a photo and tracks it.

### Phase 4 — Verification & confirmation

- [ ] Purok President: view reports in their purok, verify households, submit to barangay.
- [ ] Purok President: identify priority households.
- [ ] Admin: confirm incidents; prioritize assistance requests.

- **Milestone:** report moves `reported → confirmed` through the right roles.

### Phase 5 — Donations & payments

- [ ] Donor: view needs, select donation type + delivery method, schedule delivery/pickup.
- [ ] `PaymentService` (PayMongo) + `PaymentWebhookController` (verify signature, queued).
- [ ] Donations feed into inventory on receipt.

- **Milestone:** a donor completes a digital payment and it records a donation.

### Phase 6 — Inventory & distribution

- [ ] `InventoryController` + `InventoryService` (stock in/out, categories, quantities, expiry).
- [ ] `DistributionController`: distribute to prioritized households.
- [ ] `SignaturePad` component → save `signature_path`; record `Beneficiary`.
- [ ] Distribution status state machine (`waiting → ongoing → completed`, guarded).

- **Milestone:** admin distributes goods, captures a signature + beneficiary record; donor sees distribution status.

### Phase 7 — Dashboard & notifications

- [ ] `DashboardController`: metrics + recent reports + donation status per role.
- [ ] Laravel Notifications (database + broadcast) via Reverb + Echo.
- [ ] Client **sound alert** + visual indicator on new events.

- **Milestone:** a new report triggers a live, audible notification.

### Phase 8 — Reports (PDF) & Super Admin

- [ ] `ReportPdfService` with dompdf: Disaster Incident, Donation Received, Donation Distribution (**with signature**).
- [ ] Printable / downloadable PDFs submittable to LGU.
- [ ] Super Admin: manage multiple barangays + admins; consolidated cross-barangay reports.

- **Milestone:** all four report types export as PDF; super admin sees rolled-up data.

### Phase 9 — Polish & evaluation

- [ ] Account management CRUD (create/edit/deactivate/assign roles).
- [ ] Mobile-first pass; responsive down to phone; reduced-motion + keyboard focus.
- [ ] English + Filipino strings.
- [ ] Test against **Functionality, Usability, Accuracy** (your evaluation criteria).

- **Milestone:** Definition of done (§11) fully checked.

---

## 11. Definition of done

- [ ] All 5 roles can log in and only see their permitted features.
- [ ] Resident can file a photo-backed report and track it.
- [ ] Donor can donate via digital payment and see distribution status.
- [ ] Purok President can verify households and record distribution status.
- [ ] Admin can confirm incidents and manage distribution with beneficiary records.
- [ ] Super Admin sees consolidated cross-barangay reports.
- [ ] Inventory, dashboard, sound notifications working.
- [ ] All four report types generate as printable PDFs; distribution report includes a signature.
- [ ] Evaluated for Functionality, Usability, and Accuracy.

