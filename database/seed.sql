-- GHAR seed.sql
-- Base seed data for the GHAR real-estate platform.
-- Safe to run after schema.sql.
-- Uses deterministic UUIDs so development environments remain repeatable.

BEGIN;

-- ============================================================
-- ROLES
-- ============================================================

INSERT INTO roles (id, code, name, description)
VALUES
(
    '00000000-0000-0000-0000-000000000001',
    'admin',
    'Administrator',
    'Full platform administration access'
),
(
    '00000000-0000-0000-0000-000000000002',
    'buyer',
    'Buyer',
    'Property buyer account'
),
(
    '00000000-0000-0000-0000-000000000003',
    'seller',
    'Seller',
    'Property seller account'
),
(
    '00000000-0000-0000-0000-000000000004',
    'tenant',
    'Tenant',
    'Property tenant account'
),
(
    '00000000-0000-0000-0000-000000000005',
    'agent',
    'Agent',
    'Real-estate agent account'
),
(
    '00000000-0000-0000-0000-000000000006',
    'business',
    'Business',
    'Business/organization account'
)
ON CONFLICT (code) DO UPDATE
SET
    name = EXCLUDED.name,
    description = EXCLUDED.description;


-- ============================================================
-- PERMISSIONS
-- ============================================================

INSERT INTO permissions (code, name, description)
VALUES
('platform.read', 'Platform Read', 'Read platform resources'),
('platform.manage', 'Platform Manage', 'Manage platform resources'),

('users.read', 'Users Read', 'View users'),
('users.manage', 'Users Manage', 'Manage users'),

('properties.read', 'Properties Read', 'View properties'),
('properties.create', 'Properties Create', 'Create properties'),
('properties.update', 'Properties Update', 'Update properties'),
('properties.delete', 'Properties Delete', 'Delete properties'),
('properties.approve', 'Properties Approve', 'Approve or reject properties'),

('visits.read', 'Visits Read', 'View property visits'),
('visits.manage', 'Visits Manage', 'Manage property visits'),

('offers.read', 'Offers Read', 'View offers'),
('offers.manage', 'Offers Manage', 'Manage offers'),

('documents.read', 'Documents Read', 'View documents'),
('documents.upload', 'Documents Upload', 'Upload documents'),
('documents.verify', 'Documents Verify', 'Verify documents'),

('payments.read', 'Payments Read', 'View payments'),
('payments.manage', 'Payments Manage', 'Manage payments'),
('payments.refund', 'Payments Refund', 'Process refunds'),

('loans.read', 'Loans Read', 'View loan applications'),
('loans.manage', 'Loans Manage', 'Manage loan applications'),

('support.read', 'Support Read', 'View support tickets'),
('support.manage', 'Support Manage', 'Manage support tickets'),

('notifications.read', 'Notifications Read', 'View notifications'),
('notifications.manage', 'Notifications Manage', 'Manage notifications'),

('ai.use', 'AI Use', 'Use GHAR AI services'),
('ai.manage', 'AI Manage', 'Manage GHAR AI configuration'),

('fraud.review', 'Fraud Review', 'Review fraud detection cases'),

('analytics.read', 'Analytics Read', 'View analytics')
ON CONFLICT (code) DO UPDATE
SET
    name = EXCLUDED.name,
    description = EXCLUDED.description;


-- ============================================================
-- ROLE PERMISSIONS
-- ============================================================

INSERT INTO role_permissions (role_id, permission_id)
SELECT
    r.id,
    p.id
FROM roles r
CROSS JOIN permissions p
WHERE r.code = 'admin'
ON CONFLICT DO NOTHING;


INSERT INTO role_permissions (role_id, permission_id)
SELECT
    r.id,
    p.id
FROM roles r
JOIN permissions p
    ON p.code IN (
        'properties.read',
        'properties.create',
        'properties.update',
        'properties.delete',
        'visits.read',
        'visits.manage',
        'offers.read',
        'offers.manage',
        'documents.read',
        'documents.upload',
        'payments.read',
        'loans.read',
        'support.read',
        'support.manage',
        'notifications.read',
        'ai.use'
    )
WHERE r.code = 'seller'
ON CONFLICT DO NOTHING;


