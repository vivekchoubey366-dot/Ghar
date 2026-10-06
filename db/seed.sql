-- ============================================================
-- GHAR - DATABASE SEED
-- Development / Testing / Demo Data
-- PostgreSQL
-- ============================================================

BEGIN;

-- ============================================================
-- EXTENSION
-- ============================================================

CREATE EXTENSION IF NOT EXISTS "pgcrypto";


-- ============================================================
-- DEVELOPMENT USERS
-- ============================================================

INSERT INTO users (
    id,
    email,
    phone,
    password_hash,
    first_name,
    last_name,
    role,
    is_email_verified,
    is_phone_verified,
    is_identity_verified,
    is_active
)
VALUES

(
    '00000000-0000-0000-0000-000000000001',
    'admin@ghar.local',
    '+919999000001',
    crypt('CHANGE_ME_ADMIN_PASSWORD', gen_salt('bf')),
    'GHAR',
    'Admin',
    'admin',
    TRUE,
    TRUE,
    TRUE,
    TRUE
),

(
    '00000000-0000-0000-0000-000000000002',
    'buyer@ghar.local',
    '+919999000002',
    crypt('CHANGE_ME_BUYER_PASSWORD', gen_salt('bf')),
    'Demo',
    'Buyer',
    'buyer',
    TRUE,
    TRUE,
    FALSE,
    TRUE
),

(
    '00000000-0000-0000-0000-000000000003',
    'seller@ghar.local',
    '+919999000003',
    crypt('CHANGE_ME_SELLER_PASSWORD', gen_salt('bf')),
    'Demo',
    'Seller',
    'seller',
    TRUE,
    TRUE,
    TRUE,
    TRUE
),

(
    '00000000-0000-0000-0000-000000000004',
    'agent@ghar.local',
    '+919999000004',
    crypt('CHANGE_ME_AGENT_PASSWORD', gen_salt('bf')),
    'Demo',
    'Agent',
    'agent',
    TRUE,
    TRUE,
    TRUE,
    TRUE
),

(
    '00000000-0000-0000-0000-000000000005',
    'tenant@ghar.local',
    '+919999000005',
    crypt('CHANGE_ME_TENANT_PASSWORD', gen_salt('bf')),
    'Demo',
    'Tenant',
    'tenant',
    TRUE,
    TRUE,
    FALSE,
    TRUE
)

ON CONFLICT DO NOTHING;


-- ============================================================
-- USER PROFILES
-- ============================================================

INSERT INTO user_profiles (
    user_id,
    occupation,
    annual_income,
    city,
    state,
    country,
    postal_code,
    preferences
)
VALUES

(
    '00000000-0000-0000-0000-000000000002',
    'Software Professional',
    1800000,
    'Noida',
    'Uttar Pradesh',
    'India',
    '201301',
    '{
        "propertyTypes": ["Apartment", "Villa"],
        "purpose": "buy",
        "budgetMin": 5000000,
        "budgetMax": 15000000
    }'::jsonb
),

(
    '00000000-0000-0000-0000-000000000003',
    'Business Owner',
    3000000,
    'Noida',
    'Uttar Pradesh',
    'India',
    '201301',
    '{}'::jsonb
),

(
    '00000000-0000-0000-0000-000000000004',
    'Real Estate Agent',
    2400000,
    'Noida',
    'Uttar Pradesh',
    'India',
    '201301',
    '{}'::jsonb
)

ON CONFLICT (user_id) DO NOTHING;


-- ============================================================
-- PROPERTY CATEGORIES
-- ============================================================

INSERT INTO property_categories (
    id,
    name,
    description
)
VALUES

(
    '10000000-0000-0000-0000-000000000001',
    'Apartment',
    'Residential apartments and flats'
),

(
    '10000000-0000-0000-0000-000000000002',
    'Villa',
    'Independent villas and houses'
),

