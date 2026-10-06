-- ============================================================
-- GHAR - PAYMENT SQL QUERIES
-- PostgreSQL
-- ============================================================


-- ============================================================
-- CREATE PAYMENT
-- ============================================================

INSERT INTO payments (
    user_id,
    property_id,
    offer_id,
    loan_id,
    subscription_id,
    payment_type,
    amount,
    currency,
    payment_gateway,
    gateway_order_id,
    status,
    description,
    metadata
)
VALUES (
    $1,
    $2,
    $3,
    $4,
    $5,
    $6,
    $7,
    COALESCE($8, 'INR'),
    $9,
    $10,
    'created',
    $11,
    COALESCE($12::jsonb, '{}'::jsonb)
)
RETURNING *;


-- ============================================================
-- GET PAYMENT BY ID
-- ============================================================

SELECT
    p.*,

    u.first_name,
    u.last_name,
    u.email,
    u.phone,

    pr.title AS property_title

FROM payments p

JOIN users u
    ON u.id = p.user_id

LEFT JOIN properties pr
    ON pr.id = p.property_id

WHERE p.id = $1;


-- ============================================================
-- GET PAYMENT BY GATEWAY ORDER ID
-- ============================================================

SELECT
    p.*

FROM payments p

WHERE p.gateway_order_id = $1

LIMIT 1;


-- ============================================================
-- GET PAYMENT BY GATEWAY PAYMENT ID
-- ============================================================

SELECT
    p.*

FROM payments p

WHERE p.gateway_payment_id = $1

LIMIT 1;


-- ============================================================
-- GET USER PAYMENTS
-- ============================================================

SELECT
    p.*,

    pr.title AS property_title

FROM payments p

LEFT JOIN properties pr
    ON pr.id = p.property_id

WHERE p.user_id = $1

ORDER BY p.created_at DESC

LIMIT $2
OFFSET $3;


-- ============================================================
-- GET PROPERTY PAYMENTS
-- ============================================================

SELECT
    p.*,

    u.first_name,
    u.last_name,
    u.email,
    u.phone

FROM payments p

JOIN users u
    ON u.id = p.user_id

WHERE p.property_id = $1

ORDER BY p.created_at DESC

LIMIT $2
OFFSET $3;


-- ============================================================
-- GET OFFER PAYMENTS
-- ============================================================

SELECT
    p.*,

    u.first_name,
    u.last_name,
    u.email,

    pr.title AS property_title

FROM payments p

JOIN users u
    ON u.id = p.user_id

LEFT JOIN properties pr
    ON pr.id = p.property_id

WHERE p.offer_id = $1

ORDER BY p.created_at DESC;


-- ============================================================
-- GET LOAN PAYMENTS
-- ============================================================

SELECT
    p.*,

    l.loan_type,
    l.requested_amount,
    l.approved_amount

FROM payments p

JOIN loans l
    ON l.id = p.loan_id

WHERE p.loan_id = $1

ORDER BY p.created_at DESC;


-- ============================================================
-- GET SUBSCRIPTION PAYMENTS
-- ============================================================

SELECT
    p.*

FROM payments p

WHERE p.subscription_id = $1

ORDER BY p.created_at DESC;


-- ============================================================
-- UPDATE PAYMENT ORDER
-- ============================================================

UPDATE payments
SET
    gateway_order_id = $2,
    status = 'pending',
    updated_at = NOW()

WHERE
    id = $1
    AND status IN (
        'created',
        'pending'
    )

RETURNING *;


-- ============================================================
-- MARK PAYMENT PROCESSING
-- ============================================================

UPDATE payments
SET
    status = 'processing',
    updated_at = NOW()

WHERE
    id = $1
    AND status IN (
        'created',
        'pending'
    )

RETURNING *;


-- ============================================================
-- MARK PAYMENT SUCCESSFUL
-- ============================================================

UPDATE payments
SET
    status = 'paid',
    gateway_payment_id = $2,
    gateway_signature = $3,
    paid_at = NOW(),
    updated_at = NOW(),
    metadata = COALESCE(
        metadata,
        '{}'::jsonb
    ) || COALESCE(
        $4::jsonb,
        '{}'::jsonb
    )

