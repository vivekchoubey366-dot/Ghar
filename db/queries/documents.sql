-- ============================================================
-- GHAR - DOCUMENT SQL QUERIES
-- PostgreSQL
-- ============================================================


-- ============================================================
-- CREATE DOCUMENT
-- ============================================================

INSERT INTO documents (
    user_id,
    application_id,
    document_type,
    document_name,
    file_url,
    file_path,
    mime_type,
    file_size,
    status
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
    'pending'
)
RETURNING *;


-- ============================================================
-- GET DOCUMENT BY ID
-- ============================================================

SELECT
    d.*,

    u.first_name,
    u.last_name,
    u.email,
    u.phone,

    a.application_type,
    a.status AS application_status

FROM documents d

JOIN users u
    ON u.id = d.user_id

LEFT JOIN applications a
    ON a.id = d.application_id

WHERE d.id = $1;


-- ============================================================
-- GET USER DOCUMENTS
-- ============================================================

SELECT
    d.*,

    a.application_type,
    a.status AS application_status

FROM documents d

LEFT JOIN applications a
    ON a.id = d.application_id

WHERE d.user_id = $1

ORDER BY d.created_at DESC

LIMIT $2
OFFSET $3;


-- ============================================================
-- GET APPLICATION DOCUMENTS
-- ============================================================

SELECT
    d.*

FROM documents d

WHERE d.application_id = $1

ORDER BY d.created_at ASC;


-- ============================================================
-- GET DOCUMENTS BY TYPE
-- ============================================================

SELECT
    d.*

FROM documents d

WHERE
    d.user_id = $1
    AND d.document_type = $2

ORDER BY d.created_at DESC;


-- ============================================================
-- GET DOCUMENTS BY STATUS
-- ============================================================

SELECT
    d.*,

    u.first_name,
    u.last_name,
    u.email

FROM documents d

JOIN users u
    ON u.id = d.user_id

WHERE d.status = $1

ORDER BY d.created_at ASC

LIMIT $2
OFFSET $3;


-- ============================================================
-- UPDATE DOCUMENT
-- ============================================================

UPDATE documents
SET
    document_name = COALESCE($2, document_name),
    document_type = COALESCE($3, document_type),
    file_url = COALESCE($4, file_url),
    file_path = COALESCE($5, file_path),
    mime_type = COALESCE($6, mime_type),
    file_size = COALESCE($7, file_size),
    updated_at = NOW()
WHERE
    id = $1
    AND user_id = $8

RETURNING *;


-- ============================================================
-- UPDATE DOCUMENT METADATA
-- ============================================================

UPDATE documents
SET
    document_name = COALESCE($2, document_name),
    document_type = COALESCE($3, document_type),
    updated_at = NOW()
WHERE id = $1

RETURNING *;


-- ============================================================
-- SUBMIT DOCUMENT FOR VERIFICATION
-- ============================================================

UPDATE documents
SET
    status = 'pending',
    rejection_reason = NULL,
    updated_at = NOW()
WHERE
    id = $1
    AND user_id = $2

RETURNING *;


-- ============================================================
-- VERIFY DOCUMENT
-- ============================================================

UPDATE documents
SET
    status = 'verified',
    verified_by = $1,
    verified_at = NOW(),
    rejection_reason = NULL,
    updated_at = NOW()
WHERE id = $2

RETURNING *;


-- ============================================================
-- REJECT DOCUMENT
-- ============================================================

UPDATE documents
SET
    status = 'rejected',
    verified_by = $1,
    rejection_reason = $3,
    verified_at = NULL,
    updated_at = NOW()
WHERE id = $2

RETURNING *;


-- ============================================================
-- REQUEST DOCUMENT REUPLOAD
-- ============================================================

UPDATE documents
SET
    status = 'reupload_required',
    verified_by = $1,
    rejection_reason = $3,
    updated_at = NOW()
WHERE id = $2

RETURNING *;


-- ============================================================
-- DELETE DOCUMENT
-- ============================================================

DELETE FROM documents
WHERE
    id = $1
    AND user_id = $2

RETURNING *;


-- ============================================================
-- ADMIN - ALL DOCUMENTS
-- ============================================================

SELECT
    d.id,
    d.user_id,
    d.application_id,
    d.document_type,
    d.document_name,
    d.file_url,
    d.mime_type,
    d.file_size,
    d.status,
    d.rejection_reason,
    d.verified_by,
    d.verified_at,
    d.created_at,
    d.updated_at,

    u.first_name,
    u.last_name,
    u.email,
    u.phone,

    a.application_type,
    a.status AS application_status

FROM documents d

JOIN users u
    ON u.id = d.user_id

LEFT JOIN applications a
    ON a.id = d.application_id

ORDER BY d.created_at DESC

LIMIT $1
OFFSET $2;


-- ============================================================
-- ADMIN - PENDING DOCUMENTS
-- ============================================================

SELECT
    d.*,

    u.first_name,
    u.last_name,
    u.email,
    u.phone,

    a.application_type,
    a.status AS application_status

