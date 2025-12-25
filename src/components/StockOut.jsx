import React, { useState, useEffect } from 'react';
import { stockAPI, productsAPI, customersAPI } from '../services/api';
import ConfirmDialog from './ConfirmDialog';

const StockOut = ({ onBack, onNavigate, userRole = 'admin' }) => {
  const [formData, setFormData] = useState({
    customerName: '',
    customerPhone: '',
    customerEmail: '',
    customerAddress: '',
    customerCity: '',
    customerState: '',
    customerPincode: '',
    paymentMode: '',
    notes: ''
  });
  const [customerVerified, setCustomerVerified] = useState(false);
  const [isCheckingCustomer, setIsCheckingCustomer] = useState(false);
  const [customerError, setCustomerError] = useState('');
  const [customerDetails, setCustomerDetails] = useState(null);
  const [productItems, setProductItems] = useState([
    { 
      id: 1, 
      itemCode: '', 
      productName: '',
      skuCode: '',
      category: '',
      modelNumber: '',
      quantity: '', // Current stock
      stockOutQuantity: '', // Quantity to remove
      mrp: '',
      sellRate: '',
      discount: '',
      productInfo: null,
      isFetching: false
    }
  ]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [confirmState, setConfirmState] = useState({ open: false, message: '', onConfirm: null });

  const getUserIdentifier = () => {
    const userDataStr = localStorage.getItem('userData');
    if (userDataStr) {
      try {
        const userData = JSON.parse(userDataStr);
        return userData.username || userData.email || userData.full_name || 'system';
      } catch (e) {
        console.error('Error parsing userData:', e);
      }
    }
    return 'system';
  };

  const handleBack = () => {
    if (onNavigate) {
      onNavigate('stockOutMaster');
    } else if (onBack) {
      onBack();
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Reset customer verification when name or phone changes
    if (name === 'customerName' || name === 'customerPhone') {
      setCustomerVerified(false);
      setCustomerError('');
      setCustomerDetails(null);
      // Clear customer details
      setFormData(prev => ({
        ...prev,
        customerEmail: '',
        customerAddress: '',
        customerCity: '',
        customerState: '',
        customerPincode: ''
      }));
      // Clear all product items when customer changes
      setProductItems([{
        id: 1,
        itemCode: '',
        productName: '',
        skuCode: '',
        category: '',
        modelNumber: '',
        quantity: '',
        stockOutQuantity: '',
        mrp: '',
        sellRate: '',
        discount: '',
        productInfo: null,
        isFetching: false
      }]);
    }
  };

  // Check if customer exists when both name and phone are entered
  useEffect(() => {
    const checkCustomer = async () => {
      if (!formData.customerName.trim() || !formData.customerPhone.trim()) {
        setCustomerVerified(false);
        setCustomerError('');
        return;
      }

      setIsCheckingCustomer(true);
      setCustomerError('');
      
      try {
        // Search by phone number first (more reliable)
        const phoneResponse = await customersAPI.search(formData.customerPhone.trim());
        
        if (phoneResponse.success && phoneResponse.customers && phoneResponse.customers.length > 0) {
          // Check if any customer matches both name and phone
          const matchingCustomer = phoneResponse.customers.find(c => 
            c.phone === formData.customerPhone.trim() &&
            c.full_name.toLowerCase() === formData.customerName.trim().toLowerCase()
          );
          
          if (matchingCustomer) {
            setCustomerVerified(true);
            setCustomerError('');
            setCustomerDetails(matchingCustomer);
            // Fetch full customer details
            setFormData(prev => ({
              ...prev,
              customerEmail: matchingCustomer.email || '',
              customerAddress: matchingCustomer.address || '',
              customerCity: matchingCustomer.city || '',
              customerState: matchingCustomer.state || '',
              customerPincode: matchingCustomer.pincode || ''
            }));
          } else {
            // Try searching by name
            const nameResponse = await customersAPI.search(formData.customerName.trim());
            if (nameResponse.success && nameResponse.customers && nameResponse.customers.length > 0) {
              const nameMatch = nameResponse.customers.find(c => 
                c.full_name.toLowerCase() === formData.customerName.trim().toLowerCase() &&
                c.phone === formData.customerPhone.trim()
              );
              
              if (nameMatch) {
                setCustomerVerified(true);
                setCustomerError('');
                setCustomerDetails(nameMatch);
                // Fetch full customer details
                setFormData(prev => ({
                  ...prev,
                  customerEmail: nameMatch.email || '',
                  customerAddress: nameMatch.address || '',
                  customerCity: nameMatch.city || '',
                  customerState: nameMatch.state || '',
                  customerPincode: nameMatch.pincode || ''
                }));
              } else {
                setCustomerVerified(false);
                setCustomerError('Customer not found. Please create the customer first in the Master Menu.');
                setCustomerDetails(null);
              }
            } else {
              setCustomerVerified(false);
              setCustomerError('Customer not found. Please create the customer first in the Master Menu.');
              setCustomerDetails(null);
            }
          }
        } else {
          setCustomerVerified(false);
          setCustomerError('Customer not found. Please create the customer first in the Master Menu.');
        }
      } catch (err) {
        console.error('Error checking customer:', err);
        setCustomerVerified(false);
        setCustomerError('Error verifying customer. Please try again.');
      } finally {
        setIsCheckingCustomer(false);
      }
    };

    // Debounce the check
    const timer = setTimeout(() => {
      checkCustomer();
    }, 500);

    return () => clearTimeout(timer);
  }, [formData.customerName, formData.customerPhone]);

  const handleItemChange = (itemId, field, value) => {
    setProductItems(prev => prev.map(item => {
      if (item.id === itemId) {
        const updated = { ...item, [field]: value };
        
        // Reset product info if item code changes
        if (field === 'itemCode') {
          updated.productInfo = null;
          updated.productName = '';
          updated.skuCode = '';
          updated.category = '';
          updated.modelNumber = '';
          updated.quantity = '';
          updated.mrp = '';
          updated.sellRate = '';
          updated.discount = '';
        }
        
        return updated;
      }
      return item;
    }));
  };

  const fetchProductByItemCode = async (itemId) => {
    const item = productItems.find(p => p.id === itemId);
    if (!item || !item.itemCode?.trim()) {
      setError('Please enter an item code');
      return;
    }
    
    setProductItems(prev => prev.map(p => 
      p.id === itemId ? { ...p, isFetching: true } : p
    ));
    setError('');
    
    try {
      const response = await productsAPI.getByItemCode(item.itemCode.trim());
      
      if (response.success && response.product) {
        const product = response.product;
        const productData = {
          id: product.id,
          productName: product.product_name || product.productName || '',
          itemCode: product.item_code || product.itemCode || '',
          skuCode: product.sku_code || product.skuCode || '',
          currentQuantity: product.current_quantity || 0,
          category: product.category || '',
          modelNumber: product.model_number || product.modelNumber || '',
          mrp: product.mrp || 0,
          sellRate: product.sell_rate || product.sellRate || 0,
          discount: product.discount || 0
        };
        
        setProductItems(prev => prev.map(p => 
          p.id === itemId ? {
            ...p,
            productInfo: productData,
            productName: productData.productName,
            skuCode: productData.skuCode,
            category: productData.category,
            modelNumber: productData.modelNumber,
            quantity: productData.currentQuantity.toString(),
            mrp: productData.mrp.toString(),
            sellRate: productData.sellRate.toString(),
            discount: productData.discount.toString(),
            isFetching: false
          } : p
        ));
        
        if (product.current_quantity <= 0) {
          setError('This product is out of stock!');
        }
      } else {
        setError('Product not found with this item code');
        setProductItems(prev => prev.map(p => 
          p.id === itemId ? { ...p, productInfo: null, isFetching: false } : p
        ));
      }
    } catch (err) {
      console.error('Fetch product error:', err);
      setError(err.message || 'Product not found. Please check the item code and try again.');
      setProductItems(prev => prev.map(p => 
        p.id === itemId ? { ...p, productInfo: null, isFetching: false } : p
      ));
    }
  };

  const handleItemCodeKeyPress = async (e, itemId) => {
    if (e.key === 'Enter' || e.keyCode === 13) {
      e.preventDefault();
      await fetchProductByItemCode(itemId);
    }
  };

  const addProductItem = () => {
    const newId = productItems.length > 0 
      ? Math.max(...productItems.map(item => item.id)) + 1 
      : 1;
    setProductItems(prev => [...prev, { 
      id: newId, 
      itemCode: '', 
      productName: '',
      skuCode: '',
      category: '',
      modelNumber: '',
      quantity: '',
      stockOutQuantity: '',
      mrp: '',
      sellRate: '',
      discount: '',
      productInfo: null,
      isFetching: false
    }]);
  };

  const removeProductItem = (id) => {
    if (productItems.length > 1) {
      setProductItems(prev => prev.filter(item => item.id !== id));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMessage('');

    if (!formData.customerName || !formData.customerName.trim()) {
      setError('Please enter customer name');
      return;
    }

    if (!formData.customerPhone || !formData.customerPhone.trim()) {
      setError('Please enter customer phone number');
      return;
    }

    if (!customerVerified) {
      setError('Customer not verified. Please ensure the customer exists in the system. Create the customer first in the Master Menu.');
      return;
    }

    if (!formData.paymentMode || !formData.paymentMode.trim()) {
      setError('Please select a payment mode');
      return;
    }

    const validItems = productItems.filter(item => item.itemCode.trim() !== '' && item.productInfo);
    
    if (validItems.length === 0) {
      setError('Please add at least one product item');
      return;
    }

    // Validate all items
    for (const item of validItems) {
      if (!item.stockOutQuantity || parseFloat(item.stockOutQuantity) <= 0) {
        setError(`Please enter a valid stock out quantity for item ${item.itemCode}`);
        return;
      }

      const qty = parseInt(item.stockOutQuantity);
      const availableQty = item.productInfo?.currentQuantity || 0;
      
      if (qty > availableQty) {
        setError(`Insufficient stock for ${item.itemCode}! Available: ${availableQty}, Requested: ${qty}`);
        return;
      }
    }

    const confirmMessage = `Remove stock for ${validItems.length} item(s) for customer ${formData.customerName}?`;
    
    setConfirmState({
      open: true,
      message: confirmMessage,
      onConfirm: async () => {
        setIsLoading(true);
        setError('');
        setSuccessMessage('');
        
        try {
          const createdBy = getUserIdentifier();
          const promises = validItems.map(item =>
            stockAPI.stockOut(
              item.itemCode.trim(),
              parseInt(item.stockOutQuantity),
              formData.notes || null,
              createdBy,
              formData.customerName.trim(),
              formData.customerPhone.trim(),
              formData.paymentMode,
              parseFloat(item.mrp) || 0,
              parseFloat(item.sellRate) || 0,
              parseFloat(item.discount) || 0
            )
          );

          const results = await Promise.all(promises);
          console.log('Stock out results:', results);
          const allSuccess = results.every(result => result && result.success !== false);

          if (allSuccess) {
            setSuccessMessage(`Stock removed successfully for ${validItems.length} item(s)!`);
            // Reset form after successful stock out
            setFormData({
              customerName: '',
              customerPhone: '',
              customerEmail: '',
              customerAddress: '',
              customerCity: '',
              customerState: '',
              customerPincode: '',
              paymentMode: '',
              notes: ''
            });
            setCustomerVerified(false);
            setCustomerError('');
            setCustomerDetails(null);
            setProductItems([{
              id: 1,
              itemCode: '',
              productName: '',
              skuCode: '',
              category: '',
              modelNumber: '',
              quantity: '',
              stockOutQuantity: '',
              mrp: '',
              sellRate: '',
              discount: '',
              productInfo: null,
              isFetching: false
            }]);
            // Wait a bit for backend to commit, then dispatch event and navigate
            setTimeout(() => {
              // Dispatch event to trigger refresh in StockOutMaster
              window.dispatchEvent(new Event('stockOutCompleted'));
              setSuccessMessage('');
              // Navigate after a short delay to allow refresh to happen
              setTimeout(() => {
                handleBack();
              }, 500);
            }, 1500);
          } else {
            setError('Some stock removals failed. Please try again.');
          }
        } catch (err) {
          console.error('Stock Out error:', err);
          setError(err.message || 'Failed to remove stock. Please try again.');
        } finally {
          setIsLoading(false);
          setConfirmState({ open: false, message: '', onConfirm: null });
        }
      }
    });
  };

  return (
    <div className="add-user-container">
      <ConfirmDialog
        open={confirmState.open}
        message={confirmState.message}
        onConfirm={confirmState.onConfirm}
        onCancel={() => setConfirmState({ open: false, message: '', onConfirm: null })}
      />
      
      {/* Header */}
      <header className="add-user-header">
        <div className="header-left">
          <button className="back-btn" onClick={handleBack}>
            <i className="fas fa-arrow-left"></i>
          </button>
          <h1 className="add-user-title">Stock Out</h1>
        </div>
        <div className="header-right">
          <button className="header-btn" onClick={() => onNavigate && onNavigate('stockOutMaster')}>
            <i className="fas fa-home"></i>
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="add-user-content">
        <form onSubmit={handleSubmit} className="add-user-form">
          {/* Customer Details Section */}
          <div className="form-section">
            <h3 className="section-title">Customer Details</h3>
            <div className="form-grid">
              <div className="form-group">
                <label htmlFor="customerName">Customer Name *</label>
                <div className="input-wrapper">
                  <i className="fas fa-user input-icon"></i>
                  <input
                    type="text"
                    id="customerName"
                    name="customerName"
                    className="form-input"
                    placeholder="Enter customer name"
                    value={formData.customerName}
                    onChange={handleInputChange}
                    required
                    autoFocus
                  />
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="customerPhone">Customer Phone Number *</label>
                <div className="input-wrapper" style={{ position: 'relative' }}>
                  <i className="fas fa-phone input-icon"></i>
                  <input
                    type="tel"
                    id="customerPhone"
                    name="customerPhone"
                    className="form-input"
                    placeholder="Enter phone number"
                    value={formData.customerPhone}
                    onChange={handleInputChange}
                    required
                    style={{
                      paddingRight: customerVerified || isCheckingCustomer || customerError ? '40px' : '18px',
                      borderColor: customerError ? '#dc3545' : customerVerified ? '#28a745' : undefined
                    }}
                  />
                  {isCheckingCustomer && (
                    <i className="fas fa-spinner fa-spin" style={{ 
                      position: 'absolute', 
                      right: '12px', 
                      top: '50%',
                      transform: 'translateY(-50%)',
                      color: '#666' 
                    }}></i>
                  )}
                  {!isCheckingCustomer && customerVerified && (
                    <i className="fas fa-check-circle" style={{ 
                      position: 'absolute', 
                      right: '12px', 
                      top: '50%',
                      transform: 'translateY(-50%)',
                      color: '#28a745' 
                    }}></i>
                  )}
                </div>
                {customerError && (
                  <div style={{ 
                    marginTop: '8px', 
                    fontSize: '12px', 
                    color: '#dc3545',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px'
                  }}>
                    <i className="fas fa-exclamation-circle"></i>
                    {customerError}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Product Items Section */}
          <div className="form-section" style={{ opacity: customerVerified ? 1 : 0.6, pointerEvents: customerVerified ? 'auto' : 'none' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h3 className="section-title">Product Items {!customerVerified && <span style={{ fontSize: '14px', color: '#dc3545', fontWeight: 'normal' }}>(Verify customer first)</span>}</h3>
              <button
                type="button"
                onClick={addProductItem}
                disabled={!customerVerified}
                style={{
                  background: customerVerified ? '#dc3545' : '#ccc',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '8px',
                  padding: '8px 16px',
                  cursor: customerVerified ? 'pointer' : 'not-allowed',
                  fontSize: '14px',
                  fontWeight: '600',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  transition: 'all 0.3s ease'
                }}
                onMouseEnter={(e) => {
                  if (customerVerified) e.target.style.background = '#c82333';
                }}
                onMouseLeave={(e) => {
                  if (customerVerified) e.target.style.background = '#dc3545';
                }}
              >
                <i className="fas fa-plus"></i>
                Add Item
              </button>
            </div>

            {productItems.map((item, index) => (
              <div key={item.id} style={{
                border: '1px solid #e9ecef',
                borderRadius: '8px',
                padding: '20px',
                marginBottom: '20px',
                background: '#fff'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                  <h4 style={{ margin: 0, fontSize: '16px', fontWeight: '600', color: '#333' }}>
                    Item {index + 1}
                  </h4>
                  {productItems.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeProductItem(item.id)}
                      style={{
                        background: 'transparent',
                        border: '1px solid #dc3545',
                        color: '#dc3545',
                        borderRadius: '6px',
                        padding: '4px 12px',
                        cursor: 'pointer',
                        fontSize: '12px',
                        fontWeight: '500'
                      }}
                    >
                      <i className="fas fa-trash"></i> Remove
                    </button>
                  )}
                </div>

                <div className="form-grid">
                  {/* Item Code */}
                  <div className="form-group">
                    <label htmlFor={`itemCode-${item.id}`}>Item Code *</label>
                    <div className="input-wrapper" style={{ position: 'relative' }}>
                      <i className="fas fa-barcode input-icon"></i>
                      <input
                        type="text"
                        id={`itemCode-${item.id}`}
                        className="form-input"
                        placeholder="Enter item code"
                        value={item.itemCode}
                        onChange={(e) => handleItemChange(item.id, 'itemCode', e.target.value)}
                        onKeyPress={(e) => handleItemCodeKeyPress(e, item.id)}
                        required
                        style={{ paddingRight: '120px' }}
                      />
                      {item.isFetching ? (
                        <div style={{ 
                          position: 'absolute', 
                          right: '10px', 
                          top: '50%', 
                          transform: 'translateY(-50%)',
                          color: '#999'
                        }}>
                          <i className="fas fa-spinner fa-spin"></i>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => fetchProductByItemCode(item.id)}
                          style={{
                            position: 'absolute',
                            right: '8px',
                            top: '50%',
                            transform: 'translateY(-50%)',
                            padding: '6px 12px',
                            background: '#dc3545',
                            color: '#fff',
                            border: 'none',
                            borderRadius: '6px',
                            cursor: 'pointer',
                            fontSize: '12px',
                            fontWeight: '500',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px'
                          }}
                        >
                          <i className="fas fa-search"></i>
                          Fetch Product
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Category */}
                  <div className="form-group">
                    <label htmlFor={`category-${item.id}`}>Category</label>
                    <div className="input-wrapper">
                      <i className="fas fa-tags input-icon"></i>
                      <input
                        type="text"
                        id={`category-${item.id}`}
                        className="form-input"
                        placeholder="Category"
                        value={item.category}
                        readOnly
                        style={{ background: '#f8f9fa', cursor: 'not-allowed' }}
                      />
                    </div>
                  </div>

                  {/* Product Name */}
                  <div className="form-group">
                    <label htmlFor={`productName-${item.id}`}>Product Name</label>
                    <div className="input-wrapper">
                      <i className="fas fa-box input-icon"></i>
                      <input
                        type="text"
                        id={`productName-${item.id}`}
                        className="form-input"
                        placeholder="Product Name"
                        value={item.productName}
                        readOnly
                        style={{ background: '#f8f9fa', cursor: 'not-allowed' }}
                      />
                    </div>
                  </div>

                  {/* SKU Code */}
                  <div className="form-group">
                    <label htmlFor={`skuCode-${item.id}`}>SKU Code</label>
                    <div className="input-wrapper">
                      <i className="fas fa-boxes input-icon"></i>
                      <input
                        type="text"
                        id={`skuCode-${item.id}`}
                        className="form-input"
                        placeholder="SKU Code"
                        value={item.skuCode}
                        readOnly
                        style={{ background: '#f8f9fa', cursor: 'not-allowed' }}
                      />
                    </div>
                  </div>

                  {/* Quantity (Current Stock) */}
                  <div className="form-group">
                    <label htmlFor={`quantity-${item.id}`}>Current Stock</label>
                    <div className="input-wrapper">
                      <i className="fas fa-warehouse input-icon"></i>
                      <input
                        type="number"
                        id={`quantity-${item.id}`}
                        className="form-input"
                        placeholder="Current Stock"
                        value={item.quantity}
                        readOnly
                        style={{ 
                          background: item.quantity && parseInt(item.quantity) <= 0 ? '#fff3cd' : '#f8f9fa', 
                          cursor: 'not-allowed',
                          fontWeight: 'bold',
                          color: item.quantity && parseInt(item.quantity) <= 0 ? '#dc3545' : '#495057'
                        }}
                      />
                    </div>
                  </div>

                  {/* Stock Out Quantity */}
                  <div className="form-group">
                    <label htmlFor={`stockOutQuantity-${item.id}`}>Stock Out Quantity *</label>
                    <div className="input-wrapper">
                      <i className="fas fa-minus-circle input-icon"></i>
                      <input
                        type="number"
                        id={`stockOutQuantity-${item.id}`}
                        className="form-input"
                        placeholder="Enter quantity to remove"
                        value={item.stockOutQuantity}
                        onChange={(e) => handleItemChange(item.id, 'stockOutQuantity', e.target.value)}
                        min="1"
                        max={item.productInfo ? item.productInfo.currentQuantity : undefined}
                        step="1"
                        required
                        disabled={!item.productInfo}
                      />
                    </div>
                    {item.productInfo && item.stockOutQuantity && !isNaN(parseInt(item.stockOutQuantity)) && (
                      <div style={{ 
                        marginTop: '8px', 
                        padding: '8px', 
                        background: parseInt(item.stockOutQuantity) > item.productInfo.currentQuantity ? '#f8d7da' : '#d4edda', 
                        borderRadius: '6px',
                        fontSize: '13px',
                        color: parseInt(item.stockOutQuantity) > item.productInfo.currentQuantity ? '#721c24' : '#155724'
                      }}>
                        <i className={`fas ${parseInt(item.stockOutQuantity) > item.productInfo.currentQuantity ? 'fa-exclamation-triangle' : 'fa-check-circle'}`} style={{ marginRight: '6px' }}></i>
                        {parseInt(item.stockOutQuantity) > item.productInfo.currentQuantity ? (
                          <strong>Insufficient stock!</strong>
                        ) : (
                          <strong>Stock available</strong>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Pricing Summary */}
          {productItems.some(item => item.itemCode.trim() !== '' && item.productInfo) && (
            <div className="form-section" style={{ 
              background: '#f8f9fa', 
              borderRadius: '8px', 
              padding: '20px',
              marginTop: '20px',
              marginBottom: '20px'
            }}>
              <h3 className="section-title" style={{ marginBottom: '16px' }}>Pricing Summary</h3>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ 
                  width: '100%', 
                  borderCollapse: 'collapse',
                  background: '#fff',
                  borderRadius: '8px',
                  overflow: 'hidden'
                }}>
                  <thead>
                    <tr style={{ background: '#dc3545', color: '#fff' }}>
                      <th style={{ padding: '12px', textAlign: 'left', fontSize: '14px', fontWeight: '600' }}>S.No</th>
                      <th style={{ padding: '12px', textAlign: 'left', fontSize: '14px', fontWeight: '600' }}>Item Code</th>
                      <th style={{ padding: '12px', textAlign: 'left', fontSize: '14px', fontWeight: '600' }}>Product Name</th>
                      <th style={{ padding: '12px', textAlign: 'right', fontSize: '14px', fontWeight: '600' }}>Quantity</th>
                      <th style={{ padding: '12px', textAlign: 'right', fontSize: '14px', fontWeight: '600' }}>MRP</th>
                      <th style={{ padding: '12px', textAlign: 'right', fontSize: '14px', fontWeight: '600' }}>Sell Rate</th>
                      <th style={{ padding: '12px', textAlign: 'right', fontSize: '14px', fontWeight: '600' }}>Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {productItems
                      .filter(item => item.itemCode.trim() !== '' && item.productInfo)
                      .map((item, index) => {
                        const quantity = parseFloat(item.stockOutQuantity) || 0;
                        const mrp = parseFloat(item.mrp) || 0;
                        const sellRate = parseFloat(item.sellRate) || 0;
                        const itemTotal = sellRate * quantity;
                        
                        return (
                          <tr key={item.id} style={{ borderBottom: '1px solid #e9ecef' }}>
                            <td style={{ padding: '12px', fontSize: '13px', color: '#333' }}>{index + 1}</td>
                            <td style={{ padding: '12px', fontSize: '13px', color: '#333', fontWeight: '600' }}>{item.itemCode}</td>
                            <td style={{ padding: '12px', fontSize: '13px', color: '#333' }}>{item.productName || 'N/A'}</td>
                            <td style={{ padding: '12px', textAlign: 'right', fontSize: '13px', color: '#333' }}>{quantity}</td>
                            <td style={{ padding: '12px', textAlign: 'right', fontSize: '13px', color: '#333' }}>₹{mrp.toFixed(2)}</td>
                            <td style={{ padding: '12px', textAlign: 'right', fontSize: '13px', color: '#333', fontWeight: '600' }}>₹{sellRate.toFixed(2)}</td>
                            <td style={{ padding: '12px', textAlign: 'right', fontSize: '13px', color: '#333', fontWeight: '600' }}>₹{itemTotal.toFixed(2)}</td>
                          </tr>
                        );
                      })}
                  </tbody>
                  <tfoot>
                    {(() => {
                      const grandTotal = productItems
                        .filter(item => item.itemCode.trim() !== '' && item.productInfo)
                        .reduce((total, item) => {
                          const quantity = parseFloat(item.stockOutQuantity) || 0;
                          const sellRate = parseFloat(item.sellRate) || 0;
                          return total + (sellRate * quantity);
                        }, 0);
                      
                      return (
                        <>
                          <tr style={{ background: '#f8f9fa', borderTop: '2px solid #e9ecef' }}>
                            <td colSpan="6" style={{ padding: '12px', textAlign: 'right', fontSize: '14px', fontWeight: '600', color: '#333' }}>
                              Grand Total:
                            </td>
                            <td style={{ padding: '12px', textAlign: 'right', fontSize: '16px', fontWeight: '700', color: '#dc3545' }}>
                              ₹{grandTotal.toFixed(2)}
                            </td>
                          </tr>
                          {formData.paymentMode && (
                            <tr style={{ background: '#f8f9fa' }}>
                              <td colSpan="6" style={{ padding: '8px 12px', textAlign: 'right', fontSize: '13px', color: '#666' }}>
                                Payment Mode:
                              </td>
                              <td style={{ padding: '8px 12px', textAlign: 'right', fontSize: '13px', fontWeight: '600', color: '#333' }}>
                                {formData.paymentMode}
                              </td>
                            </tr>
                          )}
                        </>
                      );
                    })()}
                  </tfoot>
                </table>
              </div>
            </div>
          )}

          {/* Payment Details Section - Only shown when customer is verified */}
          {customerVerified && (
            <div className="form-section">
              <h3 className="section-title">Payment Details</h3>
              <div className="form-grid">
                <div className="form-group">
                  <label htmlFor="paymentMode">Payment Mode *</label>
                  <div className="input-wrapper">
                    <i className="fas fa-credit-card input-icon"></i>
                    <select
                      id="paymentMode"
                      name="paymentMode"
                      className="form-input"
                      value={formData.paymentMode}
                      onChange={handleInputChange}
                      required
                    >
                      <option value="">Select payment mode</option>
                      <option value="Cash">Cash</option>
                      <option value="Card">Card</option>
                      <option value="UPI">UPI</option>
                      <option value="Net Banking">Net Banking</option>
                      <option value="Wallet">Wallet</option>
                      <option value="Credit">Credit</option>
                    </select>
                    <i className="fas fa-chevron-down dropdown-icon"></i>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Notes */}
          <div className="form-section">
            <div className="form-group full-width">
              <label htmlFor="notes">Notes (Optional)</label>
              <div className="input-wrapper">
                <i className="fas fa-sticky-note input-icon"></i>
                <textarea
                  id="notes"
                  name="notes"
                  className="form-input textarea-input"
                  placeholder="Add any notes about this stock removal..."
                  rows="3"
                  value={formData.notes}
                  onChange={handleInputChange}
                ></textarea>
              </div>
            </div>
          </div>

          {/* Success/Error Messages */}
          {successMessage && (
            <div className="alert alert-success" style={{ marginBottom: '20px' }}>
              <i className="fas fa-check-circle"></i> {successMessage}
            </div>
          )}

          {error && (
            <div className="alert alert-error" style={{ marginBottom: '20px' }}>
              <i className="fas fa-exclamation-circle"></i> {error}
            </div>
          )}

          {/* Warning Message */}
          <p className="form-warning">
            Make sure all details are correct before removing stock.
          </p>

          {/* Submit Button */}
          <div className="form-actions">
            <button
              type="button"
              className="btn-secondary"
              onClick={handleBack}
              disabled={isLoading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn-primary"
              disabled={isLoading || !customerVerified || !formData.paymentMode || productItems.filter(item => item.itemCode.trim() !== '' && item.productInfo).length === 0}
            >
              {isLoading ? (
                <>
                  <i className="fas fa-spinner fa-spin"></i> Removing Stock...
                </>
              ) : (
                <>
                  <i className="fas fa-minus"></i> Remove Stock
                </>
              )}
            </button>
          </div>
        </form>
      </main>
    </div>
  );
};

export default StockOut;
