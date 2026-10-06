-- ============================================================
-- GHAR - DATABASE SCHEMA
-- PostgreSQL
-- ============================================================

BEGIN;

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================
-- ENUM TYPES
-- ============================================================

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_type WHERE typname = 'user_role'
    ) THEN
        CREATE TYPE user_role AS ENUM (
            'buyer',
            'seller',
            'agent',
            'tenant',
            'landlord',
            'admin',
            'super_admin'
        );
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_type WHERE typname = 'property_listing_type'
    ) THEN
        CREATE TYPE property_listing_type AS ENUM (
            'sale',
            'rent',
            'lease'
        );
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_type WHERE typname = 'property_status'
    ) THEN
        CREATE TYPE property_status AS ENUM (
            'draft',
            'pending',
            'active',
            'under_offer',
            'sold',
            'rented',
            'leased',
            'inactive',
            'rejected'
        );
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_type WHERE typname = 'visit_status'
    ) THEN
        CREATE TYPE visit_status AS ENUM (
            'requested',
            'confirmed',
            'rescheduled',
            'completed',
            'cancelled',
            'no_show'
        );
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_type WHERE typname = 'offer_status'
    ) THEN
        CREATE TYPE offer_status AS ENUM (
            'pending',
            'accepted',
            'rejected',
            'countered',
            'withdrawn',
            'expired'
        );
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_type WHERE typname = 'application_status'
    ) THEN
        CREATE TYPE application_status AS ENUM (
            'draft',
            'submitted',
            'under_review',
            'approved',
            'rejected',
            'cancelled',
            'completed'
        );
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_type WHERE typname = 'document_status'
    ) THEN
        CREATE TYPE document_status AS ENUM (
            'uploaded',
            'pending',
            'verified',
            'rejected',
            'expired'
        );
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_type WHERE typname = 'verification_status'
    ) THEN
        CREATE TYPE verification_status AS ENUM (
            'pending',
            'in_progress',
            'verified',
            'rejected',
            'expired'
        );
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_type WHERE typname = 'loan_status'
    ) THEN
        CREATE TYPE loan_status AS ENUM (
            'draft',
            'submitted',
            'under_review',
            'approved',
            'rejected',
            'disbursed',
            'closed'
        );
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_type WHERE typname = 'payment_status'
    ) THEN
        CREATE TYPE payment_status AS ENUM (
            'pending',
            'processing',
            'paid',
            'failed',
            'refunded',
            'cancelled'
        );
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_type WHERE typname = 'subscription_status'
    ) THEN
        CREATE TYPE subscription_status AS ENUM (
            'trial',
            'active',
            'past_due',
            'cancelled',
            'expired'
        );
    END IF;
END
$$;


-- ============================================================
-- USERS
-- ============================================================

CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    email VARCHAR(255) UNIQUE,
    phone VARCHAR(30) UNIQUE,

    password_hash TEXT,

    first_name VARCHAR(100),
    last_name VARCHAR(100),

    role user_role NOT NULL DEFAULT 'buyer',

    avatar_url TEXT,

    is_email_verified BOOLEAN NOT NULL DEFAULT FALSE,
    is_phone_verified BOOLEAN NOT NULL DEFAULT FALSE,
    is_identity_verified BOOLEAN NOT NULL DEFAULT FALSE,

    is_active BOOLEAN NOT NULL DEFAULT TRUE,

    last_login_at TIMESTAMPTZ,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);


-- ============================================================
-- USER PROFILES
-- ============================================================

CREATE TABLE IF NOT EXISTS user_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    user_id UUID NOT NULL UNIQUE
        REFERENCES users(id)
        ON DELETE CASCADE,

    date_of_birth DATE,

    gender VARCHAR(30),

    occupation VARCHAR(150),

    annual_income NUMERIC(15,2),

    bio TEXT,

    address_line1 TEXT,
    address_line2 TEXT,
    city VARCHAR(100),
    state VARCHAR(100),
    country VARCHAR(100) DEFAULT 'India',
    postal_code VARCHAR(20),

    latitude NUMERIC(10,7),
    longitude NUMERIC(10,7),

    preferences JSONB NOT NULL DEFAULT '{}'::jsonb,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);


