const { pool } = require('../config/database');

const getReports = async (req, res, next) => {
  try {
    const userId = req.user.role==='admin' && req.query.userId ? req.query.userId : req.user.id;
    const { type='weekly', from, to } = req.query;

    let startDate, endDate;
    const now = new Date();
    if(from && to){ startDate=from; endDate=to; }
    else if(type==='daily'){ startDate=endDate=now.toISOString().split('T')[0]; }
    else if(type==='monthly'){
      startDate=new Date(now.getFullYear(),now.getMonth(),1).toISOString().split('T')[0];
      endDate=new Date(now.getFullYear(),now.getMonth()+1,0).toISOString().split('T')[0];
    } else {
      const day=now.getDay(); const diff=now.getDate()-day+(day===0?-6:1);
      startDate=new Date(now.setDate(diff)).toISOString().split('T')[0];
      endDate=new Date(now.setDate(diff+6)).toISOString().split('T')[0];
    }

    const isAdmin = req.user.role==='admin' && !req.query.userId;
    const userFilter = isAdmin ? '' : 'AND s.user_id=?';
    const params = isAdmin ? [startDate, endDate] : [startDate, endDate, userId];

    const [sessions] = await pool.execute(
      `SELECT s.*,c.name as category_name,c.color,u.name as user_name
       FROM sessions s LEFT JOIN categories c ON s.category_id=c.id LEFT JOIN users u ON s.user_id=u.id
       WHERE DATE(s.start_time) BETWEEN ? AND ? ${userFilter} AND s.status='completed'
       ORDER BY s.start_time DESC`, params
    );

    const [[summary]] = await pool.execute(
      `SELECT COUNT(*) as total_sessions, COALESCE(SUM(total_duration),0) as total_seconds,
       AVG(NULLIF(productivity_score, 0)) as avg_productivity
       FROM sessions s WHERE DATE(start_time) BETWEEN ? AND ? ${userFilter} AND status='completed'`, params
    );

    const [byDay] = await pool.execute(
      `SELECT DATE(start_time) as date, COUNT(*) as sessions, COALESCE(SUM(total_duration),0) as seconds
       FROM sessions s WHERE DATE(start_time) BETWEEN ? AND ? ${userFilter} AND status='completed'
       GROUP BY DATE(start_time) ORDER BY date ASC`, params
    );

    const [byCategory] = await pool.execute(
      `SELECT c.name, c.color, COUNT(*) as sessions, COALESCE(SUM(s.total_duration),0) as seconds
       FROM sessions s LEFT JOIN categories c ON s.category_id=c.id
       WHERE DATE(s.start_time) BETWEEN ? AND ? ${userFilter} AND s.status='completed'
       GROUP BY s.category_id,c.name,c.color ORDER BY seconds DESC`, params
    );

    res.json({ success:true, data:{ sessions, summary, by_day:byDay, by_category:byCategory, period:{start:startDate,end:endDate,type} } });
  } catch(err){ next(err); }
};

module.exports = { getReports };
