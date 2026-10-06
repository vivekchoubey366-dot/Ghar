-- ============================================================
-- GHAR - REFERRAL SQL QUERIES
-- PostgreSQL
-- ============================================================


-- ============================================================
-- CREATE REFERRAL CODE
-- ============================================================

INSERT INTO referral_codes (
    user_id,
    code,
    reward_type,
    reward_value,
    max_uses,
    expires_at,
    status
)
VALUES (
    $1,
    $2,
    COALESCE($3, 'credit'),
    COALESCE($4, 0),
    $5,
    $6,
    'active'
)
RETURNING *;


-- ============================================================
-- GET USER REFERRAL CODE
-- ============================================================

SELECT
    rc.*

FROM referral_codes rc

WHERE
    rc.user_id = $1
    AND rc.status = 'active'

ORDER BY rc.created_at DESC

LIMIT 1;


-- ============================================================
-- GET REFERRAL CODE
-- ============================================================

SELECT
    rc.*,

    u.first_name,
    u.last_name,
    u.email

FROM referral_codes rc

JOIN users u
    ON u.id = rc.user_id

WHERE
    rc.code = $1
    AND rc.status = 'active'
    AND (
        rc.expires_at IS NULL
        OR rc.expires_at > NOW()
    )

LIMIT 1;


-- ============================================================
-- CHECK REFERRAL CODE AVAILABILITY
-- ============================================================

SELECT EXISTS (
    SELECT 1

    FROM referral_codes rc

    WHERE
        rc.code = $1
        AND rc.status = 'active'
        AND (
            rc.expires_at IS NULL
            OR rc.expires_at > NOW()
        )
        AND (
            rc.max_uses IS NULL
            OR rc.usage_count < rc.max_uses
        )
) AS is_valid;


-- ============================================================
-- CREATE REFERRAL
-- ============================================================

INSERT INTO referrals (
    referrer_id,
    referred_user_id,
    referral_code_id,
    status,
    reward_type,
    reward_amount,
    metadata
)
VALUES (
    $1,
    $2,
    $3,
    'pending',
    COALESCE($4, 'credit'),
    COALESCE($5, 0),
    COALESCE($6::jsonb, '{}'::jsonb)
)
RETURNING *;


-- ============================================================
-- GET REFERRAL BY ID
-- ============================================================

SELECT
    r.*,

    referrer.first_name AS referrer_first_name,
    referrer.last_name AS referrer_last_name,
    referrer.email AS referrer_email,

    referred.first_name AS referred_first_name,
    referred.last_name AS referred_last_name,
    referred.email AS referred_email,

    rc.code AS referral_code

FROM referrals r

JOIN users referrer
    ON referrer.id = r.referrer_id

JOIN users referred
    ON referred.id = r.referred_user_id

LEFT JOIN referral_codes rc
    ON rc.id = r.referral_code_id

WHERE r.id = $1;


-- ============================================================
-- GET USER REFERRALS
-- ============================================================

SELECT
    r.*,

    u.first_name,
    u.last_name,
    u.email,

    rc.code AS referral_code

FROM referrals r

JOIN users u
    ON u.id = r.referred_user_id

LEFT JOIN referral_codes rc
    ON rc.id = r.referral_code_id

WHERE r.referrer_id = $1

ORDER BY r.created_at DESC

LIMIT $2
OFFSET $3;


-- ============================================================
-- GET REFERRAL MADE BY USER
-- ============================================================

SELECT
    r.*,

    u.first_name,
    u.last_name,
    u.email

FROM referrals r

JOIN users u
    ON u.id = r.referrer_id

WHERE r.referred_user_id = $1

ORDER BY r.created_at DESC

LIMIT 1;


-- ============================================================
-- CHECK IF USER WAS ALREADY REFERRED
-- ============================================================

SELECT
    r.*

FROM referrals r

WHERE r.referred_user_id = $1

LIMIT 1;


-- ============================================================
-- CHECK REFERRAL BETWEEN USERS
-- ============================================================

SELECT
    r.*

FROM referrals r

WHERE
    r.referrer_id = $1
    AND r.referred_user_id = $2

LIMIT 1;


-- ============================================================
-- INCREMENT REFERRAL CODE USAGE
-- ============================================================

UPDATE referral_codes
SET
    usage_count = COALESCE(usage_count, 0) + 1,
    updated_at = NOW()

WHERE
    id = $1
    AND status = 'active'
    AND (
        max_uses IS NULL
        OR usage_count < max_uses
    )

RETURNING *;


-- ============================================================
-- MARK REFERRAL COMPLETED
-- ============================================================

UPDATE referrals
SET
    status = 'completed',
    completed_at = NOW(),
    reward_amount = COALESCE($2, reward_amount),
    metadata = COALESCE(metadata, '{}'::jsonb)
        || COALESCE($3::jsonb, '{}'::jsonb),
    updated_at = NOW()

