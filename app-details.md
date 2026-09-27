# Renove — Backend Engineering README

> **This document is the backend engineering contract for Renove.**
>
> OpenCode must treat this file as the source of truth for backend implementation.
>
> The backend must be built as a production-grade, multi-tenant SaaS platform for architecture and interior-design practices.
>
> Do not skip sections because the application currently does not need them. Some infrastructure and distributed-system capabilities are intentionally marked **[USER BUILD]** because they are part of the developer's systems-engineering learning objectives.
>
> When a section is fully implemented, tested, and verified, tick its checkbox and continue to the next incomplete section.

---

# 0. EXECUTION RULES

## 0.1 How OpenCode must work

OpenCode must work through this README sequentially.

For every section:

1. Read the section completely.
2. Inspect the existing codebase before making changes.
3. Identify dependencies on previous sections.
4. Implement the section.
5. Add or update tests.
6. Run the relevant checks.
7. Fix all discovered issues.
8. Verify that the implementation matches the architecture described here.
9. Tick the section checkbox.
10. Only then move to the next incomplete section.

Never mark a section complete merely because code was written.

A section is complete only when:

* implementation exists
* types compile
* tests pass where applicable
* database migrations are valid
* API behavior is verified
* security implications have been considered
* documentation is updated where necessary

---

# 0.2 Status markers

Use these markers throughout this document.

### `[OPENCODE]`

OpenCode should implement this.

### `[USER BUILD]`

The user must implement this personally.

OpenCode may:

* explain the architecture
* prepare interfaces/contracts
* create tests
* create configuration placeholders
* create documentation
* review the user's implementation

But OpenCode must **not silently implement the core mechanism for the user**.

These sections are intentionally included so the user learns production systems engineering rather than only application-level CRUD.

### `[JOINT]`

OpenCode may scaffold and assist, but the user should understand and make the important architectural decisions.

---

# 1. PRODUCT CONTEXT

Renove is a Ghana-first operating system for architecture and interior-design practices.

It is not merely a project-management application.

The system should connect:

```text
Lead
  ↓
Client
  ↓
Proposal
  ↓
Contract
  ↓
Project
  ↓
Design Phases
  ↓
Deliverables
  ↓
Client Approval
  ↓
Procurement
  ↓
Site / Construction
  ↓
Invoices
  ↓
Payments
  ↓
Profitability
  ↓
Archive
```

The system must work for:

* solo architects
* interior designers
* small design practices
* growing studios
* larger architecture/interior-design practices

The architecture must support progressive complexity.

A solo user should not be forced into unnecessary enterprise workflows.

---

# 2. CORE ENGINEERING PRINCIPLES

The backend must follow these principles:

* modular architecture
* strong domain boundaries
* multi-tenancy by design
* explicit authorization
* secure authentication
* database integrity
* transactional consistency
* API contracts
* observability
* testability
* scalability
* operational simplicity
* graceful failure
* explicit error handling
* backwards-compatible evolution
* infrastructure automation
* security by default

Avoid:

* giant services
* giant controllers
* business logic inside controllers
* duplicated authorization logic
* database queries scattered throughout controllers
* leaking ORM models directly through every API
* hidden tenant context
* implicit cross-tenant access
* premature microservices
* unnecessary abstractions
* magic configuration
* storing secrets in source code

---

# 3. SYSTEM ARCHITECTURE

## 3.1 Initial architecture

Use a **modular monolith**.

Do NOT start with microservices.

The initial architecture should resemble:

```text
                    ┌───────────────────┐
                    │      Client       │
                    │    Next.js App    │
                    └─────────┬─────────┘
                              │
                              │ HTTPS
                              ▼
                    ┌───────────────────┐
                    │    API / NestJS   │
                    │                   │
                    │ Auth              │
                    │ Tenants           │
                    │ Projects          │
                    │ Clients           │
                    │ CRM               │
                    │ Proposals         │
                    │ Contracts         │
                    │ Design            │
                    │ Procurement       │
                    │ Site              │
                    │ Files             │
                    │ Billing           │
                    │ Notifications     │
                    └──────┬──────┬─────┘
                           │      │
                 ┌─────────┘      └──────────┐
                 ▼                           ▼
        ┌─────────────────┐         ┌─────────────────┐
        │   PostgreSQL    │         │      Redis      │
        │                 │         │                 │
        │ Primary DB      │         │ Cache           │
        │ Tenants         │         │ Rate limiting   │
        │ Users           │         │ Sessions/locks  │
        │ Projects        │         │ Queues          │
        └─────────────────┘         └────────┬────────┘
                                             │
                                             ▼
                                    ┌─────────────────┐
                                    │ Background Jobs │
                                    │                 │
                                    │ Emails          │
                                    │ Notifications   │
                                    │ PDF generation  │
                                    │ AI processing   │
                                    │ File processing │
                                    └─────────────────┘
```

The architecture should be capable of evolving toward:

```text
                    Load Balancer
                         │
             ┌───────────┼───────────┐
             ▼           ▼           ▼
          API #1      API #2      API #3
             │           │           │
             └───────────┼───────────┘
                         │
               ┌─────────┴─────────┐
               ▼                   ▼
            Redis              PostgreSQL
               │
               ▼
          Job Workers
```

---

# 4. REPOSITORY FOUNDATION

