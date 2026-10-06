-- ============================================================
-- GHAR - PROPERTY VISIT SQL QUERIES
-- PostgreSQL
-- ============================================================


-- ============================================================
-- CREATE VISIT REQUEST
-- ============================================================

INSERT INTO visits (
    property_id,
    user_id,
    owner_id,
    requested_date,
    requested_time,
    visit_type,
    status,
    message,
    contact_phone,
    metadata
)
VALUES (
    $1,
    $2,
    $3,
    $4,
    $5,
    COALESCE($6, 'physical'),
    COALESCE($7, 'pending'),
    $8,
    $9,
    COALESCE($10::jsonb, '{}'::jsonb)
)
RETURNING *;


-- ============================================================
-- GET VISIT BY ID
-- ============================================================

SELECT
    v.*,

    p.title AS property_title,
    p.property_type,
    p.listing_type,
    p.city,
    p.locality,
    p.price,
    p.images AS property_images,

    requester.first_name AS requester_first_name,
    requester.last_name AS requester_last_name,
    requester.email AS requester_email,
    requester.phone AS requester_phone,

    owner.first_name AS owner_first_name,
    owner.last_name AS owner_last_name,
    owner.email AS owner_email,
    owner.phone AS owner_phone

FROM visits v

JOIN properties p
    ON p.id = v.property_id

JOIN users requester
    ON requester.id = v.user_id

LEFT JOIN users owner
    ON owner.id = v.owner_id

WHERE v.id = $1

LIMIT 1;


-- ============================================================
-- GET USER VISITS
-- ============================================================

SELECT
    v.*,

    p.title AS property_title,
    p.property_type,
    p.listing_type,
    p.price,
    p.city,
    p.locality,
    p.images AS property_images

FROM visits v

JOIN properties p
    ON p.id = v.property_id

WHERE v.user_id = $1

ORDER BY
    v.requested_date DESC,
    v.requested_time DESC,
    v.created_at DESC

LIMIT $2
OFFSET $3;


-- ============================================================
-- GET OWNER VISITS
-- ============================================================

SELECT
    v.*,

    p.title AS property_title,
    p.property_type,
    p.listing_type,
    p.price,
    p.city,
    p.locality,
    p.images AS property_images,

    u.first_name,
    u.last_name,
    u.email,
    u.phone

FROM visits v

JOIN properties p
    ON p.id = v.property_id

JOIN users u
    ON u.id = v.user_id

WHERE v.owner_id = $1

ORDER BY
    v.requested_date ASC,
    v.requested_time ASC,
    v.created_at DESC

LIMIT $2
OFFSET $3;


-- ============================================================
-- GET PROPERTY VISITS
-- ============================================================

SELECT
    v.*,

    u.first_name,
    u.last_name,
    u.email,
    u.phone

FROM visits v

JOIN users u
    ON u.id = v.user_id

WHERE v.property_id = $1

ORDER BY
    v.requested_date ASC,
    v.requested_time ASC

LIMIT $2
OFFSET $3;


-- ============================================================
-- CHECK EXISTING VISIT REQUEST
-- ============================================================

SELECT
    v.*

FROM visits v

WHERE
    v.property_id = $1
    AND v.user_id = $2
    AND v.status IN (
        'pending',
        'confirmed',
        'rescheduled'
    )

ORDER BY v.created_at DESC

LIMIT 1;


-- ============================================================
-- CHECK VISIT SLOT AVAILABILITY
-- ============================================================

SELECT
    COUNT(*) AS booked_count

FROM visits

WHERE
    property_id = $1
    AND requested_date = $2
    AND requested_time = $3
    AND status IN (
        'pending',
        'confirmed',
        'rescheduled'
    );


-- ============================================================
-- GET AVAILABLE VISIT DATES
-- ============================================================

SELECT DISTINCT
    requested_date

FROM visits

WHERE
    property_id = $1
    AND requested_date >= $2
    AND requested_date <= $3
    AND status IN (
        'pending',
        'confirmed',
        'rescheduled'
    )

ORDER BY requested_date ASC;


-- ============================================================
-- UPDATE VISIT
-- ============================================================

UPDATE visits
SET
    requested_date = COALESCE(
        $2,
        requested_date
    ),

    requested_time = COALESCE(
        $3,
        requested_time
    ),

    visit_type = COALESCE(
        $4,
        visit_type
    ),

    message = COALESCE(
        $5,
        message
    ),

    contact_phone = COALESCE(
        $6,
        contact_phone
    ),

    metadata = COALESCE(
        $7::jsonb,
        metadata
    ),

    updated_at = NOW()

WHERE
    id = $1
    AND user_id = $8

RETURNING *;


-- ============================================================
-- CONFIRM VISIT
-- ============================================================