WHERE id = $1

RETURNING *;


-- ============================================================
-- MARK PAYMENT FAILED
-- ============================================================

UPDATE payments
SET
    status = 'failed',
    failure_code = $2,
    failure_reason = $3,
    updated_at = NOW(),
    metadata = COALESCE(
        metadata,
        '{}'::jsonb
    ) || COALESCE(
        $4::jsonb,
        '{}'::jsonb
    )

WHERE id = $1

RETURNING *;


-- ============================================================
-- MARK PAYMENT CANCELLED
-- ============================================================

UPDATE payments
SET
    status = 'cancelled',
    updated_at = NOW()

WHERE
    id = $1
    AND status NOT IN (
        'paid',
        'refunded',
        'partially_refunded'
    )

RETURNING *;


-- ============================================================
-- CREATE REFUND
-- ============================================================

INSERT INTO refunds (
    payment_id,
    user_id,
    amount,
    currency,
    gateway_refund_id,
    reason,
    status,
    metadata
)
VALUES (
    $1,
    $2,
    $3,
    COALESCE($4, 'INR'),
    $5,
    $6,
    'created',
    COALESCE($7::jsonb, '{}'::jsonb)
)
RETURNING *;


-- ============================================================
-- GET REFUND BY ID
-- ============================================================

SELECT
    r.*,

    p.gateway_payment_id,
    p.amount AS payment_amount,

    u.first_name,
    u.last_name,
    u.email

FROM refunds r

JOIN payments p
    ON p.id = r.payment_id

JOIN users u
    ON u.id = r.user_id

WHERE r.id = $1;


-- ============================================================
-- GET PAYMENT REFUNDS
-- ============================================================

SELECT
    r.*

FROM refunds r

WHERE r.payment_id = $1

ORDER BY r.created_at DESC;


-- ============================================================
-- MARK REFUND PROCESSING
-- ============================================================

UPDATE refunds
SET
    status = 'processing',
    updated_at = NOW()

WHERE
    id = $1
    AND status = 'created'

RETURNING *;


-- ============================================================
-- MARK REFUND SUCCESSFUL
-- ============================================================

UPDATE refunds
SET
    status = 'completed',
    gateway_refund_id = COALESCE($2, gateway_refund_id),
    processed_at = NOW(),
    updated_at = NOW()

WHERE id = $1

RETURNING *;


-- ============================================================
-- MARK REFUND FAILED
-- ============================================================

UPDATE refunds
SET
    status = 'failed',
    failure_reason = $2,
    updated_at = NOW()

WHERE id = $1

RETURNING *;


-- ============================================================
-- UPDATE PAYMENT AFTER REFUND
-- ============================================================

UPDATE payments
SET
    status = CASE
        WHEN COALESCE(refunded_amount, 0) + $2 >= amount
            THEN 'refunded'
        ELSE 'partially_refunded'
    END,

    refunded_amount =
        COALESCE(refunded_amount, 0) + $2,

    refunded_at =
        CASE
            WHEN COALESCE(refunded_amount, 0) + $2 >= amount
                THEN NOW()
            ELSE refunded_at
        END,

    updated_at = NOW()

WHERE id = $1

RETURNING *;


-- ============================================================
-- PAYMENT RECEIPT
-- ============================================================

SELECT
    p.id,
    p.amount,
    p.currency,
    p.payment_type,
    p.status,
    p.gateway_payment_id,
    p.paid_at,
    p.created_at,

    u.first_name,
    u.last_name,
    u.email,
    u.phone,

    pr.title AS property_title,

    o.amount AS offer_amount,

    l.loan_type,
    l.requested_amount,
    l.approved_amount

FROM payments p

JOIN users u
    ON u.id = p.user_id

LEFT JOIN properties pr
    ON pr.id = p.property_id

LEFT JOIN offers o
    ON o.id = p.offer_id

LEFT JOIN loans l
    ON l.id = p.loan_id

WHERE p.id = $1;


-- ============================================================
-- PAYMENT COUNT BY USER
-- ============================================================

