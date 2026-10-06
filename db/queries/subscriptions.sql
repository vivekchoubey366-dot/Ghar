-- ============================================================
-- GHAR - SUBSCRIPTION SQL QUERIES
-- PostgreSQL
-- ============================================================


-- ============================================================
-- CREATE SUBSCRIPTION
-- ============================================================

INSERT INTO subscriptions (
    user_id,
    plan_id,
    status,
    billing_cycle,
    amount,
    currency,
    gateway,
    gateway_subscription_id,
    gateway_customer_id,
    start_date,
    end_date,
    next_billing_date,
    auto_renew,
    metadata
)
VALUES (
    $1,
    $2,
    COALESCE($3, 'pending'),
    $4,
    $5,
    COALESCE($6, 'INR'),
    $7,
    $8,
    $9,
    $10,
    $11,
    $12,
    COALESCE($13, TRUE),
    COALESCE($14::jsonb, '{}'::jsonb)
)
RETURNING *;


-- ============================================================
-- GET SUBSCRIPTION BY ID
-- ============================================================

SELECT
    s.*,

    u.first_name,
    u.last_name,
    u.email,
    u.phone,

    sp.name AS plan_name,
    sp.description AS plan_description

FROM subscriptions s

JOIN users u
    ON u.id = s.user_id

JOIN subscription_plans sp
    ON sp.id = s.plan_id

WHERE s.id = $1;


-- ============================================================
-- GET USER ACTIVE SUBSCRIPTION
-- ============================================================

SELECT
    s.*,

    sp.name AS plan_name,
    sp.description AS plan_description,
    sp.features,
    sp.price AS plan_price,
    sp.billing_cycle AS plan_billing_cycle

FROM subscriptions s

JOIN subscription_plans sp
    ON sp.id = s.plan_id

WHERE
    s.user_id = $1
    AND s.status IN (
        'active',
        'trialing'
    )

ORDER BY s.created_at DESC

LIMIT 1;


-- ============================================================
-- GET USER SUBSCRIPTIONS
-- ============================================================

SELECT
    s.*,

    sp.name AS plan_name,
    sp.description AS plan_description

FROM subscriptions s

JOIN subscription_plans sp
    ON sp.id = s.plan_id

WHERE s.user_id = $1

ORDER BY s.created_at DESC

LIMIT $2
OFFSET $3;


-- ============================================================
-- GET SUBSCRIPTION BY GATEWAY ID
-- ============================================================

SELECT
    s.*

FROM subscriptions s

WHERE
    s.gateway_subscription_id = $1

LIMIT 1;


-- ============================================================
-- GET SUBSCRIPTION BY CUSTOMER ID
-- ============================================================

SELECT
    s.*

FROM subscriptions s

WHERE
    s.gateway_customer_id = $1

ORDER BY s.created_at DESC

LIMIT 1;


-- ============================================================
-- UPDATE SUBSCRIPTION
-- ============================================================

UPDATE subscriptions
SET
    plan_id = COALESCE($2, plan_id),
    billing_cycle = COALESCE($3, billing_cycle),
    amount = COALESCE($4, amount),
    status = COALESCE($5, status),
    start_date = COALESCE($6, start_date),
    end_date = COALESCE($7, end_date),
    next_billing_date = COALESCE(
        $8,
        next_billing_date
    ),
    auto_renew = COALESCE(
        $9,
        auto_renew
    ),
    metadata = COALESCE(
        $10::jsonb,
        metadata
    ),
    updated_at = NOW()

WHERE id = $1

RETURNING *;


-- ============================================================
-- ACTIVATE SUBSCRIPTION
-- ============================================================

UPDATE subscriptions
SET
    status = 'active',
    start_date = COALESCE(
        start_date,
        NOW()
    ),
    end_date = $2,
    next_billing_date = $3,
    updated_at = NOW()

WHERE id = $1

RETURNING *;


-- ============================================================
-- START TRIAL
-- ============================================================

UPDATE subscriptions
SET
    status = 'trialing',
    start_date = COALESCE(
        start_date,
        NOW()
    ),
    trial_start_date = COALESCE(
        trial_start_date,
        NOW()
    ),
    trial_end_date = $2,
    next_billing_date = $2,
    updated_at = NOW()

