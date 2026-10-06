-- ============================================================
-- GHAR - PROPERTY SQL QUERIES
-- PostgreSQL
-- ============================================================


-- ============================================================
-- CREATE PROPERTY
-- ============================================================

INSERT INTO properties (
    owner_id,
    title,
    description,
    property_type,
    listing_type,
    price,
    bedrooms,
    bathrooms,
    area_sqft,
    furnishing_status,
    address,
    locality,
    city,
    state,
    pincode,
    latitude,
    longitude,
    amenities,
    images,
    status,
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
    $8,
    $9,
    $10,
    $11,
    $12,
    $13,
    $14,
    $15,
    $16,
    $17,
    COALESCE($18::jsonb, '[]'::jsonb),
    COALESCE($19::jsonb, '[]'::jsonb),
    COALESCE($20, 'draft'),
    COALESCE($21::jsonb, '{}'::jsonb)
)
RETURNING *;


-- ============================================================
-- GET PROPERTY BY ID
-- ============================================================

SELECT
    p.*,

    u.first_name AS owner_first_name,
    u.last_name AS owner_last_name,
    u.email AS owner_email,
    u.phone AS owner_phone

FROM properties p

JOIN users u
    ON u.id = p.owner_id

WHERE p.id = $1;


-- ============================================================
-- GET PUBLIC PROPERTY BY ID
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
    p.address,
    p.locality,
    p.city,
    p.state,
    p.pincode,
    p.latitude,
    p.longitude,
    p.amenities,
    p.images,
    p.status,
    p.created_at,
    p.updated_at

FROM properties p

WHERE
    p.id = $1
    AND p.status = 'published';


-- ============================================================
-- GET USER PROPERTIES
-- ============================================================

SELECT
    p.*

FROM properties p

WHERE p.owner_id = $1

ORDER BY p.created_at DESC

LIMIT $2
OFFSET $3;


-- ============================================================
-- GET USER PROPERTY BY ID
-- ============================================================

SELECT
    p.*

FROM properties p

WHERE
    p.id = $1
    AND p.owner_id = $2;


-- ============================================================
-- UPDATE PROPERTY
-- ============================================================

UPDATE properties
SET
    title = COALESCE($2, title),
    description = COALESCE($3, description),
    property_type = COALESCE($4, property_type),
    listing_type = COALESCE($5, listing_type),
    price = COALESCE($6, price),
    bedrooms = COALESCE($7, bedrooms),
    bathrooms = COALESCE($8, bathrooms),
    area_sqft = COALESCE($9, area_sqft),
    furnishing_status = COALESCE($10, furnishing_status),
    address = COALESCE($11, address),
    locality = COALESCE($12, locality),
    city = COALESCE($13, city),
    state = COALESCE($14, state),
    pincode = COALESCE($15, pincode),
    latitude = COALESCE($16, latitude),
    longitude = COALESCE($17, longitude),
    amenities = COALESCE($18::jsonb, amenities),
    images = COALESCE($19::jsonb, images),
    metadata = COALESCE($20::jsonb, metadata),
    updated_at = NOW()

WHERE
    id = $1
    AND owner_id = $21

RETURNING *;


-- ============================================================
-- UPDATE PROPERTY STATUS
-- ============================================================

UPDATE properties
SET
    status = $2,
    updated_at = NOW()

WHERE
    id = $1
    AND owner_id = $3

RETURNING *;


-- ============================================================
-- PUBLISH PROPERTY
-- ============================================================

UPDATE properties
SET
    status = 'published',
    published_at = NOW(),
    updated_at = NOW()

WHERE
    id = $1
    AND owner_id = $2
    AND status IN (
        'draft',
        'pending_review'
    )

RETURNING *;


-- ============================================================
-- SUBMIT PROPERTY FOR REVIEW
-- ============================================================

UPDATE properties
SET
    status = 'pending_review',
    submitted_at = NOW(),
    updated_at = NOW()

WHERE
    id = $1
    AND owner_id = $2
    AND status = 'draft'

RETURNING *;


-- ============================================================
-- ADMIN APPROVE PROPERTY
-- ============================================================

UPDATE properties
SET
    status = 'published',
    approved_by = $1,
    approved_at = NOW(),
    published_at = COALESCE(
        published_at,
        NOW()
    ),
    updated_at = NOW()

WHERE
    id = $2
    AND status = 'pending_review'

