import React, { useState, useEffect } from 'react';
import { adminAPI } from '../services/api';
import './staffAttendanceView.css';

const TABLE_LABELS = {
  attendance:            { label: 'Staff Attendance (Face Photos)', icon: 'fa-camera', group: 'images' },
  supervisor_attendance: { label: 'Supervisor Attendance (Face Photos)', icon: 'fa-camera', group: 'images' },
  stock_transactions:    { label: 'Stock Transactions', icon: 'fa-exchange-alt', group: 'transactions' },
  notifications:         { label: 'Notifications', icon: 'fa-bell', group: 'transactions' },
  sales_records:         { label: 'Sales Records', icon: 'fa-chart-line', group: 'transactions' },
  purchase_orders:       { label: 'Purchase Orders', icon: 'fa-shopping-cart', group: 'transactions' },
  quotations:            { label: 'Quotations', icon: 'fa-file-invoice', group: 'transactions' },
  payments:              { label: 'Payments', icon: 'fa-money-bill-wave', group: 'transactions' },
  products:              { label: 'Products', icon: 'fa-box', group: 'master' },
  customers:             { label: 'Customers', icon: 'fa-users', group: 'master' },
  chit_customers:        { label: 'Chit Customers', icon: 'fa-user-check', group: 'master' },
  staff:                 { label: 'Staff Accounts', icon: 'fa-id-badge', group: 'master' },
  users:                 { label: 'Supervisor Accounts', icon: 'fa-user-tie', group: 'master' },
  suppliers:             { label: 'Suppliers', icon: 'fa-truck', group: 'master' },
  dispatch:              { label: 'Dispatch Records', icon: 'fa-shipping-fast', group: 'master' },
  transport:             { label: 'Transport Partners', icon: 'fa-truck-moving', group: 'master' },
  categories:            { label: 'Categories', icon: 'fa-tags', group: 'master' },
  services:              { label: 'Service Records', icon: 'fa-tools', group: 'master' },
  chit_plans:            { label: 'Chit Plans', icon: 'fa-list-alt', group: 'master' },
  stores:                { label: 'Stores', icon: 'fa-store', group: 'master' },
};

const GROUP_COLORS = {
  images:       { bg: '#fff3f3', border: '#dc3545', text: '#dc3545', badge: '#dc3545' },
  transactions: { bg: '#fff8e1', border: '#f39c12', text: '#e67e22', badge: '#f39c12' },
  master:       { bg: '#f0f7ff', border: '#3498db', text: '#2980b9', badge: '#3498db' },
};

