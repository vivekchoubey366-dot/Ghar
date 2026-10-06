-- ============================================================
-- GHAR - MESSAGE SQL QUERIES
-- PostgreSQL
-- ============================================================


-- ============================================================
-- CREATE CONVERSATION
-- ============================================================

INSERT INTO conversations (
    created_by
)
VALUES (
    $1
)
RETURNING *;


-- ============================================================
-- ADD CONVERSATION PARTICIPANT
-- ============================================================

INSERT INTO conversation_participants (
    conversation_id,
    user_id
)
VALUES (
    $1,
    $2
)
ON CONFLICT (
    conversation_id,
    user_id
)
DO NOTHING
RETURNING *;


-- ============================================================
-- GET CONVERSATION BY ID
-- ============================================================

SELECT
    c.*,

    COALESCE(
        jsonb_agg(
            jsonb_build_object(
                'userId', cp.user_id,
                'firstName', u.first_name,
                'lastName', u.last_name,
                'email', u.email,
                'role', u.role
            )
        ) FILTER (
            WHERE cp.user_id IS NOT NULL
        ),
        '[]'::jsonb
    ) AS participants

FROM conversations c

LEFT JOIN conversation_participants cp
    ON cp.conversation_id = c.id

LEFT JOIN users u
    ON u.id = cp.user_id

WHERE c.id = $1

GROUP BY c.id;


-- ============================================================
-- GET USER CONVERSATIONS
-- ============================================================

SELECT
    c.id,
    c.created_by,
    c.created_at,
    c.updated_at,

    lm.id AS last_message_id,
    lm.message AS last_message,
    lm.sender_id AS last_message_sender_id,
    lm.created_at AS last_message_at,

    COALESCE(
        unread.unread_count,
        0
    ) AS unread_count

FROM conversations c

JOIN conversation_participants cp
    ON cp.conversation_id = c.id

LEFT JOIN LATERAL (
    SELECT
        m.id,
        m.message,
        m.sender_id,
        m.created_at
    FROM messages m
    WHERE m.conversation_id = c.id
    ORDER BY m.created_at DESC
    LIMIT 1
) lm
    ON TRUE

LEFT JOIN LATERAL (
    SELECT COUNT(*) AS unread_count
    FROM messages m
    WHERE
        m.conversation_id = c.id
        AND m.sender_id <> $1
        AND m.is_read = FALSE
) unread
    ON TRUE

WHERE cp.user_id = $1

ORDER BY
    COALESCE(
        lm.created_at,
        c.created_at
    ) DESC

LIMIT $2
OFFSET $3;


-- ============================================================
-- FIND EXISTING DIRECT CONVERSATION
-- ============================================================

SELECT
    c.id,
    c.created_by,
    c.created_at,
    c.updated_at

FROM conversations c

JOIN conversation_participants cp1
    ON cp1.conversation_id = c.id

JOIN conversation_participants cp2
    ON cp2.conversation_id = c.id

WHERE
    cp1.user_id = $1
    AND cp2.user_id = $2

    AND (
        SELECT COUNT(*)
        FROM conversation_participants cp
        WHERE cp.conversation_id = c.id
    ) = 2

LIMIT 1;


-- ============================================================
-- CREATE DIRECT CONVERSATION
-- ============================================================

WITH new_conversation AS (
    INSERT INTO conversations (
        created_by
    )
    VALUES (
        $1
    )
    RETURNING id
)

INSERT INTO conversation_participants (
    conversation_id,
    user_id
)
SELECT
    id,
    user_id
FROM new_conversation,
LATERAL (
    VALUES
        ($1),
        ($2)
) AS participants(user_id)

RETURNING *;


-- ============================================================
-- SEND MESSAGE
-- ============================================================

INSERT INTO messages (
    conversation_id,
    sender_id,
    message,
    message_type,
    attachment_url,
    metadata
)
VALUES (
    $1,
    $2,
    $3,
    COALESCE($4, 'text'),
    $5,
    COALESCE($6::jsonb, '{}'::jsonb)
)
RETURNING *;


-- ============================================================
-- SEND MESSAGE WITH REPLY
-- ============================================================

INSERT INTO messages (
    conversation_id,
    sender_id,
    message,
    message_type,
    attachment_url,
    metadata,
    reply_to_message_id
)
VALUES (
    $1,
    $2,
    $3,
    COALESCE($4, 'text'),
    $5,
    COALESCE($6::jsonb, '{}'::jsonb),
    $7
)
RETURNING *;


-- ============================================================
-- GET MESSAGE BY ID
-- ============================================================

SELECT
    m.*,

    u.first_name,
    u.last_name,
    u.email,

    rm.message AS replied_message

FROM messages m

JOIN users u
    ON u.id = m.sender_id

LEFT JOIN messages rm
    ON rm.id = m.reply_to_message_id

WHERE m.id = $1;


-- ============================================================
-- GET CONVERSATION MESSAGES
-- ============================================================