## 4.1 Project configuration `[OPENCODE]`

* [x] Establish backend directory structure.
* [x] Configure NestJS.
* [x] Configure TypeScript strict mode.
* [x] Configure ESLint.
* [x] Configure formatting.
* [x] Configure environment validation.
* [x] Configure path aliases.
* [x] Configure development scripts.
* [x] Configure production build.
* [x] Establish conventional module structure.
* [x] Add README development instructions.

---

# 5. ENVIRONMENT CONFIGURATION

## 5.1 Configuration system `[OPENCODE]`

Create a centralized configuration system.

Required categories:

```text
APP
DATABASE
AUTH
JWT
COOKIES
REDIS
QUEUE
EMAIL
STORAGE
PAYMENTS
CORS
LOGGING
OBSERVABILITY
```

Requirements:

* validate environment variables at startup
* fail fast when required variables are missing
* never hardcode secrets
* distinguish development/test/production
* never expose private configuration through public API responses

---

# 6. DATABASE ARCHITECTURE

## 6.1 PostgreSQL + Drizzle `[OPENCODE]`

Use PostgreSQL as the primary relational database.

Use Drizzle ORM.

Establish:

* schema organization
* migrations
* indexes
* foreign keys
* unique constraints
* check constraints where appropriate
* timestamps
* soft-delete strategy where appropriate
* transaction conventions

---

# 6.2 Multi-tenancy `[OPENCODE]`

Tenant is the architectural foundation of Renove.

Core model:

```text
User
 │
 ├── Membership
 │       │
 │       └── Tenant
 │
 └── Sessions
```

Business entities should generally belong to a tenant.

Examples:

```text
tenant_id
```

must exist on appropriate entities such as:

* clients
* projects
* proposals
* contracts
* tasks
* deliverables
* invoices
* expenses
* vendors
* procurement records
* site reports

Never rely solely on the frontend to enforce tenancy.

Every tenant-owned query must be scoped server-side.

---

# 6.3 Tenant isolation `[OPENCODE]`

Implement and test:

* tenant-aware repository/service patterns
* tenant context
* authorization checks
* cross-tenant access prevention
* tenant-aware unique constraints
* tenant-aware indexes

Write explicit tests attempting:

```text
Tenant A → access Tenant B resource
```

The request must fail.

---

# 7. IDENTITY AND AUTHENTICATION

## 7.1 User authentication `[OPENCODE]`

Implement:

* registration
* login
* logout
* logout all sessions
* current-user endpoint
* refresh token rotation
* session persistence
* password hashing using Argon2id
* secure HttpOnly cookies
* secure cookie configuration
* session expiration
* revocation

Never store raw passwords.

Never return password hashes.

Never store refresh tokens in plaintext.

---

# 7.2 Authentication lifecycle `[OPENCODE]`

The system must support:

```text
Register
   ↓
Email verification
   ↓
Login
   ↓
Access token
   ↓
Refresh
   ↓
Refresh token rotation
   ↓
Logout
```

Prepare architecture for:

* email verification
* forgot password
* reset password
* account suspension
* account deletion

Only implement endpoints that actually exist in the current backend scope.

---

# 7.3 Authentication hardening `[OPENCODE]`

Implement where appropriate:

* generic invalid-login responses
* brute-force protection
* rate limiting
* secure cookie flags
* token expiration
* refresh-token rotation
* session revocation
* suspicious-session handling
* password policy
* security logging

---

# 8. AUTHORIZATION

## 8.1 RBAC `[OPENCODE]`

Implement authorization independently from authentication.

Authentication answers:

> Who are you?

Authorization answers:

> What are you allowed to do?

Initial roles should support progressive complexity.

Potential role model:

```text
OWNER
ADMIN
MEMBER
VIEWER
```

Do not expose unnecessary roles to solo users.

---

# 8.2 Permission architecture `[OPENCODE]`

Design permissions around actions rather than only screens.

Examples:

```text
project.read
project.create
project.update
project.delete

invoice.read
invoice.create
invoice.send

client.read
client.update

procurement.read
procurement.create

financials.read
financials.manage
```

---

# 8.3 Resource authorization `[OPENCODE]`

Authorization must consider:

```text
User
+
Membership
+
Tenant
+
Resource ownership
+
Permission
```

A user must never gain access simply because they know a resource UUID.

---

# 9. DOMAIN MODEL

Build the backend around explicit business domains.

Initial modules:

```text
Auth
Users
Tenants
Memberships
Clients
Leads
Projects
Phases
Tasks
Deliverables
Files
Proposals
Contracts
Approvals
Vendors
Products
Procurement
Site
Invoices
Payments
Expenses
Notifications
Audit
```

---

# 10. CLIENTS AND CRM

## 10.1 Leads `[OPENCODE]`

Implement:

* lead creation
* lead update
* lead source
* project type
* estimated budget
* notes
* status
* conversion to client

Potential lifecycle:

```text
NEW
CONTACTED
QUALIFIED
PROPOSAL
WON
LOST
```

---

## 10.2 Clients `[OPENCODE]`

Implement:

* client profiles
* contacts
* communication information
* projects
* notes
* client status
* archive

Design relationships carefully.

A client may eventually have multiple projects.

---

# 11. PROJECT MANAGEMENT

