Perfect. Below is your **combined, ultra-detailed Master System Design v12 (Markdown edition)** merging:

* v9 (Microservices + Prisma + DDL depth)
* v11 (Enterprise scaling, governance, security, cost, observability)

You can save this as:

```
Maphari_Master_System_Design_v12.md
```

---

# Maphari Technologies

# Master System Design v12

## Complete Enterprise Architecture Blueprint

Microservices-First | Production-Ready | Investor-Grade

Generated: 2026-02-17

---

# 0. Executive Summary

Maphari Technologies is built on a **microservices-first architecture** designed for:

* Long-term scalability
* Enterprise-grade security
* Strict service boundaries
* Independent deployability
* Cost-efficient early-stage growth
* Seamless international operation

The platform supports:

* Marketing website
* Client portal
* Admin dashboard
* Real-time chat
* File management
* Billing & invoicing
* Automation workflows

All behind a secure API Gateway.

---

# 1. Architecture Overview

## High-Level Flow

```
Users (Web / Mobile)
        ↓
Next.js Frontend (Marketing + Portal + Admin)
        ↓
API Gateway (NestJS BFF)
        ↓
Microservices:
  - Auth
  - Core
  - Chat
  - Files
  - Billing
  - Automation
        ↓
Infrastructure:
  - PostgreSQL (schema-per-service)
  - Redis (cache + queues)
  - Message Bus (NATS / RabbitMQ)
  - Object Storage (S3-compatible)
  - Observability Stack
```

---

# 2. Microservices Model (Starting Architecture)

Maphari **starts with microservices**, not as a future plan.

Each service:

* Owns its PostgreSQL schema
* Owns its Prisma migrations
* Has its own Docker image
* Communicates via REST + events
* Is independently deployable

---

# 3. Service Ownership & Boundaries

## Strict Rules

1. No cross-schema joins in production
2. No direct Prisma access between services
3. Cross-service access only via:

   * REST
   * Event Bus
4. Every business event must include:

   * `eventId`
   * `occurredAt`
   * `clientId`
   * `entityId`

## Data Ownership Matrix

| Service    | Owns Data                | Communication        |
| ---------- | ------------------------ | -------------------- |
| Auth       | Users, roles             | Events               |
| Core       | Clients, Projects, Leads | REST + events        |
| Chat       | Conversations, Messages  | Events               |
| Files      | File metadata            | REST                 |
| Billing    | Invoices, Payments       | Events               |
| Automation | Workflows, JobLogs       | Subscribes to events |

---

# 4. Platform Scope

## Marketing

* Homepage
* Services
* Testimonials
* Contact / Booking

## Client Portal

* View Projects
* Real-time Chat
* File Uploads
* View Invoices

## Admin Dashboard

* Leads pipeline
* Client management
* Project management
* Billing management
* Automation management
* Audit logs

---

# 5. Authentication & Authorization

## Authentication Flow

1. User logs in via Magic Link (NextAuth)
2. Gateway exchanges session for short-lived JWT
3. JWT used for all API requests

## Token Strategy

* Access Token: 15 minutes
* Refresh Token: 7 days
* Secret rotation: 90 days

## Roles

* ADMIN
* STAFF
* CLIENT

## Client Data Isolation (Critical)

Every CLIENT query must include:

```sql
WHERE clientId = scopedClientId
```

Additionally verify:

```ts
project.clientId === scopedClientId
```

---

# 6. API Versioning Strategy

All APIs use versioned routing:

```
/api/v1/portal/*
/api/v1/admin/*
```

Rules:

* Never break v1
* Introduce v2 only for breaking changes
* Deprecation window: 6 months

---

# 7. API Response & Error Standard

## Success

```json
{
  "success": true,
  "data": {},
  "meta": {}
}
```

## Error

```json
{
  "success": false,
  "error": {
    "code": "PROJECT_NOT_FOUND",
    "message": "Project not found",
    "details": {}
  }
}
```

## Requirements

* Include `requestId`
* Standardized error codes
* Consistent HTTP status usage