(
    '10000000-0000-0000-0000-000000000003',
    'House',
    'Independent residential houses'
),

(
    '10000000-0000-0000-0000-000000000004',
    'Plot',
    'Residential and commercial plots'
),

(
    '10000000-0000-0000-0000-000000000005',
    'Commercial',
    'Commercial properties'
)

ON CONFLICT DO NOTHING;


-- ============================================================
-- DEMO PROPERTIES
-- ============================================================

INSERT INTO properties (
    id,
    owner_id,
    agent_id,
    category_id,
    title,
    description,
    listing_type,
    status,
    property_type,
    bedrooms,
    bathrooms,
    built_up_area,
    carpet_area,
    floor_number,
    total_floors,
    price,
    maintenance_fee,
    address_line1,
    locality,
    city,
    district,
    state,
    country,
    postal_code,
    latitude,
    longitude,
    amenities,
    features,
    furnishing_status,
    parking_spaces,
    is_featured,
    is_verified
)
VALUES

(
    '20000000-0000-0000-0000-000000000001',

    '00000000-0000-0000-0000-000000000003',
    '00000000-0000-0000-0000-000000000004',

    '10000000-0000-0000-0000-000000000001',

    'Premium 3 BHK Apartment in Noida',

    'Modern 3 BHK apartment with premium amenities and excellent connectivity.',

    'sale',
    'active',

    'Apartment',

    3,
    3,

    1850,
    1550,

    12,
    25,

    12500000,
    6500,

    'Sector 137',
    'Sector 137',
    'Noida',
    'Gautam Buddha Nagar',
    'Uttar Pradesh',
    'India',
    '201305',

    28.5355,
    77.3910,

    '[
        "Swimming Pool",
        "Gym",
        "Clubhouse",
        "Parking",
        "Security",
        "Lift"
    ]'::jsonb,

    '{
        "balcony": true,
        "powerBackup": true,
        "gatedCommunity": true,
        "security24x7": true
    }'::jsonb,

    'Semi-Furnished',

    2,

    TRUE,
    TRUE
),


(
    '20000000-0000-0000-0000-000000000002',

    '00000000-0000-0000-0000-000000000003',
    '00000000-0000-0000-0000-000000000004',

    '10000000-0000-0000-0000-000000000002',

    'Luxury 4 BHK Villa',

    'Independent luxury villa with private parking and landscaped surroundings.',

    'sale',
    'active',

    'Villa',

    4,
    4,

    3200,
    2850,

    NULL,
    2,

    28500000,
    0,

    'Sector 150',
    'Sector 150',
    'Noida',
    'Gautam Buddha Nagar',
    'Uttar Pradesh',
    'India',
    '201310',

    28.5035,
    77.4200,

    '[
        "Private Parking",
        "Garden",
        "Security",
        "Clubhouse",
        "Swimming Pool"
    ]'::jsonb,

    '{
        "privateGarden": true,
        "gatedCommunity": true,
        "servantRoom": true,
        "terrace": true
    }'::jsonb,

    'Furnished',

    3,

    TRUE,
    TRUE
),


(
    '20000000-0000-0000-0000-000000000003',

    '00000000-0000-0000-0000-000000000003',
    '00000000-0000-0000-0000-000000000004',

    '10000000-0000-0000-0000-000000000001',

    '2 BHK Apartment for Rent',

    'Well-connected 2 BHK apartment suitable for families and professionals.',

    'rent',
    'active',

    'Apartment',

    2,
    2,

    1200,
    1050,

    8,
    18,

    NULL,
    35000,

    'Sector 75',
    'Sector 75',
    'Noida',
    'Gautam Buddha Nagar',
    'Uttar Pradesh',
    'India',
    '201301',

    28.5708,
    77.3852,

    '[
        "Lift",
        "Parking",
        "Security",
        "Gym"
    ]'::jsonb,

    '{
        "balcony": true,
        "powerBackup": true,
        "gatedCommunity": true
    }'::jsonb,

    'Semi-Furnished',

    1,

    FALSE,
    TRUE
),