## 11.1 Projects `[OPENCODE]`

A project is the primary operational unit.

A project belongs to:

```text
Tenant
Client
```

and contains:

```text
Phases
Tasks
Deliverables
Files
Approvals
Procurement
Site reports
Invoices
Activity
```

---

## 11.2 Project phases `[OPENCODE]`

Support configurable phases.

Provide sensible defaults:

```text
Concept
Schematic Design
Design Development
Construction Documentation
Construction Administration
Closeout
```

Do not hardcode these as universal architectural truth.

Allow tenants to configure phases.

---

## 11.3 Tasks `[OPENCODE]`

Support:

* title
* description
* status
* priority
* due date
* assignee
* phase
* project
* completion
* activity

Architecture must support future team workloads.

---

# 12. DESIGN DELIVERABLES

## 12.1 Deliverables `[OPENCODE]`

Support:

```text
IN_PROGRESS
INTERNAL_REVIEW
SENT_TO_CLIENT
CLIENT_APPROVED
REVISION_REQUESTED
ARCHIVED
```

Each deliverable should support:

* version
* file reference
* phase
* status
* notes
* client approval
* revision history

---

# 13. FILE STORAGE

## 13.1 Storage architecture `[OPENCODE]`

Do not store large files directly inside PostgreSQL.

Use object storage.

Database stores metadata:

```text
File
 ├── id
 ├── tenant_id
 ├── project_id
 ├── storage_key
 ├── filename
 ├── mime_type
 ├── size
 ├── version
 └── created_by
```

Prepare for:

* S3-compatible storage
* signed upload URLs
* signed download URLs
* file versioning
* access control
* virus scanning
* metadata extraction

---

# 14. PROPOSALS

## 14.1 Proposal system `[OPENCODE]`

Support:

```text
DRAFT
SENT
VIEWED
APPROVED
REJECTED
EXPIRED
```

Proposal should contain:

* client
* project
* scope
* fees
* payment schedule
* terms
* expiration
* version

---

# 15. CONTRACTS

## 15.1 Contract lifecycle `[OPENCODE]`

Support:

```text
DRAFT
SENT
APPROVED
ACTIVE
COMPLETED
TERMINATED
```

Contract should connect:

```text
Client
Project
Scope
Fee structure
Payment schedule
Terms
```

---

# 16. CLIENT APPROVALS

## 16.1 Approval architecture `[OPENCODE]`

Support lightweight client approval links.

The client should not need a Renove account for basic approval.

Architecture:

```text
Designer
   ↓
Create approval
   ↓
Generate secure token/link
   ↓
Client opens mobile page
   ↓
Review
   ↓
Approve / Request changes
   ↓
Backend records immutable approval event
```

Never trust the frontend for approval state.

Store:

* timestamp
* deliverable/version
* action
* token/session reference
* optional comment
* IP metadata where legally appropriate

---

# 17. NOTIFICATIONS

## 17.1 Notification architecture `[OPENCODE]`

Prepare notification abstraction for:

```text
Email
WhatsApp
In-app
SMS
```

Do not couple business logic directly to one provider.

Example:

```text
NotificationService
        │
 ┌──────┼────────┐
 ▼      ▼        ▼
Email WhatsApp  SMS
```

---

# 18. BACKGROUND JOBS

## 18.1 Queue architecture `[OPENCODE]`

Introduce background jobs for operations that do not need to block HTTP requests.

Examples:

* email sending
* notification delivery
* PDF generation
* file processing
* image processing
* report generation
* AI processing
* payment reconciliation
* webhook processing

Architecture:

```text
API
 │
 └── enqueue job
        │
        ▼
      Redis
        │
        ▼
     Worker
        │
        ▼
     Result
```

---

# 19. REDIS

## 19.1 Redis foundation `[OPENCODE]`

Prepare Redis infrastructure for:

* caching
* queues
* distributed locks
* rate limiting
* short-lived state

Do not use Redis as the primary source of truth for business data.

---

# 20. CACHING `[USER BUILD]`

> **SYSTEMS ENGINEERING EXERCISE**

The user must personally implement the core caching strategy.

OpenCode should first document:

* what should be cached
* what should never be cached
* cache key design
* TTL strategy
* invalidation strategy
* stale data risks
* tenant isolation
* cache stampede prevention

Candidate cached resources:

```text
Tenant settings
User permissions
Project summaries
Dashboard aggregates
Frequently requested reference data
```

The user must implement:

* Redis cache
* cache-aside pattern
* TTLs
* invalidation
* tenant-safe keys
* cache miss behavior

Example:

```text
GET project
      │
      ▼
Check Redis
   │       │
 HIT      MISS
   │       │
   │       ▼
   │    PostgreSQL
   │       │
   │       ▼
   │     Redis
   │
   ▼
 Response
```

Required tests:

* cache hit
* cache miss
* expiration
* invalidation
* tenant isolation
* stale cache handling

---

# 21. DATABASE PERFORMANCE

## 21.1 Indexing `[OPENCODE]`

Identify indexes for:

* tenant_id
* foreign keys
* status fields where useful
* timestamps where useful
* unique business identifiers
* common filtering combinations

Do not blindly index every column.

---

# 21.2 Query optimization `[USER BUILD]`

The user should personally learn and implement:

