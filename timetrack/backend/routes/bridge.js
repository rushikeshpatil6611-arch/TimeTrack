const router = require('express').Router();
const axios  = require('axios');
const { authenticate, isAdmin } = require('../middleware/auth');

const BRIDGE_URL = process.env.BRIDGE_URL || 'http://localhost/timetrack/database_bridge.php';
const BRIDGE_KEY = process.env.BRIDGE_SECRET_KEY || 'timetrack_bridge_secret_2024';

// GET /api/bridge/ping — health check (public)
router.get('/ping', async (req, res, next) => {
  try {
    const response = await axios.get(`${BRIDGE_URL}?action=ping`, { timeout: 5000 });
    res.json({ success: true, bridge: response.data });
  } catch (err) {
    res.json({ success: false, message: 'PHP bridge unreachable', error: err.message });
  }
});

// GET /api/bridge/schema — check DB schema (admin only)
router.get('/schema', authenticate, isAdmin, async (req, res, next) => {
  try {
    const response = await axios.get(`${BRIDGE_URL}?action=check_schema`, {
      headers: { 'X-Bridge-Key': BRIDGE_KEY }, timeout: 5000
    });
    res.json({ success: true, data: response.data });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Bridge error', error: err.message });
  }
});

// GET /api/bridge/db-stats — DB statistics (admin only)
router.get('/db-stats', authenticate, isAdmin, async (req, res, next) => {
  try {
    const response = await axios.get(`${BRIDGE_URL}?action=db_stats`, {
      headers: { 'X-Bridge-Key': BRIDGE_KEY }, timeout: 5000
    });
    res.json({ success: true, data: response.data });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Bridge error', error: err.message });
  }
});

module.exports = router;
