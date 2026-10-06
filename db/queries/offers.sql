-- ============================================================
-- GHAR - OFFER SQL QUERIES
-- PostgreSQL
-- ============================================================


-- ============================================================
-- CREATE OFFER
-- ============================================================

INSERT INTO offers (
    property_id,
    buyer_id,
    seller_id,
    amount,
    message,
    status,
    expires_at
)
VALUES (
    $1,
    $2,
    $3,
    $4,
    $5,
    'pending',
    $6
)
RETURNING *;


-- ============================================================
-- GET OFFER BY ID
-- ============================================================

SELECT
    o.*,

    p.title AS property_title,
    p.price AS property_price,
    p.property_type,
    p.listing_type,
    p.city,
    p.state,

    buyer.first_name AS buyer_first_name,
    buyer.last_name AS buyer_last_name,
    buyer.email AS buyer_email,
    buyer.phone AS buyer_phone,

    seller.first_name AS seller_first_name,
    seller.last_name AS seller_last_name,
    seller.email AS seller_email,
    seller.phone AS seller_phone

FROM offers o

JOIN properties p
    ON p.id = o.property_id

JOIN users buyer
    ON buyer.id = o.buyer_id

JOIN users seller
    ON seller.id = o.seller_id

WHERE o.id = $1;


-- ============================================================
-- GET BUYER OFFERS
-- ============================================================

SELECT
    o.*,

    p.title AS property_title,
    p.price AS property_price,
    p.property_type,
    p.city,
    p.state,

    seller.first_name AS seller_first_name,
    seller.last_name AS seller_last_name

FROM offers o

JOIN properties p
    ON p.id = o.property_id

JOIN users seller
    ON seller.id = o.seller_id

WHERE o.buyer_id = $1

ORDER BY o.created_at DESC

LIMIT $2
OFFSET $3;


-- ============================================================
-- GET SELLER OFFERS
-- ============================================================

SELECT
    o.*,

    p.title AS property_title,
    p.price AS property_price,
    p.property_type,
    p.city,
    p.state,

    buyer.first_name AS buyer_first_name,
    buyer.last_name AS buyer_last_name,
    buyer.email AS buyer_email,
    buyer.phone AS buyer_phone

FROM offers o

JOIN properties p
    ON p.id = o.property_id

JOIN users buyer
    ON buyer.id = o.buyer_id

WHERE o.seller_id = $1

ORDER BY o.created_at DESC

LIMIT $2
OFFSET $3;


-- ============================================================
-- GET PROPERTY OFFERS
-- ============================================================

SELECT
    o.*,

    buyer.first_name AS buyer_first_name,
    buyer.last_name AS buyer_last_name,
    buyer.email AS buyer_email,

    seller.first_name AS seller_first_name,
    seller.last_name AS seller_last_name

FROM offers o

JOIN users buyer
    ON buyer.id = o.buyer_id

JOIN users seller
    ON seller.id = o.seller_id

WHERE o.property_id = $1

ORDER BY o.created_at DESC

LIMIT $2
OFFSET $3;


-- ============================================================
-- CHECK EXISTING ACTIVE OFFER
-- ============================================================

SELECT
    o.*

FROM offers o

WHERE
    o.property_id = $1
    AND o.buyer_id = $2
    AND o.status IN (
        'pending',
        'countered'
    )

ORDER BY o.created_at DESC

LIMIT 1;


-- ============================================================
-- UPDATE OFFER
-- ============================================================

UPDATE offers
SET
    amount = COALESCE($2, amount),
    message = COALESCE($3, message),
    expires_at = COALESCE($4, expires_at),
    updated_at = NOW()

WHERE
    id = $1
    AND buyer_id = $5
    AND status IN (
        'pending',
        'countered'
    )

RETURNING *;


-- ============================================================
-- WITHDRAW OFFER
-- ============================================================

UPDATE offers
SET
    status = 'withdrawn',
    updated_at = NOW()

WHERE
    id = $1
    AND buyer_id = $2
    AND status IN (
        'pending',
        'countered'
    )

RETURNING *;


-- ============================================================
-- ACCEPT OFFER
-- ============================================================

UPDATE offers
SET
    status = 'accepted',
    responded_at = NOW(),
    responded_by = $2,
    updated_at = NOW()

WHERE
    id = $1
    AND seller_id = $2
    AND status IN (
        'pending',
        'countered'
    )

RETURNING *;


-- ============================================================
-- REJECT OFFER
-- ============================================================

UPDATE offers
SET
    status = 'rejected',
    responded_at = NOW(),
    responded_by = $2,
    response_message = $3,
    updated_at = NOW()

