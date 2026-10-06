-- ============================================================
-- GHAR - SEARCH SQL QUERIES
-- PostgreSQL
-- ============================================================


-- ============================================================
-- GLOBAL PROPERTY SEARCH
-- ============================================================

SELECT
    p.id,
    p.title,
    p.description,
    p.property_type,
    p.listing_type,
    p.price,
    p.bedrooms,
    p.bathrooms,
    p.area_sqft,
    p.furnishing_status,
    p.locality,
    p.city,
    p.state,
    p.pincode,
    p.latitude,
    p.longitude,
    p.amenities,
    p.images,
    p.status,
    p.is_featured,
    p.view_count,
    p.created_at,

    ts_rank(
        to_tsvector(
            'simple',
            COALESCE(p.title, '') || ' ' ||
            COALESCE(p.description, '') || ' ' ||
            COALESCE(p.locality, '') || ' ' ||
            COALESCE(p.city, '') || ' ' ||
            COALESCE(p.state, '') || ' ' ||
            COALESCE(p.pincode, '') || ' ' ||
            COALESCE(p.property_type, '')
        ),
        websearch_to_tsquery('simple', $1)
    ) AS relevance

FROM properties p

WHERE
    p.status = 'published'

    AND (
        to_tsvector(
            'simple',
            COALESCE(p.title, '') || ' ' ||
            COALESCE(p.description, '') || ' ' ||
            COALESCE(p.locality, '') || ' ' ||
            COALESCE(p.city, '') || ' ' ||
            COALESCE(p.state, '') || ' ' ||
            COALESCE(p.pincode, '') || ' ' ||
            COALESCE(p.property_type, '')
        )
        @@ websearch_to_tsquery('simple', $1)

        OR p.title ILIKE '%' || $1 || '%'
        OR p.locality ILIKE '%' || $1 || '%'
        OR p.city ILIKE '%' || $1 || '%'
        OR p.state ILIKE '%' || $1 || '%'
        OR p.pincode ILIKE '%' || $1 || '%'
    )

ORDER BY
    relevance DESC,
    p.is_featured DESC,
    p.created_at DESC

LIMIT $2
OFFSET $3;


-- ============================================================
-- ADVANCED PROPERTY SEARCH
-- ============================================================

SELECT
    p.*,

    (
        CASE
            WHEN p.title ILIKE '%' || $1 || '%' THEN 100
            WHEN p.locality ILIKE '%' || $1 || '%' THEN 80
            WHEN p.city ILIKE '%' || $1 || '%' THEN 70
            WHEN p.state ILIKE '%' || $1 || '%' THEN 60
            WHEN p.pincode ILIKE '%' || $1 || '%' THEN 50
            WHEN p.property_type ILIKE '%' || $1 || '%' THEN 40
            ELSE 10
        END
    ) AS search_score

FROM properties p

WHERE
    p.status = 'published'

    AND (
        $1::text IS NULL

        OR p.title ILIKE '%' || $1 || '%'
        OR p.description ILIKE '%' || $1 || '%'
        OR p.locality ILIKE '%' || $1 || '%'
        OR p.city ILIKE '%' || $1 || '%'
        OR p.state ILIKE '%' || $1 || '%'
        OR p.pincode ILIKE '%' || $1 || '%'
        OR p.property_type ILIKE '%' || $1 || '%'
    )

    AND (
        $4::text IS NULL
        OR p.property_type = $4
    )

    AND (
        $5::text IS NULL
        OR p.listing_type = $5
    )

    AND (
        $6::numeric IS NULL
        OR p.price >= $6
    )

    AND (
        $7::numeric IS NULL
        OR p.price <= $7
    )

    AND (
        $8::integer IS NULL
        OR p.bedrooms >= $8
    )

    AND (
        $9::integer IS NULL
        OR p.bedrooms <= $9
    )

    AND (
        $10::integer IS NULL
        OR p.bathrooms >= $10
    )

    AND (
        $11::numeric IS NULL
        OR p.area_sqft >= $11
    )

    AND (
        $12::numeric IS NULL
        OR p.area_sqft <= $12
    )

    AND (
        $13::text IS NULL
        OR p.furnishing_status = $13
    )

    AND (
        $14::text IS NULL
        OR p.state ILIKE '%' || $14 || '%'
    )

    AND (
        $15::text IS NULL
        OR p.city ILIKE '%' || $15 || '%'
    )

    AND (
        $16::text IS NULL
        OR p.locality ILIKE '%' || $16 || '%'
    )

