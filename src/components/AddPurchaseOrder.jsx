import React, { useState, useEffect } from 'react';
import { suppliersAPI, purchaseOrdersAPI, productsAPI, salesOrdersAPI } from '../services/api';
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
    expectedDeliveryDate: '',
  });
  const [supplierSearchResults, setSupplierSearchResults] = useState([]);
  const [showSupplierDropdown, setShowSupplierDropdown] = useState(false);
  const [isSearchingSupplier, setIsSearchingSupplier] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [confirmState, setConfirmState] = useState({ open: false, message: '', onConfirm: null });
  
  // Product input fields
  const [currentProduct, setCurrentProduct] = useState({
    itemCode: '',
    productName: '',
    skuCode: '',
    quantity: '',
    unitPrice: '',
    isFetching: false,
    productInfo: null
  });
  
  // Added products list
  const [addedProducts, setAddedProducts] = useState([]);

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
    
    // If PO number is entered, fetch products from sales order
    if (name === 'poNumber' && value.trim()) {
      fetchProductsFromPO(value.trim());
    }
  };
  
  // Fetch products from sales order by PO number
  const fetchProductsFromPO = async (poNumber) => {
    if (!poNumber || poNumber.trim() === '') {
      // Clear products if PO number is cleared
      if (addedProducts.length > 0) {
        setAddedProducts([]);
      }
      return;
    }
    
    try {
      setError('');
      // Search for sales order with this PO number
      const response = await salesOrdersAPI.getAll();
      if (response.success && response.salesOrders) {
        const salesOrder = response.salesOrders.find(so => 
          so.po_number && so.po_number.trim().toUpperCase() === poNumber.trim().toUpperCase()
        );
        
        if (salesOrder && salesOrder.products) {
          let products = salesOrder.products;
          if (typeof products === 'string') {
            try {
              products = JSON.parse(products);
            } catch (e) {
              console.error('Error parsing products JSON:', e);
              products = [];
            }
          }
          
          if (Array.isArray(products) && products.length > 0) {
            // Transform sales order products to purchase order items
            const transformedItems = products.map((product, index) => {
              const quantity = parseFloat(product.quantity) || 0;
              const sellRate = parseFloat(product.sellRate) || parseFloat(product.sell_rate) || 0;
              const mrp = parseFloat(product.mrp) || 0;
              const unitPrice = sellRate > 0 ? sellRate : mrp;
              
              return {
                id: Date.now() + index,
                itemCode: product.itemCode || product.item_code || '',
                productName: product.productName || product.product_name || '',
                quantity: quantity,
                unitPrice: unitPrice,
                totalPrice: quantity * unitPrice
              };
            });
            
            setAddedProducts(transformedItems);
            setSuccessMessage(`Loaded ${transformedItems.length} product(s) from sales order`);
            setTimeout(() => setSuccessMessage(''), 3000);
          } else {
            setError('No products found in the sales order with this PO number');
            setTimeout(() => setError(''), 3000);
          }
        } else {
          // PO number not found - don't show error, user can add products manually
          if (addedProducts.length > 0) {
            // Clear products if PO number doesn't match
            setAddedProducts([]);
          }
        }
      }
    } catch (err) {
      console.error('Error fetching products from PO:', err);
      // Don't show error, just continue - user can add products manually
    }
  };
  
  // Handle product input changes
  const handleProductChange = (field, value) => {
    setCurrentProduct(prev => {
      const updated = { ...prev, [field]: value };
      
      // Reset product info if item code changes
      if (field === 'itemCode') {
        updated.productInfo = null;
        updated.productName = '';
        updated.skuCode = '';
        updated.unitPrice = '';
      }
      
      return updated;
    });
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
        const productData = {
          id: product.id,
          productName: product.product_name || product.productName || '',
          itemCode: product.item_code || product.itemCode || '',
          skuCode: product.sku_code || product.skuCode || '',
          mrp: product.mrp || 0,
          sellRate: product.sell_rate || product.sellRate || 0
        };
        
        setCurrentProduct(prev => ({
          ...prev,
          productInfo: productData,
          productName: productData.productName,
          skuCode: product.sku_code || product.skuCode || '',
          unitPrice: (productData.mrp > 0 ? productData.mrp : 0).toString(),
          isFetching: false
        }));
      } else {
        setError('Product not found with this item code');
        setCurrentProduct(prev => ({ 
          ...prev, 
          productInfo: null, 
          productName: '',
          skuCode: '',
          unitPrice: '',
          isFetching: false 
        }));
      }
    } catch (err) {
      console.error('Fetch product error:', err);
      setError('Product not found. Please check the item code and try again.');
      setCurrentProduct(prev => ({ 
        ...prev, 
        productInfo: null, 
        productName: '',
        skuCode: '',
        unitPrice: '',
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
  
  // Add product to list
  const addProduct = () => {
    if (!currentProduct.productInfo) {
      setError('Please fetch product first');
      return;
    }
    
    if (!currentProduct.quantity || parseFloat(currentProduct.quantity) <= 0) {
      setError('Please enter a valid quantity');
      return;
    }
    
    if (!currentProduct.unitPrice || parseFloat(currentProduct.unitPrice) <= 0) {
      setError('Please enter a valid unit price');
      return;
    }
    
    // Check for duplicate item codes - silently skip if duplicate
    const isDuplicate = addedProducts.some(p => 
      p.itemCode && p.itemCode.trim() === currentProduct.itemCode.trim()
    );
    
    if (isDuplicate) {
      // Silently skip duplicate products without showing error
      return;
    }
    
    const quantity = parseFloat(currentProduct.quantity) || 0;
    const unitPrice = parseFloat(currentProduct.unitPrice) || 0;
    const totalPrice = quantity * unitPrice;
    
    const newId = addedProducts.length > 0 
      ? Math.max(...addedProducts.map(p => p.id)) + 1 
      : 1;
    
    setAddedProducts(prev => [...prev, {
      id: newId,
      itemCode: currentProduct.itemCode.trim(),
      productName: currentProduct.productName,
      skuCode: currentProduct.skuCode,
      quantity: quantity,
      unitPrice: unitPrice,
      totalPrice: totalPrice
    }]);
    
    // Clear current product form
    setCurrentProduct({
      itemCode: '',
      productName: '',
      skuCode: '',
      quantity: '',
      unitPrice: '',
      isFetching: false,
      productInfo: null
    });
    setError('');
  };
  
  // Remove product from list
  const removeProduct = (productId) => {
    setAddedProducts(prev => prev.filter(p => p.id !== productId));
  };
  
  // Calculate total amount from added products
  const calculateTotalAmount = () => {
    return addedProducts.reduce((total, product) => {
      return total + (parseFloat(product.totalPrice) || 0);
    }, 0);
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
          
          // Prepare items array from added products
          const items = addedProducts.map(product => ({
            itemCode: product.itemCode,
            productName: product.productName,
            skuCode: product.skuCode || '',
            quantity: product.quantity,
            unitPrice: product.unitPrice,
            totalPrice: product.totalPrice
          }));
          
          // Calculate total amount
          const totalAmount = calculateTotalAmount();
          
          const response = await purchaseOrdersAPI.create({
            supplierId: finalSupplierId,
            supplierName: finalSupplierName,
            supplierNumber: finalSupplierNumber,
            handlerName: finalHandlerName,
            poNumber: finalPoNumber,
            orderDate: finalOrderDate,
            expectedDeliveryDate: finalExpectedDeliveryDate,
            items: items,
            totalAmount: totalAmount,
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
              expectedDeliveryDate: '',
            });
            setCurrentProduct({
              itemCode: '',
              productName: '',
              skuCode: '',
              quantity: '',
              unitPrice: '',
              isFetching: false,
              productInfo: null
            });
            setAddedProducts([]);
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

          <div className="form-section">
            <div className="form-grid four-col">
              {/* Row 1: Supplier Name, Supplier Number, Handler Name, PO Number */}
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

            </div>

            {/* Row 2: Item Code, Product Name, SKU Code, MRP */}
            <div className="form-grid four-col" style={{ marginTop: '12px' }}>
              <div className="form-group" style={{ position: 'relative' }}>
                <label htmlFor="itemCode">Item Code *</label>
                <div className="input-wrapper" style={{ position: 'relative' }}>
                  <i className="fas fa-barcode input-icon"></i>
                  <input
                    type="text"
                    id="itemCode"
                    className="form-input"
                    placeholder="Enter item code"
                    value={currentProduct.itemCode}
                    onChange={(e) => handleProductChange('itemCode', e.target.value)}
                    onKeyPress={handleItemCodeKeyPress}
                    style={{ paddingRight: currentProduct.isFetching ? '40px' : '50px' }}
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
                        padding: '6px 8px',
                        width: '32px',
                        height: '32px',
                        background: '#dc3545',
                        color: '#fff',
                        border: 'none',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        fontSize: '12px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}
                      title="Fetch Product"
                    >
                      <i className="fas fa-search"></i>
                    </button>
                  )}
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="productName">Product Name</label>
                <div className="input-wrapper">
                  <i className="fas fa-box input-icon"></i>
                  <input
                    type="text"
                    id="productName"
                    className="form-input"
                    placeholder="Product Name (auto-filled)"
                    value={currentProduct.productName}
                    readOnly
                    style={{ background: '#f8f9fa', cursor: 'not-allowed' }}
                  />
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="skuCode">SKU Code</label>
                <div className="input-wrapper">
                  <i className="fas fa-boxes input-icon"></i>
                  <input
                    type="text"
                    id="skuCode"
                    className="form-input"
                    placeholder="SKU Code (auto-filled)"
                    value={currentProduct.skuCode}
                    readOnly
                    style={{ background: '#f8f9fa', cursor: 'not-allowed' }}
                  />
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="unitPrice">MRP (Rs) *</label>
                <div className="input-wrapper">
                  <i className="fas fa-rupee-sign input-icon"></i>
                  <input
                    type="number"
                    id="unitPrice"
                    className="form-input"
                    placeholder="Enter MRP"
                    value={currentProduct.unitPrice}
                    onChange={(e) => handleProductChange('unitPrice', e.target.value)}
                    min="0"
                    step="0.01"
                    disabled={!currentProduct.productInfo}
                  />
                </div>
              </div>
            </div>

            {/* Row 3: Quantity, Order Date, Expected Delivery Date, Add Product Button */}
            <div className="form-grid four-col" style={{ marginTop: '12px' }}>
              <div className="form-group">
                <label htmlFor="quantity">Quantity *</label>
                <div className="input-wrapper">
                  <i className="fas fa-shopping-cart input-icon"></i>
                  <input
                    type="number"
                    id="quantity"
                    className="form-input"
                    placeholder="Enter quantity"
                    value={currentProduct.quantity}
                    onChange={(e) => handleProductChange('quantity', e.target.value)}
                    min="1"
                    step="1"
                    disabled={!currentProduct.productInfo}
                  />
                </div>
              </div>

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

              {/* Add Product Button */}
              <div className="form-group">
                <label>&nbsp;</label>
                <button
                  type="button"
                  onClick={addProduct}
                  disabled={!currentProduct.productInfo || !currentProduct.quantity || !currentProduct.unitPrice || parseFloat(currentProduct.quantity) <= 0 || parseFloat(currentProduct.unitPrice) <= 0}
                  style={{
                    width: '100%',
                    padding: '10px',
                    background: (currentProduct.productInfo && currentProduct.quantity && currentProduct.unitPrice && parseFloat(currentProduct.quantity) > 0 && parseFloat(currentProduct.unitPrice) > 0) ? '#dc3545' : '#ccc',
                    color: '#fff',
                    border: 'none',
                    borderRadius: '8px',
                    cursor: (currentProduct.productInfo && currentProduct.quantity && currentProduct.unitPrice && parseFloat(currentProduct.quantity) > 0 && parseFloat(currentProduct.unitPrice) > 0) ? 'pointer' : 'not-allowed',
                    fontSize: '14px',
                    fontWeight: '600',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    transition: 'all 0.2s ease'
                  }}
                  onMouseEnter={(e) => {
                    if (currentProduct.productInfo && currentProduct.quantity && currentProduct.unitPrice && parseFloat(currentProduct.quantity) > 0 && parseFloat(currentProduct.unitPrice) > 0) {
                      e.target.style.background = '#c82333';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (currentProduct.productInfo && currentProduct.quantity && currentProduct.unitPrice && parseFloat(currentProduct.quantity) > 0 && parseFloat(currentProduct.unitPrice) > 0) {
                      e.target.style.background = '#dc3545';
                    }
                  }}
                >
                  <i className="fas fa-plus"></i>
                  Add Product
                </button>
              </div>

            </div>
          </div>

          {/* Product Summary Section - Single Card */}
          {addedProducts.length > 0 && (
            <div className="form-section" style={{ 
              clear: 'both', 
              marginTop: '240px', 
              marginBottom: '130px',
              paddingTop: '20px',
              paddingBottom: '20px'
            }}>
              <div className="form-group" style={{ gridColumn: '1 / -1', marginBottom: '0', width: '100%' }}>
                <div style={{ 
                  width: '100%',
                  border: '1px solid #dee2e6',
                  borderRadius: '8px',
                  overflow: 'hidden',
                  background: '#fff'
                }}>
                  {/* Scrollable Product Table */}
                  <div className="attendance-table-container" style={{ 
                    marginTop: '0', 
                    maxHeight: addedProducts.length > 2 ? '300px' : 'auto',
                    overflowY: addedProducts.length > 2 ? 'auto' : 'visible',
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
                          <th style={{ width: '120px', textAlign: 'center' }}>UNIT PRICE</th>
                          <th style={{ width: '150px', textAlign: 'center' }}>TOTAL PRICE</th>
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
                              ₹{parseFloat(product.unitPrice || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                            </td>
                            <td style={{ textAlign: 'center', fontWeight: '600', color: '#28a745' }}>
                              ₹{parseFloat(product.totalPrice || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
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
                      color: '#28a745',
                      fontSize: '18px',
                      fontWeight: 'bold',
                      minWidth: '150px'
                    }}>
                      ₹{calculateTotalAmount().toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </div>
                    <div style={{ minWidth: '100px' }}></div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Submit Button */}
          <div className="form-actions" style={{ 
            marginTop: addedProducts.length > 0 ? '130px' : '20px',
            clear: 'both',
            paddingTop: '20px'
          }}>
            <button
              type="submit"
              disabled={isLoading || !formData.supplierName || formData.supplierName.trim() === '' || addedProducts.length === 0}
              className="submit-btn"
              style={{
                width: '200px',
                margin: '0 auto',
                padding: '12px 24px',
                background: (isLoading || !formData.supplierName || formData.supplierName.trim() === '' || addedProducts.length === 0) ? '#ccc' : '#dc3545',
                color: '#fff',
                border: 'none',
                borderRadius: '8px',
                fontSize: '16px',
                fontWeight: '600',
                cursor: (isLoading || !formData.supplierName || formData.supplierName.trim() === '' || addedProducts.length === 0) ? 'not-allowed' : 'pointer',
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