WHERE
    id = $1
    AND seller_id = $2
    AND status IN (
        'pending',
        'countered'
    )

RETURNING *;


-- ============================================================
-- COUNTER OFFER
-- ============================================================

UPDATE offers
SET
    status = 'countered',
    counter_amount = $3,
    counter_message = $4,
    responded_at = NOW(),
    responded_by = $2,
    updated_at = NOW()

WHERE
    id = $1
    AND seller_id = $2
    AND status IN (
        'pending',
        'countered'
    )

RETURNING *;


-- ============================================================
-- ACCEPT COUNTER OFFER
-- ============================================================

UPDATE offers
SET
    status = 'accepted',
    amount = counter_amount,
    responded_at = NOW(),
    responded_by = $2,
    updated_at = NOW()

WHERE
    id = $1
    AND buyer_id = $2
    AND status = 'countered'

RETURNING *;


-- ============================================================
-- REJECT COUNTER OFFER
-- ============================================================

UPDATE offers
SET
    status = 'rejected',
    responded_at = NOW(),
    responded_by = $2,
    response_message = $3,
    updated_at = NOW()

WHERE
    id = $1
    AND buyer_id = $2
    AND status = 'countered'

RETURNING *;


-- ============================================================
-- EXPIRE OLD OFFERS
-- ============================================================

UPDATE offers
SET
    status = 'expired',
    updated_at = NOW()

WHERE
    status IN (
        'pending',
        'countered'
    )
    AND expires_at IS NOT NULL
    AND expires_at <= NOW()

RETURNING id;


-- ============================================================
-- CANCEL PROPERTY OFFERS
-- ============================================================

UPDATE offers
SET
    status = 'cancelled',
    updated_at = NOW()

WHERE
    property_id = $1
    AND status IN (
        'pending',
        'countered'
    )

RETURNING id;


-- ============================================================
-- CANCEL OTHER OFFERS AFTER ACCEPTANCE
-- ============================================================

UPDATE offers
SET
    status = 'cancelled',
    updated_at = NOW()

WHERE
    property_id = $1
    AND id <> $2
    AND status IN (
        'pending',
        'countered'
    )

RETURNING id;


-- ============================================================
-- GET ACCEPTED OFFER FOR PROPERTY
-- ============================================================

SELECT
    o.*,

    buyer.first_name AS buyer_first_name,
    buyer.last_name AS buyer_last_name,
    buyer.email AS buyer_email,
    buyer.phone AS buyer_phone

FROM offers o

JOIN users buyer
    ON buyer.id = o.buyer_id

WHERE
    o.property_id = $1
    AND o.status = 'accepted'

ORDER BY o.responded_at DESC

LIMIT 1;


-- ============================================================
-- GET PENDING OFFERS
-- ============================================================

SELECT
    o.*,

    p.title AS property_title,
    p.price AS property_price,

    buyer.first_name AS buyer_first_name,
    buyer.last_name AS buyer_last_name,
    buyer.email AS buyer_email,

    seller.first_name AS seller_first_name,
    seller.last_name AS seller_last_name

FROM offers o

JOIN properties p
    ON p.id = o.property_id

JOIN users buyer
    ON buyer.id = o.buyer_id

JOIN users seller
    ON seller.id = o.seller_id

WHERE o.status = 'pending'

ORDER BY o.created_at ASC

LIMIT $1
OFFSET $2;


-- ============================================================
-- OFFER HISTORY
-- ============================================================

SELECT
    oh.*,

    u.first_name,
    u.last_name,
    u.email

FROM offer_history oh

LEFT JOIN users u
    ON u.id = oh.user_id

WHERE oh.offer_id = $1

ORDER BY oh.created_at ASC;


-- ============================================================
-- CREATE OFFER HISTORY
-- ============================================================

INSERT INTO offer_history (
    offer_id,
    user_id,
    action,
    amount,
    message,
    metadata
)
VALUES (
    $1,
    $2,
    $3,
    $4,
    $5,
    COALESCE($6::jsonb, '{}'::jsonb)
)
RETURNING *;


-- ============================================================
-- OFFER COUNT FOR BUYER
-- ============================================================

SELECT
    COUNT(*) AS total_offers,

    COUNT(*) FILTER (
        WHERE status = 'pending'
    ) AS pending_offers,

    COUNT(*) FILTER (
        WHERE status = 'countered'
    ) AS countered_offers,

    COUNT(*) FILTER (
        WHERE status = 'accepted'
    ) AS accepted_offers,

    COUNT(*) FILTER (
        WHERE status = 'rejected'
    ) AS rejected_offers,

    COUNT(*) FILTER (
        WHERE status = 'withdrawn'
    ) AS withdrawn_offers,

    COUNT(*) FILTER (
        WHERE status = 'expired'
    ) AS expired_offers

