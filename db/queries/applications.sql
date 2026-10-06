-- ============================================================
-- GHAR - APPLICATION SQL QUERIES
-- PostgreSQL
-- ============================================================


-- ============================================================
-- CREATE APPLICATION
-- ============================================================

INSERT INTO applications (
    applicant_id,
    property_id,
    application_type,
    status,
    application_data
)
VALUES (
    $1,
    $2,
    $3,
    'draft',
    COALESCE($4::jsonb, '{}'::jsonb)
)
RETURNING *;


-- ============================================================
-- GET APPLICATION BY ID
-- ============================================================

SELECT
    a.*,

    u.first_name AS applicant_first_name,
    u.last_name AS applicant_last_name,
    u.email AS applicant_email,
    u.phone AS applicant_phone,

    p.title AS property_title,
    p.property_type,
    p.listing_type,
    p.price,
    p.city,
    p.state

FROM applications a

JOIN users u
    ON u.id = a.applicant_id

LEFT JOIN properties p
    ON p.id = a.property_id

WHERE a.id = $1;


-- ============================================================
-- GET APPLICATION WITH FULL DETAILS
-- ============================================================

SELECT
    a.*,

    jsonb_build_object(
        'id', u.id,
        'firstName', u.first_name,
        'lastName', u.last_name,
        'email', u.email,
        'phone', u.phone,
        'role', u.role
    ) AS applicant,

    CASE
        WHEN p.id IS NOT NULL THEN
            jsonb_build_object(
                'id', p.id,
                'title', p.title,
                'propertyType', p.property_type,
                'listingType', p.listing_type,
                'price', p.price,
                'city', p.city,
                'state', p.state,
                'postalCode', p.postal_code
            )
        ELSE NULL
    END AS property

FROM applications a

JOIN users u
    ON u.id = a.applicant_id

LEFT JOIN properties p
    ON p.id = a.property_id

WHERE a.id = $1;


-- ============================================================
-- GET USER APPLICATIONS
-- ============================================================

SELECT
    a.*,

    p.title AS property_title,
    p.property_type,
    p.listing_type,
    p.price,
    p.city,
    p.state

FROM applications a

LEFT JOIN properties p
    ON p.id = a.property_id

WHERE a.applicant_id = $1

ORDER BY a.created_at DESC

LIMIT $2
OFFSET $3;


-- ============================================================
-- GET APPLICATIONS BY PROPERTY
-- ============================================================

SELECT
    a.*,

    u.first_name,
    u.last_name,
    u.email,
    u.phone

FROM applications a

JOIN users u
    ON u.id = a.applicant_id

WHERE a.property_id = $1

ORDER BY a.created_at DESC

LIMIT $2
OFFSET $3;


-- ============================================================
-- GET APPLICATIONS BY STATUS
-- ============================================================

SELECT
    a.*,

    u.first_name,
    u.last_name,
    u.email,
    u.phone,

    p.title AS property_title,
    p.price AS property_price

FROM applications a

JOIN users u
    ON u.id = a.applicant_id

LEFT JOIN properties p
    ON p.id = a.property_id

WHERE a.status = $1

ORDER BY a.created_at ASC

LIMIT $2
OFFSET $3;


-- ============================================================
-- GET APPLICATIONS BY TYPE
-- ============================================================

SELECT
    a.*,

    u.first_name,
    u.last_name,
    u.email,

    p.title AS property_title

FROM applications a

JOIN users u
    ON u.id = a.applicant_id

LEFT JOIN properties p
    ON p.id = a.property_id

WHERE a.application_type = $1

ORDER BY a.created_at DESC

LIMIT $2
OFFSET $3;


-- ============================================================
-- SEARCH APPLICATIONS
-- ============================================================

SELECT
    a.*,

    u.first_name,
    u.last_name,
    u.email,
    u.phone,

    p.title AS property_title,
    p.city,
    p.state

FROM applications a

JOIN users u
    ON u.id = a.applicant_id

LEFT JOIN properties p
    ON p.id = a.property_id

WHERE
       a.id::text ILIKE '%' || $1 || '%'
    OR u.email ILIKE '%' || $1 || '%'
    OR u.phone ILIKE '%' || $1 || '%'
    OR u.first_name ILIKE '%' || $1 || '%'
    OR u.last_name ILIKE '%' || $1 || '%'
    OR p.title ILIKE '%' || $1 || '%'

ORDER BY a.created_at DESC

LIMIT $2
OFFSET $3;