-- ============================================================
-- PROPERTY CATEGORIES
-- ============================================================

CREATE TABLE IF NOT EXISTS property_categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    name VARCHAR(100) NOT NULL UNIQUE,

    description TEXT,

    is_active BOOLEAN NOT NULL DEFAULT TRUE,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);


-- ============================================================
-- PROPERTIES
-- ============================================================

CREATE TABLE IF NOT EXISTS properties (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    owner_id UUID NOT NULL
        REFERENCES users(id)
        ON DELETE RESTRICT,

    agent_id UUID
        REFERENCES users(id)
        ON DELETE SET NULL,

    category_id UUID
        REFERENCES property_categories(id)
        ON DELETE SET NULL,

    title VARCHAR(255) NOT NULL,

    description TEXT,

    listing_type property_listing_type NOT NULL,

    status property_status NOT NULL DEFAULT 'draft',

    property_type VARCHAR(100),

    bedrooms INTEGER,
    bathrooms INTEGER,

    built_up_area NUMERIC(14,2),
    carpet_area NUMERIC(14,2),
    plot_area NUMERIC(14,2),

    floor_number INTEGER,
    total_floors INTEGER,

    price NUMERIC(18,2),
    monthly_rent NUMERIC(18,2),
    security_deposit NUMERIC(18,2),

    maintenance_fee NUMERIC(18,2),

    address_line1 TEXT,
    address_line2 TEXT,

    locality VARCHAR(150),
    city VARCHAR(100),
    district VARCHAR(100),
    state VARCHAR(100),
    country VARCHAR(100) DEFAULT 'India',
    postal_code VARCHAR(20),

    latitude NUMERIC(10,7),
    longitude NUMERIC(10,7),

    amenities JSONB NOT NULL DEFAULT '[]'::jsonb,
    features JSONB NOT NULL DEFAULT '{}'::jsonb,

    furnishing_status VARCHAR(50),

    parking_spaces INTEGER DEFAULT 0,

    is_featured BOOLEAN NOT NULL DEFAULT FALSE,
    is_verified BOOLEAN NOT NULL DEFAULT FALSE,

    views_count INTEGER NOT NULL DEFAULT 0,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);


-- ============================================================
-- PROPERTY IMAGES
-- ============================================================

CREATE TABLE IF NOT EXISTS property_images (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    property_id UUID NOT NULL
        REFERENCES properties(id)
        ON DELETE CASCADE,

    image_url TEXT NOT NULL,

    thumbnail_url TEXT,

    alt_text TEXT,

    sort_order INTEGER NOT NULL DEFAULT 0,

    is_primary BOOLEAN NOT NULL DEFAULT FALSE,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);


-- ============================================================
-- PROPERTY DOCUMENTS
-- ============================================================

CREATE TABLE IF NOT EXISTS property_documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    property_id UUID NOT NULL
        REFERENCES properties(id)
        ON DELETE CASCADE,

    uploaded_by UUID
        REFERENCES users(id)
        ON DELETE SET NULL,

    document_type VARCHAR(100) NOT NULL,

    document_name VARCHAR(255),

    file_url TEXT NOT NULL,

    mime_type VARCHAR(100),

    file_size BIGINT,

    status document_status NOT NULL DEFAULT 'uploaded',

    verification_notes TEXT,

    verified_by UUID
        REFERENCES users(id)
        ON DELETE SET NULL,

    verified_at TIMESTAMPTZ,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);


-- ============================================================
-- FAVOURITES
-- ============================================================

