const { pool } = require('../config/database');

// GET /api/sessions  — list user's sessions
const getSessions = async (req, res, next) => {
  try {
    const userId = req.user.role === 'admin' && req.query.userId ? req.query.userId : req.user.id;
    const { page = 1, limit = 20, status, category_id, from, to } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);

    let where = req.user.role === 'admin' && !req.query.userId ? '' : 'WHERE s.user_id = ?';
    const params = req.user.role === 'admin' && !req.query.userId ? [] : [userId];

    if (status)     { where += (where ? ' AND' : ' WHERE') + ' s.status = ?'; params.push(status); }
    if (category_id){ where += (where ? ' AND' : ' WHERE') + ' s.category_id = ?'; params.push(category_id); }
    if (from)       { where += (where ? ' AND' : ' WHERE') + ' DATE(s.start_time) >= ?'; params.push(from); }
    if (to)         { where += (where ? ' AND' : ' WHERE') + ' DATE(s.start_time) <= ?'; params.push(to); }

    const [rows] = await pool.execute(
      `SELECT s.*, c.name as category_name, c.color as category_color, u.name as user_name
       FROM sessions s
       LEFT JOIN categories c ON s.category_id = c.id
       LEFT JOIN users u ON s.user_id = u.id
       ${where} ORDER BY s.start_time DESC LIMIT ${parseInt(limit)} OFFSET ${offset}`,
      params
    );

    const [[{ total }]] = await pool.execute(
      `SELECT COUNT(*) as total FROM sessions s ${where}`, params
    );

    res.json({ success: true, data: rows, pagination: { page: parseInt(page), limit: parseInt(limit), total } });
  } catch (err) { next(err); }
};

// GET /api/sessions/active
const getActiveSession = async (req, res, next) => {
  try {
    const [rows] = await pool.execute(
      `SELECT s.*, c.name as category_name, c.color as category_color
       FROM sessions s LEFT JOIN categories c ON s.category_id = c.id
       WHERE s.user_id = ? AND s.status IN ('active','paused') ORDER BY s.start_time DESC LIMIT 1`,
      [req.user.id]
    );
    res.json({ success: true, data: rows[0] || null });
  } catch (err) { next(err); }
};

// POST /api/sessions/start
const startSession = async (req, res, next) => {
  try {
    const { category_id, title, notes } = req.body;
    // Check for existing active session
    const [active] = await pool.execute(
      "SELECT id FROM sessions WHERE user_id = ? AND status IN ('active','paused')", [req.user.id]
    );
    if (active.length) return res.status(409).json({ success: false, message: 'You already have an active session. Stop it first.' });

    const [result] = await pool.execute(
      'INSERT INTO sessions (user_id, category_id, title, notes, start_time, status) VALUES (?, ?, ?, ?, NOW(), ?)',
      [req.user.id, category_id || null, title || 'Work Session', notes || null, 'active']
    );
    const [rows] = await pool.execute(
      `SELECT s.*, c.name as category_name, c.color as category_color FROM sessions s LEFT JOIN categories c ON s.category_id=c.id WHERE s.id=?`,
      [result.insertId]
    );
    res.status(201).json({ success: true, message: 'Session started', data: rows[0] });
  } catch (err) { next(err); }
};

// PATCH /api/sessions/:id/stop
const stopSession = async (req, res, next) => {
  try {
    const [rows] = await pool.execute("SELECT * FROM sessions WHERE id = ? AND user_id = ?", [req.params.id, req.user.id]);
    if (!rows.length) return res.status(404).json({ success: false, message: 'Session not found' });
    if (rows[0].status === 'completed') return res.status(400).json({ success: false, message: 'Session already completed' });

    const session = rows[0];
    // Close any open pause
    await pool.execute("UPDATE session_pauses SET pause_end = NOW() WHERE session_id = ? AND pause_end IS NULL", [session.id]);

    // Calculate total pause duration
    const [[{ totalPause }]] = await pool.execute(
      "SELECT COALESCE(SUM(TIMESTAMPDIFF(SECOND, pause_start, COALESCE(pause_end, NOW()))), 0) as totalPause FROM session_pauses WHERE session_id = ?",
      [session.id]
    );
    const totalDuration = Math.max(0, Math.floor((Date.now() - new Date(session.start_time)) / 1000) - totalPause);
    const { productivity_score } = req.body;

    await pool.execute(
      'UPDATE sessions SET status=?, end_time=NOW(), pause_duration=?, total_duration=?, productivity_score=? WHERE id=?',
      ['completed', totalPause, totalDuration, productivity_score || null, session.id]
    );
    const [updated] = await pool.execute('SELECT * FROM sessions WHERE id=?', [session.id]);
    res.json({ success: true, message: 'Session stopped', data: updated[0] });
  } catch (err) { next(err); }
};

