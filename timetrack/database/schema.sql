

CREATE DATABASE IF NOT EXISTS timetrack_db DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE timetrack_db;

-- Roles Table
CREATE TABLE IF NOT EXISTS roles (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(50) NOT NULL UNIQUE,
  description VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Users Table
CREATE TABLE IF NOT EXISTS users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  role_id INT NOT NULL DEFAULT 2,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(150) NOT NULL UNIQUE,
  password VARCHAR(255) NOT NULL,
  avatar VARCHAR(255) DEFAULT NULL,
  department VARCHAR(100) DEFAULT NULL,
  position VARCHAR(100) DEFAULT NULL,
  phone VARCHAR(20) DEFAULT NULL,
  is_active TINYINT(1) DEFAULT 1,
  last_login TIMESTAMP NULL,
  reset_token VARCHAR(255) DEFAULT NULL,
  reset_token_expiry TIMESTAMP NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE RESTRICT,
  INDEX idx_email (email),
  INDEX idx_role_id (role_id),
  INDEX idx_is_active (is_active)
);

-- Categories Table
CREATE TABLE IF NOT EXISTS categories (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  color VARCHAR(7) DEFAULT '#6366f1',
  icon VARCHAR(50) DEFAULT 'briefcase',
  description VARCHAR(255) DEFAULT NULL,
  is_active TINYINT(1) DEFAULT 1,
  created_by INT DEFAULT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
);

-- Sessions Table
CREATE TABLE IF NOT EXISTS sessions (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  category_id INT DEFAULT NULL,
  title VARCHAR(255) DEFAULT 'Work Session',
  notes TEXT,
  start_time TIMESTAMP NOT NULL,
  end_time TIMESTAMP NULL,
  pause_duration INT DEFAULT 0 COMMENT 'Total pause duration in seconds',
  total_duration INT DEFAULT 0 COMMENT 'Total worked duration in seconds',
  status ENUM('active','paused','completed','cancelled') DEFAULT 'active',
  productivity_score TINYINT DEFAULT NULL COMMENT '1-10 score',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE SET NULL,
  INDEX idx_user_id (user_id),
  INDEX idx_status (status),
  INDEX idx_start_time (start_time)
);

-- Session Pauses Table (track individual pauses)
CREATE TABLE IF NOT EXISTS session_pauses (
  id INT AUTO_INCREMENT PRIMARY KEY,
  session_id INT NOT NULL,
  pause_start TIMESTAMP NOT NULL,
  pause_end TIMESTAMP NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (session_id) REFERENCES sessions(id) ON DELETE CASCADE
);

-- Reports Table
CREATE TABLE IF NOT EXISTS reports (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  generated_by INT DEFAULT NULL,
  report_type ENUM('daily','weekly','monthly','custom') DEFAULT 'daily',
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  total_hours DECIMAL(10,2) DEFAULT 0,
  total_sessions INT DEFAULT 0,
  avg_productivity DECIMAL(4,2) DEFAULT 0,
  report_data JSON,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (generated_by) REFERENCES users(id) ON DELETE SET NULL
);

-- Alerts Table
CREATE TABLE IF NOT EXISTS alerts (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  type ENUM('break_reminder','missing_hours','overtime','inactivity','custom') NOT NULL,
  title VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  is_read TINYINT(1) DEFAULT 0,
  severity ENUM('info','warning','error','success') DEFAULT 'info',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_user_read (user_id, is_read)
);

-- Activity Logs Table
CREATE TABLE IF NOT EXISTS activity_logs (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT DEFAULT NULL,
  action VARCHAR(100) NOT NULL,
  entity_type VARCHAR(50) DEFAULT NULL,
  entity_id INT DEFAULT NULL,
  details JSON DEFAULT NULL,
  ip_address VARCHAR(45) DEFAULT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
  INDEX idx_user_id (user_id),
  INDEX idx_created_at (created_at)
);

-- Settings Table
CREATE TABLE IF NOT EXISTS settings (
  id INT AUTO_INCREMENT PRIMARY KEY,
  key_name VARCHAR(100) NOT NULL UNIQUE,
  value TEXT DEFAULT NULL,
  description VARCHAR(255) DEFAULT NULL,
  updated_by INT DEFAULT NULL,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (updated_by) REFERENCES users(id) ON DELETE SET NULL
);

-- =====================
-- Seed Data
-- =====================

-- Insert Roles
INSERT INTO roles (name, description) VALUES
('admin', 'System Administrator with full access'),
('user', 'Regular employee user');

-- Insert Default Settings
INSERT INTO settings (key_name, value, description) VALUES
('work_hours_per_day', '8', 'Expected work hours per day'),
('overtime_threshold', '9', 'Hours after which overtime alert triggers'),
('break_reminder_interval', '90', 'Minutes between break reminders'),
('inactivity_timeout', '30', 'Minutes of inactivity before alert'),
('company_name', 'TimeTrack Corp', 'Company name'),
('allow_registration', '1', 'Allow new user registration');

-- Insert Default Categories
INSERT INTO categories (name, color, icon, description) VALUES
('Coding', '#6366f1', 'code', 'Software development tasks'),
('Meetings', '#f59e0b', 'users', 'Team and client meetings'),
('Documentation', '#10b981', 'file-text', 'Writing docs and reports'),
('Testing', '#ef4444', 'check-circle', 'QA and testing activities'),
('Research', '#8b5cf6', 'search', 'Research and analysis'),
('Design', '#ec4899', 'pen-tool', 'UI/UX and graphic design'),
('Study', '#06b6d4', 'book', 'Learning and training'),
('Administration', '#64748b', 'settings', 'Administrative tasks');

-- Insert Default Admin User (password: Admin@123)
INSERT INTO users (role_id, name, email, password, department, position, is_active) VALUES
(1, 'System Admin', 'admin@timetrack.com', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBpj1SJnpVOEYG', 'Management', 'System Administrator', 1);

-- Note: Default admin password is Admin@123
-- Change immediately after first login!
