-- ============================================================================
-- SOMIGO PRODUCTION — SUPABASE POSTGRESQL AUTHORITATIVE SCHEMA & MIGRATION
-- Migration: 20261003_001_somigo_production.sql
-- ============================================================================

-- Enable required cryptographic & UUID extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================================
-- 1. ENUM TYPES
-- ============================================================================
DO $$ BEGIN
    CREATE TYPE user_role AS ENUM ('CUSTOMER', 'RESTAURANT_OWNER', 'DELIVERY_PARTNER', 'ADMIN', 'SUPER_ADMIN', 'SUPPORT_AGENT');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE account_status AS ENUM ('ACTIVE', 'SUSPENDED', 'DEACTIVATED');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE order_status AS ENUM ('PLACED', 'ACCEPTED', 'PREPARING', 'READY', 'PICKED_UP', 'ON_THE_WAY', 'DELIVERED', 'CANCELLED');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE payment_status AS ENUM ('PENDING', 'PAID', 'FAILED', 'REFUNDED');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- ============================================================================
-- 2. USERS & PROFILES
-- ============================================================================
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    firebase_uid VARCHAR(128) UNIQUE,
    full_name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    phone_number VARCHAR(20) UNIQUE,
    password_hash VARCHAR(255),
    profile_image_url VARCHAR(500),
    date_of_birth VARCHAR(50),
    role user_role NOT NULL DEFAULT 'CUSTOMER',
    account_status account_status NOT NULL DEFAULT 'ACTIVE',
    email_verified BOOLEAN NOT NULL DEFAULT FALSE,
    phone_verified BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL,
    last_login_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_firebase_uid ON users(firebase_uid);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);

CREATE TABLE IF NOT EXISTS profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id INTEGER UNIQUE REFERENCES users(id) ON DELETE CASCADE,
    firebase_uid VARCHAR(128) UNIQUE NOT NULL,
    email VARCHAR(255) NOT NULL,
    display_name VARCHAR(255),
    photo_url VARCHAR(500),
    phone VARCHAR(50),
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_profiles_firebase_uid ON profiles(firebase_uid);
CREATE INDEX IF NOT EXISTS idx_profiles_email ON profiles(email);

-- ============================================================================
-- 3. CUSTOMER ADDRESSES
-- ============================================================================
CREATE TABLE IF NOT EXISTS customer_addresses (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    address_line VARCHAR(255) NOT NULL,
    apartment VARCHAR(100),
    landmark VARCHAR(100),
    city VARCHAR(100) NOT NULL,
    state VARCHAR(100) NOT NULL,
    postal_code VARCHAR(20) NOT NULL,
    latitude DOUBLE PRECISION NOT NULL,
    longitude DOUBLE PRECISION NOT NULL,
    address_type VARCHAR(50) DEFAULT 'Home',
    is_default BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_customer_addresses_user_id ON customer_addresses(user_id);

CREATE OR REPLACE VIEW addresses AS
SELECT id, user_id, address_line, apartment, landmark, city, state, postal_code, latitude, longitude, address_type, is_default, created_at, updated_at
FROM customer_addresses;

-- ============================================================================
-- 4. RESTAURANTS & MANAGEMENT
-- ============================================================================
CREATE TABLE IF NOT EXISTS restaurants (
    id SERIAL PRIMARY KEY,
    owner_id INTEGER REFERENCES users(id),
    restaurant_name VARCHAR(255) NOT NULL,
    description TEXT,
    phone VARCHAR(20) NOT NULL,
    email VARCHAR(255),
    logo_url VARCHAR(500),
    cover_image_url VARCHAR(500),
    address VARCHAR(255) NOT NULL,
    city VARCHAR(100) NOT NULL,
    state VARCHAR(100) NOT NULL,
    postal_code VARCHAR(20) NOT NULL,
    latitude DOUBLE PRECISION NOT NULL,
    longitude DOUBLE PRECISION NOT NULL,
    cuisine_type VARCHAR(255) NOT NULL,
    average_rating REAL DEFAULT 4.0 NOT NULL,
    total_reviews INTEGER DEFAULT 0 NOT NULL,
    minimum_order_value REAL DEFAULT 99.0 NOT NULL,
    delivery_fee REAL DEFAULT 30.0 NOT NULL,
    estimated_delivery_minutes INTEGER DEFAULT 30 NOT NULL,
    opening_time VARCHAR(10) DEFAULT '09:00' NOT NULL,
    closing_time VARCHAR(10) DEFAULT '23:00' NOT NULL,
    is_open BOOLEAN DEFAULT TRUE NOT NULL,
    is_active BOOLEAN DEFAULT TRUE NOT NULL,
    approval_status VARCHAR(50) DEFAULT 'APPROVED' NOT NULL,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_restaurants_city ON restaurants(city);
CREATE INDEX IF NOT EXISTS idx_restaurants_name ON restaurants(restaurant_name);
CREATE INDEX IF NOT EXISTS idx_restaurants_rating ON restaurants(average_rating);

CREATE TABLE IF NOT EXISTS restaurant_staff (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    restaurant_id INTEGER NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    role VARCHAR(50) DEFAULT 'STAFF' NOT NULL,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL
);

CREATE TABLE IF NOT EXISTS restaurant_hours (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    restaurant_id INTEGER NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
    day_of_week INTEGER NOT NULL CHECK (day_of_week BETWEEN 0 AND 6),
    open_time VARCHAR(10) DEFAULT '09:00' NOT NULL,
    close_time VARCHAR(10) DEFAULT '23:00' NOT NULL,
    is_closed BOOLEAN DEFAULT FALSE NOT NULL
);

CREATE TABLE IF NOT EXISTS restaurant_addresses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    restaurant_id INTEGER NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
    address_line VARCHAR(255) NOT NULL,
    city VARCHAR(100) NOT NULL,
    state VARCHAR(100) NOT NULL,
    postal_code VARCHAR(20) NOT NULL,
    latitude DOUBLE PRECISION NOT NULL,
    longitude DOUBLE PRECISION NOT NULL
);

-- ============================================================================
-- 5. MENUS & CATEGORIES
-- ============================================================================
CREATE TABLE IF NOT EXISTS categories (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) UNIQUE NOT NULL,
    image_url VARCHAR(500),
    is_active BOOLEAN DEFAULT TRUE NOT NULL,
    display_order INTEGER DEFAULT 0 NOT NULL
);

