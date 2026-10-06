-- ============================================================
-- GHAR - LOAN SQL QUERIES
-- PostgreSQL
-- ============================================================


-- ============================================================
-- CREATE LOAN APPLICATION
-- ============================================================

INSERT INTO loans (
    user_id,
    property_id,
    loan_type,
    requested_amount,
    status,
    application_data
)
VALUES (
    $1,
    $2,
    $3,
    $4,
    'submitted',
    COALESCE($5::jsonb, '{}'::jsonb)
)
RETURNING *;


-- ============================================================
-- GET LOAN BY ID
-- ============================================================

SELECT
    l.*,

    u.first_name,
    u.last_name,
    u.email,
    u.phone,

    p.title AS property_title,
    p.property_type,
    p.listing_type,
    p.price AS property_price,
    p.city,
    p.state

FROM loans l

JOIN users u
    ON u.id = l.user_id

LEFT JOIN properties p
    ON p.id = l.property_id

WHERE l.id = $1;


-- ============================================================
-- GET USER LOANS
-- ============================================================

SELECT
    l.*,

    p.title AS property_title,
    p.property_type,
    p.price AS property_price,
    p.city,
    p.state

FROM loans l

LEFT JOIN properties p
    ON p.id = l.property_id

WHERE l.user_id = $1

ORDER BY l.created_at DESC

LIMIT $2
OFFSET $3;


-- ============================================================
-- GET USER LOAN BY ID
-- ============================================================

SELECT
    l.*,

    p.title AS property_title,
    p.price AS property_price,
    p.city,
    p.state

FROM loans l

LEFT JOIN properties p
    ON p.id = l.property_id

WHERE
    l.id = $1
    AND l.user_id = $2;


-- ============================================================
-- GET LOANS BY STATUS
-- ============================================================

SELECT
    l.*,

    u.first_name,
    u.last_name,
    u.email,
    u.phone,

    p.title AS property_title,
    p.price AS property_price

FROM loans l

JOIN users u
    ON u.id = l.user_id

LEFT JOIN properties p
    ON p.id = l.property_id

WHERE l.status = $1

ORDER BY l.created_at ASC

LIMIT $2
OFFSET $3;


-- ============================================================
-- GET LOANS BY TYPE
-- ============================================================

SELECT
    l.*,

    u.first_name,
    u.last_name,
    u.email,

    p.title AS property_title

FROM loans l

JOIN users u
    ON u.id = l.user_id

LEFT JOIN properties p
    ON p.id = l.property_id

WHERE l.loan_type = $1

ORDER BY l.created_at DESC

LIMIT $2
OFFSET $3;


-- ============================================================
-- UPDATE LOAN APPLICATION
-- ============================================================

UPDATE loans
SET
    application_data = COALESCE(
        $2::jsonb,
        application_data
    ),
    requested_amount = COALESCE(
        $3,
        requested_amount
    ),
    updated_at = NOW()

WHERE
    id = $1
    AND user_id = $4
    AND status IN (
        'draft',
        'submitted'
    )

RETURNING *;


-- ============================================================
-- SAVE LOAN AS DRAFT
-- ============================================================

INSERT INTO loans (
    user_id,
    property_id,
    loan_type,
    requested_amount,
    status,
    application_data
)
VALUES (
    $1,
    $2,
    $3,
    $4,
    'draft',
    COALESCE($5::jsonb, '{}'::jsonb)
)
RETURNING *;


-- ============================================================
-- SUBMIT DRAFT LOAN
-- ============================================================

UPDATE loans
SET
    status = 'submitted',
    submitted_at = NOW(),
    updated_at = NOW()

WHERE
    id = $1
    AND user_id = $2
    AND status = 'draft'

RETURNING *;


-- ============================================================
-- ADMIN - START LOAN REVIEW
-- ============================================================

UPDATE loans
SET
    status = 'under_review',
    reviewed_by = $1,
    reviewed_at = NOW(),
    updated_at = NOW()

WHERE
    id = $2
    AND status IN (
        'submitted',
        'pending'
    )

RETURNING *;


-- ============================================================
-- ADMIN - APPROVE LOAN
-- ============================================================

UPDATE loans
SET
    status = 'approved',
    approved_amount = $2,
    interest_rate = $3,
    tenure_months = $4,
    approved_at = NOW(),
    reviewed_by = $1,
    review_notes = $5,
    updated_at = NOW()

WHERE id = $6

RETURNING *;


-- ============================================================
-- ADMIN - REJECT LOAN
-- ============================================================

UPDATE loans
SET
    status = 'rejected',
    reviewed_by = $1,
    reviewed_at = NOW(),
    review_notes = $3,
    updated_at = NOW()

WHERE id = $2

RETURNING *;


-- ============================================================
-- ADMIN - REQUEST MORE INFORMATION
-- ============================================================

