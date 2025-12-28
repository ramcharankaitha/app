import React, { useState, useEffect, useRef } from 'react';
import { categoriesAPI } from '../services/api';
import ConfirmDialog from './ConfirmDialog';
import './products.css';

const CategoryMaster = ({ onBack, onAddCategory, onNavigate, userRole = 'admin' }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [categories, setCategories] = useState([]);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [openMenuId, setOpenMenuId] = useState(null);
  const [showViewModal, setShowViewModal] = useState(false);
  const [editCategoryModal, setEditCategoryModal] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [confirmState, setConfirmState] = useState({ open: false, message: '', onConfirm: null, category: null });
  const menuRefs = useRef({});

  // Fetch categories from database
  const fetchCategories = async () => {
    try {
      setError('');
      const response = await categoriesAPI.getAll();
      if (response && response.success) {
        setCategories(response.categories || []);
      } else {
        setError('Failed to load categories');
      }
    } catch (err) {
      console.error('Error fetching categories:', err);
      setError('Failed to load categories. Please try again.');
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (openMenuId && menuRefs.current[openMenuId] && !menuRefs.current[openMenuId].contains(event.target)) {
        setOpenMenuId(null);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [openMenuId]);

  const toggleMenu = (categoryId, e) => {
    e.stopPropagation();
    setOpenMenuId(openMenuId === categoryId ? null : categoryId);
  };

  const handleViewCategory = (category) => {
    setSelectedCategory(category);
    setShowViewModal(true);
    setOpenMenuId(null);
  };

  const handleEditCategory = async (category) => {
    setOpenMenuId(null);
    try {
      const response = await categoriesAPI.getById(category.id);
      if (response && response.success) {
        setEditCategoryModal(response.category);
      } else {
        setError('Failed to fetch category details');
      }
    } catch (err) {
      console.error('Error fetching category details:', err);
      setError('Failed to fetch category details');
    }
  };

  const handleDeleteCategory = (category) => {
    setOpenMenuId(null);
    setConfirmState({
      open: true,
      message: `Are you sure you want to delete "${category.main}" category? This action cannot be undone.`,
      category: category,
      onConfirm: async () => {
        try {
          const response = await categoriesAPI.delete(category.id);
          if (response && response.success) {
            setSuccessMessage('Category deleted successfully');
            setTimeout(() => setSuccessMessage(''), 3000);
            await fetchCategories();
            setConfirmState({ open: false, message: '', onConfirm: null, category: null });
          } else {
            setError(response?.error || 'Failed to delete category');
            setConfirmState({ open: false, message: '', onConfirm: null, category: null });
          }
        } catch (err) {
          setError(err.message || 'Failed to delete category');
          setConfirmState({ open: false, message: '', onConfirm: null, category: null });
        }
      }
    });
  };

  // Handle save category details
  const handleSaveCategoryDetails = async () => {
    if (!editCategoryModal) return;
    
    setIsSaving(true);
    setError('');
    
    try {
      const response = await categoriesAPI.update(editCategoryModal.id, {
        main: editCategoryModal.main,
        sub: editCategoryModal.sub,
        common: editCategoryModal.common,
        city: editCategoryModal.city
      });
      
      if (response && response.success) {
        await fetchCategories();
        setEditCategoryModal(null);
        setError('');
        setSuccessMessage('Category updated successfully');
        setTimeout(() => setSuccessMessage(''), 3000);
      } else {
        setError('Failed to update category');
      }
    } catch (err) {
      console.error('Error updating category:', err);
      setError(err.message || 'Failed to update category');
    } finally {
      setIsSaving(false);
    }
  };

  // Handle input change in edit modal
  const handleEditInputChange = (field, value) => {
    if (editCategoryModal) {
      setEditCategoryModal({
        ...editCategoryModal,
        [field]: value
      });
    }
  };

  const closeEditModal = () => {
    setEditCategoryModal(null);
  };

  const handleBack = () => {
    if (onNavigate) {
      onNavigate('masterMenu');
    } else if (onBack) {
      onBack();
    }
  };

  const handleAdd = () => {
    if (onAddCategory) {
      onAddCategory();
    } else if (onNavigate) {
      onNavigate('addCategory');
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

  // Filter categories based on search
  const filtered = categories.filter((c) => {
    const q = searchQuery.toLowerCase();
    const matchesSearch =
      c.main?.toLowerCase().includes(q) ||
      c.sub?.toLowerCase().includes(q) ||
      c.common?.toLowerCase().includes(q);
    return matchesSearch;
  });

  return (
    <div className="dashboard-container">
      {/* Sidebar */}
      <nav className="sidebar-nav">
        <div className="nav-item" onClick={handleBack}>
          <div className="nav-icon">
            <i className="fas fa-home"></i>
          </div>
          <span>Home</span>
        </div>
        {userRole === 'admin' && (
          <div className="nav-item" onClick={() => onNavigate && onNavigate('users')}>
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
        <div className="nav-item active" onClick={() => onNavigate && onNavigate('masterMenu')}>
          <div className="nav-icon">
            <i className="fas fa-th-large"></i>
          </div>
          <span>Master Menu</span>
        </div>
        <div className="nav-item" onClick={() => onNavigate && onNavigate('transactionMenu')}>
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

      {/* Main */}
      <div className="dashboard-main">
        <div className="products-container">
          {/* Header */}
          <header className="products-header">
            <button className="back-btn" onClick={handleBack}>
              <i className="fas fa-arrow-left"></i>
            </button>
            <div className="header-content">
              <h1 className="page-title">Category Master</h1>
              <p className="page-subtitle">Manage product categories</p>
            </div>
          </header>

          {/* Content */}
          <main className="products-content">
            <div className="products-top-section">
              <div className="tab-indicator">
                <span className="tab-dot"></span>
                <span className="tab-label">CATEGORY MASTER</span>
              </div>
            </div>

            <div className="products-heading">
              <h2>Categories</h2>
              <p>Manage and organize product categories with Main, Sub, and Common classifications.</p>
            </div>

            {/* Search and Add Button */}
            <div className="products-controls">
              <div className="products-search-bar">
                <i className="fas fa-search"></i>
                <input
                  type="text"
                  placeholder="Search categories..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <button className="add-product-btn" onClick={handleAdd}>
                <i className="fas fa-plus"></i>
                <span>Add Category</span>
              </button>
            </div>

            {/* Results Count */}
            <div className="products-count">
              {`Showing ${filtered.length} category${filtered.length !== 1 ? 'ies' : 'y'}`}
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

            {/* Categories List */}
            <div className="staff-list-container" style={{ padding: '0 24px 24px' }}>
              {filtered.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '60px 40px', color: '#666' }}>
                  <i className="fas fa-tags" style={{ fontSize: '64px', marginBottom: '20px', opacity: 0.4, color: '#dc3545' }}></i>
                  <h3 style={{ fontSize: '18px', fontWeight: '600', color: '#333', marginBottom: '8px' }}>No Categories Available</h3>
                  <p style={{ fontSize: '14px', color: '#666' }}>Categories will appear here once created.</p>
                </div>
              ) : (
                <div className="premium-cards-grid">
                  {filtered.map((category) => (
                    <div
                      key={category.id}
                      className="premium-identity-card"
                    >
                      {/* Card Header */}
                      <div className="premium-card-header">
                        <div className="premium-header-content">
                          <h3 className="premium-worker-name">{category.main || 'N/A'}</h3>
                        </div>
                        {/* Floating Three-Dot Menu */}
                        <div 
                          className="premium-card-menu" 
                          ref={el => menuRefs.current[category.id] = el}
                        >
                          <button 
                            className="premium-menu-trigger"
                            onClick={(e) => toggleMenu(category.id, e)}
                          >
                            <i className="fas fa-ellipsis-v"></i>
                          </button>
                          {openMenuId === category.id && (
                            <div className="premium-menu-dropdown">
                              <div className="premium-menu-item" onClick={() => handleViewCategory(category)}>
                                <i className="fas fa-eye"></i>
                                <span>View</span>
                              </div>
                              <div className="premium-menu-item" onClick={() => handleEditCategory(category)}>
                                <i className="fas fa-edit"></i>
                                <span>Edit</span>
                              </div>
                              <div className="premium-menu-item premium-menu-item-danger" onClick={() => handleDeleteCategory(category)}>
                                <i className="fas fa-trash"></i>
                                <span>Delete</span>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Card Body - Two Column Layout */}
                      <div className="premium-card-body">
                        <div className="premium-info-row">
                          <div className="premium-info-item">
                            <div className="premium-info-icon">
                              <i className="fas fa-layer-group"></i>
                            </div>
                            <div className="premium-info-content">
                              <span className="premium-info-label">Sub Category</span>
                              <span className="premium-info-value">{category.sub || 'N/A'}</span>
                            </div>
                          </div>
                          <div className="premium-info-item">
                            <div className="premium-info-icon">
                              <i className="fas fa-tags"></i>
                            </div>
                            <div className="premium-info-content">
                              <span className="premium-info-label">Common Category</span>
                              <span className="premium-info-value">{category.common || 'N/A'}</span>
                            </div>
                          </div>
                        </div>
                        {category.city && (
                          <div className="premium-info-row" style={{ marginTop: '16px' }}>
                            <div className="premium-info-item">
                              <div className="premium-info-icon">
                                <i className="fas fa-map-marker-alt"></i>
                              </div>
                              <div className="premium-info-content">
                                <span className="premium-info-label">City</span>
                                <span className="premium-info-value">{category.city || 'N/A'}</span>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </main>
        </div>
      </div>

      {/* Confirmation Dialog */}
      <ConfirmDialog
        open={confirmState.open}
        title="Delete Category"
        message={confirmState.message}
        onConfirm={confirmState.onConfirm}
        onCancel={() => setConfirmState({ open: false, message: '', onConfirm: null, category: null })}
        confirmText="Delete"
        cancelText="Cancel"
      />

      {/* Edit Category Details Modal */}
      {editCategoryModal && (
        <div className="modal-overlay" onClick={closeEditModal}>
          <div className="customer-details-modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '600px', width: '90%' }}>
            <div className="modal-header">
              <h2>Edit Category Details</h2>
              <button className="modal-close-btn" onClick={closeEditModal}>
                <i className="fas fa-times"></i>
              </button>
            </div>
            <div className="modal-content" style={{ padding: '20px' }}>
              <div className="customer-detail-section">
                <div className="detail-info" style={{ width: '100%' }}>
                  <div className="detail-row" style={{ marginBottom: '16px' }}>
                    <span className="detail-label" style={{ minWidth: '140px', marginRight: '12px' }}>Main Category:</span>
                    <input
                      type="text"
                      value={editCategoryModal.main || ''}
                      onChange={(e) => handleEditInputChange('main', e.target.value)}
                      style={{
                        padding: '8px 12px',
                        border: '1px solid #ddd',
                        borderRadius: '4px',
                        fontSize: '14px',
                        width: '100%',
                        maxWidth: '300px'
                      }}
                    />
                  </div>
                  <div className="detail-row" style={{ marginBottom: '16px' }}>
                    <span className="detail-label" style={{ minWidth: '140px', marginRight: '12px' }}>Sub Category:</span>
                    <input
                      type="text"
                      value={editCategoryModal.sub || ''}
                      onChange={(e) => handleEditInputChange('sub', e.target.value)}
                      style={{
                        padding: '8px 12px',
                        border: '1px solid #ddd',
                        borderRadius: '4px',
                        fontSize: '14px',
                        width: '100%',
                        maxWidth: '300px'
                      }}
                    />
                  </div>
                  <div className="detail-row" style={{ marginBottom: '16px' }}>
                    <span className="detail-label" style={{ minWidth: '140px', marginRight: '12px' }}>Common Category:</span>
                    <input
                      type="text"
                      value={editCategoryModal.common || ''}
                      onChange={(e) => handleEditInputChange('common', e.target.value)}
                      style={{
                        padding: '8px 12px',
                        border: '1px solid #ddd',
                        borderRadius: '4px',
                        fontSize: '14px',
                        width: '100%',
                        maxWidth: '300px'
                      }}
                    />
                  </div>
                  <div className="detail-row" style={{ marginBottom: '16px' }}>
                    <span className="detail-label" style={{ minWidth: '140px', marginRight: '12px' }}>City:</span>
                    <input
                      type="text"
                      value={editCategoryModal.city || ''}
                      onChange={(e) => handleEditInputChange('city', e.target.value)}
                      placeholder="Optional"
                      style={{
                        padding: '8px 12px',
                        border: '1px solid #ddd',
                        borderRadius: '4px',
                        fontSize: '14px',
                        width: '100%',
                        maxWidth: '300px'
                      }}
                    />
                  </div>
                </div>
              </div>
            </div>
            <div className="modal-footer" style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', padding: '20px' }}>
              <button 
                className="modal-close-button" 
                onClick={closeEditModal}
                style={{ background: '#6c757d', color: '#fff' }}
              >
                Cancel
              </button>
              <button 
                className="modal-close-button" 
                onClick={handleSaveCategoryDetails}
                disabled={isSaving}
                style={{ 
                  background: '#dc3545', 
                  color: '#fff',
                  opacity: isSaving ? 0.6 : 1,
                  cursor: isSaving ? 'not-allowed' : 'pointer'
                }}
              >
                {isSaving ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* View Category Details Modal */}
      {showViewModal && selectedCategory && (
        <div className="modal-overlay" onClick={() => setShowViewModal(false)}>
          <div className="customer-details-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Category Details</h2>
              <button className="modal-close-btn" onClick={() => setShowViewModal(false)}>
                <i className="fas fa-times"></i>
              </button>
            </div>
            <div className="modal-content">
              <div className="customer-detail-section">
                <div className="detail-info">
                  <div className="detail-row">
                    <span className="detail-label">Main Category:</span>
                    <span className="detail-value">{selectedCategory.main || 'N/A'}</span>
                  </div>
                  <div className="detail-row">
                    <span className="detail-label">Sub Category:</span>
                    <span className="detail-value">{selectedCategory.sub || 'N/A'}</span>
                  </div>
                  <div className="detail-row">
                    <span className="detail-label">Common Category:</span>
                    <span className="detail-value">{selectedCategory.common || 'N/A'}</span>
                  </div>
                  {selectedCategory.city && (
                    <div className="detail-row">
                      <span className="detail-label">City:</span>
                      <span className="detail-value">{selectedCategory.city}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button className="modal-close-button" onClick={() => setShowViewModal(false)}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CategoryMaster;