CREATE TABLE IF NOT EXISTS menus (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    restaurant_id INTEGER NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
    title VARCHAR(100) NOT NULL,
    is_active BOOLEAN DEFAULT TRUE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL
);

CREATE TABLE IF NOT EXISTS menu_categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    restaurant_id INTEGER NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    display_order INTEGER DEFAULT 0 NOT NULL
);

CREATE TABLE IF NOT EXISTS menu_items (
    id SERIAL PRIMARY KEY,
    restaurant_id INTEGER NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
    category_id INTEGER REFERENCES categories(id) ON DELETE SET NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    image_url VARCHAR(500),
    price REAL NOT NULL,
    discounted_price REAL,
    tax_percentage REAL DEFAULT 5.0 NOT NULL,
    preparation_time INTEGER DEFAULT 15 NOT NULL,
    vegetarian BOOLEAN DEFAULT TRUE NOT NULL,
    vegan BOOLEAN DEFAULT FALSE NOT NULL,
    spicy_level INTEGER DEFAULT 1 NOT NULL,
    available BOOLEAN DEFAULT TRUE NOT NULL,
    is_featured BOOLEAN DEFAULT FALSE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_menu_items_restaurant ON menu_items(restaurant_id);
CREATE INDEX IF NOT EXISTS idx_menu_items_category ON menu_items(category_id);

CREATE TABLE IF NOT EXISTS item_variants (
    id SERIAL PRIMARY KEY,
    menu_item_id INTEGER NOT NULL REFERENCES menu_items(id) ON DELETE CASCADE,
    variant_name VARCHAR(100) NOT NULL,
    price_delta REAL DEFAULT 0.0 NOT NULL,
    is_available BOOLEAN DEFAULT TRUE NOT NULL
);

CREATE OR REPLACE VIEW menu_item_variants AS
SELECT id, menu_item_id, variant_name, price_delta, is_available FROM item_variants;

CREATE TABLE IF NOT EXISTS item_addons (
    id SERIAL PRIMARY KEY,
    menu_item_id INTEGER NOT NULL REFERENCES menu_items(id) ON DELETE CASCADE,
    addon_name VARCHAR(100) NOT NULL,
    price REAL DEFAULT 0.0 NOT NULL,
    is_available BOOLEAN DEFAULT TRUE NOT NULL,
    max_quantity INTEGER DEFAULT 3 NOT NULL
);

-- ============================================================================
-- 6. CARTS & CART ITEMS
-- ============================================================================
CREATE TABLE IF NOT EXISTS carts (
    id SERIAL PRIMARY KEY,
    user_id INTEGER UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    restaurant_id INTEGER REFERENCES restaurants(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL
);

CREATE TABLE IF NOT EXISTS cart_items (
    id SERIAL PRIMARY KEY,
    cart_id INTEGER NOT NULL REFERENCES carts(id) ON DELETE CASCADE,
    menu_item_id INTEGER NOT NULL REFERENCES menu_items(id) ON DELETE CASCADE,
    quantity INTEGER NOT NULL CHECK (quantity > 0),
    selected_variant VARCHAR(100),
    customization_data TEXT,
    unit_price REAL NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_cart_items_cart ON cart_items(cart_id);

-- ============================================================================
-- 7. DELIVERY PARTNERS & ASSIGNMENTS
-- ============================================================================
CREATE TABLE IF NOT EXISTS delivery_partners (
    id SERIAL PRIMARY KEY,
    user_id INTEGER UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    partner_name VARCHAR(100) NOT NULL,
    phone_number VARCHAR(20) NOT NULL,
    vehicle_type VARCHAR(50) DEFAULT 'Bike' NOT NULL,
    vehicle_number VARCHAR(50) NOT NULL,
    verification_status VARCHAR(50) DEFAULT 'VERIFIED' NOT NULL,
    availability_status VARCHAR(50) DEFAULT 'ONLINE' NOT NULL,
    current_latitude DOUBLE PRECISION DEFAULT 17.7231 NOT NULL,
    current_longitude DOUBLE PRECISION DEFAULT 83.3012 NOT NULL,
    last_location_update TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    rating REAL DEFAULT 4.8 NOT NULL,
    total_deliveries INTEGER DEFAULT 0 NOT NULL,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- ============================================================================
-- 8. ORDERS, ITEMS & STATUS HISTORY
-- ============================================================================
CREATE TABLE IF NOT EXISTS orders (
    id SERIAL PRIMARY KEY,
    order_number VARCHAR(50) UNIQUE NOT NULL,
    customer_id INTEGER NOT NULL REFERENCES users(id),
    restaurant_id INTEGER NOT NULL REFERENCES restaurants(id),
    delivery_partner_id INTEGER REFERENCES delivery_partners(id),
    delivery_address_id INTEGER NOT NULL REFERENCES customer_addresses(id),
    subtotal REAL NOT NULL,
    delivery_fee REAL DEFAULT 0.0 NOT NULL,
    taxes REAL DEFAULT 0.0 NOT NULL,
    discount REAL DEFAULT 0.0 NOT NULL,
    platform_fee REAL DEFAULT 5.0 NOT NULL,
    tip REAL DEFAULT 0.0 NOT NULL,
    total_amount REAL NOT NULL,
    payment_status payment_status DEFAULT 'PENDING' NOT NULL,
    order_status order_status DEFAULT 'PLACED' NOT NULL,
    estimated_delivery_time TIMESTAMPTZ,
    placed_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL,
    accepted_at TIMESTAMPTZ,
    prepared_at TIMESTAMPTZ,
    picked_up_at TIMESTAMPTZ,
    delivered_at TIMESTAMPTZ,
    cancelled_at TIMESTAMPTZ,
    cancellation_reason VARCHAR(255),
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_orders_customer ON orders(customer_id);
CREATE INDEX IF NOT EXISTS idx_orders_restaurant ON orders(restaurant_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(order_status);

CREATE TABLE IF NOT EXISTS order_items (
    id SERIAL PRIMARY KEY,
    order_id INTEGER NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    menu_item_id INTEGER REFERENCES menu_items(id) ON DELETE SET NULL,
    item_name_snapshot VARCHAR(255) NOT NULL,
    quantity INTEGER NOT NULL CHECK (quantity > 0),
    unit_price REAL NOT NULL,
    tax REAL DEFAULT 0.0 NOT NULL,
    discount REAL DEFAULT 0.0 NOT NULL,
    customization_snapshot TEXT,
    total_price REAL NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_order_items_order ON order_items(order_id);

CREATE TABLE IF NOT EXISTS order_status_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id INTEGER NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    old_status order_status,
    new_status order_status NOT NULL,
    changed_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL,
    notes VARCHAR(255)
);

CREATE TABLE IF NOT EXISTS delivery_assignments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id INTEGER NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    delivery_partner_id INTEGER NOT NULL REFERENCES delivery_partners(id) ON DELETE CASCADE,
    status VARCHAR(50) DEFAULT 'ASSIGNED' NOT NULL,
    assigned_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL,
    completed_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS delivery_locations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    delivery_partner_id INTEGER NOT NULL REFERENCES delivery_partners(id) ON DELETE CASCADE,
    order_id INTEGER REFERENCES orders(id) ON DELETE SET NULL,
    latitude DOUBLE PRECISION NOT NULL,
    longitude DOUBLE PRECISION NOT NULL,
    accuracy REAL,
    speed_kmh REAL,
    recorded_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL
);

CREATE TABLE IF NOT EXISTS delivery_tracking (
    id SERIAL PRIMARY KEY,
    order_id INTEGER NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    delivery_partner_id INTEGER NOT NULL REFERENCES delivery_partners(id),
    latitude DOUBLE PRECISION NOT NULL,
    longitude DOUBLE PRECISION NOT NULL,
    recorded_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- ============================================================================
-- 9. PAYMENTS, REVIEWS, FAVORITES, NOTIFICATIONS
-- ============================================================================
CREATE TABLE IF NOT EXISTS payments (
    id SERIAL PRIMARY KEY,
    order_id INTEGER NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    user_id INTEGER NOT NULL REFERENCES users(id),
    payment_provider VARCHAR(50) DEFAULT 'RAZORPAY' NOT NULL,
    transaction_id VARCHAR(100) UNIQUE NOT NULL,
    amount REAL NOT NULL,
    currency VARCHAR(10) DEFAULT 'INR' NOT NULL,
    payment_status payment_status DEFAULT 'PENDING' NOT NULL,
    payment_method VARCHAR(50) DEFAULT 'UPI' NOT NULL,
    provider_response_reference TEXT,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL
);

CREATE TABLE IF NOT EXISTS favorites (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    restaurant_id INTEGER NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL,
    UNIQUE(user_id, restaurant_id)
);

CREATE TABLE IF NOT EXISTS notifications (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    notification_type VARCHAR(50) DEFAULT 'ORDER_UPDATE' NOT NULL,
    reference_id VARCHAR(100),
    read_status BOOLEAN DEFAULT FALSE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL
);

CREATE TABLE IF NOT EXISTS reviews (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id),
    restaurant_id INTEGER NOT NULL REFERENCES restaurants(id),
    order_id INTEGER UNIQUE NOT NULL REFERENCES orders(id),
    rating REAL NOT NULL CHECK (rating >= 1.0 AND rating <= 5.0),
    review_text TEXT,
    restaurant_reply TEXT,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL
);

CREATE TABLE IF NOT EXISTS coupons (
    id SERIAL PRIMARY KEY,
    code VARCHAR(50) UNIQUE NOT NULL,
    description VARCHAR(255) NOT NULL,
    discount_type VARCHAR(20) DEFAULT 'PERCENTAGE' NOT NULL,
    discount_value REAL NOT NULL,
    minimum_order_value REAL DEFAULT 149.0 NOT NULL,
    maximum_discount REAL DEFAULT 100.0 NOT NULL,
    usage_limit INTEGER DEFAULT 1000 NOT NULL,
    per_user_limit INTEGER DEFAULT 3 NOT NULL,
    valid_from TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL,
    valid_until TIMESTAMPTZ,
    is_active BOOLEAN DEFAULT TRUE NOT NULL
);

CREATE TABLE IF NOT EXISTS audit_logs (
    id SERIAL PRIMARY KEY,
    actor_user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    action VARCHAR(100) NOT NULL,
    resource_type VARCHAR(50) NOT NULL,
    resource_id VARCHAR(100) NOT NULL,
    metadata_json TEXT,
    ip_address VARCHAR(50),
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- ============================================================================
-- 10. SUPABASE ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================================================
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE customer_addresses ENABLE ROW LEVEL SECURITY;
ALTER TABLE carts ENABLE ROW LEVEL SECURITY;
ALTER TABLE cart_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE favorites ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE delivery_locations ENABLE ROW LEVEL SECURITY;

-- Public catalogue tables (read open to all, write restricted to admin/staff)
ALTER TABLE restaurants ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public restaurants read" ON restaurants FOR SELECT USING (is_active = true);

ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public categories read" ON categories FOR SELECT USING (is_active = true);

ALTER TABLE menu_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public menu_items read" ON menu_items FOR SELECT USING (available = true);

ALTER TABLE item_variants ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public item_variants read" ON item_variants FOR SELECT USING (is_available = true);

ALTER TABLE item_addons ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public item_addons read" ON item_addons FOR SELECT USING (is_available = true);

ALTER TABLE coupons ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public active coupons read" ON coupons FOR SELECT USING (is_active = true);
