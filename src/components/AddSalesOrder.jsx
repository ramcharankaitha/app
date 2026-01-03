import React, { useState, useEffect, useRef } from 'react';
import { productsAPI, staffAPI, salesOrdersAPI, customersAPI } from '../services/api';
import ConfirmDialog from './ConfirmDialog';
import './addUser.css';

const AddSalesOrder = ({ onBack, onCancel, onNavigate, userRole = 'admin' }) => {
  const [formData, setFormData] = useState({
    customerName: '',
    customerContact: '',
    handlerId: '',
    handlerName: '',
    handlerMobile: '',
    dateOfDuration: ''
  });
  // Current product being entered (single form)
  const [currentProduct, setCurrentProduct] = useState({
    itemCode: '',
    productName: '',
    quantity: '',
    mrp: '',
    sellRate: '',
    isFetching: false,
    productInfo: null
  });
  
  // Added products (displayed as cards)
  const [addedProducts, setAddedProducts] = useState([]);
  const [handlers, setHandlers] = useState([]);
  const [allCustomers, setAllCustomers] = useState([]);
  const [showCustomerDropdown, setShowCustomerDropdown] = useState(false);
  const customerDropdownRef = useRef(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [confirmState, setConfirmState] = useState({ open: false, message: '', onConfirm: null });

  // Fetch handlers (staff with is_handler = true)
  const fetchHandlers = async () => {
    try {
      const response = await staffAPI.getAll();
      if (response.success) {
        const handlerList = response.staff
          .filter(staff => staff.is_handler === true)
          .map(staff => ({
            id: staff.id,
            name: staff.full_name,
            phone: staff.phone || ''
          }));
        setHandlers(handlerList);
      }
    } catch (err) {
      console.error('Error fetching handlers:', err);
    }
  };

  // Fetch all customers
  const fetchAllCustomers = async () => {
    try {
      const response = await customersAPI.getAll();
      if (response.success) {
        // Get unique customers by phone number
        const uniqueCustomers = [];
        const seenPhones = new Set();
        response.customers.forEach(customer => {
          if (customer.phone && !seenPhones.has(customer.phone)) {
            seenPhones.add(customer.phone);
            uniqueCustomers.push({
              id: customer.id,
              name: customer.full_name,
              phone: customer.phone,
              email: customer.email || '',
              address: customer.address || '',
              city: customer.city || '',
              state: customer.state || '',
              pincode: customer.pincode || '',
              customer_unique_id: customer.customer_unique_id || ''
            });
          }
        });
        setAllCustomers(uniqueCustomers);
      }
    } catch (err) {
      console.error('Error fetching customers:', err);
    }
  };


  useEffect(() => {
    fetchHandlers();
    fetchAllCustomers();
    
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        fetchHandlers();
        fetchAllCustomers();
      }
    };
    
    const handleFocus = () => {
      fetchHandlers();
      fetchAllCustomers();
    };
    
    const handleStaffUpdate = () => {
      fetchHandlers();
    };
    
    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('focus', handleFocus);
    window.addEventListener('staffUpdated', handleStaffUpdate);
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', handleFocus);
      window.removeEventListener('staffUpdated', handleStaffUpdate);
    };
  }, []);

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (customerDropdownRef.current && !customerDropdownRef.current.contains(event.target)) {
        setShowCustomerDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Filter customers based on search (name, phone, or unique ID)
  const filteredCustomers = allCustomers.filter(customer => {
    const searchTerm = formData.customerName.toLowerCase();
    return customer.name.toLowerCase().includes(searchTerm) || 
           customer.phone.includes(searchTerm) ||
           (customer.customer_unique_id && customer.customer_unique_id.toLowerCase().includes(searchTerm));
  });


  const handleBack = () => {
    if (onNavigate) {
      onNavigate('salesOrder');
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
      onNavigate('salesOrder');
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

    // Show dropdowns when typing
    if (name === 'customerName') {
      if (value.trim().length > 0) {
        setShowCustomerDropdown(true);
      } else {
        setShowCustomerDropdown(false);
        setFormData(prev => ({ ...prev, customerContact: '' }));
      }
    }
  };

  // Handle customer selection
  const handleCustomerSelect = (customer) => {
    setFormData(prev => ({
      ...prev,
      customerName: customer.name,
      customerContact: customer.phone
    }));
    setShowCustomerDropdown(false);
  };


  // Handle handler selection from dropdown
  const handleHandlerChange = (e) => {
    const handlerId = e.target.value;
    if (handlerId) {
      const selectedHandler = handlers.find(h => h.id === parseInt(handlerId));
      if (selectedHandler) {
        setFormData(prev => ({
          ...prev,
          handlerId: handlerId,
          handlerName: selectedHandler.name,
          handlerMobile: selectedHandler.phone || ''
        }));
      }
    } else {
      setFormData(prev => ({
        ...prev,
        handlerId: '',
        handlerName: '',
        handlerMobile: ''
      }));
    }
  };

  // Handle current product input changes
  const handleCurrentProductChange = (e) => {
    const { name, value } = e.target;
    setCurrentProduct(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Fetch product by item code
  const fetchProductByItemCode = async () => {
    if (!currentProduct.itemCode?.trim()) {
      setError('Please enter an item code');
      return;
    }
    
    setCurrentProduct(prev => ({ ...prev, isFetching: true }));
    setError('');
    
    try {
      const response = await productsAPI.getByItemCode(currentProduct.itemCode.trim());
      
      if (response.success && response.product) {
        const product = response.product;
        setCurrentProduct(prev => ({
          ...prev,
          productInfo: {
            id: product.id,
            productName: product.product_name || product.productName || '',
            itemCode: product.item_code || product.itemCode || '',
            mrp: product.mrp || 0,
            sellRate: product.sell_rate || product.sellRate || 0
          },
          productName: product.product_name || product.productName || '',
          mrp: (product.mrp || 0).toString(),
          sellRate: (product.sell_rate || product.sellRate || 0).toString(),
          isFetching: false
        }));
      } else {
        setError('Product not found with this item code');
        setCurrentProduct(prev => ({ 
          ...prev, 
          productInfo: null, 
          productName: '',
          isFetching: false 
        }));
      }
    } catch (err) {
      console.error('Fetch product error:', err);
      setError(err.message || 'Product not found. Please check the item code and try again.');
      setCurrentProduct(prev => ({ 
        ...prev, 
        productInfo: null, 
        productName: '',
        isFetching: false 
      }));
    }
  };

  const handleItemCodeKeyPress = async (e) => {
    if (e.key === 'Enter' || e.keyCode === 13) {
      e.preventDefault();
      await fetchProductByItemCode();
    }
  };

  // Add product to the list
  const addProduct = () => {
    if (!currentProduct.productInfo || !currentProduct.quantity || parseFloat(currentProduct.quantity) <= 0) {
      setError('Please fetch product and enter a valid quantity');
      return;
    }

    // Check for duplicate item codes
    const isDuplicate = addedProducts.some(p => 
      p.itemCode && p.itemCode.trim() === currentProduct.itemCode.trim()
    );
    
    if (isDuplicate) {
      setError('This product is already added. Please remove it first if you want to change the details.');
      return;
    }

    const newId = addedProducts.length > 0 
      ? Math.max(...addedProducts.map(p => p.id)) + 1 
      : 1;
    
    setAddedProducts(prev => [...prev, {
      id: newId,
      itemCode: currentProduct.itemCode.trim(),
      productName: currentProduct.productName,
      quantity: parseFloat(currentProduct.quantity) || 0,
      mrp: parseFloat(currentProduct.mrp) || 0,
      sellRate: parseFloat(currentProduct.sellRate) || 0,
      productInfo: currentProduct.productInfo
    }]);
    
    // Clear current product form
    setCurrentProduct({
      itemCode: '',
      productName: '',
      quantity: '',
      mrp: '',
      sellRate: '',
      isFetching: false,
      productInfo: null
    });
    setError('');
  };

  const removeProduct = (productId) => {
    setAddedProducts(prev => prev.filter(p => p.id !== productId));
  };

  const submitSalesOrder = async () => {
    setIsLoading(true);
    setError('');
    setSuccessMessage('');

    try {
      // Validation
      if (!formData.customerName || !formData.customerName.trim()) {
        setError('Please enter customer name');
        setIsLoading(false);
        return;
      }

      if (!formData.customerContact || !formData.customerContact.trim()) {
        setError('Please enter customer contact number');
        setIsLoading(false);
        return;
      }

      if (!formData.dateOfDuration) {
        setError('Please select date of duration');
        setIsLoading(false);
        return;
      }

      if (addedProducts.length === 0) {
        setError('Please add at least one product');
        setIsLoading(false);
        return;
      }

      // Prepare products array with pricing
      const products = addedProducts.map(item => ({
        itemCode: item.itemCode.trim(),
        productName: item.productName,
        quantity: item.quantity || 0,
        mrp: item.mrp || 0,
        sellRate: item.sellRate || 0
      }));

      // Calculate total amount from products
      const totalAmount = products.reduce((total, product) => {
        const quantity = parseFloat(product.quantity) || 0;
        const sellRate = parseFloat(product.sellRate) || 0;
        return total + (quantity * sellRate);
      }, 0);

      const userData = JSON.parse(localStorage.getItem('userData') || '{}');
      const createdBy = userData.username || userData.email || 'system';

      const response = await salesOrdersAPI.create({
        customerName: formData.customerName.trim(),
        customerContact: formData.customerContact.trim(),
        handlerId: formData.handlerId ? parseInt(formData.handlerId) : null,
        handlerName: formData.handlerName,
        handlerMobile: formData.handlerMobile,
        dateOfDuration: formData.dateOfDuration,
        products: products,
        totalAmount: totalAmount,
        createdBy: createdBy
      });

      if (response.success) {
        setSuccessMessage('Sales order created successfully');
        // Dispatch event to notify SalesOrder page to refresh
        window.dispatchEvent(new CustomEvent('salesOrderCreated'));
        setTimeout(() => {
          setSuccessMessage('');
          handleCancel();
        }, 2000);
      } else {
        setError(response.error || 'Failed to create sales order. Please try again.');
      }
    } catch (err) {
      setError(err.message || 'Failed to create sales order. Please try again.');
      console.error('Create sales order error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setConfirmState({
      open: true,
      message: 'Are you sure you want to create this sales order?',
      onConfirm: submitSalesOrder,
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
        {userRole !== 'staff' && (
          <div className="nav-item" onClick={handleStaff}>
            <div className="nav-icon">
              <i className="fas fa-user-tie"></i>
            </div>
            <span>Staff</span>
          </div>
        )}
        <div className="nav-item" onClick={() => onNavigate && onNavigate('masterMenu')}>
          <div className="nav-icon">
            <i className="fas fa-th-large"></i>
          </div>
          <span>Master Menu</span>
        </div>
        <div className="nav-item active" onClick={() => onNavigate && onNavigate('transactionMenu')}>
          <div className="nav-icon">
            <i className="fas fa-exchange-alt"></i>
          </div>
          <span>Transaction</span>
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
              <h1 className="page-title">Create Sales Order</h1>
              <p className="page-subtitle">Add a new sales order to the system.</p>
            </div>
          </header>

          {/* Main Content */}
          <main className="add-user-content">
            <form onSubmit={handleSubmit} className="add-user-form">
              <div className="form-grid four-col">
                {/* Row 1: Customer Name, Customer Phone Number, Handler Dropdown, Handler Phone Number */}
                <div className="form-group" ref={customerDropdownRef} style={{ position: 'relative', zIndex: 1000 }}>
                  <label htmlFor="customerName">Customer Name *</label>
                  <div className="input-wrapper">
                    <i className="fas fa-user input-icon"></i>
                    <input
                      type="text"
                      id="customerName"
                      name="customerName"
                      className="form-input"
                      placeholder="Type customer name, phone, or Customer ID to search..."
                      value={formData.customerName}
                      onChange={handleInputChange}
                      onFocus={() => {
                        if (formData.customerName.trim().length > 0 && filteredCustomers.length > 0) {
                          setShowCustomerDropdown(true);
                        }
                      }}
                      required
                      autoComplete="off"
                    />
                    <i className="fas fa-chevron-down dropdown-icon"></i>
                  </div>
                  {showCustomerDropdown && filteredCustomers.length > 0 && (
                    <div style={{
                      position: 'absolute',
                      top: '100%',
                      left: 0,
                      right: 0,
                      background: '#fff',
                      border: '1px solid #e0e0e0',
                      borderRadius: '8px',
                      boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                      zIndex: 10000,
                      maxHeight: '300px',
                      overflowY: 'auto',
                      marginTop: '4px'
                    }}>
                      {filteredCustomers.map((customer) => (
                        <div
                          key={customer.id}
                          onClick={() => handleCustomerSelect(customer)}
                          style={{
                            padding: '12px 16px',
                            cursor: 'pointer',
                            borderBottom: '1px solid #f0f0f0',
                            transition: 'background 0.2s'
                          }}
                          onMouseEnter={(e) => e.target.style.background = '#f8f9fa'}
                          onMouseLeave={(e) => e.target.style.background = '#fff'}
                        >
                          <div style={{ fontWeight: '600', fontSize: '14px', color: '#333' }}>
                            {customer.name}
                          </div>
                          <div style={{ fontSize: '12px', color: '#666', marginTop: '4px' }}>
                            {customer.phone}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="form-group">
                  <label htmlFor="customerContact">Customer Phone Number *</label>
                  <div className="input-wrapper">
                    <i className="fas fa-phone input-icon"></i>
                    <input
                      type="tel"
                      id="customerContact"
                      name="customerContact"
                      className="form-input"
                      placeholder="Contact number (auto-filled)"
                      value={formData.customerContact}
                      readOnly
                      style={{ background: '#f5f5f5' }}
                      required
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label htmlFor="handlerId">Handler Name *</label>
                  <div className="input-wrapper">
                    <i className="fas fa-user-tie input-icon"></i>
                    <select
                      id="handlerId"
                      name="handlerId"
                      className="form-input"
                      value={formData.handlerId}
                      onChange={handleHandlerChange}
                      required
                      style={{ paddingLeft: '40px', appearance: 'auto', cursor: 'pointer' }}
                    >
                      <option value="">Select handler</option>
                      {handlers.map((handler) => (
                        <option key={handler.id} value={handler.id}>
                          {handler.name}
                        </option>
                      ))}
                    </select>
                    <i className="fas fa-chevron-down dropdown-icon"></i>
                  </div>
                </div>

                <div className="form-group">
                  <label htmlFor="handlerMobile">Handler Phone Number</label>
                  <div className="input-wrapper">
                    <i className="fas fa-phone input-icon"></i>
                    <input
                      type="tel"
                      id="handlerMobile"
                      name="handlerMobile"
                      className="form-input"
                      placeholder="Phone number"
                      value={formData.handlerMobile}
                      readOnly
                      style={{ background: '#f5f5f5' }}
                    />
                  </div>
                </div>

                {/* Row 2: Item Code, Product Name, Quantity, Date of Duration */}
                <div className="form-group" style={{ marginTop: '12px' }}>
                  <label htmlFor="itemCode">Item Code *</label>
                  <div className="input-wrapper" style={{ position: 'relative' }}>
                    <i className="fas fa-barcode input-icon"></i>
                    <input
                      type="text"
                      id="itemCode"
                      name="itemCode"
                      className="form-input"
                      placeholder="Enter item code"
                      value={currentProduct.itemCode}
                      onChange={handleCurrentProductChange}
                      onKeyPress={handleItemCodeKeyPress}
                      style={{ paddingRight: '100px' }}
                    />
                    {currentProduct.isFetching ? (
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
                        onClick={fetchProductByItemCode}
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
                          fontSize: '11px',
                          fontWeight: '500',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px'
                        }}
                      >
                        <i className="fas fa-search"></i>
                        Fetch
                      </button>
                    )}
                  </div>
                </div>

                <div className="form-group" style={{ marginTop: '12px' }}>
                  <label htmlFor="productName">Product Name</label>
                  <div className="input-wrapper">
                    <i className="fas fa-box input-icon"></i>
                    <input
                      type="text"
                      id="productName"
                      name="productName"
                      className="form-input"
                      placeholder="Product name (auto-filled)"
                      value={currentProduct.productName}
                      readOnly
                      style={{ background: '#f5f5f5' }}
                    />
                  </div>
                </div>

                <div className="form-group" style={{ marginTop: '12px' }}>
                  <label htmlFor="quantity">Quantity *</label>
                  <div className="input-wrapper">
                    <i className="fas fa-shopping-cart input-icon"></i>
                    <input
                      type="number"
                      id="quantity"
                      name="quantity"
                      className="form-input"
                      placeholder="Enter quantity"
                      value={currentProduct.quantity}
                      onChange={handleCurrentProductChange}
                      min="1"
                      step="1"
                      disabled={!currentProduct.productInfo}
                    />
                  </div>
                </div>

                <div className="form-group" style={{ marginTop: '12px' }}>
                  <label htmlFor="dateOfDuration">Date of Duration *</label>
                  <div className="input-wrapper">
                    <i className="fas fa-calendar input-icon"></i>
                    <input
                      type="date"
                      id="dateOfDuration"
                      name="dateOfDuration"
                      className="form-input"
                      value={formData.dateOfDuration}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                </div>

                {/* Add Product Button */}
                <div className="form-group" style={{ marginTop: '12px' }}>
                  <label>&nbsp;</label>
                  <button
                    type="button"
                    onClick={addProduct}
                    disabled={!currentProduct.productInfo || !currentProduct.quantity || parseFloat(currentProduct.quantity) <= 0}
                    style={{
                      width: '100%',
                      padding: '10px',
                      background: (currentProduct.productInfo && currentProduct.quantity && parseFloat(currentProduct.quantity) > 0) ? '#dc3545' : '#ccc',
                      color: '#fff',
                      border: 'none',
                      borderRadius: '8px',
                      cursor: (currentProduct.productInfo && currentProduct.quantity && parseFloat(currentProduct.quantity) > 0) ? 'pointer' : 'not-allowed',
                      fontSize: '14px',
                      fontWeight: '600',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '8px',
                      transition: 'all 0.2s ease'
                    }}
                    onMouseEnter={(e) => {
                      if (currentProduct.productInfo && currentProduct.quantity && parseFloat(currentProduct.quantity) > 0) {
                        e.target.style.background = '#c82333';
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (currentProduct.productInfo && currentProduct.quantity && parseFloat(currentProduct.quantity) > 0) {
                        e.target.style.background = '#dc3545';
                      }
                    }}
                  >
                    <i className="fas fa-plus"></i>
                    Add Item
                  </button>
                </div>
              </div>

              {/* Display Added Products - Summary Table */}
              {addedProducts.length > 0 && (
                <div className="form-section" style={{ 
                  marginTop: '40px', 
                  clear: 'both', 
                  paddingTop: '20px', 
                  marginBottom: '150px',
                  paddingBottom: '40px',
                  position: 'relative',
                  zIndex: 1
                }}>
                  <div className="form-group" style={{ gridColumn: '1 / -1', marginBottom: '0' }}>
                    <div style={{ 
                      width: '100%',
                      border: '1px solid #dee2e6',
                      borderRadius: '8px',
                      overflow: 'hidden',
                      background: '#fff',
                      position: 'relative',
                      zIndex: 1
                    }}>
                      {/* Scrollable Product Table */}
                      <div className="attendance-table-container" style={{ 
                        marginTop: '0', 
                        maxHeight: '400px',
                        overflowY: 'auto',
                        overflowX: 'auto',
                        width: '100%',
                        paddingRight: '8px'
                      }}>
                        <table className="attendance-table" style={{ width: '100%', tableLayout: 'auto' }}>
                          <thead>
                            <tr>
                              <th style={{ width: '60px', textAlign: 'center' }}>#</th>
                              <th>ITEM CODE</th>
                              <th>ITEM NAME</th>
                              <th style={{ width: '100px', textAlign: 'center' }}>QTY</th>
                              <th style={{ width: '120px', textAlign: 'center' }}>SELL RATE</th>
                              <th style={{ width: '150px', textAlign: 'center' }}>Amount</th>
                              <th style={{ width: '100px', textAlign: 'center' }}>Action</th>
                            </tr>
                          </thead>
                          <tbody>
                            {addedProducts.map((product, index) => (
                              <tr key={product.id}>
                                <td style={{ textAlign: 'center', color: '#666', fontWeight: '500' }}>
                                  {index + 1}
                                </td>
                                <td style={{ fontWeight: '500', color: '#333' }}>
                                  {product.itemCode}
                                </td>
                                <td style={{ fontWeight: '500', color: '#333' }}>
                                  {product.productName}
                                </td>
                                <td style={{ textAlign: 'center', color: '#28a745', fontWeight: '600' }}>
                                  {product.quantity}
                                </td>
                                <td style={{ textAlign: 'center', fontWeight: '500', color: '#333' }}>
                                  ₹{parseFloat(product.sellRate || 0).toFixed(2)}
                                </td>
                                <td style={{ textAlign: 'center', fontWeight: '600', color: '#0066cc' }}>
                                  ₹{((parseFloat(product.quantity) || 0) * (parseFloat(product.sellRate) || 0)).toFixed(2)}
                                </td>
                                <td style={{ textAlign: 'center' }}>
                                  <button
                                    type="button"
                                    onClick={() => removeProduct(product.id)}
                                    style={{
                                      background: '#dc3545',
                                      color: '#fff',
                                      border: 'none',
                                      borderRadius: '6px',
                                      padding: '6px 12px',
                                      cursor: 'pointer',
                                      fontSize: '12px',
                                      display: 'inline-flex',
                                      alignItems: 'center',
                                      gap: '6px',
                                      transition: 'all 0.2s ease',
                                      whiteSpace: 'nowrap'
                                    }}
                                    onMouseEnter={(e) => {
                                      e.target.style.background = '#c82333';
                                      e.target.style.transform = 'scale(1.05)';
                                    }}
                                    onMouseLeave={(e) => {
                                      e.target.style.background = '#dc3545';
                                      e.target.style.transform = 'scale(1)';
                                    }}
                                    title="Remove this product"
                                  >
                                    <i className="fas fa-trash"></i>
                                    Remove
                                  </button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                      {/* Total Amount Row - Always Visible at Bottom of Card */}
                      <div style={{ 
                        background: '#f8f9fa', 
                        borderTop: '2px solid #dc3545',
                        padding: '12px 16px',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        fontWeight: 'bold'
                      }}>
                        <div style={{ flex: 1, textAlign: 'right', color: '#333', marginRight: '20px', fontSize: '16px' }}>
                          TOTAL AMOUNT:
                        </div>
                        <div style={{ 
                          textAlign: 'center',
                          color: '#dc3545',
                          fontSize: '18px',
                          fontWeight: 'bold',
                          minWidth: '150px'
                        }}>
                          ₹{addedProducts.reduce((sum, product) => sum + ((parseFloat(product.quantity) || 0) * (parseFloat(product.sellRate) || 0)), 0).toFixed(2)}
                        </div>
                        <div style={{ minWidth: '100px' }}></div>
                      </div>
                    </div>
                  </div>
                </div>
              )}


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
              <div style={{ 
                marginTop: addedProducts.length > 0 ? '120px' : '20px',
                clear: 'both',
                paddingTop: '40px',
                position: 'relative',
                zIndex: 2,
                marginBottom: '40px'
              }}>
                <div className="form-actions" style={{ 
                  marginTop: '0',
                  clear: 'both'
                }}>
                  <button type="submit" className="create-user-btn" disabled={isLoading}>
                    {isLoading ? 'Creating...' : 'Create Sales Order'}
                  </button>
                  <button type="button" className="cancel-btn" onClick={handleCancel}>
                    Cancel and go back
                  </button>
                </div>
              </div>
            </form>
          </main>
        </div>
      </div>

      <ConfirmDialog
        isOpen={confirmState.open}
        title="Confirm Creation"
        message={confirmState.message}
        confirmText="Yes, Create"
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

export default AddSalesOrder;

