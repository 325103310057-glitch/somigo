-- ============================================================================
-- SOMIGO PRODUCTION — SUPABASE DEVELOPMENT SEED DATA (OPTIONAL)
-- ATTENTION: THIS IS DEVELOPMENT / TESTING SEED DATA ONLY.
-- DO NOT APPLY TO PRODUCTION UNLESS POPULATING INITIAL DEMO CATALOG.
-- ============================================================================

-- 1. Categories
INSERT INTO categories (id, name, image_url, is_active, display_order)
VALUES
(1, 'Biryani', 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=200', TRUE, 1),
(2, 'Pizza', 'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=200', TRUE, 2),
(3, 'South Indian', 'https://images.unsplash.com/photo-1610057099443-fde8c4d50f91?w=200', TRUE, 3),
(4, 'Burgers', 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=200', TRUE, 4),
(5, 'Chinese', 'https://images.unsplash.com/photo-1585032226651-759b368d7246?w=200', TRUE, 5),
(6, 'Desserts', 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=200', TRUE, 6)
ON CONFLICT (id) DO NOTHING;

-- 2. Restaurants
INSERT INTO restaurants (id, restaurant_name, description, phone, email, logo_url, cover_image_url, address, city, state, postal_code, latitude, longitude, cuisine_type, average_rating, total_reviews, minimum_order_value, delivery_fee, estimated_delivery_minutes, is_open, is_active, approval_status, created_at, updated_at)
VALUES
(1, 'Paradise Dum Biryani', 'Authentic Hyderabadi Dum Biryani cooked with royal spices and saffron', '+918912543210', 'paradise@somigo.in', 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=200', 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=800', 'Siripuram Circle', 'Visakhapatnam', 'Andhra Pradesh', '530003', 17.7210, 83.3150, 'Biryani, North Indian, Kebabs', 4.6, 1420, 149.0, 25.0, 25, TRUE, TRUE, 'APPROVED', NOW(), NOW()),
(2, 'Crust & Craft Artisan Pizzeria', 'Authentic woodfired Neapolitan pizzas and hand-crafted pastas', '+918912543211', 'crust@somigo.in', 'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=200', 'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=800', 'Waltair Uplands', 'Visakhapatnam', 'Andhra Pradesh', '530003', 17.7240, 83.3120, 'Italian, Woodfired Pizza, Pasta', 4.8, 890, 199.0, 35.0, 30, TRUE, TRUE, 'APPROVED', NOW(), NOW()),
(3, 'Spice Symphony Kitchen', 'Traditional Andhra meals, crispy dosas, and coastal seafood', '+918912543212', 'spicesymphony@somigo.in', 'https://images.unsplash.com/photo-1610057099443-fde8c4d50f91?w=200', 'https://images.unsplash.com/photo-1610057099443-fde8c4d50f91?w=800', 'Daba Gardens', 'Visakhapatnam', 'Andhra Pradesh', '530020', 17.7120, 83.2980, 'South Indian, Thali, Chettinad', 4.4, 620, 99.0, 0.0, 20, TRUE, TRUE, 'APPROVED', NOW(), NOW()),
(4, 'The Burger Garage', 'Smash craft burgers, loaded cheese fries, and thick shakes', '+918912543213', 'burgergarage@somigo.in', 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=200', 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=800', 'Kirlampudi Layout', 'Visakhapatnam', 'Andhra Pradesh', '530017', 17.7180, 83.3280, 'Burgers, American, Fast Food', 4.5, 510, 129.0, 20.0, 20, TRUE, TRUE, 'APPROVED', NOW(), NOW()),
(5, 'Dragon Wok Express', 'Spicy Sichuan noodles, dim sums, and crispy chilly chicken', '+918912543214', 'dragonwok@somigo.in', 'https://images.unsplash.com/photo-1585032226651-759b368d7246?w=200', 'https://images.unsplash.com/photo-1585032226651-759b368d7246?w=800', 'MVP Colony', 'Visakhapatnam', 'Andhra Pradesh', '530017', 17.7420, 83.3340, 'Chinese, Asian, Noodles', 4.3, 380, 149.0, 25.0, 25, TRUE, TRUE, 'APPROVED', NOW(), NOW()),
(6, 'Sweet Tooth Patisserie', 'French pastries, Belgian waffles, artisan brownies, and cheesecakes', '+918912543215', 'sweettooth@somigo.in', 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=200', 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=800', 'Lawsons Bay', 'Visakhapatnam', 'Andhra Pradesh', '530017', 17.7310, 83.3400, 'Desserts, Bakery, Shakes', 4.7, 740, 99.0, 15.0, 15, TRUE, TRUE, 'APPROVED', NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- 3. Menu Items
INSERT INTO menu_items (id, restaurant_id, category_id, name, description, image_url, price, discounted_price, tax_percentage, preparation_time, vegetarian, vegan, spicy_level, available, is_featured, created_at, updated_at)
VALUES
(101, 1, 1, 'Royal Hyderabadi Chicken Dum Biryani', 'Fragrant basmati rice layered with spiced marinated chicken slow-cooked in sealed clay handi', 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=800', 320.0, 280.0, 5.0, 20, FALSE, FALSE, 2, TRUE, TRUE, NOW(), NOW()),
(102, 1, 1, 'Nizami Paneer Dum Biryani', 'Fresh cottage cheese cubes marinated in aromatic spices and saffron basmati', 'https://images.unsplash.com/photo-1633945274405-b6c8069047b0?w=800', 260.0, 230.0, 5.0, 15, TRUE, FALSE, 1, TRUE, FALSE, NOW(), NOW()),
(103, 1, 1, 'Mutton Galouti Kebab (4 pcs)', 'Melt-in-mouth Lucknowi mutton patties infused with 16 royal spices', 'https://images.unsplash.com/photo-1603894584373-5ac82b2ae398?w=800', 380.0, 340.0, 5.0, 15, FALSE, FALSE, 2, TRUE, TRUE, NOW(), NOW()),
(201, 2, 2, 'Woodfired Margherita Pizza', 'San Marzano tomato sauce, fresh buffalo mozzarella, virgin olive oil, basil', 'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=800', 340.0, 299.0, 5.0, 15, TRUE, FALSE, 1, TRUE, TRUE, NOW(), NOW()),
(202, 2, 2, 'Smoked Pepperoni & Jalapeno Pizza', 'Imported beef pepperoni, aged mozzarella, pickled jalapenos, spicy honey drizzle', 'https://images.unsplash.com/photo-1628840042765-356cda07504e?w=800', 440.0, 399.0, 5.0, 18, FALSE, FALSE, 2, TRUE, TRUE, NOW(), NOW()),
(301, 3, 3, 'Ghee Roast Masala Dosa', 'Golden crispy fermented crepe roasted with pure desi ghee and spiced potato filling', 'https://images.unsplash.com/photo-1610057099443-fde8c4d50f91?w=800', 140.0, 120.0, 5.0, 10, TRUE, FALSE, 2, TRUE, TRUE, NOW(), NOW()),
(302, 3, 3, 'Royal Andhra Non-Veg Thali', 'Unlimited rice served with Gongura Mutton, Chicken Fry, Rasam, Sambar, Curd, Payasam', 'https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=800', 390.0, 350.0, 5.0, 15, FALSE, FALSE, 3, TRUE, TRUE, NOW(), NOW()),
(401, 4, 4, 'Double Smash Truffle Cheeseburger', 'Two 100% prime patties smashed crispy with truffle aioli, cheddar, brioche bun', 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=800', 290.0, 250.0, 5.0, 12, FALSE, FALSE, 1, TRUE, TRUE, NOW(), NOW()),
(501, 5, 5, 'Spicy Schezwan Chicken Noodles', 'Hand-pulled wok-tossed noodles with shredded chicken and crunchy peppers', 'https://images.unsplash.com/photo-1585032226651-759b368d7246?w=800', 240.0, 210.0, 5.0, 15, FALSE, FALSE, 3, TRUE, TRUE, NOW(), NOW()),
(601, 6, 6, 'Molten Belgian Dark Chocolate Cake', 'Warm decadent chocolate cake with a molten oozing lava center', 'https://images.unsplash.com/photo-1606313564200-e75d5e30476c?w=800', 180.0, 150.0, 5.0, 10, TRUE, FALSE, 0, TRUE, TRUE, NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- 4. Coupons
INSERT INTO coupons (id, code, description, discount_type, discount_value, minimum_order_value, maximum_discount, usage_limit, per_user_limit, is_active)
VALUES
(1, 'SOMIGO50', '50% OFF up to ₹100 on orders above ₹199', 'PERCENTAGE', 50.0, 199.0, 100.0, 10000, 5, TRUE),
(2, 'SOMIGO75', 'Flat ₹75 OFF on biryani and artisanal pizzas', 'FLAT', 75.0, 249.0, 75.0, 5000, 3, TRUE)
ON CONFLICT (id) DO NOTHING;
