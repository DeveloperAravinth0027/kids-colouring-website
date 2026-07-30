-- ============================================================
-- Kids Colouring Book E-commerce Platform
-- Seed Data — Sample Categories, Books, Admin User
-- ============================================================

USE kids_colour_db;

-- ============================================================
-- ADMIN USER (password: Admin@123456)
-- BCrypt hash for 'Admin@123456'
-- ============================================================
INSERT INTO users (name, email, password, role, provider, is_active, email_verified) VALUES
('Super Admin', 'admin@kidscolour.com', '$2a$12$9eV2vB9cIX7vMrQDXPYbveXQGvzOqZHkMT7yw5CXGp8kLfgVqMVyq', 'ADMIN', 'LOCAL', TRUE, TRUE);

-- ============================================================
-- CATEGORIES
-- ============================================================
INSERT INTO categories (name, slug, description, color_hex, sort_order, is_active) VALUES
('Animals', 'animals', 'Fun and adorable animal colouring books for kids', '#6BCB77', 1, TRUE),
('Vehicles', 'vehicles', 'Cars, trucks, trains, and more exciting vehicles to colour', '#4D96FF', 2, TRUE),
('Princess & Fairy Tales', 'princess-fairy-tales', 'Magical princess and fairy tale colouring adventures', '#FF6B6B', 3, TRUE),
('Alphabet & Numbers', 'alphabet-numbers', 'Learn letters and numbers while having fun colouring', '#FFD93D', 4, TRUE),
('Nature & Flowers', 'nature-flowers', 'Beautiful nature scenes, flowers, and gardens', '#6BCB77', 5, TRUE),
('Superheroes', 'superheroes', 'Exciting superhero colouring pages for little heroes', '#9B5DE5', 6, TRUE),
('Festival & Seasons', 'festival-seasons', 'Celebrate festivals and seasons with colourful art', '#FF6B6B', 7, TRUE),
('Dinosaurs', 'dinosaurs', 'Roar! Exciting dinosaur colouring books for young explorers', '#FFD93D', 8, TRUE),
('Space & Science', 'space-science', 'Explore the universe with space-themed colouring books', '#4D96FF', 9, TRUE),
('Mandala & Art', 'mandala-art', 'Beautiful mandala and art-themed colouring for older kids', '#9B5DE5', 10, TRUE);

-- ============================================================
-- BOOKS — 20 Sample Books
-- ============================================================
INSERT INTO books (
    category_id, name, slug, description, short_description,
    age_group, num_pages, language, price, discount_percent, final_price,
    is_featured, is_active, is_free, seo_title, seo_description
) VALUES
-- Animals
(1, 'Jungle Friends Colouring Book', 'jungle-friends-colouring-book',
 'Take your little one on a wild adventure through the jungle with 40 beautiful colouring pages featuring lions, elephants, giraffes, monkeys, and more. Each page is carefully designed to be age-appropriate and fun for young artists.',
 '40 fun jungle animal colouring pages for kids aged 3-6',
 '3-6', 40, 'English', 199.00, 20, 159.20,
 TRUE, TRUE, FALSE,
 'Jungle Friends Colouring Book — 40 Fun Animal Pages for Kids 3-6',
 'Download our Jungle Friends Colouring Book with 40 beautiful jungle animal pages. Perfect for kids aged 3-6. Instant digital download.'),

(1, 'Ocean Adventure Colouring Book', 'ocean-adventure-colouring-book',
 'Dive deep into the ocean with this stunning 50-page colouring book featuring dolphins, sharks, whales, seahorses, and colourful coral reefs. Educational and fun!',
 '50 ocean creature pages — learn while you colour!',
 '4-8', 50, 'English', 249.00, 0, 249.00,
 TRUE, TRUE, FALSE,
 'Ocean Adventure Colouring Book — 50 Sea Life Pages for Kids',
 'Explore the ocean depths with 50 beautiful sea creature colouring pages. Perfect for kids aged 4-8.'),

