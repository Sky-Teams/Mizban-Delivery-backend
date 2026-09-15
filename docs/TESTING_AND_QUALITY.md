# Testing and Quality

This repository uses Vitest for automated tests and ESLint/Prettier for code quality checks.

## Available commands

The actual scripts defined in package.json are:

```bash
npm test
npm run test:watch
npm run test:coverage
npm run test:unit
npm run test:integration
npm run test:e2e
npm run lint
npm run lint:fix
npm run format
npm run dev
npm run start
npm run worker
npm run seed
```

The GitHub Actions workflow also runs:

```bash
npm install
npm run lint
npm test
npm run test:coverage
```

## Test configuration

The actual Vitest configuration is in vitest.config.js.

Key points:

- environment: node
- globals: enabled
- include pattern: `src/tests/**/*.test.js`
- setup file: `vitest.setup.js`
- default timeout: 30000 ms

This means tests are expected under the src/tests directory and are Node-based backend tests, not browser tests.

## Test layout

The repository has test folders under src/tests:

- unit/
- integration/
- e2e/

Examples in the current repo include:

- src/tests/unit/modules/users/v1/*.test.js
- src/tests/unit/modules/ordres/v1/*.test.js
- src/tests/integration/modules/users/v1/*.test.js
- src/tests/integration/modules/orders/v1/*.test.js
- src/tests/e2e/ (present as placeholder or application-level smoke tests)

The repository is structured to test controllers, services, routes, and end-to-end flows in the same app-level conventions.

## Choosing the right test level

Use the smallest useful test for the changed behavior:

- Unit tests: isolated logic in a service, helper, validator, or controller
- Integration tests: route + middleware + controller + service + MongoDB memory setup
- E2E tests: user-visible or cross-module flow spanning multiple services or external interactions

General guidance:

- If a change is limited to a single service method, prefer a unit test.
- If the change crosses controller/service/model boundaries, prefer an integration test.
- If the change exercises whole business flows across modules, use e2e coverage when practical.

## Testing rules for AI agents

- Changed behavior should have relevant tests when practical.
- Bug fixes should include regression tests when practical.
- Do not weaken tests to make them pass.
- Do not claim tests passed without running them.
- Clearly report which tests were executed.
- Prefer targeted validation over broad suites when the change is small.

## Quality gates

Before considering work complete:

- verify the changed behavior with the most relevant test command
- inspect whether adjacent tests are affected
- check lint if the codebase or changed files are in active linting scope
- confirm the diff does not include unrelated changes

## Known repository behavior

The project currently uses MongoDB memory setup in tests, and CI runs lint and the full Vitest suite. The actual commands above are the evidence-backed source of truth for validation in this repo.