INSERT INTO role_permissions (role_id, permission_id)
SELECT
    r.id,
    p.id
FROM roles r
JOIN permissions p
    ON p.code IN (
        'properties.read',
        'visits.read',
        'visits.manage',
        'offers.read',
        'offers.manage',
        'documents.read',
        'documents.upload',
        'payments.read',
        'loans.read',
        'support.read',
        'support.manage',
        'notifications.read',
        'ai.use'
    )
WHERE r.code = 'buyer'
ON CONFLICT DO NOTHING;


INSERT INTO role_permissions (role_id, permission_id)
SELECT
    r.id,
    p.id
FROM roles r
JOIN permissions p
    ON p.code IN (
        'properties.read',
        'visits.read',
        'visits.manage',
        'documents.read',
        'documents.upload',
        'payments.read',
        'support.read',
        'support.manage',
        'notifications.read',
        'ai.use'
    )
WHERE r.code = 'tenant'
ON CONFLICT DO NOTHING;


INSERT INTO role_permissions (role_id, permission_id)
SELECT
    r.id,
    p.id
FROM roles r
JOIN permissions p
    ON p.code IN (
        'properties.read',
        'properties.create',
        'properties.update',
        'visits.read',
        'visits.manage',
        'offers.read',
        'offers.manage',
        'documents.read',
        'documents.upload',
        'payments.read',
        'loans.read',
        'support.read',
        'support.manage',
        'notifications.read',
        'ai.use',
        'analytics.read'
    )
WHERE r.code = 'agent'
ON CONFLICT DO NOTHING;


-- ============================================================
-- SUBSCRIPTION PLANS
-- ============================================================

INSERT INTO subscription_plans
(
    id,
    code,
    name,
    description,
    billing_interval,
    price,
    currency,
    trial_days,
    is_active
)
VALUES
(
    '10000000-0000-0000-0000-000000000001',
    'FREE',
    'Free',
    'Basic GHAR account',
    'none',
    0,
    'INR',
    0,
    TRUE
),
(
    '10000000-0000-0000-0000-000000000002',
    'BUYER_PLUS',
    'Buyer Plus',
    'Enhanced property search and buyer services',
    'month',
    999,
    'INR',
    7,
    TRUE
),
(
    '10000000-0000-0000-0000-000000000003',
    'SELLER_PRO',
    'Seller Pro',
    'Professional property listing and seller tools',
    'month',
    1999,
    'INR',
    7,
    TRUE
),
(
    '10000000-0000-0000-0000-000000000004',
    'AGENT_PRO',
    'Agent Pro',
    'Professional real-estate agent tools',
    'month',
    2999,
    'INR',
    14,
    TRUE
),
(
    '10000000-0000-0000-0000-000000000005',
    'BUSINESS',
    'Business',
    'Business and enterprise real-estate tools',
    'month',
    4999,
    'INR',
    14,
    TRUE
)
ON CONFLICT (code) DO UPDATE
SET
    name = EXCLUDED.name,
    description = EXCLUDED.description,
    billing_interval = EXCLUDED.billing_interval,
    price = EXCLUDED.price,
    currency = EXCLUDED.currency,
    trial_days = EXCLUDED.trial_days,
    is_active = EXCLUDED.is_active;


-- ============================================================
-- PROPERTY TYPES
-- ============================================================

INSERT INTO property_types
(
    code,
    name,
    description
)
VALUES
('apartment', 'Apartment', 'Residential apartment'),
('villa', 'Villa', 'Independent villa'),
('house', 'House', 'Independent residential house'),
('plot', 'Plot', 'Residential or commercial plot'),
('office', 'Office', 'Commercial office space'),
('shop', 'Shop', 'Retail/commercial shop'),
('warehouse', 'Warehouse', 'Warehouse/storage property'),
('business_center', 'Business Center', 'Business center or managed office'),
('studio', 'Studio', 'Studio apartment'),
('penthouse', 'Penthouse', 'Premium penthouse'),
('farmhouse', 'Farmhouse', 'Farmhouse property'),
('land', 'Land', 'General land property')
ON CONFLICT (code) DO UPDATE
SET
    name = EXCLUDED.name,
    description = EXCLUDED.description;