-- ============================================================
-- UPDATE APPLICATION DATA
-- ============================================================

UPDATE applications
SET
    application_data = COALESCE($2::jsonb, application_data),
    updated_at = NOW()
WHERE id = $1

RETURNING *;


-- ============================================================
-- UPDATE APPLICATION
-- ============================================================

UPDATE applications
SET
    application_data = COALESCE($2::jsonb, application_data),
    updated_at = NOW()
WHERE
    id = $1
    AND applicant_id = $3

RETURNING *;


-- ============================================================
-- SUBMIT APPLICATION
-- ============================================================

UPDATE applications
SET
    status = 'submitted',
    submitted_at = NOW(),
    updated_at = NOW()
WHERE
    id = $1
    AND applicant_id = $2
    AND status = 'draft'

RETURNING *;


-- ============================================================
-- ADMIN - START APPLICATION REVIEW
-- ============================================================

UPDATE applications
SET
    status = 'under_review',
    reviewed_by = $1,
    updated_at = NOW()
WHERE
    id = $2
    AND status IN (
        'submitted',
        'pending'
    )

RETURNING *;


-- ============================================================
-- ADMIN - APPROVE APPLICATION
-- ============================================================

UPDATE applications
SET
    status = 'approved',
    reviewed_by = $1,
    approved_at = NOW(),
    review_notes = $3,
    updated_at = NOW()
WHERE id = $2

RETURNING *;


-- ============================================================
-- ADMIN - REJECT APPLICATION
-- ============================================================

UPDATE applications
SET
    status = 'rejected',
    reviewed_by = $1,
    rejected_at = NOW(),
    review_notes = $3,
    updated_at = NOW()
WHERE id = $2

RETURNING *;


-- ============================================================
-- ADMIN - REQUEST MORE INFORMATION
-- ============================================================

UPDATE applications
SET
    status = 'additional_information_required',
    reviewed_by = $1,
    review_notes = $3,
    updated_at = NOW()
WHERE id = $2

RETURNING *;


-- ============================================================
-- CANCEL APPLICATION
-- ============================================================

UPDATE applications
SET
    status = 'cancelled',
    updated_at = NOW()
WHERE
    id = $1
    AND applicant_id = $2
    AND status NOT IN (
        'approved',
        'rejected',
        'cancelled'
    )

RETURNING *;


-- ============================================================
-- DELETE DRAFT APPLICATION
-- ============================================================

DELETE FROM applications
WHERE
    id = $1
    AND applicant_id = $2
    AND status = 'draft'

RETURNING *;


-- ============================================================
-- APPLICATION COUNT
-- ============================================================

SELECT COUNT(*) AS total
FROM applications
WHERE applicant_id = $1;


-- ============================================================
-- APPLICATION COUNT BY STATUS
-- ============================================================

SELECT
    status,
    COUNT(*) AS total
FROM applications
GROUP BY status
ORDER BY total DESC;


-- ============================================================
-- USER APPLICATION SUMMARY
-- ============================================================

SELECT
    COUNT(*) AS total_applications,

    COUNT(*) FILTER (
        WHERE status = 'draft'
    ) AS draft_applications,

    COUNT(*) FILTER (
        WHERE status = 'submitted'
    ) AS submitted_applications,

    COUNT(*) FILTER (
        WHERE status = 'under_review'
    ) AS under_review_applications,

    COUNT(*) FILTER (
        WHERE status = 'approved'
    ) AS approved_applications,

    COUNT(*) FILTER (
        WHERE status = 'rejected'
    ) AS rejected_applications,

    COUNT(*) FILTER (
        WHERE status = 'cancelled'
    ) AS cancelled_applications

FROM applications

WHERE applicant_id = $1;


-- ============================================================
-- ADMIN APPLICATION DASHBOARD
-- ============================================================

SELECT
    COUNT(*) AS total_applications,

    COUNT(*) FILTER (
        WHERE status = 'draft'
    ) AS drafts,

    COUNT(*) FILTER (
        WHERE status = 'submitted'
    ) AS submitted,

    COUNT(*) FILTER (
        WHERE status = 'under_review'
    ) AS under_review,

    COUNT(*) FILTER (
        WHERE status = 'additional_information_required'
    ) AS information_required,

    COUNT(*) FILTER (
        WHERE status = 'approved'
    ) AS approved,

    COUNT(*) FILTER (
        WHERE status = 'rejected'
    ) AS rejected,

    COUNT(*) FILTER (
        WHERE status = 'cancelled'
    ) AS cancelled