RETURNING *;


-- ============================================================
-- ADMIN REJECT PROPERTY
-- ============================================================

UPDATE properties
SET
    status = 'rejected',
    rejected_by = $1,
    rejected_at = NOW(),
    rejection_reason = $3,
    updated_at = NOW()

WHERE
    id = $2

RETURNING *;


-- ============================================================
-- DELETE PROPERTY
-- ============================================================

DELETE FROM properties

WHERE
    id = $1
    AND owner_id = $2
    AND status IN (
        'draft',
        'rejected'
    )

RETURNING *;


-- ============================================================
-- ARCHIVE PROPERTY
-- ============================================================

UPDATE properties
SET
    status = 'archived',
    updated_at = NOW()

WHERE
    id = $1
    AND owner_id = $2

RETURNING *;


-- ============================================================
-- MARK PROPERTY AS SOLD
-- ============================================================

UPDATE properties
SET
    status = 'sold',
    sold_at = NOW(),
    updated_at = NOW()

WHERE
    id = $1
    AND owner_id = $2

RETURNING *;


-- ============================================================
-- MARK PROPERTY AS RENTED
-- ============================================================

UPDATE properties
SET
    status = 'rented',
    rented_at = NOW(),
    updated_at = NOW()

WHERE
    id = $1
    AND owner_id = $2

RETURNING *;


-- ============================================================
-- GET PUBLISHED PROPERTIES
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
    p.created_at

FROM properties p

WHERE p.status = 'published'

ORDER BY p.created_at DESC

LIMIT $1
OFFSET $2;


-- ============================================================
-- FILTER PROPERTIES
-- ============================================================

SELECT
    p.id,
    p.title,
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
    p.created_at

FROM properties p

WHERE
    p.status = 'published'

    AND (
        $1::text IS NULL
        OR p.property_type = $1
    )

    AND (
        $2::text IS NULL
        OR p.listing_type = $2
    )

    AND (
        $3::numeric IS NULL
        OR p.price >= $3
    )

    AND (
        $4::numeric IS NULL
        OR p.price <= $4
    )

    AND (
        $5::integer IS NULL
        OR p.bedrooms >= $5
    )

    AND (
        $6::integer IS NULL
        OR p.bathrooms >= $6
    )

    AND (
        $7::numeric IS NULL
        OR p.area_sqft >= $7
    )

    AND (
        $8::numeric IS NULL
        OR p.area_sqft <= $8
    )

    AND (
        $9::text IS NULL
        OR p.city ILIKE '%' || $9 || '%'
    )

    AND (
        $10::text IS NULL
        OR p.locality ILIKE '%' || $10 || '%'
    )

    AND (
        $11::text IS NULL
        OR p.state ILIKE '%' || $11 || '%'
    )

ORDER BY p.created_at DESC

LIMIT $12
OFFSET $13;


-- ============================================================
-- SEARCH PROPERTIES
-- ============================================================

SELECT
    p.*

FROM properties p

WHERE
    p.status = 'published'

    AND (
           p.title ILIKE '%' || $1 || '%'
        OR p.description ILIKE '%' || $1 || '%'
        OR p.locality ILIKE '%' || $1 || '%'
        OR p.city ILIKE '%' || $1 || '%'
        OR p.state ILIKE '%' || $1 || '%'
        OR p.pincode ILIKE '%' || $1 || '%'
        OR p.property_type ILIKE '%' || $1 || '%'
    )

ORDER BY p.created_at DESC

LIMIT $2
OFFSET $3;


-- ============================================================
-- SEARCH PROPERTIES BY LOCATION
-- ============================================================

SELECT
    p.*

FROM properties p

WHERE
    p.status = 'published'

    AND (
           p.locality ILIKE '%' || $1 || '%'
        OR p.city ILIKE '%' || $1 || '%'
        OR p.state ILIKE '%' || $1 || '%'
        OR p.pincode ILIKE '%' || $1 || '%'
    )

ORDER BY p.created_at DESC

LIMIT $2
OFFSET $3;


-- ============================================================
-- NEARBY PROPERTIES
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

ORDER BY distance_km ASC

LIMIT $4
OFFSET $5;


-- ============================================================
-- GET FEATURED PROPERTIES
-- ============================================================

SELECT
    p.*

FROM properties p

