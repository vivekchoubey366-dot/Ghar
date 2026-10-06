-- ============================================================
-- GHAR - AUTHENTICATION SQL QUERIES
-- PostgreSQL
-- ============================================================


-- ============================================================
-- USER REGISTRATION
-- ============================================================

INSERT INTO users (
    email,
    phone,
    password_hash,
    first_name,
    last_name,
    role,
    is_email_verified,
    is_phone_verified,
    is_identity_verified,
    is_active
)
VALUES (
    LOWER($1),
    $2,
    $3,
    $4,
    $5,
    COALESCE($6, 'buyer'),
    FALSE,
    FALSE,
    FALSE,
    TRUE
)
RETURNING
    id,
    email,
    phone,
    first_name,
    last_name,
    role,
    is_email_verified,
    is_phone_verified,
    is_identity_verified,
    is_active,
    created_at;


-- ============================================================
-- FIND USER BY ID
-- ============================================================

SELECT
    id,
    email,
    phone,
    password_hash,
    first_name,
    last_name,
    role,
    is_email_verified,
    is_phone_verified,
    is_identity_verified,
    is_active,
    last_login_at,
    created_at,
    updated_at
FROM users
WHERE id = $1;


-- ============================================================
-- FIND USER BY EMAIL
-- ============================================================

SELECT
    id,
    email,
    phone,
    password_hash,
    first_name,
    last_name,
    role,
    is_email_verified,
    is_phone_verified,
    is_identity_verified,
    is_active,
    last_login_at,
    created_at,
    updated_at
FROM users
WHERE LOWER(email) = LOWER($1);


-- ============================================================
-- FIND USER BY PHONE
-- ============================================================

SELECT
    id,
    email,
    phone,
    password_hash,
    first_name,
    last_name,
    role,
    is_email_verified,
    is_phone_verified,
    is_identity_verified,
    is_active,
    last_login_at,
    created_at,
    updated_at
FROM users
WHERE phone = $1;


-- ============================================================
-- FIND USER BY EMAIL OR PHONE
-- ============================================================

SELECT
    id,
    email,
    phone,
    password_hash,
    first_name,
    last_name,
    role,
    is_email_verified,
    is_phone_verified,
    is_identity_verified,
    is_active,
    last_login_at,
    created_at,
    updated_at
FROM users
WHERE
       LOWER(email) = LOWER($1)
    OR phone = $1
LIMIT 1;


-- ============================================================
-- CHECK EMAIL AVAILABILITY
-- ============================================================

SELECT EXISTS (
    SELECT 1
    FROM users
    WHERE LOWER(email) = LOWER($1)
) AS exists;


-- ============================================================
-- CHECK PHONE AVAILABILITY
-- ============================================================

SELECT EXISTS (
    SELECT 1
    FROM users
    WHERE phone = $1
) AS exists;


-- ============================================================
-- UPDATE LAST LOGIN
-- ============================================================

UPDATE users
SET
    last_login_at = NOW(),
    updated_at = NOW()
WHERE id = $1

RETURNING
    id,
    last_login_at;


-- ============================================================
-- UPDATE PASSWORD
-- ============================================================

UPDATE users
SET
    password_hash = $2,
    updated_at = NOW()
WHERE id = $1

RETURNING id;


-- ============================================================
-- CHANGE EMAIL
-- ============================================================

UPDATE users
SET
    email = LOWER($2),
    is_email_verified = FALSE,
    updated_at = NOW()
WHERE id = $1

RETURNING
    id,
    email,
    is_email_verified;


-- ============================================================
-- CHANGE PHONE
-- ============================================================

UPDATE users
SET
    phone = $2,
    is_phone_verified = FALSE,
    updated_at = NOW()
WHERE id = $1

RETURNING
    id,
    phone,
    is_phone_verified;


-- ============================================================
-- VERIFY EMAIL
-- ============================================================

UPDATE users
SET
    is_email_verified = TRUE,
    updated_at = NOW()
WHERE id = $1

RETURNING
    id,
    email,
    is_email_verified;


-- ============================================================
-- VERIFY PHONE
-- ============================================================

UPDATE users
SET
    is_phone_verified = TRUE,
    updated_at = NOW()
WHERE id = $1