FROM offers

WHERE buyer_id = $1;


-- ============================================================
-- OFFER COUNT FOR SELLER
-- ============================================================

SELECT
    COUNT(*) AS total_offers,

    COUNT(*) FILTER (
        WHERE status = 'pending'
    ) AS pending_offers,

    COUNT(*) FILTER (
        WHERE status = 'countered'
    ) AS countered_offers,

    COUNT(*) FILTER (
        WHERE status = 'accepted'
    ) AS accepted_offers,

    COUNT(*) FILTER (
        WHERE status = 'rejected'
    ) AS rejected_offers

FROM offers

WHERE seller_id = $1;


-- ============================================================
-- OFFER ANALYTICS
-- ============================================================

SELECT
    COUNT(*) AS total_offers,

    COUNT(*) FILTER (
        WHERE status = 'pending'
    ) AS pending,

    COUNT(*) FILTER (
        WHERE status = 'countered'
    ) AS countered,

    COUNT(*) FILTER (
        WHERE status = 'accepted'
    ) AS accepted,

    COUNT(*) FILTER (
        WHERE status = 'rejected'
    ) AS rejected,

    COUNT(*) FILTER (
        WHERE status = 'withdrawn'
    ) AS withdrawn,

    COUNT(*) FILTER (
        WHERE status = 'expired'
    ) AS expired,

    COALESCE(
        SUM(amount),
        0
    ) AS total_offer_value,

    COALESCE(
        AVG(amount),
        0
    ) AS average_offer_value

FROM offers;


-- ============================================================
-- OFFER ANALYTICS BY STATUS
-- ============================================================

SELECT
    status,
    COUNT(*) AS total,
    COALESCE(SUM(amount), 0) AS total_amount,
    COALESCE(AVG(amount), 0) AS average_amount

FROM offers

GROUP BY status

ORDER BY total DESC;


-- ============================================================
-- OFFER TREND
-- ============================================================

SELECT
    DATE_TRUNC(
        'day',
        created_at
    ) AS date,

    COUNT(*) AS total_offers,

    COALESCE(
        SUM(amount),
        0
    ) AS total_amount,

    COUNT(*) FILTER (
        WHERE status = 'accepted'
    ) AS accepted_offers

FROM offers

WHERE created_at >= $1

GROUP BY DATE_TRUNC(
    'day',
    created_at
)

ORDER BY date ASC;


-- ============================================================
-- SEARCH OFFERS
-- ============================================================

SELECT
    o.*,

    p.title AS property_title,

    buyer.first_name AS buyer_first_name,
    buyer.last_name AS buyer_last_name,
    buyer.email AS buyer_email,

    seller.first_name AS seller_first_name,
    seller.last_name AS seller_last_name,
    seller.email AS seller_email

FROM offers o

JOIN properties p
    ON p.id = o.property_id

JOIN users buyer
    ON buyer.id = o.buyer_id

JOIN users seller
    ON seller.id = o.seller_id

WHERE
       p.title ILIKE '%' || $1 || '%'
    OR buyer.email ILIKE '%' || $1 || '%'
    OR buyer.first_name ILIKE '%' || $1 || '%'
    OR buyer.last_name ILIKE '%' || $1 || '%'
    OR seller.email ILIKE '%' || $1 || '%'
    OR seller.first_name ILIKE '%' || $1 || '%'
    OR seller.last_name ILIKE '%' || $1 || '%'
    OR o.id::text ILIKE '%' || $1 || '%'

ORDER BY o.created_at DESC

LIMIT $2
OFFSET $3;


-- ============================================================
-- OFFERS CREATED IN DATE RANGE
-- ============================================================

SELECT
    o.*,

    p.title AS property_title,

    buyer.first_name AS buyer_first_name,
    buyer.last_name AS buyer_last_name,

    seller.first_name AS seller_first_name,
    seller.last_name AS seller_last_name

FROM offers o

JOIN properties p
    ON p.id = o.property_id

JOIN users buyer
    ON buyer.id = o.buyer_id

JOIN users seller
    ON seller.id = o.seller_id

WHERE
    o.created_at >= $1
    AND o.created_at < $2

ORDER BY o.created_at DESC;


-- ============================================================
-- OFFER AUDIT HISTORY
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
    al.resource = 'offer'
    AND al.resource_id = $1

ORDER BY al.created_at ASC;


-- ============================================================
-- END OF OFFER QUERIES
-- ============================================================