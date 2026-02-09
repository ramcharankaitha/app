import React, { useState, useEffect, useRef } from 'react';
import { productsAPI, staffAPI, salesOrdersAPI, customersAPI, suppliersAPI } from '../services/api';
import ConfirmDialog from './ConfirmDialog';
import './addUser.css';

const AddSalesOrder = ({ onBack, onCancel, onNavigate, userRole = 'admin' }) => {
  const [formData, setFormData] = useState({
    customerName: '',
    customerContact: '',
    handlerId: '',
    handlerName: '',
    handlerMobile: '',
    dateOfDuration: '',
    supplierName: '',
    supplierNumber: ''
  });
  // Current product being entered (single form)
  const [currentProduct, setCurrentProduct] = useState({
    itemCode: '',
    category: '',
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
  const [allSuppliers, setAllSuppliers] = useState([]);
  const [showCustomerDropdown, setShowCustomerDropdown] = useState(false);
  const [showSupplierDropdown, setShowSupplierDropdown] = useState(false);
  const customerDropdownRef = useRef(null);
  const supplierDropdownRef = useRef(null);
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
              pincode: customer.pincode || ''
            });
          }
        });
        setAllCustomers(uniqueCustomers);
      }
    } catch (err) {
      console.error('Error fetching customers:', err);
    }
  };

  // Fetch all suppliers
  const fetchAllSuppliers = async () => {
    try {
      const response = await suppliersAPI.getAll();
      if (response.success) {
        setAllSuppliers(response.suppliers || []);
      }
    } catch (err) {
      console.error('Error fetching suppliers:', err);
    }
  };

  useEffect(() => {
    fetchHandlers();
    fetchAllCustomers();
    fetchAllSuppliers();
    
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        fetchHandlers();
        fetchAllCustomers();
        fetchAllSuppliers();
      }
    };
    
    const handleFocus = () => {
      fetchHandlers();
      fetchAllCustomers();
      fetchAllSuppliers();
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
      if (supplierDropdownRef.current && !supplierDropdownRef.current.contains(event.target)) {
        setShowSupplierDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Filter customers, suppliers, and handlers based on search
  const filteredCustomers = allCustomers.filter(customer => {
    const searchTerm = formData.customerName.toLowerCase();
    return customer.name.toLowerCase().includes(searchTerm) || 
           customer.phone.includes(searchTerm);
  });

  const filteredSuppliers = allSuppliers.filter(supplier => {
    const searchTerm = formData.supplierName.toLowerCase();
    return supplier.supplier_name?.toLowerCase().includes(searchTerm) || 
           supplier.phone?.includes(searchTerm);
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
    } else if (name === 'supplierName') {
      if (value.trim().length > 0) {
        setShowSupplierDropdown(true);
      } else {
        // Show all suppliers when field is empty
        setShowSupplierDropdown(true);
        setFormData(prev => ({ ...prev, supplierNumber: '' }));
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

  // Handle supplier selection
  const handleSupplierSelect = (supplier) => {
    setFormData(prev => ({
      ...prev,
      supplierName: supplier.supplier_name || '',
      supplierNumber: supplier.phone || ''
    }));
    setShowSupplierDropdown(false);
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
            category: product.category || '',
            mrp: product.mrp || 0,
            sellRate: product.sell_rate || product.sellRate || 0
          },
          category: product.category || '',
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
          category: '',
          productName: '',
          mrp: '',
          sellRate: '',
          isFetching: false 
        }));
      }
    } catch (err) {
      console.error('Fetch product error:', err);
      setError(err.message || 'Product not found. Please check the item code and try again.');
      setCurrentProduct(prev => ({ 
        ...prev, 
        productInfo: null, 
        category: '',
        productName: '',
        mrp: '',
        sellRate: '',
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
      category: currentProduct.category,
      productName: currentProduct.productName,
      quantity: parseFloat(currentProduct.quantity),
      mrp: parseFloat(currentProduct.mrp),
      sellRate: parseFloat(currentProduct.sellRate),
      productInfo: currentProduct.productInfo
    }]);
    
    // Clear current product form
    setCurrentProduct({
      itemCode: '',
      category: '',
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

      // Prepare products array
      const products = addedProducts.map(item => ({
        itemCode: item.itemCode.trim(),
        productName: item.productName,
        category: item.category,
        quantity: item.quantity || 0,
        mrp: item.mrp || 0,
        sellRate: item.sellRate || 0,
        discount: 0
      }));

      // Calculate total amount
      const totalAmount = products.reduce((total, product) => {
        return total + (product.sellRate * product.quantity);
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
        supplierName: formData.supplierName.trim() || null,
        supplierNumber: formData.supplierNumber.trim() || null,
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
            </div>
          </header>

          {/* Main Content */}
          <main className="add-user-content">
            <form onSubmit={handleSubmit} className="add-user-form">
              <div className="form-grid three-col">
                {/* Row 1: Customer Name, Number, Supplier Name */}
                <div className="form-group" ref={customerDropdownRef} style={{ position: 'relative', zIndex: 1000 }}>
                  <label htmlFor="customerName">Customer Name *</label>
                  <div className="input-wrapper">
                    <i className="fas fa-user input-icon"></i>
                    <input
                      type="text"
                      id="customerName"
                      name="customerName"
                      className="form-input"
                      placeholder="Type customer name to search..."
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
                    <div className="typeahead-dropdown">
                      {filteredCustomers.map((customer) => (
                        <div
                          key={customer.id}
                          onClick={() => handleCustomerSelect(customer)}
                        >
                          <div style={{ fontWeight: '600', fontSize: '14px', color: '#333' }}>
                            {customer.name}
                          </div>
                          <div style={{ fontSize: '12px', color: '#666', marginTop: '2px' }}>
                            {customer.phone}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="form-group">
                  <label htmlFor="customerContact">Number *</label>
                  <div className="input-wrapper">
                    <i className="fas fa-phone input-icon"></i>
                    <input
                      type="tel"
                      id="customerContact"
                      name="customerContact"
                      className="form-input"
                      placeholder="Enter contact number"
                      value={formData.customerContact}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                </div>

                <div className="form-group" ref={supplierDropdownRef} style={{ position: 'relative', zIndex: 1000 }}>
                  <label htmlFor="supplierName">Supplier Name</label>
                  <div className="input-wrapper">
                    <i className="fas fa-truck input-icon"></i>
                    <input
                      type="text"
                      id="supplierName"
                      name="supplierName"
                      className="form-input"
                      placeholder="Type supplier name to search..."
                      value={formData.supplierName}
                      onChange={handleInputChange}
                      onFocus={() => {
                        if (allSuppliers.length > 0) {
                          setShowSupplierDropdown(true);
                        }
                      }}
                      onClick={() => {
                        if (allSuppliers.length > 0) {
                          setShowSupplierDropdown(true);
                        }
                      }}
                      autoComplete="off"
                    />
                    <i className="fas fa-chevron-down dropdown-icon"></i>
                  </div>
                  {showSupplierDropdown && filteredSuppliers.length > 0 && (
                    <div className="typeahead-dropdown">
                      {filteredSuppliers.map((supplier) => (
                        <div
                          key={supplier.id}
                          onClick={() => handleSupplierSelect(supplier)}
                        >
                          <div style={{ fontWeight: '600', fontSize: '14px', color: '#333' }}>
                            {supplier.supplier_name || 'N/A'}
                          </div>
                          {supplier.phone && (
                            <div style={{ fontSize: '12px', color: '#666', marginTop: '2px' }}>
                              {supplier.phone}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Row 2: Handler Name, Handler Phone Number, Date of Duration */}
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
                      placeholder="Enter phone number"
                      value={formData.handlerMobile}
                      onChange={handleInputChange}
                    />
                  </div>
                </div>

                <div className="form-group">
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

                {/* Row 3: Item Code, Category, Product Name */}
                <div className="form-group">
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

                <div className="form-group">
                  <label htmlFor="category">Category</label>
                  <div className="input-wrapper">
                    <i className="fas fa-tags input-icon"></i>
                    <input
                      type="text"
                      id="category"
                      name="category"
                      className="form-input"
                      placeholder="Enter category"
                      value={currentProduct.category}
                      onChange={handleCurrentProductChange}
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label htmlFor="productName">Product Name</label>
                  <div className="input-wrapper">
                    <i className="fas fa-box input-icon"></i>
                    <input
                      type="text"
                      id="productName"
                      name="productName"
                      className="form-input"
                      placeholder="Enter product name"
                      value={currentProduct.productName}
                      onChange={handleCurrentProductChange}
                    />
                  </div>
                </div>

                {/* Row 4: Quantity, MRP, Sell Rate */}
                <div className="form-group">
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

                <div className="form-group">
                  <label htmlFor="mrp">MRP</label>
                  <div className="input-wrapper">
                    <i className="fas fa-rupee-sign input-icon"></i>
                    <input
                      type="number"
                      id="mrp"
                      name="mrp"
                      className="form-input"
                      placeholder="Enter MRP"
                      value={currentProduct.mrp}
                      onChange={handleCurrentProductChange}
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label htmlFor="sellRate">Sell Rate</label>
                  <div className="input-wrapper">
                    <i className="fas fa-rupee-sign input-icon"></i>
                    <input
                      type="number"
                      id="sellRate"
                      name="sellRate"
                      className="form-input"
                      placeholder="Enter sell rate"
                      value={currentProduct.sellRate}
                      onChange={handleCurrentProductChange}
                    />
                  </div>
                </div>

                {/* Add Product Button and Added Products Display */}
                <div className="form-group">
                  <label>&nbsp;</label>
                  <button
                    type="button"
                    onClick={addProduct}
                    disabled={!currentProduct.productInfo || !currentProduct.quantity || parseFloat(currentProduct.quantity) <= 0}
                    style={{
                      width: '100%',
                      padding: '8px 16px',
                      background: (currentProduct.productInfo && currentProduct.quantity && parseFloat(currentProduct.quantity) > 0) ? '#28a745' : '#ccc',
                      color: '#fff',
                      border: 'none',
                      borderRadius: '6px',
                      cursor: (currentProduct.productInfo && currentProduct.quantity && parseFloat(currentProduct.quantity) > 0) ? 'pointer' : 'not-allowed',
                      fontSize: '12px',
                      fontWeight: '600',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '6px',
                      marginTop: '4px'
                    }}
                  >
                    <i className="fas fa-plus"></i>
                    <span>Add Item</span>
                  </button>
                </div>

                {/* Display Added Products - Side by side with Add Item button */}
                {addedProducts.length > 0 && (
                  <div className="form-group" style={{ gridColumn: 'span 2' }}>
                    <label style={{ 
                      display: 'block', 
                      marginBottom: '8px', 
                      fontWeight: '600', 
                      color: '#333', 
                      fontSize: '12px' 
                    }}>
                      Added Products ({addedProducts.length})
                    </label>
                    <div style={{ 
                      display: 'flex',
                      flexDirection: 'row',
                      gap: '8px',
                      overflowX: 'auto',
                      overflowY: 'hidden',
                      width: '100%'
                    }}>
                      {addedProducts.map((product, index) => (
                        <div
                          key={product.id}
                          style={{
                            padding: '8px',
                            background: '#f8f9fa',
                            border: '2px solid #e0e0e0',
                            borderRadius: '6px',
                            position: 'relative',
                            minWidth: '200px',
                            maxWidth: '200px',
                            flexShrink: 0,
                            boxSizing: 'border-box'
                          }}
                        >
                          <div style={{ marginBottom: '6px', fontWeight: '600', color: '#dc3545', fontSize: '11px' }}>
                            Product {index + 1}
                          </div>
                          <div style={{ marginBottom: '4px', fontSize: '10px', lineHeight: '1.3' }}>
                            <span style={{ fontWeight: '500', color: '#666' }}>Item Code: </span>
                            <span style={{ color: '#333' }}>{product.itemCode}</span>
                          </div>
                          <div style={{ marginBottom: '4px', fontSize: '10px', lineHeight: '1.3' }}>
                            <span style={{ fontWeight: '500', color: '#666' }}>Product: </span>
                            <span style={{ color: '#333' }}>{product.productName || 'N/A'}</span>
                          </div>
                          <div style={{ marginBottom: '4px', fontSize: '10px', lineHeight: '1.3' }}>
                            <span style={{ fontWeight: '500', color: '#666' }}>Category: </span>
                            <span style={{ color: '#333' }}>{product.category || 'N/A'}</span>
                          </div>
                          <div style={{ marginBottom: '4px', fontSize: '10px', lineHeight: '1.3' }}>
                            <span style={{ fontWeight: '500', color: '#666' }}>Qty: </span>
                            <span style={{ color: '#333' }}>{product.quantity}</span>
                          </div>
                          <div style={{ marginBottom: '4px', fontSize: '10px', lineHeight: '1.3' }}>
                            <span style={{ fontWeight: '500', color: '#666' }}>Rate: </span>
                            <span style={{ color: '#333' }}>₹{product.sellRate.toFixed(2)}</span>
                          </div>
                          <button
                            type="button"
                            onClick={() => removeProduct(product.id)}
                            style={{
                              position: 'absolute',
                              top: '6px',
                              right: '6px',
                              background: '#dc3545',
                              color: '#fff',
                              border: 'none',
                              borderRadius: '50%',
                              width: '18px',
                              height: '18px',
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontSize: '9px'
                            }}
                            title="Remove this product"
                          >
                            <i className="fas fa-times"></i>
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>


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
                  {isLoading ? 'Creating...' : 'Create Sales Order'}
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

