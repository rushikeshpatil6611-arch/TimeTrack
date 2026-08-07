const { pool } = require('../config/database');

const getCategories = async (req, res, next) => {
  try {
    const [rows] = await pool.execute(
      'SELECT c.*, u.name as created_by_name FROM categories c LEFT JOIN users u ON c.created_by=u.id WHERE c.is_active=1 ORDER BY c.name ASC'
    );
    res.json({ success: true, data: rows });
  } catch (err) { next(err); }
};

const createCategory = async (req, res, next) => {
  try {
    const { name, color='#6366f1', icon='briefcase', description } = req.body;
    const [result] = await pool.execute(
      'INSERT INTO categories (name, color, icon, description, created_by) VALUES (?,?,?,?,?)',
      [name, color, icon, description||null, req.user.id]
    );
    const [rows] = await pool.execute('SELECT * FROM categories WHERE id=?', [result.insertId]);
    res.status(201).json({ success: true, message: 'Category created', data: rows[0] });
  } catch (err) { next(err); }
};

const updateCategory = async (req, res, next) => {
  try {
    const { name, color, icon, description } = req.body;
    const [result] = await pool.execute(
      'UPDATE categories SET name=?, color=?, icon=?, description=? WHERE id=?',
      [name, color, icon, description||null, req.params.id]
    );
    if (!result.affectedRows) return res.status(404).json({ success: false, message: 'Category not found' });
    const [rows] = await pool.execute('SELECT * FROM categories WHERE id=?', [req.params.id]);
    res.json({ success: true, message: 'Category updated', data: rows[0] });
  } catch (err) { next(err); }
};

const deleteCategory = async (req, res, next) => {
  try {
    // Soft delete
    const [result] = await pool.execute('UPDATE categories SET is_active=0 WHERE id=?', [req.params.id]);
    if (!result.affectedRows) return res.status(404).json({ success: false, message: 'Category not found' });
    res.json({ success: true, message: 'Category deleted' });
  } catch (err) { next(err); }
};

module.exports = { getCategories, createCategory, updateCategory, deleteCategory };