* query plans
* `EXPLAIN`
* `EXPLAIN ANALYZE`
* index selection
* composite indexes
* pagination
* N+1 prevention
* query batching

OpenCode may review and explain the user's implementation.

---

# 22. PAGINATION

## 22.1 API pagination `[OPENCODE]`

Establish a consistent pagination contract.

Prefer cursor-based pagination where appropriate for large or frequently changing datasets.

Example:

```text
GET /projects?limit=25&cursor=...
```

Response:

```json
{
  "data": [],
  "meta": {
    "nextCursor": "...",
    "hasNextPage": true
  }
}
```

---

# 23. API DESIGN

## 23.1 REST conventions `[OPENCODE]`

Use predictable REST APIs.

Requirements:

* consistent naming
* consistent HTTP status codes
* DTO validation
* standardized errors
* pagination
* filtering
* sorting
* resource authorization
* versioning strategy

---

# 24. VALIDATION

## 24.1 Input validation `[OPENCODE]`

Validate:

* request body
* query parameters
* route parameters
* file metadata
* webhook payloads

Never trust client-side validation.

Frontend validation is UX.

Backend validation is security and correctness.

---

# 25. ERROR HANDLING

## 25.1 Global error architecture `[OPENCODE]`

Create consistent API errors.

Example:

```json
{
  "statusCode": 400,
  "code": "PROJECT_NOT_FOUND",
  "message": "Project not found",
  "requestId": "..."
}
```

Avoid leaking:

* stack traces
* SQL errors
* internal paths
* secrets
* sensitive infrastructure information

---

# 26. AUDIT LOGGING

## 26.1 Audit system `[OPENCODE]`

Important business events should be auditable.

Examples:

```text
LOGIN
LOGOUT
PROJECT_CREATED
PROJECT_UPDATED
DELIVERABLE_SENT
CLIENT_APPROVED
INVOICE_CREATED
PAYMENT_RECORDED
MEMBER_INVITED
PERMISSION_CHANGED
```

Audit record should include:

```text
actor
tenant
action
resource
resource_id
timestamp
metadata
```

---

# 27. SECURITY

## 27.1 Application security `[OPENCODE]`

Implement protection against:

* broken access control
* injection
* insecure direct object references
* credential attacks
* sensitive data exposure
* unsafe file uploads
* malicious webhooks
* excessive request rates
* replay attacks

---

# 27.2 Rate limiting `[USER BUILD]`

The user should personally implement rate limiting using Redis.

Study and implement:

* fixed window
* sliding window
* token bucket concepts
* per-IP limits
* per-user limits
* endpoint-specific limits

Apply stricter limits to:

```text
login
registration
password reset
verification
public approval links
webhooks
```

---

# 27.3 CSRF `[USER BUILD]`

The user should personally implement and understand CSRF protection where applicable to cookie-authenticated browser requests.

Document:

* threat model
* SameSite behavior
* CSRF tokens
* origin checking
* safe methods
* state-changing requests

---

# 28. WEBHOOKS

## 28.1 Webhook architecture `[OPENCODE]`

Prepare a generic webhook subsystem.

Requirements:

* signature verification
* idempotency
* event IDs
* retries
* dead-letter handling
* logging

Example:

```text
Provider
   ↓
Webhook
   ↓
Verify signature
   ↓
Check event ID
   ↓
Persist event
   ↓
Queue processing
   ↓
Business action
```

---

# 29. IDEMPOTENCY

## 29.1 Idempotent APIs `[USER BUILD]`

The user must personally implement idempotency for important operations.

Examples:

```text
Create invoice
Create payment
Process webhook
Send approval
Generate purchase order
```

Understand:

> If the same request arrives twice, the system should not accidentally perform the business operation twice.

Implement:

```text
Idempotency-Key
        ↓
Redis / Database
        ↓
Previously processed?
   │            │
 YES           NO
   │            │
return      execute
previous       │
result         ▼
             store
```

---

# 30. DISTRIBUTED LOCKING `[USER BUILD]`

Implement and understand distributed locks using Redis.

Potential use cases:

* duplicate background jobs
* concurrent report generation
* payment reconciliation
* scheduled tasks
* expensive calculations

The user must understand:

* lock ownership
* TTL
* deadlocks
* lock expiration
* race conditions
* why distributed locks are not magic synchronization

---

# 31. CONCURRENCY AND TRANSACTIONS

## 31.1 Database transactions `[OPENCODE]`

Use transactions for operations requiring atomicity.

Examples:

```text
Create project + default phases
Create invoice + line items
Approve deliverable + create audit event
Refresh session + revoke old session
```

---

# 31.2 Race conditions `[USER BUILD]`

The user should deliberately study and test race conditions.

Examples:

```text
Two users approve simultaneously
Two workers process same webhook
Two requests update same invoice
Two refresh requests rotate the same session
```

Implement appropriate safeguards using:

* transactions
* row locks
* unique constraints
* conditional updates
* idempotency
* distributed locks where necessary

---

# 32. SEARCH

## 32.1 Search architecture `[OPENCODE]`

Start with PostgreSQL search where sufficient.

Design the abstraction so a dedicated search engine can be introduced later.

Potential future:

```text
PostgreSQL
     ↓
Search abstraction
     ↓
OpenSearch / Elasticsearch
```

