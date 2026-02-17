# Affiliate Onboarding Form — MVP Product Specification

**Standalone POC | February 2026 | v4 | For technical spec and implementation planning**

---

## Overview

This document specifies the MVP affiliate onboarding form for the Next Level white-label program. It is a standalone proof of concept, not built on the ForthBridge platform. The form captures everything downstream teams (Care Navigation, Virtual Care, and Operations) need to accurately support affiliate program members.

The intended reader is a senior developer who will produce the technical spec and implementation plan from this document.

The form is organized into two phases that the affiliate completes in sequence:

- **Program** — defines the commercial model: what's included in the membership, pricing, geographic scope, and billing. This is what the member sees.
- **Operations** — configures how the affiliate delivers care: locations, providers, labs, radiology, scheduling, referrals, and technology. This exists independent of any specific program and does not change based on what's bundled in the membership.

> **ARCHITECTURE**: The program phase determines the billing path (included in membership, billed to insurance, or billed to patient). The operations phase is the clinical infrastructure. Providers need to order labs, radiology, and referrals based on clinical need regardless of how the program is priced. Operations sections are never conditional on the program's service menu.

---

## MVP Scope

### What ships in MVP
- All form sections across both phases (Program and Operations)
- Save and resume with auto-save
- Collaborator invites (email + password, full form access)
- Per-section snapshot versioning with change attribution and whole-form rollback UI
- Completion dashboard for the primary admin
- Review and submit workflow
- Encryption at rest and in transit
- Scheduling/availability service integration per location

### What is NOT in MVP
- CSV uploads for locations or providers
- Per-section collaborator permissions
- Per-section rollback UI (data stored, UI deferred)
- Platform integration (this is standalone)

### Design sequencing
All sections are designed and built together. Section 4 (In-Person & Extended Services) is a lightweight service selection with collaborative post-submission configuration — no complex per-service UI in MVP.

---

## Application Architecture

### Two-tier entity model: Operations vs. Program

This is the most important architectural concept in this spec. Entities belong to one of two scopes:

**Operations-scoped entities** are shared infrastructure that spans all programs. These include locations, providers, lab network relationships, radiology network integrations, scheduling service connections, and collaborator accounts. An affiliate sets these up once. When they add a second program, they do not re-enter locations or re-configure lab accounts.

**Program-scoped entities** define the commercial model. These include the service menu (which services are included or available), pricing, geographic availability, referral network rules, and billing configuration. Each program has its own commercial terms, even though the operational infrastructure behind it is shared.

> **ARCHITECTURE**: Every operations-scoped entity is keyed to `affiliate_id` (the affiliate is the organizational owner of all operational infrastructure). Every program-scoped entity is keyed to `program_id` (which itself belongs to an affiliate). Programs reference shared operations resources — they do not own them. For example, a program does not have locations; it references locations that belong to the affiliate's operations. This separation is what makes multi-program support work without data duplication.

### Multi-program data model
The data model supports multiple programs per affiliate. The MVP UI only exposes a single program per affiliate. The one-to-many relationship between affiliate and program exists in the schema from day one so this does not require a data migration when multi-program support is needed.

When an affiliate adds a second program in the future, the form flow changes: the operations phase is pre-filled from existing operational infrastructure (locations, providers, labs, radiology, scheduling). The affiliate confirms or adds to it. The program phase is completed fresh with the new program's commercial terms.

### Form infrastructure
- Standalone web application (not on the ForthBridge platform)
- Every field auto-saves on change. No explicit save button.
- Form tracks completion status per section for the admin dashboard.
- All collaborators see and can edit the entire form. No per-section access control.

### Data persistence & versioning
Every save writes to two storage layers: a current-state table and a per-section history table. When a user saves a field in any section, only that section's snapshot gets written to history. Each history entry stores the full section snapshot, the user who made the change, and a timestamp.

This per-section snapshot approach is chosen deliberately: it stores the granularity needed for future per-section rollback without building the rollback UI now. In MVP, the rollback UI only supports whole-form restore (which internally rolls back all sections to their state at a given timestamp). Per-section rollback UI is a Phase 2 feature, but the data to support it is captured from day one.

