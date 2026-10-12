-- =============================================================================
-- Prayaas Gurukul — Seed Data for Classes, Admin, and Initial Content
-- =============================================================================

-- 1. Insert Mandatory Classes
INSERT INTO `classes` (`id`, `class_number`, `display_name`) VALUES
(1, 6, 'Class 6'),
(2, 9, 'Class 9'),
(3, 10, 'Class 10')
ON DUPLICATE KEY UPDATE `display_name` = VALUES(`display_name`);

-- 2. Insert Default SuperAdmin (Default Pass: admin@prayaas2026)
-- Hash generated via password_hash('admin@prayaas2026', PASSWORD_BCRYPT)
INSERT INTO `admins` (`id`, `username`, `full_name`, `password_hash`, `role`, `status`) VALUES
(1, 'admin', 'Prayaas Administrator', '$2y$10$vDdQdK89gqM0k6bS1x8F2eH2XFz2jUqvIu6yM66t42f6wH9aK6jX6', 'superadmin', 'active')
ON DUPLICATE KEY UPDATE `full_name` = VALUES(`full_name`);

-- 3. Insert Default Students (Password: student123)
-- Hash generated via password_hash('student123', PASSWORD_BCRYPT)
INSERT INTO `students` (`id`, `student_code`, `name`, `class_id`, `password_hash`, `status`) VALUES
(1, 'PG-10-108', 'Rahul Verma', 3, '$2y$10$7q5J7f0eHsm1LhN8R/45h.gV2QpW9eC1p3Y9D6dK4M1j6X2f.v2yK', 'active'),
(2, 'PG-10-101', 'Aarav Sharma', 3, '$2y$10$7q5J7f0eHsm1LhN8R/45h.gV2QpW9eC1p3Y9D6dK4M1j6X2f.v2yK', 'active'),
(3, 'PG-10-102', 'Isha Patel', 3, '$2y$10$7q5J7f0eHsm1LhN8R/45h.gV2QpW9eC1p3Y9D6dK4M1j6X2f.v2yK', 'active'),
(4, 'PG-09-204', 'Devansh Roy', 2, '$2y$10$7q5J7f0eHsm1LhN8R/45h.gV2QpW9eC1p3Y9D6dK4M1j6X2f.v2yK', 'active'),
(5, 'PG-06-310', 'Ananya Dixit', 1, '$2y$10$7q5J7f0eHsm1LhN8R/45h.gV2QpW9eC1p3Y9D6dK4M1j6X2f.v2yK', 'active')
ON DUPLICATE KEY UPDATE `name` = VALUES(`name`);

-- 4. Insert Initial Mock Tests
INSERT INTO `tests` (`id`, `title`, `class_id`, `subject`, `duration_min`, `total_marks`, `status`) VALUES
(1, 'Board Booster Science Mock Test #03', 3, 'Science', 30, 20, 'published'),
(2, 'Maths: Quadratic Equations & AP Blitz', 3, 'Mathematics', 45, 50, 'draft'),
(3, 'Class 9 Motion & Gravitation Test', 2, 'Physics', 25, 30, 'published'),
(4, 'Class 6 Basic Mathematics & Reasoning', 1, 'Maths', 20, 25, 'published')
ON DUPLICATE KEY UPDATE `title` = VALUES(`title`);

-- 5. Insert Sample Questions for Test #1 (Class 10 Science)
INSERT INTO `questions` (`test_id`, `sort_order`, `question_text`, `option_a`, `option_b`, `option_c`, `option_d`, `correct_option`, `explanation`) VALUES
(1, 1, 'Which of the following compounds gives a brisk effervescence with sodium bicarbonate solution?', 'Ethanol', 'Ethanoic Acid', 'Ethyl Ethanoate', 'Methane', 'B', 'Carboxylic acids like Ethanoic acid react with sodium bicarbonate to release CO2 gas causing brisk effervescence.'),
(1, 2, 'A ray of light passes from glass into water. What happens to its speed and direction?', 'Slows down and bends towards normal', 'Speeds up and bends away from normal', 'Slows down without deviation', 'Speeds up and bends towards normal', 'B', 'Water is optically rarer than glass, so light speeds up and bends away from normal.'),
(1, 3, 'The focal length of a concave mirror is 15 cm. At what distance should an object be placed to get an inverted image of the same size?', '15 cm', '30 cm', '60 cm', '7.5 cm', 'B', 'An inverted image of the same size is formed at the center of curvature (C = 2f = 30 cm).'),
(1, 4, 'Which gland secretes the hormone Calcitonin in the human body?', 'Pituitary gland', 'Thyroid gland', 'Adrenal gland', 'Pancreas', 'B', 'Calcitonin is produced by the parafollicular cells of the thyroid gland to regulate blood calcium levels.'),
(1, 5, 'What is the SI unit of electric resistivity (rho)?', 'Ohm', 'Ohm-meter', 'Ohm per meter', 'Volt-meter', 'B', 'Resistivity rho = R * A / l, having the unit Ohm * m^2 / m = Ohm-meter.');

-- 6. Insert Video Lectures
INSERT INTO `videos` (`title`, `youtube_id`, `class_id`, `subject`, `duration_label`, `sort_order`) VALUES
('Light: Reflection & Refraction Concept 01', 'kJQP7kiw5Fk', 3, 'Physics', '24 mins', 1),
('Chemical Reactions & Equations One Shot', 'L_LUpnjgPso', 3, 'Chemistry', '42 mins', 2),
('Force and Laws of Motion Masterclass', 'kJQP7kiw5Fk', 2, 'Physics', '32 mins', 1),
('Components of Food & Nutrients', 'L_LUpnjgPso', 1, 'Science', '18 mins', 1);

-- 7. Insert DPP Worksheets
INSERT INTO `dpps` (`title`, `file_path`, `file_size_label`, `class_id`, `subject`, `questions_count`) VALUES
('Electricity & Circuit Laws - DPP 04', 'uploads/dpp/dummy.pdf', '1.2 MB', 3, 'Physics', 15),
('Triangles & Coordinate Geometry DPP', 'uploads/dpp/dummy.pdf', '1.8 MB', 3, 'Maths', 20),
('Class 9 Matter In Our Surroundings DPP', 'uploads/dpp/dummy.pdf', '840 KB', 2, 'Chemistry', 12),
('Knowing Our Numbers Practice Sheet', 'uploads/dpp/dummy.pdf', '620 KB', 1, 'Maths', 10);

-- 8. Insert Notices
INSERT INTO `notifications` (`title`, `body`, `class_id`) VALUES
('Sunday Board Mock Test 03', 'Science Class 10 mock test begins at 10:00 AM this Sunday. Full syllabus revision test.', 3),
('New DPP Uploaded', 'Electricity DPP 04 solutions and practice set uploaded by Faculty.', 3),
('Weekly Rank Rebuild Complete', 'Weekly test rankings have been refreshed. Check the Gurukul Hall of Fame.', NULL);