CREATE TABLE IF NOT EXISTS favourites (
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


-- ============================================================
-- PROPERTY COMPARISONS
-- ============================================================

CREATE TABLE IF NOT EXISTS property_comparisons (
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


-- ============================================================
-- PROPERTY VISITS
-- ============================================================

CREATE TABLE IF NOT EXISTS visits (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    property_id UUID NOT NULL
        REFERENCES properties(id)
        ON DELETE CASCADE,

    visitor_id UUID NOT NULL
        REFERENCES users(id)
        ON DELETE CASCADE,

    owner_id UUID
        REFERENCES users(id)
        ON DELETE SET NULL,

    visit_date DATE NOT NULL,
    visit_time TIME NOT NULL,

    duration_minutes INTEGER NOT NULL DEFAULT 30,

    status visit_status NOT NULL DEFAULT 'requested',

    notes TEXT,

    cancellation_reason TEXT,

    feedback TEXT,

    rating INTEGER,

    confirmed_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    cancelled_at TIMESTAMPTZ,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT visits_rating_check
        CHECK (
            rating IS NULL
            OR rating BETWEEN 1 AND 5
        )
);


-- ============================================================
-- OFFERS
-- ============================================================

CREATE TABLE IF NOT EXISTS offers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    property_id UUID NOT NULL
        REFERENCES properties(id)
        ON DELETE CASCADE,

    buyer_id UUID NOT NULL
        REFERENCES users(id)
        ON DELETE CASCADE,

    seller_id UUID
        REFERENCES users(id)
        ON DELETE SET NULL,

    amount NUMERIC(18,2) NOT NULL,

    message TEXT,

    status offer_status NOT NULL DEFAULT 'pending',

    expires_at TIMESTAMPTZ,

    counter_amount NUMERIC(18,2),

    responded_at TIMESTAMPTZ,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT offers_amount_check
        CHECK (amount >= 0)
);


-- ============================================================
-- APPLICATIONS
-- ============================================================

CREATE TABLE IF NOT EXISTS applications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    applicant_id UUID NOT NULL
        REFERENCES users(id)
        ON DELETE CASCADE,

    property_id UUID
        REFERENCES properties(id)
        ON DELETE SET NULL,

    application_type VARCHAR(100),

    status application_status NOT NULL DEFAULT 'draft',

    application_data JSONB NOT NULL DEFAULT '{}'::jsonb,

    reviewed_by UUID
        REFERENCES users(id)
        ON DELETE SET NULL,

    review_notes TEXT,

    submitted_at TIMESTAMPTZ,
    approved_at TIMESTAMPTZ,
    rejected_at TIMESTAMPTZ,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);


-- ============================================================
-- APPLICATION FILES
-- ============================================================

CREATE TABLE IF NOT EXISTS application_files (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    application_id UUID NOT NULL
        REFERENCES applications(id)
        ON DELETE CASCADE,

    uploaded_by UUID
        REFERENCES users(id)
        ON DELETE SET NULL,

    document_type VARCHAR(100),

    file_name VARCHAR(255),

    file_url TEXT NOT NULL,

    mime_type VARCHAR(100),

    file_size BIGINT,

    status document_status NOT NULL DEFAULT 'uploaded',

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);


-- ============================================================
-- USER DOCUMENTS
-- ============================================================

CREATE TABLE IF NOT EXISTS documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    user_id UUID NOT NULL
        REFERENCES users(id)
        ON DELETE CASCADE,

    document_type VARCHAR(100) NOT NULL,

    document_number_encrypted TEXT,

    document_name VARCHAR(255),

    file_url TEXT,

    mime_type VARCHAR(100),

    file_size BIGINT,

    status document_status NOT NULL DEFAULT 'uploaded',

    rejection_reason TEXT,

    verified_by UUID
        REFERENCES users(id)
        ON DELETE SET NULL,

    verified_at TIMESTAMPTZ,

    expires_at DATE,

    metadata JSONB NOT NULL DEFAULT '{}'::jsonb,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);


-- ============================================================
-- VERIFICATIONS
-- ============================================================

