# Integration Changelog

## Overview
This document tracks the changes made to integrate the Frontend with the User Service and CMS Service.

## Port Assignments
- **Service Registry**: `8761`
- **Gateway Service**: `8888`
- **User Service**: `9090`
- **CMS Service**: `8083`
- **Frontend (Dev)**: `8080` (Proxies to Gateway 8888)

## Proxy Configuration
The `vite.config.ts` has been updated to proxy all API requests to the **Gateway Service (8888)**. The Gateway then handles routing to microservices via Eureka Service Discovery.

### Routes (via Gateway)
- **To User Service**: `/login`, `/register`, `/api/users/**`, ...
- **To CMS Service**: `/api/content/**`, `/api/schema/**`, ...

## Files Modified
1.  **`vite.config.ts`**: Configured `server.proxy` to point to `http://localhost:8888`.
2.  **`src/lib/api.ts`**: Updated `API_BASE_URL` to be configurable.
3.  **`src/components/AddModuleModal.tsx`**: Fixed syntax error.

## How to Run the Stack
1.  **Service Registry** (REQUIRED):
    - Run `serviceregistry` (Port 8761).
2.  **Gateway Service** (REQUIRED):
    - Run `gateway-service` (Port 8888).
3.  **Microservices**:
    - Run `userservice` (9090).
    - Run `cms-service` (8083).
4.  **Frontend**:
    - Run `npm run dev`.


## Notes
- If any service is down, the frontend might return 500 or 504 errors. Ensure all backend services are running.
- The `API_BASE_URL` in `api.ts` defaults to an empty string to leverage the Vite proxy. IN PRODUCTION, this should be set to the URL of the API Gateway or Nginx reverse proxy.
