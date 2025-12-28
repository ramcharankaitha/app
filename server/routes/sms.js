const express = require('express');
const router = express.Router();
const { sendSMS, sendCustomSMS } = require('../services/smsService');
const smsTemplates = require('../services/smsTemplates');

/**
 * Send SMS to a phone number
 * POST /api/sms/send
 * Body: { phoneNumber: string, message: string }
 */
router.post('/send', async (req, res) => {
  try {
    const { phoneNumber, message } = req.body;

    if (!phoneNumber || !phoneNumber.trim()) {
      return res.status(400).json({ error: 'Phone number is required' });
    }

    if (!message || !message.trim()) {
      return res.status(400).json({ error: 'Message is required' });
    }

    const result = await sendSMS(phoneNumber, message.trim());

    if (result.success) {
      res.json({
        success: true,
        messageId: result.messageId,
        note: result.note || 'SMS sent successfully'
      });
    } else {
      res.status(500).json({
        success: false,
        error: result.error || 'Failed to send SMS'
      });
    }
  } catch (error) {
    console.error('Send SMS error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * Send custom SMS (alias for /send)
 * POST /api/sms/custom
 * Body: { phoneNumber: string, message: string }
 */
router.post('/custom', async (req, res) => {
  try {
    const { phoneNumber, message } = req.body;

    if (!phoneNumber || !phoneNumber.trim()) {
      return res.status(400).json({ error: 'Phone number is required' });
    }

    if (!message || !message.trim()) {
      return res.status(400).json({ error: 'Message is required' });
    }

    const result = await sendCustomSMS(phoneNumber, message.trim());

    if (result.success) {
      res.json({
        success: true,
        messageId: result.messageId,
        note: result.note || 'SMS sent successfully'
      });
    } else {
      res.status(500).json({
        success: false,
        error: result.error || 'Failed to send SMS'
      });
    }
  } catch (error) {
    console.error('Send custom SMS error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * Send SMS using a template
 * POST /api/sms/template
 * Body: { template: string, phoneNumber: string, variables: object }
 * 
 * Available templates:
 * - customerWelcome
 * - orderConfirmation
 * - stockIn
 * - stockOut
 * - lowStockAlert
 * - serviceConfirmation
 * - serviceCompletion
 * - paymentReminder
 * - paymentConfirmation
 * - chitPlanEnrollment
 * - dispatchNotification
 * - deliveryConfirmation
 * - supplierTransaction
 * - salesOrderConfirmation
 */
router.post('/template', async (req, res) => {
  try {
    const { template, phoneNumber, variables = {} } = req.body;

    if (!template || !phoneNumber) {
      return res.status(400).json({ error: 'Template name and phone number are required' });
    }

    let message = '';

    // Map template names to functions
    const templateMap = {
      customerWelcome: () => smsTemplates.customerWelcomeSMS(variables.customerName),
      orderConfirmation: () => smsTemplates.orderConfirmationSMS(variables.customerName, variables.orderId, variables.amount),
      stockIn: () => smsTemplates.stockInSMS(variables.productName, variables.quantity),
      stockOut: () => smsTemplates.stockOutSMS(variables.customerName, variables.productName, variables.quantity),
      lowStockAlert: () => smsTemplates.lowStockAlertSMS(variables.productName, variables.currentStock),
      serviceConfirmation: () => smsTemplates.serviceConfirmationSMS(variables.customerName, variables.serviceId, variables.serviceDate),
      serviceCompletion: () => smsTemplates.serviceCompletionSMS(variables.customerName, variables.serviceId),
      paymentReminder: () => smsTemplates.paymentReminderSMS(variables.customerName, variables.amount, variables.dueDate, variables.planName),
      paymentConfirmation: () => smsTemplates.paymentConfirmationSMS(variables.customerName, variables.amount, variables.transactionId),
      chitPlanEnrollment: () => smsTemplates.chitPlanEnrollmentSMS(variables.customerName, variables.planName, variables.planAmount),
      dispatchNotification: () => smsTemplates.dispatchNotificationSMS(variables.customerName, variables.trackingNumber, variables.estimatedDelivery),
      deliveryConfirmation: () => smsTemplates.deliveryConfirmationSMS(variables.customerName, variables.orderId),
      supplierTransaction: () => smsTemplates.supplierTransactionSMS(variables.supplierName, variables.productName, variables.quantity, variables.amount),
      salesOrderConfirmation: () => smsTemplates.salesOrderConfirmationSMS(variables.customerName, variables.orderId, variables.totalAmount),
      custom: () => smsTemplates.customSMS(variables.template, variables.variables || {})
    };

    if (templateMap[template]) {
      message = templateMap[template]();
    } else {
      return res.status(400).json({ error: `Unknown template: ${template}` });
    }

    const result = await sendSMS(phoneNumber, message);

    if (result.success) {
      res.json({
        success: true,
        messageId: result.messageId,
        message: message,
        note: result.note || 'SMS sent successfully'
      });
    } else {
      res.status(500).json({
        success: false,
        error: result.error || 'Failed to send SMS'
      });
    }
  } catch (error) {
    console.error('Send template SMS error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;