ORDER BY
    p.is_featured DESC,
    search_score DESC,
    p.created_at DESC

LIMIT $17
OFFSET $18;


-- ============================================================
-- SEARCH BY CITY
-- ============================================================

SELECT
    p.*

FROM properties p

WHERE
    p.status = 'published'
    AND p.city ILIKE '%' || $1 || '%'

ORDER BY
    p.is_featured DESC,
    p.created_at DESC

LIMIT $2
OFFSET $3;


-- ============================================================
-- SEARCH BY LOCALITY
-- ============================================================

SELECT
    p.*

FROM properties p

WHERE
    p.status = 'published'
    AND p.locality ILIKE '%' || $1 || '%'

ORDER BY
    p.is_featured DESC,
    p.created_at DESC

LIMIT $2
OFFSET $3;


-- ============================================================
-- SEARCH BY STATE
-- ============================================================

SELECT
    p.*

FROM properties p

WHERE
    p.status = 'published'
    AND p.state ILIKE '%' || $1 || '%'

ORDER BY
    p.is_featured DESC,
    p.created_at DESC

LIMIT $2
OFFSET $3;


-- ============================================================
-- SEARCH BY PINCODE
-- ============================================================

SELECT
    p.*

FROM properties p

WHERE
    p.status = 'published'
    AND p.pincode ILIKE '%' || $1 || '%'

ORDER BY
    p.created_at DESC

LIMIT $2
OFFSET $3;


-- ============================================================
-- SEARCH BY PROPERTY TYPE
-- ============================================================

SELECT
    p.*

FROM properties p

WHERE
    p.status = 'published'
    AND p.property_type = $1

ORDER BY
    p.is_featured DESC,
    p.created_at DESC

LIMIT $2
OFFSET $3;


-- ============================================================
-- SEARCH BY LISTING TYPE
-- ============================================================

SELECT
    p.*

FROM properties p

WHERE
    p.status = 'published'
    AND p.listing_type = $1

ORDER BY
    p.is_featured DESC,
    p.created_at DESC

LIMIT $2
OFFSET $3;


-- ============================================================
-- SEARCH SALE PROPERTIES
-- ============================================================

SELECT
    p.*

FROM properties p

WHERE
    p.status = 'published'
    AND p.listing_type = 'sale'

ORDER BY
    p.is_featured DESC,
    p.price ASC

LIMIT $1
OFFSET $2;


-- ============================================================
-- SEARCH RENTAL PROPERTIES
-- ============================================================

SELECT
    p.*

FROM properties p

WHERE
    p.status = 'published'
    AND p.listing_type = 'rent'

ORDER BY
    p.is_featured DESC,
    p.price ASC

LIMIT $1
OFFSET $2;


-- ============================================================
-- SEARCH BUY / RENT BY BUDGET
-- ============================================================

SELECT
    p.*

FROM properties p

WHERE
    p.status = 'published'

    AND p.listing_type = $1

    AND p.price >= $2

    AND p.price <= $3

ORDER BY p.price ASC

LIMIT $4
OFFSET $5;


-- ============================================================
-- SEARCH BY BEDROOMS
-- ============================================================

SELECT
    p.*

FROM properties p

WHERE
    p.status = 'published'
    AND p.bedrooms >= $1

ORDER BY
    p.is_featured DESC,
    p.price ASC

LIMIT $2
OFFSET $3;


-- ============================================================
-- SEARCH BY AREA
-- ============================================================

SELECT
    p.*

FROM properties p

WHERE
    p.status = 'published'
    AND p.area_sqft BETWEEN $1 AND $2

ORDER BY p.area_sqft ASC

LIMIT $3
OFFSET $4;


-- ============================================================
-- NEARBY PROPERTY SEARCH
-- ============================================================

SELECT
    p.*,

    (
        6371 * acos(
            LEAST(
                1,
                cos(radians($1))
                *
                cos(radians(p.latitude))
                *
                cos(
                    radians(p.longitude)
                    - radians($2)
                )
                +
                sin(radians($1))
                *
                sin(radians(p.latitude))
            )
        )
    ) AS distance_km

FROM properties p

WHERE
    p.status = 'published'
    AND p.latitude IS NOT NULL
    AND p.longitude IS NOT NULL

HAVING
    (
        6371 * acos(
            LEAST(
                1,
                cos(radians($1))
                *
                cos(radians(p.latitude))
                *
                cos(
                    radians(p.longitude)
                    - radians($2)
                )
                +
                sin(radians($1))
                *
                sin(radians(p.latitude))
            )
        )
    ) <= $3

