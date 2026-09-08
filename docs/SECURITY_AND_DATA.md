# Security and Data Handling

This repository uses a number of practical backend security controls. These are based on the source code and should be treated as the authoritative guidance.

## Authentication and authorization

### JWT authentication

The backend issues and verifies JWTs through src/shared/utils/jwt.js.

Key behaviors:

- access tokens are signed with `jsonwebtoken`
- refresh tokens are random hex strings and hashed before storage
- JWT verification is used by authMiddleware and Socket.IO handshake authentication
- token payload includes user ID, email, and role

### Refresh token handling

- refresh tokens are stored in a dedicated RefreshTokenModel
- tokens are hashed before persistence
- expiration is enforced using `REFRESH_TOKEN_EXPIRES_TIME`
- old or expired tokens are rejected

### Password handling

- passwords are hashed with `bcryptjs`
- reset and verification tokens are hashed before being saved to the user record
- password-change checks compare JWT iat against `changedPasswordAt`

### Role-based access

Role checks are enforced with `authorizeRole` middleware and the shared enum set in src/shared/utils/enums.js.

Current known roles in the code:

- admin
- driver
- customer
- business

The app uses role checks on sensitive routes such as admin-only operations and driver-specific order actions.

## Firebase and push notifications

The code includes Firebase Admin integration and FCM token handling.

Evidence:

- `firebase-admin` is installed in package.json
- FCM tokens are stored on user devices
- notifications can be emitted over Socket.IO or sent via push notification helpers when a user is offline

This is a real device-notification channel and must be treated as sensitive data.

## File uploads and media

The project includes Multer-based upload middleware and static file serving for uploads.

Evidence:

- `multer` is installed
- `src/shared/middleware/uploadFile.js` exists
- src/app.js serves static files from `src/uploads`

Agents must not assume any file upload path is public unless it matches the actual code.

## Environment variables and secrets

The backend uses `dotenv/config` via the app and test setup.

Security rules for agents:

- never expose secrets
- never copy `.env` values into documentation
- never log passwords, tokens, or credentials
- never share raw environment data in chat or commits
- do not add secret values to docs, comments, or examples

## MongoDB and data integrity

The repository uses MongoDB and Mongoose with indexes and schema constraints.

Examples in the source:

- unique email index on user records
- unique partial index on Google ID
- unique partial index on `devices.deviceId`
- route validation before persistence
- duplicate key handling in errorHandler

Agents must treat database changes as high-risk and follow the policy in [docs/AI_DEVELOPMENT_POLICY.md](AI_DEVELOPMENT_POLICY.md).

## Socket.IO security

Socket.IO authentication validates the incoming token from the client's handshake.

Behavior:

- if no token is present, the socket is treated as guest and not fully authenticated
- if the token is invalid, the socket is disconnected
- authenticated users are joined to a personal room
- admins are also joined to the admins room

This is an important security and authorization surface.

## Data handling rules

The following rules are mandatory for AI agents:

- never expose secrets
- never copy `.env` values into documentation
- never log passwords
- never log tokens
- never log credentials
- never bypass authorization
- never weaken authentication
- validate user-controlled input
- do not use production data in tests

## High-risk areas

Changes involving the following should be treated as high-risk and reviewed carefully:

- authentication
- authorization
- roles and permissions
- password resets or email verification
- FCM tokens and device registration
- uploads and files
- production data handling
- user access control
- any persisted contract or token flow

If a task touches one of these areas, inspect the specific module and surrounding middleware before changing or adding logic.

## Known data-handling conventions

The repository stores operational data in MongoDB and uses event-driven notification patterns for realtime updates. It intentionally separates authentication, authorization, business logic, and persistence into modules and shared utilities rather than embedding everything in route handlers.