// PATCH /api/sessions/:id/pause
const pauseSession = async (req, res, next) => {
  try {
    const [rows] = await pool.execute("SELECT * FROM sessions WHERE id=? AND user_id=? AND status='active'", [req.params.id, req.user.id]);
    if (!rows.length) return res.status(404).json({ success: false, message: 'Active session not found' });

    await pool.execute('UPDATE sessions SET status=? WHERE id=?', ['paused', req.params.id]);
    await pool.execute('INSERT INTO session_pauses (session_id, pause_start) VALUES (?, NOW())', [req.params.id]);
    res.json({ success: true, message: 'Session paused' });
  } catch (err) { next(err); }
};

// PATCH /api/sessions/:id/resume
const resumeSession = async (req, res, next) => {
  try {
    const [rows] = await pool.execute("SELECT * FROM sessions WHERE id=? AND user_id=? AND status='paused'", [req.params.id, req.user.id]);
    if (!rows.length) return res.status(404).json({ success: false, message: 'Paused session not found' });

    await pool.execute("UPDATE session_pauses SET pause_end=NOW() WHERE session_id=? AND pause_end IS NULL", [req.params.id]);
    await pool.execute('UPDATE sessions SET status=? WHERE id=?', ['active', req.params.id]);
    res.json({ success: true, message: 'Session resumed' });
  } catch (err) { next(err); }
};

// GET /api/sessions/stats
const getStats = async (req, res, next) => {
  try {
    const userId = req.user.role === 'admin' && req.query.userId ? req.query.userId : req.user.id;
    const isAdmin = req.user.role === 'admin' && !req.query.userId;
    const userFilter = isAdmin ? '' : 'WHERE s.user_id = ?';
    const params = isAdmin ? [] : [userId];

    const [[today]] = await pool.execute(
      `SELECT COALESCE(SUM(total_duration),0) as seconds FROM sessions s ${userFilter ? userFilter + ' AND' : 'WHERE'} DATE(start_time)=CURDATE() AND status='completed'`,
      params
    );
    const [[week]] = await pool.execute(
      `SELECT COALESCE(SUM(total_duration),0) as seconds FROM sessions s ${userFilter ? userFilter + ' AND' : 'WHERE'} YEARWEEK(start_time)=YEARWEEK(NOW()) AND status='completed'`,
      params
    );
    const [[month]] = await pool.execute(
      `SELECT COALESCE(SUM(total_duration),0) as seconds FROM sessions s ${userFilter ? userFilter + ' AND' : 'WHERE'} MONTH(start_time)=MONTH(NOW()) AND YEAR(start_time)=YEAR(NOW()) AND status='completed'`,
      params
    );
    const [[total]] = await pool.execute(`SELECT COUNT(*) as count FROM sessions s ${userFilter}`, params);
    const [daily] = await pool.execute(
      `SELECT DATE(start_time) as date, COALESCE(SUM(total_duration),0) as seconds, COUNT(*) as sessions
       FROM sessions s ${userFilter ? userFilter + ' AND' : 'WHERE'} start_time >= DATE_SUB(NOW(), INTERVAL 30 DAY) AND status='completed'
       GROUP BY DATE(start_time) ORDER BY date ASC`,
      params
    );
    const [byCategory] = await pool.execute(
      `SELECT c.name, c.color, COALESCE(SUM(s.total_duration),0) as seconds, COUNT(*) as sessions
       FROM sessions s LEFT JOIN categories c ON s.category_id=c.id
       ${userFilter ? userFilter + ' AND' : 'WHERE'} s.status='completed'
       GROUP BY s.category_id, c.name, c.color ORDER BY seconds DESC LIMIT 8`,
      params
    );

    res.json({ success: true, data: {
      today_seconds: today.seconds, week_seconds: week.seconds,
      month_seconds: month.seconds, total_sessions: total.count,
      daily_trend: daily, by_category: byCategory
    }});
  } catch (err) { next(err); }
};

// DELETE /api/sessions/:id
const deleteSession = async (req, res, next) => {
  try {
    const filter = req.user.role === 'admin' ? 'WHERE id=?' : 'WHERE id=? AND user_id=?';
    const params = req.user.role === 'admin' ? [req.params.id] : [req.params.id, req.user.id];
    const [result] = await pool.execute(`DELETE FROM sessions ${filter}`, params);
    if (!result.affectedRows) return res.status(404).json({ success: false, message: 'Session not found' });
    res.json({ success: true, message: 'Session deleted' });
  } catch (err) { next(err); }
};

module.exports = { getSessions, getActiveSession, startSession, stopSession, pauseSession, resumeSession, getStats, deleteSession };