-- ============================================================
-- PROPERTY AMENITIES
-- ============================================================

INSERT INTO amenities
(
    code,
    name,
    category
)
VALUES
('parking', 'Parking', 'basic'),
('covered_parking', 'Covered Parking', 'basic'),
('lift', 'Lift', 'building'),
('power_backup', 'Power Backup', 'building'),
('security', '24x7 Security', 'security'),
('cctv', 'CCTV', 'security'),
('gated_community', 'Gated Community', 'security'),
('swimming_pool', 'Swimming Pool', 'recreation'),
('gym', 'Gym', 'recreation'),
('clubhouse', 'Clubhouse', 'recreation'),
('garden', 'Garden', 'outdoor'),
('children_play_area', 'Children Play Area', 'outdoor'),
('balcony', 'Balcony', 'interior'),
('modular_kitchen', 'Modular Kitchen', 'interior'),
('air_conditioning', 'Air Conditioning', 'interior'),
('furnished', 'Furnished', 'interior'),
('semi_furnished', 'Semi Furnished', 'interior'),
('internet', 'Internet', 'utility'),
('water_supply', 'Water Supply', 'utility'),
('fire_safety', 'Fire Safety', 'safety')
ON CONFLICT (code) DO UPDATE
SET
    name = EXCLUDED.name,
    category = EXCLUDED.category;


-- ============================================================
-- PROPERTY FEATURES
-- ============================================================

INSERT INTO property_features
(
    code,
    name,
    category
)
VALUES
('new_construction', 'New Construction', 'property'),
('ready_to_move', 'Ready to Move', 'property'),
('under_construction', 'Under Construction', 'property'),
('resale', 'Resale', 'property'),
('corner_property', 'Corner Property', 'property'),
('park_facing', 'Park Facing', 'location'),
('road_facing', 'Road Facing', 'location'),
('main_road', 'Main Road', 'location'),
('near_metro', 'Near Metro', 'location'),
('near_school', 'Near School', 'location'),
('near_hospital', 'Near Hospital', 'location'),
('near_market', 'Near Market', 'location')
ON CONFLICT (code) DO UPDATE
SET
    name = EXCLUDED.name,
    category = EXCLUDED.category;


-- ============================================================
-- DOCUMENT TYPES
-- ============================================================

INSERT INTO document_types
(
    code,
    name,
    category,
    description,
    requires_verification
)
VALUES
('aadhaar', 'Aadhaar Card', 'identity', 'Government identity document', TRUE),
('pan', 'PAN Card', 'identity', 'Permanent Account Number document', TRUE),
('passport', 'Passport', 'identity', 'Passport identity document', TRUE),
('driving_license', 'Driving Licence', 'identity', 'Driving licence', TRUE),

('address_proof', 'Address Proof', 'identity', 'Proof of residential address', TRUE),
('bank_statement', 'Bank Statement', 'financial', 'Bank account statement', TRUE),
('salary_slip', 'Salary Slip', 'financial', 'Income/salary document', TRUE),
('itr', 'Income Tax Return', 'financial', 'Income tax return document', TRUE),

('sale_deed', 'Sale Deed', 'property', 'Property sale deed', TRUE),
('title_deed', 'Title Deed', 'property', 'Property title document', TRUE),
('registry', 'Property Registry', 'property', 'Property registration document', TRUE),
('encumbrance_certificate', 'Encumbrance Certificate', 'property', 'Encumbrance certificate', TRUE),
('property_tax_receipt', 'Property Tax Receipt', 'property', 'Property tax receipt', TRUE),
('possession_letter', 'Possession Letter', 'property', 'Possession document', TRUE),
('allotment_letter', 'Allotment Letter', 'property', 'Property allotment letter', TRUE),
('noc', 'No Objection Certificate', 'property', 'NOC document', TRUE),

('rent_agreement', 'Rent Agreement', 'agreement', 'Rental agreement', TRUE),
('loan_statement', 'Loan Statement', 'loan', 'Existing loan statement', TRUE)
ON CONFLICT (code) DO UPDATE
SET
    name = EXCLUDED.name,
    category = EXCLUDED.category,
    description = EXCLUDED.description,
    requires_verification = EXCLUDED.requires_verification;