WHERE
    p.status = 'published'
    AND p.is_featured = TRUE

ORDER BY p.featured_at DESC NULLS LAST

LIMIT $1
OFFSET $2;


-- ============================================================
-- SET FEATURED PROPERTY
-- ============================================================

UPDATE properties
SET
    is_featured = TRUE,
    featured_at = NOW(),
    updated_at = NOW()

WHERE id = $1

RETURNING *;


-- ============================================================
-- REMOVE FEATURED PROPERTY
-- ============================================================

UPDATE properties
SET
    is_featured = FALSE,
    featured_at = NULL,
    updated_at = NOW()

WHERE id = $1

RETURNING *;


-- ============================================================
-- INCREMENT PROPERTY VIEWS
-- ============================================================

UPDATE properties
SET
    view_count = COALESCE(view_count, 0) + 1,
    updated_at = NOW()

WHERE id = $1

RETURNING
    id,
    view_count;


-- ============================================================
-- INCREMENT PROPERTY CONTACT COUNT
-- ============================================================

UPDATE properties
SET
    contact_count = COALESCE(contact_count, 0) + 1,
    updated_at = NOW()

WHERE id = $1

RETURNING
    id,
    contact_count;


-- ============================================================
-- PROPERTY IMAGES
-- ============================================================

SELECT
    pi.*

FROM property_images pi

WHERE pi.property_id = $1

ORDER BY
    pi.display_order ASC,
    pi.created_at ASC;


-- ============================================================
-- ADD PROPERTY IMAGE
-- ============================================================

INSERT INTO property_images (
    property_id,
    image_url,
    thumbnail_url,
    display_order,
    is_primary,
    metadata
)
VALUES (
    $1,
    $2,
    $3,
    $4,
    COALESCE($5, FALSE),
    COALESCE($6::jsonb, '{}'::jsonb)
)
RETURNING *;


-- ============================================================
-- SET PRIMARY PROPERTY IMAGE
-- ============================================================

UPDATE property_images
SET
    is_primary = FALSE

WHERE property_id = $1;


UPDATE property_images
SET
    is_primary = TRUE,
    updated_at = NOW()

WHERE
    id = $2
    AND property_id = $1

RETURNING *;


-- ============================================================
-- DELETE PROPERTY IMAGE
-- ============================================================

DELETE FROM property_images

WHERE
    id = $1
    AND property_id = $2

RETURNING *;


-- ============================================================
-- PROPERTY AMENITIES
-- ============================================================

SELECT
    pa.*

FROM property_amenities pa

WHERE pa.property_id = $1

ORDER BY pa.amenity_name ASC;


-- ============================================================
-- ADD PROPERTY AMENITY
-- ============================================================

INSERT INTO property_amenities (
    property_id,
    amenity_name
)
VALUES (
    $1,
    $2
)
ON CONFLICT (
    property_id,
    amenity_name
)
DO NOTHING

RETURNING *;


-- ============================================================
-- REMOVE PROPERTY AMENITY
-- ============================================================

DELETE FROM property_amenities

WHERE
    property_id = $1
    AND amenity_name = $2

RETURNING *;


-- ============================================================
-- PROPERTY FAVOURITES COUNT
-- ============================================================

SELECT
    COUNT(*) AS favourite_count

FROM favourites

WHERE property_id = $1;


-- ============================================================
-- PROPERTY OFFER COUNT
-- ============================================================

SELECT
    COUNT(*) AS offer_count,

    COUNT(*) FILTER (
        WHERE status = 'pending'
    ) AS pending_offers,

    COUNT(*) FILTER (
        WHERE status = 'accepted'
    ) AS accepted_offers

FROM offers

WHERE property_id = $1;


-- ============================================================
-- PROPERTY VISIT COUNT
-- ============================================================

SELECT
    COUNT(*) AS total_visits,

    COUNT(*) FILTER (
        WHERE status = 'scheduled'
    ) AS scheduled_visits,

    COUNT(*) FILTER (
        WHERE status = 'completed'
    ) AS completed_visits,

    COUNT(*) FILTER (
        WHERE status = 'cancelled'
    ) AS cancelled_visits

FROM visits

WHERE property_id = $1;


-- ============================================================
-- PROPERTY FULL SUMMARY
-- ============================================================

