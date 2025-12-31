# Notifications & Critical Alerts Implementation

## ✅ Completed Features

### 1. Database Schema
- ✅ Added `is_critical` field to `notifications` table
- ✅ Added indexes for faster queries
- **File:** `server/database/add_critical_alerts.sql`

### 2. Backend Services
- ✅ Created `notificationService.js` with helper functions:
  - `createNotification()` - Create single notification
  - `createCriticalAlert()` - Create critical alert for all admins
  - `createNotificationForUserType()` - Send to all users of a type
- **File:** `server/services/notificationService.js`

### 3. Backend API Endpoints
- ✅ `GET /api/notifications` - Get notifications for user
- ✅ `GET /api/notifications/critical-alerts` - Get critical alerts
- ✅ `GET /api/notifications/unread-count` - Get unread count
- ✅ `PUT /api/notifications/:id/read` - Mark as read
- ✅ `PUT /api/notifications/mark-all-read` - Mark all as read
- ✅ `POST /api/notifications/send` - Send notification (Admin/Supervisor)
- ✅ `DELETE /api/notifications/:id` - Delete notification
- **File:** `server/routes/notifications.js`

### 4. Automatic Critical Alerts
Integrated into key operations:
- ✅ **Product Creation** - Alerts when new product is added
- ✅ **Product Update** - Alerts when stock goes below minimum
- ✅ **Stock In** - Alerts when stock is added
- ✅ **Stock Out** - Alerts when stock is removed + low stock warnings
- **Files:** 
  - `server/routes/products.js`
  - `server/routes/stock.js`

### 5. Frontend API Functions
- ✅ `notificationsAPI.getAll()` - Get all notifications
- ✅ `notificationsAPI.getCriticalAlerts()` - Get critical alerts
- ✅ `notificationsAPI.getUnreadCount()` - Get unread count
- ✅ `notificationsAPI.markAsRead()` - Mark as read
- ✅ `notificationsAPI.markAllAsRead()` - Mark all as read
- ✅ `notificationsAPI.send()` - Send notification
- ✅ `notificationsAPI.delete()` - Delete notification
- **File:** `src/services/api.js`

### 6. UI Components
- ✅ **SendNotification Component** - Modal for sending notifications
  - Send to all admins, supervisors, or staff
  - Select specific users
  - Choose notification type (info, success, warning, error)
  - Mark as critical alert
- **Files:**
  - `src/components/SendNotification.jsx`
  - `src/components/SendNotification.css`

### 7. Admin Dashboard Integration
- ✅ Real-time notifications display
- ✅ Critical alerts panel
- ✅ Unread count badge
- ✅ "Send Notification" button
- ✅ Auto-refresh every 30 seconds
- ✅ Click to mark as read
- **File:** `src/components/Dashboard.jsx`

---

## 📋 Setup Instructions

### Step 1: Run Database Migration

```sql
-- Run this SQL script
ALTER TABLE notifications
ADD COLUMN IF NOT EXISTS is_critical BOOLEAN DEFAULT FALSE;

CREATE INDEX IF NOT EXISTS idx_notifications_critical ON notifications(is_critical, created_at DESC) WHERE is_critical = TRUE;

CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id, user_type, is_read, created_at DESC);
```

Or use the provided file:
```bash
psql -U postgres -d anitha_stores -f server/database/add_critical_alerts.sql
```

### Step 2: Restart Backend

The backend will automatically use the new notification service.

### Step 3: Test

1. **Create a product** - Should see critical alert
2. **Update stock to below minimum** - Should see low stock alert
3. **Send notification** - Click "Send Notification" button in dashboard
4. **Check notifications** - Should appear in dashboard

---

## 🎯 Usage

### For Admins:

1. **View Critical Alerts:**
   - Dashboard shows all critical alerts
   - Alerts are automatically created for:
     - New products
     - Low stock
     - Stock in/out operations

2. **Send Notifications:**
   - Click "Send Notification" button in dashboard
   - Choose recipient (All Admins, All Supervisors, All Staff, or specific users)
   - Enter title and message
   - Choose type (Info, Success, Warning, Error)
   - Optionally mark as critical alert

3. **View All Notifications:**
   - Notifications panel shows all notifications
   - Unread count badge shows new notifications
   - Click notification to mark as read

### For Supervisors:

- Can send notifications to staff
- Receive notifications sent by admin
- View their own notifications

---

## 🔔 Automatic Critical Alerts

The system automatically creates critical alerts for:

1. **Product Operations:**
   - New product created
   - Stock updated below minimum quantity

2. **Stock Operations:**
   - Stock added (Stock In)
   - Stock removed (Stock Out)
   - Low stock warning (when stock ≤ minimum)

3. **Future Integrations:**
   - Order creation
   - Service completion
   - Quotation creation
   - Payment received
   - (Can be added to any route)

---

## 📝 Adding More Critical Alerts

To add critical alerts to other operations:

```javascript
// In your route file
const { createCriticalAlert } = require('../services/notificationService');

// After successful operation
await createCriticalAlert(
  'warning', // or 'info', 'success', 'error'
  'Alert Title',
  'Alert message description',
  relatedId // optional: ID of related record
);
```

**Example:**
```javascript
// In server/routes/services.js - after service completion
await createCriticalAlert(
  'success',
  'Service Completed',
  `Service "${service.service_name}" has been completed by ${handlerName}`,
  service.id
);
```

---

## 🎨 Notification Types

- **info** - Blue (#17a2b8) - General information
- **success** - Green (#28a745) - Success messages
- **warning** - Orange (#ffa500) - Warnings
- **error** - Red (#dc3545) - Errors

---

## 🔄 Real-time Updates

- Notifications refresh every 30 seconds
- Critical alerts update automatically
- Unread count updates in real-time

---

## 🚀 Next Steps (Optional Enhancements)

1. **Push Notifications** - Browser push notifications
2. **Email Notifications** - Send email for critical alerts
3. **SMS Notifications** - Send SMS for urgent alerts
4. **Notification Preferences** - User settings for notification types
5. **Notification History** - Archive old notifications
6. **Bulk Actions** - Mark multiple as read, delete multiple

---

## 📊 Database Schema

```sql
CREATE TABLE notifications (
    id SERIAL PRIMARY KEY,
    user_id INTEGER,
    user_type VARCHAR(50) NOT NULL, -- 'staff', 'supervisor', 'admin'
    notification_type VARCHAR(50) NOT NULL, -- 'warning', 'info', 'success', 'error'
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    is_read BOOLEAN DEFAULT FALSE,
    is_critical BOOLEAN DEFAULT FALSE, -- NEW
    related_id INTEGER, -- ID of related record
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

---

**🎉 The notification system is now fully functional!**