ORDER BY
    distance_km ASC

LIMIT $4
OFFSET $5;


-- ============================================================
-- MAP / BOUNDING BOX SEARCH
-- ============================================================

SELECT
    p.id,
    p.title,
    p.price,
    p.property_type,
    p.listing_type,
    p.latitude,
    p.longitude,
    p.images

FROM properties p

WHERE
    p.status = 'published'

    AND p.latitude BETWEEN $1 AND $2

    AND p.longitude BETWEEN $3 AND $4

ORDER BY p.created_at DESC

LIMIT $5;


-- ============================================================
-- FEATURED SEARCH
-- ============================================================

SELECT
    p.*

FROM properties p

WHERE
    p.status = 'published'
    AND p.is_featured = TRUE

ORDER BY
    p.featured_at DESC NULLS LAST,
    p.created_at DESC

LIMIT $1
OFFSET $2;


-- ============================================================
-- TRENDING PROPERTIES
-- ============================================================

SELECT
    p.*,

    (
        COALESCE(p.view_count, 0) * 1
        +
        COALESCE(p.contact_count, 0) * 5
        +
        COALESCE(f.favourite_count, 0) * 4
        +
        COALESCE(o.offer_count, 0) * 8
    ) AS popularity_score

FROM properties p

LEFT JOIN (
    SELECT
        property_id,
        COUNT(*) AS favourite_count

    FROM favourites

    GROUP BY property_id
) f
    ON f.property_id = p.id

LEFT JOIN (
    SELECT
        property_id,
        COUNT(*) AS offer_count

    FROM offers

    GROUP BY property_id
) o
    ON o.property_id = p.id

WHERE
    p.status = 'published'

ORDER BY
    popularity_score DESC,
    p.created_at DESC

LIMIT $1
OFFSET $2;


-- ============================================================
-- RECENT PROPERTIES
-- ============================================================

SELECT
    p.*

FROM properties p

WHERE p.status = 'published'

ORDER BY p.created_at DESC

LIMIT $1
OFFSET $2;


-- ============================================================
-- PRICE LOW TO HIGH
-- ============================================================

SELECT
    p.*

FROM properties p

WHERE p.status = 'published'

ORDER BY
    p.price ASC,
    p.created_at DESC

LIMIT $1
OFFSET $2;


-- ============================================================
-- PRICE HIGH TO LOW
-- ============================================================

SELECT
    p.*

FROM properties p

WHERE p.status = 'published'

ORDER BY
    p.price DESC,
    p.created_at DESC

LIMIT $1
OFFSET $2;


-- ============================================================
-- AREA LOW TO HIGH
-- ============================================================

SELECT
    p.*

FROM properties p

WHERE p.status = 'published'

ORDER BY
    p.area_sqft ASC,
    p.created_at DESC

LIMIT $1
OFFSET $2;


-- ============================================================
-- AREA HIGH TO LOW
-- ============================================================

SELECT
    p.*

FROM properties p

WHERE p.status = 'published'

ORDER BY
    p.area_sqft DESC,
    p.created_at DESC

LIMIT $1
OFFSET $2;


-- ============================================================
-- SEARCH WITH AMENITY
-- ============================================================

SELECT DISTINCT
    p.*

FROM properties p

JOIN property_amenities pa
    ON pa.property_id = p.id

WHERE
    p.status = 'published'
    AND pa.amenity_name ILIKE '%' || $1 || '%'

ORDER BY
    p.is_featured DESC,
    p.created_at DESC

LIMIT $2
OFFSET $3;


-- ============================================================
-- SEARCH WITH MULTIPLE AMENITIES
-- ============================================================

SELECT
    p.*

FROM properties p

JOIN property_amenities pa
    ON pa.property_id = p.id

WHERE
    p.status = 'published'
    AND pa.amenity_name = ANY($1::text[])

GROUP BY p.id

HAVING COUNT(
    DISTINCT pa.amenity_name
) = CARDINALITY($1::text[])

ORDER BY
    p.is_featured DESC,
    p.created_at DESC

LIMIT $2
OFFSET $3;


-- ============================================================
-- SEARCH FURNISHED PROPERTIES
-- ============================================================

SELECT
    p.*

FROM properties p

WHERE
    p.status = 'published'
    AND p.furnishing_status = $1

