# SMS Templates Guide

This document lists all available SMS templates and how to use them.

## Available Templates

### 1. Customer Welcome SMS
**Template:** `customerWelcome`
```javascript
await smsAPI.sendTemplate('customerWelcome', phoneNumber, {
  customerName: 'John Doe'
});
```
**Message:** "Welcome John Doe! Thank you for registering with us. We're excited to serve you. For any queries, contact us."

---

### 2. Order Confirmation SMS
**Template:** `orderConfirmation`
```javascript
await smsAPI.sendTemplate('orderConfirmation', phoneNumber, {
  customerName: 'John Doe',
  orderId: 'ORD123',
  amount: '5000'
});
```
**Message:** "Hi John Doe, your order #ORD123 has been confirmed. Total Amount: ₹5000. Thank you for your purchase!"

---

### 3. Stock In Notification SMS
**Template:** `stockIn`
```javascript
await smsAPI.sendTemplate('stockIn', phoneNumber, {
  productName: 'Laptop',
  quantity: '50'
});
```
**Message:** "Stock Update: 50 units of Laptop have been added to inventory. Stock is now available."

---

### 4. Stock Out Notification SMS
**Template:** `stockOut`
```javascript
await smsAPI.sendTemplate('stockOut', phoneNumber, {
  customerName: 'John Doe',
  productName: 'Laptop',
  quantity: '2'
});
```
**Message:** "Hi John Doe, 2 units of Laptop have been dispatched. You will receive it soon. Thank you!"

---

### 5. Low Stock Alert SMS
**Template:** `lowStockAlert`
```javascript
await smsAPI.sendTemplate('lowStockAlert', phoneNumber, {
  productName: 'Laptop',
  currentStock: '5'
});
```
**Message:** "Alert: Laptop is running low. Current stock: 5 units. Please restock soon to avoid stockout."

---

### 6. Service Confirmation SMS
**Template:** `serviceConfirmation`
```javascript
await smsAPI.sendTemplate('serviceConfirmation', phoneNumber, {
  customerName: 'John Doe',
  serviceId: 'SRV001',
  serviceDate: '2024-12-25'
});
```
**Message:** "Hi John Doe, your service request #SRV001 has been confirmed. Service date: 2024-12-25. We'll keep you updated."

---

### 7. Service Completion SMS
**Template:** `serviceCompletion`
```javascript
await smsAPI.sendTemplate('serviceCompletion', phoneNumber, {
  customerName: 'John Doe',
  serviceId: 'SRV001'
});
```
**Message:** "Hi John Doe, your service request #SRV001 has been completed. Thank you for choosing us!"

---

### 8. Payment Reminder SMS
**Template:** `paymentReminder`
```javascript
await smsAPI.sendTemplate('paymentReminder', phoneNumber, {
  customerName: 'John Doe',
  amount: '5000',
  dueDate: '2024-12-31',
  planName: 'Chit Plan 1'
});
```
**Message:** "Reminder: Hi John Doe, your payment of ₹5000 for Chit Plan 1 is due on 2024-12-31. Please make the payment to avoid any inconvenience."

---

### 9. Payment Confirmation SMS
**Template:** `paymentConfirmation`
```javascript
await smsAPI.sendTemplate('paymentConfirmation', phoneNumber, {
  customerName: 'John Doe',
  amount: '5000',
  transactionId: 'TXN123456'
});
```
**Message:** "Hi John Doe, payment of ₹5000 received successfully. Transaction ID: TXN123456. Thank you!"

---

### 10. Chit Plan Enrollment SMS
**Template:** `chitPlanEnrollment`
```javascript
await smsAPI.sendTemplate('chitPlanEnrollment', phoneNumber, {
  customerName: 'John Doe',
  planName: 'Chit Plan 1',
  planAmount: '10000'
});
```
**Message:** "Hi John Doe, you have been successfully enrolled in Chit Plan 1 (₹10000). Welcome to our chit plan family!"

---

