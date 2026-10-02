-- ============================================================
-- GHAR -- REAL ESTATE PLATFORM
-- PostgreSQL DATABASE SCHEMA
-- ============================================================

CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- ============================================================
-- ENUM-LIKE CHECK VALUES
-- ============================================================

-- ============================================================
-- USERS
-- ============================================================

CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    name VARCHAR(120) NOT NULL,

    email VARCHAR(255) NOT NULL UNIQUE,

    password_hash TEXT NOT NULL,

    phone VARCHAR(30),

    role VARCHAR(30) NOT NULL DEFAULT 'buyer'
        CHECK (
            role IN (
                'buyer',
                'seller',
                'agent',
                'tenant',
                'landlord',
                'admin'
            )
        ),

    status VARCHAR(30) NOT NULL DEFAULT 'active'
        CHECK (
            status IN (
                'active',
                'inactive',
                'suspended',
                'pending'
            )
        ),

    email_verified BOOLEAN NOT NULL DEFAULT FALSE,

    phone_verified BOOLEAN NOT NULL DEFAULT FALSE,

    profile_image TEXT,

    last_login_at TIMESTAMPTZ,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_users_email_lower
ON users (LOWER(email));

CREATE INDEX IF NOT EXISTS idx_users_role
ON users(role);

CREATE INDEX IF NOT EXISTS idx_users_status
ON users(status);


-- ============================================================
-- PROPERTIES
-- ============================================================