-- ============================================================
-- PAYMENT PURPOSES
-- ============================================================

INSERT INTO payment_purposes
(
    code,
    name,
    description
)
VALUES
('property_purchase', 'Property Purchase', 'Property purchase payment'),
('property_booking', 'Property Booking', 'Property booking amount'),
('subscription', 'Subscription', 'GHAR subscription'),
('rent', 'Rent', 'Rental payment'),
('maintenance', 'Maintenance', 'Property maintenance payment'),
('loan_application', 'Loan Application', 'Loan processing/application fee'),
('service_fee', 'Service Fee', 'Platform service fee'),
('verification_fee', 'Verification Fee', 'Verification service fee'),
('platform_fee', 'Platform Fee', 'GHAR platform fee')
ON CONFLICT (code) DO UPDATE
SET
    name = EXCLUDED.name,
    description = EXCLUDED.description;


-- ============================================================
-- SYSTEM SETTINGS
-- ============================================================

INSERT INTO system_settings
(
    key,
    value,
    value_type,
    description,
    is_public
)
VALUES
(
    'platform.name',
    'GHAR',
    'string',
    'Platform name',
    TRUE
),
(
    'platform.currency',
    'INR',
    'string',
    'Default platform currency',
    TRUE
),
(
    'platform.country',
    'IN',
    'string',
    'Default platform country',
    TRUE
),
(
    'platform.timezone',
    'Asia/Kolkata',
    'string',
    'Default platform timezone',
    TRUE
),
(
    'property.default_listing_status',
    'draft',
    'string',
    'Default property listing status',
    FALSE
),
(
    'property.require_approval',
    'true',
    'boolean',
    'Whether property listings require admin approval',
    FALSE
),
(
    'payments.currency',
    'INR',
    'string',
    'Payment currency',
    TRUE
),
(
    'payments.mode',
    'test',
    'string',
    'Payment gateway operating mode',
    FALSE
),
(
    'security.require_email_verification',
    'true',
    'boolean',
    'Require email verification',
    FALSE
),
(
    'security.require_document_verification',
    'true',
    'boolean',
    'Require document verification',
    FALSE
),
(
    'ai.enabled',
    'true',
    'boolean',
    'Enable GHAR AI modules when provider credentials exist',
    FALSE
)
ON CONFLICT (key) DO UPDATE
SET
    value = EXCLUDED.value,
    value_type = EXCLUDED.value_type,
    description = EXCLUDED.description,
    is_public = EXCLUDED.is_public;


-- ============================================================
-- AI MODULE CONFIGURATION
-- ============================================================

INSERT INTO ai_modules
(
    code,
    name,
    description,
    enabled,
    requires_human_review
)
VALUES
(
    'chat',
    'GHAR AI Chat',
    'General real-estate AI assistant',
    TRUE,
    FALSE
),
(
    'search',
    'AI Property Search',
    'Natural-language property discovery',
    TRUE,
    FALSE
),
(
    'recommendations',
    'Property Recommendations',
    'Personalized property recommendations',
    TRUE,
    FALSE
),
(
    'price_estimation',
    'Price Estimation',
    'Property pricing assistance',
    TRUE,
    TRUE
),
(
    'investment',
    'Investment Advisor',
    'Real-estate investment analysis',
    TRUE,
    TRUE
),
(
    'loan_advisor',
    'Loan Advisor',
    'Loan planning assistance',
    TRUE,
    TRUE
),
(
    'document_assistant',
    'Document Assistant',
    'Document explanation and assistance',
    TRUE,
    TRUE
),
(
    'property_description',
    'Property Description',
    'AI-generated property descriptions',
    TRUE,
    FALSE
),
(
    'rental_advisor',
    'Rental Advisor',
    'Rental analysis and recommendations',
    TRUE,
    FALSE
),
(
    'moderation',
    'AI Moderation',
    'Content safety moderation',
    TRUE,
    FALSE
),
(
    'fraud_detection',
    'Fraud Detection',
    'Property and transaction fraud analysis',
    TRUE,
    TRUE
)
ON CONFLICT (code) DO UPDATE
SET
    name = EXCLUDED.name,
    description = EXCLUDED.description,
    enabled = EXCLUDED.enabled,
    requires_human_review = EXCLUDED.requires_human_review;


