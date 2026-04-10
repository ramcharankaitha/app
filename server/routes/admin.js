const express = require('express');
const router = express.Router();
const { pool } = require('../config/database');

// GET /api/admin/storage-stats
// Returns real PostgreSQL storage sizes per table + total DB size
router.get('/storage-stats', async (req, res) => {
  try {
    // Total database size
    const dbSizeResult = await pool.query(
      `SELECT pg_size_pretty(pg_database_size(current_database())) AS total_size,
              pg_database_size(current_database()) AS total_bytes`
    );

    // Per-table sizes + row counts
    const tableStatsResult = await pool.query(`
      SELECT
        t.relname AS table_name,
        pg_size_pretty(pg_total_relation_size(t.relid)) AS total_size,
        pg_total_relation_size(t.relid) AS total_bytes,
        pg_size_pretty(pg_relation_size(t.relid)) AS data_size,
        pg_relation_size(t.relid) AS data_bytes,
        pg_size_pretty(pg_indexes_size(t.relid)) AS index_size,
        t.n_live_tup AS row_count
      FROM pg_catalog.pg_statio_user_tables t
      ORDER BY pg_total_relation_size(t.relid) DESC
    `);

    // Row counts for key tables (accurate count)
    const rowCountsResult = await pool.query(`
      SELECT
        (SELECT COUNT(*) FROM attendance)               AS attendance_rows,
        (SELECT COUNT(*) FROM supervisor_attendance)    AS supervisor_attendance_rows,
        (SELECT COUNT(*) FROM stock_transactions)       AS stock_transaction_rows,
        (SELECT COUNT(*) FROM notifications)            AS notification_rows,
        (SELECT COUNT(*) FROM sales_records)            AS sales_rows,
        (SELECT COUNT(*) FROM products)                 AS product_rows,
        (SELECT COUNT(*) FROM customers)                AS customer_rows,
        (SELECT COUNT(*) FROM staff)                    AS staff_rows,
        (SELECT COUNT(*) FROM users)                    AS supervisor_rows
    `);

    // Attendance image storage estimate
    const imageStatsResult = await pool.query(`
      SELECT
        COUNT(*) AS total_attendance_records,
        COUNT(check_in_image) AS records_with_checkin_image,
        COUNT(check_out_image) AS records_with_checkout_image,
        ROUND(AVG(LENGTH(check_in_image)) / 1024.0, 1) AS avg_checkin_image_kb,
        ROUND(AVG(LENGTH(check_out_image)) / 1024.0, 1) AS avg_checkout_image_kb,
        ROUND(SUM(COALESCE(LENGTH(check_in_image), 0) + COALESCE(LENGTH(check_out_image), 0)) / 1024.0 / 1024.0, 2) AS total_images_mb
      FROM attendance
    `);

    const supervisorImageStatsResult = await pool.query(`
      SELECT
        COUNT(*) AS total_records,
        COUNT(check_in_image) AS records_with_checkin_image,
        COUNT(check_out_image) AS records_with_checkout_image,
        ROUND(SUM(COALESCE(LENGTH(check_in_image), 0) + COALESCE(LENGTH(check_out_image), 0)) / 1024.0 / 1024.0, 2) AS total_images_mb
      FROM supervisor_attendance
    `);

    res.json({
      success: true,
      database: {
        total_size: dbSizeResult.rows[0].total_size,
        total_bytes: parseInt(dbSizeResult.rows[0].total_bytes)
      },
      tables: tableStatsResult.rows.map(t => ({
        table_name: t.table_name,
        total_size: t.total_size,
        total_bytes: parseInt(t.total_bytes),
        data_size: t.data_size,
        index_size: t.index_size,
        row_count: parseInt(t.row_count)
      })),
      row_counts: rowCountsResult.rows[0],
      image_stats: {
        staff_attendance: imageStatsResult.rows[0],
        supervisor_attendance: supervisorImageStatsResult.rows[0]
      }
    });
  } catch (err) {
    console.error('Storage stats error:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