(
    '20000000-0000-0000-0000-000000000004',

    '00000000-0000-0000-0000-000000000003',
    '00000000-0000-0000-0000-000000000004',

    '10000000-0000-0000-0000-000000000004',

    'Residential Plot in Noida Extension',

    'Residential plot suitable for future construction and investment.',

    'sale',
    'active',

    'Plot',

    NULL,
    NULL,

    1800,
    1800,

    NULL,
    NULL,

    7200000,
    0,

    'Greater Noida West',
    'Noida Extension',
    'Greater Noida',
    'Gautam Buddha Nagar',
    'Uttar Pradesh',
    'India',
    '201318',

    28.6040,
    77.4350,

    '[
        "Gated Community",
        "Road Access",
        "Security"
    ]'::jsonb,

    '{
        "cornerPlot": true,
        "roadFacing": true
    }'::jsonb,

    'Unfurnished',

    0,

    FALSE,
    TRUE
),


(
    '20000000-0000-0000-0000-000000000005',

    '00000000-0000-0000-0000-000000000003',
    '00000000-0000-0000-0000-000000000004',

    '10000000-0000-0000-0000-000000000005',

    'Commercial Office Space',

    'Premium commercial office space suitable for startups and established businesses.',

    'lease',
    'active',

    'Office',

    NULL,
    2,

    2500,
    2200,

    5,
    12,

    NULL,
    125000,

    'Sector 62',
    'Sector 62',
    'Noida',
    'Gautam Buddha Nagar',
    'Uttar Pradesh',
    'India',
    '201309',

    28.6270,
    77.3730,

    '[
        "Lift",
        "Parking",
        "Power Backup",
        "Security",
        "Reception"
    ]'::jsonb,

    '{
        "conferenceRoom": true,
        "reception": true,
        "centralAirConditioning": true
    }'::jsonb,

    'Furnished',

    10,

    FALSE,
    TRUE
)

ON CONFLICT (id) DO NOTHING;


-- ============================================================
-- PROPERTY IMAGES
-- Demo placeholder URLs only.
-- Replace with your real CDN/storage URLs.
-- ============================================================

INSERT INTO property_images (
    property_id,
    image_url,
    thumbnail_url,
    alt_text,
    sort_order,
    is_primary
)
VALUES

(
    '20000000-0000-0000-0000-000000000001',
    'https://placehold.co/1600x1000?text=GHAR+Property+1',
    'https://placehold.co/600x400?text=GHAR+Property+1',
    'Premium 3 BHK Apartment',
    1,
    TRUE
),

(
    '20000000-0000-0000-0000-000000000002',
    'https://placehold.co/1600x1000?text=GHAR+Villa',
    'https://placehold.co/600x400?text=GHAR+Villa',
    'Luxury Villa',
    1,
    TRUE
),

(
    '20000000-0000-0000-0000-000000000003',
    'https://placehold.co/1600x1000?text=GHAR+Rental',
    'https://placehold.co/600x400?text=GHAR+Rental',
    '2 BHK Rental Apartment',
    1,
    TRUE
),

(
    '20000000-0000-0000-0000-000000000004',
    'https://placehold.co/1600x1000?text=GHAR+Plot',
    'https://placehold.co/600x400?text=GHAR+Plot',
    'Residential Plot',
    1,
    TRUE
),

(
    '20000000-0000-0000-0000-000000000005',
    'https://placehold.co/1600x1000?text=GHAR+Office',
    'https://placehold.co/600x400?text=GHAR+Office',
    'Commercial Office Space',
    1,
    TRUE
)

ON CONFLICT DO NOTHING;


-- ============================================================
-- FAVOURITES
-- ============================================================

INSERT INTO favourites (
    user_id,
    property_id
)
VALUES