Cross-section dependencies matter for future per-section rollback. If locations are rolled back independently, provider-location mappings could break. The Phase 2 rollback UI will need validation that catches these conflicts. For MVP whole-form rollback, this is not an issue since all sections revert together.

### Collaborator model
- Primary admin adds collaborators by entering an email address.
- System creates an account with email + password. The affiliate handles outreach to their collaborators.
- All collaborators have full access to all sections.
- Primary admin sees a completion dashboard showing which sections are done and overall progress.

### Security requirements

> **SECURITY**: This application handles sensitive healthcare and financial data. The following security requirements are non-negotiable.

- **Encryption in transit**: All traffic over HTTPS/TLS 1.2+. No exceptions.
- **Encryption at rest**: All stored data (current state, history snapshots, uploaded files) encrypted at rest. Use AES-256 or equivalent via the hosting provider's native encryption (e.g., AWS RDS encryption, S3 SSE).
- **Authentication**: Email + password with secure password hashing (bcrypt or argon2). No plaintext password storage.
- **File uploads** (W-9, voided checks): Stored in encrypted object storage. Not served publicly. Access requires authentication.
- **Session management**: Secure session tokens with appropriate expiration. CSRF protection on all form submissions.

### Data model summary

The **Scope** column indicates whether the entity is operations-scoped (shared across all programs) or program-scoped (specific to a single program).

| Entity | Scope | Relationships |
|--------|-------|---------------|
| Affiliate | Top-level | Has one or more Programs (MVP UI: one). Has Users (admin + collaborators). Owns all operations-scoped entities. |
| Program | Program | Belongs to Affiliate. Has Services (Section 4). Has pricing, geographic availability, referral network rules, billing config. References operations-scoped Locations and Providers. |
| Location | Operations | Shared across programs. Has many Providers (many-to-many). May have a specific Referring Provider. Has one or more Scheduling Integrations. |
| Provider | Operations | Shared across programs. Mapped to one or more Locations (many-to-many). |
| Lab Network | Operations | Shared across programs. Type (Quest / Labcorp / Other). Coordination contact. If Other: scoped integration project flag. |
| Radiology Network | Operations | Shared across programs. Network/facility info, order delivery method, results delivery method, coordination contact. |
| Scheduling Integ. | Operations | Belongs to Location. Type (Office 365 / Google Calendar / Other). If Other: service name + scoped project flag. |
| Service | Program | Belongs to Program. Identifies which services are part of the program. Pricing, availability, and fulfillment details configured collaboratively post-submission. |
| Section Snapshot | Form-level | Per-section form state at a point in time. Attributed to a User. Timestamped. Section identifier. Used for history and rollback. |

---

## Phase 1: Program

The program phase defines the commercial model: what the membership includes, how it's priced, where it's available, and how billing works. This is what the member sees and what sales teams sell. All entities in this phase are program-scoped.

### Section 1: Affiliate & Program Overview

Identifies the affiliate, anchors the program to a contract period, and establishes ownership and escalation paths. Affiliate identity fields (legal name, admin contact, executive sponsor) are operations-scoped. Program-specific fields (program name, contract dates, member count) are program-scoped.

| Field | Description | Required |
|-------|-------------|----------|
| Provider group legal name | Full legal entity name of the affiliate provider group | Required |
| Program name | The name members will hear and reference (e.g., "PRIME") | Required |
| Contract start date | Date picker | Required |
| Contract end date | Date picker | Required |
| Primary affiliate admin contact | Name + email. This person owns the form and sees the dashboard. | Required |
| Executive sponsor | Name + email. Escalation path for program-level issues. | Required |
| Estimated member count | Approximate number of members to be enrolled. Used for Care Nav staffing and capacity planning. | Required |
| Additional collaborators | Email addresses. System creates accounts; affiliate handles outreach. | Optional |

### Section 2: Default Program Services (Read-Only)

Displays the standard service package included in every affiliate program. This section is informational only. Affiliates cannot uncheck or modify these services. Care Navigation always knows the full default package applies.