-- ============================================================
-- NOTIFICATION TYPES
-- ============================================================

INSERT INTO notification_types
(
    code,
    name,
    channel,
    description
)
VALUES
('welcome', 'Welcome', 'in_app', 'Welcome notification'),
('email_verification', 'Email Verification', 'email', 'Email verification notification'),
('otp', 'OTP', 'email', 'One-time password'),
('password_reset', 'Password Reset', 'email', 'Password reset notification'),
('login_alert', 'Login Alert', 'email', 'New login security alert'),

('property_listed', 'Property Listed', 'in_app', 'Property listing created'),
('property_approved', 'Property Approved', 'in_app', 'Property approved'),
('property_rejected', 'Property Rejected', 'in_app', 'Property rejected'),

('visit_scheduled', 'Visit Scheduled', 'in_app', 'Property visit scheduled'),
('visit_reminder', 'Visit Reminder', 'in_app', 'Upcoming visit reminder'),
('visit_cancelled', 'Visit Cancelled', 'in_app', 'Property visit cancelled'),

('offer_received', 'Offer Received', 'in_app', 'New property offer received'),
('offer_accepted', 'Offer Accepted', 'in_app', 'Offer accepted'),
('offer_rejected', 'Offer Rejected', 'in_app', 'Offer rejected'),

('document_uploaded', 'Document Uploaded', 'in_app', 'Document uploaded'),
('document_verified', 'Document Verified', 'in_app', 'Document verified'),
('document_rejected', 'Document Rejected', 'in_app', 'Document rejected'),

('payment_success', 'Payment Successful', 'in_app', 'Payment completed'),
('payment_failed', 'Payment Failed', 'in_app', 'Payment failed'),
('payment_refunded', 'Payment Refunded', 'in_app', 'Payment refunded'),

('subscription_started', 'Subscription Started', 'in_app', 'Subscription started'),
('subscription_renewed', 'Subscription Renewed', 'in_app', 'Subscription renewed'),
('subscription_cancelled', 'Subscription Cancelled', 'in_app', 'Subscription cancelled'),

('loan_status', 'Loan Status', 'in_app', 'Loan application status update'),

('support_ticket_created', 'Support Ticket Created', 'in_app', 'Support ticket created'),
('support_ticket_updated', 'Support Ticket Updated', 'in_app', 'Support ticket updated'),

('admin_alert', 'Admin Alert', 'in_app', 'Administrative alert')
ON CONFLICT (code) DO UPDATE
SET
    name = EXCLUDED.name,
    channel = EXCLUDED.channel,
    description = EXCLUDED.description;


-- ============================================================
-- SYSTEM ADMIN ACCOUNT
-- ============================================================
--
-- IMPORTANT:
-- The password is intentionally NOT seeded here.
-- Create the first administrator through the application's
-- secure bootstrap/admin creation flow.
--
-- Do not place plaintext passwords in seed.sql.
-- ============================================================


-- ============================================================
-- DEFAULT AI SYSTEM PROMPTS
-- ============================================================

