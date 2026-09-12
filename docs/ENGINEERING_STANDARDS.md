# Engineering Standards

This repository uses a practical JavaScript backend style. These conventions are derived from the actual implementation in src/.

## JavaScript and module conventions

- Project type: ESM (`"type": "module"` in package.json)
- Files are `.js`, not TypeScript
- Node.js requirement is `>=20.0.0`
- Import aliases are used in many files:
  - `#shared/*` for shared utilities and middleware
  - `#modules/*` for module code
  - `#config/*` for config files
  - `#root` for repo-root references
- Imports are usually direct and explicit; they follow the local module layout instead of broad index-style import patterns.

## Naming conventions

- camelCase for variables, function names, route names, and utility functions
- PascalCase for model classes or exported model constants such as `UserModel`
- route and folder names use lowercase, with versioned subdirectories such as `routes/v1` and `services/v1`
- DTO/schema files often use lowercase descriptive names like `create-order.schema.js`

## File structure conventions

Feature modules follow a stable pattern:

```text
src/modules/<feature>/
├── controllers/v1/
├── dto/
├── models/
├── routes/v1/
├── services/v1/
├── index.js
└── ...
```

Examples from the current repo include:

- src/modules/users/
- src/modules/orders/
- src/modules/notifications/
- src/modules/drivers/
- src/modules/businesses/

## Controllers

Controllers are thin entry points. They usually:

- receive request data from Express
- call a service method
- forward result or error to the framework
- do not contain most business logic

Example pattern:

- route calls controller wrapped in asyncHandler
- controller invokes service
- service performs business logic and DB access

## Services

Services hold the real business logic and DB interaction.

Examples from the repo:

- auth service for registration, login, JWT issuance, email verification, password reset
- order service for lifecycle actions, pricing, assignment, and statistics
- notification service for messaging and push actions

Services are the place to implement validation rules, token generation, DB updates, and cross-module coordination.

## Models

Models are Mongoose schemas exported as named constants.

Examples:

- UserModel
- RefreshTokenModel
- OrderModel
- BusinessModel
- DriverModel

Standard patterns:

- schema definitions live in models/
- indexes are declared on the schema
- schema methods add object behavior such as `createToken()` on the user model
- service code uses model methods directly (`findById`, `findOne`, `create`, `findOneAndUpdate`)

## Validation and DTOs

Validation is performed with Zod schemas, combined with the custom validate middleware.

Pattern:

```js
router.post('/example', validate(createExampleValidator), asyncHandler(controllerFn));
```

The validate middleware:

- runs the schema against request data
- throws an AppError on failure
- applies validated body/params/query back to req only when present
- keeps request parsing consistent across endpoints

DTO/schema files are stored under each module's dto/ directory and are used as the contract for request validation.

## Error handling

The repo uses a consistent custom error flow:

- AppError extends Error with `status`, `code`, `field`, and `errors`
- services throw AppError or helper constructors like notFound(), unauthorized(), routeNotFound()
- errorHandler.js formats API responses
- operational errors are returned with a consistent JSON shape

Typical response fields include:

- code
- message
- messages
- field

This is the authoritative pattern for backend error responses.

## Logging

The repo uses Pino, configured in src/shared/logger/logger.js.

Key characteristics:

- logs are written to `logs/application`, `logs/error`, `logs/exceptions`, and `logs/audit`
- logs rotate weekly
- file limits are configured in the transport setup
- some request-level logging is added via loggerMiddleware

Agents should not replace Pino with another logging stack unless the task explicitly requires it.

## Async patterns

The codebase uses async/await as the default style.

Common pattern:

- async route handlers
- async service methods
- Promise rejection passed to asyncHandler
- background jobs scheduled through Agenda

## API conventions

- routes are mounted under `api` prefixes such as `/api/auth`, `/api/orders`, `/api/drivers`
- public routes are mounted before authMiddleware in src/app.js
- protected routes are mounted after authMiddleware
- role checks are enforced with `authorizeRole(ROLES.X)`
- validation happens before controller logic
- error handling occurs centrally in app.js through errorHandler

## Formatting and linting

The repository includes:

- ESLint: `npm run lint`
- Prettier: `npm run format`

The codebase already uses consistent spacing, semicolon usage, and ESM import syntax. Do not impose a different style for a small change.

## Comments

Comments should explain:

- purpose of non-obvious functions
- reasoning behind complex logic
- important edge cases

Do not add comments for obvious code.

Do not mass-comment existing code.

## Code reuse

Before creating a new abstraction, search for an existing implementation.

Examples of reuse points already present in the repo:

- validation middleware
- JWT helpers
- notification payload builders
- custom error factories
- shared utils for geo and order pricing

## API compatibility

Preserve current endpoint behavior and response conventions.

When modifying an endpoint, inspect similar endpoints first so the change matches the existing contract.

Do not broaden or silently change the meaning of an endpoint's request or response shape without explicit requirement and validation.
