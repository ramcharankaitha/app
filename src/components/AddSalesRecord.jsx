import React, { useState, useEffect, useRef } from 'react';
import { productsAPI, staffAPI, salesRecordsAPI, customersAPI, suppliersAPI } from '../services/api';
import ConfirmDialog from './ConfirmDialog';
import './addUser.css';

const AddSalesRecord = ({ onBack, onCancel, onNavigate, userRole = 'admin' }) => {
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
      productInfo: null,
      isFetching: false
    }
  ]);
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
      onNavigate('salesRecord');
    } else if (onBack) {
      onBack();
    }
  };

  const handleHome = () => {
    if (onNavigate) {
      onNavigate('dashboard');
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
      onNavigate('salesRecord');
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

  // Handle product item changes
  const handleItemChange = (itemId, field, value) => {
    setProductItems(prev => prev.map(item => 
      item.id === itemId ? { ...item, [field]: value } : item
    ));
  };

  // Fetch product by item code
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
          category: product.category || '',
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
            mrp: productData.mrp.toString(),
            sellRate: productData.sellRate.toString(),
            discount: productData.discount.toString(),
            isFetching: false
          } : p
        ));
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
      quantity: '',
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

  const submitSalesRecord = async () => {
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

      const validItems = productItems.filter(item => item.itemCode.trim() !== '' && item.productInfo && item.quantity);
      
      if (validItems.length === 0) {
        setError('Please add at least one product with quantity');
        setIsLoading(false);
        return;
      }

      // Validate all items have quantity
      for (const item of validItems) {
        if (!item.quantity || parseFloat(item.quantity) <= 0) {
          setError(`Please enter a valid quantity for item ${item.itemCode}`);
          setIsLoading(false);
          return;
        }
      }

      // Prepare products array
      const products = validItems.map(item => ({
        itemCode: item.itemCode.trim(),
        productName: item.productName,
        skuCode: item.skuCode,
        category: item.category,
        quantity: parseFloat(item.quantity) || 0,
        mrp: parseFloat(item.mrp) || 0,
        sellRate: parseFloat(item.sellRate) || 0,
        discount: parseFloat(item.discount) || 0
      }));

      // Calculate total amount
      const totalAmount = products.reduce((total, product) => {
        return total + (product.sellRate * product.quantity);
      }, 0);

      const userData = JSON.parse(localStorage.getItem('userData') || '{}');
      const createdBy = userData.username || userData.email || 'system';

      const response = await salesRecordsAPI.create({
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
        setSuccessMessage('Sales record created successfully');
        // Dispatch event to notify SalesRecord page to refresh
        window.dispatchEvent(new CustomEvent('salesRecordCreated'));
        setTimeout(() => {
          setSuccessMessage('');
          handleCancel();
        }, 2000);
      } else {
        setError(response.error || 'Failed to create sales record. Please try again.');
      }
    } catch (err) {
      setError(err.message || 'Failed to create sales record. Please try again.');
      console.error('Create sales record error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setConfirmState({
      open: true,
      message: 'Are you sure you want to create this sales record?',
      onConfirm: submitSalesRecord,
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
              <h1 className="page-title">Create Sales Record</h1>
              <p className="page-subtitle">Add a new sales record to the system.</p>
            </div>
          </header>

          {/* Main Content */}
          <main className="add-user-content">
            <form onSubmit={handleSubmit} className="add-user-form">
              {/* Customer Details Section */}
              <div className="form-section">
                <h3 className="section-title">Customer details</h3>
                <div className="form-grid">
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
                    <label htmlFor="customerContact">Customer Contact Number *</label>
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
                </div>
              </div>

              {/* Handler Details Section */}
              <div className="form-section">
                <h3 className="section-title">Handler details</h3>
                <div className="form-grid">
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
                    <label htmlFor="handlerMobile">Handler Mobile Number</label>
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
                </div>
              </div>

              {/* Date and Supplier Section */}
              <div className="form-section">
                <h3 className="section-title">Date and supplier details</h3>
                <div className="form-grid">
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
                        {filteredSuppliers.map((supplier) => (
                          <div
                            key={supplier.id}
                            onClick={() => handleSupplierSelect(supplier)}
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
                              {supplier.supplier_name || 'N/A'}
                            </div>
                            {supplier.phone && (
                              <div style={{ fontSize: '12px', color: '#666', marginTop: '4px' }}>
                                {supplier.phone}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="form-group">
                    <label htmlFor="supplierNumber">Supplier Number</label>
                    <div className="input-wrapper">
                      <i className="fas fa-phone input-icon"></i>
                      <input
                        type="tel"
                        id="supplierNumber"
                        name="supplierNumber"
                        className="form-input"
                        placeholder="Supplier number (auto-filled)"
                        value={formData.supplierNumber}
                        readOnly
                        style={{ background: '#f5f5f5' }}
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Product Details Section */}
              <div className="form-section">
                <h3 className="section-title">Product details</h3>

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

                      {/* Quantity */}
                      <div className="form-group">
                        <label htmlFor={`quantity-${item.id}`}>Quantity *</label>
                        <div className="input-wrapper">
                          <i className="fas fa-shopping-cart input-icon"></i>
                          <input
                            type="number"
                            id={`quantity-${item.id}`}
                            className="form-input"
                            placeholder="Enter quantity"
                            value={item.quantity}
                            onChange={(e) => handleItemChange(item.id, 'quantity', e.target.value)}
                            min="1"
                            step="1"
                            required
                            disabled={!item.productInfo}
                          />
                        </div>
                      </div>

                      {/* MRP */}
                      <div className="form-group">
                        <label htmlFor={`mrp-${item.id}`}>MRP</label>
                        <div className="input-wrapper">
                          <i className="fas fa-rupee-sign input-icon"></i>
                          <input
                            type="number"
                            id={`mrp-${item.id}`}
                            className="form-input"
                            placeholder="MRP"
                            value={item.mrp}
                            readOnly
                            style={{ background: '#f8f9fa', cursor: 'not-allowed' }}
                          />
                        </div>
                      </div>

                      {/* Sell Rate */}
                      <div className="form-group">
                        <label htmlFor={`sellRate-${item.id}`}>Sell Rate</label>
                        <div className="input-wrapper">
                          <i className="fas fa-rupee-sign input-icon"></i>
                          <input
                            type="number"
                            id={`sellRate-${item.id}`}
                            className="form-input"
                            placeholder="Sell Rate"
                            value={item.sellRate}
                            readOnly
                            style={{ background: '#f8f9fa', cursor: 'not-allowed' }}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                ))}

                {/* Add Item Button - Below all product items */}
                <div style={{ marginTop: '16px' }}>
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
                    Add Item
                  </button>
                </div>
              </div>

              {/* Pricing Summary */}
              {productItems.some(item => item.itemCode.trim() !== '' && item.productInfo && item.quantity) && (
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
                          <th style={{ padding: '12px', textAlign: 'left', fontSize: '13px', fontWeight: '600' }}>#</th>
                          <th style={{ padding: '12px', textAlign: 'left', fontSize: '13px', fontWeight: '600' }}>Item Code</th>
                          <th style={{ padding: '12px', textAlign: 'left', fontSize: '13px', fontWeight: '600' }}>Product</th>
                          <th style={{ padding: '12px', textAlign: 'right', fontSize: '13px', fontWeight: '600' }}>Qty</th>
                          <th style={{ padding: '12px', textAlign: 'right', fontSize: '13px', fontWeight: '600' }}>Rate</th>
                          <th style={{ padding: '12px', textAlign: 'right', fontSize: '13px', fontWeight: '600' }}>Total</th>
                        </tr>
                      </thead>
                      <tbody>
                        {productItems
                          .filter(item => item.itemCode.trim() !== '' && item.productInfo && item.quantity)
                          .map((item, index) => {
                            const quantity = parseFloat(item.quantity) || 0;
                            const sellRate = parseFloat(item.sellRate) || 0;
                            const itemTotal = sellRate * quantity;
                            
                            return (
                              <tr key={item.id} style={{ borderBottom: '1px solid #e9ecef' }}>
                                <td style={{ padding: '12px', fontSize: '13px', color: '#333' }}>{index + 1}</td>
                                <td style={{ padding: '12px', fontSize: '13px', color: '#333' }}>{item.itemCode}</td>
                                <td style={{ padding: '12px', fontSize: '13px', color: '#333' }}>{item.productName || 'N/A'}</td>
                                <td style={{ padding: '12px', fontSize: '13px', color: '#333', textAlign: 'right' }}>{quantity}</td>
                                <td style={{ padding: '12px', fontSize: '13px', color: '#333', textAlign: 'right' }}>₹{sellRate.toFixed(2)}</td>
                                <td style={{ padding: '12px', fontSize: '13px', color: '#333', textAlign: 'right', fontWeight: '600' }}>₹{itemTotal.toFixed(2)}</td>
                              </tr>
                            );
                          })}
                      </tbody>
                      <tfoot>
                        {(() => {
                          const grandTotal = productItems
                            .filter(item => item.itemCode.trim() !== '' && item.productInfo && item.quantity)
                            .reduce((total, item) => {
                              const quantity = parseFloat(item.quantity) || 0;
                              const sellRate = parseFloat(item.sellRate) || 0;
                              return total + (sellRate * quantity);
                            }, 0);
                          
                          return (
                            <>
                              <tr style={{ background: '#f8f9fa', borderTop: '2px solid #e9ecef' }}>
                                <td colSpan="5" style={{ padding: '12px', fontSize: '14px', fontWeight: '700', color: '#333', textAlign: 'right' }}>
                                  Grand Total:
                                </td>
                                <td style={{ padding: '12px', fontSize: '16px', fontWeight: '700', color: '#28a745', textAlign: 'right' }}>
                                  ₹{grandTotal.toFixed(2)}
                                </td>
                              </tr>
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
                Make sure all sales record details are correct before saving.
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
                  {isLoading ? 'Creating...' : 'Create Sales Record'}
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

export default AddSalesRecord;

