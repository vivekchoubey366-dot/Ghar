-- ============================================================
-- GHAR - USER SQL QUERIES
-- PostgreSQL
-- ============================================================


-- ============================================================
-- CREATE USER
-- ============================================================

INSERT INTO users (
    email,
    phone,
    password_hash,
    first_name,
    last_name,
    role,
    status,
    email_verified,
    phone_verified,
    metadata
)
VALUES (
    $1,
    $2,
    $3,
    $4,
    $5,
    COALESCE($6, 'buyer'),
    COALESCE($7, 'active'),
    COALESCE($8, FALSE),
    COALESCE($9, FALSE),
    COALESCE($10::jsonb, '{}'::jsonb)
)
RETURNING *;


-- ============================================================
-- GET USER BY ID
-- ============================================================

SELECT
    u.*

FROM users u

WHERE u.id = $1

LIMIT 1;


-- ============================================================
-- GET USER BY EMAIL
-- ============================================================

SELECT
    u.*

FROM users u

WHERE
    LOWER(u.email) = LOWER($1)

LIMIT 1;


-- ============================================================
-- GET USER BY PHONE
-- ============================================================

SELECT
    u.*

FROM users u

WHERE
    u.phone = $1

LIMIT 1;


-- ============================================================
-- GET USER BY EMAIL OR PHONE
-- ============================================================

SELECT
    u.*

FROM users u

WHERE
       LOWER(u.email) = LOWER($1)
    OR u.phone = $1

LIMIT 1;


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
    u.status,
    u.avatar_url,
    u.date_of_birth,
    u.gender,
    u.email_verified,
    u.phone_verified,
    u.created_at,
    u.updated_at

FROM users u

WHERE u.id = $1

LIMIT 1;


-- ============================================================
-- GET USER WITH PROFILE DETAILS
-- ============================================================

SELECT
    u.*,

    up.address_line1,
    up.address_line2,
    up.city,
    up.state,
    up.country,
    up.pincode,
    up.bio,
    up.occupation,
    up.company_name,
    up.preferences

FROM users u

LEFT JOIN user_profiles up
    ON up.user_id = u.id

WHERE u.id = $1

LIMIT 1;


-- ============================================================
-- CREATE USER PROFILE
-- ============================================================

INSERT INTO user_profiles (
    user_id,
    address_line1,
    address_line2,
    city,
    state,
    country,
    pincode,
    bio,
    occupation,
    company_name,
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
    $8,
    $9,
    $10,
    COALESCE($11::jsonb, '{}'::jsonb)
)
RETURNING *;


-- ============================================================
-- UPDATE USER
-- ============================================================

UPDATE users
SET
    email = COALESCE($2, email),
    phone = COALESCE($3, phone),
    first_name = COALESCE($4, first_name),
    last_name = COALESCE($5, last_name),
    avatar_url = COALESCE($6, avatar_url),
    date_of_birth = COALESCE($7, date_of_birth),
    gender = COALESCE($8, gender),
    metadata = COALESCE(
        $9::jsonb,
        metadata
    ),
    updated_at = NOW()

WHERE id = $1

RETURNING *;


-- ============================================================
-- UPDATE USER PROFILE
-- ============================================================

UPDATE user_profiles
SET
    address_line1 = COALESCE($2, address_line1),
    address_line2 = COALESCE($3, address_line2),
    city = COALESCE($4, city),
    state = COALESCE($5, state),
    country = COALESCE($6, country),
    pincode = COALESCE($7, pincode),
    bio = COALESCE($8, bio),
    occupation = COALESCE($9, occupation),
    company_name = COALESCE($10, company_name),
    preferences = COALESCE(
        $11::jsonb,
        preferences
    ),
    updated_at = NOW()

WHERE user_id = $1

RETURNING *;


-- ============================================================
-- UPDATE USER EMAIL
-- ============================================================

UPDATE users
SET
    email = LOWER($2),
    email_verified = FALSE,
    updated_at = NOW()

WHERE id = $1

RETURNING *;


-- ============================================================
-- UPDATE USER PHONE
-- ============================================================

UPDATE users
SET
    phone = $2,
    phone_verified = FALSE,
    updated_at = NOW()

WHERE id = $1

RETURNING *;


-- ============================================================
-- VERIFY EMAIL
-- ============================================================

UPDATE users
SET
    email_verified = TRUE,
    email_verified_at = NOW(),
    updated_at = NOW()

WHERE id = $1

RETURNING *;