UPDATE visits
SET
    status = 'confirmed',
    confirmed_at = NOW(),
    confirmed_by = $2,
    updated_at = NOW()

WHERE
    id = $1
    AND status IN (
        'pending',
        'rescheduled'
    )

RETURNING *;


-- ============================================================
-- REJECT VISIT
-- ============================================================

UPDATE visits
SET
    status = 'rejected',
    rejected_at = NOW(),
    rejected_by = $2,
    rejection_reason = $3,
    updated_at = NOW()

WHERE
    id = $1
    AND status IN (
        'pending',
        'rescheduled'
    )

RETURNING *;


-- ============================================================
-- CANCEL VISIT BY USER
-- ============================================================

UPDATE visits
SET
    status = 'cancelled',
    cancelled_at = NOW(),
    cancelled_by = $2,
    cancellation_reason = $3,
    updated_at = NOW()

WHERE
    id = $1
    AND user_id = $2
    AND status IN (
        'pending',
        'confirmed',
        'rescheduled'
    )

RETURNING *;


-- ============================================================
-- CANCEL VISIT BY OWNER
-- ============================================================

UPDATE visits
SET
    status = 'cancelled',
    cancelled_at = NOW(),
    cancelled_by = $2,
    cancellation_reason = $3,
    updated_at = NOW()

WHERE
    id = $1
    AND owner_id = $2
    AND status IN (
        'pending',
        'confirmed',
        'rescheduled'
    )

RETURNING *;


-- ============================================================
-- RESCHEDULE VISIT
-- ============================================================

UPDATE visits
SET
    requested_date = $2,
    requested_time = $3,
    status = 'rescheduled',
    rescheduled_at = NOW(),
    rescheduled_by = $4,
    reschedule_reason = $5,
    updated_at = NOW()

WHERE
    id = $1
    AND status IN (
        'pending',
        'confirmed',
        'rescheduled'
    )

RETURNING *;


-- ============================================================
-- MARK VISIT COMPLETED
-- ============================================================

UPDATE visits
SET
    status = 'completed',
    completed_at = NOW(),
    updated_at = NOW()

WHERE
    id = $1
    AND status = 'confirmed'

RETURNING *;


-- ============================================================
-- MARK VISIT NO-SHOW
-- ============================================================

UPDATE visits
SET
    status = 'no_show',
    completed_at = NOW(),
    no_show_reason = $2,
    updated_at = NOW()

WHERE
    id = $1
    AND status = 'confirmed'

RETURNING *;


-- ============================================================
-- ADD VISIT FEEDBACK
-- ============================================================

UPDATE visits
SET
    rating = $2,
    feedback = $3,
    feedback_at = NOW(),
    updated_at = NOW()

WHERE
    id = $1
    AND user_id = $4
    AND status = 'completed'

RETURNING *;


-- ============================================================
-- GET VISIT FEEDBACK
-- ============================================================

SELECT
    v.id,
    v.property_id,
    v.user_id,
    v.rating,
    v.feedback,
    v.feedback_at,
    v.completed_at

FROM visits v

WHERE
    v.id = $1
    AND v.rating IS NOT NULL

LIMIT 1;


-- ============================================================
-- UPCOMING USER VISITS
-- ============================================================

SELECT
    v.*,

    p.title AS property_title,
    p.price,
    p.city,
    p.locality,
    p.images AS property_images

FROM visits v

JOIN properties p
    ON p.id = v.property_id

WHERE
    v.user_id = $1
    AND v.status = 'confirmed'
    AND (
        v.requested_date > CURRENT_DATE
        OR (
            v.requested_date = CURRENT_DATE
            AND v.requested_time >= CURRENT_TIME
        )
    )

ORDER BY
    v.requested_date ASC,
    v.requested_time ASC

LIMIT $2
OFFSET $3;


-- ============================================================
-- UPCOMING OWNER VISITS
-- ============================================================

SELECT
    v.*,

    p.title AS property_title,
    p.price,
    p.city,
    p.locality,

    u.first_name,
    u.last_name,
    u.phone,
    u.email

FROM visits v

JOIN properties p
    ON p.id = v.property_id

JOIN users u
    ON u.id = v.user_id

WHERE
    v.owner_id = $1
    AND v.status = 'confirmed'
    AND (
        v.requested_date > CURRENT_DATE
        OR (
            v.requested_date = CURRENT_DATE
            AND v.requested_time >= CURRENT_TIME
        )
    )

ORDER BY
    v.requested_date ASC,
    v.requested_time ASC

LIMIT $2
OFFSET $3;


-- ============================================================
-- TODAY'S VISITS FOR OWNER
-- ============================================================

SELECT
    v.*,

    p.title AS property_title,
    p.locality,
    p.city,

    u.first_name,
    u.last_name,
    u.phone,
    u.email

FROM visits v

JOIN properties p
    ON p.id = v.property_id