Do not introduce Elasticsearch/OpenSearch prematurely.

---

# 33. DASHBOARD AGGREGATIONS

## 33.1 Dashboard architecture `[OPENCODE]`

Dashboard metrics should not execute dozens of expensive queries on every request.

Prepare aggregation strategy for:

```text
Active projects
Outstanding invoices
Upcoming deadlines
Unpaid invoices
Project profitability
Recent activity
```

Potential future approaches:

* optimized SQL
* materialized views
* cached aggregates
* background aggregation

---

# 34. OBSERVABILITY

## 34.1 Logging `[OPENCODE]`

Implement structured logging.

Logs should contain:

```text
timestamp
level
requestId
userId where appropriate
tenantId where appropriate
route
duration
status
error code
```

Never log:

* passwords
* refresh tokens
* access tokens
* secrets
* sensitive payment data

---

# 34.2 Request correlation `[OPENCODE]`

Every request should receive a request/correlation ID.

Example:

```text
Client
  ↓ request-id
API
  ↓
Service
  ↓
Database / Queue
```

This should make debugging production failures possible.

---

# 35. METRICS `[USER BUILD]`

The user should personally implement application metrics.

Learn and expose:

```text
request_count
request_latency
error_count
database_latency
cache_hit_rate
cache_miss_rate
queue_depth
job_failure_count
active_sessions
```

Understand:

* counters
* gauges
* histograms
* percentiles
* RED metrics
* saturation

---

# 36. DISTRIBUTED TRACING `[USER BUILD]`

Implement tracing after basic logging/metrics are working.

Trace:

```text
HTTP request
 ↓
Service
 ↓
Database
 ↓
Redis
 ↓
Queue
 ↓
Worker
```

Understand:

* trace
* span
* context propagation
* latency attribution

---

# 37. HEALTH CHECKS

## 37.1 Health endpoints `[OPENCODE]`

Implement:

```text
/health
/health/live
/health/ready
```

Distinguish:

### Liveness

Is the process alive?

### Readiness

Can the application actually serve traffic?

Readiness may check:

* database
* Redis
* required infrastructure

Do not make liveness depend on every external service.

---

# 38. BACKGROUND WORKERS

## 38.1 Worker architecture `[OPENCODE]`

Separate API responsibilities from worker responsibilities.

Example:

```text
API container
Worker container
Scheduler container
```

Workers should be horizontally scalable.

Jobs must be:

* retryable
* observable
* idempotent where necessary
* safely recoverable

---

# 39. RETRY STRATEGIES

## 39.1 Retries `[USER BUILD]`

The user should implement and understand:

* exponential backoff
* jitter
* maximum attempts
* retryable vs non-retryable errors
* dead-letter queues

Never blindly retry every failure.

---

# 40. DEAD LETTER QUEUES `[USER BUILD]`

Implement a dead-letter strategy for permanently failing jobs.

Flow:

```text
Job
 ↓
Attempt
 ↓
Failure
 ↓
Retry
 ↓
Retry
 ↓
Max attempts
 ↓
Dead Letter Queue
```

The system must allow operators to inspect and replay failed jobs.

---

# 41. FILE PROCESSING

## 41.1 Upload pipeline `[OPENCODE]`

Design:

```text
Client
 ↓
Signed upload
 ↓
Object storage
 ↓
Upload event
 ↓
Queue
 ↓
Worker
 ↓
Virus scan / metadata / thumbnails
 ↓
Database
```

Large files must not pass unnecessarily through the API server.

---

# 42. PDF GENERATION

## 42.1 Documents `[OPENCODE]`

Generate:

* proposals
* contracts
* invoices
* purchase orders
* site reports

PDF generation should run asynchronously for expensive operations.

---

# 43. PAYMENTS

## 43.1 Payment abstraction `[OPENCODE]`

Do not tightly couple Renove to one payment provider.

Create an abstraction:

```text
PaymentService
      │
 ┌────┴─────┐
 ▼          ▼
Provider A Provider B
```

Support:

* payment creation
* payment status
* webhook processing
* reconciliation
* refunds where applicable
* idempotency

Payment provider selection must be decided separately.

---

# 44. GHANA-SPECIFIC FINANCIAL SYSTEMS

## 44.1 Financial architecture `[OPENCODE]`

Support:

* GHS
* invoices
* partial payments
* payment references
* receipts
* expenses
* project profitability

Do not hardcode tax rules without verified current requirements.

Tax logic should eventually be configurable and versioned.

---

# 45. WHATSAPP INTEGRATION

## 45.1 WhatsApp architecture `[OPENCODE]`

Treat WhatsApp as an external integration.

Do not make the entire domain model dependent on WhatsApp.

Potential actions:

```text
Send proposal
Send approval link
Send invoice
Send purchase order
Send site report
Notify client
```

Use an abstraction:

```text
MessagingService
       │
       ├── WhatsApp
       ├── Email
       └── SMS
```

---

# 46. AI WORKFLOWS

## 46.1 AI architecture `[OPENCODE]`

AI should accelerate workflows rather than become the product itself.

Potential jobs:

```text
Supplier specification extraction
Site report summarization
Client feedback summarization
Drawing QA/QC
Invoice line-item extraction
```

AI processing should be asynchronous.

Never block a normal API request unnecessarily on a long AI operation.