SELECT
    m.id,
    m.conversation_id,
    m.sender_id,
    m.message,
    m.message_type,
    m.attachment_url,
    m.metadata,
    m.reply_to_message_id,
    m.is_read,
    m.read_at,
    m.created_at,
    m.updated_at,

    u.first_name AS sender_first_name,
    u.last_name AS sender_last_name,

    rm.message AS replied_message

FROM messages m

JOIN users u
    ON u.id = m.sender_id

LEFT JOIN messages rm
    ON rm.id = m.reply_to_message_id

WHERE
    m.conversation_id = $1

ORDER BY m.created_at ASC

LIMIT $2
OFFSET $3;


-- ============================================================
-- GET OLDER MESSAGES
-- ============================================================

SELECT
    m.*,

    u.first_name AS sender_first_name,
    u.last_name AS sender_last_name

FROM messages m

JOIN users u
    ON u.id = m.sender_id

WHERE
    m.conversation_id = $1
    AND m.created_at < $2

ORDER BY m.created_at DESC

LIMIT $3;


-- ============================================================
-- GET NEWER MESSAGES
-- ============================================================

SELECT
    m.*,

    u.first_name AS sender_first_name,
    u.last_name AS sender_last_name

FROM messages m

JOIN users u
    ON u.id = m.sender_id

WHERE
    m.conversation_id = $1
    AND m.created_at > $2

ORDER BY m.created_at ASC;


-- ============================================================
-- MARK MESSAGE AS READ
-- ============================================================

UPDATE messages
SET
    is_read = TRUE,
    read_at = NOW(),
    updated_at = NOW()

WHERE
    id = $1
    AND sender_id <> $2

RETURNING *;


-- ============================================================
-- MARK ALL CONVERSATION MESSAGES AS READ
-- ============================================================

UPDATE messages
SET
    is_read = TRUE,
    read_at = NOW(),
    updated_at = NOW()

WHERE
    conversation_id = $1
    AND sender_id <> $2
    AND is_read = FALSE

RETURNING id;


-- ============================================================
-- GET UNREAD MESSAGE COUNT
-- ============================================================

SELECT
    COUNT(*) AS unread_count

FROM messages m

JOIN conversation_participants cp
    ON cp.conversation_id = m.conversation_id

WHERE
    cp.user_id = $1
    AND m.sender_id <> $1
    AND m.is_read = FALSE;


-- ============================================================
-- GET UNREAD COUNT BY CONVERSATION
-- ============================================================

SELECT
    m.conversation_id,
    COUNT(*) AS unread_count

FROM messages m

JOIN conversation_participants cp
    ON cp.conversation_id = m.conversation_id

WHERE
    cp.user_id = $1
    AND m.sender_id <> $1
    AND m.is_read = FALSE

GROUP BY m.conversation_id;


-- ============================================================
-- EDIT MESSAGE
-- ============================================================

UPDATE messages
SET
    message = $2,
    metadata = COALESCE($3::jsonb, metadata),
    updated_at = NOW(),
    edited_at = NOW()

WHERE
    id = $1
    AND sender_id = $4

RETURNING *;


-- ============================================================
-- DELETE MESSAGE FOR EVERYONE
-- ============================================================

UPDATE messages
SET
    message = NULL,
    is_deleted = TRUE,
    deleted_at = NOW(),
    updated_at = NOW()

WHERE
    id = $1
    AND sender_id = $2

RETURNING *;


-- ============================================================
-- DELETE MESSAGE FOR USER
-- ============================================================

INSERT INTO message_deletions (
    message_id,
    user_id
)
VALUES (
    $1,
    $2
)
ON CONFLICT (
    message_id,
    user_id
)
DO NOTHING
RETURNING *;


-- ============================================================
-- ADD MESSAGE REACTION
-- ============================================================

INSERT INTO message_reactions (
    message_id,
    user_id,
    reaction
)
VALUES (
    $1,
    $2,
    $3
)
ON CONFLICT (
    message_id,
    user_id
)
DO UPDATE SET
    reaction = EXCLUDED.reaction,
    updated_at = NOW()

RETURNING *;


-- ============================================================
-- REMOVE MESSAGE REACTION
-- ============================================================

DELETE FROM message_reactions
WHERE
    message_id = $1
    AND user_id = $2

RETURNING *;


-- ============================================================
-- GET MESSAGE REACTIONS
-- ============================================================

SELECT
    mr.message_id,
    mr.reaction,
    COUNT(*) AS total

FROM message_reactions mr

WHERE mr.message_id = $1

GROUP BY
    mr.message_id,
    mr.reaction

ORDER BY total DESC;


-- ============================================================
-- ADD PARTICIPANT
-- ============================================================

INSERT INTO conversation_participants (
    conversation_id,
    user_id
)
VALUES (
    $1,
    $2
)
ON CONFLICT (
    conversation_id,
    user_id
)
DO NOTHING

RETURNING *;


-- ============================================================
-- REMOVE PARTICIPANT
-- ============================================================

