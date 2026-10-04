# GHAR Utils — Full JavaScript

Utility layer for the GHAR real-estate platform.

Includes:
- logging and API responses
- application errors
- validation
- cryptography and secure token helpers
- JWT HS256 signing/verification
- PBKDF2 password hashing
- OTP generation
- email adapter/template helpers
- file/image validation
- pagination
- slug generation
- currency/number/date formatting
- RBAC permissions
- subscription plans/status helpers
- verification-level workflow helpers

Security-sensitive integrations (email provider, storage, database, KYC, production secrets)
remain adapter/configuration responsibilities.
