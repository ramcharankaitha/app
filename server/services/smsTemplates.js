/**
 * SMS Templates for various use cases
 * These templates can be customized as needed
 */

/**
 * Customer Registration/Welcome SMS
 */
function customerWelcomeSMS(customerName) {
  return `Welcome ${customerName}! Thank you for registering with us. We're excited to serve you. For any queries, contact us.`;
}

/**
 * Order Confirmation SMS
 */
function orderConfirmationSMS(customerName, orderId, amount) {
  return `Hi ${customerName}, your order #${orderId} has been confirmed. Total Amount: ₹${amount}. Thank you for your purchase!`;
}

/**
 * Stock In Notification SMS
 */
function stockInSMS(productName, quantity) {
  return `Stock Update: ${quantity} units of ${productName} have been added to inventory. Stock is now available.`;
}

/**
 * Stock Out Notification SMS
 */
function stockOutSMS(customerName, productName, quantity) {
  return `Hi ${customerName}, ${quantity} units of ${productName} have been dispatched. You will receive it soon. Thank you!`;
}

/**
 * Low Stock Alert SMS
 */
function lowStockAlertSMS(productName, currentStock) {
  return `Alert: ${productName} is running low. Current stock: ${currentStock} units. Please restock soon to avoid stockout.`;
}

/**
 * Service Request Confirmation SMS
 */
function serviceConfirmationSMS(customerName, serviceId, serviceDate) {
  return `Hi ${customerName}, your service request #${serviceId} has been confirmed. Service date: ${serviceDate}. We'll keep you updated.`;
}

/**
 * Service Completion SMS
 */
function serviceCompletionSMS(customerName, serviceId) {
  return `Hi ${customerName}, your service request #${serviceId} has been completed. Thank you for choosing us!`;
}

/**
 * Payment Reminder SMS
 */
function paymentReminderSMS(customerName, amount, dueDate, planName) {
  return `Reminder: Hi ${customerName}, your payment of ₹${amount} for ${planName} is due on ${dueDate}. Please make the payment to avoid any inconvenience.`;
}

/**
 * Payment Confirmation SMS
 */
function paymentConfirmationSMS(customerName, amount, transactionId) {
  return `Hi ${customerName}, payment of ₹${amount} received successfully. Transaction ID: ${transactionId}. Thank you!`;
}

/**
 * Chit Plan Enrollment SMS
 */
function chitPlanEnrollmentSMS(customerName, planName, planAmount) {
  return `Hi ${customerName}, you have been successfully enrolled in ${planName} (₹${planAmount}). Welcome to our chit plan family!`;
}

/**
 * Dispatch Notification SMS
 */
function dispatchNotificationSMS(customerName, trackingNumber, estimatedDelivery) {
  return `Hi ${customerName}, your order has been dispatched. Tracking: ${trackingNumber}. Estimated delivery: ${estimatedDelivery}.`;
}

/**
 * Delivery Confirmation SMS
 */
function deliveryConfirmationSMS(customerName, orderId) {
  return `Hi ${customerName}, your order #${orderId} has been delivered successfully. Thank you for shopping with us!`;
}

/**
 * Supplier Transaction SMS
 */
function supplierTransactionSMS(supplierName, productName, quantity, amount) {
  return `Hi ${supplierName}, transaction recorded: ${quantity} units of ${productName} for ₹${amount}. Thank you for the supply!`;
}

/**
 * Sales Order Confirmation SMS
 */
function salesOrderConfirmationSMS(customerName, orderId, totalAmount) {
  return `Hi ${customerName}, your sales order #${orderId} has been confirmed. Total: ₹${totalAmount}. We'll process it soon.`;
}

/**
 * Custom SMS Template
 * Use this for creating custom messages with variables
 */
function customSMS(template, variables) {
  let message = template;
  Object.keys(variables).forEach(key => {
    const regex = new RegExp(`\\{\\{${key}\\}\\}`, 'g');
    message = message.replace(regex, variables[key]);
  });
  return message;
}

module.exports = {
  customerWelcomeSMS,
  orderConfirmationSMS,
  stockInSMS,
  stockOutSMS,
  lowStockAlertSMS,
  serviceConfirmationSMS,
  serviceCompletionSMS,
  paymentReminderSMS,
  paymentConfirmationSMS,
  chitPlanEnrollmentSMS,
  dispatchNotificationSMS,
  deliveryConfirmationSMS,
  supplierTransactionSMS,
  salesOrderConfirmationSMS,
  customSMS
};