JOIN users u
    ON u.id = v.user_id

WHERE
    v.owner_id = $1
    AND v.requested_date = CURRENT_DATE
    AND v.status = 'confirmed'

ORDER BY v.requested_time ASC;


-- ============================================================
-- TODAY'S VISITS - ADMIN
-- ============================================================

SELECT
    v.*,

    p.title AS property_title,
    p.city,
    p.locality,

    requester.first_name AS requester_first_name,
    requester.last_name AS requester_last_name,

    owner.first_name AS owner_first_name,
    owner.last_name AS owner_last_name

FROM visits v

JOIN properties p
    ON p.id = v.property_id

JOIN users requester
    ON requester.id = v.user_id

LEFT JOIN users owner
    ON owner.id = v.owner_id

WHERE
    v.requested_date = CURRENT_DATE
    AND v.status IN (
        'pending',
        'confirmed',
        'rescheduled'
    )

ORDER BY v.requested_time ASC;


-- ============================================================
-- PENDING VISITS
-- ============================================================

SELECT
    v.*,

    p.title AS property_title,
    p.city,
    p.locality,

    u.first_name,
    u.last_name,
    u.email,
    u.phone

FROM visits v

JOIN properties p
    ON p.id = v.property_id

JOIN users u
    ON u.id = v.user_id

WHERE
    v.status = 'pending'

ORDER BY
    v.requested_date ASC,
    v.requested_time ASC

LIMIT $1
OFFSET $2;


-- ============================================================
-- SEARCH VISITS
-- ============================================================

SELECT
    v.*,

    p.title AS property_title,

    requester.first_name AS requester_first_name,
    requester.last_name AS requester_last_name,
    requester.email AS requester_email,

    owner.first_name AS owner_first_name,
    owner.last_name AS owner_last_name,
    owner.email AS owner_email

FROM visits v

JOIN properties p
    ON p.id = v.property_id

JOIN users requester
    ON requester.id = v.user_id

LEFT JOIN users owner
    ON owner.id = v.owner_id

WHERE
       v.id::text ILIKE '%' || $1 || '%'
    OR p.title ILIKE '%' || $1 || '%'
    OR requester.email ILIKE '%' || $1 || '%'
    OR requester.first_name ILIKE '%' || $1 || '%'
    OR requester.last_name ILIKE '%' || $1 || '%'
    OR owner.email ILIKE '%' || $1 || '%'
    OR owner.first_name ILIKE '%' || $1 || '%'
    OR owner.last_name ILIKE '%' || $1 || '%'

ORDER BY v.created_at DESC

LIMIT $2
OFFSET $3;


-- ============================================================
-- VISITS BY STATUS
-- ============================================================

SELECT
    v.*,

    p.title AS property_title,
    p.city,
    p.locality,

    u.first_name,
    u.last_name,
    u.email,
    u.phone

FROM visits v

JOIN properties p
    ON p.id = v.property_id

JOIN users u
    ON u.id = v.user_id

WHERE v.status = $1

ORDER BY
    v.requested_date DESC,
    v.created_at DESC

LIMIT $2
OFFSET $3;


-- ============================================================
-- VISITS BY DATE RANGE
-- ============================================================

SELECT
    v.*,

    p.title AS property_title,
    p.city,
    p.locality,

    requester.first_name AS requester_first_name,
    requester.last_name AS requester_last_name,
    requester.phone AS requester_phone,

    owner.first_name AS owner_first_name,
    owner.last_name AS owner_last_name

FROM visits v

JOIN properties p
    ON p.id = v.property_id

JOIN users requester
    ON requester.id = v.user_id

LEFT JOIN users owner
    ON owner.id = v.owner_id

WHERE
    v.requested_date >= $1
    AND v.requested_date <= $2

ORDER BY
    v.requested_date ASC,
    v.requested_time ASC;


-- ============================================================
-- VISIT STATISTICS FOR USER
-- ============================================================

SELECT
    COUNT(*) AS total_visits,

    COUNT(*) FILTER (
        WHERE status = 'pending'
    ) AS pending_visits,

    COUNT(*) FILTER (
        WHERE status = 'confirmed'
    ) AS confirmed_visits,

    COUNT(*) FILTER (
        WHERE status = 'completed'
    ) AS completed_visits,

    COUNT(*) FILTER (
        WHERE status = 'cancelled'
    ) AS cancelled_visits,

    COUNT(*) FILTER (
        WHERE status = 'rejected'
    ) AS rejected_visits,

    COUNT(*) FILTER (
        WHERE status = 'no_show'
    ) AS no_show_visits

FROM visits

WHERE user_id = $1;


-- ============================================================
-- VISIT STATISTICS FOR OWNER
-- ============================================================

