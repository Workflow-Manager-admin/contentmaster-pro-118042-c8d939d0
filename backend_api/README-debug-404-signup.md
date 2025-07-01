# Debug Process for 404/400 on /api/auth/signup

## Problem
- POST to `/api/auth/signup` on backend_api returns:
  - 404 on ports 4000/3000 (expected, backend runs on 3001)
  - 400 `{"message":"Invalid role"}` on port 3001 for all roles.
- Inspecting SQLite DB shows: `roles` table does NOT exist.

## Root Cause
- The roles table (and initial roles) were not created or seeded in the database.
- As a result, no valid roles exist, so signup always fails with "Invalid role".

## Next Step
- Rerun the seed script to create roles and initial users:
  ```
  node src/seed/seed.js
  ```
- This will allow registration to work for valid roles: "admin", "editor", "viewer".

## Test Command for Signup
```sh
curl -i -X POST http://localhost:3001/api/auth/signup -H 'Content-Type: application/json' -d '{"username":"testuser","email":"testuser@example.com","password":"testpass","role":"viewer"}'
```

## Resolution
- After running the seed, retest signup: it should succeed unless the username or email is already taken.
