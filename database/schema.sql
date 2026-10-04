-- ============================================================
-- GHAR - REAL ESTATE PLATFORM
-- PostgreSQL Database Schema
-- ============================================================
--
-- Architecture:
--
-- users
--   ├── profiles
--   ├── properties
--   ├── visits
--   ├── offers
--   ├── applications
--   ├── documents
--   ├── payments
--   ├── subscriptions
--   ├── loans
--   ├── referrals
--   ├── notifications
--   ├── messages
--   └── support
--
-- ADMIN
--   ├── admin_users
--   ├── audit_logs
--   ├── system_settings
--   └── admin_actions
--
-- AI
--   ├── ai_conversations
--   ├── ai_messages
--   ├── ai_usage
--   ├── ai_prompts
--   └── ai_logs
--
-- ============================================================

BEGIN;

-- ============================================================
-- EXTENSIONS
-- ============================================================

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE EXTENSION IF NOT EXISTS "citext";

CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- ============================================================
-- ENUM TYPES
-- ============================================================

DO $$
BEGIN

    IF NOT EXISTS (
        SELECT 1 FROM pg_type WHERE typname = 'user_status'
    ) THEN
        CREATE TYPE user_status AS ENUM (
            'pending',
            'active',
            'suspended',
            'blocked',
            'deleted'
        );
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_type WHERE typname = 'user_role'
    ) THEN
        CREATE TYPE user_role AS ENUM (
            'buyer',
            'seller',
            'tenant',
            'landlord',
            'agent',
            'builder',
            'investor',
            'business',
            'admin',
            'super_admin'
        );
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_type WHERE typname = 'property_status'
    ) THEN
        CREATE TYPE property_status AS ENUM (
            'draft',
            'pending',
            'under_review',
            'approved',
            'rejected',
            'published',
            'sold',
            'rented',
            'leased',
            'expired',
            'archived'
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
        SELECT 1 FROM pg_type WHERE typname = 'property_type'
    ) THEN
        CREATE TYPE property_type AS ENUM (
            'apartment',
            'villa',
            'house',
            'plot',
            'land',
            'office',
            'shop',
            'warehouse',
            'commercial',
            'farmhouse',
            'studio',
            'penthouse',
            'builder_floor',
            'other'
        );
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_type WHERE typname = 'verification_status'
    ) THEN
        CREATE TYPE verification_status AS ENUM (
            'not_started',
            'pending',
            'in_progress',
            'verified',
            'rejected',
            'expired'
        );
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_type WHERE typname = 'document_status'
    ) THEN
        CREATE TYPE document_status AS ENUM (
            'uploaded',
            'pending',
            'under_review',
            'verified',
            'rejected',
            'expired',
            'deleted'
        );
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_type WHERE typname = 'payment_status'
    ) THEN
        CREATE TYPE payment_status AS ENUM (
            'created',
            'pending',
            'authorized',
            'captured',
            'failed',
            'refunded',
            'partially_refunded',
            'cancelled'
        );
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_type WHERE typname = 'subscription_status'
    ) THEN
        CREATE TYPE subscription_status AS ENUM (
            'created',
            'active',
            'paused',
            'past_due',
            'cancelled',
            'expired',
            'completed'
        );
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_type WHERE typname = 'application_status'
    ) THEN
        CREATE TYPE application_status AS ENUM (
            'draft',
            'submitted',
            'under_review',
            'documents_required',
            'approved',
            'rejected',
            'cancelled',
            'completed'
        );
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_type WHERE typname = 'offer_status'
    ) THEN
        CREATE TYPE offer_status AS ENUM (
            'draft',
            'submitted',
            'countered',
            'accepted',
            'rejected',
            'withdrawn',
            'expired',
            'cancelled'
        );
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_type WHERE typname = 'visit_status'
    ) THEN
        CREATE TYPE visit_status AS ENUM (
            'requested',
            'scheduled',
            'confirmed',
            'completed',
            'cancelled',
            'rescheduled',
            'no_show'
        );
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_type WHERE typname = 'loan_status'
    ) THEN
        CREATE TYPE loan_status AS ENUM (
            'draft',
            'submitted',
            'documents_required',
            'under_review',
            'approved',
            'rejected',
            'disbursed',
            'closed',
            'cancelled'
        );
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_type WHERE typname = 'message_status'
    ) THEN
        CREATE TYPE message_status AS ENUM (
            'sent',
            'delivered',
            'read',
            'deleted'
        );
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_type WHERE typname = 'support_status'
    ) THEN
        CREATE TYPE support_status AS ENUM (
            'open',
            'in_progress',
            'waiting_user',
            'resolved',
            'closed'
        );
    END IF;

END $$;

-- ============================================================
-- COMMON UPDATED_AT TRIGGER
-- ============================================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$;

-- ============================================================
-- USERS
-- ============================================================

CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    email CITEXT UNIQUE NOT NULL,

    phone VARCHAR(30) UNIQUE,

    password_hash TEXT,

    first_name VARCHAR(100),

    last_name VARCHAR(100),

    display_name VARCHAR(200),

    role user_role NOT NULL DEFAULT 'buyer',

    status user_status NOT NULL DEFAULT 'pending',

    email_verified BOOLEAN NOT NULL DEFAULT FALSE,

    phone_verified BOOLEAN NOT NULL DEFAULT FALSE,

    avatar_url TEXT,

    date_of_birth DATE,

    gender VARCHAR(30),

    nationality VARCHAR(100),

    preferred_language VARCHAR(20) DEFAULT 'en',

    timezone VARCHAR(100) DEFAULT 'Asia/Kolkata',

    last_login_at TIMESTAMPTZ,

    last_login_ip INET,

    login_attempts INTEGER NOT NULL DEFAULT 0,

    locked_until TIMESTAMPTZ,

    metadata JSONB NOT NULL DEFAULT '{}'::jsonb,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    deleted_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_users_email
ON users(email);

CREATE INDEX IF NOT EXISTS idx_users_phone
ON users(phone);

CREATE INDEX IF NOT EXISTS idx_users_role
ON users(role);