WHERE id = $1

RETURNING *;


-- ============================================================
-- CANCEL SUBSCRIPTION
-- ============================================================

UPDATE subscriptions
SET
    status = 'cancelled',
    cancelled_at = NOW(),
    cancellation_reason = $2,
    auto_renew = FALSE,
    updated_at = NOW()

WHERE
    id = $1
    AND status IN (
        'active',
        'trialing',
        'past_due'
    )

RETURNING *;


-- ============================================================
-- SCHEDULE CANCELLATION
-- ============================================================

UPDATE subscriptions
SET
    cancel_at_period_end = TRUE,
    auto_renew = FALSE,
    cancellation_reason = $2,
    updated_at = NOW()

WHERE
    id = $1
    AND status IN (
        'active',
        'trialing'
    )

RETURNING *;


-- ============================================================
-- RESUME SUBSCRIPTION
-- ============================================================

UPDATE subscriptions
SET
    cancel_at_period_end = FALSE,
    auto_renew = TRUE,
    cancellation_reason = NULL,
    updated_at = NOW()

WHERE
    id = $1
    AND status = 'active'

RETURNING *;


-- ============================================================
-- PAUSE SUBSCRIPTION
-- ============================================================

UPDATE subscriptions
SET
    status = 'paused',
    paused_at = NOW(),
    pause_reason = $2,
    updated_at = NOW()

WHERE
    id = $1
    AND status = 'active'

RETURNING *;


-- ============================================================
-- RESUME PAUSED SUBSCRIPTION
-- ============================================================

UPDATE subscriptions
SET
    status = 'active',
    paused_at = NULL,
    pause_reason = NULL,
    updated_at = NOW()

WHERE
    id = $1
    AND status = 'paused'

RETURNING *;


-- ============================================================
-- MARK SUBSCRIPTION PAST DUE
-- ============================================================

UPDATE subscriptions
SET
    status = 'past_due',
    updated_at = NOW()

WHERE
    id = $1
    AND status = 'active'

RETURNING *;


-- ============================================================
-- MARK SUBSCRIPTION EXPIRED
-- ============================================================

UPDATE subscriptions
SET
    status = 'expired',
    auto_renew = FALSE,
    updated_at = NOW()

WHERE
    id = $1
    AND status IN (
        'active',
        'trialing',
        'past_due'
    )

RETURNING *;


-- ============================================================
-- CHANGE SUBSCRIPTION PLAN
-- ============================================================

UPDATE subscriptions
SET
    plan_id = $2,
    amount = $3,
    billing_cycle = $4,
    updated_at = NOW()

WHERE
    id = $1
    AND status IN (
        'active',
        'trialing'
    )

RETURNING *;


-- ============================================================
-- GET SUBSCRIPTION PLANS
-- ============================================================

SELECT
    sp.*

FROM subscription_plans sp

WHERE
    sp.status = 'active'

ORDER BY
    sp.display_order ASC,
    sp.price ASC;


-- ============================================================
-- GET SUBSCRIPTION PLAN BY ID
-- ============================================================

SELECT
    sp.*

FROM subscription_plans sp

WHERE
    sp.id = $1
    AND sp.status = 'active';


-- ============================================================
-- GET PLAN BY SLUG
-- ============================================================

SELECT
    sp.*

FROM subscription_plans sp

WHERE
    sp.slug = $1
    AND sp.status = 'active'

LIMIT 1;


-- ============================================================
-- CREATE SUBSCRIPTION PLAN
-- ============================================================

INSERT INTO subscription_plans (
    name,
    slug,
    description,
    price,
    currency,
    billing_cycle,
    trial_days,
    features,
    status,
    display_order,
    metadata
)
VALUES (
    $1,
    $2,
    $3,
    $4,
    COALESCE($5, 'INR'),
    $6,
    COALESCE($7, 0),
    COALESCE($8::jsonb, '{}'::jsonb),
    COALESCE($9, 'active'),
    COALESCE($10, 0),
    COALESCE($11::jsonb, '{}'::jsonb)
)
RETURNING *;


