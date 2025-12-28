import React, { useState } from 'react';
import { suppliersAPI, purchaseOrdersAPI } from '../services/api';
import ConfirmDialog from './ConfirmDialog';
import './addUser.css';

const AddPurchaseOrder = ({ onBack, onNavigate, userRole = 'admin' }) => {
  const [formData, setFormData] = useState({
    supplierName: '',
    supplierId: '',
    supplierNumber: '',
    handlerName: '',
    poNumber: '',
    orderDate: new Date().toISOString().split('T')[0],
    expectedDeliveryDate: ''
  });
  const [supplierSearchResults, setSupplierSearchResults] = useState([]);
  const [showSupplierDropdown, setShowSupplierDropdown] = useState(false);
  const [isSearchingSupplier, setIsSearchingSupplier] = useState(false);
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
    if (onBack) {
      onBack();
    } else if (onNavigate) {
      onNavigate('purchaseOrderMaster');
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));

    if (name === 'supplierName') {
      searchSuppliers(value);
    }
  };


  const searchSuppliers = async (query) => {
    if (!query || query.length < 2) {
      setSupplierSearchResults([]);
      setShowSupplierDropdown(false);
      return;
    }

    setIsSearchingSupplier(true);
    try {
      const response = await suppliersAPI.getAll();
      if (response.success) {
        const searchQuery = query.toLowerCase();
        const filtered = response.suppliers.filter(supplier => {
          const supplierName = (supplier.name || supplier.supplier_name || '').toLowerCase();
          const phone = supplier.phone || supplier.phone_number_1 || '';
          return supplierName.includes(searchQuery) || phone.includes(query);
        });
        setSupplierSearchResults(filtered.slice(0, 5));
        setShowSupplierDropdown(filtered.length > 0);
      }
    } catch (err) {
      console.error('Error searching suppliers:', err);
    } finally {
      setIsSearchingSupplier(false);
    }
  };

  const handleSupplierSelect = (supplier) => {
    const supplierName = supplier.name || supplier.supplier_name || '';
    setFormData(prev => ({
      ...prev,
      supplierName: supplierName,
      supplierId: supplier.id,
      supplierNumber: supplier.phone || supplier.phone_number_1 || supplier.phone_2 || ''
    }));
    setSupplierSearchResults([]);
    setShowSupplierDropdown(false);
  };


  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.supplierName || formData.supplierName.trim() === '') {
      setError('Please enter a supplier name');
      return;
    }

    // If supplierId is not set, try to find supplier by name
    let supplierId = formData.supplierId;
    if (!supplierId) {
      try {
        const response = await suppliersAPI.getAll();
        if (response.success) {
          const searchName = formData.supplierName.trim().toLowerCase();
          const foundSupplier = response.suppliers.find(s => {
            const supplierName = (s.name || s.supplier_name || '').trim().toLowerCase();
            return supplierName === searchName;
          });
          
          if (foundSupplier) {
            supplierId = foundSupplier.id;
            setFormData(prev => ({
              ...prev,
              supplierId: foundSupplier.id,
              supplierNumber: foundSupplier.phone || foundSupplier.phone_number_1 || foundSupplier.phone_2 || prev.supplierNumber
            }));
          } else {
            setError('Supplier not found. Please select from the dropdown or ensure the supplier name matches exactly.');
            return;
          }
        } else {
          setError('Failed to load suppliers. Please try again.');
          return;
        }
      } catch (err) {
        console.error('Error finding supplier:', err);
        setError('Failed to verify supplier. Please select from the dropdown.');
        return;
      }
    }

    // Store supplierId in a variable for use in the confirmation callback
    const finalSupplierId = supplierId || formData.supplierId;
    const finalSupplierName = formData.supplierName;
    const finalSupplierNumber = formData.supplierNumber;
    const finalHandlerName = formData.handlerName;
    const finalPoNumber = formData.poNumber;
    const finalOrderDate = formData.orderDate;
    const finalExpectedDeliveryDate = formData.expectedDeliveryDate;
    
    setConfirmState({
      open: true,
      message: `Create purchase order for ${formData.supplierName}?`,
      onConfirm: async () => {
        setIsLoading(true);
        setError('');
        setSuccessMessage('');
        
        try {
          const createdBy = getUserIdentifier();
          const response = await purchaseOrdersAPI.create({
            supplierId: finalSupplierId,
            supplierName: finalSupplierName,
            supplierNumber: finalSupplierNumber,
            handlerName: finalHandlerName,
            poNumber: finalPoNumber,
            orderDate: finalOrderDate,
            expectedDeliveryDate: finalExpectedDeliveryDate,
            supplierName: formData.supplierName,
            supplierNumber: formData.supplierNumber,
            handlerName: formData.handlerName,
            poNumber: formData.poNumber,
            orderDate: formData.orderDate,
            expectedDeliveryDate: formData.expectedDeliveryDate,
            items: [],
            totalAmount: 0,
            createdBy: createdBy
          });

          if (response.success) {
            setFormData({
              supplierName: '',
              supplierId: '',
              supplierNumber: '',
              handlerName: '',
              poNumber: '',
              orderDate: new Date().toISOString().split('T')[0],
              expectedDeliveryDate: ''
            });
            setSuccessMessage('Purchase order created successfully!');
            setTimeout(() => {
              if (onNavigate) {
                onNavigate('purchaseOrderMaster');
              }
            }, 1500);
          } else {
            setError(response.error || 'Failed to create purchase order');
          }
        } catch (err) {
          console.error('Purchase order creation error:', err);
          setError('Failed to create purchase order. Please try again.');
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
          <h1 className="add-user-title">Purchase Order</h1>
        </div>
        <div className="header-right">
          <button className="header-btn" onClick={() => onNavigate && onNavigate('dashboard')}>
            <i className="fas fa-home"></i>
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="add-user-content">
        <form onSubmit={handleSubmit} className="add-user-form">
          {error && (
            <div className="alert alert-error" style={{ marginBottom: '20px' }}>
              <i className="fas fa-exclamation-circle"></i> {error}
            </div>
          )}

          {successMessage && (
            <div className="alert alert-success" style={{ marginBottom: '20px' }}>
              <i className="fas fa-check-circle"></i> {successMessage}
            </div>
          )}

          <div className="form-section" style={{ marginTop: '40px' }}>
            <div className="form-grid four-col">
              {/* Row 1: Supplier Name, Supplier Number, Handler Name, PO */}
              <div className="form-group" style={{ position: 'relative' }}>
                <label htmlFor="supplierName">Supplier Name *</label>
                <div className="input-wrapper">
                  <i className="fas fa-truck input-icon"></i>
                  <input
                    type="text"
                    id="supplierName"
                    name="supplierName"
                    className="form-input"
                    placeholder="Enter supplier name"
                    value={formData.supplierName}
                    onChange={handleInputChange}
                    required
                    autoFocus
                  />
                </div>
                {showSupplierDropdown && supplierSearchResults.length > 0 && (
                  <div className="dropdown-menu" style={{
                    position: 'absolute',
                    top: '100%',
                    left: 0,
                    right: 0,
                    background: '#fff',
                    border: '1px solid #ddd',
                    borderRadius: '8px',
                    marginTop: '4px',
                    maxHeight: '200px',
                    overflowY: 'auto',
                    zIndex: 1000,
                    boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
                  }}>
                    {supplierSearchResults.map(supplier => (
                      <div
                        key={supplier.id}
                        onClick={() => handleSupplierSelect(supplier)}
                        style={{
                          padding: '12px',
                          cursor: 'pointer',
                          borderBottom: '1px solid #f0f0f0'
                        }}
                        onMouseEnter={(e) => e.target.style.background = '#f8f9fa'}
                        onMouseLeave={(e) => e.target.style.background = '#fff'}
                      >
                        <div style={{ fontWeight: '600' }}>{supplier.name || supplier.supplier_name}</div>
                        {(supplier.phone || supplier.phone_number_1) && (
                          <div style={{ fontSize: '12px', color: '#666' }}>{supplier.phone || supplier.phone_number_1}</div>
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
                    placeholder="Supplier phone number"
                    value={formData.supplierNumber}
                    onChange={handleInputChange}
                  />
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="handlerName">Handler Name</label>
                <div className="input-wrapper">
                  <i className="fas fa-user-tie input-icon"></i>
                  <input
                    type="text"
                    id="handlerName"
                    name="handlerName"
                    className="form-input"
                    placeholder="Enter handler name"
                    value={formData.handlerName}
                    onChange={handleInputChange}
                  />
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="poNumber">PO Number</label>
                <div className="input-wrapper">
                  <i className="fas fa-file-invoice input-icon"></i>
                  <input
                    type="text"
                    id="poNumber"
                    name="poNumber"
                    className="form-input"
                    placeholder="Purchase order number"
                    value={formData.poNumber}
                    onChange={handleInputChange}
                  />
                </div>
              </div>

              {/* Row 2: Order Date, Expected Delivery Date */}
              <div className="form-group">
                <label htmlFor="orderDate">Order Date *</label>
                <div className="input-wrapper">
                  <i className="fas fa-calendar input-icon"></i>
                  <input
                    type="date"
                    id="orderDate"
                    name="orderDate"
                    className="form-input"
                    value={formData.orderDate}
                    onChange={handleInputChange}
                    required
                  />
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="expectedDeliveryDate">Expected Delivery Date</label>
                <div className="input-wrapper">
                  <i className="fas fa-calendar-check input-icon"></i>
                  <input
                    type="date"
                    id="expectedDeliveryDate"
                    name="expectedDeliveryDate"
                    className="form-input"
                    value={formData.expectedDeliveryDate}
                    onChange={handleInputChange}
                    min={formData.orderDate}
                  />
                </div>
              </div>

            </div>
          </div>

          {/* Submit Button */}
          <div className="form-actions" style={{ marginTop: '40px', paddingTop: '20px' }}>
            <button
              type="submit"
              disabled={isLoading || !formData.supplierName || formData.supplierName.trim() === ''}
              className="submit-btn"
              style={{
                width: '200px',
                margin: '0 auto',
                padding: '12px 24px',
                background: (isLoading || !formData.supplierName || formData.supplierName.trim() === '') ? '#ccc' : '#dc3545',
                color: '#fff',
                border: 'none',
                borderRadius: '8px',
                fontSize: '16px',
                fontWeight: '600',
                cursor: (isLoading || !formData.supplierName || formData.supplierName.trim() === '') ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px'
              }}
            >
              {isLoading ? (
                <>
                  <i className="fas fa-spinner fa-spin"></i>
                  Creating...
                </>
              ) : (
                <>
                  <i className="fas fa-shopping-cart"></i>
                  Create Purchase Order
                </>
              )}
            </button>
          </div>
        </form>
      </main>
    </div>
  );
};

export default AddPurchaseOrder;

