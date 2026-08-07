// reports.js
const r1 = require('express').Router();
const reportCtrl = require('../controllers/reportController');
const { authenticate } = require('../middleware/auth');
r1.use(authenticate);
r1.get('/', reportCtrl.getReports);
module.exports = r1;