(1, 'Farm Animals Fun', 'farm-animals-fun',
 'Meet all your favourite farm animals in this delightful 35-page colouring book. Cows, pigs, horses, chickens, and more await your little artist.',
 '35 adorable farm animal pages',
 '2-5', 35, 'English', 149.00, 10, 134.10,
 FALSE, TRUE, FALSE,
 'Farm Animals Fun Colouring Book — 35 Pages for Toddlers',
 'Farm animal colouring book with 35 cute pages. Great for toddlers aged 2-5.'),

-- Vehicles
(2, 'Vroom! Cars and Trucks Colouring', 'vroom-cars-trucks-colouring',
 'Zoom into action with 45 exciting pages featuring sports cars, monster trucks, fire engines, race cars, and construction vehicles. Boys and girls will love this action-packed colouring adventure.',
 '45 exciting vehicle pages — cars, trucks, and more!',
 '4-9', 45, 'English', 199.00, 15, 169.15,
 TRUE, TRUE, FALSE,
 'Vroom! Cars and Trucks Colouring Book — 45 Vehicle Pages for Kids',
 'Exciting vehicle colouring book with 45 pages of cars, trucks, and more. Perfect for kids aged 4-9.'),

(2, 'Trains Around the World', 'trains-around-the-world',
 'All aboard! This 40-page colouring book takes children on a journey around the world featuring steam trains, bullet trains, subway trains, and more.',
 '40 train-themed colouring pages from around the world',
 '5-10', 40, 'English', 199.00, 0, 199.00,
 FALSE, TRUE, FALSE,
 'Trains Around the World Colouring Book — 40 Pages for Kids 5-10',
 'Train-themed colouring book with 40 pages featuring trains from around the world.'),

-- Princess
(3, 'Royal Princess Kingdom Colouring Book', 'royal-princess-kingdom-colouring',
 'Enter the magical world of princesses with 55 enchanting pages featuring beautiful princesses, castles, magical creatures, fairy godmothers, and royal balls. A dream colouring book for every little princess.',
 '55 enchanting princess and fairy tale pages',
 '4-9', 55, 'English', 299.00, 25, 224.25,
 TRUE, TRUE, FALSE,
 'Royal Princess Kingdom Colouring Book — 55 Magical Pages for Girls',
 'Beautiful princess colouring book with 55 enchanting pages. Perfect for girls aged 4-9.'),

(3, 'Fairy Garden Magic', 'fairy-garden-magic',
 'Step into a magical fairy garden with 40 whimsical pages featuring fairies, butterflies, flowers, and magical woodland creatures.',
 '40 whimsical fairy garden colouring pages',
 '3-7', 40, 'English', 199.00, 0, 199.00,
 FALSE, TRUE, FALSE,
 'Fairy Garden Magic Colouring Book — 40 Whimsical Pages for Kids',
 'Fairy-themed colouring book with 40 magical pages perfect for children aged 3-7.'),

-- Alphabet & Numbers
(4, 'ABC Alphabet Adventure', 'abc-alphabet-adventure',
 'Make learning the alphabet exciting with 52 beautifully illustrated pages — one for each letter in uppercase and lowercase. Each letter comes with a fun animal or object starting with that letter.',
 '52 alphabet pages — learn letters while colouring!',
 '2-6', 52, 'English', 249.00, 20, 199.20,
 TRUE, TRUE, FALSE,
 'ABC Alphabet Adventure Colouring Book — Learn Letters with Fun!',
 'Educational alphabet colouring book with 52 pages helping kids aged 2-6 learn their ABCs.'),

(4, '123 Numbers Fun Colouring', '123-numbers-fun-colouring',
 'Learn numbers 1 to 100 through fun and engaging colouring activities. Each number page features count-and-colour activities that make math fun.',
 '50 pages of numbers, counting, and colouring fun',
 '3-7', 50, 'English', 199.00, 0, 199.00,
 FALSE, TRUE, FALSE,
 '123 Numbers Fun Colouring Book — Learn Counting with Colours',
 'Number learning colouring book with 50 interactive pages for kids aged 3-7.'),

