-- ============================================================
-- GHAR - ADMIN SQL QUERIES
-- PostgreSQL
-- ============================================================


-- ============================================================
-- DASHBOARD
-- ============================================================

-- Total users
SELECT COUNT(*) AS total_users
FROM users;


-- Active users
SELECT COUNT(*) AS active_users
FROM users
WHERE is_active = TRUE;


-- New users today
SELECT COUNT(*) AS new_users_today
FROM users
WHERE created_at >= CURRENT_DATE;


-- New users this month
SELECT COUNT(*) AS new_users_this_month
FROM users
WHERE created_at >= DATE_TRUNC('month', CURRENT_DATE);


-- Users by role
SELECT
    role,
    COUNT(*) AS total
FROM users
GROUP BY role
ORDER BY total DESC;


-- ============================================================
-- PROPERTY STATISTICS
-- ============================================================

-- Total properties
SELECT COUNT(*) AS total_properties
FROM properties;


-- Active properties
SELECT COUNT(*) AS active_properties
FROM properties
WHERE status = 'active';


-- Pending properties
SELECT COUNT(*) AS pending_properties
FROM properties
WHERE status = 'pending';


-- Properties by status
SELECT
    status,
    COUNT(*) AS total
FROM properties
GROUP BY status
ORDER BY total DESC;


-- Properties by listing type
SELECT
    listing_type,
    COUNT(*) AS total
FROM properties
GROUP BY listing_type
ORDER BY total DESC;


-- Properties by city
SELECT
    city,
    COUNT(*) AS total
FROM properties
WHERE city IS NOT NULL
GROUP BY city
ORDER BY total DESC;


-- Featured properties
SELECT
    id,
    title,
    price,
    monthly_rent,
    city,
    state,
    status
FROM properties
WHERE is_featured = TRUE
ORDER BY created_at DESC;


-- ============================================================
-- PROPERTY MODERATION
-- ============================================================

-- Pending properties
SELECT
    p.id,
    p.title,
    p.property_type,
    p.listing_type,
    p.price,
    p.monthly_rent,
    p.city,
    p.state,
    p.created_at,
    u.id AS owner_id,
    u.first_name,
    u.last_name,
    u.email,
    u.phone
FROM properties p
JOIN users u
    ON u.id = p.owner_id
WHERE p.status = 'pending'
ORDER BY p.created_at ASC;


-- Approve property
UPDATE properties
SET
    status = 'active',
    is_verified = TRUE,
    updated_at = NOW()
WHERE id = $1;


-- Reject property
UPDATE properties
SET
    status = 'rejected',
    is_verified = FALSE,
    updated_at = NOW()
WHERE id = $1;


-- Deactivate property
UPDATE properties
SET
    status = 'inactive',
    updated_at = NOW()
WHERE id = $1;


-- Feature property
UPDATE properties
SET
    is_featured = TRUE,
    updated_at = NOW()
WHERE id = $1;


-- Remove property from featured
UPDATE properties
SET
    is_featured = FALSE,
    updated_at = NOW()
WHERE id = $1;


-- ============================================================
-- USER MANAGEMENT
-- ============================================================

-- List users
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
ORDER BY created_at DESC
LIMIT $1
OFFSET $2;


-- Find user
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
WHERE id = $1;


-- Search users
SELECT
    id,
    email,
    phone,
    first_name,
    last_name,
    role,
    is_active,
    created_at
FROM users
WHERE
       email ILIKE '%' || $1 || '%'
    OR phone ILIKE '%' || $1 || '%'
    OR first_name ILIKE '%' || $1 || '%'
    OR last_name ILIKE '%' || $1 || '%'
ORDER BY created_at DESC
LIMIT $2
OFFSET $3;


-- Activate user
UPDATE users
SET
    is_active = TRUE,
    updated_at = NOW()
WHERE id = $1;


-- Deactivate user
UPDATE users
SET
    is_active = FALSE,
    updated_at = NOW()
WHERE id = $1;


-- Change user role
UPDATE users
SET
    role = $2,
    updated_at = NOW()
WHERE id = $1;


-- ============================================================
-- USER VERIFICATION
-- ============================================================