INSERT INTO ai_prompts
(
    code,
    name,
    module,
    prompt,
    version,
    is_active
)
VALUES
(
    'ghar_default_assistant',
    'GHAR Default Assistant',
    'chat',
    'You are GHAR AI, a real-estate platform assistant. Provide clear, accurate and practical assistance for property discovery, buying, selling, renting, financing, documentation and platform workflows. Do not fabricate property facts, legal conclusions, financial approvals or transaction status.',
    1,
    TRUE
),
(
    'ghar_property_description',
    'GHAR Property Description',
    'property_description',
    'Create accurate, professional property descriptions using only supplied property information. Do not invent amenities, measurements, approvals, views, ownership details or legal claims.',
    1,
    TRUE
),
(
    'ghar_property_recommendation',
    'GHAR Property Recommendation',
    'recommendations',
    'Recommend properties using the supplied user preferences and verified property data. Clearly distinguish verified facts from inferred preferences.',
    1,
    TRUE
),
(
    'ghar_price_estimation',
    'GHAR Price Estimation',
    'price_estimation',
    'Assist with property price estimation using available property attributes and market data. Present estimates as estimates and identify important uncertainty factors.',
    1,
    TRUE
),
(
    'ghar_loan_advisor',
    'GHAR Loan Advisor',
    'loan_advisor',
    'Provide general loan-planning information. Do not represent an estimate as a guaranteed approval, sanctioned amount, interest rate or lender decision.',
    1,
    TRUE
),
(
    'ghar_document_assistant',
    'GHAR Document Assistant',
    'document_assistant',
    'Explain supplied real-estate documents in plain language while avoiding unsupported legal conclusions. Recommend professional legal review when appropriate.',
    1,
    TRUE
),
(
    'ghar_fraud_detection',
    'GHAR Fraud Detection',
    'fraud_detection',
    'Identify potential risk indicators from supplied property, account, document and transaction data. Never treat an AI risk score as conclusive proof of fraud. Flag high-risk cases for human review.',
    1,
    TRUE
)
ON CONFLICT (code, version) DO UPDATE
SET
    name = EXCLUDED.name,
    module = EXCLUDED.module,
    prompt = EXCLUDED.prompt,
    is_active = EXCLUDED.is_active;


-- ============================================================
-- EMAIL TEMPLATE REGISTRY
-- ============================================================

INSERT INTO email_templates
(
    code,
    name,
    subject,
    is_active
)
VALUES
('welcome', 'Welcome Email', 'Welcome to GHAR', TRUE),
('verify-email', 'Verify Email', 'Verify your GHAR email address', TRUE),
('otp', 'OTP', 'Your GHAR verification code', TRUE),
('password-reset', 'Password Reset', 'Reset your GHAR password', TRUE),
('password-changed', 'Password Changed', 'Your GHAR password was changed', TRUE),
('login-alert', 'Login Alert', 'New login to your GHAR account', TRUE),
('account-security', 'Account Security', 'GHAR account security alert', TRUE),

('property-listed', 'Property Listed', 'Your property has been listed', TRUE),
('property-approved', 'Property Approved', 'Your property listing has been approved', TRUE),
('property-rejected', 'Property Rejected', 'Your property listing needs attention', TRUE),
('property-updated', 'Property Updated', 'Your property has been updated', TRUE),
('property-verification', 'Property Verification', 'Property verification update', TRUE),

('visit-scheduled', 'Visit Scheduled', 'Property visit scheduled', TRUE),
('visit-reminder', 'Visit Reminder', 'Property visit reminder', TRUE),
('visit-cancelled', 'Visit Cancelled', 'Property visit cancelled', TRUE),

('offer-received', 'Offer Received', 'You received a property offer', TRUE),
('offer-accepted', 'Offer Accepted', 'Property offer accepted', TRUE),
('offer-rejected', 'Offer Rejected', 'Property offer rejected', TRUE),

('application-submitted', 'Application Submitted', 'Application submitted successfully', TRUE),
('application-updated', 'Application Updated', 'Application status updated', TRUE),

('document-uploaded', 'Document Uploaded', 'Document uploaded successfully', TRUE),
('document-verified', 'Document Verified', 'Document verification completed', TRUE),
('document-rejected', 'Document Rejected', 'Document verification requires attention', TRUE),

('payment-success', 'Payment Successful', 'GHAR payment successful', TRUE),
('payment-failed', 'Payment Failed', 'GHAR payment failed', TRUE),
('payment-refunded', 'Payment Refunded', 'GHAR payment refunded', TRUE),
('invoice', 'Invoice', 'Your GHAR invoice', TRUE),

('subscription-started', 'Subscription Started', 'Your GHAR subscription has started', TRUE),
('subscription-renewed', 'Subscription Renewed', 'Your GHAR subscription has renewed', TRUE),
('subscription-cancelled', 'Subscription Cancelled', 'Your GHAR subscription has been cancelled', TRUE),
('subscription-expired', 'Subscription Expired', 'Your GHAR subscription has expired', TRUE),

('loan-application', 'Loan Application', 'GHAR loan application update', TRUE),
('loan-status', 'Loan Status', 'GHAR loan status update', TRUE),

('referral', 'Referral', 'Your GHAR referral update', TRUE),

