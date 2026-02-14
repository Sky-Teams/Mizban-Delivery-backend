Mizban Delivery System

This document explains the folder structure of the Mizban Delivery System backend project. The project uses a modular architecture to separate concerns and make it scalable and maintainable.

Folder Structure

```

src/
├── modules/ # Feature-based modules
│ ├── deliveries/
│ │ ├── dto/ # Zod schemas for request/response validation
│ │ │ ├── create-delivery.schema.js
│ │ │ ├── update-delivery.schema.js
│ │ │ └── delivery-response.schema.js
│ │ │
│ │ ├── models/ # Database models (shared across versions)
│ │ │ └── delivery.model.js
│ │ │
│ │ ├── services/ # Business logic
│ │ │ ├── v1/ # Version 1 services (if changed)
│ │ │ │ └── delivery.service.js
│ │ │ └── v2/ # Version 2 services (only if needed)
│ │ │ └── delivery.service.js
│ │ │
│ │ ├── controllers/ # Handle requests/responses
│ │ │ ├── v1/ # Version 1 controllers
│ │ │ │ └── delivery.controller.js
│ │ │ └── v2/ # Version 2 controllers (only if behavior changed)
│ │ │ └── delivery.controller.js
│ │ │
│ │ ├── routes/ # Express routes
│ │ │ ├── v1/ # /api/v1/deliveries
│ │ │ │ └── delivery.routes.js
│ │ │ └── v2/ # /api/v2/deliveries
│ │ │ └── delivery.routes.js
│ │
│ ├── drivers/
│ ├── businesses/
│ ├── finance/
│ ├── notifications/
│ └── rewards/
│
├── shared/ # Cross-module utilities
│ ├── middleware/ # Validation, authentication, error handling
│ ├── errors/ # Custom Error classes
│ ├── utils/ # Helper functions (date, geo, calculations)
│ └── event-bus/ # Event emitter for internal events
│
├── config/ # Environment & app configurations
│ └── db.js
│
├── app.js # Express app setup
└── server.js # App entry point

```

Explanation

modules/: Each module represents a functional area. Modules have models, services, controllers, routes, and dto schemas for request/response validation.

shared/: Contains utilities and helpers used across modules, including middleware, custom errors, and event handling.

config/: Contains environment and database configuration files.

app.js: Sets up the Express application, middleware, and routes.

server.js: Entry point that starts the server and listens on the configured port.
