# AI Development Policy

This document defines the expected behavior for AI coding agents working in this repository.

## Before implementation

The agent must:

1. Understand the requirement.
2. Inspect the related code paths.
3. Search for reusable implementations.
4. Identify the affected files.
5. Identify the risks and edge cases.
6. Create a minimal implementation plan before changing code.

## Scope control

Only modify files required by the task.

Report unrelated problems instead of fixing them automatically.

## Human approval and stop conditions

The AI agent must stop and request human review before proceeding when a change would:

### Architecture

- introduce a new architectural layer
- perform major module restructuring
- replace an existing architecture

### Dependencies

- add or remove dependencies
- change critical dependency versions

### Database

- major schema or collection changes
- migrations
- destructive changes
- major index changes
- database architecture changes

### API

- break API compatibility
- change persisted contracts
- change authentication behavior

### Infrastructure

- major Redis changes
- queue changes
- worker architecture changes
- scheduled-job architecture changes
- deployment or infrastructure changes

### Security

- authentication changes
- authorization changes
- token handling changes
- secrets handling
- production access changes
- permission model changes

### Financial systems

If the repository adds payment, wallet, settlement, commission, refund, or financial transaction logic, the agent must explain:

- why the change is needed
- alternatives considered
- migration requirements
- rollback strategy
- operational risks

before proceeding.

## Safe coding expectations

- Do not invent APIs or hidden behaviors.
- Do not silently change contracts.
- Do not bypass authorization or authentication checks.
- Do not log passwords, tokens, or credentials.
- Do not copy values from `.env` into docs or code comments.
- Validate user-controlled input before persistence or execution.
- Prefer existing shared utilities and established patterns over custom one-off implementations.

## Change quality rules

- Keep the change as small as possible while satisfying the requirement.
- Avoid unrelated refactors.
- Preserve module boundaries and current conventions.
- Check the diff before finishing.
- Add or update tests when the change affects behavior and practical coverage is available.

## Risk-sensitive modules

This repo contains high-risk flows around authentication, authorization, notifications, driver assignment, and orders. Changes in these areas require extra inspection and careful validation.

When in doubt, inspect the existing module and adjacent paths, then ask for clarification if the requirement is unclear.