-- Users waiting for identity verification
SELECT
    u.id,
    u.first_name,
    u.last_name,
    u.email,
    u.phone,
    u.is_identity_verified,
    v.id AS verification_id,
    v.verification_type,
    v.status,
    v.created_at
FROM users u
JOIN verifications v
    ON v.user_id = u.id
WHERE v.status IN (
    'pending',
    'in_progress'
)
ORDER BY v.created_at ASC;


-- Approve verification
UPDATE verifications
SET
    status = 'verified',
    verified_at = NOW(),
    reviewed_by = $1,
    updated_at = NOW()
WHERE id = $2;


-- Reject verification
UPDATE verifications
SET
    status = 'rejected',
    rejection_reason = $3,
    reviewed_by = $1,
    updated_at = NOW()
WHERE id = $2;


-- Update user identity verification
UPDATE users
SET
    is_identity_verified = TRUE,
    updated_at = NOW()
WHERE id = $1;


-- ============================================================
-- DOCUMENT MODERATION
-- ============================================================

-- Pending documents
SELECT
    d.id,
    d.user_id,
    d.document_type,
    d.document_name,
    d.status,
    d.created_at,
    u.first_name,
    u.last_name,
    u.email
FROM documents d
JOIN users u
    ON u.id = d.user_id
WHERE d.status = 'pending'
ORDER BY d.created_at ASC;


-- Verify document
UPDATE documents
SET
    status = 'verified',
    verified_by = $1,
    verified_at = NOW(),
    updated_at = NOW()
WHERE id = $2;


-- Reject document
UPDATE documents
SET
    status = 'rejected',
    rejection_reason = $3,
    verified_by = $1,
    updated_at = NOW()
WHERE id = $2;


-- ============================================================
-- PROPERTY DOCUMENTS
-- ============================================================

-- Pending property documents
SELECT
    pd.id,
    pd.property_id,
    pd.document_type,
    pd.document_name,
    pd.status,
    pd.created_at,
    p.title AS property_title,
    u.first_name,
    u.last_name,
    u.email
FROM property_documents pd
JOIN properties p
    ON p.id = pd.property_id
LEFT JOIN users u
    ON u.id = pd.uploaded_by
WHERE pd.status IN (
    'uploaded',
    'pending'
)
ORDER BY pd.created_at ASC;


-- Verify property document
UPDATE property_documents
SET
    status = 'verified',
    verified_by = $1,
    verified_at = NOW(),
    updated_at = NOW()
WHERE id = $2;


-- Reject property document
UPDATE property_documents
SET
    status = 'rejected',
    verification_notes = $3,
    verified_by = $1,
    updated_at = NOW()
WHERE id = $2;


-- ============================================================
-- APPLICATION MANAGEMENT
-- ============================================================

-- Pending applications
SELECT
    a.id,
    a.application_type,
    a.status,
    a.submitted_at,
    a.created_at,

    u.id AS applicant_id,
    u.first_name,
    u.last_name,
    u.email,
    u.phone,

    p.id AS property_id,
    p.title AS property_title,
    p.price
FROM applications a

JOIN users u
    ON u.id = a.applicant_id

LEFT JOIN properties p
    ON p.id = a.property_id

WHERE a.status IN (
    'submitted',
    'under_review'
)

ORDER BY a.created_at ASC;


-- Assign application to reviewer
UPDATE applications
SET
    status = 'under_review',
    reviewed_by = $1,
    updated_at = NOW()
WHERE id = $2;


-- Approve application
UPDATE applications
SET
    status = 'approved',
    reviewed_by = $1,
    approved_at = NOW(),
    review_notes = $3,
    updated_at = NOW()
WHERE id = $2;


-- Reject application
UPDATE applications
SET
    status = 'rejected',
    reviewed_by = $1,
    rejected_at = NOW(),
    review_notes = $3,
    updated_at = NOW()
WHERE id = $2;


-- ============================================================
-- LOAN MANAGEMENT
-- ============================================================