WHERE
    id = $1
    AND status = 'pending'

RETURNING *;


-- ============================================================
-- MARK REFERRAL QUALIFIED
-- ============================================================

UPDATE referrals
SET
    status = 'qualified',
    qualified_at = NOW(),
    updated_at = NOW()

WHERE
    id = $1
    AND status = 'pending'

RETURNING *;


-- ============================================================
-- CANCEL REFERRAL
-- ============================================================

UPDATE referrals
SET
    status = 'cancelled',
    updated_at = NOW()

WHERE
    id = $1
    AND status IN (
        'pending',
        'qualified'
    )

RETURNING *;


-- ============================================================
-- REJECT REFERRAL
-- ============================================================

UPDATE referrals
SET
    status = 'rejected',
    rejection_reason = $2,
    updated_at = NOW()

WHERE
    id = $1
    AND status IN (
        'pending',
        'qualified'
    )

RETURNING *;


-- ============================================================
-- CREATE REFERRAL REWARD
-- ============================================================

INSERT INTO referral_rewards (
    referral_id,
    user_id,
    reward_type,
    amount,
    currency,
    status,
    metadata
)
VALUES (
    $1,
    $2,
    $3,
    $4,
    COALESCE($5, 'INR'),
    'pending',
    COALESCE($6::jsonb, '{}'::jsonb)
)
RETURNING *;


-- ============================================================
-- GET REFERRAL REWARDS
-- ============================================================

SELECT
    rr.*,

    r.referrer_id,
    r.referred_user_id,
    r.status AS referral_status

FROM referral_rewards rr

JOIN referrals r
    ON r.id = rr.referral_id

WHERE rr.user_id = $1

ORDER BY rr.created_at DESC

LIMIT $2
OFFSET $3;


-- ============================================================
-- GET REFERRAL REWARD BY ID
-- ============================================================

SELECT
    rr.*,

    r.referrer_id,
    r.referred_user_id,
    r.status AS referral_status

FROM referral_rewards rr

JOIN referrals r
    ON r.id = rr.referral_id

WHERE
    rr.id = $1
    AND rr.user_id = $2;


-- ============================================================
-- MARK REWARD AVAILABLE
-- ============================================================

UPDATE referral_rewards
SET
    status = 'available',
    available_at = NOW(),
    updated_at = NOW()

WHERE
    id = $1
    AND status = 'pending'

RETURNING *;


-- ============================================================
-- MARK REWARD PAID
-- ============================================================

UPDATE referral_rewards
SET
    status = 'paid',
    paid_at = NOW(),
    payment_reference = $2,
    updated_at = NOW()

WHERE
    id = $1
    AND status = 'available'

RETURNING *;


-- ============================================================
-- MARK REWARD FAILED
-- ============================================================

UPDATE referral_rewards
SET
    status = 'failed',
    failure_reason = $2,
    updated_at = NOW()

WHERE id = $1

RETURNING *;


-- ============================================================
-- REFERRAL DASHBOARD
-- ============================================================

SELECT
    COUNT(*) AS total_referrals,

    COUNT(*) FILTER (
        WHERE status = 'pending'
    ) AS pending_referrals,

    COUNT(*) FILTER (
        WHERE status = 'qualified'
    ) AS qualified_referrals,

    COUNT(*) FILTER (
        WHERE status = 'completed'
    ) AS completed_referrals,

    COUNT(*) FILTER (
        WHERE status = 'rejected'
    ) AS rejected_referrals,

    COUNT(*) FILTER (
        WHERE status = 'cancelled'
    ) AS cancelled_referrals,

    COALESCE(
        SUM(reward_amount)
        FILTER (
            WHERE status = 'completed'
        ),
        0
    ) AS total_rewards

FROM referrals

WHERE referrer_id = $1;


-- ============================================================
-- REFERRAL REWARD SUMMARY
-- ============================================================

SELECT
    COUNT(*) AS total_rewards,

    COUNT(*) FILTER (
        WHERE status = 'pending'
    ) AS pending_rewards,

    COUNT(*) FILTER (
        WHERE status = 'available'
    ) AS available_rewards,

    COUNT(*) FILTER (
        WHERE status = 'paid'
    ) AS paid_rewards,

    COALESCE(
        SUM(amount),
        0
    ) AS total_reward_amount,

    COALESCE(
        SUM(amount)
        FILTER (
            WHERE status = 'paid'
        ),
        0
    ) AS total_paid_rewards

FROM referral_rewards

WHERE user_id = $1;


-- ============================================================
-- TOP REFERRERS
-- ============================================================

SELECT
    r.referrer_id,

    u.first_name,
    u.last_name,
    u.email,

    COUNT(*) AS total_referrals,

    COUNT(*) FILTER (
        WHERE r.status = 'completed'
    ) AS completed_referrals,

    COALESCE(
        SUM(r.reward_amount)
        FILTER (
            WHERE r.status = 'completed'
        ),
        0
    ) AS total_rewards

