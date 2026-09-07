# Architecture

## Project structure

The repository is organized as a modular Express backend with feature folders under src/modules and cross-cutting infrastructure under src/shared, src/config, src/jobs, and src/tests.

```text
src/
├── app.js
├── server.js
├── workers.js
├── config/
│   ├── agenda.js
│   ├── cors.js
│   ├── db.js
│   ├── firebaseAdmin.js
│   └── socket.js
├── jobs/
│   ├── calculation.job.js
│   ├── email.job.js
│   └── offer.job.js
├── modules/
│   ├── businessCustomers/
│   ├── businesses/
│   ├── drivers/
│   ├── locations/
│   ├── log/
│   ├── notifications/
│   ├── offers/
│   ├── orders/
│   ├── settings/
│   └── users/
├── scripts/
│   └── seed.js
├── shared/
│   ├── errors/
│   ├── event-bus/
│   ├── logger/
│   ├── middleware/
│   ├── schemas/
│   ├── socket/
│   └── utils/
├── tests/
│   ├── config/
│   ├── integration/
│   └── unit/
└── uploads/
```

## Modules

Actual feature modules currently present in src/modules:

- businessCustomers: admin-facing customer business relationships and CRUD workflow
- businesses: business profile and admin-managed business records
- drivers: driver accounts, statuses, assignment logic, and driver-related services
- locations: location-related service logic used in order/driver workflows
- log: administrative log access and query endpoints
- notifications: notification models, event listeners, and push notification plumbing
- offers: offer records and driver offer handling
- orders: primary order lifecycle, pricing, assignments, driver actions, and statistics
- settings: application settings and admin configuration
- users: auth, login, registration, password reset, refresh tokens, device registration, and profile APIs

The actual module set is more specific than the generic README example. Some README references to broader or legacy modules do not match the current code.

## Request flow

The standard request path in this project is:

```text
Route
→ Middleware (auth, role checks, validation, logging)
→ Controller
→ Service
→ Model / MongoDB
```

Examples from the codebase:

- Public auth endpoints live under src/modules/users/routes/v1/auth.routes.js.
- Protected endpoints are mounted after authMiddleware in src/app.js.
- Validation is enforced with validate(...) before controller execution.
- Controllers are thin and delegate to service methods.
- Services contain business logic and call Mongoose models.
- Errors are normalized through AppError and errorHandler.

## Shared layer

Key shared concerns are centralized in src/shared:

- middleware/
  - asyncHandler.js wraps async controller/service work
  - authMiddleware.js verifies JWTs and loads the user
  - authorizeRole.js enforces role-based access
  - validate.js validates request body/params/query with Zod
  - errorHandler.js turns exceptions into API responses
  - loggerMiddleware.js logs requests
  - mongoIdValidator.js validates ObjectId params
- errors/
  - AppError and normalized error helpers
- utils/
  - JWT helpers, distance logic, geo logic, pagination, push notification helpers, notification payload builders, email helper, auth helper, settings validator
- logger/
  - Pino logger with weekly rotating file transports for application, error, exception, and audit logs
- event-bus/
  - EventEmitter-based internal event bus used for asynchronous flows
- socket/
  - Socket.IO event registration and room logic

## Database

The backend uses MongoDB with Mongoose.

Evidence in code:

- src/config/db.js calls mongoose.connect(process.env.DB_URI)
- src/modules/_/models/_.model.js define Mongoose schemas and exported models
- User model includes unique indexes for email and Google ID; driver/device logic also uses unique partial indexes
- The app initializes the database on startup from src/server.js

The app does not implement a custom repository layer; service files call Mongoose models directly.

## Realtime

Realtime communication is implemented with Socket.IO.

Evidence:

- src/config/socket.js creates a Socket.IO server on the HTTP server
- CustomSocket.initialize(server) validates JWT from socket.handshake.auth.token
- Users join a personal room by user ID and admins join an admins room
- Methods emitToUser, emitToAdmins, and emitToDrivers send events to clients
- src/shared/socket/registerSocketEvents.js registers socket event handlers

This is the real-time layer for notifications and driver/admin communication.

## Jobs and workers

The project uses Agenda for scheduled/background jobs.

Evidence:

- src/config/agenda.js creates an Agenda instance backed by MongoDB
- src/workers.js registers jobs and starts the worker
- src/jobs/ contains:
  - offer.job.js: offer timeout handling
  - email.job.js: reset-password and email-verification mail jobs
  - calculation.job.js: calculation-related jobs

The server starts the Agenda worker in src/server.js. The application uses the same process for API + worker initialization, which is intentional in this repo.

## Important system flows

### Authentication flow

```text
User submits register/login request
→ auth.routes.js
→ auth.controller.js
→ auth.service.js
→ UserModel / RefreshTokenModel
→ JWT access token + refresh token issued
→ client stores tokens and attaches Authorization header or device metadata
```

The JWT is verified by authMiddleware before protected endpoints are allowed.

### Order lifecycle flow

```text
Admin creates order
→ order controller/service
→ order model saved
→ eventBus emits order:created
→ notification listeners trigger admin/driver notifications
→ nearest drivers scored
→ offers sent to relevant drivers
→ driver accepts or rejects offer
→ order updated from created → assigned → picked up → delivered/returned/cancelled
```

This flow is implemented through the event bus, notification listeners, and background job support.

### Notification flow

```text
Domain event
→ eventBus listeners in src/modules/notifications/listeners/
→ NotificationService / Socket events / push notification payloads
→ admin or user socket room or FCM devices
```

## Architecture rules for agents

When modifying architecture:

- prefer the existing module-based layout
- do not add a new architectural layer without explicit justification
- do not replace the Express + Mongoose + Socket.IO + Agenda design unless the task requires it
- do not create new abstraction layers when a feature already has a clear pattern
- respect current route, service, and model boundaries
- preserve requests and responses consistent with current handlers
