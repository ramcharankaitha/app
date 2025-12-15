const express = require('express');
const router = express.Router();
const { pool } = require('../config/database');

// Expected check-in time: 9:00 AM
const EXPECTED_CHECK_IN_HOUR = 9;
const EXPECTED_CHECK_IN_MINUTE = 0;

// Expected check-out time: 6:00 PM
const EXPECTED_CHECK_OUT_HOUR = 18;
const EXPECTED_CHECK_OUT_MINUTE = 0;

// Get today's attendance for current user
router.get('/today', async (req, res) => {
  try {
    // Get staff_id from session or token (for now, using username from query)
    const username = req.query.username || req.user?.username;
    
    if (!username) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Get staff by username
    const staffResult = await pool.query('SELECT id FROM staff WHERE username = $1', [username]);
    if (staffResult.rows.length === 0) {
      return res.status(404).json({ error: 'Staff not found' });
    }

    const staffId = staffResult.rows[0].id;
    const today = new Date().toISOString().split('T')[0];

    const result = await pool.query(
      'SELECT * FROM attendance WHERE staff_id = $1 AND attendance_date = $2',
      [staffId, today]
    );

    if (result.rows.length === 0) {
      return res.json({ success: true, attendance: null });
    }

    res.json({ success: true, attendance: result.rows[0] });
  } catch (error) {
    console.error('Get today attendance error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Check-in
router.post('/checkin', async (req, res) => {
  try {
    const { image, timestamp, username } = req.body;

    if (!username) {
      return res.status(401).json({ error: 'Unauthorized: Username is required' });
    }

    // Get staff by username
    const staffResult = await pool.query('SELECT id FROM staff WHERE username = $1', [username]);
    if (staffResult.rows.length === 0) {
      return res.status(404).json({ error: 'Staff not found' });
    }

    const staffId = staffResult.rows[0].id;
    const today = new Date().toISOString().split('T')[0];
    const checkInTime = timestamp ? new Date(timestamp) : new Date();

    // Check if already checked in today
    const existingResult = await pool.query(
      'SELECT * FROM attendance WHERE staff_id = $1 AND attendance_date = $2',
      [staffId, today]
    );

    let isLate = false;
    let lateMinutes = 0;

    // Check if late (after 9:00 AM)
    const checkInHour = checkInTime.getHours();
    const checkInMinute = checkInTime.getMinutes();
    
    if (checkInHour > EXPECTED_CHECK_IN_HOUR || 
        (checkInHour === EXPECTED_CHECK_IN_HOUR && checkInMinute > EXPECTED_CHECK_IN_MINUTE)) {
      isLate = true;
      const expectedTime = new Date(checkInTime);
      expectedTime.setHours(EXPECTED_CHECK_IN_HOUR, EXPECTED_CHECK_IN_MINUTE, 0, 0);
      lateMinutes = Math.floor((checkInTime - expectedTime) / (1000 * 60));
    }

    if (existingResult.rows.length > 0) {
      // Update existing record
      const result = await pool.query(
        `UPDATE attendance 
         SET check_in_time = $1, 
             check_in_image = $2,
             is_late = $3,
             late_minutes = $4,
             updated_at = CURRENT_TIMESTAMP
         WHERE staff_id = $5 AND attendance_date = $6
         RETURNING *`,
        [checkInTime, image, isLate, lateMinutes, staffId, today]
      );

      // Create notification if late
      if (isLate) {
        await pool.query(
          `INSERT INTO notifications (user_id, user_type, notification_type, title, message, related_id)
           VALUES ($1, 'staff', 'warning', 'Late Check-in Warning', $2, $3)`,
          [staffId, `You checked in ${lateMinutes} minutes late today. Please ensure you arrive on time.`, result.rows[0].id]
        );
      }

      res.json({
        success: true,
        attendance: result.rows[0],
        message: isLate ? `Checked in successfully (${lateMinutes} minutes late)` : 'Checked in successfully',
        warning: isLate ? `You are ${lateMinutes} minutes late. A warning has been sent.` : null
      });
    } else {
      // Create new record
      const result = await pool.query(
        `INSERT INTO attendance (staff_id, attendance_date, check_in_time, check_in_image, is_late, late_minutes)
         VALUES ($1, $2, $3, $4, $5, $6)
         RETURNING *`,
        [staffId, today, checkInTime, image, isLate, lateMinutes]
      );

      // Create notification if late
      if (isLate) {
        await pool.query(
          `INSERT INTO notifications (user_id, user_type, notification_type, title, message, related_id)
           VALUES ($1, 'staff', 'warning', 'Late Check-in Warning', $2, $3)`,
          [staffId, `You checked in ${lateMinutes} minutes late today. Please ensure you arrive on time.`, result.rows[0].id]
        );
      }

      res.json({
        success: true,
        attendance: result.rows[0],
        message: isLate ? `Checked in successfully (${lateMinutes} minutes late)` : 'Checked in successfully',
        warning: isLate ? `You are ${lateMinutes} minutes late. A warning has been sent.` : null
      });
    }
  } catch (error) {
    console.error('Check-in error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Check-out
router.post('/checkout', async (req, res) => {
  try {
    const { image, timestamp, username } = req.body;

    if (!username) {
      return res.status(401).json({ error: 'Unauthorized: Username is required' });
    }

    // Get staff by username
    const staffResult = await pool.query('SELECT id FROM staff WHERE username = $1', [username]);
    if (staffResult.rows.length === 0) {
      return res.status(404).json({ error: 'Staff not found' });
    }

    const staffId = staffResult.rows[0].id;
    const today = new Date().toISOString().split('T')[0];
    const checkOutTime = timestamp ? new Date(timestamp) : new Date();

    // Check if checked in today
    const existingResult = await pool.query(
      'SELECT * FROM attendance WHERE staff_id = $1 AND attendance_date = $2',
      [staffId, today]
    );

    if (existingResult.rows.length === 0 || !existingResult.rows[0].check_in_time) {
      return res.status(400).json({ error: 'Please check in first' });
    }

    if (existingResult.rows[0].check_out_time) {
      return res.status(400).json({ error: 'Already checked out today' });
    }

    let isEarlyLogout = false;
    let earlyLogoutMinutes = 0;

    // Check if early logout (before 6:00 PM)
    const checkOutHour = checkOutTime.getHours();
    const checkOutMinute = checkOutTime.getMinutes();
    
    if (checkOutHour < EXPECTED_CHECK_OUT_HOUR || 
        (checkOutHour === EXPECTED_CHECK_OUT_HOUR && checkOutMinute < EXPECTED_CHECK_OUT_MINUTE)) {
      isEarlyLogout = true;
      const expectedTime = new Date(checkOutTime);
      expectedTime.setHours(EXPECTED_CHECK_OUT_HOUR, EXPECTED_CHECK_OUT_MINUTE, 0, 0);
      earlyLogoutMinutes = Math.floor((expectedTime - checkOutTime) / (1000 * 60));
    }

    const result = await pool.query(
      `UPDATE attendance 
       SET check_out_time = $1, 
           check_out_image = $2,
           is_early_logout = $3,
           early_logout_minutes = $4,
           updated_at = CURRENT_TIMESTAMP
       WHERE staff_id = $5 AND attendance_date = $6
       RETURNING *`,
      [checkOutTime, image, isEarlyLogout, earlyLogoutMinutes, staffId, today]
    );

    // Create notification if early logout
    if (isEarlyLogout) {
      await pool.query(
        `INSERT INTO notifications (user_id, user_type, notification_type, title, message, related_id)
         VALUES ($1, 'staff', 'warning', 'Early Check-out Warning', $2, $3)`,
        [staffId, `You checked out ${earlyLogoutMinutes} minutes early today. Please ensure you complete your full shift.`, result.rows[0].id]
      );
    }

    res.json({
      success: true,
      attendance: result.rows[0],
      message: isEarlyLogout ? `Checked out successfully (${earlyLogoutMinutes} minutes early)` : 'Checked out successfully',
      warning: isEarlyLogout ? `You checked out ${earlyLogoutMinutes} minutes early. A warning has been sent.` : null
    });
  } catch (error) {
    console.error('Check-out error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get all staff attendance for a specific date (for supervisor)
router.get('/all', async (req, res) => {
  try {
    const date = req.query.date || new Date().toISOString().split('T')[0];

    const result = await pool.query(
      `SELECT 
        a.*,
        s.full_name,
        s.email,
        s.username,
        s.store_allocated
       FROM attendance a
       JOIN staff s ON a.staff_id = s.id
       WHERE a.attendance_date = $1
       ORDER BY a.check_in_time ASC`,
      [date]
    );

    res.json({ success: true, attendance: result.rows });
  } catch (error) {
    console.error('Get all attendance error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Export attendance as CSV
router.get('/export', async (req, res) => {
  try {
    const date = req.query.date || new Date().toISOString().split('T')[0];

    const result = await pool.query(
      `SELECT 
        s.full_name,
        s.email,
        s.username,
        s.store_allocated,
        a.attendance_date,
        a.check_in_time,
        a.check_out_time,
        a.is_late,
        a.late_minutes,
        a.is_early_logout,
        a.early_logout_minutes
       FROM attendance a
       JOIN staff s ON a.staff_id = s.id
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
    res.setHeader('Content-Disposition', `attachment; filename="attendance_${date}.csv"`);
    res.send(csv);
  } catch (error) {
    console.error('Export attendance error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;