FROM referrals r

JOIN users u
    ON u.id = r.referrer_id

GROUP BY
    r.referrer_id,
    u.first_name,
    u.last_name,
    u.email

ORDER BY completed_referrals DESC

LIMIT $1
OFFSET $2;


-- ============================================================
-- REFERRAL ANALYTICS
-- ============================================================

SELECT
    COUNT(*) AS total_referrals,

    COUNT(*) FILTER (
        WHERE status = 'completed'
    ) AS completed_referrals,

    COUNT(*) FILTER (
        WHERE status = 'pending'
    ) AS pending_referrals,

    COUNT(*) FILTER (
        WHERE status = 'qualified'
    ) AS qualified_referrals,

    COUNT(*) FILTER (
        WHERE status = 'rejected'
    ) AS rejected_referrals,

    ROUND(
        (
            COUNT(*) FILTER (
                WHERE status = 'completed'
            )::numeric
            /
            NULLIF(COUNT(*), 0)
        ) * 100,
        2
    ) AS conversion_rate,

    COALESCE(
        SUM(reward_amount),
        0
    ) AS total_rewards

FROM referrals;


-- ============================================================
-- REFERRAL TREND
-- ============================================================

SELECT
    DATE_TRUNC(
        'day',
        created_at
    ) AS date,

    COUNT(*) AS referrals,

    COUNT(*) FILTER (
        WHERE status = 'completed'
    ) AS completed_referrals,

    COALESCE(
        SUM(reward_amount),
        0
    ) AS rewards

FROM referrals

WHERE
    created_at >= $1
    AND created_at < $2

GROUP BY DATE_TRUNC(
    'day',
    created_at
)

ORDER BY date ASC;


-- ============================================================
-- EXPIRE REFERRAL CODES
-- ============================================================

UPDATE referral_codes
SET
    status = 'expired',
    updated_at = NOW()

WHERE
    status = 'active'
    AND expires_at IS NOT NULL
    AND expires_at <= NOW()

RETURNING id;


-- ============================================================
-- DISABLE REFERRAL CODE
-- ============================================================

UPDATE referral_codes
SET
    status = 'disabled',
    updated_at = NOW()

WHERE
    id = $1
    AND user_id = $2

RETURNING *;


-- ============================================================
-- REGENERATE REFERRAL CODE
-- ============================================================

UPDATE referral_codes
SET
    status = 'disabled',
    updated_at = NOW()

WHERE
    user_id = $1
    AND status = 'active';


INSERT INTO referral_codes (
    user_id,
    code,
    reward_type,
    reward_value,
    max_uses,
    expires_at,
    status
)
VALUES (
    $1,
    $2,
    COALESCE($3, 'credit'),
    COALESCE($4, 0),
    $5,
    $6,
    'active'
)

RETURNING *;


-- ============================================================
-- SEARCH REFERRALS
-- ============================================================

SELECT
    r.*,

    referrer.first_name AS referrer_first_name,
    referrer.last_name AS referrer_last_name,
    referrer.email AS referrer_email,

    referred.first_name AS referred_first_name,
    referred.last_name AS referred_last_name,
    referred.email AS referred_email,

    rc.code AS referral_code

FROM referrals r

JOIN users referrer
    ON referrer.id = r.referrer_id

JOIN users referred
    ON referred.id = r.referred_user_id

LEFT JOIN referral_codes rc
    ON rc.id = r.referral_code_id

WHERE
       r.id::text ILIKE '%' || $1 || '%'
    OR referrer.email ILIKE '%' || $1 || '%'
    OR referred.email ILIKE '%' || $1 || '%'
    OR referrer.first_name ILIKE '%' || $1 || '%'
    OR referred.first_name ILIKE '%' || $1 || '%'
    OR rc.code ILIKE '%' || $1 || '%'

ORDER BY r.created_at DESC

LIMIT $2
OFFSET $3;


-- ============================================================
-- REFERRALS CREATED IN DATE RANGE
-- ============================================================

SELECT
    r.*,

    referrer.first_name AS referrer_first_name,
    referrer.last_name AS referrer_last_name,

    referred.first_name AS referred_first_name,
    referred.last_name AS referred_last_name

FROM referrals r

JOIN users referrer
    ON referrer.id = r.referrer_id

JOIN users referred
    ON referred.id = r.referred_user_id

WHERE
    r.created_at >= $1
    AND r.created_at < $2

ORDER BY r.created_at DESC;


-- ============================================================
-- REFERRAL AUDIT HISTORY
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
    al.resource = 'referral'
    AND al.resource_id = $1

ORDER BY al.created_at ASC;


-- ============================================================
-- END OF REFERRAL QUERIES
-- ============================================================