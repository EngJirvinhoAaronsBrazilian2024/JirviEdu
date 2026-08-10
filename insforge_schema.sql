-- Insforge Database Schema setup and update script
-- You can run this in your Insforge/Supabase SQL Editor safely.
-- It uses "IF NOT EXISTS" so it won't drop your existing data.

-- Core Users
CREATE TABLE IF NOT EXISTS admins (
    id TEXT PRIMARY KEY,
    email TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS teachers (
    id TEXT PRIMARY KEY,
    reg_number TEXT,
    full_name TEXT,
    email TEXT,
    assigned_modules JSONB DEFAULT '[]'::jsonb,
    status TEXT DEFAULT 'active',
    photo_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS teacher_passwords (
    id TEXT PRIMARY KEY,
    password_hash TEXT
);

CREATE TABLE IF NOT EXISTS students (
    id TEXT PRIMARY KEY,
    reg_number TEXT,
    full_name TEXT,
    email TEXT,
    course TEXT,
    year INTEGER,
    status TEXT DEFAULT 'active',
    photo_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS student_passwords (
    id TEXT PRIMARY KEY,
    password_hash TEXT
);

-- Core Entities
CREATE TABLE IF NOT EXISTS modules (
    id TEXT PRIMARY KEY,
    name TEXT,
    code TEXT,
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS enrollments (
    student_id TEXT,
    module_id TEXT,
    enrolled_at TIMESTAMPTZ DEFAULT NOW(),
    PRIMARY KEY (student_id, module_id)
);

CREATE TABLE IF NOT EXISTS lectures (
    id TEXT PRIMARY KEY,
    module_id TEXT,
    title TEXT,
    meet_link TEXT,
    date TEXT,
    time TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS assignments (
    id TEXT PRIMARY KEY,
    module_id TEXT,
    title TEXT,
    description TEXT,
    start_time TIMESTAMPTZ,
    deadline TIMESTAMPTZ,
    marks INTEGER,
    file_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS submissions (
    student_id TEXT,
    assignment_id TEXT,
    module_id TEXT,
    file_url TEXT,
    submitted_at TIMESTAMPTZ DEFAULT NOW(),
    grade INTEGER,
    feedback TEXT,
    PRIMARY KEY (student_id, assignment_id)
);

CREATE TABLE IF NOT EXISTS learning_materials (
    id TEXT PRIMARY KEY,
    module_id TEXT,
    title TEXT,
    file_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS announcements (
    id TEXT PRIMARY KEY,
    module_id TEXT,
    title TEXT,
    content TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS notifications (
    id TEXT PRIMARY KEY,
    user_id TEXT,
    title TEXT,
    message TEXT,
    read BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS activity_logs (
    id TEXT PRIMARY KEY,
    action TEXT,
    details TEXT,
    user_id TEXT,
    user_type TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