**Displayed services:**
- Unlimited 24/7 $0 virtual primary care and sick visits
- Emotional wellness counseling (12 sessions)
- Health coaching (12 sessions)
- Care Navigation
- Discounted weight loss program, including GLP-1 medications

Single confirmation checkbox: "I confirm this accurately reflects what's included in our program."

**No unbundling.** These services are non-negotiable. The checkbox confirms understanding, not approval to modify.

### Section 3: Program Geographic Availability

Determines how in-person services are geographically scoped. Prevents Care Navigation from scheduling or referring outside the affiliate's service footprint.

**Single-select radio:**
- National
- State-based
- Metro-based
- Location-dependent

Helper text: "In-person services are a core part of your program. Knowing where they're available allows us to route and schedule care appropriately."

### Section 4: In-Person & Extended Services

This section captures which in-person and extended services are part of the affiliate's program. Pricing, availability, fulfillment details, and scheduling ownership for each service are configured collaboratively with the Next Level team after form submission — not in the form itself.

This is a program-scoped section: it identifies which services exist in this program's membership. The operational infrastructure behind those services (labs, radiology, scheduling) is configured in the Operations phase.

**What the form captures:**

Service selection (multi-select checkboxes):
- Labs
- Imaging
- Immunizations
- Durable Medical Equipment (DME)
- Bundled surgeries
- Specialist care
- Physical therapy
- Infusion services
- Behavioral health (in-person or extended)
- Other (free text)

If a service is not selected, Care Navigation will not reference or offer it as part of the program.

**Post-submission collaborative setup:**

After submission, the Next Level team works with the affiliate's designated contacts to configure per-service details including:
- Pricing model (included in membership / discounted / access only)
- Location availability (all locations / select locations / offsite partners)
- Cost or discount structure
- Limits or eligibility requirements
- Scheduling ownership (Care Navigation or affiliate team)

Helper text: "Select the services that are part of your program. After submission, our team will work with you to configure pricing, availability, and fulfillment details for each selected service."

### Section 5: Insurance & Billing

Captures payment setup information for affiliate reimbursement and invoicing. This is the financial layer of the program.

This section is typically completed by a finance contact, not the clinical/ops person filling out the rest of the form. The collaborator model should make it easy for the primary admin to assign this to the right person on their team.

| Field | Description | Required |
|-------|-------------|----------|
| W-9 | File upload (encrypted storage) | Required |
| ACH information | Structured fields for routing and account details (encrypted at rest) | Required |
| Voided check or bank statement | File upload (encrypted storage) | Required |

> **SECURITY**: Payment data (ACH details, W-9, bank statements) is the most sensitive data in this form. These fields must be encrypted at the application level in addition to the database-level encryption applied to all data. Access to decrypted payment data should be restricted to authorized operations personnel.

---

## Phase 2: Operations

The operations phase configures how the affiliate delivers care. This is the clinical and operational infrastructure: where care happens, who delivers it, and how labs, radiology, scheduling, and referrals work. All entities in this phase are operations-scoped — they exist independent of any specific program and serve all programs the affiliate runs.

> **ARCHITECTURE**: Nothing in this phase is conditional on the program's service menu. Providers need to order labs, radiology, and referrals based on clinical need regardless of what's bundled in the membership. The program determines the billing path (included, insurance, or patient pay). The operations phase configures the infrastructure that makes those clinical services possible.

### Section 6: Physical Locations

Captures all physical sites accessible to program members. Care Navigation uses this data for scheduling, referrals, directions, and location-specific service availability. Locations are operations-scoped — they serve all programs the affiliate runs.

Locations are added individually via the form (no CSV upload in MVP).

| Field | Description | Required |
|-------|-------------|----------|
| Location name | Display name for the site | Required |
| Street address | Full street address | Required |
| City | City | Required |
| State | State (dropdown) | Required |
| ZIP | 5-digit ZIP code | Required |
| Close-by description | Human-readable landmark (e.g., "Across from Denny's"). Used by Care Nav when giving directions. | Required |
| Location NPI | National Provider Identifier for the location | Required |
| Phone number | Location-specific phone number | Required |
| Hours of operation | Operating hours for the location (e.g., Mon–Fri 8am–5pm) | Required |
| Walk-in or appointment only | Single select: Walk-in accepted / Appointment only / Both | Required |