FROM applications;


-- ============================================================
-- RECENT APPLICATIONS
-- ============================================================

SELECT
    a.id,
    a.application_type,
    a.status,
    a.submitted_at,
    a.created_at,

    u.first_name,
    u.last_name,
    u.email,

    p.title AS property_title,
    p.price AS property_price

FROM applications a

JOIN users u
    ON u.id = a.applicant_id

LEFT JOIN properties p
    ON p.id = a.property_id

ORDER BY a.created_at DESC

LIMIT $1;


-- ============================================================
-- APPLICATIONS REQUIRING ACTION
-- ============================================================

SELECT
    a.id,
    a.application_type,
    a.status,
    a.created_at,
    a.submitted_at,

    u.first_name,
    u.last_name,
    u.email,

    p.title AS property_title

FROM applications a

JOIN users u
    ON u.id = a.applicant_id

LEFT JOIN properties p
    ON p.id = a.property_id

WHERE a.status IN (
    'submitted',
    'under_review',
    'additional_information_required'
)

ORDER BY
    CASE a.status
        WHEN 'submitted' THEN 1
        WHEN 'additional_information_required' THEN 2
        WHEN 'under_review' THEN 3
        ELSE 4
    END,
    a.created_at ASC;


-- ============================================================
-- APPLICATION DOCUMENTS
-- ============================================================

SELECT
    d.*,

    a.application_type,
    a.status AS application_status,

    u.first_name,
    u.last_name,
    u.email

FROM documents d

JOIN applications a
    ON a.id = d.application_id

JOIN users u
    ON u.id = a.applicant_id

WHERE a.id = $1

ORDER BY d.created_at ASC;


-- ============================================================
-- PENDING APPLICATION DOCUMENTS
-- ============================================================

SELECT
    d.*,

    a.id AS application_id,
    a.application_type,

    u.first_name,
    u.last_name,
    u.email

FROM documents d

JOIN applications a
    ON a.id = d.application_id

JOIN users u
    ON u.id = a.applicant_id

WHERE d.status = 'pending'

ORDER BY d.created_at ASC;


-- ============================================================
-- APPLICATION TIMELINE
-- ============================================================

SELECT
    al.id,
    al.action,
    al.resource,
    al.resource_id,
    al.metadata,
    al.created_at,

    u.first_name,
    u.last_name,
    u.email

FROM audit_logs al

LEFT JOIN users u
    ON u.id = al.user_id

WHERE
    al.resource = 'application'
    AND al.resource_id = $1

ORDER BY al.created_at ASC;


-- ============================================================
-- APPLICATIONS CREATED IN DATE RANGE
-- ============================================================

SELECT
    a.*,

    u.first_name,
    u.last_name,
    u.email,

    p.title AS property_title

FROM applications a

JOIN users u
    ON u.id = a.applicant_id

LEFT JOIN properties p
    ON p.id = a.property_id

WHERE
    a.created_at >= $1
    AND a.created_at < $2

ORDER BY a.created_at DESC;


-- ============================================================
-- APPLICATION ANALYTICS
-- ============================================================

SELECT
    DATE_TRUNC('day', created_at) AS date,
    COUNT(*) AS applications
FROM applications
WHERE created_at >= $1
GROUP BY DATE_TRUNC('day', created_at)
ORDER BY date ASC;


-- ============================================================
-- APPLICATION TYPE ANALYTICS
-- ============================================================

SELECT
    application_type,
    COUNT(*) AS total,

    COUNT(*) FILTER (
        WHERE status = 'approved'
    ) AS approved,

    COUNT(*) FILTER (
        WHERE status = 'rejected'
    ) AS rejected,

    COUNT(*) FILTER (
        WHERE status = 'under_review'
    ) AS under_review

FROM applications

GROUP BY application_type

ORDER BY total DESC;


-- ============================================================
-- APPLICATION CONVERSION RATE
-- ============================================================

SELECT
    COUNT(*) AS total_applications,

    COUNT(*) FILTER (
        WHERE status = 'approved'
    ) AS approved_applications,

    ROUND(
        (
            COUNT(*) FILTER (
                WHERE status = 'approved'
            )::numeric
            /
            NULLIF(COUNT(*), 0)
        ) * 100,
        2
    ) AS approval_rate

FROM applications;


-- ============================================================
-- END OF APPLICATION QUERIES
-- ============================================================