SELECT
    p.*,

    u.first_name AS owner_first_name,
    u.last_name AS owner_last_name,

    COALESCE(
        fav.favourite_count,
        0
    ) AS favourite_count,

    COALESCE(
        off.offer_count,
        0
    ) AS offer_count,

    COALESCE(
        vis.visit_count,
        0
    ) AS visit_count

FROM properties p

JOIN users u
    ON u.id = p.owner_id

LEFT JOIN (
    SELECT
        property_id,
        COUNT(*) AS favourite_count
    FROM favourites
    GROUP BY property_id
) fav
    ON fav.property_id = p.id

LEFT JOIN (
    SELECT
        property_id,
        COUNT(*) AS offer_count
    FROM offers
    GROUP BY property_id
) off
    ON off.property_id = p.id

LEFT JOIN (
    SELECT
        property_id,
        COUNT(*) AS visit_count
    FROM visits
    GROUP BY property_id
) vis
    ON vis.property_id = p.id

WHERE p.id = $1;


-- ============================================================
-- PROPERTY ANALYTICS
-- ============================================================

SELECT
    p.id,
    p.title,
    p.status,
    p.view_count,
    p.contact_count,

    COALESCE(
        fav.favourite_count,
        0
    ) AS favourite_count,

    COALESCE(
        off.offer_count,
        0
    ) AS offer_count,

    COALESCE(
        off.accepted_offers,
        0
    ) AS accepted_offers,

    COALESCE(
        vis.total_visits,
        0
    ) AS total_visits,

    COALESCE(
        vis.completed_visits,
        0
    ) AS completed_visits

FROM properties p

LEFT JOIN (
    SELECT
        property_id,
        COUNT(*) AS favourite_count
    FROM favourites
    GROUP BY property_id
) fav
    ON fav.property_id = p.id

LEFT JOIN (
    SELECT
        property_id,

        COUNT(*) AS offer_count,

        COUNT(*) FILTER (
            WHERE status = 'accepted'
        ) AS accepted_offers

    FROM offers

    GROUP BY property_id
) off
    ON off.property_id = p.id

LEFT JOIN (
    SELECT
        property_id,

        COUNT(*) AS total_visits,

        COUNT(*) FILTER (
            WHERE status = 'completed'
        ) AS completed_visits

    FROM visits

    GROUP BY property_id
) vis
    ON vis.property_id = p.id

WHERE
    p.id = $1
    AND p.owner_id = $2;


-- ============================================================
-- ADMIN - ALL PROPERTIES
-- ============================================================

SELECT
    p.*,

    u.first_name AS owner_first_name,
    u.last_name AS owner_last_name,
    u.email AS owner_email,
    u.phone AS owner_phone

FROM properties p

JOIN users u
    ON u.id = p.owner_id

ORDER BY p.created_at DESC

LIMIT $1
OFFSET $2;


-- ============================================================
-- ADMIN - PROPERTIES PENDING REVIEW
-- ============================================================

SELECT
    p.*,

    u.first_name AS owner_first_name,
    u.last_name AS owner_last_name,
    u.email AS owner_email,
    u.phone AS owner_phone

FROM properties p

JOIN users u
    ON u.id = p.owner_id

WHERE p.status = 'pending_review'

ORDER BY p.submitted_at ASC

LIMIT $1
OFFSET $2;


-- ============================================================
-- ADMIN - PROPERTY STATISTICS
-- ============================================================

SELECT
    COUNT(*) AS total_properties,

    COUNT(*) FILTER (
        WHERE status = 'draft'
    ) AS draft_properties,

    COUNT(*) FILTER (
        WHERE status = 'pending_review'
    ) AS pending_review,

    COUNT(*) FILTER (
        WHERE status = 'published'
    ) AS published_properties,

    COUNT(*) FILTER (
        WHERE status = 'rejected'
    ) AS rejected_properties,

    COUNT(*) FILTER (
        WHERE status = 'sold'
    ) AS sold_properties,

    COUNT(*) FILTER (
        WHERE status = 'rented'
    ) AS rented_properties,

    COUNT(*) FILTER (
        WHERE status = 'archived'
    ) AS archived_properties,

    COALESCE(
        SUM(price)
        FILTER (
            WHERE status = 'published'
        ),
        0
    ) AS published_property_value

FROM properties;


-- ============================================================
-- PROPERTY TYPE ANALYTICS
-- ============================================================