CREATE TABLE IF NOT EXISTS verifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    user_id UUID NOT NULL
        REFERENCES users(id)
        ON DELETE CASCADE,

    verification_type VARCHAR(50) NOT NULL,

    status verification_status NOT NULL DEFAULT 'pending',

    provider VARCHAR(100),

    provider_reference TEXT,

    masked_identifier VARCHAR(100),

    verification_data JSONB NOT NULL DEFAULT '{}'::jsonb,

    rejection_reason TEXT,

    reviewed_by UUID
        REFERENCES users(id)
        ON DELETE SET NULL,

    verified_at TIMESTAMPTZ,

    expires_at TIMESTAMPTZ,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);


-- ============================================================
-- OTP VERIFICATIONS
-- ============================================================

CREATE TABLE IF NOT EXISTS verification_otps (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    user_id UUID
        REFERENCES users(id)
        ON DELETE CASCADE,

    type VARCHAR(20) NOT NULL,

    destination VARCHAR(255) NOT NULL,

    otp_hash TEXT NOT NULL,

    attempts INTEGER NOT NULL DEFAULT 0,

    expires_at TIMESTAMPTZ NOT NULL,

    verified_at TIMESTAMPTZ,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);


-- ============================================================
-- LOANS
-- ============================================================

CREATE TABLE IF NOT EXISTS loans (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    user_id UUID NOT NULL
        REFERENCES users(id)
        ON DELETE CASCADE,

    property_id UUID
        REFERENCES properties(id)
        ON DELETE SET NULL,

    application_id UUID
        REFERENCES applications(id)
        ON DELETE SET NULL,

    lender_name VARCHAR(255),

    loan_type VARCHAR(100),

    requested_amount NUMERIC(18,2) NOT NULL,

    approved_amount NUMERIC(18,2),

    interest_rate NUMERIC(8,4),

    tenure_months INTEGER,

    estimated_emi NUMERIC(18,2),

    status loan_status NOT NULL DEFAULT 'draft',

    credit_score INTEGER,

    loan_data JSONB NOT NULL DEFAULT '{}'::jsonb,

    submitted_at TIMESTAMPTZ,
    approved_at TIMESTAMPTZ,
    disbursed_at TIMESTAMPTZ,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);


-- ============================================================
-- PAYMENTS
-- ============================================================

CREATE TABLE IF NOT EXISTS payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    user_id UUID NOT NULL
        REFERENCES users(id)
        ON DELETE CASCADE,

    property_id UUID
        REFERENCES properties(id)
        ON DELETE SET NULL,

    application_id UUID
        REFERENCES applications(id)
        ON DELETE SET NULL,

    payment_type VARCHAR(100),

    amount NUMERIC(18,2) NOT NULL,

    currency VARCHAR(10) NOT NULL DEFAULT 'INR',

    gateway VARCHAR(100),

    gateway_payment_id VARCHAR(255),

    gateway_order_id VARCHAR(255),

    status payment_status NOT NULL DEFAULT 'pending',

    payment_data JSONB NOT NULL DEFAULT '{}'::jsonb,

    paid_at TIMESTAMPTZ,

    refunded_at TIMESTAMPTZ,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);


-- ============================================================
-- SUBSCRIPTIONS
-- ============================================================

CREATE TABLE IF NOT EXISTS subscriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    user_id UUID NOT NULL
        REFERENCES users(id)
        ON DELETE CASCADE,

    plan_name VARCHAR(100) NOT NULL,

    gateway VARCHAR(100),

    gateway_customer_id VARCHAR(255),

    gateway_subscription_id VARCHAR(255),

    amount NUMERIC(18,2),

    currency VARCHAR(10) NOT NULL DEFAULT 'INR',

    status subscription_status NOT NULL DEFAULT 'active',

    started_at TIMESTAMPTZ,

    current_period_start TIMESTAMPTZ,

    current_period_end TIMESTAMPTZ,

    cancelled_at TIMESTAMPTZ,

    metadata JSONB NOT NULL DEFAULT '{}'::jsonb,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);


-- ============================================================
-- MESSAGES
-- ============================================================

CREATE TABLE IF NOT EXISTS conversations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    property_id UUID
        REFERENCES properties(id)
        ON DELETE SET NULL,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);