---

# 8. Enterprise Data Model (ERD)

## Auth Schema

* User
* LoginEvent
* AuditLog

## Core Schema

* Client
* ClientUser
* Project
* Lead

## Chat Schema

* Conversation
* Message
* Attachment

## Files Schema

* File

## Billing Schema

* Invoice
* Payment

---

# 9. Database Strategy (Prisma + PostgreSQL)

## Schema-Per-Service Model

Schemas:

```
auth_schema
core_schema
chat_schema
files_schema
billing_schema
automation_schema
admin_schema
```

Each service has:

```
prisma/schema.prisma
prisma/migrations/
```

## DATABASE_URL Pattern

```
postgresql://USER:PASSWORD@HOST:5432/maphari?schema=core_schema
```

---

# 10. PostgreSQL DDL Strategy

Includes:

## Enums

* user_role
* project_type
* project_status
* lead_status
* invoice_status

## Constraints

* UNIQUE(email)
* UNIQUE(clientId, userId)
* UNIQUE(invoice.number)

## Indexed Fields

* clientId
* status
* conversationId + createdAt
* invoiceId
* email

---

# 11. Automations

| Trigger         | Action                    |
| --------------- | ------------------------- |
| lead.created    | Notify admin + auto-reply |
| project.created | Create milestones         |
| message.created | SLA timer                 |
| invoice.issued  | Send email                |
| invoice.overdue | Escalate                  |
| file.uploaded   | Notify watchers           |

Automation Service subscribes to all domain events.

---

# 12. Observability & Monitoring

## Logging

Structured JSON logs including:

* requestId
* userId
* clientId
* serviceName
* latency

## Metrics

* API latency (p95)
* Error rate %
* DB query duration
* Queue depth
* Active WebSocket connections

## Alert Thresholds

* 5xx > 2%
* DB CPU > 80%
* Queue backlog > 1000

---

# 13. Scaling Strategy

## Horizontal Scaling

* Stateless services
* Multiple replicas
* Load balancer distribution

## WebSocket Scaling

* Redis adapter
* Sticky sessions

## Database Evolution

1. Single instance
2. Read replicas
3. Partition by clientId

---

# 14. Security Hardening

* HTTPS everywhere
* Strict CORS
* Rate limiting per IP + user
* Webhook signature verification
* Secret vault storage
* Dependency audits
* Audit logs
* DTO validation
* Optional future: Row-level security

---

# 15. Cost Optimization Roadmap

## Phase 1 (MVP)

* Single VPS
* Postgres on same server

## Phase 2

* Managed Postgres
* Managed Redis

## Phase 3

* Multi-zone deployment
* CDN edge scaling

---

# 16. Deployment Architecture

## Containers

* Next.js
* API Gateway
* Each microservice

## Infrastructure

* Load balancer
* Managed PostgreSQL
* Managed Redis
* S3-compatible storage
* CI/CD via GitHub Actions

---

# 17. Governance & Engineering Standards

## Branching

```
main
dev
feature/*
```

## Versioning

Semantic versioning:

```
MAJOR.MINOR.PATCH
```

## PR Policy

* Pull request required
* Code review mandatory

## Migration Rules

* Named migrations
* One service per migration
* No cross-service schema changes

---

# 18. Future Extension Services

* AI Service
* Analytics Service
* Notification Service
* Public API Service

Execution backlog: `docs/backlog/phase-7-future-services-backlog.md`

---

# 19. Recommended Monorepo Structure

```
maphari-platform/
  apps/
    web/
    gateway/
    services/
      auth/
      core/
      chat/
      files/
      billing/
      automation/
  packages/
    contracts/
    shared/
    ui/
  infra/
  docs/
```

---

# 20. Operational Runbooks

## Must-Have Runbooks

* Deployment
* Rollback
* Database restore
* Key rotation
* Incident response

---

# Final Statement

This v12 document represents a:

* Microservices-first
* Enterprise-ready
* Investor-grade
* Scalable
* Secure
* Cost-optimized
* Globally deployable