SELECT
    COUNT(*) AS total_payments,

    COUNT(*) FILTER (
        WHERE status = 'paid'
    ) AS successful_payments,

    COUNT(*) FILTER (
        WHERE status = 'pending'
    ) AS pending_payments,

    COUNT(*) FILTER (
        WHERE status = 'failed'
    ) AS failed_payments,

    COUNT(*) FILTER (
        WHERE status = 'refunded'
    ) AS refunded_payments

FROM payments

WHERE user_id = $1;


-- ============================================================
-- USER PAYMENT TOTAL
-- ============================================================

SELECT
    COALESCE(
        SUM(amount) FILTER (
            WHERE status = 'paid'
        ),
        0
    ) AS total_paid,

    COALESCE(
        SUM(refunded_amount),
        0
    ) AS total_refunded,

    COALESCE(
        SUM(amount)
        FILTER (
            WHERE status = 'paid'
        ),
        0
    )
    -
    COALESCE(
        SUM(refunded_amount),
        0
    ) AS net_paid

FROM payments

WHERE user_id = $1;


-- ============================================================
-- PAYMENT STATISTICS
-- ============================================================

SELECT
    COUNT(*) AS total_payments,

    COUNT(*) FILTER (
        WHERE status = 'paid'
    ) AS successful_payments,

    COUNT(*) FILTER (
        WHERE status = 'pending'
    ) AS pending_payments,

    COUNT(*) FILTER (
        WHERE status = 'processing'
    ) AS processing_payments,

    COUNT(*) FILTER (
        WHERE status = 'failed'
    ) AS failed_payments,

    COUNT(*) FILTER (
        WHERE status = 'cancelled'
    ) AS cancelled_payments,

    COUNT(*) FILTER (
        WHERE status = 'refunded'
    ) AS refunded_payments,

    COALESCE(
        SUM(amount)
        FILTER (
            WHERE status = 'paid'
        ),
        0
    ) AS total_revenue,

    COALESCE(
        SUM(refunded_amount),
        0
    ) AS total_refunds

FROM payments;


-- ============================================================
-- PAYMENT STATISTICS BY TYPE
-- ============================================================

SELECT
    payment_type,

    COUNT(*) AS total_payments,

    COUNT(*) FILTER (
        WHERE status = 'paid'
    ) AS successful_payments,

    COALESCE(
        SUM(amount)
        FILTER (
            WHERE status = 'paid'
        ),
        0
    ) AS total_revenue,

    COALESCE(
        AVG(amount)
        FILTER (
            WHERE status = 'paid'
        ),
        0
    ) AS average_payment

FROM payments

GROUP BY payment_type

ORDER BY total_revenue DESC;


-- ============================================================
-- PAYMENT STATISTICS BY GATEWAY
-- ============================================================

SELECT
    payment_gateway,

    COUNT(*) AS total_payments,

    COUNT(*) FILTER (
        WHERE status = 'paid'
    ) AS successful_payments,

    COUNT(*) FILTER (
        WHERE status = 'failed'
    ) AS failed_payments,

    COALESCE(
        SUM(amount)
        FILTER (
            WHERE status = 'paid'
        ),
        0
    ) AS total_revenue

FROM payments

GROUP BY payment_gateway

ORDER BY total_revenue DESC;


-- ============================================================
-- DAILY PAYMENT REVENUE
-- ============================================================

SELECT
    DATE_TRUNC(
        'day',
        paid_at
    ) AS date,

    COUNT(*) AS successful_payments,

    COALESCE(
        SUM(amount),
        0
    ) AS revenue,

    COALESCE(
        SUM(refunded_amount),
        0
    ) AS refunds

FROM payments

WHERE
    status = 'paid'
    AND paid_at >= $1
    AND paid_at < $2

GROUP BY DATE_TRUNC(
    'day',
    paid_at
)

ORDER BY date ASC;


-- ============================================================
-- MONTHLY PAYMENT REVENUE
-- ============================================================

SELECT
    DATE_TRUNC(
        'month',
        paid_at
    ) AS month,

    COUNT(*) AS successful_payments,

    COALESCE(
        SUM(amount),
        0
    ) AS revenue,

    COALESCE(
        SUM(refunded_amount),
        0
    ) AS refunds

FROM payments

WHERE
    status = 'paid'
    AND paid_at >= $1
    AND paid_at < $2

