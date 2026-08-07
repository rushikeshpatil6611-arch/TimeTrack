const { pool } = require('../config/database');

const getAlerts = async (req, res, next) => {
  try {
    const userId = req.user.role === 'admin' ? (req.query.userId || req.user.id) : req.user.id;
    const [rows] = await pool.execute(
      'SELECT * FROM alerts WHERE user_id=? ORDER BY created_at DESC LIMIT 50', [userId]
    );
    const [[{count}]] = await pool.execute('SELECT COUNT(*) as count FROM alerts WHERE user_id=? AND is_read=0',[userId]);
    res.json({ success: true, data: rows, unread_count: count });
  } catch (err) { next(err); }
};

const markRead = async (req, res, next) => {
  try {
    await pool.execute('UPDATE alerts SET is_read=1 WHERE id=? AND user_id=?', [req.params.id, req.user.id]);
    res.json({ success: true, message: 'Alert marked as read' });
  } catch (err) { next(err); }
};

const markAllRead = async (req, res, next) => {
  try {
    await pool.execute('UPDATE alerts SET is_read=1 WHERE user_id=?', [req.user.id]);
    res.json({ success: true, message: 'All alerts marked as read' });
  } catch (err) { next(err); }
};

const createAlert = async (req, res, next) => {
  try {
    const { user_id, type, title, message, severity='info' } = req.body;
    const [result] = await pool.execute(
      'INSERT INTO alerts (user_id,type,title,message,severity) VALUES (?,?,?,?,?)',
      [user_id||req.user.id, type, title, message, severity]
    );
    res.status(201).json({ success: true, message: 'Alert created', data: { id: result.insertId } });
  } catch (err) { next(err); }
};

module.exports = { getAlerts, markRead, markAllRead, createAlert };