ORDER BY
    p.is_featured DESC,
    p.created_at DESC

LIMIT $2
OFFSET $3;


-- ============================================================
-- SEARCH PROPERTY BY ID / REFERENCE
-- ============================================================

SELECT
    p.*

FROM properties p

WHERE
    p.id::text = $1
    AND p.status = 'published'

LIMIT 1;


-- ============================================================
-- SIMILAR PROPERTIES
-- ============================================================

SELECT
    p.*,

    (
        CASE
            WHEN p.property_type = source.property_type
                THEN 30
            ELSE 0
        END
        +
        CASE
            WHEN p.city = source.city
                THEN 25
            ELSE 0
        END
        +
        CASE
            WHEN p.locality = source.locality
                THEN 20
            ELSE 0
        END
        +
        CASE
            WHEN p.bedrooms = source.bedrooms
                THEN 15
            ELSE 0
        END
        +
        CASE
            WHEN p.listing_type = source.listing_type
                THEN 10
            ELSE 0
        END
    ) AS similarity_score

FROM properties p

CROSS JOIN (
    SELECT
        property_type,
        city,
        locality,
        bedrooms,
        listing_type
    FROM properties
    WHERE id = $1
) source

WHERE
    p.status = 'published'
    AND p.id <> $1

ORDER BY
    similarity_score DESC,
    p.created_at DESC

LIMIT $2;


-- ============================================================
-- PROPERTY COUNT FOR SEARCH
-- ============================================================

SELECT
    COUNT(*) AS total

FROM properties p

WHERE
    p.status = 'published'

    AND (
        $1::text IS NULL
        OR p.title ILIKE '%' || $1 || '%'
        OR p.description ILIKE '%' || $1 || '%'
        OR p.locality ILIKE '%' || $1 || '%'
        OR p.city ILIKE '%' || $1 || '%'
        OR p.state ILIKE '%' || $1 || '%'
        OR p.pincode ILIKE '%' || $1 || '%'
        OR p.property_type ILIKE '%' || $1 || '%'
    )

    AND (
        $2::text IS NULL
        OR p.property_type = $2
    )

    AND (
        $3::text IS NULL
        OR p.listing_type = $3
    )

    AND (
        $4::numeric IS NULL
        OR p.price >= $4
    )

    AND (
        $5::numeric IS NULL
        OR p.price <= $5
    )

    AND (
        $6::integer IS NULL
        OR p.bedrooms >= $6
    )

    AND (
        $7::integer IS NULL
        OR p.bedrooms <= $7
    )

    AND (
        $8::text IS NULL
        OR p.city ILIKE '%' || $8 || '%'
    )

    AND (
        $9::text IS NULL
        OR p.locality ILIKE '%' || $9 || '%'
    );


-- ============================================================
-- SEARCH SUGGESTIONS
-- ============================================================

SELECT
    suggestion,
    suggestion_type,
    result_count

FROM (
    SELECT
        city AS suggestion,
        'city' AS suggestion_type,
        COUNT(*) AS result_count

    FROM properties

    WHERE
        status = 'published'
        AND city ILIKE $1 || '%'

    GROUP BY city

    UNION ALL

    SELECT
        locality AS suggestion,
        'locality' AS suggestion_type,
        COUNT(*) AS result_count

    FROM properties

    WHERE
        status = 'published'
        AND locality ILIKE $1 || '%'

    GROUP BY locality

    UNION ALL

    SELECT
        state AS suggestion,
        'state' AS suggestion_type,
        COUNT(*) AS result_count

    FROM properties

    WHERE
        status = 'published'
        AND state ILIKE $1 || '%'

    GROUP BY state

    UNION ALL

    SELECT
        property_type AS suggestion,
        'property_type' AS suggestion_type,
        COUNT(*) AS result_count

    FROM properties

    WHERE
        status = 'published'
        AND property_type ILIKE $1 || '%'

    GROUP BY property_type
) suggestions

ORDER BY
    result_count DESC,
    suggestion ASC

LIMIT $2;


-- ============================================================
-- SEARCH HISTORY - CREATE
-- ============================================================

INSERT INTO search_history (
    user_id,
    query,
    filters,
    result_count,
    latitude,
    longitude
)
VALUES (
    $1,
    $2,
    COALESCE($3::jsonb, '{}'::jsonb),
    $4,
    $5,
    $6
)
RETURNING *;


-- ============================================================
-- SEARCH HISTORY - USER
-- ============================================================

SELECT
    sh.*