RETURNING
    id,
    phone,
    is_phone_verified;


-- ============================================================
-- GET AUTH USER
-- ============================================================

SELECT
    id,
    email,
    phone,
    first_name,
    last_name,
    role,
    is_email_verified,
    is_phone_verified,
    is_identity_verified,
    is_active,
    last_login_at,
    created_at
FROM users
WHERE id = $1
  AND is_active = TRUE;


-- ============================================================
-- CREATE SESSION
-- ============================================================

INSERT INTO sessions (
    user_id,
    session_token,
    ip_address,
    user_agent,
    expires_at
)
VALUES (
    $1,
    $2,
    $3,
    $4,
    $5
)
RETURNING
    id,
    user_id,
    session_token,
    expires_at,
    created_at;


-- ============================================================
-- FIND SESSION
-- ============================================================

SELECT
    s.id,
    s.user_id,
    s.session_token,
    s.ip_address,
    s.user_agent,
    s.expires_at,
    s.created_at,

    u.email,
    u.phone,
    u.first_name,
    u.last_name,
    u.role,
    u.is_email_verified,
    u.is_phone_verified,
    u.is_identity_verified,
    u.is_active

FROM sessions s

JOIN users u
    ON u.id = s.user_id

WHERE
    s.session_token = $1
    AND s.revoked_at IS NULL
    AND s.expires_at > NOW()
    AND u.is_active = TRUE;


-- ============================================================
-- REVOKE SESSION
-- ============================================================

UPDATE sessions
SET
    revoked_at = NOW()
WHERE session_token = $1

RETURNING id;


-- ============================================================
-- REVOKE SESSION BY ID
-- ============================================================

UPDATE sessions
SET
    revoked_at = NOW()
WHERE id = $1

RETURNING id;


-- ============================================================
-- REVOKE ALL USER SESSIONS
-- ============================================================

UPDATE sessions
SET
    revoked_at = NOW()
WHERE
    user_id = $1
    AND revoked_at IS NULL

RETURNING id;


-- ============================================================
-- CLEAN EXPIRED SESSIONS
-- ============================================================

DELETE FROM sessions
WHERE
    expires_at <= NOW()
    OR revoked_at <= NOW() - INTERVAL '30 days';


-- ============================================================
-- STORE EMAIL VERIFICATION TOKEN
-- ============================================================

INSERT INTO verification_tokens (
    user_id,
    token_hash,
    token_type,
    expires_at
)
VALUES (
    $1,
    $2,
    'email_verification',
    $3
)
RETURNING
    id,
    expires_at;


-- ============================================================
-- STORE PHONE VERIFICATION TOKEN
-- ============================================================

INSERT INTO verification_tokens (
    user_id,
    token_hash,
    token_type,
    expires_at
)
VALUES (
    $1,
    $2,
    'phone_verification',
    $3
)
RETURNING
    id,
    expires_at;


-- ============================================================
-- STORE PASSWORD RESET TOKEN
-- ============================================================

INSERT INTO verification_tokens (
    user_id,
    token_hash,
    token_type,
    expires_at
)
VALUES (
    $1,
    $2,
    'password_reset',
    $3
)
RETURNING
    id,
    expires_at;


-- ============================================================
-- FIND VERIFICATION TOKEN
-- ============================================================

SELECT
    vt.id,
    vt.user_id,
    vt.token_hash,
    vt.token_type,
    vt.expires_at,
    vt.used_at,

    u.email,
    u.phone,
    u.is_active

FROM verification_tokens vt

JOIN users u
    ON u.id = vt.user_id

WHERE
    vt.token_hash = $1
    AND vt.token_type = $2
    AND vt.used_at IS NULL
    AND vt.expires_at > NOW()
    AND u.is_active = TRUE;


-- ============================================================
-- MARK TOKEN USED
-- ============================================================

UPDATE verification_tokens
SET
    used_at = NOW()
WHERE id = $1

RETURNING id;


-- ============================================================
-- DELETE OLD TOKENS
-- ============================================================

DELETE FROM verification_tokens
WHERE
    expires_at <= NOW()
    OR used_at <= NOW() - INTERVAL '30 days';


-- ============================================================
-- INVALIDATE OLD PASSWORD RESET TOKENS
-- ============================================================