CREATE TABLE IF NOT EXISTS conversation_participants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    conversation_id UUID NOT NULL
        REFERENCES conversations(id)
        ON DELETE CASCADE,

    user_id UUID NOT NULL
        REFERENCES users(id)
        ON DELETE CASCADE,

    joined_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    UNIQUE(conversation_id, user_id)
);


CREATE TABLE IF NOT EXISTS messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    conversation_id UUID NOT NULL
        REFERENCES conversations(id)
        ON DELETE CASCADE,

    sender_id UUID NOT NULL
        REFERENCES users(id)
        ON DELETE CASCADE,

    message TEXT NOT NULL,

    attachment_url TEXT,

    attachment_type VARCHAR(100),

    is_read BOOLEAN NOT NULL DEFAULT FALSE,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);


-- ============================================================
-- REFERRALS
-- ============================================================

CREATE TABLE IF NOT EXISTS referrals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    referrer_id UUID NOT NULL
        REFERENCES users(id)
        ON DELETE CASCADE,

    referred_user_id UUID
        REFERENCES users(id)
        ON DELETE SET NULL,

    referral_code VARCHAR(50) NOT NULL UNIQUE,

    status VARCHAR(50) NOT NULL DEFAULT 'pending',

    reward_amount NUMERIC(18,2) DEFAULT 0,

    reward_paid BOOLEAN NOT NULL DEFAULT FALSE,

    metadata JSONB NOT NULL DEFAULT '{}'::jsonb,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);


-- ============================================================
-- SUPPORT TICKETS
-- ============================================================

CREATE TABLE IF NOT EXISTS support_tickets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    user_id UUID NOT NULL
        REFERENCES users(id)
        ON DELETE CASCADE,

    subject VARCHAR(255) NOT NULL,

    description TEXT NOT NULL,

    category VARCHAR(100),

    priority VARCHAR(30) NOT NULL DEFAULT 'normal',

    status VARCHAR(50) NOT NULL DEFAULT 'open',

    assigned_to UUID
        REFERENCES users(id)
        ON DELETE SET NULL,

    closed_at TIMESTAMPTZ,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);


-- ============================================================
-- SUPPORT MESSAGES
-- ============================================================

CREATE TABLE IF NOT EXISTS support_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    ticket_id UUID NOT NULL
        REFERENCES support_tickets(id)
        ON DELETE CASCADE,

    sender_id UUID NOT NULL
        REFERENCES users(id)
        ON DELETE CASCADE,

    message TEXT NOT NULL,

    attachment_url TEXT,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);


-- ============================================================
-- MARKETPLACE
-- ============================================================

CREATE TABLE IF NOT EXISTS marketplace_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    seller_id UUID NOT NULL
        REFERENCES users(id)
        ON DELETE CASCADE,

    title VARCHAR(255) NOT NULL,

    description TEXT,

    category VARCHAR(100),

    price NUMERIC(18,2),

    condition VARCHAR(50),

    location VARCHAR(255),

    images JSONB NOT NULL DEFAULT '[]'::jsonb,

    status VARCHAR(50) NOT NULL DEFAULT 'active',

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);


-- ============================================================
-- SERVICES
-- ============================================================

CREATE TABLE IF NOT EXISTS services (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    name VARCHAR(255) NOT NULL,

    category VARCHAR(100),

    description TEXT,

    provider_name VARCHAR(255),

    phone VARCHAR(30),

    email VARCHAR(255),

    website TEXT,

    price_from NUMERIC(18,2),

    location VARCHAR(255),

    metadata JSONB NOT NULL DEFAULT '{}'::jsonb,

    is_active BOOLEAN NOT NULL DEFAULT TRUE,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);


-- ============================================================
-- SEARCH HISTORY
-- ============================================================

CREATE TABLE IF NOT EXISTS search_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    user_id UUID
        REFERENCES users(id)
        ON DELETE CASCADE,

    query TEXT,

    filters JSONB NOT NULL DEFAULT '{}'::jsonb,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);