(
    '00000000-0000-0000-0000-000000000002',
    '20000000-0000-0000-0000-000000000001'
),

(
    '00000000-0000-0000-0000-000000000002',
    '20000000-0000-0000-0000-000000000002'
)

ON CONFLICT DO NOTHING;


-- ============================================================
-- PROPERTY COMPARISON
-- ============================================================

INSERT INTO property_comparisons (
    user_id,
    property_id
)
VALUES

(
    '00000000-0000-0000-0000-000000000002',
    '20000000-0000-0000-0000-000000000001'
),

(
    '00000000-0000-0000-0000-000000000002',
    '20000000-0000-0000-0000-000000000002'
),

(
    '00000000-0000-0000-0000-000000000002',
    '20000000-0000-0000-0000-000000000004'
)

ON CONFLICT DO NOTHING;


-- ============================================================
-- DEMO VISITS
-- ============================================================

INSERT INTO visits (
    id,
    property_id,
    visitor_id,
    owner_id,
    visit_date,
    visit_time,
    duration_minutes,
    status,
    notes,
    confirmed_at
)
VALUES

(
    '30000000-0000-0000-0000-000000000001',

    '20000000-0000-0000-0000-000000000001',

    '00000000-0000-0000-0000-000000000002',

    '00000000-0000-0000-0000-000000000003',

    CURRENT_DATE + INTERVAL '2 days',
    '11:00',

    30,

    'confirmed',

    'Morning property visit.',

    NOW()
),

(
    '30000000-0000-0000-0000-000000000002',

    '20000000-0000-0000-0000-000000000002',

    '00000000-0000-0000-0000-000000000002',

    '00000000-0000-0000-0000-000000000003',

    CURRENT_DATE + INTERVAL '5 days',
    '16:00',

    45,

    'requested',

    'Buyer requested an evening visit.',

    NULL
)

ON CONFLICT (id) DO NOTHING;


-- ============================================================
-- DEMO OFFER
-- ============================================================

INSERT INTO offers (
    id,
    property_id,
    buyer_id,
    seller_id,
    amount,
    message,
    status,
    expires_at
)
VALUES

(
    '40000000-0000-0000-0000-000000000001',

    '20000000-0000-0000-0000-000000000001',

    '00000000-0000-0000-0000-000000000002',

    '00000000-0000-0000-0000-000000000003',

    11500000,

    'Interested in purchasing this property subject to document verification.',

    'pending',

    NOW() + INTERVAL '7 days'
)

ON CONFLICT (id) DO NOTHING;


-- ============================================================
-- DEMO APPLICATION
-- ============================================================

INSERT INTO applications (
    id,
    applicant_id,
    property_id,
    application_type,
    status,
    application_data
)
VALUES

(
    '50000000-0000-0000-0000-000000000001',

    '00000000-0000-0000-0000-000000000002',

    '20000000-0000-0000-0000-000000000001',

    'property_purchase',

    'submitted',

    '{
        "employmentType": "salaried",
        "purpose": "primary_residence",
        "financingRequired": true
    }'::jsonb
)

ON CONFLICT (id) DO NOTHING;


-- ============================================================
-- DEMO LOAN
-- ============================================================

INSERT INTO loans (
    id,
    user_id,
    property_id,
    application_id,
    lender_name,
    loan_type,
    requested_amount,
    interest_rate,
    tenure_months,
    estimated_emi,
    status,
    loan_data
)
VALUES

(
    '60000000-0000-0000-0000-000000000001',

    '00000000-0000-0000-0000-000000000002',

    '20000000-0000-0000-0000-000000000001',

    '50000000-0000-0000-0000-000000000001',

    'Demo Home Finance',

    'home_loan',

    9000000,

    8.50,

    240,

    78000,

    'submitted',

    '{
        "employmentType": "salaried",
        "incomeVerified": false
    }'::jsonb
)

ON CONFLICT (id) DO NOTHING;