---

# 47. API VERSIONING

## 47.1 Version strategy `[OPENCODE]`

Establish a versioning strategy before public API adoption.

Example:

```text
/api/v1
```

Document breaking vs non-breaking changes.

---

# 48. OPENAPI / API DOCUMENTATION

## 48.1 API documentation `[OPENCODE]`

Generate and maintain OpenAPI documentation.

Every endpoint should document:

* authentication
* authorization
* request body
* query parameters
* response
* error responses
* examples

---

# 49. TESTING STRATEGY

## 49.1 Unit tests `[OPENCODE]`

Test:

* services
* domain logic
* authorization
* validation
* utility functions

---

# 49.2 Integration tests `[OPENCODE]`

Test:

* PostgreSQL interactions
* authentication
* transactions
* Redis interactions
* queues
* webhooks

---

# 49.3 End-to-end tests `[OPENCODE]`

Critical flows:

```text
Register
Login
Refresh
Logout

Create tenant
Create client
Create project
Create phase
Create deliverable
Send approval
Approve deliverable

Create invoice
Record payment
```

---

# 49.4 Multi-tenant security tests `[OPENCODE]`

This is mandatory.

Create tests proving:

```text
Tenant A cannot read Tenant B
Tenant A cannot update Tenant B
Tenant A cannot delete Tenant B
Tenant A cannot access Tenant B files
Tenant A cannot access Tenant B invoices
```

---

# 50. TESTING UNDER FAILURE `[USER BUILD]`

The user must personally practice failure-oriented testing.

Simulate:

* database unavailable
* Redis unavailable
* queue unavailable
* slow database
* duplicate webhook
* duplicate request
* worker crash
* expired token
* revoked session
* network timeout
* partial external-service failure

The objective is to understand how systems behave when things go wrong.

---

# 51. DATABASE BACKUPS

## 51.1 Backup strategy `[OPENCODE]`

Document:

* automated backups
* retention
* point-in-time recovery
* restore procedure
* backup encryption
* backup verification

A backup that has never been restored is not a proven recovery strategy.

---

# 52. DISASTER RECOVERY `[USER BUILD]`

The user should personally design the disaster recovery model.

Define:

### RPO

Recovery Point Objective.

How much data can be lost?

### RTO

Recovery Time Objective.

How quickly must the service recover?

Design:

```text
Database failure
 ↓
Restore / failover
 ↓
Application reconnect
 ↓
Queue recovery
 ↓
Traffic recovery
```

---

# 53. CONTAINERIZATION

## 53.1 Docker `[OPENCODE]`

Create production-ready containers.

Separate:

```text
api
worker
scheduler
```

Use multi-stage builds.

Do not ship unnecessary development dependencies into production images.

---

# 54. LOCAL DEVELOPMENT INFRASTRUCTURE

## 54.1 Docker Compose `[OPENCODE]`

Provide local infrastructure for:

```text
PostgreSQL
Redis
API
Worker
```

The developer should be able to start the complete backend environment predictably.

---

# 55. CI/CD

## 55.1 Continuous Integration `[OPENCODE]`

Pipeline should run:

```text
Install
 ↓
Lint
 ↓
Typecheck
 ↓
Unit tests
 ↓
Integration tests
 ↓
Build
```

Pull requests should fail if required checks fail.

---

# 56. CONTINUOUS DEPLOYMENT `[OPENCODE]`

Establish environments:

```text
development
staging
production
```

Deployment should be repeatable.

Never manually modify production application code.

---

# 57. SECRETS MANAGEMENT

## 57.1 Secrets `[OPENCODE]`

Never commit:

* database passwords
* JWT secrets
* API keys
* payment secrets
* WhatsApp credentials
* storage credentials

Prepare architecture for managed secret storage.

---

# 58. LOAD BALANCING `[USER BUILD]`

> **IMPORTANT SYSTEM DESIGN EXERCISE**

The user must personally implement the load-balancing architecture in a controlled environment.

Understand:

```text
                 Load Balancer
                 /     |     \
                /      |      \
             API-1   API-2   API-3
                \      |      /
                 \     |     /
                    Redis
                      │
                  PostgreSQL
```

Study:

* horizontal scaling
* stateless API servers
* health checks
* round-robin
* least connections
* sticky sessions
* reverse proxies
* TLS termination
* connection pooling

The API must remain stateless enough to scale horizontally.

---

# 59. HORIZONTAL SCALING `[USER BUILD]`

The user must demonstrate:

```text
1 API instance
       ↓
2 API instances
       ↓
3+ API instances
```

without breaking:

* authentication
* sessions
* caching
* queues
* WebSockets if introduced

Document what state must remain external to the application process.

---

# 60. DATABASE CONNECTION POOLING `[USER BUILD]`

The user should learn:

* connection pools
* maximum connections
* idle connections
* pool exhaustion
* API replicas × pool size
* database connection limits

Understand why:

```text
10 API servers × 20 DB connections
=
200 potential DB connections
```

can become a database bottleneck.

---

# 61. DATABASE READ REPLICAS `[USER BUILD]`

Prepare a future architecture:

```text
                PostgreSQL Primary
                 /            \
                /              \
        Read Replica 1     Read Replica 2
```

Understand:

* replication
* replication lag
* read/write splitting
* consistency implications
* which queries can tolerate stale data

Do not implement this until the system actually requires it.

---

# 62. DATABASE SHARDING `[USER BUILD / FUTURE]`

Do not implement initially.

The user should understand:

* why sharding exists
* horizontal partitioning
* shard keys
* tenant-based sharding
* cross-shard queries
* operational complexity

Only introduce after simpler scaling strategies are exhausted.

---

# 63. CACHING AT SCALE `[USER BUILD]`

Study:

```text
Client
 ↓
Load Balancer
 ↓
API instances
 ↓
Redis cluster
 ↓
PostgreSQL
```

Understand:

* distributed cache
* cache invalidation
* hot keys
* cache stampede
* eviction policies
* Redis availability
* consistency

---

# 64. RATE LIMITING AT SCALE `[USER BUILD]`

Rate limiting must work consistently across multiple API instances.

Do not rely only on in-memory counters.

Example:

```text
API-1 ─┐
API-2 ─┼── Redis rate limiter
API-3 ─┘
```

---

# 65. QUEUE SCALING `[USER BUILD]`

Understand:

```text
          Queue
       /    |    \
 Worker-1 Worker-2 Worker-3
```

Measure:

* queue depth
* processing rate
* failure rate
* retry count
* worker utilization

Understand horizontal worker scaling.

---

# 66. EVENT-DRIVEN ARCHITECTURE `[USER BUILD / FUTURE]`

Do not convert the entire application into event-driven architecture.

Instead understand where events are useful.

Example:

```text
DeliverableApproved
       │
       ├── audit
       ├── notification
       ├── activity feed
       └── analytics
```

Study:

* domain events
* integration events
* eventual consistency
* event consumers
* duplicate events
* ordering

---

# 67. OUTBOX PATTERN `[USER BUILD]`

Implement an outbox pattern for reliable event publishing.

Problem:

```text
Database transaction succeeds
       +
Event publishing fails
       =
inconsistent system
```

Outbox:

```text
Transaction
 ├── Business data
 └── Outbox event
          ↓
       Worker
          ↓
     External system
```

Understand why this improves reliability.

---

# 68. EVENTUAL CONSISTENCY `[USER BUILD]`

The user should understand when systems can temporarily disagree.

Examples:

```text
Invoice created
 ↓
Analytics updates later
```

or:

```text
Project updated
 ↓
Search index updates later
```

Not every part of the system needs immediate consistency.

---

# 69. API RESILIENCE `[USER BUILD]`

Study and implement where appropriate:

* timeouts
* retries
* exponential backoff
* circuit breakers
* bulkheads
* graceful degradation

Example:

```text
External Provider
       ↓
Timeout
       ↓
Retry
       ↓
Circuit opens
       ↓
Fallback
```

---

# 70. PERFORMANCE TESTING `[USER BUILD]`

Use a load-testing tool to test:

```text
Authentication
Dashboard
Projects
Clients
Invoices
File metadata
```

Measure:

* requests/sec
* p50
* p95
* p99 latency
* error rate
* CPU
* memory
* database utilization

Do not optimize based on intuition alone.

---

# 71. CAPACITY PLANNING `[USER BUILD]`

Create a basic capacity model.

Estimate:

```text
Users
Requests/user/day
Peak requests/sec
Database writes/sec
Storage growth
File bandwidth
Queue throughput
```

Then identify bottlenecks.

---

# 72. SYSTEM DESIGN DOCUMENTATION

## 72.1 Architecture Decision Records `[OPENCODE]`

For major architectural decisions create ADRs.

Example:

```text
ADR-001 Modular Monolith
ADR-002 PostgreSQL
ADR-003 Redis
ADR-004 HttpOnly Cookie Authentication
ADR-005 Object Storage
ADR-006 Background Jobs
```

Each ADR should contain:

```text
Context
Decision
Alternatives
Consequences
```

---

# 73. SECURITY THREAT MODEL `[USER BUILD]`

The user should personally perform a basic threat model.

Consider:

```text
User
Attacker
Tenant admin
Malicious employee
Compromised browser
Compromised API credential
Malicious file
Malicious webhook
```

Identify:

* assets
* attack surfaces
* trust boundaries
* threats
* mitigations

Use the backend architecture to reason about the threats rather than simply copying a security checklist.

---

# 74. OBSERVABILITY DASHBOARD `[USER BUILD]`

Build an operational dashboard showing:

```text
Requests
Errors
Latency
Database health
Redis health
Queue depth
Worker failures
Cache hit rate
Active jobs
```

The goal is to answer:

> Is the system healthy right now?

---

# 75. PRODUCTION READINESS

Before declaring backend MVP complete:

* [x] Authentication secure
* [x] Authorization verified
* [x] Tenant isolation tested
* [x] Database migrations reproducible
* [x] Validation implemented
* [ ] Error handling standardized
* [x] Rate limiting implemented
* [ ] Audit logging implemented
* [ ] File storage secure
* [ ] Background jobs reliable
* [ ] Webhooks idempotent
* [ ] Logs structured
* [ ] Health checks available
* [ ] Metrics available
* [ ] Backups configured
* [ ] CI pipeline working
* [x] Production build reproducible
* [x] Secrets externalized
* [ ] API documentation generated
* [x] Critical E2E tests passing