-- Loan applications
SELECT
    l.id,
    l.loan_type,
    l.requested_amount,
    l.approved_amount,
    l.interest_rate,
    l.tenure_months,
    l.status,
    l.created_at,

    u.id AS user_id,
    u.first_name,
    u.last_name,
    u.email,
    u.phone,

    p.id AS property_id,
    p.title AS property_title
FROM loans l

JOIN users u
    ON u.id = l.user_id

LEFT JOIN properties p
    ON p.id = l.property_id

ORDER BY l.created_at DESC;


-- Loans awaiting review
SELECT *
FROM loans
WHERE status IN (
    'submitted',
    'under_review'
)
ORDER BY created_at ASC;


-- Approve loan
UPDATE loans
SET
    status = 'approved',
    approved_amount = $2,
    interest_rate = $3,
    tenure_months = $4,
    approved_at = NOW(),
    updated_at = NOW()
WHERE id = $1;


-- Reject loan
UPDATE loans
SET
    status = 'rejected',
    updated_at = NOW()
WHERE id = $1;


-- ============================================================
-- PAYMENT MANAGEMENT
-- ============================================================

-- Recent payments
SELECT
    p.id,
    p.amount,
    p.currency,
    p.payment_type,
    p.gateway,
    p.gateway_payment_id,
    p.status,
    p.paid_at,
    p.created_at,

    u.id AS user_id,
    u.first_name,
    u.last_name,
    u.email
FROM payments p

JOIN users u
    ON u.id = p.user_id

ORDER BY p.created_at DESC
LIMIT $1
OFFSET $2;


-- Failed payments
SELECT
    p.id,
    p.amount,
    p.currency,
    p.payment_type,
    p.status,
    p.created_at,
    u.email,
    u.phone
FROM payments p
JOIN users u
    ON u.id = p.user_id
WHERE p.status = 'failed'
ORDER BY p.created_at DESC;


-- Total payment revenue
SELECT
    COALESCE(
        SUM(amount),
        0
    ) AS total_revenue
FROM payments
WHERE status = 'paid';


-- Revenue this month
SELECT
    COALESCE(
        SUM(amount),
        0
    ) AS monthly_revenue
FROM payments
WHERE
    status = 'paid'
    AND paid_at >= DATE_TRUNC(
        'month',
        CURRENT_DATE
    );


-- ============================================================
-- SUBSCRIPTIONS
-- ============================================================

-- Active subscriptions
SELECT
    s.id,
    s.plan_name,
    s.amount,
    s.currency,
    s.status,
    s.current_period_start,
    s.current_period_end,

    u.id AS user_id,
    u.first_name,
    u.last_name,
    u.email
FROM subscriptions s
JOIN users u
    ON u.id = s.user_id
WHERE s.status = 'active'
ORDER BY s.created_at DESC;


-- Expiring subscriptions
SELECT
    s.id,
    s.plan_name,
    s.current_period_end,
    u.email,
    u.phone
FROM subscriptions s
JOIN users u
    ON u.id = s.user_id
WHERE
    s.status = 'active'
    AND s.current_period_end
        <= NOW() + INTERVAL '7 days'
ORDER BY s.current_period_end ASC;


-- ============================================================
-- VISITS
-- ============================================================

-- Upcoming visits
SELECT
    v.id,
    v.visit_date,
    v.visit_time,
    v.duration_minutes,
    v.status,

    p.id AS property_id,
    p.title AS property_title,

    visitor.id AS visitor_id,
    visitor.first_name AS visitor_first_name,
    visitor.last_name AS visitor_last_name,
    visitor.email AS visitor_email,

    owner.id AS owner_id,
    owner.first_name AS owner_first_name,
    owner.last_name AS owner_last_name
FROM visits v

JOIN properties p
    ON p.id = v.property_id

JOIN users visitor
    ON visitor.id = v.visitor_id

LEFT JOIN users owner
    ON owner.id = v.owner_id

WHERE
    v.visit_date >= CURRENT_DATE
    AND v.status IN (
        'requested',
        'confirmed',
        'rescheduled'
    )

ORDER BY
    v.visit_date ASC,
    v.visit_time ASC;


-- Visit statistics
SELECT
    status,
    COUNT(*) AS total
