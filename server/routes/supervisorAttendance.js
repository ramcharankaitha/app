const express = require('express');
const router = express.Router();
const { pool } = require('../config/database');

// Expected check-in time: 9:00 AM
const EXPECTED_CHECK_IN_HOUR = 9;
const EXPECTED_CHECK_IN_MINUTE = 0;

// Expected check-out time: 6:00 PM
const EXPECTED_CHECK_OUT_HOUR = 18;
const EXPECTED_CHECK_OUT_MINUTE = 0;

// Get all supervisor attendance for a specific date (for admin)
router.get('/all', async (req, res) => {
  try {
    const date = req.query.date || new Date().toISOString().split('T')[0];

    const result = await pool.query(
      `SELECT 
        a.*,
        u.first_name || ' ' || u.last_name as full_name,
        u.email,
        u.username,
        u.store_allocated
       FROM supervisor_attendance a
       JOIN users u ON a.supervisor_id = u.id
       WHERE a.attendance_date = $1
       ORDER BY a.check_in_time ASC`,
      [date]
    );

    res.json({ success: true, attendance: result.rows });
  } catch (error) {
    console.error('Get all supervisor attendance error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Export supervisor attendance as CSV
router.get('/export', async (req, res) => {
  try {
    const date = req.query.date || new Date().toISOString().split('T')[0];

    const result = await pool.query(
      `SELECT 
        u.first_name || ' ' || u.last_name as full_name,
        u.email,
        u.username,
        u.store_allocated,
        a.attendance_date,
        a.check_in_time,
        a.check_out_time,
        a.is_late,
        a.late_minutes,
        a.is_early_logout,
        a.early_logout_minutes
       FROM supervisor_attendance a
       JOIN users u ON a.supervisor_id = u.id
       WHERE a.attendance_date = $1
       ORDER BY a.check_in_time ASC`,
      [date]
    );

    // Generate CSV
    const csvHeader = 'Name,Email,Username,Store,Date,Check-in Time,Check-out Time,Late,Late Minutes,Early Logout,Early Logout Minutes\n';
    const csvRows = result.rows.map(row => {
      return [
        `"${row.full_name || ''}"`,
        `"${row.email || ''}"`,
        `"${row.username || ''}"`,
        `"${row.store_allocated || ''}"`,
        `"${row.attendance_date || ''}"`,
        `"${row.check_in_time ? new Date(row.check_in_time).toLocaleString() : ''}"`,
        `"${row.check_out_time ? new Date(row.check_out_time).toLocaleString() : ''}"`,
        row.is_late ? 'Yes' : 'No',
        row.late_minutes || 0,
        row.is_early_logout ? 'Yes' : 'No',
        row.early_logout_minutes || 0
      ].join(',');
    }).join('\n');

    const csv = csvHeader + csvRows;

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="supervisor_attendance_${date}.csv"`);
    res.send(csv);
  } catch (error) {
    console.error('Export supervisor attendance error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;