-- ============================================================
-- UPDATE SUBSCRIPTION PLAN
-- ============================================================

UPDATE subscription_plans
SET
    name = COALESCE($2, name),
    description = COALESCE($3, description),
    price = COALESCE($4, price),
    currency = COALESCE($5, currency),
    billing_cycle = COALESCE($6, billing_cycle),
    trial_days = COALESCE($7, trial_days),
    features = COALESCE(
        $8::jsonb,
        features
    ),
    status = COALESCE($9, status),
    display_order = COALESCE(
        $10,
        display_order
    ),
    metadata = COALESCE(
        $11::jsonb,
        metadata
    ),
    updated_at = NOW()

WHERE id = $1

RETURNING *;


-- ============================================================
-- DISABLE SUBSCRIPTION PLAN
-- ============================================================

UPDATE subscription_plans
SET
    status = 'inactive',
    updated_at = NOW()

WHERE id = $1

RETURNING *;


-- ============================================================
-- CREATE SUBSCRIPTION INVOICE
-- ============================================================

INSERT INTO subscription_invoices (
    subscription_id,
    user_id,
    invoice_number,
    amount,
    currency,
    status,
    billing_period_start,
    billing_period_end,
    due_date,
    metadata
)
VALUES (
    $1,
    $2,
    $3,
    $4,
    COALESCE($5, 'INR'),
    COALESCE($6, 'pending'),
    $7,
    $8,
    $9,
    COALESCE($10::jsonb, '{}'::jsonb)
)
RETURNING *;


-- ============================================================
-- GET INVOICE BY ID
-- ============================================================

SELECT
    si.*,

    s.plan_id,
    sp.name AS plan_name,

    u.first_name,
    u.last_name,
    u.email

FROM subscription_invoices si

JOIN subscriptions s
    ON s.id = si.subscription_id

JOIN subscription_plans sp
    ON sp.id = s.plan_id

JOIN users u
    ON u.id = si.user_id

WHERE si.id = $1;


-- ============================================================
-- GET USER INVOICES
-- ============================================================

SELECT
    si.*,

    sp.name AS plan_name

FROM subscription_invoices si

JOIN subscriptions s
    ON s.id = si.subscription_id

JOIN subscription_plans sp
    ON sp.id = s.plan_id

WHERE si.user_id = $1

ORDER BY si.created_at DESC

LIMIT $2
OFFSET $3;


-- ============================================================
-- MARK INVOICE PAID
-- ============================================================

UPDATE subscription_invoices
SET
    status = 'paid',
    payment_id = $2,
    paid_at = NOW(),
    updated_at = NOW()

WHERE
    id = $1
    AND status IN (
        'pending',
        'issued'
    )

RETURNING *;


-- ============================================================
-- MARK INVOICE FAILED
-- ============================================================

UPDATE subscription_invoices
SET
    status = 'failed',
    failure_reason = $2,
    updated_at = NOW()

WHERE id = $1

RETURNING *;


-- ============================================================
-- MARK INVOICE VOID
-- ============================================================

UPDATE subscription_invoices
SET
    status = 'void',
    updated_at = NOW()

WHERE
    id = $1
    AND status <> 'paid'

RETURNING *;


-- ============================================================
-- SUBSCRIPTION PAYMENT HISTORY
-- ============================================================

SELECT
    p.*

FROM payments p

WHERE
    p.subscription_id = $1

ORDER BY p.created_at DESC

LIMIT $2
OFFSET $3;


-- ============================================================
-- SUBSCRIPTION PAYMENT TOTAL
-- ============================================================

SELECT
    COALESCE(
        SUM(amount)
        FILTER (
            WHERE status = 'paid'
        ),
        0
    ) AS total_paid,

    COALESCE(
        SUM(amount)
        FILTER (
            WHERE status IN (
                'pending',
                'processing'
            )
        ),
        0
    ) AS pending_amount,

    COALESCE(
        SUM(refunded_amount),
        0
    ) AS refunded_amount

FROM payments

WHERE subscription_id = $1;


-- ============================================================
-- SUBSCRIPTIONS DUE FOR BILLING
-- ============================================================