SELECT
    property_type,

    COUNT(*) AS total_properties,

    COUNT(*) FILTER (
        WHERE status = 'published'
    ) AS published_properties,

    COALESCE(
        AVG(price),
        0
    ) AS average_price,

    COALESCE(
        MIN(price),
        0
    ) AS minimum_price,

    COALESCE(
        MAX(price),
        0
    ) AS maximum_price

FROM properties

GROUP BY property_type

ORDER BY total_properties DESC;


-- ============================================================
-- LISTING TYPE ANALYTICS
-- ============================================================

SELECT
    listing_type,

    COUNT(*) AS total_properties,

    COUNT(*) FILTER (
        WHERE status = 'published'
    ) AS published_properties,

    COALESCE(
        SUM(price)
        FILTER (
            WHERE status = 'published'
        ),
        0
    ) AS total_value

FROM properties

GROUP BY listing_type

ORDER BY total_properties DESC;


-- ============================================================
-- LOCATION ANALYTICS
-- ============================================================

SELECT
    state,
    city,
    locality,

    COUNT(*) AS property_count,

    COALESCE(
        AVG(price),
        0
    ) AS average_price,

    COALESCE(
        MIN(price),
        0
    ) AS minimum_price,

    COALESCE(
        MAX(price),
        0
    ) AS maximum_price

FROM properties

WHERE status = 'published'

GROUP BY
    state,
    city,
    locality

ORDER BY property_count DESC;


-- ============================================================
-- PROPERTY PRICE HISTORY
-- ============================================================

SELECT
    pph.*

FROM property_price_history pph

WHERE pph.property_id = $1

ORDER BY pph.created_at DESC;


-- ============================================================
-- CREATE PROPERTY PRICE HISTORY
-- ============================================================

INSERT INTO property_price_history (
    property_id,
    old_price,
    new_price,
    changed_by,
    reason
)
VALUES (
    $1,
    $2,
    $3,
    $4,
    $5
)
RETURNING *;


-- ============================================================
-- SEARCH PROPERTIES BY PRICE RANGE
-- ============================================================

SELECT
    p.*

FROM properties p

WHERE
    p.status = 'published'
    AND p.price BETWEEN $1 AND $2

ORDER BY p.price ASC

LIMIT $3
OFFSET $4;


-- ============================================================
-- SIMILAR PROPERTIES
-- ============================================================

SELECT
    p.*

FROM properties p

WHERE
    p.status = 'published'
    AND p.id <> $1

    AND p.property_type = (
        SELECT property_type
        FROM properties
        WHERE id = $1
    )

    AND (
        p.city = (
            SELECT city
            FROM properties
            WHERE id = $1
        )
        OR p.locality = (
            SELECT locality
            FROM properties
            WHERE id = $1
        )
    )

ORDER BY
    ABS(
        p.price - (
            SELECT price
            FROM properties
            WHERE id = $1
        )
    ) ASC

LIMIT $2;


-- ============================================================
-- RECENTLY VIEWED PROPERTY SUPPORT
-- ============================================================

INSERT INTO property_views (
    property_id,
    user_id,
    session_id,
    ip_address,
    user_agent
)
VALUES (
    $1,
    $2,
    $3,
    $4,
    $5
)
RETURNING *;


-- ============================================================
-- PROPERTY VIEW HISTORY
-- ============================================================

SELECT
    pv.*

FROM property_views pv

WHERE pv.property_id = $1

ORDER BY pv.created_at DESC

LIMIT $2
OFFSET $3;


-- ============================================================
-- OWNER PROPERTY PERFORMANCE
-- ============================================================

SELECT
    COUNT(*) AS total_properties,

    COALESCE(
        SUM(view_count),
        0
    ) AS total_views,

    COALESCE(
        SUM(contact_count),
        0
    ) AS total_contacts,

    COUNT(*) FILTER (
        WHERE status = 'published'
    ) AS active_listings,

    COUNT(*) FILTER (
        WHERE status = 'sold'
    ) AS sold_listings,

    COUNT(*) FILTER (
        WHERE status = 'rented'
    ) AS rented_listings

FROM properties

WHERE owner_id = $1;


-- ============================================================
-- PROPERTY AUDIT HISTORY
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
    al.resource = 'property'
    AND al.resource_id = $1

ORDER BY al.created_at ASC;


-- ============================================================
-- END OF PROPERTY QUERIES
-- ============================================================