---

# 76. MVP BUSINESS MODULES

After infrastructure foundations are stable, implement the actual Renove business domains in this order:

## Phase A — Foundation

* [x] Auth
* [ ] Users
* [x] Tenants
* [x] Memberships
* [x] Authorization
* [ ] Audit

## Phase B — CRM

* [ ] Leads
* [ ] Clients
* [ ] Contacts

## Phase C — Projects

* [ ] Projects
* [ ] Phases
* [ ] Tasks
* [ ] Deliverables
* [ ] Files

## Phase D — Commercial

* [ ] Proposals
* [ ] Contracts
* [ ] Approval workflows

## Phase E — Money

* [ ] Invoices
* [ ] Invoice items
* [ ] Expenses
* [ ] Payments
* [ ] Financial summaries

## Phase F — Operations

* [ ] Vendors
* [ ] Products
* [ ] Specifications
* [ ] Procurement
* [ ] Site reports

## Phase G — Communication

* [ ] Notifications
* [ ] Email
* [ ] WhatsApp abstraction
* [ ] Client approval links

## Phase H — Automation

* [ ] Queues
* [ ] Workers
* [ ] PDF generation
* [ ] File processing
* [ ] AI jobs

---

# 77. FUTURE SYSTEMS

These should NOT block MVP.

Potential future systems:

* [ ] Search engine
* [ ] Read replicas
* [ ] Redis cluster
* [ ] Multiple API replicas
* [ ] Advanced load balancing
* [ ] Event bus
* [ ] Advanced analytics
* [ ] AI drawing QA
* [ ] AI specification extraction
* [ ] Vendor marketplace
* [ ] Accounting integrations
* [ ] Permit workflows
* [ ] Advanced profitability
* [ ] Studio capacity planning

---

# 78. DEFINITION OF DONE

A feature is not done when:

> "The endpoint works."

A feature is done when:

```text
Domain model
      ↓
Database
      ↓
Migration
      ↓
Validation
      ↓
Authorization
      ↓
Service logic
      ↓
API
      ↓
Tests
      ↓
Error handling
      ↓
Logging
      ↓
Documentation
      ↓
Frontend contract
      ↓
Production considerations
```

have all been considered.

---

# 79. OPEN CODE OPERATING RULE

At the beginning of every session:

1. Read this README.
2. Find the first unchecked `[OPENCODE]` or `[JOINT]` section.
3. Inspect the existing implementation.
4. Continue from the current state.
5. Do not redo completed work unnecessarily.
6. Do not skip ahead.
7. If a `[USER BUILD]` section is next, stop and explain the task to the user instead of implementing it.
8. After the user completes a `[USER BUILD]` section, review and test it.
9. Tick the section only after verification.
10. Continue.

---

# 80. USER SYSTEMS-ENGINEERING TRACK

The following topics are deliberately reserved for the user.

These are not merely features. They are intended to develop production systems-engineering ability.

* [ ] Caching / cache-aside
* [ ] Cache invalidation
* [ ] Query optimization
* [ ] Database indexing analysis
* [ ] Rate limiting
* [ ] Idempotency
* [ ] Distributed locks
* [ ] Race-condition handling
* [ ] Retry strategies
* [ ] Dead-letter queues
* [ ] Metrics
* [ ] Distributed tracing
* [ ] Failure testing
* [ ] Disaster recovery
* [ ] Load balancing
* [ ] Horizontal scaling
* [ ] Database connection pooling
* [ ] Read replicas
* [ ] Queue scaling
* [ ] Event-driven architecture
* [ ] Outbox pattern
* [ ] Eventual consistency
* [ ] API resilience
* [ ] Performance/load testing
* [ ] Capacity planning
* [ ] Security threat modeling
* [ ] Production observability

The objective is not to artificially over-engineer Renove.

The objective is to build the product normally while deliberately learning **why production systems eventually require these mechanisms**.

---

# 81. FINAL ARCHITECTURAL PRINCIPLE

Renove should begin as a clean modular monolith.

It should not begin as a collection of microservices.

The architecture should evolve approximately like this:

```text
                 STAGE 1
            Modular Monolith
                    │
                    ▼
                 STAGE 2
          Redis + Background Jobs
                    │
                    ▼
                 STAGE 3
       Observability + CI/CD + Scaling
                    │
                    ▼
                 STAGE 4
       Multiple API / Worker Instances
                    │
                    ▼
                 STAGE 5
       Read Replicas / Advanced Caching
                    │
                    ▼
                 STAGE 6
       Event-driven components where justified
                    │
                    ▼
                 STAGE 7
       Extract services only where necessary
```

The system should earn complexity.

Do not introduce distributed systems merely because they are technically interesting.

Introduce them when:

```text
Scale
+
Reliability
+
Performance
+
Team boundaries
+
Operational requirements
```

justify them.

---

# BACKEND COMPLETION

The backend is considered production-ready only when:

```text
Business functionality
        +
Security
        +
Testing
        +
Observability
        +
Infrastructure
        +
Deployment
        +
Failure handling
        +
Scalability
```

have all been addressed.

The final goal is not simply:

> "A NestJS API that works."

The goal is:

> **A production-grade multi-tenant SaaS backend that the developer understands deeply enough to scale, operate, debug, secure, and evolve.**