const formatBytes = (bytes) => {
  if (!bytes || bytes === 0) return '0 B';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / 1024 / 1024).toFixed(2)} MB`;
  return `${(bytes / 1024 / 1024 / 1024).toFixed(2)} GB`;
};

const pct = (bytes, total) => {
  if (!total || total === 0) return 0;
  return Math.max(0.5, Math.min(100, (bytes / total) * 100));
};

const StorageStats = ({ onBack }) => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [lastRefresh, setLastRefresh] = useState(null);

  const fetchStats = async () => {
    try {
      setLoading(true);
      setError('');
      const data = await adminAPI.getStorageStats();
      if (data.success) {
        setStats(data);
        setLastRefresh(new Date());
      } else {
        setError(data.error || 'Failed to load storage stats');
      }
    } catch (err) {
      setError(err.message || 'Failed to connect to server');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchStats(); }, []);

  const totalBytes = stats?.database?.total_bytes || 1;

  const topTables = stats?.tables?.slice(0, 15) || [];

  const imagesMB = (
    parseFloat(stats?.image_stats?.staff_attendance?.total_images_mb || 0) +
    parseFloat(stats?.image_stats?.supervisor_attendance?.total_images_mb || 0)
  ).toFixed(1);

  const imagesBytes = parseFloat(imagesMB) * 1024 * 1024;
  const imagesPct = pct(imagesBytes, totalBytes).toFixed(1);

  return (
    <div className="products-container">
      <header className="products-header">
        <button className="back-btn" onClick={onBack}>
          <i className="fas fa-arrow-left"></i>
        </button>
        <div className="header-content">
          <h1 className="products-title">Database Storage</h1>
          <p className="products-subtitle">Live usage breakdown from your actual database</p>
        </div>
        <button
          onClick={fetchStats}
          style={{ marginLeft: 'auto', padding: '8px 16px', background: '#dc3545', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '6px' }}
        >
          <i className={`fas fa-sync-alt ${loading ? 'fa-spin' : ''}`}></i>
          Refresh
        </button>
      </header>

      <div style={{ padding: '20px' }}>
        {error && (
          <div style={{ background: '#fff3f3', border: '1px solid #dc3545', borderRadius: '10px', padding: '16px', marginBottom: '20px', color: '#dc3545' }}>
            <i className="fas fa-exclamation-circle" style={{ marginRight: '8px' }}></i>
            {error}
          </div>
        )}

        {loading && !stats && (
          <div style={{ textAlign: 'center', padding: '60px', color: '#888' }}>
            <i className="fas fa-spinner fa-spin" style={{ fontSize: '32px', marginBottom: '12px', display: 'block' }}></i>
            Loading live database stats...
          </div>
        )}

        {stats && (
          <>
            {/* Total size card */}
            <div style={{ background: 'linear-gradient(135deg, #dc3545 0%, #c0392b 100%)', borderRadius: '14px', padding: '24px', color: '#fff', marginBottom: '20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
              <div>
                <div style={{ fontSize: '13px', opacity: 0.85, marginBottom: '4px' }}>Total Database Size</div>
                <div style={{ fontSize: '36px', fontWeight: '700', letterSpacing: '-1px' }}>{stats.database.total_size}</div>
                {lastRefresh && (
                  <div style={{ fontSize: '11px', opacity: 0.7, marginTop: '4px' }}>
                    Last updated: {lastRefresh.toLocaleTimeString()}
                  </div>
                )}
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: '13px', opacity: 0.85 }}>Face Photos</div>
                <div style={{ fontSize: '22px', fontWeight: '700' }}>{imagesMB} MB</div>
                <div style={{ fontSize: '11px', opacity: 0.7 }}>{imagesPct}% of total</div>
              </div>
            </div>

            {/* Quick stats row */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: '12px', marginBottom: '24px' }}>
              {[
                { label: 'Staff', value: stats.row_counts.staff_rows, icon: 'fa-id-badge', color: '#3498db' },
                { label: 'Supervisors', value: stats.row_counts.supervisor_rows, icon: 'fa-user-tie', color: '#9b59b6' },
                { label: 'Products', value: stats.row_counts.product_rows, icon: 'fa-box', color: '#27ae60' },
                { label: 'Customers', value: stats.row_counts.customer_rows, icon: 'fa-users', color: '#f39c12' },
                { label: 'Attendance Records', value: parseInt(stats.row_counts.attendance_rows) + parseInt(stats.row_counts.supervisor_attendance_rows), icon: 'fa-camera', color: '#dc3545' },
                { label: 'Stock Transactions', value: stats.row_counts.stock_transaction_rows, icon: 'fa-exchange-alt', color: '#e67e22' },
                { label: 'Sales Records', value: stats.row_counts.sales_rows, icon: 'fa-chart-line', color: '#16a085' },
                { label: 'Notifications', value: stats.row_counts.notification_rows, icon: 'fa-bell', color: '#7f8c8d' },
              ].map((item) => (
                <div key={item.label} style={{ background: 'var(--card-bg, #fff)', border: '1px solid var(--border-color, #eee)', borderRadius: '10px', padding: '14px', textAlign: 'center' }}>
                  <i className={`fas ${item.icon}`} style={{ color: item.color, fontSize: '20px', marginBottom: '6px', display: 'block' }}></i>
                  <div style={{ fontSize: '20px', fontWeight: '700', color: 'var(--text-primary, #222)' }}>
                    {parseInt(item.value || 0).toLocaleString()}
                  </div>
                  <div style={{ fontSize: '11px', color: 'var(--text-secondary, #888)', marginTop: '2px' }}>{item.label}</div>
                </div>
              ))}
            </div>

            {/* Attendance image detail */}
            <div style={{ background: '#fff3f3', border: '1px solid #f5c6cb', borderRadius: '12px', padding: '16px', marginBottom: '20px' }}>
              <div style={{ fontWeight: '600', color: '#dc3545', marginBottom: '12px', fontSize: '14px' }}>
                <i className="fas fa-camera" style={{ marginRight: '8px' }}></i>
                Face Photo Storage Detail
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <div style={{ fontSize: '12px', color: '#666', marginBottom: '4px' }}>Staff Attendance</div>
                  <div style={{ fontWeight: '700', fontSize: '18px', color: '#dc3545' }}>
                    {stats.image_stats.staff_attendance.total_images_mb} MB
                  </div>
                  <div style={{ fontSize: '11px', color: '#888' }}>
                    {parseInt(stats.image_stats.staff_attendance.records_with_checkin_image || 0).toLocaleString()} check-in photos
                    &nbsp;·&nbsp;
                    {parseInt(stats.image_stats.staff_attendance.records_with_checkout_image || 0).toLocaleString()} check-out photos
                  </div>
                  <div style={{ fontSize: '11px', color: '#888', marginTop: '2px' }}>
                    Avg: {stats.image_stats.staff_attendance.avg_checkin_image_kb} KB per photo
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: '12px', color: '#666', marginBottom: '4px' }}>Supervisor Attendance</div>
                  <div style={{ fontWeight: '700', fontSize: '18px', color: '#e74c3c' }}>
                    {stats.image_stats.supervisor_attendance.total_images_mb} MB
                  </div>
                  <div style={{ fontSize: '11px', color: '#888' }}>
                    {parseInt(stats.image_stats.supervisor_attendance.records_with_checkin_image || 0).toLocaleString()} check-in photos
                    &nbsp;·&nbsp;
                    {parseInt(stats.image_stats.supervisor_attendance.records_with_checkout_image || 0).toLocaleString()} check-out photos
                  </div>
                </div>
              </div>
            </div>

            {/* Per-table breakdown */}
            <div style={{ background: 'var(--card-bg, #fff)', border: '1px solid var(--border-color, #eee)', borderRadius: '12px', overflow: 'hidden', marginBottom: '20px' }}>
              <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border-color, #eee)', fontWeight: '600', fontSize: '14px', color: 'var(--text-primary, #222)' }}>
                <i className="fas fa-table" style={{ marginRight: '8px', color: '#dc3545' }}></i>
                All Tables — Storage Used
              </div>
              {topTables.map((table) => {
                const meta = TABLE_LABELS[table.table_name] || { label: table.table_name, icon: 'fa-database', group: 'master' };
                const color = GROUP_COLORS[meta.group] || GROUP_COLORS.master;
                const barWidth = pct(table.total_bytes, totalBytes);
                return (
                  <div key={table.table_name} style={{ padding: '12px 20px', borderBottom: '1px solid var(--border-color, #f0f0f0)', display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: color.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <i className={`fas ${meta.icon}`} style={{ color: color.text, fontSize: '13px' }}></i>
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                        <span style={{ fontSize: '13px', fontWeight: '500', color: 'var(--text-primary, #222)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {meta.label}
                        </span>
                        <span style={{ fontSize: '13px', fontWeight: '700', color: color.text, marginLeft: '8px', flexShrink: 0 }}>
                          {table.total_size}
                        </span>
                      </div>
                      <div style={{ background: 'var(--border-color, #eee)', borderRadius: '4px', height: '6px', overflow: 'hidden' }}>
                        <div style={{ width: `${barWidth}%`, height: '100%', background: color.badge, borderRadius: '4px', transition: 'width 0.6s ease' }}></div>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '3px' }}>
                        <span style={{ fontSize: '11px', color: '#999' }}>
                          {parseInt(table.row_count || 0).toLocaleString()} rows
                        </span>
                        <span style={{ fontSize: '11px', color: '#999' }}>
                          {barWidth.toFixed(1)}% · index: {table.index_size}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Legend */}
            <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', padding: '0 4px', marginBottom: '20px' }}>
              {[
                { color: '#dc3545', label: 'Face Photo Tables (biggest impact)' },
                { color: '#f39c12', label: 'Transaction Tables (grow daily)' },
                { color: '#3498db', label: 'Master / Reference Tables (slow growth)' },
              ].map((l) => (
                <div key={l.label} style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: 'var(--text-secondary, #666)' }}>
                  <div style={{ width: '10px', height: '10px', borderRadius: '3px', background: l.color, flexShrink: 0 }}></div>
                  {l.label}
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default StorageStats;