UPDATE verification_tokens
SET
    used_at = NOW()
WHERE
    user_id = $1
    AND token_type = 'password_reset'
    AND used_at IS NULL;


-- ============================================================
-- GET USER PROFILE
-- ============================================================

SELECT
    u.id,
    u.email,
    u.phone,
    u.first_name,
    u.last_name,
    u.role,
    u.is_email_verified,
    u.is_phone_verified,
    u.is_identity_verified,
    u.is_active,

    up.occupation,
    up.annual_income,
    up.city,
    up.state,
    up.country,
    up.postal_code,
    up.preferences

FROM users u

LEFT JOIN user_profiles up
    ON up.user_id = u.id

WHERE u.id = $1;


-- ============================================================
-- CREATE USER PROFILE
-- ============================================================

INSERT INTO user_profiles (
    user_id,
    occupation,
    annual_income,
    city,
    state,
    country,
    postal_code,
    preferences
)
VALUES (
    $1,
    $2,
    $3,
    $4,
    $5,
    COALESCE($6, 'India'),
    $7,
    COALESCE($8::jsonb, '{}'::jsonb)
)
ON CONFLICT (user_id)
DO UPDATE SET
    occupation = EXCLUDED.occupation,
    annual_income = EXCLUDED.annual_income,
    city = EXCLUDED.city,
    state = EXCLUDED.state,
    country = EXCLUDED.country,
    postal_code = EXCLUDED.postal_code,
    preferences = EXCLUDED.preferences

RETURNING *;


-- ============================================================
-- UPDATE USER PROFILE
-- ============================================================

UPDATE user_profiles
SET
    occupation = COALESCE($2, occupation),
    annual_income = COALESCE($3, annual_income),
    city = COALESCE($4, city),
    state = COALESCE($5, state),
    country = COALESCE($6, country),
    postal_code = COALESCE($7, postal_code),
    preferences = COALESCE($8::jsonb, preferences),
    updated_at = NOW()
WHERE user_id = $1

RETURNING *;


-- ============================================================
-- UPDATE BASIC USER INFORMATION
-- ============================================================

UPDATE users
SET
    first_name = COALESCE($2, first_name),
    last_name = COALESCE($3, last_name),
    updated_at = NOW()
WHERE id = $1

RETURNING
    id,
    first_name,
    last_name,
    email,
    phone,
    role;


-- ============================================================
-- DISABLE USER ACCOUNT
-- ============================================================

UPDATE users
SET
    is_active = FALSE,
    updated_at = NOW()
WHERE id = $1

RETURNING id, is_active;


-- ============================================================
-- REACTIVATE USER ACCOUNT
-- ============================================================

UPDATE users
SET
    is_active = TRUE,
    updated_at = NOW()
WHERE id = $1

RETURNING id, is_active;


-- ============================================================
-- LOGIN SECURITY / FAILED LOGIN TRACKING
-- ============================================================

SELECT
    id,
    email,
    is_active,
    last_login_at
FROM users
WHERE LOWER(email) = LOWER($1);


-- ============================================================
-- AUTHENTICATION AUDIT LOG
-- ============================================================

INSERT INTO audit_logs (
    user_id,
    action,
    resource,
    resource_id,
    ip_address,
    user_agent,
    metadata
)
VALUES (
    $1,
    $2,
    'authentication',
    $3,
    $4,
    $5,
    COALESCE($6::jsonb, '{}'::jsonb)
)
RETURNING id;


-- ============================================================
-- LOGIN HISTORY
-- ============================================================

SELECT
    id,
    action,
    ip_address,
    user_agent,
    metadata,
    created_at
FROM audit_logs
WHERE
    user_id = $1
    AND resource = 'authentication'
ORDER BY created_at DESC
LIMIT $2
OFFSET $3;


-- ============================================================
-- ACTIVE USER SESSIONS
-- ============================================================

SELECT
    id,
    session_token,
    ip_address,
    user_agent,
    expires_at,
    created_at
FROM sessions
WHERE
    user_id = $1
    AND revoked_at IS NULL
    AND expires_at > NOW()
ORDER BY created_at DESC;


-- ============================================================
-- END OF AUTH QUERIES
-- ============================================================