FROM visits
GROUP BY status
ORDER BY total DESC;


-- ============================================================
-- OFFERS
-- ============================================================

-- Pending offers
SELECT
    o.id,
    o.amount,
    o.status,
    o.expires_at,
    o.created_at,

    p.id AS property_id,
    p.title AS property_title,

    buyer.id AS buyer_id,
    buyer.first_name AS buyer_first_name,
    buyer.last_name AS buyer_last_name,
    buyer.email AS buyer_email,

    seller.id AS seller_id,
    seller.first_name AS seller_first_name,
    seller.last_name AS seller_last_name,
    seller.email AS seller_email

FROM offers o

JOIN properties p
    ON p.id = o.property_id

JOIN users buyer
    ON buyer.id = o.buyer_id

LEFT JOIN users seller
    ON seller.id = o.seller_id

WHERE o.status IN (
    'pending',
    'countered'
)

ORDER BY o.created_at DESC;


-- Offer statistics
SELECT
    status,
    COUNT(*) AS total
FROM offers
GROUP BY status
ORDER BY total DESC;


-- ============================================================
-- SUPPORT
-- ============================================================

-- Open support tickets
SELECT
    t.id,
    t.subject,
    t.category,
    t.priority,
    t.status,
    t.created_at,

    u.id AS user_id,
    u.first_name,
    u.last_name,
    u.email,

    assigned.id AS assigned_to_id,
    assigned.first_name AS assigned_first_name,
    assigned.last_name AS assigned_last_name

FROM support_tickets t

JOIN users u
    ON u.id = t.user_id

LEFT JOIN users assigned
    ON assigned.id = t.assigned_to

WHERE t.status != 'closed'

ORDER BY
    CASE t.priority
        WHEN 'urgent' THEN 1
        WHEN 'high' THEN 2
        WHEN 'normal' THEN 3
        WHEN 'low' THEN 4
        ELSE 5
    END,
    t.created_at ASC;


-- Assign support ticket
UPDATE support_tickets
SET
    assigned_to = $1,
    updated_at = NOW()
WHERE id = $2;


-- Close support ticket
UPDATE support_tickets
SET
    status = 'closed',
    closed_at = NOW(),
    updated_at = NOW()
WHERE id = $1;


-- ============================================================
-- MARKETPLACE MODERATION
-- ============================================================

-- Marketplace listings
SELECT
    m.id,
    m.title,
    m.category,
    m.price,
    m.condition,
    m.location,
    m.status,
    m.created_at,

    u.id AS seller_id,
    u.first_name,
    u.last_name,
    u.email
FROM marketplace_items m
JOIN users u
    ON u.id = m.seller_id
ORDER BY m.created_at DESC
LIMIT $1
OFFSET $2;


-- Remove marketplace listing
UPDATE marketplace_items
SET
    status = 'removed',
    updated_at = NOW()
WHERE id = $1;


-- ============================================================
-- SERVICES
-- ============================================================

-- Active services
SELECT
    id,
    name,
    category,
    provider_name,
    price_from,
    location,
    is_active,
    created_at
FROM services
WHERE is_active = TRUE
ORDER BY created_at DESC;


-- Disable service
UPDATE services
SET
    is_active = FALSE,
    updated_at = NOW()
WHERE id = $1;


-- Enable service
UPDATE services
SET
    is_active = TRUE,
    updated_at = NOW()
WHERE id = $1;


-- ============================================================
-- REFERRALS
-- ============================================================

-- Referral statistics
SELECT
    status,
    COUNT(*) AS total_referrals,
    COALESCE(
        SUM(reward_amount),
        0
    ) AS total_rewards
FROM referrals
GROUP BY status
ORDER BY total_referrals DESC;


-- Pending referral rewards
SELECT
    r.id,
    r.referral_code,
    r.reward_amount,
    r.created_at,

    u.id AS referrer_id,
    u.first_name,
    u.last_name,
    u.email
FROM referrals r
JOIN users u
    ON u.id = r.referrer_id
WHERE
    r.status = 'completed'
    AND r.reward_paid = FALSE
ORDER BY r.created_at ASC;