-- ============================================================
-- VERIFY PHONE
-- ============================================================

UPDATE users
SET
    phone_verified = TRUE,
    phone_verified_at = NOW(),
    updated_at = NOW()

WHERE id = $1

RETURNING *;


-- ============================================================
-- CHANGE PASSWORD
-- ============================================================

UPDATE users
SET
    password_hash = $2,
    password_changed_at = NOW(),
    updated_at = NOW()

WHERE id = $1

RETURNING id;


-- ============================================================
-- UPDATE USER ROLE
-- ============================================================

UPDATE users
SET
    role = $2,
    updated_at = NOW()

WHERE id = $1

RETURNING *;


-- ============================================================
-- ACTIVATE USER
-- ============================================================

UPDATE users
SET
    status = 'active',
    updated_at = NOW()

WHERE id = $1

RETURNING *;


-- ============================================================
-- DEACTIVATE USER
-- ============================================================

UPDATE users
SET
    status = 'inactive',
    updated_at = NOW()

WHERE id = $1

RETURNING *;


-- ============================================================
-- SUSPEND USER
-- ============================================================

UPDATE users
SET
    status = 'suspended',
    suspension_reason = $2,
    suspended_at = NOW(),
    updated_at = NOW()

WHERE id = $1

RETURNING *;


-- ============================================================
-- UNSUSPEND USER
-- ============================================================

UPDATE users
SET
    status = 'active',
    suspension_reason = NULL,
    suspended_at = NULL,
    updated_at = NOW()

WHERE id = $1

RETURNING *;


-- ============================================================
-- SOFT DELETE USER
-- ============================================================

UPDATE users
SET
    status = 'deleted',
    deleted_at = NOW(),
    updated_at = NOW()

WHERE id = $1

RETURNING id;


-- ============================================================
-- RESTORE USER
-- ============================================================

UPDATE users
SET
    status = 'active',
    deleted_at = NULL,
    updated_at = NOW()

WHERE
    id = $1
    AND status = 'deleted'

RETURNING *;


-- ============================================================
-- UPDATE LAST LOGIN
-- ============================================================

UPDATE users
SET
    last_login_at = NOW(),
    login_count = COALESCE(login_count, 0) + 1,
    updated_at = NOW()

WHERE id = $1

RETURNING
    id,
    last_login_at,
    login_count;


-- ============================================================
-- UPDATE LAST ACTIVE
-- ============================================================

UPDATE users
SET
    last_active_at = NOW(),
    updated_at = NOW()

WHERE id = $1

RETURNING id, last_active_at;


-- ============================================================
-- GET USER DASHBOARD SUMMARY
-- ============================================================

SELECT
    u.id,
    u.first_name,
    u.last_name,
    u.email,
    u.phone,
    u.role,
    u.status,
    u.avatar_url,
    u.email_verified,
    u.phone_verified,
    u.created_at,
    u.last_login_at,

    (
        SELECT COUNT(*)
        FROM properties p
        WHERE p.owner_id = u.id
    ) AS property_count,

    (
        SELECT COUNT(*)
        FROM favourites f
        WHERE f.user_id = u.id
    ) AS favourite_count,

    (
        SELECT COUNT(*)
        FROM visits v
        WHERE v.user_id = u.id
    ) AS visit_count,

    (
        SELECT COUNT(*)
        FROM offers o
        WHERE o.buyer_id = u.id
    ) AS offer_count,

    (
        SELECT COUNT(*)
        FROM applications a
        WHERE a.user_id = u.id
    ) AS application_count

FROM users u

WHERE u.id = $1;


-- ============================================================
-- GET USER PROPERTY COUNT
-- ============================================================

SELECT
    COUNT(*) AS total_properties,

    COUNT(*) FILTER (
        WHERE status = 'published'
    ) AS published_properties,

    COUNT(*) FILTER (
        WHERE status = 'draft'
    ) AS draft_properties,

    COUNT(*) FILTER (
        WHERE status = 'sold'
    ) AS sold_properties,

    COUNT(*) FILTER (
        WHERE status = 'rented'
    ) AS rented_properties

FROM properties

WHERE owner_id = $1;


-- ============================================================
-- GET USER ACTIVITY
-- ============================================================

SELECT
    al.id,
    al.action,
    al.resource,
    al.resource_id,
    al.metadata,
    al.ip_address,
    al.created_at

FROM audit_logs al

WHERE al.user_id = $1

ORDER BY al.created_at DESC

LIMIT $2
OFFSET $3;


