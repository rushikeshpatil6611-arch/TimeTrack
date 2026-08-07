const { pool } = require('../config/database');

const getSettings = async (req, res, next) => {
  try {
    const [rows] = await pool.execute('SELECT key_name, value, description FROM settings');
    const settings = {};
    rows.forEach(r => { settings[r.key_name] = { value: r.value, description: r.description }; });
    res.json({ success: true, data: settings });
  } catch (err) { next(err); }
};

const updateSettings = async (req, res, next) => {
  try {
    const updates = req.body; // { key: value, ... }
    for (const [key, value] of Object.entries(updates)) {
      await pool.execute(
        'INSERT INTO settings (key_name, value, updated_by) VALUES (?,?,?) ON DUPLICATE KEY UPDATE value=?, updated_by=?',
        [key, String(value), req.user.id, String(value), req.user.id]
      );
    }
    res.json({ success: true, message: 'Settings updated' });
  } catch (err) { next(err); }
};

module.exports = { getSettings, updateSettings };
