-- Add is_critical field to notifications table
ALTER TABLE notifications
ADD COLUMN IF NOT EXISTS is_critical BOOLEAN DEFAULT FALSE;

-- Add index for faster queries on critical alerts
CREATE INDEX IF NOT EXISTS idx_notifications_critical ON notifications(is_critical, created_at DESC) WHERE is_critical = TRUE;

-- Add index for user notifications
CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id, user_type, is_read, created_at DESC);

