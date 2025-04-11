
-- Create training tables
CREATE TABLE IF NOT EXISTS training_records (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id),
  training_title TEXT NOT NULL,
  training_type TEXT NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  trainer_id INTEGER REFERENCES users(id),
  department TEXT,
  feedback_score INTEGER,
  status TEXT DEFAULT 'pending',
  assessment_score INTEGER,
  effectiveness TEXT,
  notes TEXT
);

CREATE TABLE IF NOT EXISTS training_feedback (
  id SERIAL PRIMARY KEY,
  training_id INTEGER NOT NULL REFERENCES training_records(id),
  user_id INTEGER NOT NULL REFERENCES users(id),
  is_effective BOOLEAN,
  training_aids_good BOOLEAN,
  duration_sufficient BOOLEAN,
  content_explained BOOLEAN,
  conducted_properly BOOLEAN,
  learning_environment BOOLEAN,
  helpful_for_work BOOLEAN,
  additional_topics TEXT,
  key_learnings TEXT,
  special_observations TEXT
);

CREATE TABLE IF NOT EXISTS training_assessments (
  id SERIAL PRIMARY KEY,
  training_id INTEGER NOT NULL REFERENCES training_records(id),
  user_id INTEGER NOT NULL REFERENCES users(id),
  assessor_id INTEGER NOT NULL REFERENCES users(id),
  assessment_date DATE NOT NULL,
  total_score INTEGER,
  status TEXT,
  comments TEXT
);
