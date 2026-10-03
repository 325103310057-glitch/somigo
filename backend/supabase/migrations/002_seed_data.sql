-- ============================================================================
-- SOMI GO PRODUCTION — INITIAL SEED DATA
-- Migration: 002_seed_data.sql
-- ============================================================================

INSERT INTO restaurant_categories (category_name, image_url, is_active) VALUES
('Biryani', 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=800', true),
('Pizza', 'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=800', true),
('Burgers', 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=800', true),
('South Indian', 'https://images.unsplash.com/photo-1610057099443-fde8c4d50f91?w=800', true),
('Pan-Asian', 'https://images.unsplash.com/photo-1541696432-82c6da8ce7bf?w=800', true),
('Desserts', 'https://images.unsplash.com/photo-1551024601-bec78aea704b?w=800', true)
ON CONFLICT (category_name) DO NOTHING;

INSERT INTO restaurants (id, restaurant_name, description, phone, email, cover_image_url, address, city, state, postal_code, latitude, longitude, cuisine_type, average_rating, total_reviews, minimum_order_value, delivery_fee, estimated_delivery_minutes, is_open, is_active) VALUES
(1, 'Paradise Dum Biryani', 'Authentic Hyderabadi Dum Biryani, royal kebabs & fragrant curries', '+918912345671', 'paradise@somigo.in', 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=800', 'Beach Road, Siripuram', 'Visakhapatnam', 'Andhra Pradesh', '530003', 17.7200, 83.3150, 'Biryani, North Indian, Kebabs', 4.6, 1420, 149.0, 25.0, 25, true, true),
(2, 'Crust & Craft Artisan Pizzeria', 'Woodfired sourdough pizzas, fresh burrata & handmade pastas', '+918912345672', 'crust@somigo.in', 'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=800', 'VIP Road, CBM Compound', 'Visakhapatnam', 'Andhra Pradesh', '530003', 17.7240, 83.3080, 'Italian, Woodfired Pizza, Pasta', 4.8, 890, 199.0, 35.0, 30, true, true),
(3, 'Spice Symphony Kitchen', 'Traditional Andhra meals, Chettinad specialties & seafood thalis', '+918912345673', 'spice@somigo.in', 'https://images.unsplash.com/photo-1610057099443-fde8c4d50f91?w=800', 'Waltair Uplands, Main Rd', 'Visakhapatnam', 'Andhra Pradesh', '530003', 17.7280, 83.3190, 'South Indian, Thali, Chettinad', 4.4, 620, 99.0, 0.0, 20, true, true),
(4, 'The Urban Burger Co.', 'Smash burgers, brioche buns, craft shakes & loaded crinkle fries', '+918912345674', 'urbanburger@somigo.in', 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=800', 'Dwaraka Nagar, 3rd Lane', 'Visakhapatnam', 'Andhra Pradesh', '530016', 17.7290, 83.3020, 'American, Gourmet Burgers, Shakes', 4.5, 740, 149.0, 30.0, 28, true, true),
(5, 'Wok & Dragon Pan-Asian', 'Steamed bao, dim sums, Hakka noodles & Thai red curry', '+918912345675', 'wok@somigo.in', 'https://images.unsplash.com/photo-1541696432-82c6da8ce7bf?w=800', 'MVP Colony, Sector 4', 'Visakhapatnam', 'Andhra Pradesh', '530017', 17.7420, 83.3340, 'Chinese, Momos, Thai Curries', 4.7, 1100, 179.0, 25.0, 32, true, true),
(6, 'Sweet Truth Patisserie', 'Artisanal Belgian chocolate cakes, cheesecakes & gelato', '+918912345676', 'sweet@somigo.in', 'https://images.unsplash.com/photo-1551024601-bec78aea704b?w=800', 'Rushikonda IT SEZ Rd', 'Visakhapatnam', 'Andhra Pradesh', '530045', 17.7850, 83.3760, 'Desserts, Cakes, Ice Creams', 4.9, 530, 99.0, 20.0, 22, true, true)
ON CONFLICT (id) DO UPDATE SET
  restaurant_name = EXCLUDED.restaurant_name,
  description = EXCLUDED.description,
  cuisine_type = EXCLUDED.cuisine_type,
  cover_image_url = EXCLUDED.cover_image_url;

SELECT setval('restaurants_id_seq', (SELECT MAX(id) FROM restaurants));

INSERT INTO menu_items (id, restaurant_id, item_name, description, price, discounted_price, is_veg, spicy_level, image_url, available) VALUES
(101, 1, 'Royal Hyderabadi Chicken Dum Biryani', 'Slow-cooked aromatic basmati rice layered with tender spiced chicken pieces and saffron.', 280.0, 249.0, false, 2, 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=800', true),
(102, 1, 'Nizami Paneer Dum Biryani', 'Fragrant dum biryani with marinated cottage cheese, caramelized onions & fresh mint.', 240.0, 219.0, true, 2, 'https://images.unsplash.com/photo-1633945274405-b6c8069047b0?w=800', true),
(103, 1, 'Chicken 65 Crispy Appetizer', 'Spicy, deep-fried chicken tossed with curry leaves, green chilies, and yogurt sauce.', 199.0, null, false, 3, 'https://images.unsplash.com/photo-1610057099443-fde8c4d50f91?w=800', true),
(201, 2, 'Truffle Mushroom Artisan Pizza', 'Fior di latte mozzarella, roasted wild mushrooms, truffle oil, and fresh thyme on sourdough crust.', 399.0, 349.0, true, 1, 'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=800', true),
(202, 2, 'Spicy Pepperoni & Hot Honey', 'San Marzano tomatoes, premium pork pepperoni, fresh basil, and chili-infused organic honey.', 449.0, null, false, 2, 'https://images.unsplash.com/photo-1628840042765-356cda07504e?w=800', true),
(301, 3, 'Royal Andhra Veg Thali Feast', 'Pappu, rasam, sambar, two curries, curd, poori, sweet, and fragrant sona masuri rice.', 180.0, 159.0, true, 2, 'https://images.unsplash.com/photo-1610057099443-fde8c4d50f91?w=800', true),
(401, 4, 'Classic Double Bacon Cheddar Smash', 'Double smashed prime patties, applewood smoked bacon, aged cheddar, pickles & special house sauce.', 260.0, 229.0, false, 1, 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=800', true)
ON CONFLICT (id) DO UPDATE SET
  item_name = EXCLUDED.item_name,
  price = EXCLUDED.price,
  discounted_price = EXCLUDED.discounted_price;

SELECT setval('menu_items_id_seq', (SELECT MAX(id) FROM menu_items));

INSERT INTO coupons (code, description, discount_type, discount_value, minimum_order_value, maximum_discount, is_active) VALUES
('SOMIGO50', '50% off on all restaurants up to ₹100', 'PERCENTAGE', 50.0, 149.0, 100.0, true),
('SOMIGO75', 'Flat ₹75 off on orders above ₹299', 'FLAT', 75.0, 299.0, 75.0, true),
('FREEDEL', 'Free delivery on all gourmet orders', 'FLAT', 25.0, 199.0, 25.0, true)
ON CONFLICT (code) DO NOTHING;