SELECT
    s.*,

    sp.name AS plan_name,
    sp.price AS plan_price,

    u.first_name,
    u.last_name,
    u.email,
    u.phone

FROM subscriptions s

JOIN subscription_plans sp
    ON sp.id = s.plan_id

JOIN users u
    ON u.id = s.user_id

WHERE
    s.status = 'active'
    AND s.auto_renew = TRUE
    AND s.next_billing_date <= NOW()
    AND (
        s.cancel_at_period_end = FALSE
        OR s.cancel_at_period_end IS NULL
    )

ORDER BY s.next_billing_date ASC;


-- ============================================================
-- UPDATE NEXT BILLING DATE
-- ============================================================

UPDATE subscriptions
SET
    next_billing_date = $2,
    updated_at = NOW()

WHERE id = $1

RETURNING *;


-- ============================================================
-- SUBSCRIPTION EXPIRY PROCESSOR
-- ============================================================

UPDATE subscriptions

SET
    status = 'expired',
    auto_renew = FALSE,
    updated_at = NOW()

WHERE
    status IN (
        'active',
        'trialing'
    )

    AND end_date IS NOT NULL

    AND end_date <= NOW()

RETURNING id;


-- ============================================================
-- TRIAL EXPIRY PROCESSOR
-- ============================================================

UPDATE subscriptions

SET
    status = CASE
        WHEN auto_renew = TRUE
            THEN 'active'
        ELSE 'expired'
    END,

    trial_end_date = COALESCE(
        trial_end_date,
        NOW()
    ),

    updated_at = NOW()

WHERE
    status = 'trialing'
    AND trial_end_date <= NOW()

RETURNING *;


-- ============================================================
-- AUTO RENEWAL DISABLE
-- ============================================================

UPDATE subscriptions
SET
    auto_renew = FALSE,
    updated_at = NOW()

WHERE
    id = $1
    AND user_id = $2

RETURNING *;


-- ============================================================
-- AUTO RENEWAL ENABLE
-- ============================================================

UPDATE subscriptions
SET
    auto_renew = TRUE,
    updated_at = NOW()

WHERE
    id = $1
    AND user_id = $2
    AND status = 'active'

RETURNING *;


-- ============================================================
-- SUBSCRIPTION STATISTICS
-- ============================================================

SELECT
    COUNT(*) AS total_subscriptions,

    COUNT(*) FILTER (
        WHERE status = 'active'
    ) AS active_subscriptions,

    COUNT(*) FILTER (
        WHERE status = 'trialing'
    ) AS trialing_subscriptions,

    COUNT(*) FILTER (
        WHERE status = 'paused'
    ) AS paused_subscriptions,

    COUNT(*) FILTER (
        WHERE status = 'past_due'
    ) AS past_due_subscriptions,

    COUNT(*) FILTER (
        WHERE status = 'cancelled'
    ) AS cancelled_subscriptions,

    COUNT(*) FILTER (
        WHERE status = 'expired'
    ) AS expired_subscriptions

FROM subscriptions;


-- ============================================================
-- SUBSCRIPTION REVENUE
-- ============================================================

SELECT
    COUNT(*) AS successful_payments,

    COALESCE(
        SUM(amount),
        0
    ) AS total_revenue,

    COALESCE(
        SUM(refunded_amount),
        0
    ) AS total_refunded,

    COALESCE(
        SUM(amount),
        0
    )
    -
    COALESCE(
        SUM(refunded_amount),
        0
    ) AS net_revenue

FROM payments

WHERE
    subscription_id IS NOT NULL
    AND status = 'paid'
    AND paid_at >= $1
    AND paid_at < $2;


-- ============================================================
-- SUBSCRIPTIONS BY PLAN
-- ============================================================

SELECT
    sp.id AS plan_id,
    sp.name AS plan_name,

    COUNT(s.id) AS total_subscriptions,

    COUNT(s.id) FILTER (
        WHERE s.status = 'active'
    ) AS active_subscriptions,

    COUNT(s.id) FILTER (
        WHERE s.status = 'trialing'
    ) AS trialing_subscriptions,

    COALESCE(
        SUM(s.amount)
        FILTER (
            WHERE s.status = 'active'
        ),
        0
    ) AS active_subscription_value

