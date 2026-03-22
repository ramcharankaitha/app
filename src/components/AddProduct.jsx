import React, { useState, useEffect, useRef } from 'react';
import { productsAPI, categoriesAPI } from '../services/api';
import ConfirmDialog from './ConfirmDialog';
import Toast from './Toast';

const AddProduct = ({ onBack, onCancel, onNavigate, userRole = 'admin' }) => {
  const [formData, setFormData] = useState({
    productName: '',
    itemCode: '',
    skuCode: '',
    modelNumber: '',
    minQuantity: '',
    openingQuantity: '',
    supplierName: '',
    category: '',
    mrp: '',
    discount1: '',
    discount2: '',
    sellRate: '',
    purchaseRate: '',
    points: '',
    image: ''
  });
  const [imagePreview, setImagePreview] = useState(null);
  const [imageFile, setImageFile] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [confirmState, setConfirmState] = useState({ open: false, message: '', onConfirm: null });
  const [mainCategories, setMainCategories] = useState([]);
  const [subCategories, setSubCategories] = useState([]);
  const [commonCategories, setCommonCategories] = useState([]);
  const [selectedMainCategory, setSelectedMainCategory] = useState('');
  const [selectedSubCategory, setSelectedSubCategory] = useState('');
  const [selectedCommonCategory, setSelectedCommonCategory] = useState('');
  
  // Removed search/filter states - using standard select dropdowns now

  // Fetch all categories on mount and extract unique main/sub/common values independently
  useEffect(() => {
    const fetchAllCategories = async () => {
      try {
        const response = await categoriesAPI.getAll();
        if (response && response.success) {
          const cats = response.categories || [];
          setMainCategories([...new Set(cats.map(c => c.main).filter(Boolean))].sort());
          setSubCategories([...new Set(cats.map(c => c.sub).filter(Boolean))].sort());
          setCommonCategories([...new Set(cats.map(c => c.common).filter(Boolean))].sort());
        }
      } catch (err) {
        console.error('Error fetching categories:', err);
      }
    };
    fetchAllCategories();
  }, []);

  const handleBack = () => {
    if (onNavigate) {
      onNavigate('products');
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

  const handleProducts = () => {
    if (onNavigate) {
      onNavigate('products');
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
      onNavigate('products');
    } else if (onCancel) {
      onCancel();
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    
    setFormData(prev => {
      const updated = {
        ...prev,
        [name]: value
      };
      
      // Calculate based on what changed
      return calculateRatesAndDiscounts(updated, name);
    });
  };

  // Calculate rates and discounts automatically
  const calculateRatesAndDiscounts = (data, changedField) => {
    const updated = { ...data };
    const mrp = parseFloat(data.mrp) || 0;
    const discount1 = parseFloat(data.discount1) || 0;
    const discount2 = parseFloat(data.discount2) || 0;
    const sellRate = parseFloat(data.sellRate) || 0;
    const purchaseRate = parseFloat(data.purchaseRate) || 0;
    
    // Track if we should calculate discount1 or sellRate
    let shouldCalculateSellRate = false;
    let shouldCalculateDiscount1 = false;
    
    // Track if we should calculate discount2 or purchaseRate
    let shouldCalculatePurchaseRate = false;
    let shouldCalculateDiscount2 = false;
    
    // Determine calculation direction based on what changed
    if (changedField === 'mrp') {
      // If MRP changed and discount1 exists, calculate sell rate
      if (mrp > 0 && discount1 > 0) {
        shouldCalculateSellRate = true;
      }
      // If MRP changed and sell rate exists, calculate discount1
      else if (mrp > 0 && sellRate > 0) {
        shouldCalculateDiscount1 = true;
      }
      
      // If MRP changed and discount2 exists, calculate purchase rate
      if (mrp > 0 && discount2 > 0) {
        shouldCalculatePurchaseRate = true;
      }
      // If MRP changed and purchase rate exists, calculate discount2
      else if (mrp > 0 && purchaseRate > 0) {
        shouldCalculateDiscount2 = true;
      }
    } else if (changedField === 'discount1') {
      // If discount1 changed and MRP exists, calculate sell rate
      if (mrp > 0 && discount1 > 0) {
        shouldCalculateSellRate = true;
      }
      // If discount1 is cleared, don't auto-calculate sell rate
      else if (!data.discount1 || data.discount1 === '') {
        // Keep sell rate as is (user might have entered it manually)
      }
    } else if (changedField === 'sellRate') {
      // If sell rate changed and MRP exists, calculate discount1
      if (mrp > 0 && sellRate > 0) {
        shouldCalculateDiscount1 = true;
      }
    } else if (changedField === 'discount2') {
      // If discount2 changed and MRP exists, calculate purchase rate
      if (mrp > 0 && discount2 > 0) {
        shouldCalculatePurchaseRate = true;
      }
      // If discount2 is cleared, don't auto-calculate purchase rate
      else if (!data.discount2 || data.discount2 === '') {
        // Keep purchase rate as is (user might have entered it manually)
      }
    } else if (changedField === 'purchaseRate') {
      // If purchase rate changed and MRP exists, calculate discount2
      if (mrp > 0 && purchaseRate > 0) {
        shouldCalculateDiscount2 = true;
      }
    }
    
    // Calculate sell rate from discount1
    if (shouldCalculateSellRate && mrp > 0 && discount1 > 0) {
      const calculatedSellRate = mrp - (mrp * discount1 / 100);
      updated.sellRate = calculatedSellRate.toFixed(2);
    }
    
    // Calculate discount1 from sell rate
    if (shouldCalculateDiscount1 && mrp > 0 && sellRate > 0) {
      const calculatedDiscount1 = ((mrp - sellRate) / mrp) * 100;
      if (calculatedDiscount1 >= 0 && calculatedDiscount1 <= 100) {
        updated.discount1 = calculatedDiscount1.toFixed(2);
      }
    }
    
    // Calculate purchase rate from discount2
    if (shouldCalculatePurchaseRate && mrp > 0 && discount2 > 0) {
      const calculatedPurchaseRate = mrp - (mrp * discount2 / 100);
      updated.purchaseRate = calculatedPurchaseRate.toFixed(2);
    }
    
    // Calculate discount2 from purchase rate
    if (shouldCalculateDiscount2 && mrp > 0 && purchaseRate > 0) {
      const calculatedDiscount2 = ((mrp - purchaseRate) / mrp) * 100;
      if (calculatedDiscount2 >= 0 && calculatedDiscount2 <= 100) {
        updated.discount2 = calculatedDiscount2.toFixed(2);
      }
    }
    
    // Calculate points based on sell rate (sales amount)
    // For every 1000 of sales/purchase, 0.5 points are given
    const currentSellRate = parseFloat(updated.sellRate) || 0;
    const currentPurchaseRate = parseFloat(updated.purchaseRate) || 0;
    
    // Priority: Use sell rate if available, otherwise use purchase rate
    if (currentSellRate > 0 && (changedField === 'sellRate' || changedField === 'mrp' || changedField === 'discount1' || changedField === 'purchaseRate' || changedField === 'discount2')) {
      const calculatedPoints = (currentSellRate / 1000) * 0.5;
      updated.points = calculatedPoints.toFixed(2);
    }
    // If sell rate is not available, calculate from purchase rate
    else if (currentSellRate === 0 && currentPurchaseRate > 0 && (changedField === 'purchaseRate' || changedField === 'mrp' || changedField === 'discount2')) {
      const calculatedPoints = (currentPurchaseRate / 1000) * 0.5;
      updated.points = calculatedPoints.toFixed(2);
    }
    // If both are cleared, clear points
    else if (currentSellRate === 0 && currentPurchaseRate === 0 && (changedField === 'sellRate' || changedField === 'purchaseRate')) {
      updated.points = '';
    }
    
    return updated;
  };

  // Handle main category selection
  const handleMainCategoryChange = (e) => {
    const value = e.target.value;
    setSelectedMainCategory(value);
    // Sub and common will be cleared by useEffect
  };

  // Handle sub category selection
  const handleSubCategoryChange = (e) => {
    const value = e.target.value;
    setSelectedSubCategory(value);
    // Common will be cleared by useEffect
  };

  // Handle common category selection
  const handleCommonCategoryChange = (e) => {
    const value = e.target.value;
    setSelectedCommonCategory(value);
  };

  // Update category string whenever main, sub, or common changes
  useEffect(() => {
    let categoryString = selectedMainCategory || '';
    if (selectedSubCategory) {
      categoryString += ' - ' + selectedSubCategory;
    }
    if (selectedCommonCategory) {
      categoryString += ' - ' + selectedCommonCategory;
    }
    setFormData(prev => ({
      ...prev,
      category: categoryString
    }));
  }, [selectedMainCategory, selectedSubCategory, selectedCommonCategory]);


  const submitProduct = async () => {
    setIsLoading(true);
    setError('');
    setSuccessMessage('');

    try {
      // Helper function to parse numeric value, removing currency symbols and text
      const parseNumericValue = (value) => {
        if (!value || value === '') return null;
        // Remove "Rs", "₹", commas, and any non-numeric characters except decimal point
        const cleaned = String(value).replace(/[Rs₹,\s]/gi, '').trim();
        const parsed = parseFloat(cleaned);
        return isNaN(parsed) ? null : parsed;
      };

      // Create FormData for file upload
      const formDataToSend = new FormData();
      
      // Add all form fields
      if (formData.productName?.trim()) formDataToSend.append('productName', formData.productName.trim());
      if (formData.itemCode?.trim()) formDataToSend.append('itemCode', formData.itemCode.trim());
      if (formData.skuCode?.trim()) formDataToSend.append('skuCode', formData.skuCode.trim());
      if (formData.modelNumber?.trim()) formDataToSend.append('modelNumber', formData.modelNumber.trim());
      if (formData.minQuantity) formDataToSend.append('minimumQuantity', parseInt(formData.minQuantity));

      if (formData.openingQuantity) formDataToSend.append('currentQuantity', parseInt(formData.openingQuantity));
      if (formData.supplierName?.trim()) formDataToSend.append('supplierName', formData.supplierName.trim());
      if (formData.category?.trim()) formDataToSend.append('category', formData.category.trim());
      
      const mrpValue = parseNumericValue(formData.mrp);
      const discount1Value = parseNumericValue(formData.discount1);
      const discount2Value = parseNumericValue(formData.discount2);
      const sellRateValue = parseNumericValue(formData.sellRate);
      const purchaseRateValue = parseNumericValue(formData.purchaseRate);
      const pointsValue = formData.points ? parseInt(formData.points) : 0;
      
      if (mrpValue !== null) formDataToSend.append('mrp', mrpValue);
      if (discount1Value !== null) formDataToSend.append('discount1', discount1Value);
      if (discount2Value !== null) formDataToSend.append('discount2', discount2Value);
      if (sellRateValue !== null) formDataToSend.append('sellRate', sellRateValue);
      if (purchaseRateValue !== null) formDataToSend.append('purchaseRate', purchaseRateValue);
      formDataToSend.append('points', pointsValue);
      
      // Add image file if exists
      if (imageFile) {
        formDataToSend.append('productImage', imageFile);
      }

      // Use fetch instead of productsAPI to send FormData
      const API_BASE_URL = process.env.REACT_APP_API_URL?.trim().replace(/\/+$/, '') || 'http://localhost:5000/api';
      const response = await fetch(`${API_BASE_URL}/products`, {
        method: 'POST',
        body: formDataToSend
        // Don't set Content-Type header - browser will set it with boundary for multipart/form-data
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setSuccessMessage('Save changes are done');
        // Clear success message and navigate after 2 seconds
        setTimeout(() => {
          setSuccessMessage('');
          handleCancel();
        }, 2000);
      } else {
        throw new Error(data.error || 'Failed to create product');
      }
    } catch (err) {
      setError(err.message || 'Failed to create product. Please try again.');
      console.error('Create product error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setConfirmState({
      open: true,
      message: 'Are you sure you want to submit?',
      onConfirm: submitProduct,
    });
  };

  return (
    <>
      {/* Left Sidebar Navigation */}
        <div className="add-user-container">
          {/* Header */}
          <header className="add-user-header">
            <button className="back-btn" onClick={handleBack}>
              <i className="fas fa-arrow-left"></i>
            </button>
            <div className="header-content">
              <h1 className="page-title">Add New Product</h1>
            </div>
          </header>

          {/* Main Content */}
          <main className="add-user-content">
            <form onSubmit={handleSubmit} className="add-user-form">
                {/* Product Fields - No section title */}
                <div className="form-section">
                  <div className="form-grid four-col">
                    {/* Category Selection - All three in first row */}
                    {/* 1. Main Category */}
                    <div className="form-group">
                      <label htmlFor="mainCategory">Main Category</label>
                      <div className="input-wrapper">
                        <i className="fas fa-th-large input-icon"></i>
                        <select
                          id="mainCategory"
                          name="mainCategory"
                          className="form-input"
                          value={selectedMainCategory}
                          onChange={handleMainCategoryChange}
                        >
                          <option value="">Select Main Category</option>
                          {mainCategories.map((main, index) => (
                            <option key={index} value={main}>
                              {main}
                            </option>
                          ))}
                        </select>
                        <i className="fas fa-chevron-down dropdown-icon"></i>
                      </div>
                    </div>

                    {/* 2. Sub Category */}
                    <div className="form-group">
                      <label htmlFor="subCategory">Sub Category</label>
                      <div className="input-wrapper">
                        <i className="fas fa-th-large input-icon"></i>
                        <select
                          id="subCategory"
                          name="subCategory"
                          className="form-input"
                          value={selectedSubCategory}
                          onChange={handleSubCategoryChange}
                        >
                          <option value="">Select Sub Category</option>
                          {subCategories.map((sub, index) => (
                            <option key={index} value={sub}>
                              {sub}
                            </option>
                          ))}
                        </select>
                        <i className="fas fa-chevron-down dropdown-icon"></i>
                      </div>
                    </div>

                    {/* 3. Common Category */}
                    <div className="form-group">
                      <label htmlFor="commonCategory">Common Category</label>
                      <div className="input-wrapper">
                        <i className="fas fa-th-large input-icon"></i>
                        <select
                          id="commonCategory"
                          name="commonCategory"
                          className="form-input"
                          value={selectedCommonCategory}
                          onChange={handleCommonCategoryChange}
                        >
                          <option value="">Select Common Category</option>
                          {commonCategories.map((common, index) => (
                            <option key={index} value={common}>
                              {common}
                            </option>
                          ))}
                        </select>
                        <i className="fas fa-chevron-down dropdown-icon"></i>
                      </div>
                    </div>

                    {/* 2. Item Code */}
                    <div className="form-group">
                      <label htmlFor="itemCode">Item Code</label>
                      <div className="input-wrapper">
                        <i className="fas fa-barcode input-icon"></i>
                        <input
                          type="text"
                          id="itemCode"
                          name="itemCode"
                          className="form-input"
                          placeholder="e.g., ITM-0983"
                          value={formData.itemCode}
                          onChange={handleInputChange}
                          required
                        />
                      </div>
                    </div>

                    {/* 3. Product Name */}
                    <div className="form-group">
                      <label htmlFor="productName">Product</label>
                      <div className="input-wrapper">
                        <i className="fas fa-tag input-icon"></i>
                        <input
                          type="text"
                          id="productName"
                          name="productName"
                          className="form-input"
                          placeholder="e.g., Classic Basmati Rice"
                          value={formData.productName}
                          onChange={handleInputChange}
                          required
                        />
                      </div>
                    </div>

                    {/* 4. SKU Code */}
                    <div className="form-group">
                      <label htmlFor="skuCode">SKU Code</label>
                      <div className="input-wrapper">
                        <i className="fas fa-boxes input-icon"></i>
                        <input
                          type="text"
                          id="skuCode"
                          name="skuCode"
                          className="form-input"
                          placeholder="e.g., SKU-44355"
                          value={formData.skuCode}
                          onChange={handleInputChange}
                        />
                      </div>
                    </div>

                    {/* 5. Model */}
                    <div className="form-group">
                      <label htmlFor="modelNumber">Model</label>
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

                    {/* 6. Opening Quantity */}
                    <div className="form-group">
                      <label htmlFor="openingQuantity">Opening Quantity</label>
                      <div className="input-wrapper">
                        <i className="fas fa-cubes input-icon"></i>
                        <input
                          type="number"
                          id="openingQuantity"
                          name="openingQuantity"
                          className="form-input"
                          placeholder="e.g., 100 units"
                          value={formData.openingQuantity}
                          onChange={handleInputChange}
                          min="0"
                        />
                      </div>
                    </div>




                    <div className="form-group">
                      <label htmlFor="minQuantity">Minimum Quantity</label>
                      <div className="input-wrapper">
                        <i className="fas fa-exclamation-triangle input-icon"></i>
                        <input
                          type="number"
                          id="minQuantity"
                          name="minQuantity"
                          className="form-input"
                          placeholder="Enter minimum quantity"
                          value={formData.minQuantity}
                          onChange={handleInputChange}
                          min="0"
                        />
                      </div>
                    </div>

                    {/* Supplier Name - moved after minimum quantity */}
                    <div className="form-group">
                      <label htmlFor="supplierName">Supplier Name</label>
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
                          value={formData.mrp}
                          onChange={handleInputChange}
                          min="0"
                          step="0.01"
                        />
                      </div>
                    </div>

                    {/* Discount 1 */}
                    <div className="form-group">
                      <label htmlFor="discount1">Discount 1</label>
                      <div className="input-wrapper">
                        <i className="fas fa-percent input-icon"></i>
                        <input
                          type="number"
                          id="discount1"
                          name="discount1"
                          className="form-input"
                          placeholder="Enter discount 1"
                          value={formData.discount1}
                          onChange={handleInputChange}
                          min="0"
                          step="0.01"
                        />
                      </div>
                    </div>

                    {/* Sell Rate */}
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
                          min="0"
                          step="0.01"
                        />
                      </div>
                    </div>

                    {/* Discount 2 */}
                    <div className="form-group">
                      <label htmlFor="discount2">Discount 2</label>
                      <div className="input-wrapper">
                        <i className="fas fa-percent input-icon"></i>
                        <input
                          type="number"
                          id="discount2"
                          name="discount2"
                          className="form-input"
                          placeholder="Enter discount 2"
                          value={formData.discount2}
                          onChange={handleInputChange}
                          min="0"
                          step="0.01"
                        />
                      </div>
                    </div>

                    {/* Purchase Rate */}
                    <div className="form-group">
                      <label htmlFor="purchaseRate">Purchase Rate</label>
                      <div className="input-wrapper">
                        <i className="fas fa-shopping-cart input-icon"></i>
                        <input
                          type="number"
                          id="purchaseRate"
                          name="purchaseRate"
                          className="form-input"
                          placeholder="Enter purchase rate"
                          value={formData.purchaseRate}
                          onChange={handleInputChange}
                          min="0"
                          step="0.01"
                        />
                      </div>
                    </div>

                    <div className="form-group">
                      <label htmlFor="points">Points</label>
                      <div className="input-wrapper">
                        <i className="fas fa-star input-icon"></i>
                        <input
                          type="number"
                          id="points"
                          name="points"
                          className="form-input"
                          placeholder="Auto-calculated (0.5 per ₹1000)"
                          value={formData.points}
                          onChange={handleInputChange}
                          min="0"
                          step="0.01"
                          readOnly
                          style={{ background: '#f8f9fa', cursor: 'not-allowed' }}
                          title="Points are automatically calculated: 0.5 points for every ₹1000 of sales/purchase"
                        />
                      </div>
                    </div>

                    {/* Upload Image */}
                    <div className="form-group">
                      <label>Product Image</label>
                      <div style={{ 
                        width: '100%',
                        position: 'relative',
                        zIndex: 1
                      }}>
                        <input
                          type="file"
                          id="imageUpload"
                          accept="image/*"
                          capture="environment"
                          style={{ display: 'none' }}
                          onChange={(e) => {
                            const file = e.target.files[0];
                            if (file) {
                              // Validate file size (max 5MB)
                              if (file.size > 5 * 1024 * 1024) {
                                setError('Image size should be less than 5MB');
                                return;
                              }
                              // Validate file type
                              if (!file.type.startsWith('image/')) {
                                setError('Please select a valid image file');
                                return;
                              }
                              setImageFile(file);
                              // Create preview
                              const reader = new FileReader();
                              reader.onloadend = () => {
                                setImagePreview(reader.result);
                                setFormData(prev => ({ ...prev, image: reader.result }));
                              };
                              reader.readAsDataURL(file);
                            }
                          }}
                        />
                        <input
                          type="file"
                          id="galleryUpload"
                          accept="image/*"
                          style={{ display: 'none' }}
                          onChange={(e) => {
                            const file = e.target.files[0];
                            if (file) {
                              // Validate file size (max 5MB)
                              if (file.size > 5 * 1024 * 1024) {
                                setError('Image size should be less than 5MB');
                                return;
                              }
                              // Validate file type
                              if (!file.type.startsWith('image/')) {
                                setError('Please select a valid image file');
                                return;
                              }
                              setImageFile(file);
                              // Create preview
                              const reader = new FileReader();
                              reader.onloadend = () => {
                                setImagePreview(reader.result);
                                setFormData(prev => ({ ...prev, image: reader.result }));
                              };
                              reader.readAsDataURL(file);
                            }
                          }}
                        />
                        {imagePreview ? (
                          <div style={{ position: 'relative', width: '100%' }}>
                            <img 
                              src={imagePreview} 
                              alt="Product preview" 
                              style={{
                                width: '100%',
                                maxHeight: '200px',
                                objectFit: 'contain',
                                border: '1px solid #ddd',
                                borderRadius: '8px',
                                padding: '8px',
                                background: '#f8f9fa'
                              }}
                            />
                            <button
                              type="button"
                              onClick={() => {
                                setImagePreview(null);
                                setImageFile(null);
                                setFormData(prev => ({ ...prev, image: '' }));
                                const fileInput = document.getElementById('imageUpload');
                                if (fileInput) fileInput.value = '';
                              }}
                              style={{
                                position: 'absolute',
                                top: '8px',
                                right: '8px',
                                background: '#dc3545',
                                color: '#fff',
                                border: 'none',
                                borderRadius: '50%',
                                width: '30px',
                                height: '30px',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontSize: '14px'
                              }}
                            >
                              <i className="fas fa-times"></i>
                            </button>
                          </div>
                        ) : (
                          <div style={{ display: 'flex', gap: '8px', width: '100%' }}>
                            <label
                              htmlFor="imageUpload"
                              style={{
                                cursor: 'pointer',
                                padding: '8px 12px',
                                border: '2px dashed #dc3545',
                                borderRadius: '8px',
                                textAlign: 'center',
                                background: '#fff',
                                transition: 'all 0.3s ease',
                                minHeight: '38px',
                                height: '38px',
                                display: 'flex',
                                flex: 1,
                                flexDirection: 'row',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: '6px',
                                fontSize: '12px'
                              }}
                              onMouseEnter={(e) => {
                                e.target.style.background = '#f8f9fa';
                                e.target.style.borderColor = '#c82333';
                              }}
                              onMouseLeave={(e) => {
                                e.target.style.background = '#fff';
                                e.target.style.borderColor = '#dc3545';
                              }}
                            >
                              <i className="fas fa-camera" style={{ fontSize: '14px' }}></i>
                              <span>Camera</span>
                            </label>
                            <label
                              htmlFor="galleryUpload"
                              style={{
                                cursor: 'pointer',
                                padding: '8px 12px',
                                border: '2px dashed #28a745',
                                borderRadius: '8px',
                                textAlign: 'center',
                                background: '#fff',
                                transition: 'all 0.3s ease',
                                minHeight: '38px',
                                height: '38px',
                                display: 'flex',
                                flex: 1,
                                flexDirection: 'row',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: '6px',
                                fontSize: '12px'
                              }}
                              onMouseEnter={(e) => {
                                e.target.style.background = '#f8f9fa';
                                e.target.style.borderColor = '#218838';
                              }}
                              onMouseLeave={(e) => {
                                e.target.style.background = '#fff';
                                e.target.style.borderColor = '#28a745';
                              }}
                            >
                              <i className="fas fa-images" style={{ fontSize: '14px' }}></i>
                              <span>Gallery</span>
                            </label>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                <Toast message={error} type="error" onClose={() => setError('')} />
                <Toast message={successMessage} type="success" onClose={() => setSuccessMessage('')} />

                {/* Action Buttons */}
                <div className="form-actions">
                  <button type="submit" className="create-user-btn" disabled={isLoading}>
                    {isLoading ? 'Adding...' : 'Add Product'}
                  </button>
                  <button type="button" className="cancel-btn" onClick={handleCancel}>
                    Cancel
                  </button>
                </div>
              </form>
          </main>
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
    </>
  );
};

export default AddProduct;