### 11. Dispatch Notification SMS
**Template:** `dispatchNotification`
```javascript
await smsAPI.sendTemplate('dispatchNotification', phoneNumber, {
  customerName: 'John Doe',
  trackingNumber: 'TRK123456',
  estimatedDelivery: '2024-12-30'
});
```
**Message:** "Hi John Doe, your order has been dispatched. Tracking: TRK123456. Estimated delivery: 2024-12-30."

---

### 12. Delivery Confirmation SMS
**Template:** `deliveryConfirmation`
```javascript
await smsAPI.sendTemplate('deliveryConfirmation', phoneNumber, {
  customerName: 'John Doe',
  orderId: 'ORD123'
});
```
**Message:** "Hi John Doe, your order #ORD123 has been delivered successfully. Thank you for shopping with us!"

---

### 13. Supplier Transaction SMS
**Template:** `supplierTransaction`
```javascript
await smsAPI.sendTemplate('supplierTransaction', phoneNumber, {
  supplierName: 'ABC Suppliers',
  productName: 'Laptop',
  quantity: '100',
  amount: '500000'
});
```
**Message:** "Hi ABC Suppliers, transaction recorded: 100 units of Laptop for ₹500000. Thank you for the supply!"

---

### 14. Sales Order Confirmation SMS
**Template:** `salesOrderConfirmation`
```javascript
await smsAPI.sendTemplate('salesOrderConfirmation', phoneNumber, {
  customerName: 'John Doe',
  orderId: 'SO123',
  totalAmount: '15000'
});
```
**Message:** "Hi John Doe, your sales order #SO123 has been confirmed. Total: ₹15000. We'll process it soon."

---

## Custom Messages

You can also send custom messages without using templates:

```javascript
// Simple custom message
await smsAPI.send('9876543210', 'Your custom message here');

// Or using sendCustom
await smsAPI.sendCustom('9876543210', 'Another custom message');
```

## Integration Examples

### Example 1: Send SMS after Customer Creation

```javascript
// In your customer creation function
const createCustomer = async (customerData) => {
  try {
    const response = await customersAPI.create(customerData);
    
    if (response.success && customerData.phone) {
      // Send welcome SMS
      await smsAPI.sendTemplate('customerWelcome', customerData.phone, {
        customerName: customerData.name
      });
    }
    
    return response;
  } catch (error) {
    console.error('Error:', error);
  }
};
```

### Example 2: Send SMS after Stock Out

```javascript
// In your stock out function
const handleStockOut = async (stockOutData) => {
  try {
    const response = await stockAPI.stockOut(stockOutData);
    
    if (response.success && stockOutData.customerPhone) {
      // Send dispatch notification
      await smsAPI.sendTemplate('stockOut', stockOutData.customerPhone, {
        customerName: stockOutData.customerName,
        productName: stockOutData.productName,
        quantity: stockOutData.quantity
      });
    }
    
    return response;
  } catch (error) {
    console.error('Error:', error);
  }
};
```

### Example 3: Send SMS after Service Creation

```javascript
// In your service creation function
const createService = async (serviceData) => {
  try {
    const response = await servicesAPI.create(serviceData);
    
    if (response.success && serviceData.customerPhone) {
      // Send service confirmation
      await smsAPI.sendTemplate('serviceConfirmation', serviceData.customerPhone, {
        customerName: serviceData.customerName,
        serviceId: response.service.id,
        serviceDate: serviceData.serviceDate
      });
    }
    
    return response;
  } catch (error) {
    console.error('Error:', error);
  }
};
```

## Error Handling

Always handle SMS errors gracefully - don't let SMS failures block your main operations:

```javascript
try {
  const response = await smsAPI.sendTemplate('customerWelcome', phoneNumber, {
    customerName: 'John Doe'
  });
  
  if (response.success) {
    console.log('SMS sent successfully');
  } else {
    console.warn('SMS failed but operation continues:', response.error);
  }
} catch (error) {
  console.error('SMS API error:', error);
  // Continue with your main operation
}
```

## Notes

- All templates are customizable in `server/services/smsTemplates.js`
- Phone numbers should be 10-digit Indian numbers
- SMS sending is non-blocking - failures won't affect main operations
- In development mode (MSG91_ENABLED=false), messages are logged to console