FROM documents d

JOIN users u
    ON u.id = d.user_id

LEFT JOIN applications a
    ON a.id = d.application_id

WHERE d.status = 'pending'

ORDER BY d.created_at ASC

LIMIT $1
OFFSET $2;


-- ============================================================
-- ADMIN - DOCUMENTS REQUIRING ACTION
-- ============================================================

SELECT
    d.*,

    u.first_name,
    u.last_name,
    u.email,

    a.application_type,
    a.status AS application_status

FROM documents d

JOIN users u
    ON u.id = d.user_id

LEFT JOIN applications a
    ON a.id = d.application_id

WHERE d.status IN (
    'pending',
    'reupload_required'
)

ORDER BY d.created_at ASC;


-- ============================================================
-- DOCUMENT COUNT
-- ============================================================

SELECT COUNT(*) AS total
FROM documents
WHERE user_id = $1;


-- ============================================================
-- DOCUMENT COUNT BY STATUS
-- ============================================================

SELECT
    status,
    COUNT(*) AS total

FROM documents

WHERE user_id = $1

GROUP BY status

ORDER BY total DESC;


-- ============================================================
-- DOCUMENT SUMMARY
-- ============================================================

SELECT
    COUNT(*) AS total_documents,

    COUNT(*) FILTER (
        WHERE status = 'pending'
    ) AS pending_documents,

    COUNT(*) FILTER (
        WHERE status = 'verified'
    ) AS verified_documents,

    COUNT(*) FILTER (
        WHERE status = 'rejected'
    ) AS rejected_documents,

    COUNT(*) FILTER (
        WHERE status = 'reupload_required'
    ) AS reupload_required_documents

FROM documents

WHERE user_id = $1;


-- ============================================================
-- ADMIN DOCUMENT SUMMARY
-- ============================================================

SELECT
    COUNT(*) AS total_documents,

    COUNT(*) FILTER (
        WHERE status = 'pending'
    ) AS pending_documents,

    COUNT(*) FILTER (
        WHERE status = 'verified'
    ) AS verified_documents,

    COUNT(*) FILTER (
        WHERE status = 'rejected'
    ) AS rejected_documents,

    COUNT(*) FILTER (
        WHERE status = 'reupload_required'
    ) AS reupload_required_documents

FROM documents;


-- ============================================================
-- DOCUMENT TYPE STATISTICS
-- ============================================================

SELECT
    document_type,
    COUNT(*) AS total,

    COUNT(*) FILTER (
        WHERE status = 'verified'
    ) AS verified,

    COUNT(*) FILTER (
        WHERE status = 'pending'
    ) AS pending,

    COUNT(*) FILTER (
        WHERE status = 'rejected'
    ) AS rejected

FROM documents

GROUP BY document_type

ORDER BY total DESC;


-- ============================================================
-- SEARCH DOCUMENTS
-- ============================================================

SELECT
    d.*,

    u.first_name,
    u.last_name,
    u.email,

    a.application_type

FROM documents d

JOIN users u
    ON u.id = d.user_id

LEFT JOIN applications a
    ON a.id = d.application_id

WHERE
       d.document_name ILIKE '%' || $1 || '%'
    OR d.document_type ILIKE '%' || $1 || '%'
    OR u.email ILIKE '%' || $1 || '%'
    OR u.first_name ILIKE '%' || $1 || '%'
    OR u.last_name ILIKE '%' || $1 || '%'

ORDER BY d.created_at DESC

LIMIT $2
OFFSET $3;


-- ============================================================
-- DOCUMENT VERIFICATION HISTORY
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
    al.resource = 'document'
    AND al.resource_id = $1

ORDER BY al.created_at ASC;


-- ============================================================
-- RECENT DOCUMENT UPLOADS
-- ============================================================

SELECT
    d.id,
    d.document_name,
    d.document_type,
    d.status,
    d.created_at,

    u.first_name,
    u.last_name,
    u.email

FROM documents d

JOIN users u
    ON u.id = d.user_id

ORDER BY d.created_at DESC

LIMIT $1;


-- ============================================================
-- DOCUMENTS UPLOADED IN DATE RANGE
-- ============================================================

SELECT
    d.*,

    u.first_name,
    u.last_name,
    u.email

FROM documents d

JOIN users u
    ON u.id = d.user_id

WHERE
    d.created_at >= $1
    AND d.created_at < $2

ORDER BY d.created_at DESC;


-- ============================================================
-- DOCUMENT VERIFICATION ANALYTICS
-- ============================================================

SELECT
    DATE_TRUNC('day', created_at) AS date,

    COUNT(*) AS uploaded,

    COUNT(*) FILTER (
        WHERE status = 'verified'
    ) AS verified,

    COUNT(*) FILTER (
        WHERE status = 'rejected'
    ) AS rejected

FROM documents

WHERE created_at >= $1

GROUP BY DATE_TRUNC('day', created_at)

ORDER BY date ASC;


-- ============================================================
-- END OF DOCUMENT QUERIES
-- ============================================================