-- ============================================================
-- AI CONVERSATIONS
-- ============================================================

CREATE TABLE IF NOT EXISTS ai_conversations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    user_id UUID
        REFERENCES users(id)
        ON DELETE CASCADE,

    title VARCHAR(255),

    context JSONB NOT NULL DEFAULT '{}'::jsonb,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);


CREATE TABLE IF NOT EXISTS ai_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    conversation_id UUID NOT NULL
        REFERENCES ai_conversations(id)
        ON DELETE CASCADE,

    role VARCHAR(30) NOT NULL,

    content TEXT NOT NULL,

    metadata JSONB NOT NULL DEFAULT '{}'::jsonb,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);


-- ============================================================
-- NOTIFICATIONS
-- ============================================================

CREATE TABLE IF NOT EXISTS notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    user_id UUID NOT NULL
        REFERENCES users(id)
        ON DELETE CASCADE,

    type VARCHAR(100),

    title VARCHAR(255) NOT NULL,

    message TEXT NOT NULL,

    data JSONB NOT NULL DEFAULT '{}'::jsonb,

    is_read BOOLEAN NOT NULL DEFAULT FALSE,

    read_at TIMESTAMPTZ,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);


-- ============================================================
-- AUDIT LOGS
-- ============================================================

CREATE TABLE IF NOT EXISTS audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    user_id UUID
        REFERENCES users(id)
        ON DELETE SET NULL,

    action VARCHAR(255) NOT NULL,

    resource VARCHAR(100),

    resource_id UUID,

    metadata JSONB NOT NULL DEFAULT '{}'::jsonb,

    ip_address INET,

    user_agent TEXT,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);


-- ============================================================
-- LOGIN / SECURITY SESSIONS
-- ============================================================

CREATE TABLE IF NOT EXISTS sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    user_id UUID NOT NULL
        REFERENCES users(id)
        ON DELETE CASCADE,

    refresh_token_hash TEXT,

    ip_address INET,

    user_agent TEXT,

    expires_at TIMESTAMPTZ NOT NULL,

    revoked_at TIMESTAMPTZ,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);


-- ============================================================
-- ADMIN AI ACTIONS
-- ============================================================

CREATE TABLE IF NOT EXISTS admin_ai_actions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    admin_id UUID NOT NULL
        REFERENCES users(id)
        ON DELETE CASCADE,

    action_type VARCHAR(100) NOT NULL,

    prompt TEXT,

    response TEXT,

    metadata JSONB NOT NULL DEFAULT '{}'::jsonb,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);


-- ============================================================
-- INDEXES
-- ============================================================

CREATE INDEX IF NOT EXISTS idx_users_role
    ON users(role);

CREATE INDEX IF NOT EXISTS idx_users_active
    ON users(is_active);

CREATE INDEX IF NOT EXISTS idx_properties_owner
    ON properties(owner_id);

CREATE INDEX IF NOT EXISTS idx_properties_agent
    ON properties(agent_id);

CREATE INDEX IF NOT EXISTS idx_properties_status
    ON properties(status);

CREATE INDEX IF NOT EXISTS idx_properties_listing_type
    ON properties(listing_type);

CREATE INDEX IF NOT EXISTS idx_properties_city
    ON properties(city);

CREATE INDEX IF NOT EXISTS idx_properties_state
    ON properties(state);

CREATE INDEX IF NOT EXISTS idx_properties_postal_code
    ON properties(postal_code);

CREATE INDEX IF NOT EXISTS idx_properties_price
    ON properties(price);

CREATE INDEX IF NOT EXISTS idx_properties_location
    ON properties(latitude, longitude);

CREATE INDEX IF NOT EXISTS idx_property_images_property
    ON property_images(property_id);

CREATE INDEX IF NOT EXISTS idx_property_documents_property
    ON property_documents(property_id);

CREATE INDEX IF NOT EXISTS idx_favourites_user
    ON favourites(user_id);

CREATE INDEX IF NOT EXISTS idx_favourites_property
    ON favourites(property_id);