-- Festival
(7, 'Diwali Festival Colouring Book', 'diwali-festival-colouring',
 'Celebrate the Festival of Lights with 35 beautiful Diwali-themed colouring pages featuring diyas, rangoli, fireworks, Lord Ganesha, and Lakshmi. Perfect for the festive season.',
 '35 beautiful Diwali-themed pages — celebrate with colours!',
 '4-12', 35, 'English', 149.00, 0, 149.00,
 FALSE, TRUE, FALSE,
 'Diwali Festival Colouring Book — 35 Festive Pages for Kids',
 'Celebrate Diwali with 35 beautiful colouring pages featuring diyas, rangoli, and more.'),

(7, 'Christmas Wonderland Colouring', 'christmas-wonderland-colouring',
 'Get into the Christmas spirit with 40 festive pages featuring Santa Claus, reindeer, Christmas trees, snowmen, and holiday decorations.',
 '40 festive Christmas colouring pages for the holiday season',
 '3-10', 40, 'English', 199.00, 20, 159.20,
 TRUE, TRUE, FALSE,
 'Christmas Wonderland Colouring Book — 40 Festive Pages for Kids',
 'Christmas colouring book with 40 festive holiday pages. Perfect for kids during the Christmas season.'),

-- Dinosaurs
(8, 'Dino World Adventure', 'dino-world-adventure',
 'ROAR! Travel back 65 million years with 45 action-packed dinosaur colouring pages featuring T-Rex, Triceratops, Brachiosaurus, Stegosaurus, and many more prehistoric creatures.',
 '45 exciting dinosaur pages for little palaeontologists',
 '5-12', 45, 'English', 249.00, 10, 224.10,
 TRUE, TRUE, FALSE,
 'Dino World Adventure Colouring Book — 45 Dinosaur Pages for Kids',
 'Exciting dinosaur colouring book with 45 pages featuring T-Rex, Triceratops and more. For kids aged 5-12.'),

-- Space
(9, 'Space Explorer Colouring Book', 'space-explorer-colouring',
 'Blast off into outer space with 40 out-of-this-world colouring pages featuring astronauts, rockets, planets, stars, aliens, and the International Space Station.',
 '40 space-themed pages — explore the universe!',
 '5-12', 40, 'English', 249.00, 15, 211.65,
 TRUE, TRUE, FALSE,
 'Space Explorer Colouring Book — 40 Outer Space Pages for Kids',
 'Space-themed colouring book with 40 pages featuring planets, rockets and astronauts for kids aged 5-12.'),

-- Superheroes
(6, 'Little Superheroes Colouring Book', 'little-superheroes-colouring',
 'Unleash your inner superhero with 45 action-packed pages featuring original kid superhero characters with amazing powers and awesome costumes.',
 '45 action-packed original superhero colouring pages',
 '4-10', 45, 'English', 249.00, 20, 199.20,
 FALSE, TRUE, FALSE,
 'Little Superheroes Colouring Book — 45 Action Pages for Kids',
 'Original superhero colouring book with 45 exciting pages for kids aged 4-10.'),

-- Mandala
(10, 'Beautiful Mandala Colouring Book Vol. 1', 'beautiful-mandala-vol-1',
 'Discover the therapeutic joy of mandala colouring with 30 intricate, beautifully designed mandala patterns. Suitable for older kids and adults who love detailed colouring.',
 '30 intricate mandala patterns for meditative colouring',
 '8+', 30, 'English', 299.00, 0, 299.00,
 FALSE, TRUE, FALSE,
 'Beautiful Mandala Colouring Book Vol. 1 — 30 Intricate Patterns',
 'Mandala colouring book with 30 beautiful intricate patterns for older kids and adults aged 8+.'),

-- Nature
(5, 'Garden of Flowers Colouring Book', 'garden-of-flowers-colouring',
 'Explore a beautiful garden with 45 pages of stunning flowers, butterflies, bees, and garden scenes. A perfect introduction to the natural world for young artists.',
 '45 beautiful flower and garden colouring pages',
 '4-10', 45, 'English', 199.00, 10, 179.10,
 FALSE, TRUE, FALSE,
 'Garden of Flowers Colouring Book — 45 Nature Pages for Kids',
 'Nature and flowers colouring book with 45 beautiful garden pages for kids aged 4-10.'),