-- Mark referral reward paid
UPDATE referrals
SET
    reward_paid = TRUE,
    updated_at = NOW()
WHERE id = $1;


-- ============================================================
-- NOTIFICATIONS
-- ============================================================

-- Recent notifications
SELECT
    n.id,
    n.type,
    n.title,
    n.message,
    n.is_read,
    n.created_at,

    u.email
FROM notifications n
JOIN users u
    ON u.id = n.user_id
ORDER BY n.created_at DESC
LIMIT $1
OFFSET $2;


-- ============================================================
-- AI ADMIN ANALYTICS
-- ============================================================

-- AI actions
SELECT
    a.id,
    a.action_type,
    a.created_at,

    u.id AS admin_id,
    u.first_name,
    u.last_name,
    u.email

FROM admin_ai_actions a

JOIN users u
    ON u.id = a.admin_id

ORDER BY a.created_at DESC
LIMIT $1
OFFSET $2;


-- AI usage by action
SELECT
    action_type,
    COUNT(*) AS total_actions
FROM admin_ai_actions
GROUP BY action_type
ORDER BY total_actions DESC;


-- ============================================================
-- AUDIT LOGS
-- ============================================================

-- Recent audit logs
SELECT
    a.id,
    a.action,
    a.resource,
    a.resource_id,
    a.metadata,
    a.ip_address,
    a.created_at,

    u.id AS user_id,
    u.email,
    u.first_name,
    u.last_name

FROM audit_logs a

LEFT JOIN users u
    ON u.id = a.user_id

ORDER BY a.created_at DESC
LIMIT $1
OFFSET $2;


-- User activity
SELECT
    a.id,
    a.action,
    a.resource,
    a.resource_id,
    a.metadata,
    a.ip_address,
    a.created_at
FROM audit_logs a
WHERE a.user_id = $1
ORDER BY a.created_at DESC
LIMIT $2
OFFSET $3;


-- ============================================================
-- SECURITY / SESSIONS
-- ============================================================

-- Active sessions
SELECT
    s.id,
    s.user_id,
    s.ip_address,
    s.user_agent,
    s.expires_at,
    s.created_at,

    u.email,
    u.first_name,
    u.last_name

FROM sessions s

JOIN users u
    ON u.id = s.user_id

WHERE
    s.revoked_at IS NULL
    AND s.expires_at > NOW()

ORDER BY s.created_at DESC;


-- Revoke session
UPDATE sessions
SET
    revoked_at = NOW()
WHERE id = $1;


-- Revoke all sessions for user
UPDATE sessions
SET
    revoked_at = NOW()
WHERE
    user_id = $1
    AND revoked_at IS NULL;


-- ============================================================
-- DASHBOARD SUMMARY
-- ============================================================

SELECT
    (
        SELECT COUNT(*)
        FROM users
        WHERE is_active = TRUE
    ) AS active_users,

    (
        SELECT COUNT(*)
        FROM properties
        WHERE status = 'active'
    ) AS active_properties,

    (
        SELECT COUNT(*)
        FROM properties
        WHERE status = 'pending'
    ) AS pending_properties,

    (
        SELECT COUNT(*)
        FROM visits
        WHERE
            visit_date >= CURRENT_DATE
            AND status IN (
                'requested',
                'confirmed',
                'rescheduled'
            )
    ) AS upcoming_visits,

    (
        SELECT COUNT(*)
        FROM offers
        WHERE status = 'pending'
    ) AS pending_offers,

    (
        SELECT COUNT(*)
        FROM applications
        WHERE status IN (
            'submitted',
            'under_review'
        )
    ) AS pending_applications,

    (
        SELECT COUNT(*)
        FROM loans
        WHERE status IN (
            'submitted',
            'under_review'
        )
    ) AS pending_loans,

    (
        SELECT COUNT(*)
        FROM documents
        WHERE status = 'pending'
    ) AS pending_documents,

    (
        SELECT COALESCE(SUM(amount), 0)
        FROM payments
        WHERE status = 'paid'
    ) AS total_revenue;


-- ============================================================
-- END OF ADMIN QUERIES
-- ============================================================