CREATE INDEX IF NOT EXISTS idx_visits_property
    ON visits(property_id);

CREATE INDEX IF NOT EXISTS idx_visits_visitor
    ON visits(visitor_id);

CREATE INDEX IF NOT EXISTS idx_visits_date
    ON visits(visit_date);

CREATE INDEX IF NOT EXISTS idx_visits_status
    ON visits(status);

CREATE INDEX IF NOT EXISTS idx_offers_property
    ON offers(property_id);

CREATE INDEX IF NOT EXISTS idx_offers_buyer
    ON offers(buyer_id);

CREATE INDEX IF NOT EXISTS idx_offers_status
    ON offers(status);

CREATE INDEX IF NOT EXISTS idx_applications_user
    ON applications(applicant_id);

CREATE INDEX IF NOT EXISTS idx_applications_property
    ON applications(property_id);

CREATE INDEX IF NOT EXISTS idx_applications_status
    ON applications(status);

CREATE INDEX IF NOT EXISTS idx_documents_user
    ON documents(user_id);

CREATE INDEX IF NOT EXISTS idx_documents_status
    ON documents(status);

CREATE INDEX IF NOT EXISTS idx_verifications_user
    ON verifications(user_id);

CREATE INDEX IF NOT EXISTS idx_verifications_status
    ON verifications(status);

CREATE INDEX IF NOT EXISTS idx_loans_user
    ON loans(user_id);

CREATE INDEX IF NOT EXISTS idx_loans_status
    ON loans(status);

CREATE INDEX IF NOT EXISTS idx_payments_user
    ON payments(user_id);

CREATE INDEX IF NOT EXISTS idx_payments_status
    ON payments(status);

CREATE INDEX IF NOT EXISTS idx_subscriptions_user
    ON subscriptions(user_id);

CREATE INDEX IF NOT EXISTS idx_subscriptions_status
    ON subscriptions(status);

CREATE INDEX IF NOT EXISTS idx_messages_conversation
    ON messages(conversation_id);

CREATE INDEX IF NOT EXISTS idx_messages_sender
    ON messages(sender_id);

CREATE INDEX IF NOT EXISTS idx_notifications_user
    ON notifications(user_id);

CREATE INDEX IF NOT EXISTS idx_notifications_unread
    ON notifications(user_id, is_read);

CREATE INDEX IF NOT EXISTS idx_audit_logs_user
    ON audit_logs(user_id);

CREATE INDEX IF NOT EXISTS idx_audit_logs_action
    ON audit_logs(action);

CREATE INDEX IF NOT EXISTS idx_audit_logs_created
    ON audit_logs(created_at);


-- ============================================================
-- UPDATED_AT FUNCTION
-- ============================================================

CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;


-- ============================================================
-- UPDATED_AT TRIGGERS
-- ============================================================

DROP TRIGGER IF EXISTS trg_users_updated_at
ON users;

CREATE TRIGGER trg_users_updated_at
BEFORE UPDATE ON users
FOR EACH ROW
EXECUTE FUNCTION set_updated_at();


DROP TRIGGER IF EXISTS trg_user_profiles_updated_at
ON user_profiles;

CREATE TRIGGER trg_user_profiles_updated_at
BEFORE UPDATE ON user_profiles
FOR EACH ROW
EXECUTE FUNCTION set_updated_at();


DROP TRIGGER IF EXISTS trg_properties_updated_at
ON properties;

CREATE TRIGGER trg_properties_updated_at
BEFORE UPDATE ON properties
FOR EACH ROW
EXECUTE FUNCTION set_updated_at();


DROP TRIGGER IF EXISTS trg_property_documents_updated_at
ON property_documents;

CREATE TRIGGER trg_property_documents_updated_at
BEFORE UPDATE ON property_documents
FOR EACH ROW
EXECUTE FUNCTION set_updated_at();


DROP TRIGGER IF EXISTS trg_offers_updated_at
ON offers;