-- ============================================================
-- DEMO SUBSCRIPTION
-- ============================================================

INSERT INTO subscriptions (
    id,
    user_id,
    plan_name,
    amount,
    currency,
    status,
    started_at,
    current_period_start,
    current_period_end
)
VALUES

(
    '70000000-0000-0000-0000-000000000001',

    '00000000-0000-0000-0000-000000000002',

    'GHAR Premium',

    999,

    'INR',

    'active',

    NOW(),

    NOW(),

    NOW() + INTERVAL '30 days'
)

ON CONFLICT (id) DO NOTHING;


-- ============================================================
-- DEMO SERVICES
-- ============================================================

INSERT INTO services (
    id,
    name,
    category,
    description,
    provider_name,
    phone,
    email,
    price_from,
    location,
    is_active
)
VALUES

(
    '80000000-0000-0000-0000-000000000001',

    'Property Legal Verification',

    'legal',

    'Property title and document verification service.',

    'GHAR Legal Services',

    '+919999100001',

    'legal@ghar.local',

    5000,

    'Noida',

    TRUE
),

(
    '80000000-0000-0000-0000-000000000002',

    'Home Loan Assistance',

    'finance',

    'Home loan consultation and application assistance.',

    'GHAR Finance Desk',

    '+919999100002',

    'finance@ghar.local',

    0,

    'Noida',

    TRUE
),

(
    '80000000-0000-0000-0000-000000000003',

    'Property Inspection',

    'inspection',

    'Professional property inspection before purchase.',

    'GHAR Property Inspection',

    '+919999100003',

    'inspection@ghar.local',

    2500,

    'Noida',

    TRUE
),

(
    '80000000-0000-0000-0000-000000000004',

    'Interior Design',

    'interior',

    'Residential interior design and execution services.',

    'GHAR Interiors',

    '+919999100004',

    'interiors@ghar.local',

    25000,

    'Noida',

    TRUE
)

ON CONFLICT (id) DO NOTHING;


-- ============================================================
-- DEMO MARKETPLACE ITEMS
-- ============================================================

INSERT INTO marketplace_items (
    id,
    seller_id,
    title,
    description,
    category,
    price,
    condition,
    location,
    images,
    status
)
VALUES

(
    '90000000-0000-0000-0000-000000000001',

    '00000000-0000-0000-0000-000000000003',

    'Premium Modular Sofa',

    'Demo marketplace listing for a premium modular sofa.',

    'Furniture',

    45000,

    'Like New',

    'Noida',

    '[]'::jsonb,

    'active'
),

(
    '90000000-0000-0000-0000-000000000002',

    '00000000-0000-0000-0000-000000000003',

    'Modern Dining Table',

    'Demo marketplace listing for a modern dining table.',

    'Furniture',

    28000,

    'Good',

    'Noida',

    '[]'::jsonb,

    'active'
)

ON CONFLICT (id) DO NOTHING;


-- ============================================================
-- DEMO REFERRAL
-- ============================================================

INSERT INTO referrals (
    id,
    referrer_id,
    referred_user_id,
    referral_code,
    status,
    reward_amount,
    reward_paid
)
VALUES

(
    '91000000-0000-0000-0000-000000000001',

    '00000000-0000-0000-0000-000000000002',

    '00000000-0000-0000-0000-000000000005',

    'GHAR-DEMO-001',

    'completed',

    500,

    FALSE
)

ON CONFLICT (id) DO NOTHING;


-- ============================================================
-- DEMO CONVERSATION
-- ============================================================

INSERT INTO conversations (
    id,
    property_id
)
VALUES

(
    '92000000-0000-0000-0000-000000000001',

    '20000000-0000-0000-0000-000000000001'
)

ON CONFLICT (id) DO NOTHING;


INSERT INTO conversation_participants (
    conversation_id,
    user_id
)
VALUES

(
    '92000000-0000-0000-0000-000000000001',
    '00000000-0000-0000-0000-000000000002'
),

