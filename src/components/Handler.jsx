import React, { useState, useEffect } from 'react';
import { servicesAPI, salesOrdersAPI, purchaseOrdersAPI } from '../services/api';
import './products.css';

const Handler = ({ onBack, onNavigate, userData }) => {
  const [activeTab, setActiveTab] = useState('services');
  const [services, setServices] = useState([]);
  const [salesOrders, setSalesOrders] = useState([]);
  const [purchaseOrders, setPurchaseOrders] = useState([]);
  const [filteredServices, setFilteredServices] = useState([]);
  const [filteredSalesOrders, setFilteredSalesOrders] = useState([]);
  const [filteredPurchaseOrders, setFilteredPurchaseOrders] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [selectedService, setSelectedService] = useState(null);
  const [showOTPModal, setShowOTPModal] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [otpCode, setOtpCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);

  // Get handler info from userData
  // Staff login returns: { id, name: full_name, username, role, store }
  // Also try to get from localStorage as fallback
  const [handlerInfo, setHandlerInfo] = useState({ name: '', id: null });

  useEffect(() => {
    // Try to get userData from props first, then from localStorage
    let userDataFromStorage = userData;
    if (!userDataFromStorage || !userDataFromStorage.id) {
      try {
        const stored = localStorage.getItem('userData');
        if (stored) {
          userDataFromStorage = JSON.parse(stored);
        }
      } catch (e) {
        console.error('Error parsing userData from localStorage:', e);
      }
    }

    const handlerName = userDataFromStorage?.name || userDataFromStorage?.full_name || userDataFromStorage?.username || '';
    const handlerId = userDataFromStorage?.id ? parseInt(userDataFromStorage.id) : null;

    console.log('Handler Component - userData from props:', userData);
    console.log('Handler Component - userData from storage:', userDataFromStorage);
    console.log('Handler Component - handlerName:', handlerName);
    console.log('Handler Component - handlerId:', handlerId, 'type:', typeof handlerId);

    if (!handlerName && !handlerId) {
      console.error('No handler information found in userData:', userDataFromStorage);
    }

    setHandlerInfo({ name: handlerName, id: handlerId });
  }, [userData]);

  // Fetch services assigned to this handler
  const fetchHandlerServices = async () => {
    setIsLoading(true);
    try {
      setError('');
      if (!handlerInfo.name && !handlerInfo.id) {
        setError('Handler information not found. Please contact administrator.');
        setIsLoading(false);
        return;
      }
      
      console.log('Fetching services for handler - Name:', handlerInfo.name, 'ID:', handlerInfo.id);
      const response = await servicesAPI.getByHandler(handlerInfo.name || 'unknown', handlerInfo.id);
      console.log('Services API Response:', response);
      console.log('Services API Response - services count:', response?.services?.length || 0);
      
      if (response && response.success !== false) {
        const allServices = response.services || [];
        console.log('All services received:', allServices.length);
        if (allServices.length > 0) {
          console.log('Sample service:', JSON.stringify(allServices[0], null, 2));
        }
        const pendingServices = allServices.filter(
          service => !service.is_completed
        );
        console.log('Pending services (not completed):', pendingServices.length);
        setServices(pendingServices);
        setFilteredServices(pendingServices);
        
        if (allServices.length > 0 && pendingServices.length === 0) {
          setError('All your services are completed.');
        } else if (allServices.length === 0) {
          setError('No services found. Please check if services were created with your handler name/ID.');
        }
      } else {
        const errorMsg = response?.error || response?.message || 'Failed to load services';
        console.error('Services API Error:', errorMsg);
        setError(errorMsg);
      }
    } catch (err) {
      console.error('Error fetching handler services:', err);
      setError(err.message || 'Failed to load services. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch sales orders assigned to this handler
  const fetchHandlerSalesOrders = async () => {
    setIsLoading(true);
    try {
      setError('');
      if (!handlerInfo.name && !handlerInfo.id) {
        setError('Handler information not found. Please contact administrator.');
        setIsLoading(false);
        return;
      }
      
      console.log('Fetching sales orders for handler - Name:', handlerInfo.name, 'ID:', handlerInfo.id);
      const response = await salesOrdersAPI.getByHandler(handlerInfo.name || '', handlerInfo.id);
      console.log('Sales Orders API Response:', response);
      
      if (response && response.success !== false) {
        setSalesOrders(response.salesOrders || []);
        setFilteredSalesOrders(response.salesOrders || []);
      } else {
        setError(response?.error || response?.message || 'Failed to load sales orders');
      }
    } catch (err) {
      console.error('Error fetching handler sales orders:', err);
      setError(err.message || 'Failed to load sales orders. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch purchase orders assigned to this handler
  const fetchHandlerPurchaseOrders = async () => {
    setIsLoading(true);
    try {
      setError('');
      if (!handlerInfo.name && !handlerInfo.id) {
        setError('Handler information not found. Please contact administrator.');
        setIsLoading(false);
        return;
      }
      
      console.log('Fetching purchase orders for handler - Name:', handlerInfo.name, 'ID:', handlerInfo.id);
      const response = await purchaseOrdersAPI.getByHandler(handlerInfo.name || '', handlerInfo.id);
      console.log('Purchase Orders API Response:', response);
      
      if (response && response.success !== false) {
        setPurchaseOrders(response.orders || []);
        setFilteredPurchaseOrders(response.orders || []);
      } else {
        setError(response?.error || response?.message || 'Failed to load purchase orders');
      }
    } catch (err) {
      console.error('Error fetching handler purchase orders:', err);
      setError(err.message || 'Failed to load purchase orders. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch data based on active tab
  useEffect(() => {
    if (!handlerInfo.name && !handlerInfo.id) {
      return; // Don't fetch if handler info is not available
    }
    
    if (activeTab === 'services') {
      fetchHandlerServices();
    } else if (activeTab === 'salesOrders') {
      fetchHandlerSalesOrders();
    } else if (activeTab === 'purchaseOrders') {
      fetchHandlerPurchaseOrders();
    }
  }, [activeTab, handlerInfo]);

  // Filter services based on search
  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredServices(services);
      return;
    }
    const query = searchQuery.toLowerCase();
    const filtered = services.filter(service =>
      service.customer_name?.toLowerCase().includes(query) ||
      service.product_name?.toLowerCase().includes(query) ||
      service.item_code?.toLowerCase().includes(query) ||
      service.serial_number?.toLowerCase().includes(query)
    );
    setFilteredServices(filtered);
  }, [searchQuery, services]);

  // Filter sales orders based on search
  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredSalesOrders(salesOrders);
      return;
    }
    const query = searchQuery.toLowerCase();
    const filtered = salesOrders.filter(order =>
      order.customer_name?.toLowerCase().includes(query) ||
      order.customer_contact?.toLowerCase().includes(query) ||
      order.po_number?.toLowerCase().includes(query)
    );
    setFilteredSalesOrders(filtered);
  }, [searchQuery, salesOrders]);

  // Filter purchase orders based on search
  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredPurchaseOrders(purchaseOrders);
      return;
    }
    const query = searchQuery.toLowerCase();
    const filtered = purchaseOrders.filter(order =>
      order.supplier_name?.toLowerCase().includes(query) ||
      order.order_number?.toLowerCase().includes(query) ||
      order.po_number?.toLowerCase().includes(query)
    );
    setFilteredPurchaseOrders(filtered);
  }, [searchQuery, purchaseOrders]);

  // Handle service selection
  const handleSelectService = (service) => {
    setSelectedService(service);
    setShowOTPModal(true);
    setOtpSent(false);
    setOtpCode('');
    setError('');
  };

  // Send OTP to customer
  const handleSendOTP = async () => {
    if (!selectedService) return;

    setIsLoading(true);
    try {
      setError('');
      const response = await servicesAPI.sendOTP(selectedService.id);
      if (response.success) {
        setOtpSent(true);
        setSuccessMessage('OTP sent successfully to customer');
        setTimeout(() => setSuccessMessage(''), 3000);
      } else {
        setError(response.message || 'Failed to send OTP');
      }
    } catch (err) {
      console.error('Error sending OTP:', err);
      setError('Failed to send OTP. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Verify OTP and complete service
  const handleVerifyOTP = async () => {
    if (!selectedService || !otpCode.trim()) {
      setError('Please enter the OTP');
      return;
    }

    setIsVerifying(true);
    try {
      setError('');
      const response = await servicesAPI.verifyOTP(selectedService.id, otpCode);
      if (response.success) {
        setSuccessMessage('Service completed successfully!');
        setTimeout(() => {
          setShowOTPModal(false);
          setSelectedService(null);
          setOtpSent(false);
          setOtpCode('');
          fetchHandlerServices();
        }, 2000);
      } else {
        setError(response.message || 'Invalid OTP. Please try again.');
      }
    } catch (err) {
      console.error('Error verifying OTP:', err);
      setError('Failed to verify OTP. Please try again.');
    } finally {
      setIsVerifying(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const formatCurrency = (amount) => {
    return `₹${parseFloat(amount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`;
  };

  return (
    <div className="dashboard-container">
      {/* Sidebar */}
      <nav className="sidebar-nav">
        <div className="nav-item" onClick={onBack}>
          <div className="nav-icon">
            <i className="fas fa-home"></i>
          </div>
          <span>Home</span>
        </div>
      </nav>

      {/* Main Content */}
      <div className="dashboard-main">
        <div className="staff-container">
          {/* Header */}
          <header className="staff-header">
            <div className="header-left">
              <button className="back-btn" onClick={onBack}>
                <i className="fas fa-arrow-left"></i>
              </button>
              <div>
                <h1 className="staff-title">Handler Module</h1>
                <p className="staff-subtitle">View your assigned services, sales orders, and purchase orders</p>
              </div>
            </div>
          </header>

          {/* Success/Error Messages */}
          {successMessage && (
            <div className="alert alert-success" style={{ margin: '16px 24px' }}>
              <i className="fas fa-check-circle"></i> {successMessage}
            </div>
          )}

          {error && (
            <div className="alert alert-error" style={{ margin: '16px 24px' }}>
              <i className="fas fa-exclamation-circle"></i> {error}
            </div>
          )}

          {/* Debug Info - Always show for troubleshooting */}
          <div style={{ margin: '16px 24px', padding: '12px', background: '#f8f9fa', borderRadius: '8px', fontSize: '12px', border: '1px solid #dee2e6' }}>
            <strong style={{ color: '#dc3545' }}>Handler Information:</strong>
            <div style={{ marginTop: '8px' }}>
              <div><strong>Handler Name:</strong> {handlerInfo.name || 'Not found'}</div>
              <div><strong>Handler ID:</strong> {handlerInfo.id || 'Not found'}</div>
              <div><strong>Active Tab:</strong> {activeTab}</div>
              <div><strong>Services Count:</strong> {services.length} (filtered: {filteredServices.length})</div>
              <div><strong>Sales Orders Count:</strong> {salesOrders.length}</div>
              <div><strong>Purchase Orders Count:</strong> {purchaseOrders.length}</div>
            </div>
            <details style={{ marginTop: '8px' }}>
              <summary style={{ cursor: 'pointer', color: '#007bff' }}>View UserData</summary>
              <pre style={{ marginTop: '8px', fontSize: '10px', overflow: 'auto', maxHeight: '200px' }}>
                {JSON.stringify(userData || {}, null, 2)}
              </pre>
            </details>
          </div>

          {/* Tabs */}
          <div style={{ padding: '16px 24px', borderBottom: '1px solid #e0e0e0' }}>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                onClick={() => setActiveTab('services')}
                style={{
                  padding: '10px 20px',
                  background: activeTab === 'services' ? '#dc3545' : '#f8f9fa',
                  color: activeTab === 'services' ? '#fff' : '#333',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: '600',
                  transition: 'all 0.2s ease'
                }}
              >
                <i className="fas fa-tools"></i> Services ({services.length})
              </button>
              <button
                onClick={() => setActiveTab('salesOrders')}
                style={{
                  padding: '10px 20px',
                  background: activeTab === 'salesOrders' ? '#dc3545' : '#f8f9fa',
                  color: activeTab === 'salesOrders' ? '#fff' : '#333',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: '600',
                  transition: 'all 0.2s ease'
                }}
              >
                <i className="fas fa-shopping-cart"></i> Sales Orders ({salesOrders.length})
              </button>
              <button
                onClick={() => setActiveTab('purchaseOrders')}
                style={{
                  padding: '10px 20px',
                  background: activeTab === 'purchaseOrders' ? '#dc3545' : '#f8f9fa',
                  color: activeTab === 'purchaseOrders' ? '#fff' : '#333',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: '600',
                  transition: 'all 0.2s ease'
                }}
              >
                <i className="fas fa-box"></i> Purchase Orders ({purchaseOrders.length})
              </button>
            </div>
          </div>

          {/* Search Bar */}
          <div className="search-container" style={{ padding: '16px 24px' }}>
            <div className="search-bar">
              <i className="fas fa-search"></i>
              <input
                type="text"
                placeholder={
                  activeTab === 'services' 
                    ? "Search by customer name, product, item code, or serial number..."
                    : activeTab === 'salesOrders'
                    ? "Search by customer name, contact, or PO number..."
                    : "Search by supplier name, order number, or PO number..."
                }
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              {searchQuery && (
                <button
                  className="clear-search"
                  onClick={() => setSearchQuery('')}
                >
                  <i className="fas fa-times"></i>
                </button>
              )}
            </div>
          </div>

          {/* Services List */}
          {activeTab === 'services' && (
            <div className="staff-list-container" style={{ padding: '0 24px 24px' }}>
              {isLoading && services.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '40px' }}>
                  <i className="fas fa-spinner fa-spin" style={{ fontSize: '24px', color: '#999' }}></i>
                  <p style={{ marginTop: '16px', color: '#666' }}>Loading services...</p>
                </div>
              ) : filteredServices.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '40px' }}>
                  <i className="fas fa-tools" style={{ fontSize: '48px', color: '#ccc', marginBottom: '16px' }}></i>
                  <p style={{ color: '#666', fontSize: '16px' }}>
                    {searchQuery ? 'No services found matching your search.' : 'No services assigned to you yet.'}
                  </p>
                </div>
              ) : (
                <div className="products-grid">
                  {filteredServices.map((service) => (
                    <div
                      key={service.id}
                      className="product-card handler-service-card"
                      onClick={() => handleSelectService(service)}
                      style={{ cursor: 'pointer' }}
                    >
                      <div className="product-header">
                        <div className="product-title">{service.customer_name || 'Unknown Customer'}</div>
                        <div className="product-badge" style={{ background: '#17a2b8', color: '#fff' }}>
                          <i className="fas fa-tools"></i> Service
                        </div>
                      </div>
                      <div className="product-details">
                        <div className="detail-row">
                          <span className="detail-label">Product:</span>
                          <span className="detail-value">{service.product_name || 'N/A'}</span>
                        </div>
                        {service.item_code && (
                          <div className="detail-row">
                            <span className="detail-label">Item Code:</span>
                            <span className="detail-value">{service.item_code}</span>
                          </div>
                        )}
                        {service.serial_number && (
                          <div className="detail-row">
                            <span className="detail-label">Serial Number:</span>
                            <span className="detail-value">{service.serial_number}</span>
                          </div>
                        )}
                        {service.service_date && (
                          <div className="detail-row">
                            <span className="detail-label">Service Date:</span>
                            <span className="detail-value">{formatDate(service.service_date)}</span>
                          </div>
                        )}
                      </div>
                      <div style={{
                        marginTop: '12px',
                        padding: '8px 12px',
                        background: '#fff3cd',
                        borderRadius: '6px',
                        fontSize: '12px',
                        color: '#856404',
                        textAlign: 'center',
                        fontWeight: '600'
                      }}>
                        <i className="fas fa-hand-pointer"></i> Click to complete service
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Sales Orders List */}
          {activeTab === 'salesOrders' && (
            <div className="staff-list-container" style={{ padding: '0 24px 24px' }}>
              {isLoading && salesOrders.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '40px' }}>
                  <i className="fas fa-spinner fa-spin" style={{ fontSize: '24px', color: '#999' }}></i>
                  <p style={{ marginTop: '16px', color: '#666' }}>Loading sales orders...</p>
                </div>
              ) : filteredSalesOrders.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '40px' }}>
                  <i className="fas fa-shopping-cart" style={{ fontSize: '48px', color: '#ccc', marginBottom: '16px' }}></i>
                  <p style={{ color: '#666', fontSize: '16px' }}>
                    {searchQuery ? 'No sales orders found matching your search.' : 'No sales orders assigned to you yet.'}
                  </p>
                </div>
              ) : (
                <div className="products-grid">
                  {filteredSalesOrders.map((order) => {
                    let products = [];
                    try {
                      if (order.products) {
                        products = typeof order.products === 'string' ? JSON.parse(order.products) : order.products;
                      }
                    } catch (e) {
                      console.error('Error parsing products:', e);
                    }
                    
                    return (
                      <div key={order.id} className="product-card">
                        <div className="product-header">
                          <div className="product-title">{order.customer_name || 'Unknown Customer'}</div>
                          <div className="product-badge" style={{ background: '#28a745', color: '#fff' }}>
                            <i className="fas fa-shopping-cart"></i> Sales Order
                          </div>
                        </div>
                        <div className="product-details">
                          <div className="detail-row">
                            <span className="detail-label">Customer Contact:</span>
                            <span className="detail-value">{order.customer_contact || 'N/A'}</span>
                          </div>
                          {order.po_number && (
                            <div className="detail-row">
                              <span className="detail-label">PO Number:</span>
                              <span className="detail-value" style={{ color: '#dc3545', fontWeight: '600' }}>{order.po_number}</span>
                            </div>
                          )}
                          {order.total_amount && (
                            <div className="detail-row">
                              <span className="detail-label">Total Amount:</span>
                              <span className="detail-value" style={{ color: '#28a745', fontWeight: '600', fontSize: '16px' }}>
                                {formatCurrency(order.total_amount)}
                              </span>
                            </div>
                          )}
                          {products.length > 0 && (
                            <div className="detail-row">
                              <span className="detail-label">Items:</span>
                              <span className="detail-value">{products.length} item(s)</span>
                            </div>
                          )}
                          {order.date_of_duration && (
                            <div className="detail-row">
                              <span className="detail-label">Date:</span>
                              <span className="detail-value">{formatDate(order.date_of_duration)}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* Purchase Orders List */}
          {activeTab === 'purchaseOrders' && (
            <div className="staff-list-container" style={{ padding: '0 24px 24px' }}>
              {isLoading && purchaseOrders.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '40px' }}>
                  <i className="fas fa-spinner fa-spin" style={{ fontSize: '24px', color: '#999' }}></i>
                  <p style={{ marginTop: '16px', color: '#666' }}>Loading purchase orders...</p>
                </div>
              ) : filteredPurchaseOrders.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '40px' }}>
                  <i className="fas fa-box" style={{ fontSize: '48px', color: '#ccc', marginBottom: '16px' }}></i>
                  <p style={{ color: '#666', fontSize: '16px' }}>
                    {searchQuery ? 'No purchase orders found matching your search.' : 'No purchase orders assigned to you yet.'}
                  </p>
                </div>
              ) : (
                <div className="products-grid">
                  {filteredPurchaseOrders.map((order) => {
                    let items = [];
                    try {
                      if (order.items) {
                        items = typeof order.items === 'string' ? JSON.parse(order.items) : order.items;
                      }
                    } catch (e) {
                      console.error('Error parsing items:', e);
                    }
                    
                    return (
                      <div key={order.id} className="product-card">
                        <div className="product-header">
                          <div className="product-title">{order.supplier_name || 'Unknown Supplier'}</div>
                          <div className="product-badge" style={{ background: '#007bff', color: '#fff' }}>
                            <i className="fas fa-box"></i> Purchase Order
                          </div>
                        </div>
                        <div className="product-details">
                          {order.order_number && (
                            <div className="detail-row">
                              <span className="detail-label">Order Number:</span>
                              <span className="detail-value" style={{ color: '#dc3545', fontWeight: '600' }}>{order.order_number}</span>
                            </div>
                          )}
                          {order.po_number && (
                            <div className="detail-row">
                              <span className="detail-label">PO Number:</span>
                              <span className="detail-value" style={{ color: '#dc3545', fontWeight: '600' }}>{order.po_number}</span>
                            </div>
                          )}
                          {order.supplier_number && (
                            <div className="detail-row">
                              <span className="detail-label">Supplier Number:</span>
                              <span className="detail-value">{order.supplier_number}</span>
                            </div>
                          )}
                          {order.total_amount && (
                            <div className="detail-row">
                              <span className="detail-label">Total Amount:</span>
                              <span className="detail-value" style={{ color: '#28a745', fontWeight: '600', fontSize: '16px' }}>
                                {formatCurrency(order.total_amount)}
                              </span>
                            </div>
                          )}
                          {items.length > 0 && (
                            <div className="detail-row">
                              <span className="detail-label">Items:</span>
                              <span className="detail-value">{items.length} item(s)</span>
                            </div>
                          )}
                          {order.order_date && (
                            <div className="detail-row">
                              <span className="detail-label">Order Date:</span>
                              <span className="detail-value">{formatDate(order.order_date)}</span>
                            </div>
                          )}
                          {order.status && (
                            <div className="detail-row">
                              <span className="detail-label">Status:</span>
                              <span className="detail-value" style={{ 
                                color: order.status === 'completed' ? '#28a745' : order.status === 'pending' ? '#ffc107' : '#dc3545',
                                fontWeight: '600'
                              }}>
                                {order.status.toUpperCase()}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* OTP Modal */}
      {showOTPModal && selectedService && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0, 0, 0, 0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 10000,
          }}
          onClick={() => {
            if (!isVerifying) {
              setShowOTPModal(false);
              setSelectedService(null);
              setOtpSent(false);
              setOtpCode('');
            }
          }}
        >
          <div
            style={{
              background: 'var(--card-bg)',
              borderRadius: '16px',
              padding: '24px',
              maxWidth: '500px',
              width: '90%',
              boxShadow: '0 10px 40px rgba(0,0,0,0.3)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h2 style={{ margin: 0, color: 'var(--text-primary)' }}>Complete Service</h2>
              <button
                onClick={() => {
                  if (!isVerifying) {
                    setShowOTPModal(false);
                    setSelectedService(null);
                    setOtpSent(false);
                    setOtpCode('');
                  }
                }}
                style={{
                  background: 'none',
                  border: 'none',
                  fontSize: '24px',
                  cursor: isVerifying ? 'not-allowed' : 'pointer',
                  color: '#999',
                }}
                disabled={isVerifying}
              >
                <i className="fas fa-times"></i>
              </button>
            </div>

            <div style={{ marginBottom: '20px' }}>
              <p style={{ margin: '0 0 8px 0', color: 'var(--text-secondary)' }}><strong>Customer:</strong> {selectedService.customer_name}</p>
              <p style={{ margin: '0 0 8px 0', color: 'var(--text-secondary)' }}><strong>Product:</strong> {selectedService.product_name}</p>
              {selectedService.customer_phone && (
                <p style={{ margin: '0', color: 'var(--text-secondary)' }}><strong>Phone:</strong> {selectedService.customer_phone}</p>
              )}
            </div>

            {!otpSent ? (
              <div>
                <p style={{ marginBottom: '16px', color: 'var(--text-primary)' }}>
                  Click the button below to send OTP to the customer's phone number.
                </p>
                <button
                  onClick={handleSendOTP}
                  disabled={isLoading}
                  style={{
                    width: '100%',
                    padding: '12px',
                    background: isLoading ? '#ccc' : '#17a2b8',
                    color: '#fff',
                    border: 'none',
                    borderRadius: '8px',
                    fontSize: '16px',
                    fontWeight: '600',
                    cursor: isLoading ? 'not-allowed' : 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px'
                  }}
                >
                  {isLoading ? (
                    <>
                      <i className="fas fa-spinner fa-spin"></i>
                      Sending...
                    </>
                  ) : (
                    <>
                      <i className="fas fa-paper-plane"></i>
                      Send OTP
                    </>
                  )}
                </button>
              </div>
            ) : (
              <div>
                <div style={{
                  padding: '12px',
                  background: '#d4edda',
                  borderRadius: '8px',
                  marginBottom: '16px',
                  color: '#155724'
                }}>
                  <i className="fas fa-check-circle"></i> OTP sent successfully to customer!
                </div>
                <div style={{ marginBottom: '16px' }}>
                  <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', color: 'var(--text-primary)' }}>
                    Enter OTP received by customer:
                  </label>
                  <input
                    type="text"
                    value={otpCode}
                    onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    placeholder="Enter 6-digit OTP"
                    maxLength="6"
                    style={{
                      width: '100%',
                      padding: '12px',
                      border: '2px solid var(--border-color)',
                      borderRadius: '8px',
                      fontSize: '18px',
                      textAlign: 'center',
                      letterSpacing: '4px',
                      fontWeight: '600'
                    }}
                    autoFocus
                  />
                </div>
                <button
                  onClick={handleVerifyOTP}
                  disabled={isVerifying || !otpCode || otpCode.length !== 6}
                  style={{
                    width: '100%',
                    padding: '12px',
                    background: (isVerifying || !otpCode || otpCode.length !== 6) ? '#ccc' : '#28a745',
                    color: '#fff',
                    border: 'none',
                    borderRadius: '8px',
                    fontSize: '16px',
                    fontWeight: '600',
                    cursor: (isVerifying || !otpCode || otpCode.length !== 6) ? 'not-allowed' : 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px'
                  }}
                >
                  {isVerifying ? (
                    <>
                      <i className="fas fa-spinner fa-spin"></i>
                      Verifying...
                    </>
                  ) : (
                    <>
                      <i className="fas fa-check"></i>
                      Verify OTP & Complete Service
                    </>
                  )}
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default Handler;
