-- Reset the ID sequence for the users table
SELECT setval('users_id_seq', (SELECT MAX(id) FROM users), true); 