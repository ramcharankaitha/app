const { pool } = require('../config/database');
const { createNotificationForUserType } = require('../services/notificationService');

/**
 * Add is_verified and created_by columns to a table if they don't exist
 */
async function ensureVerificationColumn(tableName) {
  if (!tableName || typeof tableName !== 'string') {
    console.error('Invalid table name provided to ensureVerificationColumn:', tableName);
    return;
  }
  
  try {
    // Sanitize table name to prevent SQL injection
    const sanitizedTableName = tableName.replace(/[^a-zA-Z0-9_]/g, '');
    if (!sanitizedTableName) {
      console.error('Invalid table name after sanitization:', tableName);
      return;
    }
    
    // Add is_verified column
    await pool.query(`
      DO $$ 
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM information_schema.columns 
          WHERE table_name = '${sanitizedTableName}' AND column_name = 'is_verified'
        ) THEN
          ALTER TABLE ${sanitizedTableName} ADD COLUMN is_verified BOOLEAN DEFAULT true;
          RAISE NOTICE 'Added is_verified column to ${sanitizedTableName}';
        END IF;
      END $$;
    `);
    
    // Add created_by column
    await pool.query(`
      DO $$ 
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM information_schema.columns 
          WHERE table_name = '${sanitizedTableName}' AND column_name = 'created_by'
        ) THEN
          ALTER TABLE ${sanitizedTableName} ADD COLUMN created_by VARCHAR(255);
          RAISE NOTICE 'Added created_by column to ${sanitizedTableName}';
        END IF;
      END $$;
    `);
  } catch (error) {
    console.error(`Error ensuring verification columns for ${tableName}:`, error);
  }
}

/**
 * Determine if a record should be verified based on user role
 * @param {string} userRole - 'admin', 'supervisor', or 'staff'
 * @returns {boolean} - true if admin/supervisor, false if staff
 */
function shouldBeVerified(userRole) {
  return userRole === 'admin' || userRole === 'supervisor';
}

/**
 * Send notification to admin and supervisor when staff creates a record
 * @param {string} recordType - Type of record (e.g., 'Transport', 'Product', 'Category')
 * @param {string} recordName - Name/identifier of the record
 * @param {number} recordId - ID of the record
 */
async function notifyStaffCreation(recordType, recordName, recordId) {
  try {
    const message = `${recordType} "${recordName}" has been created. Please verify.`;
    
    // Notify admin
    await createNotificationForUserType(
      'admin',
      'info',
      'New Record Created',
      message,
      false,
      recordId
    );

    // Notify supervisor
    await createNotificationForUserType(
      'supervisor',
      'info',
      'New Record Created',
      message,
      false,
      recordId
    );
  } catch (error) {
    console.error('Error sending staff creation notification:', error);
  }
}

module.exports = {
  ensureVerificationColumn,
  shouldBeVerified,
  notifyStaffCreation
};