CREATE TRIGGER trg_offers_updated_at
BEFORE UPDATE ON offers
FOR EACH ROW
EXECUTE FUNCTION set_updated_at();


DROP TRIGGER IF EXISTS trg_applications_updated_at
ON applications;

CREATE TRIGGER trg_applications_updated_at
BEFORE UPDATE ON applications
FOR EACH ROW
EXECUTE FUNCTION set_updated_at();


DROP TRIGGER IF EXISTS trg_documents_updated_at
ON documents;

CREATE TRIGGER trg_documents_updated_at
BEFORE UPDATE ON documents
FOR EACH ROW
EXECUTE FUNCTION set_updated_at();


DROP TRIGGER IF EXISTS trg_verifications_updated_at
ON verifications;

CREATE TRIGGER trg_verifications_updated_at
BEFORE UPDATE ON verifications
FOR EACH ROW
EXECUTE FUNCTION set_updated_at();


DROP TRIGGER IF EXISTS trg_loans_updated_at
ON loans;

CREATE TRIGGER trg_loans_updated_at
BEFORE UPDATE ON loans
FOR EACH ROW
EXECUTE FUNCTION set_updated_at();


DROP TRIGGER IF EXISTS trg_payments_updated_at
ON payments;

CREATE TRIGGER trg_payments_updated_at
BEFORE UPDATE ON payments
FOR EACH ROW
EXECUTE FUNCTION set_updated_at();


DROP TRIGGER IF EXISTS trg_subscriptions_updated_at
ON subscriptions;

CREATE TRIGGER trg_subscriptions_updated_at
BEFORE UPDATE ON subscriptions
FOR EACH ROW
EXECUTE FUNCTION set_updated_at();


DROP TRIGGER IF EXISTS trg_conversations_updated_at
ON conversations;

CREATE TRIGGER trg_conversations_updated_at
BEFORE UPDATE ON conversations
FOR EACH ROW
EXECUTE FUNCTION set_updated_at();


DROP TRIGGER IF EXISTS trg_referrals_updated_at
ON referrals;

CREATE TRIGGER trg_referrals_updated_at
BEFORE UPDATE ON referrals
FOR EACH ROW
EXECUTE FUNCTION set_updated_at();


DROP TRIGGER IF EXISTS trg_support_tickets_updated_at
ON support_tickets;

CREATE TRIGGER trg_support_tickets_updated_at
BEFORE UPDATE ON support_tickets
FOR EACH ROW
EXECUTE FUNCTION set_updated_at();


DROP TRIGGER IF EXISTS trg_marketplace_items_updated_at
ON marketplace_items;

CREATE TRIGGER trg_marketplace_items_updated_at
BEFORE UPDATE ON marketplace_items
FOR EACH ROW
EXECUTE FUNCTION set_updated_at();


DROP TRIGGER IF EXISTS trg_services_updated_at
ON services;

CREATE TRIGGER trg_services_updated_at
BEFORE UPDATE ON services
FOR EACH ROW
EXECUTE FUNCTION set_updated_at();


DROP TRIGGER IF EXISTS trg_ai_conversations_updated_at
ON ai_conversations;

CREATE TRIGGER trg_ai_conversations_updated_at
BEFORE UPDATE ON ai_conversations
FOR EACH ROW
EXECUTE FUNCTION set_updated_at();


-- ============================================================
-- DEFAULT PROPERTY CATEGORIES
-- ============================================================

INSERT INTO property_categories
    (name, description)
VALUES
    ('Apartment', 'Residential apartments and flats'),
    ('Villa', 'Independent villas and houses'),
    ('House', 'Independent residential houses'),
    ('Plot', 'Residential and commercial plots'),
    ('Commercial', 'Commercial properties'),
    ('Office', 'Office spaces'),
    ('Shop', 'Retail and shop properties'),
    ('Land', 'Agricultural and other land'),
    ('Warehouse', 'Warehouse and industrial properties')
ON CONFLICT (name) DO NOTHING;


-- ============================================================
-- END
-- ============================================================

COMMIT;