-- Free books
(1, 'My First Animal Colouring — FREE Sample', 'my-first-animal-colouring-free',
 'A FREE 10-page sample colouring book featuring simple, cute animals perfect for toddlers. Introduce your little one to the joy of colouring!',
 'FREE! 10 simple animal pages for toddlers',
 '2-4', 10, 'English', 0.00, 0, 0.00,
 TRUE, TRUE, TRUE,
 'FREE Animal Colouring Book Sample — 10 Pages for Toddlers',
 'Download this FREE 10-page animal colouring book sample. Perfect for toddlers aged 2-4.'),

(2, 'Vehicles Starter Pack — FREE Sample', 'vehicles-starter-pack-free',
 'A FREE 8-page starter colouring book featuring simple vehicles including a car, bus, train, and aeroplane. Great for young vehicle enthusiasts!',
 'FREE! 8 simple vehicle pages for beginners',
 '3-6', 8, 'English', 0.00, 0, 0.00,
 FALSE, TRUE, TRUE,
 'FREE Vehicles Starter Colouring Pack — 8 Pages for Kids',
 'Download this FREE 8-page vehicle colouring book. Perfect for children aged 3-6.'),

-- More books
(3, 'Mermaid Dreams Colouring Book', 'mermaid-dreams-colouring',
 'Dive into an underwater fantasy world with 45 stunning mermaid colouring pages featuring mermaids, sea creatures, coral reefs, and underwater kingdoms.',
 '45 magical mermaid and underwater pages',
 '4-10', 45, 'English', 249.00, 15, 211.65,
 TRUE, TRUE, FALSE,
 'Mermaid Dreams Colouring Book — 45 Magical Underwater Pages',
 'Magical mermaid colouring book with 45 stunning underwater pages for kids aged 4-10.'),

(8, 'Baby Dinosaurs Colouring Book', 'baby-dinosaurs-colouring',
 'Cute, friendly baby dinosaur colouring pages designed especially for toddlers and young children. 30 adorable pages with simple, bold lines.',
 '30 cute baby dinosaur pages for toddlers',
 '2-5', 30, 'English', 149.00, 0, 149.00,
 FALSE, TRUE, FALSE,
 'Baby Dinosaurs Colouring Book — 30 Cute Pages for Toddlers',
 'Adorable baby dinosaur colouring book with 30 simple pages perfect for toddlers aged 2-5.');

-- ============================================================
-- SAMPLE COUPONS
-- ============================================================
INSERT INTO coupons (code, description, discount_type, discount_value, min_order_amount, max_discount_amount, max_uses, valid_from, valid_until, is_active) VALUES
('WELCOME10', 'Welcome discount — 10% off your first order', 'PERCENT', 10.00, 99.00, 50.00, NULL, '2024-01-01 00:00:00', '2025-12-31 23:59:59', TRUE),
('FLAT50', 'Flat ₹50 off on orders above ₹300', 'FLAT', 50.00, 300.00, NULL, 500, '2024-01-01 00:00:00', '2025-12-31 23:59:59', TRUE),
('DIWALI25', 'Diwali Special — 25% off everything', 'PERCENT', 25.00, 150.00, 100.00, 200, '2024-10-01 00:00:00', '2024-11-15 23:59:59', FALSE),
('KIDSFUN20', '20% off on any purchase', 'PERCENT', 20.00, 0.00, 75.00, NULL, '2024-01-01 00:00:00', '2025-12-31 23:59:59', TRUE);

-- ============================================================
-- SAMPLE REVIEWS (approved)
-- ============================================================
-- Note: These reference book IDs 1-5. Insert after books are inserted.
-- In production, reviews come from actual customers.
-- These are seeded for demo purposes only.

-- ============================================================
-- Verify data
-- ============================================================
SELECT 'Database seeded successfully!' AS status;
SELECT COUNT(*) AS total_categories FROM categories;
SELECT COUNT(*) AS total_books FROM books;
SELECT COUNT(*) AS total_coupons FROM coupons;
SELECT COUNT(*) AS total_users FROM users;
