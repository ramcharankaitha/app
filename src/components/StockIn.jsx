import React, { useState, useEffect } from 'react';
import { stockAPI, productsAPI } from '../services/api';
import ConfirmDialog from './ConfirmDialog';
import Toast from './Toast';

const StockIn = ({ onBack, onNavigate, userRole = 'admin' }) => {
  const [formData, setFormData] = useState({
    supplierName: '',
    itemCode: '',
    productName: '',
    skuCode: '',
    quantity: '', // Current stock in store (display only)
    stockInQuantity: '', // New quantity to add
    minQuantity: '', // Minimum quantity from product
    mrp: '', // MRP from product
    totalAfterAdding: '', // Calculated total
    notes: '',
    // Additional fields for new product creation
    modelNumber: '',
    category: '',
    discount1: '',
    discount2: '',
    sellRate: '',
    purchaseRate: ''
  });
  const [productInfo, setProductInfo] = useState(null);
  const [isNewProduct, setIsNewProduct] = useState(false);
  const [addedProducts, setAddedProducts] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isFetchingProduct, setIsFetchingProduct] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [confirmState, setConfirmState] = useState({ open: false, message: '', onConfirm: null });
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  const [suppliers, setSuppliers] = useState([]);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Fetch suppliers on component mount
  useEffect(() => {
    const fetchSuppliers = async () => {
      try {
        const API_BASE_URL = process.env.REACT_APP_API_URL?.trim().replace(/\/+$/, '') || 'http://localhost:5000/api';
        const response = await fetch(`${API_BASE_URL}/suppliers`);
        if (response.ok) {
          const data = await response.json();
          if (data.success && data.suppliers) {
            setSuppliers(data.suppliers);
          }
        }
      } catch (err) {
        console.error('Error fetching suppliers:', err);
        // Don't show error to user, just log it
      }
    };
    fetchSuppliers();
  }, []);

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
      onNavigate('stockInMaster');
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Reset product info if item code changes
    if (name === 'itemCode') {
      setProductInfo(null);
      setIsNewProduct(false);
      setFormData(prev => ({
        ...prev,
        productName: '',
        skuCode: '',
        quantity: '0', // Set to 0 for new products
        stockInQuantity: '',
        minQuantity: '',
        mrp: '',
        totalAfterAdding: '',
        modelNumber: '',
        category: '',
        discount1: '',
        discount2: '',
        sellRate: '',
        purchaseRate: ''
      }));
      setError('');
      setSuccessMessage('');
    }

    // Calculate total after adding when stockInQuantity changes
    if (name === 'stockInQuantity') {
      const currentQty = parseInt(formData.quantity) || 0;
      const newQty = parseInt(value) || 0;
      const total = currentQty + newQty;
      setFormData(prev => ({
        ...prev,
        stockInQuantity: value,
        totalAfterAdding: total.toString()
      }));
    }
  };

  const addProduct = () => {
    if (!formData.itemCode || !formData.itemCode.trim()) {
      setError('Item code is required');
      return;
    }

    if (!formData.productName || !formData.productName.trim()) {
      setError('Product name is required');
      return;
    }

    if (!formData.stockInQuantity || parseFloat(formData.stockInQuantity) <= 0) {
      setError('Stock in quantity must be greater than 0');
      return;
    }

    // For new products, validate required fields
    if (isNewProduct) {
      if (!formData.mrp || parseFloat(formData.mrp) <= 0) {
        setError('MRP is required for new products');
        return;
      }
    }

    // Check if product already added - silently skip if duplicate
    const isDuplicate = addedProducts.some(p => p.itemCode === formData.itemCode.trim());
    if (isDuplicate) {
      setError('Product already added to the list');
      return;
    }

    const newProduct = {
      id: Date.now(),
      itemCode: formData.itemCode.trim(),
      productName: formData.productName.trim(),
      skuCode: formData.skuCode.trim(),
      supplierName: formData.supplierName.trim(),
      currentQuantity: parseInt(formData.quantity) || 0,
      stockInQuantity: parseInt(formData.stockInQuantity),
      totalAfterAdding: parseInt(formData.totalAfterAdding) || 0,
      mrp: parseFloat(formData.mrp) || 0,
      amount: (parseInt(formData.stockInQuantity) || 0) * (parseFloat(formData.mrp) || 0),
      productInfo: productInfo,
      isNewProduct: isNewProduct,
      // Additional fields for new product
      modelNumber: formData.modelNumber || '',
      category: formData.category || '',
      minQuantity: parseInt(formData.minQuantity) || 0,
      discount1: parseFloat(formData.discount1) || 0,
      discount2: parseFloat(formData.discount2) || 0,
      sellRate: parseFloat(formData.sellRate) || 0,
      purchaseRate: parseFloat(formData.purchaseRate) || 0
    };

    setAddedProducts(prev => [...prev, newProduct]);
    
    // Reset form fields for next product
    setFormData(prev => ({
      ...prev,
      itemCode: '',
      productName: '',
      skuCode: '',
      quantity: '0',
      stockInQuantity: '',
      minQuantity: '',
      mrp: '',
      totalAfterAdding: '',
      modelNumber: '',
      category: '',
      discount1: '',
      discount2: '',
      sellRate: '',
      purchaseRate: ''
    }));
    setProductInfo(null);
    setIsNewProduct(false);
    setError('');
    setSuccessMessage('Product added to list');
    setTimeout(() => setSuccessMessage(''), 2000);
  };

  const removeProduct = (id) => {
    setAddedProducts(prev => prev.filter(p => p.id !== id));
  };

  // Auto-fetch product when item code is entered and loses focus
  const handleItemCodeBlur = async () => {
    if (formData.itemCode && formData.itemCode.trim() && !productInfo) {
      await fetchProductByItemCode();
    }
  };

  const handleItemCodeKeyPress = async (e) => {
    if (e.key === 'Enter' || e.keyCode === 13) {
      e.preventDefault();
      await fetchProductByItemCode();
    }
  };

  const fetchProductByItemCode = async () => {
    const itemCode = formData.itemCode?.trim();
    if (!itemCode) {
      return;
    }
    
    setIsFetchingProduct(true);
    setError('');
    setSuccessMessage('');
    
    console.log('🔍 Fetching product with item code:', itemCode);
    
    try {
      // Import API_BASE_URL at the top if not already imported
      const API_BASE_URL = process.env.REACT_APP_API_URL?.trim().replace(/\/+$/, '') || 'http://localhost:5000/api';
      
      console.log('📡 API URL:', `${API_BASE_URL}/products/item-code/${encodeURIComponent(itemCode)}`);
      
      // Use direct fetch to handle 404 gracefully without throwing
      const response = await fetch(`${API_BASE_URL}/products/item-code/${encodeURIComponent(itemCode)}`, {
        headers: {
          'Content-Type': 'application/json',
        },
      });

      console.log('📥 Response status:', response.status, response.ok);

      let data = null;
      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        data = await response.json();
      }

      console.log('📦 Response data:', data);

      // Check if product exists - handle both success flag and actual product data
      if (response.ok && data && data.success && data.product) {
        // Existing product found
        console.log('✅ Product found:', data.product.product_name);
        const product = data.product;
        const productData = {
          id: product.id,
          productName: product.product_name || product.productName || '',
          itemCode: product.item_code || product.itemCode || '',
          skuCode: product.sku_code || product.skuCode || '',
          currentQuantity: product.current_quantity || 0,
          minQuantity: product.min_quantity || product.minQuantity || 0,
          mrp: product.mrp || 0,
          modelNumber: product.model_number || product.modelNumber || '',
          category: product.category || '',
          discount1: product.discount_1 || product.discount1 || 0,
          discount2: product.discount_2 || product.discount2 || 0,
          sellRate: product.sell_rate || product.sellRate || 0,
          purchaseRate: product.purchase_rate || product.purchaseRate || 0
        };
        setProductInfo(productData);
        setIsNewProduct(false);
        
        // Auto-populate form fields
        const currentQty = productData.currentQuantity;
        const stockInQty = parseInt(formData.stockInQuantity) || 0;
        const totalAfter = currentQty + stockInQty;
        
        setFormData(prev => ({
          ...prev,
          productName: productData.productName,
          skuCode: productData.skuCode || '',
          quantity: currentQty.toString(),
          minQuantity: productData.minQuantity.toString(),
          mrp: productData.mrp.toString(),
          totalAfterAdding: totalAfter.toString(),
          modelNumber: productData.modelNumber || '',
          category: productData.category || '',
          discount1: productData.discount1.toString(),
          discount2: productData.discount2.toString(),
          sellRate: productData.sellRate.toString(),
          purchaseRate: productData.purchaseRate.toString()
        }));
        
        setSuccessMessage('✓ Product found! You can stock in now or edit details.');
      } else {
        // Product not found (404 or success: false) - enable new product mode
        console.log('🆕 Product not found, enabling new product mode for:', itemCode);
        setProductInfo(null);
        setIsNewProduct(true);
        setFormData(prev => ({
          ...prev,
          quantity: '0', // New product starts with 0 stock
          totalAfterAdding: (parseInt(prev.stockInQuantity) || 0).toString()
        }));
        setSuccessMessage('✓ New product! Enter all details to create and stock in.');
      }
    } catch (err) {
      // Any error means product doesn't exist - enable new product mode
      console.log('❌ Product fetch error (likely not found), enabling new product mode:', err.message);
      setProductInfo(null);
      setIsNewProduct(true);
      setFormData(prev => ({
        ...prev,
        quantity: '0',
        totalAfterAdding: (parseInt(prev.stockInQuantity) || 0).toString()
      }));
      setSuccessMessage('✓ New product! Enter all details to create and stock in.');
    } finally {
      setIsFetchingProduct(false);
      console.log('✅ Fetch complete. isNewProduct:', isNewProduct);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMessage('');

    // Check if products are added - this should never happen if button is disabled correctly
    if (!addedProducts || addedProducts.length === 0) {
      setError('Please add at least one product to the summary before creating stock in.');
      return;
    }

    // Validate each product has required fields
    const invalidProducts = addedProducts.filter(p => 
      !p.itemCode || !p.itemCode.trim() || 
      !p.stockInQuantity || parseFloat(p.stockInQuantity) <= 0
    );
    
    if (invalidProducts.length > 0) {
      setError('Some products in the summary are missing required fields. Please remove and re-add them.');
      return;
    }

    const newProductsCount = addedProducts.filter(p => p.isNewProduct).length;
    const existingProductsCount = addedProducts.length - newProductsCount;
    
    let confirmMessage = `Stock in ${addedProducts.length} product(s)?`;
    if (newProductsCount > 0) {
      confirmMessage += `\n\n${newProductsCount} new product(s) will be created.`;
    }
    confirmMessage += `\n\n${addedProducts.map((p, i) => `${i + 1}. ${p.productName} (+${p.stockInQuantity})${p.isNewProduct ? ' [NEW]' : ''}`).join('\n')}`;
    
    setConfirmState({
      open: true,
      message: confirmMessage,
      onConfirm: async () => {
        setIsLoading(true);
        setError('');
        setSuccessMessage('');
        
        try {
          const createdBy = getUserIdentifier();
          const API_BASE_URL = process.env.REACT_APP_API_URL?.trim().replace(/\/+$/, '') || 'http://localhost:5000/api';
          
          console.log('🚀 Starting stock in process for', addedProducts.length, 'products');
          
          // Process each product
          for (const product of addedProducts) {
            try {
              console.log('📦 Processing product:', product.productName, 'isNew:', product.isNewProduct);
              
              // If new product, create it first
              if (product.isNewProduct) {
                console.log('🆕 Creating new product:', product.productName);
                
                const createResponse = await fetch(`${API_BASE_URL}/products`, {
                  method: 'POST',
                  headers: {
                    'Content-Type': 'application/json',
                  },
                  body: JSON.stringify({
                    productName: product.productName,
                    itemCode: product.itemCode,
                    skuCode: product.skuCode || '',
                    modelNumber: product.modelNumber || '',
                    category: product.category || '',
                    minimumQuantity: product.minQuantity || 0,
                    maintainingQuantity: product.minQuantity || 0,
                    currentQuantity: 0, // Will be set by stock in
                    mrp: product.mrp,
                    discount1: product.discount1 || 0,
                    discount2: product.discount2 || 0,
                    sellRate: product.sellRate || 0,
                    purchaseRate: product.purchaseRate || 0,
                    supplierName: product.supplierName || ''
                  }),
                });
                
                const createData = await createResponse.json();
                console.log('📥 Create product response:', createData);
                
                if (!createResponse.ok || !createData.success) {
                  throw new Error(`Failed to create product ${product.productName}: ${createData.error || 'Unknown error'}`);
                }
                
                console.log('✅ Product created successfully');
              }
              
              // Now do stock in
              console.log('📈 Performing stock in for:', product.productName);
              
              const stockInResponse = await fetch(`${API_BASE_URL}/stock/in`, {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                  itemCode: product.itemCode,
                  quantity: product.stockInQuantity,
                  notes: formData.supplierName ? `Supplier: ${formData.supplierName}` : null,
                  createdBy: createdBy
                }),
              });
              
              const stockInData = await stockInResponse.json();
              console.log('📥 Stock in response:', stockInData);
              
              if (!stockInResponse.ok || !stockInData.success) {
                throw new Error(`Failed to stock in ${product.productName}: ${stockInData.error || 'Unknown error'}`);
              }
              
              console.log('✅ Stock in successful');
            } catch (productError) {
              console.error(`❌ Error processing product ${product.productName}:`, productError);
              throw productError;
            }
          }

          // All successful
          setError('');
          const productCount = addedProducts.length;
          const message = newProductsCount > 0 
            ? `Successfully created ${newProductsCount} new product(s) and added stock for ${productCount} product(s)!`
            : `Successfully added stock for ${productCount} product(s)!`;
          
          // Reset form
          setFormData({
            supplierName: '',
            itemCode: '',
            productName: '',
            skuCode: '',
            quantity: '0',
            stockInQuantity: '',
            minQuantity: '',
            mrp: '',
            totalAfterAdding: '',
            notes: '',
            modelNumber: '',
            category: '',
            discount1: '',
            discount2: '',
            sellRate: '',
            purchaseRate: ''
          });
          setProductInfo(null);
          setIsNewProduct(false);
          setAddedProducts([]);
          setSuccessMessage(message);
          setTimeout(() => {
            setSuccessMessage('');
            // Navigate back after showing success message
            handleBack();
          }, 2000);
        } catch (err) {
          console.error('Stock In error:', err);
          setError(err.message || 'An error occurred while processing. Please try again.');
        } finally {
          setIsLoading(false);
          setConfirmState({ open: false, message: '', onConfirm: null });
        }
      }
    });
  };

  return (
    <div className="add-user-container stock-in-container">
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
          <h1 className="add-user-title">Stock In</h1>
        </div>
        <div className="header-right">
        </div>
      </header>

      {/* Main Content */}
      <main className="add-user-content">
        <Toast message={error} type="error" onClose={() => setError('')} />
        <Toast message={successMessage} type="success" onClose={() => setSuccessMessage('')} />

        <form onSubmit={handleSubmit} className="add-user-form add-stock-in-form" noValidate>
          {/* Form Fields */}
          <div className="form-section">
            {/* First Row: Item Code, SKU Code, Product Name, Supplier Name */}
            <div className="form-grid four-col">
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
                    value={formData.itemCode}
                    onChange={handleInputChange}
                    onKeyPress={handleItemCodeKeyPress}
                    onBlur={handleItemCodeBlur}
                    autoFocus
                    style={{ paddingRight: isFetchingProduct ? '40px' : '50px' }}
                  />
                  {isFetchingProduct ? (
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
                <label htmlFor="skuCode">SKU Code</label>
                <div className="input-wrapper">
                  <i className="fas fa-boxes input-icon"></i>
                  <input
                    type="text"
                    id="skuCode"
                    name="skuCode"
                    className="form-input"
                    placeholder="Enter SKU Code"
                    value={formData.skuCode}
                    onChange={handleInputChange}
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
                    value={formData.productName}
                    onChange={handleInputChange}
                  />
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="supplierName">Supplier Name</label>
                <div className="input-wrapper">
                  <i className="fas fa-truck input-icon"></i>
                  <input
                    type="text"
                    id="supplierName"
                    name="supplierName"
                    className="form-input"
                    placeholder="Enter or select supplier name"
                    value={formData.supplierName}
                    onChange={handleInputChange}
                    list="suppliers-list"
                    autoComplete="off"
                  />
                  <datalist id="suppliers-list">
                    {suppliers.map((supplier, index) => (
                      <option key={supplier.id || index} value={supplier.supplier_name || supplier.name} />
                    ))}
                  </datalist>
                </div>
              </div>
            </div>

            {/* Second Row: Quantity to Add, Min Quantity, Current Stock, MRP */}
            <div className="form-grid four-col" style={{ marginTop: '12px' }}>
              <div className="form-group">
                <label htmlFor="stockInQuantity">Quantity to Add *</label>
                <div className="input-wrapper">
                  <i className="fas fa-plus-circle input-icon"></i>
                  <input
                    type="number"
                    id="stockInQuantity"
                    name="stockInQuantity"
                    className="form-input"
                    placeholder="Enter quantity to add"
                    value={formData.stockInQuantity}
                    onChange={handleInputChange}
                    min="1"
                    step="1"
                  />
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="minQuantity">Min Quantity</label>
                <div className="input-wrapper">
                  <i className="fas fa-exclamation-triangle input-icon"></i>
                  <input
                    type="number"
                    id="minQuantity"
                    name="minQuantity"
                    className="form-input"
                    placeholder="Enter min quantity"
                    value={formData.minQuantity}
                    onChange={handleInputChange}
                  />
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="quantity">Current Stock</label>
                <div className="input-wrapper">
                  <i className="fas fa-warehouse input-icon"></i>
                  <input
                    type="number"
                    id="quantity"
                    name="quantity"
                    className="form-input"
                    placeholder="Current Stock"
                    value={formData.quantity}
                    readOnly
                    style={{ 
                      background: formData.quantity && parseInt(formData.quantity) <= 0 ? '#fff3cd' : '#f8f9fa', 
                      cursor: 'not-allowed',
                      fontWeight: 'bold',
                      color: formData.quantity && parseInt(formData.quantity) <= 0 ? '#dc3545' : '#495057'
                    }}
                  />
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="mrp">MRP *</label>
                <div className="input-wrapper">
                  <i className="fas fa-rupee-sign input-icon"></i>
                  <input
                    type="number"
                    id="mrp"
                    name="mrp"
                    className="form-input"
                    placeholder="Enter MRP"
                    value={formData.mrp}
                    onChange={handleInputChange}
                  />
                </div>
              </div>
            </div>

            {/* Additional fields for new products */}
            {isNewProduct && (
              <div className="form-grid four-col" style={{ marginTop: '12px', padding: '16px', background: '#fff3cd', borderRadius: '8px', border: '2px dashed #ffc107' }}>
                <div className="form-group">
                  <label htmlFor="modelNumber">Model Number</label>
                  <div className="input-wrapper">
                    <i className="fas fa-tag input-icon"></i>
                    <input
                      type="text"
                      id="modelNumber"
                      name="modelNumber"
                      className="form-input"
                      placeholder="Enter model number"
                      value={formData.modelNumber}
                      onChange={handleInputChange}
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label htmlFor="category">Category</label>
                  <div className="input-wrapper">
                    <i className="fas fa-folder input-icon"></i>
                    <input
                      type="text"
                      id="category"
                      name="category"
                      className="form-input"
                      placeholder="Enter category"
                      value={formData.category}
                      onChange={handleInputChange}
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
                      value={formData.sellRate}
                      onChange={handleInputChange}
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label htmlFor="purchaseRate">Purchase Rate</label>
                  <div className="input-wrapper">
                    <i className="fas fa-rupee-sign input-icon"></i>
                    <input
                      type="number"
                      id="purchaseRate"
                      name="purchaseRate"
                      className="form-input"
                      placeholder="Enter purchase rate"
                      value={formData.purchaseRate}
                      onChange={handleInputChange}
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Third Row: Total After Adding, Add Product Button */}
            <div className="form-grid four-col" style={{ marginTop: '12px' }}>
              <div className="form-group">
                <label htmlFor="totalAfterAdding">Total After Adding</label>
                <div className="input-wrapper">
                  <i className="fas fa-calculator input-icon"></i>
                  <input
                    type="number"
                    id="totalAfterAdding"
                    name="totalAfterAdding"
                    className="form-input"
                    placeholder="Total quantity"
                    value={formData.totalAfterAdding}
                    readOnly
                    style={{ 
                      background: '#e7f3ff', 
                      cursor: 'not-allowed',
                      fontWeight: 'bold',
                      color: '#0066cc'
                    }}
                  />
                </div>
              </div>

              <div className="form-group">
                <label>&nbsp;</label>
                <button
                  type="button"
                  onClick={addProduct}
                  disabled={!formData.itemCode || !formData.productName || !formData.stockInQuantity || parseFloat(formData.stockInQuantity) <= 0}
                  style={{
                    width: '100%',
                    padding: '10px',
                    background: (formData.itemCode && formData.productName && formData.stockInQuantity && parseFloat(formData.stockInQuantity) > 0) ? '#dc3545' : '#ccc',
                    color: '#fff',
                    border: 'none',
                    borderRadius: '8px',
                    cursor: (formData.itemCode && formData.productName && formData.stockInQuantity && parseFloat(formData.stockInQuantity) > 0) ? 'pointer' : 'not-allowed',
                    fontSize: '14px',
                    fontWeight: '600',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    transition: 'all 0.2s ease'
                  }}
                  onMouseEnter={(e) => {
                    if (formData.itemCode && formData.productName && formData.stockInQuantity && parseFloat(formData.stockInQuantity) > 0) {
                      e.target.style.background = '#c82333';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (formData.itemCode && formData.productName && formData.stockInQuantity && parseFloat(formData.stockInQuantity) > 0) {
                      e.target.style.background = '#dc3545';
                    }
                  }}
                >
                  <i className="fas fa-plus"></i>
                  {isNewProduct ? 'Add New Product' : 'Add Product'}
                </button>
              </div>
            </div>

            {/* Display Added Products - Summary Table - Right after Total After Adding */}
            {addedProducts.length > 0 && (
              <div className="product-summary-section" style={{ 
                marginTop: '30px', 
                clear: 'both', 
                paddingTop: '20px', 
                marginBottom: '20px',
                paddingBottom: '20px',
                position: 'relative',
                zIndex: 1,
                width: '100%',
                display: 'block'
              }}>
                <div style={{ width: '100%', marginBottom: '0' }}>
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
                            <th>SUPPLIER NAME</th>
                            <th style={{ width: '120px', textAlign: 'center' }}>MRP</th>
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
                                {product.stockInQuantity}
                              </td>
                              <td style={{ fontWeight: '500', color: '#333' }}>
                                {product.supplierName || '-'}
                              </td>
                              <td style={{ textAlign: 'center', fontWeight: '500', color: '#333' }}>
                                ₹{parseFloat(product.mrp || 0).toFixed(2)}
                              </td>
                              <td style={{ textAlign: 'center', fontWeight: '600', color: '#0066cc' }}>
                                ₹{parseFloat(product.amount || 0).toFixed(2)}
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
                        ₹{addedProducts.reduce((sum, product) => sum + (parseFloat(product.amount) || 0), 0).toFixed(2)}
                      </div>
                      <div style={{ minWidth: '100px' }}></div>
                    </div>
                  </div>
                </div>

                {/* Stock In Button - right after the table */}
                <div style={{ 
                  display: 'flex', 
                  justifyContent: 'center', 
                  alignItems: 'center',
                  marginTop: '20px',
                  paddingTop: '10px',
                  paddingBottom: '20px',
                  width: '100%'
                }}>
                  <button
                    type="submit"
                    className="btn-primary"
                    disabled={isLoading || addedProducts.length === 0}
                    style={{
                      width: '200px',
                      maxWidth: '200px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '8px'
                    }}
                  >
                    {isLoading ? (
                      <>
                        <i className="fas fa-spinner fa-spin"></i> Adding Stock...
                      </>
                    ) : (
                      <>
                        <i className="fas fa-plus"></i> Stock In
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}
          </div>
        </form>
      </main>
    </div>
  );
};

export default StockIn;