FROM search_history sh

WHERE sh.user_id = $1

ORDER BY sh.created_at DESC

LIMIT $2
OFFSET $3;


-- ============================================================
-- DELETE SEARCH HISTORY
-- ============================================================

DELETE FROM search_history

WHERE
    id = $1
    AND user_id = $2

RETURNING *;


-- ============================================================
-- CLEAR USER SEARCH HISTORY
-- ============================================================

DELETE FROM search_history

WHERE user_id = $1

RETURNING id;


-- ============================================================
-- SAVE SEARCH
-- ============================================================

INSERT INTO saved_searches (
    user_id,
    name,
    query,
    filters,
    notification_enabled
)
VALUES (
    $1,
    $2,
    $3,
    COALESCE($4::jsonb, '{}'::jsonb),
    COALESCE($5, TRUE)
)
RETURNING *;


-- ============================================================
-- GET SAVED SEARCHES
-- ============================================================

SELECT
    ss.*

FROM saved_searches ss

WHERE ss.user_id = $1

ORDER BY ss.created_at DESC

LIMIT $2
OFFSET $3;


-- ============================================================
-- GET SAVED SEARCH BY ID
-- ============================================================

SELECT
    ss.*

FROM saved_searches ss

WHERE
    ss.id = $1
    AND ss.user_id = $2;


-- ============================================================
-- UPDATE SAVED SEARCH
-- ============================================================

UPDATE saved_searches
SET
    name = COALESCE($3, name),
    query = COALESCE($4, query),
    filters = COALESCE($5::jsonb, filters),
    notification_enabled = COALESCE(
        $6,
        notification_enabled
    ),
    updated_at = NOW()

WHERE
    id = $1
    AND user_id = $2

RETURNING *;


-- ============================================================
-- DELETE SAVED SEARCH
-- ============================================================

DELETE FROM saved_searches

WHERE
    id = $1
    AND user_id = $2

RETURNING *;


-- ============================================================
-- SEARCH NOTIFICATION MATCHES
-- ============================================================

SELECT
    ss.id AS saved_search_id,
    ss.user_id,
    ss.name,
    ss.query,
    ss.filters,

    p.id AS property_id,
    p.title,
    p.price,
    p.city,
    p.locality,
    p.property_type,
    p.listing_type

FROM saved_searches ss

CROSS JOIN properties p

WHERE
    ss.notification_enabled = TRUE
    AND p.status = 'published'

    AND (
        ss.query IS NULL
        OR ss.query = ''
        OR p.title ILIKE '%' || ss.query || '%'
        OR p.description ILIKE '%' || ss.query || '%'
        OR p.city ILIKE '%' || ss.query || '%'
        OR p.locality ILIKE '%' || ss.query || '%'
        OR p.state ILIKE '%' || ss.query || '%'
    )

ORDER BY p.created_at DESC;


-- ============================================================
-- SEARCH ANALYTICS
-- ============================================================

SELECT
    COUNT(*) AS total_searches,

    COUNT(DISTINCT user_id) AS unique_users,

    COUNT(*) FILTER (
        WHERE created_at >= NOW() - INTERVAL '24 hours'
    ) AS searches_last_24_hours,

    COUNT(*) FILTER (
        WHERE created_at >= NOW() - INTERVAL '7 days'
    ) AS searches_last_7_days,

    COUNT(*) FILTER (
        WHERE created_at >= NOW() - INTERVAL '30 days'
    ) AS searches_last_30_days

FROM search_history;


-- ============================================================
-- POPULAR SEARCHES
-- ============================================================

SELECT
    query,

    COUNT(*) AS search_count,

    COUNT(DISTINCT user_id) AS unique_users

FROM search_history

WHERE
    query IS NOT NULL
    AND TRIM(query) <> ''

GROUP BY query

ORDER BY search_count DESC

LIMIT $1
OFFSET $2;


-- ============================================================
-- POPULAR LOCATIONS
-- ============================================================

SELECT
    city,

    COUNT(*) AS property_count,

    COALESCE(
        AVG(price),
        0
    ) AS average_price

FROM properties

WHERE status = 'published'

GROUP BY city

ORDER BY property_count DESC

LIMIT $1;


-- ============================================================
-- SEARCH AUDIT HISTORY
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
    al.resource = 'search'

ORDER BY al.created_at DESC

LIMIT $1
OFFSET $2;


-- ============================================================
-- END OF SEARCH QUERIES
-- ============================================================