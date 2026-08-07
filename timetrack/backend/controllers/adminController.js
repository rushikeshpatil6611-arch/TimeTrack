const { pool } = require('../config/database');

// GET /api/admin/dashboard
const getDashboard = async (req, res, next) => {
  try {
    const [[totalUsers]] = await pool.execute('SELECT COUNT(*) as count FROM users WHERE role_id=2');
    const [[activeUsers]] = await pool.execute('SELECT COUNT(*) as count FROM users WHERE is_active=1 AND role_id=2');
    const [[activeSessions]] = await pool.execute("SELECT COUNT(*) as count FROM sessions WHERE status IN ('active','paused')");
    const [[todaySessions]] = await pool.execute("SELECT COUNT(*) as count, COALESCE(SUM(total_duration),0) as seconds FROM sessions WHERE DATE(start_time)=CURDATE()");
    const [[weekHours]] = await pool.execute("SELECT COALESCE(SUM(total_duration),0) as seconds FROM sessions WHERE YEARWEEK(start_time)=YEARWEEK(NOW()) AND status='completed'");
    const [[unreadAlerts]] = await pool.execute('SELECT COUNT(*) as count FROM alerts WHERE is_read=0');

    // Top performers this week
    const [topPerformers] = await pool.execute(
      `SELECT u.id,u.name,u.avatar,u.department,COALESCE(SUM(s.total_duration),0) as seconds, COUNT(s.id) as sessions
       FROM users u LEFT JOIN sessions s ON u.id=s.user_id AND YEARWEEK(s.start_time)=YEARWEEK(NOW()) AND s.status='completed'
       WHERE u.role_id=2 AND u.is_active=1 GROUP BY u.id ORDER BY seconds DESC LIMIT 5`
    );

    // Category usage
    const [categoryUsage] = await pool.execute(
      `SELECT c.name,c.color,COUNT(s.id) as sessions,COALESCE(SUM(s.total_duration),0) as seconds
       FROM categories c LEFT JOIN sessions s ON c.id=s.category_id AND s.status='completed'
       WHERE c.is_active=1 GROUP BY c.id ORDER BY sessions DESC LIMIT 8`
    );

    // Daily trend (last 14 days)
    const [dailyTrend] = await pool.execute(
      `SELECT DATE(start_time) as date, COUNT(*) as sessions, COALESCE(SUM(total_duration),0) as seconds
       FROM sessions WHERE start_time >= DATE_SUB(NOW(), INTERVAL 14 DAY) AND status='completed'
       GROUP BY DATE(start_time) ORDER BY date ASC`
    );

    // Recent activity logs
    const [recentActivity] = await pool.execute(
      `SELECT al.*, u.name as user_name FROM activity_logs al LEFT JOIN users u ON al.user_id=u.id
       ORDER BY al.created_at DESC LIMIT 10`
    );

    res.json({ success: true, data: {
      stats: {
        total_users: totalUsers.count, active_users: activeUsers.count,
        active_sessions: activeSessions.count, today_sessions: todaySessions.count,
        today_seconds: todaySessions.seconds, week_seconds: weekHours.seconds,
        unread_alerts: unreadAlerts.count
      },
      top_performers: topPerformers,
      category_usage: categoryUsage,
      daily_trend: dailyTrend,
      recent_activity: recentActivity
    }});
  } catch (err) { next(err); }
};

// GET /api/admin/live-sessions
const getLiveSessions = async (req, res, next) => {
  try {
    const [rows] = await pool.execute(
      `SELECT s.*,u.name as user_name,u.avatar,u.department,c.name as category_name,c.color as category_color
       FROM sessions s JOIN users u ON s.user_id=u.id LEFT JOIN categories c ON s.category_id=c.id
       WHERE s.status IN ('active','paused') ORDER BY s.start_time ASC`
    );
    res.json({ success: true, data: rows });
  } catch (err) { next(err); }
};

// GET /api/admin/analytics
const getAnalytics = async (req, res, next) => {
  try {
    const { period = '30' } = req.query;
    const days = parseInt(period);

    const [userGrowth] = await pool.execute(
      `SELECT DATE(created_at) as date, COUNT(*) as count FROM users
       WHERE created_at >= DATE_SUB(NOW(), INTERVAL ? DAY) GROUP BY DATE(created_at) ORDER BY date ASC`, [days]
    );
    const [sessionTrend] = await pool.execute(
      `SELECT DATE(start_time) as date, COUNT(*) as sessions, COALESCE(SUM(total_duration),0) as seconds,
       COALESCE(AVG(productivity_score),0) as avg_productivity
       FROM sessions WHERE start_time >= DATE_SUB(NOW(), INTERVAL ? DAY) AND status='completed'
       GROUP BY DATE(start_time) ORDER BY date ASC`, [days]
    );
    const [deptStats] = await pool.execute(
      `SELECT u.department, COUNT(DISTINCT u.id) as users, COUNT(s.id) as sessions, COALESCE(SUM(s.total_duration),0) as seconds
       FROM users u LEFT JOIN sessions s ON u.id=s.user_id AND s.status='completed'
       WHERE u.role_id=2 AND u.department IS NOT NULL GROUP BY u.department ORDER BY seconds DESC`
    );

    res.json({ success: true, data: { user_growth: userGrowth, session_trend: sessionTrend, dept_stats: deptStats } });
  } catch (err) { next(err); }
};

module.exports = { getDashboard, getLiveSessions, getAnalytics };