UPDATE loans
SET
    status = 'additional_information_required',
    reviewed_by = $1,
    reviewed_at = NOW(),
    review_notes = $3,
    updated_at = NOW()

WHERE id = $2

RETURNING *;


-- ============================================================
-- CANCEL LOAN APPLICATION
-- ============================================================

UPDATE loans
SET
    status = 'cancelled',
    updated_at = NOW()

WHERE
    id = $1
    AND user_id = $2
    AND status NOT IN (
        'approved',
        'rejected',
        'disbursed',
        'cancelled'
    )

RETURNING *;


-- ============================================================
-- DELETE DRAFT LOAN
-- ============================================================

DELETE FROM loans

WHERE
    id = $1
    AND user_id = $2
    AND status = 'draft'

RETURNING *;


-- ============================================================
-- LOAN DOCUMENTS
-- ============================================================

SELECT
    d.*,

    l.loan_type,
    l.status AS loan_status,
    l.requested_amount

FROM documents d

JOIN loans l
    ON l.id = d.loan_id

WHERE
    l.id = $1

ORDER BY d.created_at ASC;


-- ============================================================
-- LOAN PAYMENT SCHEDULE
-- ============================================================

SELECT
    lp.*
FROM loan_payments lp
WHERE lp.loan_id = $1
ORDER BY lp.due_date ASC;


-- ============================================================
-- CREATE LOAN PAYMENT
-- ============================================================

INSERT INTO loan_payments (
    loan_id,
    installment_number,
    due_date,
    principal_amount,
    interest_amount,
    total_amount,
    status
)
VALUES (
    $1,
    $2,
    $3,
    $4,
    $5,
    $6,
    'pending'
)
RETURNING *;


-- ============================================================
-- MARK LOAN PAYMENT PAID
-- ============================================================

UPDATE loan_payments
SET
    status = 'paid',
    paid_at = NOW(),
    payment_reference = $2,
    updated_at = NOW()

WHERE
    id = $1
    AND status = 'pending'

RETURNING *;


-- ============================================================
-- LOAN PAYMENT HISTORY
-- ============================================================

SELECT
    lp.*
FROM loan_payments lp
WHERE
    lp.loan_id = $1
    AND lp.status = 'paid'
ORDER BY lp.paid_at DESC;


-- ============================================================
-- NEXT LOAN PAYMENT
-- ============================================================

SELECT
    lp.*
FROM loan_payments lp
WHERE
    lp.loan_id = $1
    AND lp.status = 'pending'
    AND lp.due_date >= CURRENT_DATE
ORDER BY lp.due_date ASC
LIMIT 1;


-- ============================================================
-- OVERDUE LOAN PAYMENTS
-- ============================================================

SELECT
    lp.*,

    l.user_id,
    l.loan_type,
    l.requested_amount,

    u.first_name,
    u.last_name,
    u.email,
    u.phone

FROM loan_payments lp

JOIN loans l
    ON l.id = lp.loan_id

JOIN users u
    ON u.id = l.user_id

WHERE
    lp.status = 'pending'
    AND lp.due_date < CURRENT_DATE

ORDER BY lp.due_date ASC;


-- ============================================================
-- LOAN COUNT
-- ============================================================

SELECT COUNT(*) AS total
FROM loans
WHERE user_id = $1;


-- ============================================================
-- LOAN COUNT BY STATUS
-- ============================================================

SELECT
    status,
    COUNT(*) AS total
FROM loans
WHERE user_id = $1
GROUP BY status
ORDER BY total DESC;


-- ============================================================
-- USER LOAN SUMMARY
-- ============================================================

SELECT
    COUNT(*) AS total_loans,

    COUNT(*) FILTER (
        WHERE status = 'draft'
    ) AS draft_loans,

    COUNT(*) FILTER (
        WHERE status = 'submitted'
    ) AS submitted_loans,

    COUNT(*) FILTER (
        WHERE status = 'under_review'
    ) AS under_review_loans,

    COUNT(*) FILTER (
        WHERE status = 'approved'
    ) AS approved_loans,

    COUNT(*) FILTER (
        WHERE status = 'rejected'
    ) AS rejected_loans,

    COUNT(*) FILTER (
        WHERE status = 'disbursed'
    ) AS disbursed_loans,

    COUNT(*) FILTER (
        WHERE status = 'cancelled'
    ) AS cancelled_loans,

    COALESCE(
        SUM(approved_amount)
        FILTER (
            WHERE status IN (
                'approved',
                'disbursed'
            )
        ),
        0
    ) AS total_approved_amount

FROM loans
WHERE user_id = $1;


-- ============================================================
-- ADMIN LOAN DASHBOARD
-- ============================================================

SELECT
    COUNT(*) AS total_loans,

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
        WHERE status = 'disbursed'
    ) AS disbursed,

    COALESCE(
        SUM(requested_amount),
        0
    ) AS total_requested,

    COALESCE(
        SUM(approved_amount)
        FILTER (
            WHERE status IN (
                'approved',
                'disbursed'
            )
        ),
        0
    ) AS total_approved