('support-ticket-created', 'Support Ticket Created', 'GHAR support ticket created', TRUE),
('support-ticket-updated', 'Support Ticket Updated', 'GHAR support ticket updated', TRUE),

('admin-alert', 'Admin Alert', 'GHAR administrative alert', TRUE)
ON CONFLICT (code) DO UPDATE
SET
    name = EXCLUDED.name,
    subject = EXCLUDED.subject,
    is_active = EXCLUDED.is_active;


-- ============================================================
-- AUDIT EVENT TYPES
-- ============================================================

INSERT INTO audit_event_types
(
    code,
    name,
    severity
)
VALUES
('auth.login', 'User Login', 'info'),
('auth.logout', 'User Logout', 'info'),
('auth.login_failed', 'Failed Login', 'warning'),
('auth.password_changed', 'Password Changed', 'info'),
('auth.password_reset', 'Password Reset', 'warning'),

('user.created', 'User Created', 'info'),
('user.updated', 'User Updated', 'info'),
('user.disabled', 'User Disabled', 'warning'),

('property.created', 'Property Created', 'info'),
('property.updated', 'Property Updated', 'info'),
('property.approved', 'Property Approved', 'info'),
('property.rejected', 'Property Rejected', 'warning'),
('property.deleted', 'Property Deleted', 'warning'),

('document.uploaded', 'Document Uploaded', 'info'),
('document.verified', 'Document Verified', 'info'),
('document.rejected', 'Document Rejected', 'warning'),

('payment.created', 'Payment Created', 'info'),
('payment.captured', 'Payment Captured', 'info'),
('payment.failed', 'Payment Failed', 'warning'),
('payment.refunded', 'Payment Refunded', 'warning'),

('admin.permission_changed', 'Permission Changed', 'critical'),
('admin.settings_changed', 'Settings Changed', 'warning'),

('security.fraud_flag', 'Fraud Flag', 'critical'),
('security.suspicious_activity', 'Suspicious Activity', 'critical')
ON CONFLICT (code) DO UPDATE
SET
    name = EXCLUDED.name,
    severity = EXCLUDED.severity;


-- ============================================================
-- DEFAULT SERVICE CATEGORIES
-- ============================================================

INSERT INTO service_categories
(
    code,
    name,
    description,
    is_active
)
VALUES
('property_verification', 'Property Verification', 'Property verification services', TRUE),
('legal_assistance', 'Legal Assistance', 'Property-related legal assistance', TRUE),
('loan_assistance', 'Loan Assistance', 'Home/property loan assistance', TRUE),
('valuation', 'Property Valuation', 'Property valuation services', TRUE),
('documentation', 'Documentation', 'Property documentation services', TRUE),
('moving', 'Moving Services', 'Relocation and moving assistance', TRUE),
('property_management', 'Property Management', 'Property management services', TRUE),
('interior', 'Interior Services', 'Interior and furnishing services', TRUE)
ON CONFLICT (code) DO UPDATE
SET
    name = EXCLUDED.name,
    description = EXCLUDED.description,
    is_active = EXCLUDED.is_active;


-- ============================================================
-- DEFAULT SUPPORT CATEGORIES
-- ============================================================

INSERT INTO support_categories
(
    code,
    name,
    description,
    priority
)
VALUES
('account', 'Account', 'Account and profile issues', 'normal'),
('property', 'Property', 'Property listing and property issues', 'normal'),
('payments', 'Payments', 'Payment and billing issues', 'high'),
('subscription', 'Subscription', 'Subscription issues', 'normal'),
('documents', 'Documents', 'Document upload and verification issues', 'high'),
('verification', 'Verification', 'Identity/property verification issues', 'high'),
('loan', 'Loan', 'Loan assistance issues', 'high'),
('technical', 'Technical', 'Technical platform issues', 'normal'),
('security', 'Security', 'Security and suspicious activity', 'critical'),
('fraud', 'Fraud', 'Potential fraud reports', 'critical'),
('other', 'Other', 'Other support requests', 'normal')
ON CONFLICT (code) DO UPDATE
SET
    name = EXCLUDED.name,
    description = EXCLUDED.description,
    priority = EXCLUDED.priority;