-- ============================================================
-- GET USER NOTIFICATIONS
-- ============================================================

SELECT
    n.*

FROM notifications n

WHERE n.user_id = $1

ORDER BY n.created_at DESC

LIMIT $2
OFFSET $3;


-- ============================================================
-- MARK NOTIFICATION AS READ
-- ============================================================

UPDATE notifications
SET
    is_read = TRUE,
    read_at = NOW()

WHERE
    id = $1
    AND user_id = $2

RETURNING *;


-- ============================================================
-- MARK ALL NOTIFICATIONS AS READ
-- ============================================================

UPDATE notifications
SET
    is_read = TRUE,
    read_at = NOW()

WHERE
    user_id = $1
    AND is_read = FALSE

RETURNING id;


-- ============================================================
-- DELETE NOTIFICATION
-- ============================================================

DELETE FROM notifications

WHERE
    id = $1
    AND user_id = $2

RETURNING id;


-- ============================================================
-- GET UNREAD NOTIFICATION COUNT
-- ============================================================

SELECT
    COUNT(*) AS unread_count

FROM notifications

WHERE
    user_id = $1
    AND is_read = FALSE;


-- ============================================================
-- SEARCH USERS
-- ============================================================

SELECT
    u.id,
    u.email,
    u.phone,
    u.first_name,
    u.last_name,
    u.role,
    u.status,
    u.avatar_url,
    u.email_verified,
    u.phone_verified,
    u.created_at,
    u.last_login_at

FROM users u

WHERE
       u.email ILIKE '%' || $1 || '%'
    OR u.phone ILIKE '%' || $1 || '%'
    OR u.first_name ILIKE '%' || $1 || '%'
    OR u.last_name ILIKE '%' || $1 || '%'
    OR (
        u.first_name || ' ' || u.last_name
    ) ILIKE '%' || $1 || '%'

ORDER BY u.created_at DESC

LIMIT $2
OFFSET $3;


-- ============================================================
-- GET USERS BY ROLE
-- ============================================================

SELECT
    u.id,
    u.email,
    u.phone,
    u.first_name,
    u.last_name,
    u.role,
    u.status,
    u.created_at

FROM users u

WHERE
    u.role = $1
    AND u.status <> 'deleted'

ORDER BY u.created_at DESC

LIMIT $2
OFFSET $3;


-- ============================================================
-- GET USERS BY STATUS
-- ============================================================

SELECT
    u.*

FROM users u

WHERE u.status = $1

ORDER BY u.created_at DESC

LIMIT $2
OFFSET $3;


-- ============================================================
-- ADMIN - ALL USERS
-- ============================================================

SELECT
    u.id,
    u.email,
    u.phone,
    u.first_name,
    u.last_name,
    u.role,
    u.status,
    u.avatar_url,
    u.email_verified,
    u.phone_verified,
    u.created_at,
    u.last_login_at,
    u.last_active_at

FROM users u

WHERE u.status <> 'deleted'

ORDER BY u.created_at DESC

LIMIT $1
OFFSET $2;


-- ============================================================
-- USER COUNT
-- ============================================================

SELECT
    COUNT(*) AS total_users,

    COUNT(*) FILTER (
        WHERE status = 'active'
    ) AS active_users,

    COUNT(*) FILTER (
        WHERE status = 'inactive'
    ) AS inactive_users,

    COUNT(*) FILTER (
        WHERE status = 'suspended'
    ) AS suspended_users,

    COUNT(*) FILTER (
        WHERE status = 'deleted'
    ) AS deleted_users

FROM users;


-- ============================================================
-- USERS BY ROLE STATISTICS
-- ============================================================

SELECT
    role,
    COUNT(*) AS user_count

FROM users

WHERE status <> 'deleted'

GROUP BY role

ORDER BY user_count DESC;


-- ============================================================
-- USER REGISTRATION TREND
-- ============================================================

SELECT
    DATE_TRUNC(
        'day',
        created_at
    ) AS date,

    COUNT(*) AS registrations

FROM users

WHERE
    created_at >= $1
    AND created_at < $2

GROUP BY DATE_TRUNC(
    'day',
    created_at
)

ORDER BY date ASC;


-- ============================================================
-- USER LOGIN TREND
-- ============================================================

SELECT
    DATE_TRUNC(
        'day',
        last_login_at
    ) AS date,

    COUNT(*) AS users_logged_in

FROM users

WHERE
    last_login_at >= $1
    AND last_login_at < $2