#### Scheduling & availability integration

Each location must specify which scheduling/availability service it uses. The affiliate can add multiple scheduling providers per location (for example, if different providers at the same location use different systems).

For each scheduling integration:

| Field | Description | Required |
|-------|-------------|----------|
| Scheduling service | Single select: Office 365 / Google Calendar / Other | Required |
| Service name (if Other) | Free text. Only shown when "Other" is selected. | Required |
| Account or calendar identifier | The specific account, calendar URL, or identifier needed to connect. Format varies by service. | Required |

Office 365 and Google Calendar are standard integrations included at no additional cost. If the affiliate selects "Other," the form should display a confirmation message: "Integrating with a non-standard scheduling service requires a scoped project. Our team will follow up to assess feasibility and timeline." This flag should be surfaced in the admin/ops view after submission.

### Section 7: Providers & Credentials

Captures providers who should have access to scheduling and clinical systems for program members. Used to provision system access and ensure compliant documentation. Providers are operations-scoped — they serve all programs the affiliate runs.

Providers are added individually via the form (no CSV upload in MVP).

| Field | Description | Required |
|-------|-------------|----------|
| First name | Provider first name | Required |
| Last name | Provider last name | Required |
| Provider type | Dropdown: Physician (MD/DO), NP, PA, Other | Required |
| License number | State license number | Required |
| License state | State of licensure (dropdown) | Required |
| Locations | Multi-select from locations entered in Section 6. Maps providers to their practice locations. | Required |
| NPI | National Provider Identifier | Required |
| DEA number | Drug Enforcement Administration number | Optional |

### Section 8: Referring Provider (Standing Order)

Identifies the referring provider used on referrals generated by the virtual care team. The referring provider may also be a physical clinic location.

| Field | Description | Required |
|-------|-------------|----------|
| Referring provider name | Name of provider or clinic | Required |
| Referring provider NPI | NPI of the referring entity | Required |
| Address | Full address (street, city, state, ZIP) | Required |
| Phone | Phone number | Required |
| Fax | Fax number | Required |
| Applies to all locations? | Yes/No toggle. If No, allow mapping referring providers to specific locations from the Section 6 list. | Required |

If the affiliate answers No to "applies to all locations," the form expands to allow one referring provider per location. Each entry uses the same fields above.

### Section 9: Lab Network Configuration

Configures which lab network the affiliate uses. This is operations-scoped infrastructure — the lab relationship exists regardless of which programs the affiliate runs or how lab services are priced within those programs.

| Field | Description | Required |
|-------|-------------|----------|
| Lab network | Single select: Quest / Labcorp / Other. If Other, capture the network name. | Required |
| Lab coordination contact | Name + email + phone. The affiliate's point person for lab-related questions and setup. | Required |

If the affiliate selects "Other" for the lab network, the form should display a message: "Integrating with a non-standard lab network requires a scoped project. Our team will follow up with your lab coordination contact to assess feasibility and timeline." This flag should be surfaced in the admin/ops view after submission.

### Section 10: Radiology Network Configuration

Configures which radiology network the affiliate uses and how orders and results flow. This is operations-scoped infrastructure — the radiology relationship exists regardless of which programs the affiliate runs.

| Field | Description | Required |
|-------|-------------|----------|
| Radiology network | Network or facility name. If centralized through a single network, capture the network name. If facility-specific, capture facility name + address. | Required |
| Order delivery method | How orders reach the radiology network (e.g., fax, EHR integration, portal). Capture the specific endpoint (fax number, portal URL, etc.). | Required |
| Results delivery method | How radiology results come back to us. Single select: Fax / PACS integration / EHR portal / Other. Capture the specific endpoint details. | Required |
| Radiology coordination contact | Name + email + phone. The affiliate's point person for radiology-related questions and setup. | Required |

### Section 11: Care Navigation Responsibilities & Escalation

Defines what Care Navigation should do for this affiliate's members and when to escalate to the affiliate's internal team.

