# AI Agent Handbook for Mizban Delivery Backend

Every AI coding agent must read this file before making code changes in this repository.

## 1. Purpose

This repository is a Node.js delivery backend with Express, MongoDB/Mongoose, Socket.IO, Agenda, Firebase push notifications, and a modular feature layout. This handbook is the source of truth for how agents should understand, modify, test, debug, and review work in this exact codebase.

Agents must read the project-specific guidance below before touching application code.

## 2. Rule priority

When instructions conflict, apply the following priority order:

1. Explicit user and developer requirements
2. AGENTS.md
3. Relevant files in docs/
4. Existing project conventions in the codebase
5. General engineering best practices

A lower-priority rule never overrides a higher-priority rule.

## 3. Required reading

Before modifying code, read these files in order:

- [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md)
- [docs/ENGINEERING_STANDARDS.md](docs/ENGINEERING_STANDARDS.md)
- [docs/AI_DEVELOPMENT_POLICY.md](docs/AI_DEVELOPMENT_POLICY.md)
- [docs/TESTING_AND_QUALITY.md](docs/TESTING_AND_QUALITY.md)
- [docs/SECURITY_AND_DATA.md](docs/SECURITY_AND_DATA.md)

Then inspect the relevant source code in the affected module and adjacent layers.

## 4. Mandatory workflow

Use this workflow for every change:

Understand
→ Inspect
→ Search
→ Plan
→ Implement
→ Test
→ Review Diff
→ Report

## 5. Core rules

### Understand before coding

Before writing code, identify:

- requirement
- expected behavior
- affected modules
- affected API endpoints and payloads
- affected data models and database collections
- related tests
- possible regression risks

### Inspect before modifying

Inspect related code before making a change, especially:

- routes
- middleware
- controllers
- services
- models
- DTOs and schemas
- utilities
- jobs
- socket handlers
- tests

### Search before creating

Before creating a new helper, utility, service, validator, DTO, constant, middleware, model method, or abstraction, search the repository first. Prefer reuse over duplication.

### Smallest correct change

Only make the changes required by the task.

Do not:

- refactor unrelated code
- rename unrelated code
- clean up unrelated legacy code
- reorganize the project unnecessarily
- introduce unnecessary abstractions

### Preserve existing behavior

Do not change API contracts, database behavior, authentication behavior, or existing conventions unless explicitly required.

### No guessing

If the requirement is ambiguous:

- do not invent behavior
- identify the ambiguity
- ask for clarification when it affects correctness or architecture
- use a minimal safe assumption only when appropriate

### Testing

Always test changed behavior when practical.

Never claim a test passed unless it was actually executed.

### Final review

Before finishing:

- inspect the git diff
- check for unnecessary changes
- check edge cases
- check security implications
- check duplication and reuse
- check regression risk
- check for missing tests

## 6. Repository-specific expectations

This repository is JavaScript-first and uses ESM modules. Most work happens in feature modules under src/modules, with shared helpers and middleware under src/shared and infrastructure under src/config and src/jobs.

Key implementation patterns in this repo:

- Express 5 app with route modules grouped per feature
- Mongoose models for persistence
- Zod-based validation in DTO/schema files
- custom AppError wrapper for operational errors
- Pino-based structured logging
- JWT auth with refresh-token rotation
- Socket.IO real-time communication
- Agenda-based background jobs
- Vitest for tests

Agents should prefer existing patterns over inventing new ones.

## 7. Documentation map

- [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md): actual architecture and request flow
- [docs/ENGINEERING_STANDARDS.md](docs/ENGINEERING_STANDARDS.md): coding conventions and repo-specific patterns
- [docs/AI_DEVELOPMENT_POLICY.md](docs/AI_DEVELOPMENT_POLICY.md): AI behavior and stop conditions
- [docs/TESTING_AND_QUALITY.md](docs/TESTING_AND_QUALITY.md): tests, commands, and quality workflow
- [docs/SECURITY_AND_DATA.md](docs/SECURITY_AND_DATA.md): auth, secrets, permissions, and data handling
