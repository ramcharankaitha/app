import React, { useState } from 'react';
import { customersAPI, productsAPI } from '../services/api';
import ConfirmDialog from './ConfirmDialog';

const AddCustomer = ({ onBack, onCancel, onNavigate, userRole = 'admin' }) => {
  const [formData, setFormData] = useState({
    fullName: '',
    phone: '',
    address: '',
    email: '',
    paymentMode: '',
    tokensToRedeem: 0
  });
  const [customerTokens, setCustomerTokens] = useState(0);
  const [isCheckingTokens, setIsCheckingTokens] = useState(false);
  const [productItems, setProductItems] = useState([
    { 
      id: 1, 
      itemCode: '', 
      productName: '',
      skuCode: '',
      category: '',
      quantity: '', 
      mrp: '', 
      sellRate: '', 
      discount: '',
      productStock: null,
      isFetching: false
    }
  ]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [confirmState, setConfirmState] = useState({ open: false, message: '', onConfirm: null });

  const handleBack = () => {
    if (onNavigate) {
      onNavigate('customers');
    } else if (onBack) {
      onBack();
    }
  };

  const handleHome = () => {
    if (onNavigate) {
      onNavigate('dashboard');
    }
  };

  const handleManagers = () => {
    if (onNavigate) {
      onNavigate('users');
    }
  };

  const handleStaff = () => {
    if (onNavigate) {
      onNavigate('staff');
    }
  };

  const handleProducts = () => {
    if (onNavigate) {
      onNavigate('products');
    }
  };

  const handleCustomers = () => {
    if (onNavigate) {
      onNavigate('customers');
    }
  };

  const handleSettings = () => {
    if (onNavigate) {
      onNavigate('settings');
    }
  };

  const handleCancel = () => {
    if (onNavigate) {
      onNavigate('customers');
    } else if (onCancel) {
      onCancel();
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Check for existing customer tokens when phone or email changes
    if (name === 'phone' || name === 'email') {
      const phone = name === 'phone' ? value : formData.phone;
      const email = name === 'email' ? value : formData.email;
      if (phone?.trim() || email?.trim()) {
        checkCustomerTokens(phone?.trim() || '', email?.trim() || '');
      } else {
        setCustomerTokens(0);
        setFormData(prev => ({ ...prev, tokensToRedeem: 0 }));
      }
    }
  };

  const checkCustomerTokens = async (phone, email) => {
    if ((!phone || phone.trim() === '') && (!email || email.trim() === '')) {
      setCustomerTokens(0);
      setFormData(prev => ({ ...prev, tokensToRedeem: 0 }));
      return;
    }
    
    setIsCheckingTokens(true);
    try {
      const response = await customersAPI.getTokens(phone || '', email || '');
      if (response.success && response.tokens !== undefined) {
        setCustomerTokens(response.tokens);
        // Reset token redemption if customer has no tokens
        if (response.tokens === 0) {
          setFormData(prev => ({ ...prev, tokensToRedeem: 0 }));
        }
      } else {
        setCustomerTokens(0);
        setFormData(prev => ({ ...prev, tokensToRedeem: 0 }));
      }
    } catch (err) {
      console.error('Error fetching customer tokens:', err);
      setCustomerTokens(0);
      setFormData(prev => ({ ...prev, tokensToRedeem: 0 }));
    } finally {
      setIsCheckingTokens(false);
    }
  };

  const handleProductItemChange = (id, field, value) => {
    setProductItems(prev => 
      prev.map(item => 
        item.id === id ? { ...item, [field]: value } : item
      )
    );
    
    // Reset product details if item code changes
    if (field === 'itemCode') {
      setProductItems(prev => 
        prev.map(item => 
          item.id === id ? { 
            ...item, 
            productName: '',
            skuCode: '',
            category: '',
            productStock: null, 
            mrp: '', 
            sellRate: '', 
            discount: '' 
          } : item
        )
      );
    }
  };

  const handleItemCodeKeyPress = async (e, itemId) => {
    if (e.key === 'Enter' || e.keyCode === 13) {
      e.preventDefault();
      e.stopPropagation();
      const item = productItems.find(p => p.id === itemId);
      const itemCode = item?.itemCode?.trim();
      if (itemCode) {
        await fetchProductByItemCode(itemCode, itemId);
      } else {
        setError('Please enter an item code');
      }
    }
  };

  const fetchProductByItemCode = async (itemCode, itemId) => {
    if (!itemCode || !itemCode.trim()) {
      setError('Please enter a valid item code');
      return;
    }
    
    setProductItems(prev => 
      prev.map(item => 
        item.id === itemId ? { ...item, isFetching: true } : item
      )
    );
    setError('');
    setSuccessMessage('');
    
    try {
      const response = await productsAPI.getByItemCode(itemCode.trim());
      
      if (response.success && response.product) {
        const product = response.product;
        // Handle both snake_case and camelCase field names from database
        const productName = product.product_name || product.productName || '';
        const skuCode = product.sku_code || product.skuCode || '';
        const category = product.category || '';
        const mrp = product.mrp || '';
        const discount = product.discount || '0';
        const sellRate = product.sell_rate || product.sellRate || '';
        const availableStock = product.current_quantity || product.currentQuantity || 0;
        
        setProductItems(prev => 
          prev.map(item => 
            item.id === itemId ? { 
              ...item, 
              productName: productName,
              skuCode: skuCode,
              category: category,
              mrp: mrp ? String(mrp) : '',
              discount: discount ? String(discount) : '0',
              sellRate: sellRate ? String(sellRate) : '',
              productStock: parseInt(availableStock),
              isFetching: false
            } : item
          )
        );
        
        setSuccessMessage(`Product details fetched successfully! Available stock: ${availableStock}`);
        setTimeout(() => setSuccessMessage(''), 3000);
      } else {
        setError('Product not found with this item code');
        setProductItems(prev => 
          prev.map(item => 
            item.id === itemId ? { 
              ...item, 
              productName: '',
              skuCode: '',
              category: '',
              productStock: null, 
              mrp: '', 
              sellRate: '', 
              discount: '',
              isFetching: false
            } : item
          )
        );
      }
    } catch (err) {
      console.error('Fetch product error:', err);
      setError(err.message || 'Product not found with this item code. Please check the item code and try again.');
      setProductItems(prev => 
        prev.map(item => 
          item.id === itemId ? { 
            ...item, 
            productName: '',
            skuCode: '',
            category: '',
            productStock: null, 
            mrp: '', 
            sellRate: '', 
            discount: '',
            isFetching: false
          } : item
        )
      );
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
      quantity: '', 
      mrp: '', 
      sellRate: '', 
      discount: '',
      productStock: null,
      isFetching: false
    }]);
  };

  const removeProductItem = (id) => {
    if (productItems.length > 1) {
      setProductItems(prev => prev.filter(item => item.id !== id));
    }
  };

  const submitCustomer = async () => {
    setIsLoading(true);
    setError('');
    setSuccessMessage('');

    // Filter out empty product items
    const validItems = productItems.filter(item => item.itemCode.trim() !== '');
    
    if (validItems.length === 0) {
      setError('Please add at least one product.');
      setIsLoading(false);
      return;
    }

    // Validate stock availability for all items
    for (const item of validItems) {
      if (item.itemCode && item.quantity) {
        const requestedQuantity = parseInt(item.quantity) || 0;
        if (requestedQuantity > 0 && item.productStock !== null) {
          if (requestedQuantity > item.productStock) {
            setError(`Insufficient stock for item ${item.itemCode}! Available: ${item.productStock}, Requested: ${requestedQuantity}`);
            setIsLoading(false);
            return;
          }
        }
      }
    }

    try {
      // Calculate total bill amount
      const totalBillAmount = validItems.reduce((total, item) => {
        const quantity = parseFloat(item.quantity) || 0;
        const mrp = parseFloat(item.mrp) || 0;
        const discount = parseFloat(item.discount) || 0;
        const sellRate = parseFloat(item.sellRate) || 0;
        const discountAmount = (mrp * discount) / 100;
        const finalPricePerUnit = sellRate || (mrp - discountAmount);
        return total + (finalPricePerUnit * quantity);
      }, 0);

      // Calculate token redemption amount (1 token = ₹1 discount)
      const tokensToRedeem = parseInt(formData.tokensToRedeem) || 0;
      const tokenDiscount = Math.min(tokensToRedeem, totalBillAmount); // Can't redeem more than bill amount
      const finalBillAmount = Math.max(0, totalBillAmount - tokenDiscount);

      // Calculate tokens earned (1 token per ₹1000)
      const tokensEarned = Math.floor(finalBillAmount / 1000);

      // Create a customer record for each product item
      const promises = validItems.map(item =>
        customersAPI.create({
          fullName: formData.fullName,
          email: formData.email,
          phone: formData.phone,
          address: formData.address,
          itemCode: item.itemCode,
          quantity: item.quantity ? parseInt(item.quantity) : 0,
          mrp: item.mrp ? parseFloat(item.mrp) : null,
          sellRate: item.sellRate ? parseFloat(item.sellRate) : null,
          discount: item.discount ? parseFloat(item.discount) : 0,
          paymentMode: formData.paymentMode,
          tokensUsed: tokensToRedeem,
          tokensEarned: tokensEarned,
          totalAmount: finalBillAmount
        })
      );

      const results = await Promise.all(promises);
      const allSuccess = results.every(result => result.success);

      if (allSuccess) {
        const message = tokensEarned > 0 
          ? `Save changes are done! You earned ${tokensEarned} token(s).`
          : 'Save changes are done';
        setSuccessMessage(message);
        setTimeout(() => {
          setSuccessMessage('');
          handleCancel();
        }, 3000);
      } else {
        setError('Some customer records failed to create. Please try again.');
      }
    } catch (err) {
      setError(err.message || 'Failed to create customer records. Please try again.');
      console.error('Create customer error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setConfirmState({
      open: true,
      message: 'Are you sure you want to submit?',
      onConfirm: submitCustomer,
    });
  };

  return (
    <div className="dashboard-container">
      {/* Left Sidebar Navigation */}
      <nav className="sidebar-nav">
        <div className="nav-item" onClick={handleHome}>
          <div className="nav-icon">
            <i className="fas fa-home"></i>
          </div>
          <span>Home</span>
        </div>
        {userRole === 'admin' && (
          <div className="nav-item" onClick={handleManagers}>
            <div className="nav-icon">
              <i className="fas fa-users"></i>
            </div>
            <span>Supervisors</span>
          </div>
        )}
        <div className="nav-item" onClick={handleStaff}>
          <div className="nav-icon">
            <i className="fas fa-user-tie"></i>
          </div>
          <span>Staff</span>
        </div>
        <div className="nav-item active" onClick={handleCustomers}>
          <div className="nav-icon">
            <i className="fas fa-user-friends"></i>
          </div>
          <span>Customers</span>
        </div>
        <div className="nav-item" onClick={() => onNavigate && onNavigate('masterMenu')}>
          <div className="nav-icon">
            <i className="fas fa-th-large"></i>
          </div>
          <span>Master Menu</span>
        </div>
        <div className="nav-item" onClick={handleSettings}>
          <div className="nav-icon">
            <i className="fas fa-cog"></i>
          </div>
          <span>Settings</span>
        </div>
      </nav>

      {/* Main Content Area */}
      <div className="dashboard-main">
        <div className="add-user-container">
          {/* Header */}
          <header className="add-user-header">
            <button className="back-btn" onClick={handleBack}>
              <i className="fas fa-arrow-left"></i>
            </button>
            <div className="header-content">
              <h1 className="page-title">Add Customer</h1>
              <p className="page-subtitle">Create a new customer for this store.</p>
            </div>
          </header>

          {/* Main Content */}
          <main className="add-user-content">
            {/* Photo Upload */}
            <div className="photo-upload-section">
              <div className="photo-placeholder">
                <i className="fas fa-camera"></i>
              </div>
              <button type="button" className="upload-photo-btn">
                <i className="fas fa-camera"></i>
                <span>Upload photo</span>
              </button>
            </div>

            <form onSubmit={handleSubmit} className="add-user-form">
                {/* Customer Details Section */}
                <div className="form-section">
                  <h3 className="section-title">Customer details</h3>
                  <div className="form-grid">
                    <div className="form-group">
                      <label htmlFor="fullName">Name</label>
                      <input
                        type="text"
                        id="fullName"
                        name="fullName"
                        className="form-input"
                        placeholder="Enter full name."
                        value={formData.fullName}
                        onChange={handleInputChange}
                        required
                      />
                    </div>

                    <div className="form-group">
                      <label htmlFor="phone">Contact number</label>
                      <div className="input-wrapper">
                        <i className="fas fa-phone input-icon"></i>
                        <input
                          type="tel"
                          id="phone"
                          name="phone"
                          className="form-input"
                          placeholder="Enter contact number."
                          value={formData.phone}
                          onChange={handleInputChange}
                          required
                        />
                      </div>
                      {isCheckingTokens && formData.phone && (
                        <div style={{ marginTop: '4px', fontSize: '11px', color: '#666', fontStyle: 'italic' }}>
                          <i className="fas fa-spinner fa-spin" style={{ marginRight: '4px' }}></i>
                          Checking for tokens...
                        </div>
                      )}
                      {!isCheckingTokens && customerTokens > 0 && formData.phone && (
                        <div style={{ 
                          marginTop: '4px', 
                          fontSize: '12px', 
                          color: '#28a745', 
                          fontWeight: '600',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px'
                        }}>
                          <i className="fas fa-gift"></i>
                          Returning customer! You have {customerTokens} token(s) available.
                        </div>
                      )}
                    </div>

                    <div className="form-group">
                      <label htmlFor="email">Email</label>
                      <div className="input-wrapper">
                        <i className="fas fa-envelope input-icon"></i>
                        <input
                          type="email"
                          id="email"
                          name="email"
                          className="form-input"
                          placeholder="customer@example.com"
                          value={formData.email}
                          onChange={handleInputChange}
                          required
                        />
                      </div>
                      {isCheckingTokens && formData.email && !formData.phone && (
                        <div style={{ marginTop: '4px', fontSize: '11px', color: '#666', fontStyle: 'italic' }}>
                          <i className="fas fa-spinner fa-spin" style={{ marginRight: '4px' }}></i>
                          Checking for tokens...
                        </div>
                      )}
                      {!isCheckingTokens && customerTokens > 0 && formData.email && !formData.phone && (
                        <div style={{ 
                          marginTop: '4px', 
                          fontSize: '12px', 
                          color: '#28a745', 
                          fontWeight: '600',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px'
                        }}>
                          <i className="fas fa-gift"></i>
                          Returning customer! You have {customerTokens} token(s) available.
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Address Section */}
                <div className="form-section">
                  <h3 className="section-title">Address</h3>
                  
                  <div className="form-group">
                    <label htmlFor="address">Address</label>
                    <div className="input-wrapper">
                      <i className="fas fa-map-marker-alt input-icon"></i>
                      <textarea
                        id="address"
                        name="address"
                        className="form-input textarea-input"
                        placeholder="Street, area, city&#10;State, pincode"
                        rows="2"
                        value={formData.address}
                        onChange={handleInputChange}
                        required
                      ></textarea>
                    </div>
                  </div>
                </div>

                {/* Product Details Section */}
                <div className="form-section">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                    <h3 className="section-title">Products to Purchase</h3>
                    <button
                      type="button"
                      onClick={addProductItem}
                      style={{
                        background: '#dc3545',
                        color: '#fff',
                        border: 'none',
                        borderRadius: '8px',
                        padding: '8px 16px',
                        cursor: 'pointer',
                        fontSize: '14px',
                        fontWeight: '600',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px'
                      }}
                    >
                      <i className="fas fa-plus"></i>
                      <span>Add Product</span>
                    </button>
                  </div>
                  
                  {productItems.map((item, index) => (
                    <div key={item.id} style={{ 
                      marginBottom: '24px', 
                      padding: '20px', 
                      border: '2px solid #f0f0f0', 
                      borderRadius: '8px',
                      position: 'relative'
                    }}>
                      {productItems.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeProductItem(item.id)}
                          style={{
                            position: 'absolute',
                            top: '10px',
                            right: '10px',
                            background: '#dc3545',
                            color: '#fff',
                            border: 'none',
                            borderRadius: '50%',
                            width: '28px',
                            height: '28px',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '14px'
                          }}
                        >
                          <i className="fas fa-times"></i>
                        </button>
                      )}
                      <div style={{ marginBottom: '12px', fontWeight: '600', color: '#333' }}>
                        Product {index + 1}
                      </div>
                      <div className="form-grid">
                        <div className="form-group">
                          <label htmlFor={`itemCode-${item.id}`}>
                            Item code {item.isFetching && <span style={{ color: '#dc3545', fontSize: '12px' }}>(Fetching...)</span>}
                          </label>
                          <div className="input-wrapper">
                            <i className="fas fa-barcode input-icon"></i>
                            <input
                              type="text"
                              id={`itemCode-${item.id}`}
                              className="form-input"
                              placeholder="Enter item code and press Enter"
                              value={item.itemCode}
                              onChange={(e) => handleProductItemChange(item.id, 'itemCode', e.target.value)}
                              onKeyDown={(e) => handleItemCodeKeyPress(e, item.id)}
                              disabled={item.isFetching}
                              autoComplete="off"
                            />
                          </div>
                        </div>

                        {item.productName && (
                          <div className="form-group">
                            <label>Product Name</label>
                            <div className="input-wrapper" style={{ background: '#f8f9fa', cursor: 'not-allowed' }}>
                              <i className="fas fa-tag input-icon"></i>
                              <input
                                type="text"
                                className="form-input"
                                value={item.productName}
                                readOnly
                                style={{ background: 'transparent', color: '#333' }}
                              />
                            </div>
                          </div>
                        )}

                        {item.skuCode && (
                          <div className="form-group">
                            <label>SKU Code</label>
                            <div className="input-wrapper" style={{ background: '#f8f9fa', cursor: 'not-allowed' }}>
                              <i className="fas fa-boxes input-icon"></i>
                              <input
                                type="text"
                                className="form-input"
                                value={item.skuCode}
                                readOnly
                                style={{ background: 'transparent', color: '#333' }}
                              />
                            </div>
                          </div>
                        )}

                        {item.category && (
                          <div className="form-group">
                            <label>Category</label>
                            <div className="input-wrapper" style={{ background: '#f8f9fa', cursor: 'not-allowed' }}>
                              <i className="fas fa-th-large input-icon"></i>
                              <input
                                type="text"
                                className="form-input"
                                value={item.category}
                                readOnly
                                style={{ background: 'transparent', color: '#333' }}
                              />
                            </div>
                          </div>
                        )}

                        <div className="form-group">
                          <label htmlFor={`quantity-${item.id}`}>
                            Quantity
                            {item.productStock !== null && (
                              <span style={{ 
                                marginLeft: '8px', 
                                fontSize: '12px', 
                                fontWeight: 'normal',
                                color: item.productStock > 0 ? '#28a745' : '#dc3545'
                              }}>
                                (Available: {item.productStock})
                              </span>
                            )}
                          </label>
                          <div className="input-wrapper">
                            <i className="fas fa-cubes input-icon"></i>
                            <input
                              type="number"
                              id={`quantity-${item.id}`}
                              className="form-input"
                              placeholder="Enter quantity."
                              value={item.quantity}
                              onChange={(e) => handleProductItemChange(item.id, 'quantity', e.target.value)}
                              min="0"
                              max={item.productStock !== null ? item.productStock : undefined}
                            />
                          </div>
                          {item.productStock !== null && item.quantity && parseInt(item.quantity) > item.productStock && (
                            <div style={{ 
                              marginTop: '4px', 
                              fontSize: '12px', 
                              color: '#dc3545' 
                            }}>
                              <i className="fas fa-exclamation-triangle"></i> Insufficient stock! Available: {item.productStock}
                            </div>
                          )}
                        </div>

                        <div className="form-group">
                          <label htmlFor={`mrp-${item.id}`}>MRP</label>
                          <div className="input-wrapper">
                            <i className="fas fa-rupee-sign input-icon"></i>
                            <input
                              type="number"
                              id={`mrp-${item.id}`}
                              className="form-input"
                              placeholder="Enter MRP."
                              value={item.mrp}
                              onChange={(e) => handleProductItemChange(item.id, 'mrp', e.target.value)}
                              min="0"
                              step="0.01"
                            />
                          </div>
                        </div>

                        <div className="form-group">
                          <label htmlFor={`sellRate-${item.id}`}>Sell rate</label>
                          <div className="input-wrapper">
                            <i className="fas fa-tag input-icon"></i>
                            <input
                              type="number"
                              id={`sellRate-${item.id}`}
                              className="form-input"
                              placeholder="Enter sell rate."
                              value={item.sellRate}
                              onChange={(e) => handleProductItemChange(item.id, 'sellRate', e.target.value)}
                              min="0"
                              step="0.01"
                            />
                          </div>
                        </div>

                        <div className="form-group">
                          <label htmlFor={`discount-${item.id}`}>Discount</label>
                          <div className="input-wrapper">
                            <i className="fas fa-percent input-icon"></i>
                            <input
                              type="number"
                              id={`discount-${item.id}`}
                              className="form-input"
                              placeholder="Enter discount."
                              value={item.discount}
                              onChange={(e) => handleProductItemChange(item.id, 'discount', e.target.value)}
                              min="0"
                              step="0.01"
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}

                  <div className="form-group">
                    <label htmlFor="paymentMode">Payment mode</label>
                    <div className="input-wrapper">
                      <i className="fas fa-credit-card input-icon"></i>
                      <select
                        id="paymentMode"
                        name="paymentMode"
                        className="form-input"
                        value={formData.paymentMode}
                        onChange={handleInputChange}
                      >
                        <option value="">Select payment mode.</option>
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

                  {/* Token Redemption Section */}
                  {customerTokens > 0 && (
                    <div className="form-group" style={{ 
                      gridColumn: '1 / -1',
                      padding: '16px',
                      background: '#fff5f5',
                      borderRadius: '8px',
                      border: '2px solid #dc3545'
                    }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                        <label htmlFor="tokensToRedeem" style={{ margin: 0, fontWeight: '600', color: '#333' }}>
                          <i className="fas fa-gift" style={{ marginRight: '8px', color: '#dc3545' }}></i>
                          Available Tokens: <span style={{ color: '#dc3545', fontSize: '18px' }}>{customerTokens}</span>
                        </label>
                        {isCheckingTokens && (
                          <span style={{ fontSize: '12px', color: '#666' }}>Checking...</span>
                        )}
                      </div>
                      <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                        <div className="input-wrapper" style={{ flex: 1 }}>
                          <i className="fas fa-ticket-alt input-icon"></i>
                          <input
                            type="number"
                            id="tokensToRedeem"
                            name="tokensToRedeem"
                            className="form-input"
                            placeholder="Enter tokens to redeem (1 token = ₹1)"
                            value={formData.tokensToRedeem}
                            onChange={(e) => {
                              const value = Math.max(0, Math.min(parseInt(e.target.value) || 0, customerTokens));
                              setFormData(prev => ({ ...prev, tokensToRedeem: value }));
                            }}
                            min="0"
                            max={customerTokens}
                          />
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            // Calculate max tokens that can be redeemed based on bill amount
                            const totalBill = productItems
                              .filter(item => item.itemCode.trim() !== '')
                              .reduce((total, item) => {
                                const quantity = parseFloat(item.quantity) || 0;
                                const mrp = parseFloat(item.mrp) || 0;
                                const discount = parseFloat(item.discount) || 0;
                                const sellRate = parseFloat(item.sellRate) || 0;
                                const discountAmount = (mrp * discount) / 100;
                                const finalPricePerUnit = sellRate || (mrp - discountAmount);
                                return total + (finalPricePerUnit * quantity);
                              }, 0);
                            const maxRedeemable = Math.min(customerTokens, Math.floor(totalBill));
                            setFormData(prev => ({ ...prev, tokensToRedeem: maxRedeemable }));
                          }}
                          style={{
                            padding: '10px 16px',
                            background: '#dc3545',
                            color: '#fff',
                            border: 'none',
                            borderRadius: '8px',
                            cursor: 'pointer',
                            fontSize: '13px',
                            fontWeight: '600',
                            whiteSpace: 'nowrap'
                          }}
                        >
                          Use Max
                        </button>
                      </div>
                      <div style={{ marginTop: '8px', fontSize: '12px', color: '#666' }}>
                        <i className="fas fa-info-circle"></i> 1 token = ₹1 discount. You can redeem up to {customerTokens} tokens.
                      </div>
                    </div>
                  )}
                </div>

                {/* Billing Summary */}
                {productItems.some(item => item.itemCode.trim() !== '') && (
                  <div className="form-section" style={{ 
                    background: '#f8f9fa', 
                    borderRadius: '8px', 
                    padding: '20px',
                    marginTop: '20px',
                    marginBottom: '20px'
                  }}>
                    <h3 className="section-title" style={{ marginBottom: '16px' }}>Billing Summary</h3>
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
                            <th style={{ padding: '12px', textAlign: 'right', fontSize: '14px', fontWeight: '600' }}>Discount</th>
                            <th style={{ padding: '12px', textAlign: 'right', fontSize: '14px', fontWeight: '600' }}>Sell Rate</th>
                            <th style={{ padding: '12px', textAlign: 'right', fontSize: '14px', fontWeight: '600' }}>Amount</th>
                          </tr>
                        </thead>
                        <tbody>
                          {productItems
                            .filter(item => item.itemCode.trim() !== '')
                            .map((item, index) => {
                              const quantity = parseFloat(item.quantity) || 0;
                              const mrp = parseFloat(item.mrp) || 0;
                              const discount = parseFloat(item.discount) || 0;
                              const sellRate = parseFloat(item.sellRate) || 0;
                              // Calculate discount amount
                              const discountAmount = (mrp * discount) / 100;
                              // Final price per unit after discount
                              const finalPricePerUnit = sellRate || (mrp - discountAmount);
                              // Total amount for this item
                              const itemTotal = finalPricePerUnit * quantity;
                              
                              return (
                                <tr key={item.id} style={{ borderBottom: '1px solid #e9ecef' }}>
                                  <td style={{ padding: '12px', fontSize: '13px', color: '#333' }}>{index + 1}</td>
                                  <td style={{ padding: '12px', fontSize: '13px', color: '#333', fontWeight: '600' }}>{item.itemCode}</td>
                                  <td style={{ padding: '12px', fontSize: '13px', color: '#333' }}>{item.productName || 'N/A'}</td>
                                  <td style={{ padding: '12px', textAlign: 'right', fontSize: '13px', color: '#333' }}>{quantity}</td>
                                  <td style={{ padding: '12px', textAlign: 'right', fontSize: '13px', color: '#333' }}>₹{mrp.toFixed(2)}</td>
                                  <td style={{ padding: '12px', textAlign: 'right', fontSize: '13px', color: '#333' }}>
                                    {discount > 0 ? `${discount}% (₹${discountAmount.toFixed(2)})` : '₹0.00'}
                                  </td>
                                  <td style={{ padding: '12px', textAlign: 'right', fontSize: '13px', color: '#333', fontWeight: '600' }}>₹{finalPricePerUnit.toFixed(2)}</td>
                                  <td style={{ padding: '12px', textAlign: 'right', fontSize: '13px', color: '#333', fontWeight: '600' }}>₹{itemTotal.toFixed(2)}</td>
                                </tr>
                              );
                            })}
                        </tbody>
                        <tfoot>
                          {(() => {
                            const subtotal = productItems
                              .filter(item => item.itemCode.trim() !== '')
                              .reduce((total, item) => {
                                const quantity = parseFloat(item.quantity) || 0;
                                const mrp = parseFloat(item.mrp) || 0;
                                const discount = parseFloat(item.discount) || 0;
                                const sellRate = parseFloat(item.sellRate) || 0;
                                const discountAmount = (mrp * discount) / 100;
                                const finalPricePerUnit = sellRate || (mrp - discountAmount);
                                return total + (finalPricePerUnit * quantity);
                              }, 0);
                            
                            const tokensToRedeem = parseInt(formData.tokensToRedeem) || 0;
                            const tokenDiscount = Math.min(tokensToRedeem, subtotal);
                            const grandTotal = Math.max(0, subtotal - tokenDiscount);
                            const tokensEarned = Math.floor(grandTotal / 1000);
                            
                            return (
                              <>
                                <tr style={{ background: '#f8f9fa', borderTop: '2px solid #e9ecef' }}>
                                  <td colSpan="7" style={{ padding: '8px 12px', textAlign: 'right', fontSize: '13px', color: '#666' }}>
                                    Subtotal:
                                  </td>
                                  <td style={{ padding: '8px 12px', textAlign: 'right', fontSize: '13px', color: '#333' }}>
                                    ₹{subtotal.toFixed(2)}
                                  </td>
                                </tr>
                                {tokensToRedeem > 0 && (
                                  <tr style={{ background: '#fff5f5' }}>
                                    <td colSpan="7" style={{ padding: '8px 12px', textAlign: 'right', fontSize: '13px', color: '#dc3545', fontWeight: '600' }}>
                                      <i className="fas fa-gift" style={{ marginRight: '6px' }}></i>
                                      Tokens Redeemed ({tokensToRedeem} tokens):
                                    </td>
                                    <td style={{ padding: '8px 12px', textAlign: 'right', fontSize: '13px', color: '#dc3545', fontWeight: '600' }}>
                                      -₹{tokenDiscount.toFixed(2)}
                                    </td>
                                  </tr>
                                )}
                                <tr style={{ background: '#f8f9fa', borderTop: '2px solid #dc3545' }}>
                                  <td colSpan="7" style={{ padding: '12px', textAlign: 'right', fontSize: '14px', fontWeight: '600', color: '#333' }}>
                                    Grand Total:
                                  </td>
                                  <td style={{ padding: '12px', textAlign: 'right', fontSize: '16px', fontWeight: '700', color: '#dc3545' }}>
                                    ₹{grandTotal.toFixed(2)}
                                  </td>
                                </tr>
                                {tokensEarned > 0 && (
                                  <tr style={{ background: '#d4edda' }}>
                                    <td colSpan="7" style={{ padding: '8px 12px', textAlign: 'right', fontSize: '13px', color: '#155724', fontWeight: '600' }}>
                                      <i className="fas fa-star" style={{ marginRight: '6px' }}></i>
                                      Tokens Earned:
                                    </td>
                                    <td style={{ padding: '8px 12px', textAlign: 'right', fontSize: '13px', color: '#155724', fontWeight: '600' }}>
                                      +{tokensEarned} token(s)
                                    </td>
                                  </tr>
                                )}
                                {formData.paymentMode && (
                                  <tr style={{ background: '#f8f9fa' }}>
                                    <td colSpan="7" style={{ padding: '8px 12px', textAlign: 'right', fontSize: '13px', color: '#666' }}>
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

                {/* Warning Message */}
                <p className="form-warning">
                  Make sure all customer details are correct before saving.
                </p>

                {/* Error Message */}
                {error && (
                  <div className="error-message" style={{ 
                    padding: '12px', 
                    background: '#ffe0e0', 
                    color: '#dc3545', 
                    borderRadius: '8px', 
                    marginBottom: '20px' 
                  }}>
                    <i className="fas fa-exclamation-circle"></i> {error}
                  </div>
                )}

                {/* Success Message */}
                {successMessage && (
                  <div className="success-message" style={{ 
                    padding: '12px', 
                    background: '#d4edda', 
                    color: '#155724', 
                    borderRadius: '8px', 
                    marginBottom: '20px' 
                  }}>
                    <i className="fas fa-check-circle"></i> {successMessage}
                  </div>
                )}

                {/* Action Buttons */}
                <div className="form-actions">
                  <button type="submit" className="create-user-btn" disabled={isLoading}>
                    {isLoading ? 'Creating...' : 'Create Customer'}
                  </button>
                  <button type="button" className="cancel-btn" onClick={handleCancel}>
                    Cancel and go back
                  </button>
                </div>
              </form>
          </main>
        </div>
      </div>

      <ConfirmDialog
        isOpen={confirmState.open}
        title="Confirm Submission"
        message={confirmState.message}
        confirmText="Yes, Submit"
        cancelText="Cancel"
        onConfirm={() => {
          setConfirmState({ open: false, message: '', onConfirm: null });
          if (confirmState.onConfirm) confirmState.onConfirm();
        }}
        onCancel={() => setConfirmState({ open: false, message: '', onConfirm: null })}
      />
    </div>
  );
};

export default AddCustomer;