**Care Navigation responsibilities (multi-select checkboxes):**
- Educate members on benefits
- Schedule services
- Coordinate referrals
- Provide ongoing care coordination

| Field | Description | Required |
|-------|-------------|----------|
| Escalation triggers | Free text: when should Care Navigation escalate to the affiliate? | Required |
| Primary escalation contact | Name + email | Required |
| Secondary escalation contact | Name + email | Required |

### Section 12: Language Guidelines & Guardrails (Optional)

Captures any messaging guidelines or restrictions Care Navigation should follow when communicating with the affiliate's members. Protects affiliate brand integrity.

Single question: "Are there any messaging guidelines or 'do not say' rules Care Navigation should follow?"
- No (default)
- Yes — expand to free text field

### Section 13: Technology & Integration

Captures the affiliate's existing technology stack so that integration requirements can be scoped accurately.

| Field | Description | Required |
|-------|-------------|----------|
| EHR system | Name of the electronic health record system used (e.g., athenahealth, Epic, eClinicalWorks) | Required |
| Practice management system | If different from EHR (e.g., Kareo, AdvancedMD) | Optional |
| Patient portal | Name of any patient-facing portal in use | Optional |
| IT contact | Name + email + phone. Point person for technical integration questions. | Required |

### Section 14: Review & Submit

Displays a read-only summary of all submitted data organized by phase and section. The affiliate confirms accuracy before submission.

**Program phase summary:**
- Program overview and contacts
- Confirmed default services
- Geographic availability
- In-person and extended services selected (Section 4)
- Insurance and billing (confirmation that it was submitted, not the details themselves)

**Operations phase summary:**
- Physical locations with scheduling integrations
- Providers and credentials
- Referring provider(s)
- Lab network configuration
- Radiology network configuration
- Care Navigation responsibilities and escalation contacts
- Language guidelines (if any)
- Technology and integration details

Single confirmation checkbox: "This accurately reflects our program offering."

Helper text: "Once submitted, this information will be used by our Care Navigation and Virtual Care teams to support your members."

---

## Cross-Cutting Features

### Add collaborators (available from any section)

Any section of the form includes an option to add a collaborator. The primary admin enters an email address, the system creates an account (email + password), and the affiliate handles telling that person to go fill things out.

All collaborators have full access to all sections. No per-section permissions in MVP.

### Completion dashboard

The primary admin sees a dashboard showing which sections are complete, which are in progress, and overall form completion percentage. The dashboard groups sections by phase (Program and Operations) so the admin can see progress in each phase independently.

### Versioning & rollback

Every auto-save writes a snapshot of the changed section to the history table. Each history entry contains:
- Section identifier
- Full section snapshot
- User who made the change
- Timestamp

**MVP rollback UI:**
- Change history view: who changed what section and when, with the ability to view diffs between snapshots
- Whole-form rollback: restore the entire form to its state at any previous timestamp (all sections revert to their snapshots at or before that timestamp)
- Rollback itself is tracked as a new history entry

> **PHASE 2**: Per-section rollback UI is deferred. The per-section snapshot data is stored from day one. The Phase 2 UI will need cross-section dependency validation (e.g., rolling back locations should warn if providers reference removed locations).

---

## Phase 2 Scope (Post-MVP)

The following capabilities are explicitly deferred from MVP and documented here for future planning.

- CSV upload for locations and providers (parsing, validation, error handling, preview)
- Per-section collaborator permissions (assign specific sections to specific collaborators)
- Per-section rollback UI with cross-section dependency validation
- Multi-program UI (backend supports it from day one; UI exposes it later)
- Per-service configuration UI in Section 4 (pricing, availability, fulfillment — currently handled collaboratively post-submission)
- Resource management: order validation and formulary logic ensuring virtual providers only order services that affiliate locations can fulfill (separate initiative, uses form data as input)
- Platform migration (move from standalone POC to the ForthBridge platform)

---

## Appendix: Customer-Facing Helper Text

Each form section includes helper text explaining why the information is needed. This text should be displayed inline in the form UI. The full helper text per section is documented in the original UX flow document and should be carried forward into the implementation.