CREATE INDEX IF NOT EXISTS idx_users_status
ON users(status);

-- ============================================================
-- USER PROFILES
-- ============================================================

CREATE TABLE IF NOT EXISTS user_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    user_id UUID NOT NULL UNIQUE
        REFERENCES users(id)
        ON DELETE CASCADE,

    bio TEXT,

    address_line1 TEXT,

    address_line2 TEXT,

    city VARCHAR(100),

    state VARCHAR(100),

    country VARCHAR(100) DEFAULT 'India',

    postal_code VARCHAR(20),

    occupation VARCHAR(150),

    company_name VARCHAR(200),

    annual_income NUMERIC(15,2),

    pan_number VARCHAR(20),

    aadhaar_last4 VARCHAR(4),

    preferred_property_type property_type,

    preferred_listing_type property_listing_type,

    preferred_city VARCHAR(100),

    preferred_locality VARCHAR(150),

    min_budget NUMERIC(15,2),

    max_budget NUMERIC(15,2),

    profile_completion INTEGER DEFAULT 0,

    metadata JSONB NOT NULL DEFAULT '{}'::jsonb,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- USER SESSIONS
-- ============================================================

CREATE TABLE IF NOT EXISTS user_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    user_id UUID NOT NULL
        REFERENCES users(id)
        ON DELETE CASCADE,

    token_hash TEXT UNIQUE NOT NULL,

    refresh_token_hash TEXT UNIQUE,

    ip_address INET,

    user_agent TEXT,

    device_id VARCHAR(255),

    expires_at TIMESTAMPTZ NOT NULL,

    revoked_at TIMESTAMPTZ,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_user_sessions_user
ON user_sessions(user_id);

CREATE INDEX IF NOT EXISTS idx_user_sessions_expires
ON user_sessions(expires_at);

-- ============================================================
-- EMAIL / OTP TOKENS
-- ============================================================