DELETE FROM conversation_participants
WHERE
    conversation_id = $1
    AND user_id = $2

RETURNING *;


-- ============================================================
-- GET CONVERSATION PARTICIPANTS
-- ============================================================

SELECT
    cp.conversation_id,
    cp.user_id,
    cp.joined_at,

    u.first_name,
    u.last_name,
    u.email,
    u.phone,
    u.role

FROM conversation_participants cp

JOIN users u
    ON u.id = cp.user_id

WHERE cp.conversation_id = $1

ORDER BY cp.joined_at ASC;


-- ============================================================
-- VERIFY USER IS CONVERSATION PARTICIPANT
-- ============================================================

SELECT EXISTS (
    SELECT 1
    FROM conversation_participants
    WHERE
        conversation_id = $1
        AND user_id = $2
) AS is_participant;


-- ============================================================
-- UPDATE CONVERSATION
-- ============================================================

UPDATE conversations
SET
    title = COALESCE($2, title),
    updated_at = NOW()

WHERE
    id = $1

RETURNING *;


-- ============================================================
-- ARCHIVE CONVERSATION
-- ============================================================

UPDATE conversations
SET
    status = 'archived',
    updated_at = NOW()

WHERE
    id = $1
    AND EXISTS (
        SELECT 1
        FROM conversation_participants
        WHERE
            conversation_id = $1
            AND user_id = $2
    )

RETURNING *;


-- ============================================================
-- RESTORE CONVERSATION
-- ============================================================

UPDATE conversations
SET
    status = 'active',
    updated_at = NOW()

WHERE
    id = $1
    AND EXISTS (
        SELECT 1
        FROM conversation_participants
        WHERE
            conversation_id = $1
            AND user_id = $2
    )

RETURNING *;


-- ============================================================
-- SEARCH MESSAGES
-- ============================================================

SELECT
    m.id,
    m.conversation_id,
    m.sender_id,
    m.message,
    m.message_type,
    m.created_at,

    u.first_name,
    u.last_name

FROM messages m

JOIN users u
    ON u.id = m.sender_id

JOIN conversation_participants cp
    ON cp.conversation_id = m.conversation_id

WHERE
    cp.user_id = $1
    AND m.is_deleted = FALSE
    AND m.message ILIKE '%' || $2 || '%'

ORDER BY m.created_at DESC

LIMIT $3
OFFSET $4;


-- ============================================================
-- PROPERTY-RELATED CONVERSATIONS
-- ============================================================

SELECT DISTINCT
    c.id,
    c.created_by,
    c.created_at,
    c.updated_at,

    p.id AS property_id,
    p.title AS property_title

FROM conversations c

JOIN conversation_participants cp
    ON cp.conversation_id = c.id

JOIN messages m
    ON m.conversation_id = c.id

JOIN properties p
    ON p.id = (m.metadata ->> 'propertyId')::uuid

WHERE cp.user_id = $1

ORDER BY c.updated_at DESC;


-- ============================================================
-- SEND PROPERTY MESSAGE
-- ============================================================

INSERT INTO messages (
    conversation_id,
    sender_id,
    message,
    message_type,
    metadata
)
VALUES (
    $1,
    $2,
    $3,
    'property',
    jsonb_build_object(
        'propertyId',
        $4
    )
)
RETURNING *;


-- ============================================================
-- MESSAGE STATISTICS
-- ============================================================

SELECT
    COUNT(*) AS total_messages,

    COUNT(*) FILTER (
        WHERE message_type = 'text'
    ) AS text_messages,

    COUNT(*) FILTER (
        WHERE message_type = 'image'
    ) AS image_messages,

    COUNT(*) FILTER (
        WHERE message_type = 'file'
    ) AS file_messages,

    COUNT(*) FILTER (
        WHERE is_read = FALSE
    ) AS unread_messages

FROM messages;


-- ============================================================
-- USER MESSAGE STATISTICS
-- ============================================================

SELECT
    COUNT(*) AS messages_sent,

    COUNT(*) FILTER (
        WHERE is_read = TRUE
    ) AS read_messages,

    COUNT(*) FILTER (
        WHERE is_read = FALSE
    ) AS unread_messages

FROM messages

WHERE sender_id = $1;


-- ============================================================
-- RECENT USER MESSAGES
-- ============================================================

SELECT
    m.*,

    c.id AS conversation_id,

    u.first_name AS sender_first_name,
    u.last_name AS sender_last_name

FROM messages m

JOIN conversations c
    ON c.id = m.conversation_id

JOIN users u
    ON u.id = m.sender_id

JOIN conversation_participants cp
    ON cp.conversation_id = c.id

WHERE cp.user_id = $1

ORDER BY m.created_at DESC

LIMIT $2;


-- ============================================================
-- MESSAGE AUDIT HISTORY
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
    al.resource = 'message'
    AND al.resource_id = $1

ORDER BY al.created_at ASC;


-- ============================================================
-- END OF MESSAGE QUERIES
-- ============================================================