-- ============================================================
-- DEFAULT PROPERTY STATUS CONFIGURATION
-- ============================================================

INSERT INTO property_statuses
(
    code,
    name,
    description,
    is_public
)
VALUES
('draft', 'Draft', 'Property is being prepared', FALSE),
('pending_review', 'Pending Review', 'Waiting for administrative review', FALSE),
('approved', 'Approved', 'Property approved for publication', TRUE),
('published', 'Published', 'Property publicly available', TRUE),
('rejected', 'Rejected', 'Property rejected during review', FALSE),
('paused', 'Paused', 'Property temporarily unavailable', FALSE),
('sold', 'Sold', 'Property has been sold', TRUE),
('rented', 'Rented', 'Property has been rented', TRUE),
('archived', 'Archived', 'Property archived', FALSE)
ON CONFLICT (code) DO UPDATE
SET
    name = EXCLUDED.name,
    description = EXCLUDED.description,
    is_public = EXCLUDED.is_public;


-- ============================================================
-- DEFAULT VISIT STATUS CONFIGURATION
-- ============================================================

INSERT INTO visit_statuses
(
    code,
    name,
    description
)
VALUES
('requested', 'Requested', 'Visit requested'),
('confirmed', 'Confirmed', 'Visit confirmed'),
('scheduled', 'Scheduled', 'Visit scheduled'),
('completed', 'Completed', 'Visit completed'),
('cancelled', 'Cancelled', 'Visit cancelled'),
('rescheduled', 'Rescheduled', 'Visit rescheduled'),
('no_show', 'No Show', 'Visitor did not attend')
ON CONFLICT (code) DO UPDATE
SET
    name = EXCLUDED.name,
    description = EXCLUDED.description;


-- ============================================================
-- DEFAULT OFFER STATUS CONFIGURATION
-- ============================================================

INSERT INTO offer_statuses
(
    code,
    name,
    description
)
VALUES
('draft', 'Draft', 'Offer being prepared'),
('submitted', 'Submitted', 'Offer submitted'),
('under_review', 'Under Review', 'Offer under review'),
('countered', 'Countered', 'Seller submitted counter offer'),
('accepted', 'Accepted', 'Offer accepted'),
('rejected', 'Rejected', 'Offer rejected'),
('withdrawn', 'Withdrawn', 'Offer withdrawn'),
('expired', 'Expired', 'Offer expired')
ON CONFLICT (code) DO UPDATE
SET
    name = EXCLUDED.name,
    description = EXCLUDED.description;


-- ============================================================
-- DEFAULT APPLICATION STATUS CONFIGURATION
-- ============================================================

INSERT INTO application_statuses
(
    code,
    name,
    description
)
VALUES
('draft', 'Draft', 'Application draft'),
('submitted', 'Submitted', 'Application submitted'),
('under_review', 'Under Review', 'Application under review'),
('documents_required', 'Documents Required', 'Additional documents required'),
('verified', 'Verified', 'Application information verified'),
('approved', 'Approved', 'Application approved'),
('rejected', 'Rejected', 'Application rejected'),
('cancelled', 'Cancelled', 'Application cancelled')
ON CONFLICT (code) DO UPDATE
SET
    name = EXCLUDED.name,
    description = EXCLUDED.description;


-- ============================================================
-- DEFAULT LOAN STATUS CONFIGURATION
-- ============================================================

INSERT INTO loan_statuses
(
    code,
    name,
    description
)
VALUES
('draft', 'Draft', 'Loan application draft'),
('submitted', 'Submitted', 'Loan application submitted'),
('under_review', 'Under Review', 'Loan application under review'),
('documents_required', 'Documents Required', 'Additional documents required'),
('approved', 'Approved', 'Loan approved by lender'),
('sanctioned', 'Sanctioned', 'Loan sanctioned'),
('rejected', 'Rejected', 'Loan rejected'),
('disbursed', 'Disbursed', 'Loan disbursed'),
('cancelled', 'Cancelled', 'Loan application cancelled')
ON CONFLICT (code) DO UPDATE
SET
    name = EXCLUDED.name,
    description = EXCLUDED.description;


-- ============================================================
-- SEED COMPLETE
-- ============================================================

COMMIT;