SELECT
    COUNT(*) AS total_visits,

    COUNT(*) FILTER (
        WHERE status = 'pending'
    ) AS pending_visits,

    COUNT(*) FILTER (
        WHERE status = 'confirmed'
    ) AS confirmed_visits,

    COUNT(*) FILTER (
        WHERE status = 'completed'
    ) AS completed_visits,

    COUNT(*) FILTER (
        WHERE status = 'cancelled'
    ) AS cancelled_visits,

    COUNT(*) FILTER (
        WHERE status = 'rejected'
    ) AS rejected_visits,

    COUNT(*) FILTER (
        WHERE status = 'no_show'
    ) AS no_show_visits,

    ROUND(
        AVG(rating)::numeric,
        2
    ) AS average_rating

FROM visits

WHERE owner_id = $1;


-- ============================================================
-- PROPERTY VISIT STATISTICS
-- ============================================================

SELECT
    COUNT(*) AS total_visits,

    COUNT(*) FILTER (
        WHERE status = 'pending'
    ) AS pending_visits,

    COUNT(*) FILTER (
        WHERE status = 'confirmed'
    ) AS confirmed_visits,

    COUNT(*) FILTER (
        WHERE status = 'completed'
    ) AS completed_visits,

    COUNT(*) FILTER (
        WHERE status = 'cancelled'
    ) AS cancelled_visits,

    COUNT(*) FILTER (
        WHERE status = 'no_show'
    ) AS no_show_visits,

    ROUND(
        AVG(rating)::numeric,
        2
    ) AS average_rating

FROM visits

WHERE property_id = $1;


-- ============================================================
-- VISIT ANALYTICS
-- ============================================================

SELECT
    COUNT(*) AS total_visits,

    COUNT(*) FILTER (
        WHERE status = 'pending'
    ) AS pending_visits,

    COUNT(*) FILTER (
        WHERE status = 'confirmed'
    ) AS confirmed_visits,

    COUNT(*) FILTER (
        WHERE status = 'completed'
    ) AS completed_visits,

    COUNT(*) FILTER (
        WHERE status = 'cancelled'
    ) AS cancelled_visits,

    COUNT(*) FILTER (
        WHERE status = 'rejected'
    ) AS rejected_visits,

    COUNT(*) FILTER (
        WHERE status = 'no_show'
    ) AS no_show_visits,

    ROUND(
        (
            COUNT(*) FILTER (
                WHERE status = 'completed'
            )::numeric
            /
            NULLIF(COUNT(*), 0)
        ) * 100,
        2
    ) AS completion_rate

FROM visits

WHERE
    created_at >= $1
    AND created_at < $2;


-- ============================================================
-- DAILY VISIT TREND
-- ============================================================

SELECT
    DATE_TRUNC(
        'day',
        requested_date
    ) AS date,

    COUNT(*) AS total_visits,

    COUNT(*) FILTER (
        WHERE status = 'confirmed'
    ) AS confirmed_visits,

    COUNT(*) FILTER (
        WHERE status = 'completed'
    ) AS completed_visits,

    COUNT(*) FILTER (
        WHERE status = 'cancelled'
    ) AS cancelled_visits

FROM visits

WHERE
    requested_date >= $1
    AND requested_date <= $2

GROUP BY DATE_TRUNC(
    'day',
    requested_date
)

ORDER BY date ASC;


-- ============================================================
-- MOST VISITED PROPERTIES
-- ============================================================

SELECT
    p.id,
    p.title,
    p.city,
    p.locality,
    p.price,

    COUNT(v.id) AS visit_count,

    COUNT(v.id) FILTER (
        WHERE v.status = 'completed'
    ) AS completed_visits

FROM properties p

JOIN visits v
    ON v.property_id = p.id

GROUP BY
    p.id,
    p.title,
    p.city,
    p.locality,
    p.price

ORDER BY
    visit_count DESC

LIMIT $1
OFFSET $2;


-- ============================================================
-- VISIT AUDIT HISTORY
-- ============================================================

SELECT
    al.id,
    al.action,
    al.resource,
    al.resource_id,
    al.metadata,
    al.ip_address,
    al.created_at,

    u.first_name,
    u.last_name,
    u.email

FROM audit_logs al

LEFT JOIN users u
    ON u.id = al.user_id

WHERE
    al.resource = 'visit'
    AND al.resource_id = $1

ORDER BY al.created_at ASC;


-- ============================================================
-- CLEAN OLD PENDING VISITS
-- ============================================================

UPDATE visits
SET
    status = 'expired',
    updated_at = NOW()

WHERE
    status = 'pending'
    AND (
        requested_date < CURRENT_DATE
        OR (
            requested_date = CURRENT_DATE
            AND requested_time < CURRENT_TIME
        )
    )

RETURNING id;


-- ============================================================
-- END OF VISIT QUERIES
-- ============================================================