CREATE TABLE IF NOT EXISTS auth_tokens (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    user_id UUID
        REFERENCES users(id)
        ON DELETE CASCADE,

    token_hash TEXT NOT NULL,

    token_type VARCHAR(50) NOT NULL,

    expires_at TIMESTAMPTZ NOT NULL,

    consumed_at TIMESTAMPTZ,

    attempts INTEGER NOT NULL DEFAULT 0,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_auth_tokens_user
ON auth_tokens(user_id);

CREATE INDEX IF NOT EXISTS idx_auth_tokens_type
ON auth_tokens(token_type);

-- ============================================================
-- PROPERTIES
-- ============================================================

CREATE TABLE IF NOT EXISTS properties (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    property_code VARCHAR(50) UNIQUE NOT NULL,

    owner_id UUID
        REFERENCES users(id)
        ON DELETE SET NULL,

    agent_id UUID
        REFERENCES users(id)
        ON DELETE SET NULL,

    title VARCHAR(300) NOT NULL,

    slug VARCHAR(350) UNIQUE,

    description TEXT,

    listing_type property_listing_type NOT NULL,

    property_type property_type NOT NULL,

    status property_status NOT NULL DEFAULT 'draft',

    verification_status verification_status
        NOT NULL DEFAULT 'not_started',

    price NUMERIC(18,2) NOT NULL,

    security_deposit NUMERIC(18,2),

    maintenance_fee NUMERIC(18,2),

    monthly_rent NUMERIC(18,2),

    lease_duration_months INTEGER,

    built_up_area NUMERIC(14,2),

    carpet_area NUMERIC(14,2),

    plot_area NUMERIC(14,2),

    area_unit VARCHAR(20) DEFAULT 'sqft',

    bedrooms INTEGER,

    bathrooms INTEGER,

    balconies INTEGER,

    floors INTEGER,

    floor_number INTEGER,

    total_floors INTEGER,

    year_built INTEGER,

    parking_count INTEGER DEFAULT 0,

    furnishing VARCHAR(50),

    facing VARCHAR(50),

    possession_date DATE,

    address_line1 TEXT,

    address_line2 TEXT,

    locality VARCHAR(200),

    city VARCHAR(100),

    district VARCHAR(100),

    state VARCHAR(100),

    country VARCHAR(100) DEFAULT 'India',

    postal_code VARCHAR(20),

    latitude NUMERIC(10,7),

    longitude NUMERIC(10,7),

    landmark TEXT,

    rera_number VARCHAR(100),

    builder_name VARCHAR(200),

    featured BOOLEAN NOT NULL DEFAULT FALSE,

    verified BOOLEAN NOT NULL DEFAULT FALSE,

    published_at TIMESTAMPTZ,

    expires_at TIMESTAMPTZ,

    views_count BIGINT NOT NULL DEFAULT 0,

    favorites_count BIGINT NOT NULL DEFAULT 0,

    inquiries_count BIGINT NOT NULL DEFAULT 0,

    metadata JSONB NOT NULL DEFAULT '{}'::jsonb,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    deleted_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_properties_owner
ON properties(owner_id);

CREATE INDEX IF NOT EXISTS idx_properties_agent
ON properties(agent_id);

CREATE INDEX IF NOT EXISTS idx_properties_status
ON properties(status);

CREATE INDEX IF NOT EXISTS idx_properties_listing_type
ON properties(listing_type);

CREATE INDEX IF NOT EXISTS idx_properties_property_type
ON properties(property_type);

CREATE INDEX IF NOT EXISTS idx_properties_city
ON properties(city);

CREATE INDEX IF NOT EXISTS idx_properties_locality
ON properties(locality);

CREATE INDEX IF NOT EXISTS idx_properties_price
ON properties(price);

CREATE INDEX IF NOT EXISTS idx_properties_bedrooms
ON properties(bedrooms);

CREATE INDEX IF NOT EXISTS idx_properties_location
ON properties(latitude, longitude);

CREATE INDEX IF NOT EXISTS idx_properties_title_trgm
ON properties USING gin(title gin_trgm_ops);

-- ============================================================
-- PROPERTY FEATURES
-- ============================================================

CREATE TABLE IF NOT EXISTS property_features (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    property_id UUID NOT NULL
        REFERENCES properties(id)
        ON DELETE CASCADE,

    feature_name VARCHAR(150) NOT NULL,

    feature_value TEXT,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_property_features_property
ON property_features(property_id);

-- ============================================================
-- PROPERTY MEDIA
-- ============================================================

CREATE TABLE IF NOT EXISTS property_media (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    property_id UUID NOT NULL
        REFERENCES properties(id)
        ON DELETE CASCADE,

    media_type VARCHAR(30) NOT NULL,

    storage_provider VARCHAR(30) DEFAULT 'local',

    storage_key TEXT NOT NULL,

    url TEXT,

    original_name TEXT,

    mime_type VARCHAR(150),

    file_size BIGINT,

    width INTEGER,

    height INTEGER,

    duration_seconds NUMERIC(12,2),

    is_primary BOOLEAN NOT NULL DEFAULT FALSE,

    sort_order INTEGER NOT NULL DEFAULT 0,

    metadata JSONB NOT NULL DEFAULT '{}'::jsonb,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_property_media_property
ON property_media(property_id);

-- ============================================================
-- PROPERTY AMENITIES
-- ============================================================

CREATE TABLE IF NOT EXISTS amenities (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    name VARCHAR(150) UNIQUE NOT NULL,

    icon VARCHAR(150),

    category VARCHAR(100),

    active BOOLEAN NOT NULL DEFAULT TRUE,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS property_amenities (
    property_id UUID NOT NULL
        REFERENCES properties(id)
        ON DELETE CASCADE,

    amenity_id UUID NOT NULL
        REFERENCES amenities(id)
        ON DELETE CASCADE,

    PRIMARY KEY(property_id, amenity_id)
);

-- ============================================================
-- PROPERTY VERIFICATION
-- ============================================================

CREATE TABLE IF NOT EXISTS property_verifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    property_id UUID NOT NULL UNIQUE
        REFERENCES properties(id)
        ON DELETE CASCADE,

    requested_by UUID
        REFERENCES users(id)
        ON DELETE SET NULL,

    reviewed_by UUID
        REFERENCES users(id)
        ON DELETE SET NULL,

    status verification_status NOT NULL DEFAULT 'pending',

    ownership_verified BOOLEAN DEFAULT FALSE,

    address_verified BOOLEAN DEFAULT FALSE,

    identity_verified BOOLEAN DEFAULT FALSE,

    legal_verified BOOLEAN DEFAULT FALSE,

    rera_verified BOOLEAN DEFAULT FALSE,

    notes TEXT,

    rejection_reason TEXT,

    verified_at TIMESTAMPTZ,

    expires_at TIMESTAMPTZ,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- PROPERTY SAVED / FAVORITES
-- ============================================================

CREATE TABLE IF NOT EXISTS property_favorites (
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
-- SAVED SEARCHES
-- ============================================================

CREATE TABLE IF NOT EXISTS saved_searches (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    user_id UUID NOT NULL
        REFERENCES users(id)
        ON DELETE CASCADE,

    name VARCHAR(200) NOT NULL,

    filters JSONB NOT NULL DEFAULT '{}'::jsonb,

    alerts_enabled BOOLEAN NOT NULL DEFAULT TRUE,

    last_alert_at TIMESTAMPTZ,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- PROPERTY VIEWS
-- ============================================================

CREATE TABLE IF NOT EXISTS property_views (
    id BIGSERIAL PRIMARY KEY,

    property_id UUID NOT NULL
        REFERENCES properties(id)
        ON DELETE CASCADE,

    user_id UUID
        REFERENCES users(id)
        ON DELETE SET NULL,

    session_id VARCHAR(255),

    ip_address INET,

    user_agent TEXT,

    viewed_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_property_views_property
ON property_views(property_id);

-- ============================================================
-- VISITS
-- ============================================================

CREATE TABLE IF NOT EXISTS visits (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    property_id UUID NOT NULL
        REFERENCES properties(id)
        ON DELETE CASCADE,

    requester_id UUID NOT NULL
        REFERENCES users(id)
        ON DELETE CASCADE,

    host_id UUID
        REFERENCES users(id)
        ON DELETE SET NULL,

    status visit_status NOT NULL DEFAULT 'requested',

    scheduled_at TIMESTAMPTZ,

    duration_minutes INTEGER DEFAULT 30,

    meeting_type VARCHAR(50) DEFAULT 'property_visit',

    meeting_location TEXT,

    notes TEXT,

    cancellation_reason TEXT,

    reminder_sent BOOLEAN NOT NULL DEFAULT FALSE,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_visits_property
ON visits(property_id);

CREATE INDEX IF NOT EXISTS idx_visits_requester
ON visits(requester_id);

CREATE INDEX IF NOT EXISTS idx_visits_scheduled
ON visits(scheduled_at);

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

    parent_offer_id UUID
        REFERENCES offers(id)
        ON DELETE SET NULL,

    amount NUMERIC(18,2) NOT NULL,

    token_amount NUMERIC(18,2),

    status offer_status NOT NULL DEFAULT 'submitted',

    message TEXT,

    expires_at TIMESTAMPTZ,

    responded_at TIMESTAMPTZ,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_offers_property
ON offers(property_id);

CREATE INDEX IF NOT EXISTS idx_offers_buyer
ON offers(buyer_id);

CREATE INDEX IF NOT EXISTS idx_offers_seller
ON offers(seller_id);

-- ============================================================
-- APPLICATIONS
-- ============================================================

CREATE TABLE IF NOT EXISTS applications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    application_number VARCHAR(60) UNIQUE NOT NULL,

    applicant_id UUID NOT NULL
        REFERENCES users(id)
        ON DELETE CASCADE,

    property_id UUID
        REFERENCES properties(id)
        ON DELETE SET NULL,

    application_type VARCHAR(50) NOT NULL,

    status application_status NOT NULL DEFAULT 'draft',

    requested_amount NUMERIC(18,2),

    approved_amount NUMERIC(18,2),

    notes TEXT,

    rejection_reason TEXT,

    submitted_at TIMESTAMPTZ,

    reviewed_at TIMESTAMPTZ,

    completed_at TIMESTAMPTZ,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_applications_applicant
ON applications(applicant_id);

CREATE INDEX IF NOT EXISTS idx_applications_property
ON applications(property_id);

CREATE INDEX IF NOT EXISTS idx_applications_status
ON applications(status);

-- ============================================================
-- DOCUMENTS
-- ============================================================

CREATE TABLE IF NOT EXISTS documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    owner_id UUID NOT NULL
        REFERENCES users(id)
        ON DELETE CASCADE,

    property_id UUID
        REFERENCES properties(id)
        ON DELETE SET NULL,

    application_id UUID
        REFERENCES applications(id)
        ON DELETE SET NULL,

    document_type VARCHAR(100) NOT NULL,

    title VARCHAR(250),

    storage_provider VARCHAR(30) DEFAULT 'local',

    storage_key TEXT NOT NULL,

    original_name TEXT,

    mime_type VARCHAR(150),

    file_size BIGINT,

    checksum VARCHAR(128),

    status document_status NOT NULL DEFAULT 'uploaded',

    is_sensitive BOOLEAN NOT NULL DEFAULT TRUE,

    verified_by UUID
        REFERENCES users(id)
        ON DELETE SET NULL,

    verified_at TIMESTAMPTZ,

    rejection_reason TEXT,

    expires_at TIMESTAMPTZ,

    metadata JSONB NOT NULL DEFAULT '{}'::jsonb,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_documents_owner
ON documents(owner_id);

CREATE INDEX IF NOT EXISTS idx_documents_property
ON documents(property_id);

CREATE INDEX IF NOT EXISTS idx_documents_application
ON documents(application_id);

CREATE INDEX IF NOT EXISTS idx_documents_status
ON documents(status);

-- ============================================================
-- PAYMENT TRANSACTIONS
-- ============================================================

CREATE TABLE IF NOT EXISTS payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    user_id UUID
        REFERENCES users(id)
        ON DELETE SET NULL,

    property_id UUID
        REFERENCES properties(id)
        ON DELETE SET NULL,

    application_id UUID
        REFERENCES applications(id)
        ON DELETE SET NULL,

    provider VARCHAR(50) NOT NULL DEFAULT 'razorpay',

    provider_order_id VARCHAR(255),

    provider_payment_id VARCHAR(255),

    provider_signature TEXT,

    purpose VARCHAR(100) NOT NULL,

    amount NUMERIC(18,2) NOT NULL,

    currency VARCHAR(10) NOT NULL DEFAULT 'INR',

    status payment_status NOT NULL DEFAULT 'created',

    idempotency_key VARCHAR(255) UNIQUE,

    receipt VARCHAR(255),

    description TEXT,

    metadata JSONB NOT NULL DEFAULT '{}'::jsonb,

    paid_at TIMESTAMPTZ,

    failed_at TIMESTAMPTZ,

    failure_reason TEXT,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_payments_user
ON payments(user_id);

CREATE INDEX IF NOT EXISTS idx_payments_property
ON payments(property_id);

CREATE INDEX IF NOT EXISTS idx_payments_provider_order
ON payments(provider_order_id);

CREATE INDEX IF NOT EXISTS idx_payments_provider_payment
ON payments(provider_payment_id);

CREATE INDEX IF NOT EXISTS idx_payments_status
ON payments(status);

-- ============================================================
-- PAYMENT REFUNDS
-- ============================================================

CREATE TABLE IF NOT EXISTS payment_refunds (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    payment_id UUID NOT NULL
        REFERENCES payments(id)
        ON DELETE CASCADE,

    provider_refund_id VARCHAR(255),

    amount NUMERIC(18,2) NOT NULL,

    currency VARCHAR(10) NOT NULL DEFAULT 'INR',

    reason TEXT,

    status VARCHAR(50) NOT NULL DEFAULT 'pending',

    requested_by UUID
        REFERENCES users(id)
        ON DELETE SET NULL,

    approved_by UUID
        REFERENCES users(id)
        ON DELETE SET NULL,

    processed_at TIMESTAMPTZ,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- PAYMENT WEBHOOKS
-- ============================================================

CREATE TABLE IF NOT EXISTS payment_webhooks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    provider VARCHAR(50) NOT NULL,

    event_id VARCHAR(255),

    event_type VARCHAR(150) NOT NULL,

    signature_valid BOOLEAN NOT NULL DEFAULT FALSE,

    payload JSONB NOT NULL,

    processed BOOLEAN NOT NULL DEFAULT FALSE,

    processed_at TIMESTAMPTZ,

    processing_error TEXT,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_payment_webhooks_event
ON payment_webhooks(event_id);

-- ============================================================
-- SUBSCRIPTION PLANS
-- ============================================================

CREATE TABLE IF NOT EXISTS subscription_plans (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    code VARCHAR(50) UNIQUE NOT NULL,

    name VARCHAR(150) NOT NULL,

    description TEXT,

    role user_role,

    billing_cycle VARCHAR(30) NOT NULL DEFAULT 'monthly',

    amount NUMERIC(18,2) NOT NULL DEFAULT 0,

    currency VARCHAR(10) NOT NULL DEFAULT 'INR',

    provider_plan_id VARCHAR(255),

    features JSONB NOT NULL DEFAULT '{}'::jsonb,

    active BOOLEAN NOT NULL DEFAULT TRUE,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- USER SUBSCRIPTIONS
-- ============================================================

CREATE TABLE IF NOT EXISTS subscriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    user_id UUID NOT NULL
        REFERENCES users(id)
        ON DELETE CASCADE,

    plan_id UUID NOT NULL
        REFERENCES subscription_plans(id)
        ON DELETE RESTRICT,

    provider VARCHAR(50) DEFAULT 'razorpay',

    provider_subscription_id VARCHAR(255),

    status subscription_status NOT NULL DEFAULT 'created',

    start_date TIMESTAMPTZ,

    current_period_start TIMESTAMPTZ,

    current_period_end TIMESTAMPTZ,

    cancel_at_period_end BOOLEAN NOT NULL DEFAULT FALSE,

    cancelled_at TIMESTAMPTZ,

    ended_at TIMESTAMPTZ,

    metadata JSONB NOT NULL DEFAULT '{}'::jsonb,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_subscriptions_user
ON subscriptions(user_id);

CREATE INDEX IF NOT EXISTS idx_subscriptions_status
ON subscriptions(status);

-- ============================================================
-- INVOICES
-- ============================================================

CREATE TABLE IF NOT EXISTS invoices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    invoice_number VARCHAR(100) UNIQUE NOT NULL,

    user_id UUID
        REFERENCES users(id)
        ON DELETE SET NULL,

    subscription_id UUID
        REFERENCES subscriptions(id)
        ON DELETE SET NULL,

    payment_id UUID
        REFERENCES payments(id)
        ON DELETE SET NULL,

    subtotal NUMERIC(18,2) NOT NULL DEFAULT 0,

    tax NUMERIC(18,2) NOT NULL DEFAULT 0,

    discount NUMERIC(18,2) NOT NULL DEFAULT 0,

    total NUMERIC(18,2) NOT NULL,

    currency VARCHAR(10) DEFAULT 'INR',

    status VARCHAR(50) DEFAULT 'issued',

    invoice_date DATE NOT NULL DEFAULT CURRENT_DATE,

    due_date DATE,

    paid_at TIMESTAMPTZ,

    pdf_storage_key TEXT,

    metadata JSONB NOT NULL DEFAULT '{}'::jsonb,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- LOANS
-- ============================================================

CREATE TABLE IF NOT EXISTS loans (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    application_id UUID
        REFERENCES applications(id)
        ON DELETE SET NULL,

    applicant_id UUID NOT NULL
        REFERENCES users(id)
        ON DELETE CASCADE,

    property_id UUID
        REFERENCES properties(id)
        ON DELETE SET NULL,

    lender_name VARCHAR(200),

    loan_type VARCHAR(100),

    requested_amount NUMERIC(18,2),

    approved_amount NUMERIC(18,2),

    interest_rate NUMERIC(8,4),

    tenure_months INTEGER,

    estimated_emi NUMERIC(18,2),

    status loan_status NOT NULL DEFAULT 'draft',

    credit_score INTEGER,

    debt_to_income_ratio NUMERIC(8,4),

    notes TEXT,

    rejection_reason TEXT,

    submitted_at TIMESTAMPTZ,

    approved_at TIMESTAMPTZ,

    disbursed_at TIMESTAMPTZ,

    closed_at TIMESTAMPTZ,

    metadata JSONB NOT NULL DEFAULT '{}'::jsonb,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_loans_applicant
ON loans(applicant_id);

CREATE INDEX IF NOT EXISTS idx_loans_property
ON loans(property_id);

CREATE INDEX IF NOT EXISTS idx_loans_status
ON loans(status);

-- ============================================================
-- LOAN DOCUMENTS
-- ============================================================

CREATE TABLE IF NOT EXISTS loan_documents (
    loan_id UUID NOT NULL
        REFERENCES loans(id)
        ON DELETE CASCADE,

    document_id UUID NOT NULL
        REFERENCES documents(id)
        ON DELETE CASCADE,

    PRIMARY KEY(loan_id, document_id)
);

-- ============================================================
-- REFERRALS
-- ============================================================

CREATE TABLE IF NOT EXISTS referral_codes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    user_id UUID NOT NULL UNIQUE
        REFERENCES users(id)
        ON DELETE CASCADE,

    code VARCHAR(50) UNIQUE NOT NULL,

    active BOOLEAN NOT NULL DEFAULT TRUE,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS referrals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    referrer_id UUID NOT NULL
        REFERENCES users(id)
        ON DELETE CASCADE,

    referred_user_id UUID
        REFERENCES users(id)
        ON DELETE SET NULL,

    referral_code VARCHAR(50),

    status VARCHAR(50) DEFAULT 'pending',

    reward_amount NUMERIC(18,2) DEFAULT 0,

    reward_currency VARCHAR(10) DEFAULT 'INR',

    rewarded_at TIMESTAMPTZ,

    metadata JSONB NOT NULL DEFAULT '{}'::jsonb,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_referrals_referrer
ON referrals(referrer_id);

-- ============================================================
-- NOTIFICATIONS
-- ============================================================

CREATE TABLE IF NOT EXISTS notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    user_id UUID NOT NULL
        REFERENCES users(id)
        ON DELETE CASCADE,

    type VARCHAR(100) NOT NULL,

    title VARCHAR(300) NOT NULL,

    message TEXT NOT NULL,

    data JSONB NOT NULL DEFAULT '{}'::jsonb,

    channel VARCHAR(30) DEFAULT 'in_app',

    read_at TIMESTAMPTZ,

    sent_at TIMESTAMPTZ,

    expires_at TIMESTAMPTZ,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_notifications_user
ON notifications(user_id);

CREATE INDEX IF NOT EXISTS idx_notifications_unread
ON notifications(user_id, read_at);

-- ============================================================
-- CONVERSATIONS
-- ============================================================

CREATE TABLE IF NOT EXISTS conversations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    property_id UUID
        REFERENCES properties(id)
        ON DELETE SET NULL,

    subject VARCHAR(300),

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS conversation_participants (
    conversation_id UUID NOT NULL
        REFERENCES conversations(id)
        ON DELETE CASCADE,

    user_id UUID NOT NULL
        REFERENCES users(id)
        ON DELETE CASCADE,

    joined_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    left_at TIMESTAMPTZ,

    PRIMARY KEY(conversation_id, user_id)
);

-- ============================================================
-- MESSAGES
-- ============================================================

CREATE TABLE IF NOT EXISTS messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    conversation_id UUID NOT NULL
        REFERENCES conversations(id)
        ON DELETE CASCADE,

    sender_id UUID NOT NULL
        REFERENCES users(id)
        ON DELETE CASCADE,

    body TEXT NOT NULL,

    message_type VARCHAR(50) DEFAULT 'text',

    attachment_data JSONB,

    status message_status NOT NULL DEFAULT 'sent',

    read_at TIMESTAMPTZ,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    deleted_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_messages_conversation
ON messages(conversation_id);

CREATE INDEX IF NOT EXISTS idx_messages_sender
ON messages(sender_id);

-- ============================================================
-- SUPPORT TICKETS
-- ============================================================

CREATE TABLE IF NOT EXISTS support_tickets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    ticket_number VARCHAR(60) UNIQUE NOT NULL,

    user_id UUID
        REFERENCES users(id)
        ON DELETE SET NULL,

    assigned_to UUID
        REFERENCES users(id)
        ON DELETE SET NULL,

    subject VARCHAR(300) NOT NULL,

    description TEXT,

    category VARCHAR(100),

    priority VARCHAR(30) DEFAULT 'normal',

    status support_status NOT NULL DEFAULT 'open',

    resolution TEXT,

    resolved_at TIMESTAMPTZ,

    closed_at TIMESTAMPTZ,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS support_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    ticket_id UUID NOT NULL
        REFERENCES support_tickets(id)
        ON DELETE CASCADE,

    sender_id UUID
        REFERENCES users(id)
        ON DELETE SET NULL,

    message TEXT NOT NULL,

    internal_note BOOLEAN NOT NULL DEFAULT FALSE,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- ADMIN USERS
-- ============================================================

CREATE TABLE IF NOT EXISTS admin_users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    user_id UUID NOT NULL UNIQUE
        REFERENCES users(id)
        ON DELETE CASCADE,

    admin_level VARCHAR(50) NOT NULL DEFAULT 'admin',

    permissions JSONB NOT NULL DEFAULT '{}'::jsonb,

    active BOOLEAN NOT NULL DEFAULT TRUE,

    last_admin_login_at TIMESTAMPTZ,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- AUDIT LOGS
-- ============================================================

CREATE TABLE IF NOT EXISTS audit_logs (
    id BIGSERIAL PRIMARY KEY,

    user_id UUID
        REFERENCES users(id)
        ON DELETE SET NULL,

    admin_user_id UUID
        REFERENCES admin_users(id)
        ON DELETE SET NULL,

    action VARCHAR(150) NOT NULL,

    entity_type VARCHAR(100),

    entity_id UUID,

    request_id VARCHAR(255),

    ip_address INET,

    user_agent TEXT,

    old_data JSONB,

    new_data JSONB,

    metadata JSONB NOT NULL DEFAULT '{}'::jsonb,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_audit_logs_user
ON audit_logs(user_id);

CREATE INDEX IF NOT EXISTS idx_audit_logs_action
ON audit_logs(action);

CREATE INDEX IF NOT EXISTS idx_audit_logs_entity
ON audit_logs(entity_type, entity_id);

CREATE INDEX IF NOT EXISTS idx_audit_logs_created
ON audit_logs(created_at);

-- ============================================================
-- ADMIN ACTIONS
-- ============================================================

CREATE TABLE IF NOT EXISTS admin_actions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    admin_user_id UUID NOT NULL
        REFERENCES admin_users(id)
        ON DELETE CASCADE,

    action VARCHAR(150) NOT NULL,

    target_type VARCHAR(100),

    target_id UUID,

    reason TEXT,

    metadata JSONB NOT NULL DEFAULT '{}'::jsonb,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- SYSTEM SETTINGS
-- ============================================================

CREATE TABLE IF NOT EXISTS system_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    setting_key VARCHAR(200) UNIQUE NOT NULL,

    setting_value JSONB NOT NULL DEFAULT '{}'::jsonb,

    is_public BOOLEAN NOT NULL DEFAULT FALSE,

    description TEXT,

    updated_by UUID
        REFERENCES users(id)
        ON DELETE SET NULL,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- AI CONVERSATIONS
-- ============================================================

CREATE TABLE IF NOT EXISTS ai_conversations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    user_id UUID
        REFERENCES users(id)
        ON DELETE SET NULL,

    title VARCHAR(300),

    module VARCHAR(100) DEFAULT 'chat',

    model VARCHAR(150),

    provider VARCHAR(100),

    metadata JSONB NOT NULL DEFAULT '{}'::jsonb,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ai_conversations_user
ON ai_conversations(user_id);

-- ============================================================
-- AI MESSAGES
-- ============================================================

CREATE TABLE IF NOT EXISTS ai_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    conversation_id UUID NOT NULL
        REFERENCES ai_conversations(id)
        ON DELETE CASCADE,

    user_id UUID
        REFERENCES users(id)
        ON DELETE SET NULL,

    role VARCHAR(30) NOT NULL,

    content TEXT,

    input_tokens INTEGER,

    output_tokens INTEGER,

    total_tokens INTEGER,

    model VARCHAR(150),

    latency_ms INTEGER,

    safety_blocked BOOLEAN NOT NULL DEFAULT FALSE,

    metadata JSONB NOT NULL DEFAULT '{}'::jsonb,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ai_messages_conversation
ON ai_messages(conversation_id);

-- ============================================================
-- AI USAGE
-- ============================================================

CREATE TABLE IF NOT EXISTS ai_usage (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    user_id UUID
        REFERENCES users(id)
        ON DELETE SET NULL,

    module VARCHAR(100) NOT NULL,

    provider VARCHAR(100),

    model VARCHAR(150),

    request_count INTEGER NOT NULL DEFAULT 1,

    input_tokens BIGINT NOT NULL DEFAULT 0,

    output_tokens BIGINT NOT NULL DEFAULT 0,

    total_tokens BIGINT NOT NULL DEFAULT 0,

    estimated_cost NUMERIC(18,8) DEFAULT 0,

    usage_date DATE NOT NULL DEFAULT CURRENT_DATE,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ai_usage_user
ON ai_usage(user_id);

CREATE INDEX IF NOT EXISTS idx_ai_usage_date
ON ai_usage(usage_date);

-- ============================================================
-- AI PROMPTS
-- ============================================================

CREATE TABLE IF NOT EXISTS ai_prompts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    name VARCHAR(200) UNIQUE NOT NULL,

    module VARCHAR(100) NOT NULL,

    version INTEGER NOT NULL DEFAULT 1,

    prompt TEXT NOT NULL,

    system_prompt TEXT,

    variables JSONB NOT NULL DEFAULT '{}'::jsonb,

    active BOOLEAN NOT NULL DEFAULT TRUE,

    created_by UUID
        REFERENCES users(id)
        ON DELETE SET NULL,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- AI LOGS
-- ============================================================

CREATE TABLE IF NOT EXISTS ai_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    request_id VARCHAR(255),

    user_id UUID
        REFERENCES users(id)
        ON DELETE SET NULL,

    module VARCHAR(100),

    route VARCHAR(150),

    provider VARCHAR(100),

    model VARCHAR(150),

    success BOOLEAN NOT NULL DEFAULT TRUE,

    blocked BOOLEAN NOT NULL DEFAULT FALSE,

    latency_ms INTEGER,

    input_tokens INTEGER,

    output_tokens INTEGER,

    error_code VARCHAR(100),

    error_message TEXT,

    metadata JSONB NOT NULL DEFAULT '{}'::jsonb,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ai_logs_request
ON ai_logs(request_id);

CREATE INDEX IF NOT EXISTS idx_ai_logs_user
ON ai_logs(user_id);

CREATE INDEX IF NOT EXISTS idx_ai_logs_created
ON ai_logs(created_at);

-- ============================================================
-- AI SAFETY / MODERATION
-- ============================================================

CREATE TABLE IF NOT EXISTS ai_moderation_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    user_id UUID
        REFERENCES users(id)
        ON DELETE SET NULL,

    request_id VARCHAR(255),

    content_type VARCHAR(50),

    category VARCHAR(100),

    severity VARCHAR(30),

    action VARCHAR(50),

    blocked BOOLEAN NOT NULL DEFAULT FALSE,

    reason TEXT,

    metadata JSONB NOT NULL DEFAULT '{}'::jsonb,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- FRAUD DETECTION
-- ============================================================

CREATE TABLE IF NOT EXISTS fraud_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    user_id UUID
        REFERENCES users(id)
        ON DELETE SET NULL,

    property_id UUID
        REFERENCES properties(id)
        ON DELETE SET NULL,

    entity_type VARCHAR(100),

    entity_id UUID,

    risk_score NUMERIC(6,3),

    risk_level VARCHAR(30),

    reasons JSONB NOT NULL DEFAULT '[]'::jsonb,

    status VARCHAR(50) DEFAULT 'pending_review',

    reviewed_by UUID
        REFERENCES users(id)
        ON DELETE SET NULL,

    reviewed_at TIMESTAMPTZ,

    resolution TEXT,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_fraud_events_status
ON fraud_events(status);

CREATE INDEX IF NOT EXISTS idx_fraud_events_risk
ON fraud_events(risk_score);

-- ============================================================
-- PROPERTY PRICE ESTIMATIONS
-- ============================================================

CREATE TABLE IF NOT EXISTS property_price_estimations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    property_id UUID
        REFERENCES properties(id)
        ON DELETE SET NULL,

    requested_by UUID
        REFERENCES users(id)
        ON DELETE SET NULL,

    estimated_price NUMERIC(18,2),

    min_price NUMERIC(18,2),

    max_price NUMERIC(18,2),

    confidence NUMERIC(6,4),

    model VARCHAR(150),

    factors JSONB NOT NULL DEFAULT '{}'::jsonb,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- AI RECOMMENDATIONS
-- ============================================================

CREATE TABLE IF NOT EXISTS property_recommendations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    user_id UUID NOT NULL
        REFERENCES users(id)
        ON DELETE CASCADE,

    property_id UUID NOT NULL
        REFERENCES properties(id)
        ON DELETE CASCADE,

    score NUMERIC(8,5),

    reason TEXT,

    source VARCHAR(100) DEFAULT 'ai',

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    UNIQUE(user_id, property_id)
);

-- ============================================================
-- PROPERTY CONTENT GENERATED BY AI
-- ============================================================

CREATE TABLE IF NOT EXISTS ai_property_content (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    property_id UUID NOT NULL
        REFERENCES properties(id)
        ON DELETE CASCADE,

    content_type VARCHAR(100) NOT NULL,

    content TEXT NOT NULL,

    model VARCHAR(150),

    approved BOOLEAN NOT NULL DEFAULT FALSE,

    approved_by UUID
        REFERENCES users(id)
        ON DELETE SET NULL,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- RENTAL ANALYSIS
-- ============================================================

CREATE TABLE IF NOT EXISTS rental_analyses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    property_id UUID
        REFERENCES properties(id)
        ON DELETE SET NULL,

    requested_by UUID
        REFERENCES users(id)
        ON DELETE SET NULL,

    estimated_monthly_rent NUMERIC(18,2),

    estimated_yield NUMERIC(8,4),

    comparable_data JSONB NOT NULL DEFAULT '[]'::jsonb,

    recommendation TEXT,

    model VARCHAR(150),

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- INVESTMENT ANALYSIS
-- ============================================================

CREATE TABLE IF NOT EXISTS investment_analyses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    user_id UUID
        REFERENCES users(id)
        ON DELETE SET NULL,

    property_id UUID
        REFERENCES properties(id)
        ON DELETE SET NULL,

    purchase_price NUMERIC(18,2),

    projected_rent NUMERIC(18,2),

    projected_appreciation NUMERIC(8,4),

    rental_yield NUMERIC(8,4),

    roi NUMERIC(8,4),

    risk_score NUMERIC(8,4),

    recommendation VARCHAR(100),

    analysis JSONB NOT NULL DEFAULT '{}'::jsonb,

    model VARCHAR(150),

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- SECURITY EVENTS
-- ============================================================

CREATE TABLE IF NOT EXISTS security_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    user_id UUID
        REFERENCES users(id)
        ON DELETE SET NULL,

    event_type VARCHAR(100) NOT NULL,

    severity VARCHAR(30) DEFAULT 'info',

    ip_address INET,

    user_agent TEXT,

    request_id VARCHAR(255),

    metadata JSONB NOT NULL DEFAULT '{}'::jsonb,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_security_events_user
ON security_events(user_id);

CREATE INDEX IF NOT EXISTS idx_security_events_type
ON security_events(event_type);

-- ============================================================
-- API IDEMPOTENCY
-- ============================================================

CREATE TABLE IF NOT EXISTS idempotency_keys (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    key VARCHAR(255) UNIQUE NOT NULL,

    user_id UUID
        REFERENCES users(id)
        ON DELETE SET NULL,

    route VARCHAR(255) NOT NULL,

    request_hash VARCHAR(128),

    response_status INTEGER,

    response_body JSONB,

    expires_at TIMESTAMPTZ NOT NULL,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_idempotency_expires
ON idempotency_keys(expires_at);

-- ============================================================
-- WEBHOOK EVENTS
-- ============================================================

CREATE TABLE IF NOT EXISTS webhook_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    provider VARCHAR(100) NOT NULL,

    event_id VARCHAR(255),

    event_type VARCHAR(150),

    signature_valid BOOLEAN DEFAULT FALSE,

    payload JSONB NOT NULL,

    status VARCHAR(50) DEFAULT 'received',

    processed_at TIMESTAMPTZ,

    error_message TEXT,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    UNIQUE(provider, event_id)
);

-- ============================================================
-- FILE ACCESS LOGS
-- ============================================================

CREATE TABLE IF NOT EXISTS file_access_logs (
    id BIGSERIAL PRIMARY KEY,

    user_id UUID
        REFERENCES users(id)
        ON DELETE SET NULL,

    document_id UUID
        REFERENCES documents(id)
        ON DELETE SET NULL,

    storage_key TEXT,

    action VARCHAR(50) NOT NULL,

    ip_address INET,

    request_id VARCHAR(255),

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- TRIGGERS
-- ============================================================

DROP TRIGGER IF EXISTS trg_users_updated
ON users;

CREATE TRIGGER trg_users_updated
BEFORE UPDATE ON users
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();


DROP TRIGGER IF EXISTS trg_user_profiles_updated
ON user_profiles;

CREATE TRIGGER trg_user_profiles_updated
BEFORE UPDATE ON user_profiles
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();


DROP TRIGGER IF EXISTS trg_properties_updated
ON properties;

CREATE TRIGGER trg_properties_updated
BEFORE UPDATE ON properties
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();


DROP TRIGGER IF EXISTS trg_property_verifications_updated
ON property_verifications;

CREATE TRIGGER trg_property_verifications_updated
BEFORE UPDATE ON property_verifications
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();


DROP TRIGGER IF EXISTS trg_visits_updated
ON visits;

CREATE TRIGGER trg_visits_updated
BEFORE UPDATE ON visits
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();


DROP TRIGGER IF EXISTS trg_offers_updated
ON offers;

CREATE TRIGGER trg_offers_updated
BEFORE UPDATE ON offers
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();


DROP TRIGGER IF EXISTS trg_applications_updated
ON applications;

CREATE TRIGGER trg_applications_updated
BEFORE UPDATE ON applications
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();


DROP TRIGGER IF EXISTS trg_documents_updated
ON documents;

CREATE TRIGGER trg_documents_updated
BEFORE UPDATE ON documents
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();


DROP TRIGGER IF EXISTS trg_payments_updated
ON payments;

CREATE TRIGGER trg_payments_updated
BEFORE UPDATE ON payments
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();


DROP TRIGGER IF EXISTS trg_subscriptions_updated
ON subscriptions;

CREATE TRIGGER trg_subscriptions_updated
BEFORE UPDATE ON subscriptions
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();


DROP TRIGGER IF EXISTS trg_subscription_plans_updated
ON subscription_plans;

CREATE TRIGGER trg_subscription_plans_updated
BEFORE UPDATE ON subscription_plans
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();


DROP TRIGGER IF EXISTS trg_loans_updated
ON loans;

CREATE TRIGGER trg_loans_updated
BEFORE UPDATE ON loans
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();


DROP TRIGGER IF EXISTS trg_support_tickets_updated
ON support_tickets;

CREATE TRIGGER trg_support_tickets_updated
BEFORE UPDATE ON support_tickets
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();


DROP TRIGGER IF EXISTS trg_admin_users_updated
ON admin_users;

CREATE TRIGGER trg_admin_users_updated
BEFORE UPDATE ON admin_users
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();


DROP TRIGGER IF EXISTS trg_system_settings_updated
ON system_settings;

CREATE TRIGGER trg_system_settings_updated
BEFORE UPDATE ON system_settings
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();


DROP TRIGGER IF EXISTS trg_ai_conversations_updated
ON ai_conversations;

CREATE TRIGGER trg_ai_conversations_updated
BEFORE UPDATE ON ai_conversations
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();


DROP TRIGGER IF EXISTS trg_ai_prompts_updated
ON ai_prompts;

CREATE TRIGGER trg_ai_prompts_updated
BEFORE UPDATE ON ai_prompts
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();


DROP TRIGGER IF EXISTS trg_ai_property_content_updated
ON ai_property_content;

CREATE TRIGGER trg_ai_property_content_updated
BEFORE UPDATE ON ai_property_content
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();


DROP TRIGGER IF EXISTS trg_conversations_updated
ON conversations;

CREATE TRIGGER trg_conversations_updated
BEFORE UPDATE ON conversations
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- ============================================================
-- COMMENTS
-- ============================================================

COMMENT ON TABLE users IS
'GHAR platform users and authentication identities.';

COMMENT ON TABLE properties IS
'GHAR real estate property listings.';

COMMENT ON TABLE property_media IS
'Property images, videos and floor plans.';

COMMENT ON TABLE documents IS
'Private user/property/application documents.';

COMMENT ON TABLE payments IS
'Payment transactions including Razorpay transactions.';

COMMENT ON TABLE subscriptions IS
'User subscription lifecycle.';

COMMENT ON TABLE loans IS
'Property financing and loan applications.';

COMMENT ON TABLE ai_logs IS
'Operational AI request logs.';

COMMENT ON TABLE audit_logs IS
'Security and administrative audit trail.';

-- ============================================================
-- FINAL
-- ============================================================

COMMIT;