CREATE TABLE IF NOT EXISTS properties (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    owner_id UUID
        REFERENCES users(id)
        ON DELETE SET NULL,

    title VARCHAR(255) NOT NULL,

    description TEXT,

    property_type VARCHAR(60) NOT NULL,

    listing_type VARCHAR(30) NOT NULL DEFAULT 'sale'
        CHECK (
            listing_type IN (
                'sale',
                'rent',
                'lease'
            )
        ),

    purpose VARCHAR(30),

    price NUMERIC(16,2) NOT NULL
        CHECK (price >= 0),

    bedrooms INTEGER
        CHECK (bedrooms IS NULL OR bedrooms >= 0),

    bathrooms INTEGER
        CHECK (bathrooms IS NULL OR bathrooms >= 0),

    area NUMERIC(14,2)
        CHECK (area IS NULL OR area >= 0),

    address TEXT,

    city VARCHAR(120) NOT NULL,

    state VARCHAR(120),

    pincode VARCHAR(20),

    country VARCHAR(100) DEFAULT 'India',

    latitude NUMERIC(10,7),

    longitude NUMERIC(10,7),

    images JSONB NOT NULL DEFAULT '[]'::jsonb,

    status VARCHAR(40) NOT NULL DEFAULT 'pending'
        CHECK (
            status IN (
                'pending',
                'approved',
                'rejected',
                'sold',
                'rented',
                'inactive'
            )
        ),

    verified BOOLEAN NOT NULL DEFAULT FALSE,

    featured BOOLEAN NOT NULL DEFAULT FALSE,

    views INTEGER NOT NULL DEFAULT 0,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_properties_owner
ON properties(owner_id);

CREATE INDEX IF NOT EXISTS idx_properties_city
ON properties(city);

CREATE INDEX IF NOT EXISTS idx_properties_state
ON properties(state);

CREATE INDEX IF NOT EXISTS idx_properties_type
ON properties(property_type);

CREATE INDEX IF NOT EXISTS idx_properties_listing_type
ON properties(listing_type);

CREATE INDEX IF NOT EXISTS idx_properties_status
ON properties(status);

CREATE INDEX IF NOT EXISTS idx_properties_price
ON properties(price);

CREATE INDEX IF NOT EXISTS idx_properties_created
ON properties(created_at DESC);


-- ============================================================
-- ENQUIRIES
-- ============================================================

CREATE TABLE IF NOT EXISTS enquiries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    user_id UUID
        REFERENCES users(id)
        ON DELETE SET NULL,

    property_id UUID
        REFERENCES properties(id)
        ON DELETE CASCADE,

    message TEXT NOT NULL,

    phone VARCHAR(30),

    status VARCHAR(40) NOT NULL DEFAULT 'new'
        CHECK (
            status IN (
                'new',
                'contacted',
                'in_progress',
                'resolved',
                'closed',
                'cancelled'
            )
        ),

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_enquiries_user
ON enquiries(user_id);

CREATE INDEX IF NOT EXISTS idx_enquiries_property
ON enquiries(property_id);

CREATE INDEX IF NOT EXISTS idx_enquiries_status
ON enquiries(status);

CREATE INDEX IF NOT EXISTS idx_enquiries_created
ON enquiries(created_at DESC);


-- ============================================================
-- BOOKINGS / PROPERTY VISITS
-- ============================================================

CREATE TABLE IF NOT EXISTS bookings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    property_id UUID NOT NULL
        REFERENCES properties(id)
        ON DELETE CASCADE,

    user_id UUID NOT NULL
        REFERENCES users(id)
        ON DELETE CASCADE,

    visit_date TIMESTAMPTZ NOT NULL,

    notes TEXT,

    status VARCHAR(40) NOT NULL DEFAULT 'pending'
        CHECK (
            status IN (
                'pending',
                'confirmed',
                'completed',
                'cancelled',
                'rescheduled'
            )
        ),

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_bookings_user
ON bookings(user_id);

CREATE INDEX IF NOT EXISTS idx_bookings_property
ON bookings(property_id);

CREATE INDEX IF NOT EXISTS idx_bookings_date
ON bookings(visit_date);

CREATE INDEX IF NOT EXISTS idx_bookings_status
ON bookings(status);


-- ============================================================
-- PAYMENTS
-- ============================================================

CREATE TABLE IF NOT EXISTS payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    user_id UUID
        REFERENCES users(id)
        ON DELETE SET NULL,

    property_id UUID
        REFERENCES properties(id)
        ON DELETE SET NULL,

    amount NUMERIC(16,2) NOT NULL
        CHECK (amount >= 0),

    currency VARCHAR(10) NOT NULL DEFAULT 'INR',

    purpose VARCHAR(100) NOT NULL,

    provider VARCHAR(50),

    reference VARCHAR(255),

    transaction_id VARCHAR(255),

    status VARCHAR(40) NOT NULL DEFAULT 'pending'
        CHECK (
            status IN (
                'pending',
                'processing',
                'successful',
                'failed',
                'refunded',
                'cancelled'
            )
        ),

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_payments_user
ON payments(user_id);

CREATE INDEX IF NOT EXISTS idx_payments_property
ON payments(property_id);

CREATE INDEX IF NOT EXISTS idx_payments_status
ON payments(status);

CREATE INDEX IF NOT EXISTS idx_payments_transaction
ON payments(transaction_id);


-- ============================================================
-- DOCUMENTS
-- ============================================================

CREATE TABLE IF NOT EXISTS documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    user_id UUID NOT NULL
        REFERENCES users(id)
        ON DELETE CASCADE,

    name VARCHAR(255) NOT NULL,

    file_url TEXT NOT NULL,

    document_type VARCHAR(100) NOT NULL,

    status VARCHAR(40) NOT NULL DEFAULT 'submitted'
        CHECK (
            status IN (
                'submitted',
                'under_review',
                'verified',
                'rejected'
            )
        ),

    rejection_reason TEXT,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_documents_user
ON documents(user_id);

CREATE INDEX IF NOT EXISTS idx_documents_type
ON documents(document_type);

CREATE INDEX IF NOT EXISTS idx_documents_status
ON documents(status);


-- ============================================================
-- NOTIFICATIONS
-- ============================================================

CREATE TABLE IF NOT EXISTS notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    user_id UUID NOT NULL
        REFERENCES users(id)
        ON DELETE CASCADE,

    title VARCHAR(255) NOT NULL,

    message TEXT NOT NULL,

    type VARCHAR(50) DEFAULT 'general',

    is_read BOOLEAN NOT NULL DEFAULT FALSE,

    action_url TEXT,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_notifications_user
ON notifications(user_id);

CREATE INDEX IF NOT EXISTS idx_notifications_read
ON notifications(is_read);

CREATE INDEX IF NOT EXISTS idx_notifications_created
ON notifications(created_at DESC);


-- ============================================================
-- SAVED PROPERTIES
-- ============================================================

CREATE TABLE IF NOT EXISTS saved_properties (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    user_id UUID NOT NULL
        REFERENCES users(id)
        ON DELETE CASCADE,

    property_id UUID NOT NULL
        REFERENCES properties(id)
        ON DELETE CASCADE,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    UNIQUE(user_id, property_id)
);

CREATE INDEX IF NOT EXISTS idx_saved_properties_user
ON saved_properties(user_id);

CREATE INDEX IF NOT EXISTS idx_saved_properties_property
ON saved_properties(property_id);


-- ============================================================
-- PROPERTY REVIEWS
-- ============================================================

CREATE TABLE IF NOT EXISTS property_reviews (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    property_id UUID NOT NULL
        REFERENCES properties(id)
        ON DELETE CASCADE,

    user_id UUID NOT NULL
        REFERENCES users(id)
        ON DELETE CASCADE,

    rating INTEGER NOT NULL
        CHECK (rating BETWEEN 1 AND 5),

    review TEXT,

    status VARCHAR(30) NOT NULL DEFAULT 'published'
        CHECK (
            status IN (
                'pending',
                'published',
                'hidden'
            )
        ),

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    UNIQUE(property_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_reviews_property
ON property_reviews(property_id);

CREATE INDEX IF NOT EXISTS idx_reviews_user
ON property_reviews(user_id);


-- ============================================================
-- CONTACT / SUPPORT TICKETS
-- ============================================================

CREATE TABLE IF NOT EXISTS support_tickets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    user_id UUID
        REFERENCES users(id)
        ON DELETE SET NULL,

    subject VARCHAR(255) NOT NULL,

    message TEXT NOT NULL,

    status VARCHAR(40) NOT NULL DEFAULT 'open'
        CHECK (
            status IN (
                'open',
                'in_progress',
                'resolved',
                'closed'
            )
        ),

    priority VARCHAR(30) NOT NULL DEFAULT 'normal'
        CHECK (
            priority IN (
                'low',
                'normal',
                'high',
                'urgent'
            )
        ),

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_support_user
ON support_tickets(user_id);

CREATE INDEX IF NOT EXISTS idx_support_status
ON support_tickets(status);


-- ============================================================
-- AUDIT LOGS
-- ============================================================

CREATE TABLE IF NOT EXISTS audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    user_id UUID
        REFERENCES users(id)
        ON DELETE SET NULL,

    action VARCHAR(100) NOT NULL,

    entity_type VARCHAR(100),

    entity_id UUID,

    ip_address INET,

    user_agent TEXT,

    metadata JSONB DEFAULT '{}'::jsonb,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_audit_user
ON audit_logs(user_id);

CREATE INDEX IF NOT EXISTS idx_audit_action
ON audit_logs(action);

CREATE INDEX IF NOT EXISTS idx_audit_created
ON audit_logs(created_at DESC);


-- ============================================================
-- UPDATED_AT TRIGGER
-- ============================================================

CREATE OR REPLACE FUNCTION ghar_set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;


DROP TRIGGER IF EXISTS trg_users_updated_at
ON users;

CREATE TRIGGER trg_users_updated_at
BEFORE UPDATE ON users
FOR EACH ROW
EXECUTE FUNCTION ghar_set_updated_at();


DROP TRIGGER IF EXISTS trg_properties_updated_at
ON properties;

CREATE TRIGGER trg_properties_updated_at
BEFORE UPDATE ON properties
FOR EACH ROW
EXECUTE FUNCTION ghar_set_updated_at();


DROP TRIGGER IF EXISTS trg_enquiries_updated_at
ON enquiries;

CREATE TRIGGER trg_enquiries_updated_at
BEFORE UPDATE ON enquiries
FOR EACH ROW
EXECUTE FUNCTION ghar_set_updated_at();


DROP TRIGGER IF EXISTS trg_bookings_updated_at
ON bookings;

CREATE TRIGGER trg_bookings_updated_at
BEFORE UPDATE ON bookings
FOR EACH ROW
EXECUTE FUNCTION ghar_set_updated_at();


DROP TRIGGER IF EXISTS trg_payments_updated_at
ON payments;

CREATE TRIGGER trg_payments_updated_at
BEFORE UPDATE ON payments
FOR EACH ROW
EXECUTE FUNCTION ghar_set_updated_at();


DROP TRIGGER IF EXISTS trg_documents_updated_at
ON documents;

CREATE TRIGGER trg_documents_updated_at
BEFORE UPDATE ON documents
FOR EACH ROW
EXECUTE FUNCTION ghar_set_updated_at();


DROP TRIGGER IF EXISTS trg_support_updated_at
ON support_tickets;

CREATE TRIGGER trg_support_updated_at
BEFORE UPDATE ON support_tickets
FOR EACH ROW
EXECUTE FUNCTION ghar_set_updated_at();


DROP TRIGGER IF EXISTS trg_reviews_updated_at
ON property_reviews;

CREATE TRIGGER trg_reviews_updated_at
BEFORE UPDATE ON property_reviews
FOR EACH ROW
EXECUTE FUNCTION ghar_set_updated_at();


-- ============================================================
-- OPTIONAL PERFORMANCE INDEXES
-- ============================================================

CREATE INDEX IF NOT EXISTS idx_properties_city_price
ON properties(city, price);

CREATE INDEX IF NOT EXISTS idx_properties_search
ON properties(property_type, listing_type, city, status);

CREATE INDEX IF NOT EXISTS idx_properties_verified
ON properties(verified);

CREATE INDEX IF NOT EXISTS idx_properties_featured
ON properties(featured);


-- ============================================================
-- GHAR DATABASE READY
-- ============================================================