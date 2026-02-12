import React, { useState, useEffect } from 'react';
import { storesAPI, profileAPI } from '../services/api';
import ConfirmDialog from './ConfirmDialog';
import Toast from './Toast';

const StoreAccess = ({ onClose, onNavigate, onProfileUpdate }) => {
  const [stores, setStores] = useState([]);
  const [selectedStores, setSelectedStores] = useState([]);
  const [storeScope, setStoreScope] = useState('All stores • Global scope');
  const [primaryStore, setPrimaryStore] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [confirmState, setConfirmState] = useState({ open: false, message: '', onConfirm: null });

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch all stores
        const storesResponse = await storesAPI.getAll();
        if (storesResponse.success) {
          setStores(storesResponse.stores);
        }

        // Fetch current profile
        const profileResponse = await profileAPI.get();
        if (profileResponse.success) {
          const profile = profileResponse.profile;
          setStoreScope(profile.store_scope || 'All stores • Global scope');
          setPrimaryStore(profile.primary_store || '');
          
          // Parse selected stores if exists
          if (profile.selected_stores) {
            try {
              const parsed = JSON.parse(profile.selected_stores);
              setSelectedStores(Array.isArray(parsed) ? parsed : []);
            } catch (e) {
              setSelectedStores([]);
            }
          } else {
            setSelectedStores([]);
          }
        }
      } catch (err) {
        console.error('Error fetching data:', err);
        setError('Failed to load stores. Please try again.');
      }
    };

    fetchData();
  }, []);

  const handleStoreScopeChange = (scope) => {
    setStoreScope(scope);
    if (scope === 'All stores • Global scope') {
      setSelectedStores([]);
    }
  };

  const handleStoreToggle = (storeId) => {
    if (storeScope === 'All stores • Global scope') {
      setStoreScope('Selected stores');
    }
    
    setSelectedStores(prev => {
      if (prev.includes(storeId)) {
        return prev.filter(id => id !== storeId);
      } else {
        return [...prev, storeId];
      }
    });
  };

  const handleSelectAll = () => {
    if (selectedStores.length === stores.length) {
      setSelectedStores([]);
      setStoreScope('All stores • Global scope');
    } else {
      setSelectedStores(stores.map(store => store.id));
      setStoreScope('Selected stores');
    }
  };

  const saveStoreAccess = async () => {
    setIsSaving(true);
    setError('');
    setSuccessMessage('');

    try {
      const updateData = {
        storeScope: storeScope,
        selectedStores: storeScope === 'All stores • Global scope' ? [] : selectedStores
      };

      if (primaryStore) {
        updateData.primaryStore = primaryStore;
      }

      const response = await profileAPI.update(updateData);

      if (response.success) {
        setSuccessMessage('Store access updated successfully');
        // Refresh profile if callback provided
        if (onProfileUpdate) {
          onProfileUpdate();
        }
        setTimeout(() => {
          setSuccessMessage('');
          if (onClose) onClose();
        }, 2000);
      } else {
        setError(response.error || 'Failed to update store access. Please try again.');
      }
    } catch (err) {
      console.error('Update store access error:', err);
      setError(err.message || 'Failed to update store access. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleSave = () => {
    setConfirmState({
      open: true,
      message: 'Are you sure you want to save store access changes?',
      onConfirm: saveStoreAccess,
    });
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(0, 0, 0, 0.5)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000
    }} onClick={onClose}>
      <div style={{
        background: '#fff',
        borderRadius: '12px',
        padding: '24px',
        maxWidth: '600px',
        width: '90%',
        maxHeight: '90vh',
        overflowY: 'auto',
        boxShadow: '0 10px 40px rgba(0,0,0,0.2)'
      }} onClick={(e) => e.stopPropagation()}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h3 style={{ margin: 0, color: '#333', fontSize: '18px', fontWeight: '700' }}>
            Store Access Management
          </h3>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              fontSize: '20px',
              cursor: 'pointer',
              color: '#666',
              padding: '0',
              width: '30px',
              height: '30px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <i className="fas fa-times"></i>
          </button>
        </div>

        <Toast message={error} type="error" onClose={() => setError('')} />
        <Toast message={successMessage} type="success" onClose={() => setSuccessMessage('')} />

        {/* Store Scope Selection */}
        <div style={{ marginBottom: '24px' }}>
          <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '600', color: '#333' }}>
            Store Scope
          </label>
          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
            <button
              type="button"
              onClick={() => handleStoreScopeChange('All stores • Global scope')}
              style={{
                padding: '10px 20px',
                background: storeScope === 'All stores • Global scope' ? '#dc3545' : '#f0f0f0',
                color: storeScope === 'All stores • Global scope' ? '#fff' : '#333',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
                fontSize: '13px',
                fontWeight: '600',
                transition: 'all 0.3s ease'
              }}
            >
              All Stores
            </button>
            <button
              type="button"
              onClick={() => handleStoreScopeChange('Selected stores')}
              style={{
                padding: '10px 20px',
                background: storeScope === 'Selected stores' ? '#dc3545' : '#f0f0f0',
                color: storeScope === 'Selected stores' ? '#fff' : '#333',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
                fontSize: '13px',
                fontWeight: '600',
                transition: 'all 0.3s ease'
              }}
            >
              Selected Stores
            </button>
          </div>
        </div>

        {/* Primary Store Selection */}
        {storeScope === 'Selected stores' && (
          <div style={{ marginBottom: '24px' }}>
            <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '600', color: '#333' }}>
              Primary Store
            </label>
            <select
              value={primaryStore}
              onChange={(e) => setPrimaryStore(e.target.value)}
              style={{
                width: '100%',
                padding: '10px',
                border: '2px solid #f0f0f0',
                borderRadius: '8px',
                fontSize: '13px'
              }}
            >
              <option value="">Select Primary Store</option>
              {stores.filter(store => selectedStores.includes(store.id)).map(store => (
                <option key={store.id} value={store.store_name}>
                  {store.store_name} ({store.city})
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Store List */}
        {storeScope === 'Selected stores' && (
          <div style={{ marginBottom: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
              <label style={{ fontSize: '14px', fontWeight: '600', color: '#333' }}>
                Select Stores ({selectedStores.length} selected)
              </label>
              <button
                type="button"
                onClick={handleSelectAll}
                style={{
                  padding: '6px 12px',
                  background: '#f0f0f0',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: '12px',
                  fontWeight: '600',
                  color: '#333'
                }}
              >
                {selectedStores.length === stores.length ? 'Deselect All' : 'Select All'}
              </button>
            </div>
            
            <div style={{ 
              maxHeight: '300px', 
              overflowY: 'auto',
              border: '2px solid #f0f0f0',
              borderRadius: '8px',
              padding: '12px'
            }}>
              {stores.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '20px', color: '#666' }}>
                  <i className="fas fa-store" style={{ fontSize: '32px', marginBottom: '8px', opacity: 0.4 }}></i>
                  <p>No stores available</p>
                </div>
              ) : (
                stores.map(store => (
                  <div
                    key={store.id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      padding: '12px',
                      marginBottom: '8px',
                      background: selectedStores.includes(store.id) ? '#fff5f5' : '#fff',
                      border: selectedStores.includes(store.id) ? '2px solid #dc3545' : '2px solid #f0f0f0',
                      borderRadius: '8px',
                      cursor: 'pointer',
                      transition: 'all 0.3s ease'
                    }}
                    onClick={() => handleStoreToggle(store.id)}
                  >
                    <input
                      type="checkbox"
                      checked={selectedStores.includes(store.id)}
                      onChange={() => handleStoreToggle(store.id)}
                      style={{
                        marginRight: '12px',
                        width: '18px',
                        height: '18px',
                        cursor: 'pointer'
                      }}
                    />
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: '600', color: '#333', marginBottom: '4px' }}>
                        {store.store_name}
                      </div>
                      <div style={{ fontSize: '12px', color: '#666' }}>
                        {store.city}, {store.state} • {store.store_code}
                      </div>
                      {store.status && (
                        <div style={{ fontSize: '11px', color: store.status === 'Active' ? '#28a745' : '#dc3545', marginTop: '4px' }}>
                          {store.status}
                        </div>
                      )}
                    </div>
                    {selectedStores.includes(store.id) && (
                      <i className="fas fa-check-circle" style={{ color: '#dc3545', fontSize: '18px' }}></i>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* Info Message for All Stores */}
        {storeScope === 'All stores • Global scope' && (
          <div style={{
            padding: '16px',
            background: '#e7f3ff',
            borderRadius: '8px',
            marginBottom: '24px',
            fontSize: '13px',
            color: '#004085'
          }}>
            <i className="fas fa-info-circle" style={{ marginRight: '8px' }}></i>
            Admin will have access to all stores in the system.
          </div>
        )}

        {/* Action Buttons */}
        <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '24px' }}>
          <button
            type="button"
            onClick={onClose}
            style={{
              padding: '10px 20px',
              background: '#f0f0f0',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: '600',
              color: '#333'
            }}
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={isSaving || (storeScope === 'Selected stores' && selectedStores.length === 0)}
            style={{
              padding: '10px 20px',
              background: '#dc3545',
              border: 'none',
              borderRadius: '8px',
              cursor: isSaving || (storeScope === 'Selected stores' && selectedStores.length === 0) ? 'not-allowed' : 'pointer',
              fontSize: '14px',
              fontWeight: '700',
              color: '#fff',
              opacity: isSaving || (storeScope === 'Selected stores' && selectedStores.length === 0) ? 0.7 : 1
            }}
          >
            {isSaving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </div>

      <ConfirmDialog
        isOpen={confirmState.open}
        title="Confirm Changes"
        message={confirmState.message}
        confirmText="Yes, Save"
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

export default StoreAccess;

