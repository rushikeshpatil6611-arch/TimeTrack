const bcrypt  = require('bcryptjs');
const jwt     = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const { pool } = require('../config/database');

const generateToken = (user) =>
  jwt.sign({ id: user.id, email: user.email, role: user.role }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d'
  });

// POST /api/auth/register
const register = async (req, res, next) => {
  try {
    const { name, email, password, department, position } = req.body;

    const [existing] = await pool.execute('SELECT id FROM users WHERE email = ?', [email]);
    if (existing.length) return res.status(409).json({ success: false, message: 'Email already registered' });

    const hash = await bcrypt.hash(password, 12);
    const [result] = await pool.execute(
      'INSERT INTO users (role_id, name, email, password, department, position) VALUES (2, ?, ?, ?, ?, ?)',
      [name, email, hash, department || null, position || null]
    );

    await pool.execute(
      'INSERT INTO activity_logs (user_id, action, entity_type, entity_id) VALUES (?, ?, ?, ?)',
      [result.insertId, 'USER_REGISTERED', 'users', result.insertId]
    );

    const [users] = await pool.execute(
      'SELECT u.id, u.name, u.email, u.department, u.position, u.avatar, r.name as role FROM users u JOIN roles r ON u.role_id = r.id WHERE u.id = ?',
      [result.insertId]
    );

    const token = generateToken(users[0]);
    res.status(201).json({ success: true, message: 'Registration successful', data: { token, user: users[0] } });
  } catch (err) { next(err); }
};

// POST /api/auth/login
const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    const [rows] = await pool.execute(
      'SELECT u.*, r.name as role FROM users u JOIN roles r ON u.role_id = r.id WHERE u.email = ?',
      [email]
    );
    if (!rows.length) return res.status(401).json({ success: false, message: 'Invalid credentials' });

    const user = rows[0];
    if (!user.is_active) return res.status(403).json({ success: false, message: 'Account is deactivated' });

    const match = await bcrypt.compare(password, user.password);
    if (!match) return res.status(401).json({ success: false, message: 'Invalid credentials' });

    await pool.execute('UPDATE users SET last_login = NOW() WHERE id = ?', [user.id]);
    await pool.execute(
      'INSERT INTO activity_logs (user_id, action, ip_address) VALUES (?, ?, ?)',
      [user.id, 'USER_LOGIN', req.ip]
    );

    const { password: _, ...safeUser } = user;
    const token = generateToken(safeUser);
    res.json({ success: true, message: 'Login successful', data: { token, user: safeUser } });
  } catch (err) { next(err); }
};

// POST /api/auth/forgot-password
const forgotPassword = async (req, res, next) => {
  try {
    const { email } = req.body;
    const [rows] = await pool.execute('SELECT id FROM users WHERE email = ?', [email]);
    // Always return success to prevent email enumeration
    if (!rows.length) return res.json({ success: true, message: 'If the email exists, a reset link was sent' });

    const token  = uuidv4();
    const expiry = new Date(Date.now() + 3600000); // 1 hour
    await pool.execute('UPDATE users SET reset_token = ?, reset_token_expiry = ? WHERE email = ?', [token, expiry, email]);

    // In production: send email. For now, return token in response (dev only).
    res.json({
      success: true,
      message: 'Password reset token generated',
      data: process.env.NODE_ENV === 'development' ? { reset_token: token } : undefined
    });
  } catch (err) { next(err); }
};

// POST /api/auth/reset-password
const resetPassword = async (req, res, next) => {
  try {
    const { token, password } = req.body;
    const [rows] = await pool.execute(
      'SELECT id FROM users WHERE reset_token = ? AND reset_token_expiry > NOW()',
      [token]
    );
    if (!rows.length) return res.status(400).json({ success: false, message: 'Invalid or expired reset token' });

    const hash = await bcrypt.hash(password, 12);
    await pool.execute('UPDATE users SET password = ?, reset_token = NULL, reset_token_expiry = NULL WHERE id = ?', [hash, rows[0].id]);
    res.json({ success: true, message: 'Password reset successful' });
  } catch (err) { next(err); }
};

// GET /api/auth/me
const getMe = async (req, res, next) => {
  try {
    const [rows] = await pool.execute(
      'SELECT u.id,u.name,u.email,u.department,u.position,u.phone,u.avatar,u.last_login,u.created_at,r.name as role FROM users u JOIN roles r ON u.role_id=r.id WHERE u.id=?',
      [req.user.id]
    );
    if (!rows.length) return res.status(404).json({ success: false, message: 'User not found' });
    res.json({ success: true, data: rows[0] });
  } catch (err) { next(err); }
};

// POST /api/auth/change-password
const changePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const [rows] = await pool.execute('SELECT password FROM users WHERE id = ?', [req.user.id]);
    const match = await bcrypt.compare(currentPassword, rows[0].password);
    if (!match) return res.status(400).json({ success: false, message: 'Current password is incorrect' });

    const hash = await bcrypt.hash(newPassword, 12);
    await pool.execute('UPDATE users SET password = ? WHERE id = ?', [hash, req.user.id]);
    res.json({ success: true, message: 'Password changed successfully' });
  } catch (err) { next(err); }
};

module.exports = { register, login, forgotPassword, resetPassword, getMe, changePassword };
