-- Reset the ID sequence for the users table
SELECT setval('users_id_seq', (SELECT MAX(id) FROM users));

-- Reset the ID sequence for the departments table
SELECT setval('departments_id_seq', (SELECT MAX(id) FROM departments));

-- Reset the ID sequence for the positions table
SELECT setval('positions_id_seq', (SELECT MAX(id) FROM positions));

-- Reset the ID sequence for the employees table
SELECT setval('employees_id_seq', (SELECT MAX(id) FROM employees));

-- Reset the ID sequence for the attendance table
SELECT setval('attendance_id_seq', (SELECT MAX(id) FROM attendance));

-- Reset the ID sequence for the leaves table
SELECT setval('leaves_id_seq', (SELECT MAX(id) FROM leaves));

-- Reset the ID sequence for the payroll table
SELECT setval('payroll_id_seq', (SELECT MAX(id) FROM payroll));

-- Reset the ID sequence for the documents table
SELECT setval('documents_id_seq', (SELECT MAX(id) FROM documents));

-- Reset the ID sequence for the notifications table
SELECT setval('notifications_id_seq', (SELECT MAX(id) FROM notifications)); 