GROUP BY DATE_TRUNC(
    'day',
    last_login_at
)

ORDER BY date ASC;


-- ============================================================
-- CHECK EMAIL AVAILABILITY
-- ============================================================

SELECT NOT EXISTS (
    SELECT 1

    FROM users

    WHERE
        LOWER(email) = LOWER($1)
        AND status <> 'deleted'
) AS available;


-- ============================================================
-- CHECK PHONE AVAILABILITY
-- ============================================================

SELECT NOT EXISTS (
    SELECT 1

    FROM users

    WHERE
        phone = $1
        AND status <> 'deleted'
) AS available;


-- ============================================================
-- CREATE USER PREFERENCE
-- ============================================================

INSERT INTO user_preferences (
    user_id,
    preference_key,
    preference_value
)
VALUES (
    $1,
    $2,
    $3::jsonb
)
ON CONFLICT (
    user_id,
    preference_key
)
DO UPDATE SET
    preference_value = EXCLUDED.preference_value,
    updated_at = NOW()

RETURNING *;


-- ============================================================
-- GET USER PREFERENCES
-- ============================================================

SELECT
    preference_key,
    preference_value

FROM user_preferences

WHERE user_id = $1

ORDER BY preference_key;


-- ============================================================
-- GET SINGLE USER PREFERENCE
-- ============================================================

SELECT
    preference_key,
    preference_value

FROM user_preferences

WHERE
    user_id = $1
    AND preference_key = $2

LIMIT 1;


-- ============================================================
-- DELETE USER PREFERENCE
-- ============================================================

DELETE FROM user_preferences

WHERE
    user_id = $1
    AND preference_key = $2

RETURNING *;


-- ============================================================
-- CREATE USER SESSION
-- ============================================================

INSERT INTO user_sessions (
    user_id,
    token_hash,
    device_name,
    device_type,
    ip_address,
    user_agent,
    expires_at
)
VALUES (
    $1,
    $2,
    $3,
    $4,
    $5,
    $6,
    $7
)
RETURNING *;


-- ============================================================
-- GET USER SESSIONS
-- ============================================================

SELECT
    id,
    user_id,
    device_name,
    device_type,
    ip_address,
    user_agent,
    created_at,
    last_active_at,
    expires_at

FROM user_sessions

WHERE
    user_id = $1
    AND expires_at > NOW()

ORDER BY last_active_at DESC;


-- ============================================================
-- DELETE SESSION
-- ============================================================

DELETE FROM user_sessions

WHERE
    id = $1
    AND user_id = $2

RETURNING id;


-- ============================================================
-- DELETE ALL USER SESSIONS
-- ============================================================

DELETE FROM user_sessions

WHERE user_id = $1

RETURNING id;


-- ============================================================
-- CLEAN EXPIRED SESSIONS
-- ============================================================

DELETE FROM user_sessions

WHERE expires_at <= NOW()

RETURNING id;


-- ============================================================
-- UPDATE SESSION ACTIVITY
-- ============================================================

UPDATE user_sessions
SET
    last_active_at = NOW()

WHERE
    id = $1
    AND user_id = $2
    AND expires_at > NOW()

RETURNING *;


-- ============================================================
-- CREATE USER LOGIN HISTORY
-- ============================================================

INSERT INTO login_history (
    user_id,
    login_method,
    ip_address,
    user_agent,
    device_type,
    success,
    failure_reason
)
VALUES (
    $1,
    $2,
    $3,
    $4,
    $5,
    $6,
    $7
)
RETURNING *;


-- ============================================================
-- GET USER LOGIN HISTORY
-- ============================================================

SELECT
    lh.*

FROM login_history lh

WHERE lh.user_id = $1

ORDER BY lh.created_at DESC

LIMIT $2
OFFSET $3;


-- ============================================================
-- USER AUDIT HISTORY
-- ============================================================

SELECT
    al.*

FROM audit_logs al

WHERE
    al.user_id = $1

ORDER BY al.created_at DESC

LIMIT $2
OFFSET $3;


-- ============================================================
-- ADMIN USER AUDIT HISTORY
-- ============================================================

SELECT
    al.*,

    u.first_name,
    u.last_name,
    u.email

FROM audit_logs al

LEFT JOIN users u
    ON u.id = al.user_id

WHERE
    al.resource = 'user'
    AND al.resource_id = $1

ORDER BY al.created_at ASC;


-- ============================================================
-- END OF USER QUERIES
-- ============================================================