FROM subscription_plans sp

LEFT JOIN subscriptions s
    ON s.plan_id = sp.id

GROUP BY
    sp.id,
    sp.name

ORDER BY
    active_subscriptions DESC;


-- ============================================================
-- MONTHLY SUBSCRIPTION TREND
-- ============================================================

SELECT
    DATE_TRUNC(
        'month',
        created_at
    ) AS month,

    COUNT(*) AS subscriptions_created,

    COUNT(*) FILTER (
        WHERE status = 'active'
    ) AS active_subscriptions,

    COUNT(*) FILTER (
        WHERE status = 'cancelled'
    ) AS cancelled_subscriptions

FROM subscriptions

WHERE
    created_at >= $1
    AND created_at < $2

GROUP BY DATE_TRUNC(
    'month',
    created_at
)

ORDER BY month ASC;


-- ============================================================
-- USER SUBSCRIPTION SUMMARY
-- ============================================================

SELECT
    COUNT(*) AS total_subscriptions,

    COUNT(*) FILTER (
        WHERE status = 'active'
    ) AS active_subscriptions,

    COUNT(*) FILTER (
        WHERE status = 'trialing'
    ) AS trialing_subscriptions,

    COUNT(*) FILTER (
        WHERE status = 'cancelled'
    ) AS cancelled_subscriptions,

    COALESCE(
        SUM(amount)
        FILTER (
            WHERE status IN (
                'active',
                'trialing'
            )
        ),
        0
    ) AS active_value

FROM subscriptions

WHERE user_id = $1;


-- ============================================================
-- SUBSCRIPTION WEBHOOK EVENT
-- ============================================================

INSERT INTO subscription_webhooks (
    gateway,
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
    gateway,
    event_id
)
DO NOTHING

RETURNING *;


-- ============================================================
-- GET SUBSCRIPTION WEBHOOK
-- ============================================================

SELECT
    *

FROM subscription_webhooks

WHERE
    gateway = $1
    AND event_id = $2

LIMIT 1;


-- ============================================================
-- MARK WEBHOOK PROCESSED
-- ============================================================

UPDATE subscription_webhooks
SET
    processed = TRUE,
    processed_at = NOW(),
    processing_error = NULL

WHERE id = $1

RETURNING *;


-- ============================================================
-- MARK WEBHOOK FAILED
-- ============================================================

UPDATE subscription_webhooks
SET
    processed = FALSE,
    processing_error = $2,
    updated_at = NOW()

WHERE id = $1

RETURNING *;


-- ============================================================
-- SEARCH SUBSCRIPTIONS
-- ============================================================

SELECT
    s.*,

    u.first_name,
    u.last_name,
    u.email,
    u.phone,

    sp.name AS plan_name

FROM subscriptions s

JOIN users u
    ON u.id = s.user_id

JOIN subscription_plans sp
    ON sp.id = s.plan_id

WHERE
       s.id::text ILIKE '%' || $1 || '%'
    OR s.gateway_subscription_id ILIKE '%' || $1 || '%'
    OR u.email ILIKE '%' || $1 || '%'
    OR u.phone ILIKE '%' || $1 || '%'
    OR u.first_name ILIKE '%' || $1 || '%'
    OR u.last_name ILIKE '%' || $1 || '%'
    OR sp.name ILIKE '%' || $1 || '%'

ORDER BY s.created_at DESC

LIMIT $2
OFFSET $3;


-- ============================================================
-- ADMIN - ALL SUBSCRIPTIONS
-- ============================================================

SELECT
    s.*,

    u.first_name,
    u.last_name,
    u.email,
    u.phone,

    sp.name AS plan_name

FROM subscriptions s

JOIN users u
    ON u.id = s.user_id

JOIN subscription_plans sp
    ON sp.id = s.plan_id

ORDER BY s.created_at DESC

LIMIT $1
OFFSET $2;


-- ============================================================
-- SUBSCRIPTION AUDIT HISTORY
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
    al.resource = 'subscription'
    AND al.resource_id = $1

ORDER BY al.created_at ASC;


-- ============================================================
-- END OF SUBSCRIPTION QUERIES
-- ============================================================