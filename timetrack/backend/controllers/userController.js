const bcrypt = require('bcryptjs');
const { pool } = require('../config/database');

const safeUser = (u) => { const { password, ...rest } = u; return rest; };

// GET /api/users  (admin)
const getUsers = async (req, res, next) => {
  try {
    const { page=1, limit=20, search='', is_active } = req.query;
    const offset = (parseInt(page)-1)*parseInt(limit);
    const params = [];
    let where = '';
    if (search) { where += ' WHERE (u.name LIKE ? OR u.email LIKE ? OR u.department LIKE ?)'; params.push(`%${search}%`,`%${search}%`,`%${search}%`); }
    if (is_active !== undefined) { where += (where?' AND ':' WHERE ') + 'u.is_active=?'; params.push(is_active); }

    const [rows] = await pool.execute(
      `SELECT u.id,u.name,u.email,u.department,u.position,u.phone,u.avatar,u.is_active,u.last_login,u.created_at,r.name as role
       FROM users u JOIN roles r ON u.role_id=r.id ${where} ORDER BY u.created_at DESC LIMIT ${parseInt(limit)} OFFSET ${offset}`,
      params
    );
    const [[{total}]] = await pool.execute(`SELECT COUNT(*) as total FROM users u ${where}`, params);
    res.json({ success:true, data:rows, pagination:{page:parseInt(page),limit:parseInt(limit),total} });
  } catch(err){ next(err); }
};

// GET /api/users/:id
const getUser = async (req, res, next) => {
  try {
    const id = req.user.role==='admin' ? req.params.id : req.user.id;
    const [rows] = await pool.execute(
      'SELECT u.id,u.name,u.email,u.department,u.position,u.phone,u.avatar,u.is_active,u.last_login,u.created_at,r.name as role FROM users u JOIN roles r ON u.role_id=r.id WHERE u.id=?',
      [id]
    );
    if(!rows.length) return res.status(404).json({success:false,message:'User not found'});
    res.json({success:true,data:rows[0]});
  } catch(err){ next(err); }
};

// PUT /api/users/:id
const updateUser = async (req, res, next) => {
  try {
    const id = req.user.role==='admin' ? req.params.id : req.user.id;
    const { name, department, position, phone, avatar } = req.body;
    await pool.execute(
      'UPDATE users SET name=?, department=?, position=?, phone=?, avatar=? WHERE id=?',
      [name, department||null, position||null, phone||null, avatar||null, id]
    );
    const [rows] = await pool.execute(
      'SELECT u.id,u.name,u.email,u.department,u.position,u.phone,u.avatar,r.name as role FROM users u JOIN roles r ON u.role_id=r.id WHERE u.id=?',
      [id]
    );
    res.json({success:true,message:'Profile updated',data:rows[0]});
  } catch(err){ next(err); }
};

// PATCH /api/users/:id/toggle-status  (admin)
const toggleUserStatus = async (req, res, next) => {
  try {
    const [rows] = await pool.execute('SELECT is_active FROM users WHERE id=?',[req.params.id]);
    if(!rows.length) return res.status(404).json({success:false,message:'User not found'});
    const newStatus = rows[0].is_active ? 0 : 1;
    await pool.execute('UPDATE users SET is_active=? WHERE id=?',[newStatus,req.params.id]);
    res.json({success:true,message:`User ${newStatus?'activated':'deactivated'}`,data:{is_active:newStatus}});
  } catch(err){ next(err); }
};

// DELETE /api/users/:id  (admin)
const deleteUser = async (req, res, next) => {
  try {
    if(parseInt(req.params.id)===req.user.id) return res.status(400).json({success:false,message:'Cannot delete your own account'});
    const [result] = await pool.execute('DELETE FROM users WHERE id=?',[req.params.id]);
    if(!result.affectedRows) return res.status(404).json({success:false,message:'User not found'});
    res.json({success:true,message:'User deleted'});
  } catch(err){ next(err); }
};

// POST /api/users  (admin create)
const createUser = async (req, res, next) => {
  try {
    const { name, email, password, role_id=2, department, position } = req.body;
    const [existing] = await pool.execute('SELECT id FROM users WHERE email=?',[email]);
    if(existing.length) return res.status(409).json({success:false,message:'Email already registered'});
    const hash = await bcrypt.hash(password, 12);
    const [result] = await pool.execute(
      'INSERT INTO users (role_id,name,email,password,department,position) VALUES (?,?,?,?,?,?)',
      [role_id,name,email,hash,department||null,position||null]
    );
    const [rows] = await pool.execute(
      'SELECT u.id,u.name,u.email,u.department,u.position,u.is_active,r.name as role FROM users u JOIN roles r ON u.role_id=r.id WHERE u.id=?',
      [result.insertId]
    );
    res.status(201).json({success:true,message:'User created',data:rows[0]});
  } catch(err){ next(err); }
};

module.exports = { getUsers, getUser, updateUser, toggleUserStatus, deleteUser, createUser };