GROUP BY DATE_TRUNC(
    'month',
    paid_at
)

ORDER BY month ASC;


-- ============================================================
-- FAILED PAYMENT REPORT
-- ============================================================

SELECT
    p.id,
    p.amount,
    p.currency,
    p.payment_type,
    p.payment_gateway,
    p.failure_code,
    p.failure_reason,
    p.created_at,

    u.first_name,
    u.last_name,
    u.email,
    u.phone

FROM payments p

JOIN users u
    ON u.id = p.user_id

WHERE p.status = 'failed'

ORDER BY p.created_at DESC

LIMIT $1
OFFSET $2;


-- ============================================================
-- PENDING PAYMENTS
-- ============================================================

SELECT
    p.*,

    u.first_name,
    u.last_name,
    u.email,
    u.phone

FROM payments p

JOIN users u
    ON u.id = p.user_id

WHERE p.status IN (
    'created',
    'pending',
    'processing'
)

ORDER BY p.created_at ASC;


-- ============================================================
-- EXPIRE OLD PENDING PAYMENTS
-- ============================================================

UPDATE payments
SET
    status = 'expired',
    updated_at = NOW()

WHERE
    status IN (
        'created',
        'pending'
    )
    AND created_at < NOW() - INTERVAL '30 minutes'

RETURNING id;


-- ============================================================
-- SEARCH PAYMENTS
-- ============================================================

SELECT
    p.*,

    u.first_name,
    u.last_name,
    u.email,
    u.phone,

    pr.title AS property_title

FROM payments p

JOIN users u
    ON u.id = p.user_id

LEFT JOIN properties pr
    ON pr.id = p.property_id

WHERE
       p.id::text ILIKE '%' || $1 || '%'
    OR p.gateway_order_id ILIKE '%' || $1 || '%'
    OR p.gateway_payment_id ILIKE '%' || $1 || '%'
    OR u.email ILIKE '%' || $1 || '%'
    OR u.phone ILIKE '%' || $1 || '%'
    OR u.first_name ILIKE '%' || $1 || '%'
    OR u.last_name ILIKE '%' || $1 || '%'
    OR pr.title ILIKE '%' || $1 || '%'

ORDER BY p.created_at DESC

LIMIT $2
OFFSET $3;


-- ============================================================
-- PAYMENTS CREATED IN DATE RANGE
-- ============================================================

SELECT
    p.*,

    u.first_name,
    u.last_name,
    u.email,

    pr.title AS property_title

FROM payments p

JOIN users u
    ON u.id = p.user_id

LEFT JOIN properties pr
    ON pr.id = p.property_id

WHERE
    p.created_at >= $1
    AND p.created_at < $2

ORDER BY p.created_at DESC;


-- ============================================================
-- PAYMENT WEBHOOK EVENT
-- ============================================================

INSERT INTO payment_webhooks (
    payment_gateway,
    event_id,
    event_type,
    payload,
    processed,
    received_at
)
VALUES (
    $1,
    $2,
    $3,
    $4::jsonb,
    FALSE,
    NOW()
)
ON CONFLICT (
    payment_gateway,
    event_id
)
DO NOTHING

RETURNING *;


-- ============================================================
-- GET PAYMENT WEBHOOK
-- ============================================================

SELECT
    *
FROM payment_webhooks

WHERE
    payment_gateway = $1
    AND event_id = $2

LIMIT 1;


-- ============================================================
-- MARK WEBHOOK PROCESSED
-- ============================================================

UPDATE payment_webhooks
SET
    processed = TRUE,
    processed_at = NOW(),
    processing_error = NULL

WHERE id = $1

RETURNING *;


-- ============================================================
-- MARK WEBHOOK FAILED
-- ============================================================

UPDATE payment_webhooks
SET
    processed = FALSE,
    processing_error = $2,
    updated_at = NOW()

WHERE id = $1

RETURNING *;


-- ============================================================
-- PAYMENT AUDIT HISTORY
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
    al.resource = 'payment'
    AND al.resource_id = $1

ORDER BY al.created_at ASC;


-- ============================================================
-- END OF PAYMENT QUERIES
-- ============================================================