FROM loans;


-- ============================================================
-- LOANS REQUIRING ACTION
-- ============================================================

SELECT
    l.id,
    l.loan_type,
    l.requested_amount,
    l.status,
    l.submitted_at,
    l.created_at,

    u.first_name,
    u.last_name,
    u.email,
    u.phone,

    p.title AS property_title

FROM loans l

JOIN users u
    ON u.id = l.user_id

LEFT JOIN properties p
    ON p.id = l.property_id

WHERE l.status IN (
    'submitted',
    'under_review',
    'additional_information_required'
)

ORDER BY
    CASE l.status
        WHEN 'submitted' THEN 1
        WHEN 'additional_information_required' THEN 2
        WHEN 'under_review' THEN 3
        ELSE 4
    END,
    l.created_at ASC;


-- ============================================================
-- RECENT LOAN APPLICATIONS
-- ============================================================

SELECT
    l.id,
    l.loan_type,
    l.requested_amount,
    l.approved_amount,
    l.interest_rate,
    l.tenure_months,
    l.status,
    l.created_at,

    u.first_name,
    u.last_name,
    u.email,

    p.title AS property_title

FROM loans l

JOIN users u
    ON u.id = l.user_id

LEFT JOIN properties p
    ON p.id = l.property_id

ORDER BY l.created_at DESC

LIMIT $1;


-- ============================================================
-- SEARCH LOANS
-- ============================================================

SELECT
    l.*,

    u.first_name,
    u.last_name,
    u.email,
    u.phone,

    p.title AS property_title

FROM loans l

JOIN users u
    ON u.id = l.user_id

LEFT JOIN properties p
    ON p.id = l.property_id

WHERE
       l.id::text ILIKE '%' || $1 || '%'
    OR u.email ILIKE '%' || $1 || '%'
    OR u.phone ILIKE '%' || $1 || '%'
    OR u.first_name ILIKE '%' || $1 || '%'
    OR u.last_name ILIKE '%' || $1 || '%'
    OR p.title ILIKE '%' || $1 || '%'

ORDER BY l.created_at DESC

LIMIT $2
OFFSET $3;


-- ============================================================
-- LOANS BY PROPERTY
-- ============================================================

SELECT
    l.*,

    u.first_name,
    u.last_name,
    u.email,
    u.phone

FROM loans l

JOIN users u
    ON u.id = l.user_id

WHERE l.property_id = $1

ORDER BY l.created_at DESC

LIMIT $2
OFFSET $3;


-- ============================================================
-- LOANS CREATED IN DATE RANGE
-- ============================================================

SELECT
    l.*,

    u.first_name,
    u.last_name,
    u.email,

    p.title AS property_title

FROM loans l

JOIN users u
    ON u.id = l.user_id

LEFT JOIN properties p
    ON p.id = l.property_id

WHERE
    l.created_at >= $1
    AND l.created_at < $2

ORDER BY l.created_at DESC;


-- ============================================================
-- LOAN TYPE ANALYTICS
-- ============================================================

SELECT
    loan_type,
    COUNT(*) AS total,

    COUNT(*) FILTER (
        WHERE status = 'approved'
    ) AS approved,

    COUNT(*) FILTER (
        WHERE status = 'rejected'
    ) AS rejected,

    COUNT(*) FILTER (
        WHERE status = 'under_review'
    ) AS under_review,

    COALESCE(
        SUM(requested_amount),
        0
    ) AS requested_amount,

    COALESCE(
        SUM(approved_amount),
        0
    ) AS approved_amount

FROM loans

GROUP BY loan_type

ORDER BY total DESC;


-- ============================================================
-- LOAN APPROVAL RATE
-- ============================================================

SELECT
    COUNT(*) AS total_loans,

    COUNT(*) FILTER (
        WHERE status = 'approved'
    ) AS approved_loans,

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

FROM loans;


-- ============================================================
-- LOAN APPLICATION TREND
-- ============================================================

SELECT
    DATE_TRUNC(
        'day',
        created_at
    ) AS date,

    COUNT(*) AS applications,

    COALESCE(
        SUM(requested_amount),
        0
    ) AS requested_amount,

    COALESCE(
        SUM(approved_amount)
        FILTER (
            WHERE status IN (
                'approved',
                'disbursed'
            )
        ),
        0
    ) AS approved_amount

FROM loans

WHERE created_at >= $1

GROUP BY DATE_TRUNC(
    'day',
    created_at
)

ORDER BY date ASC;


-- ============================================================
-- LOAN AUDIT HISTORY
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
    al.resource = 'loan'
    AND al.resource_id = $1

ORDER BY al.created_at ASC;


-- ============================================================
-- END OF LOAN QUERIES
-- ============================================================