(
    '92000000-0000-0000-0000-000000000001',
    '00000000-0000-0000-0000-000000000003'
)

ON CONFLICT DO NOTHING;


INSERT INTO messages (
    conversation_id,
    sender_id,
    message
)
VALUES

(
    '92000000-0000-0000-0000-000000000001',

    '00000000-0000-0000-0000-000000000002',

    'Hello, I am interested in this property. Is it still available?'
),

(
    '92000000-0000-0000-0000-000000000001',

    '00000000-0000-0000-0000-000000000003',

    'Yes, the property is currently available for sale.'
);


-- ============================================================
-- DEMO NOTIFICATIONS
-- ============================================================

INSERT INTO notifications (
    user_id,
    type,
    title,
    message,
    data
)
VALUES

(
    '00000000-0000-0000-0000-000000000002',

    'visit_confirmed',

    'Visit Confirmed',

    'Your property visit has been confirmed.',

    '{
        "visitId": "30000000-0000-0000-0000-000000000001"
    }'::jsonb
),

(
    '00000000-0000-0000-0000-000000000002',

    'offer_pending',

    'Offer Submitted',

    'Your property offer is waiting for seller response.',

    '{
        "offerId": "40000000-0000-0000-0000-000000000001"
    }'::jsonb
);


-- ============================================================
-- DEMO SEARCH HISTORY
-- ============================================================

INSERT INTO search_history (
    user_id,
    query,
    filters
)
VALUES

(
    '00000000-0000-0000-0000-000000000002',

    '3 BHK apartment in Noida',

    '{
        "city": "Noida",
        "bedrooms": 3,
        "listingType": "sale",
        "budgetMax": 15000000
    }'::jsonb
),

(
    '00000000-0000-0000-0000-000000000002',

    'villa in Greater Noida',

    '{
        "city": "Greater Noida",
        "propertyType": "Villa",
        "listingType": "sale"
    }'::jsonb
);


-- ============================================================
-- DEMO SUPPORT TICKET
-- ============================================================

INSERT INTO support_tickets (
    id,
    user_id,
    subject,
    description,
    category,
    priority,
    status
)
VALUES

(
    '93000000-0000-0000-0000-000000000001',

    '00000000-0000-0000-0000-000000000002',

    'Property document verification',

    'I need help understanding the property document verification process.',

    'verification',

    'normal',

    'open'
)

ON CONFLICT (id) DO NOTHING;


-- ============================================================
-- DEMO AI CONVERSATION
-- ============================================================

INSERT INTO ai_conversations (
    id,
    user_id,
    title,
    context
)
VALUES

(
    '94000000-0000-0000-0000-000000000001',

    '00000000-0000-0000-0000-000000000002',

    'Property Search Assistant',

    '{
        "city": "Noida",
        "purpose": "buy"
    }'::jsonb
)

ON CONFLICT (id) DO NOTHING;


INSERT INTO ai_messages (
    conversation_id,
    role,
    content
)
VALUES

(
    '94000000-0000-0000-0000-000000000001',

    'user',

    'Help me find a 3 BHK apartment in Noida.'
),

(
    '94000000-0000-0000-0000-000000000001',

    'assistant',

    'I can help you compare properties based on budget, location, size and amenities.'
);


-- ============================================================
-- DEMO AUDIT LOG
-- ============================================================

INSERT INTO audit_logs (
    user_id,
    action,
    resource,
    resource_id,
    metadata
)
VALUES

(
    '00000000-0000-0000-0000-000000000001',

    'SEED_DATA_CREATED',

    'database',

    NULL,

    '{
        "environment": "development",
        "source": "db/seed.sql"
    }'::jsonb
);


-- ============================================================
-- RESET SEQUENCES
-- Not required because GHAR uses UUID primary keys.
-- ============================================================


-- ============================================================
-- COMPLETE
-- ============================================================

COMMIT;