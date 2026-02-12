import React, { useState, useEffect } from 'react';
import { exportAPI } from '../services/api';
import { downloadCSV } from '../utils/fileDownload';
import Toast from './Toast';
import './staffAttendanceView.css';

const StockPerformanceReportView = ({ onClose }) => {
  const [performance, setPerformance] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isExporting, setIsExporting] = useState(false);
  const [viewMode, setViewMode] = useState('revenue');

  useEffect(() => {
    fetchStockPerformance();
  }, []);

  const fetchStockPerformance = async () => {
    setLoading(true);
    setError('');
    try {
      const today = new Date().toISOString().split('T')[0];
      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
      const response = await exportAPI.getStockPerformance(thirtyDaysAgo, today);
      if (response && response.success) {
        setPerformance(response.performance || []);
      } else {
        setPerformance([]);
      }
    } catch (err) {
      console.error('Error fetching stock performance:', err);
      setPerformance([]);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount) => {
    if (!amount) return '₹0';
    const num = parseFloat(amount);
    if (num >= 100000) return `₹${(num / 100000).toFixed(1)}L`;
    if (num >= 1000) return `₹${(num / 1000).toFixed(1)}K`;
    return `₹${num.toFixed(0)}`;
  };

  const convertToCSV = (data) => {
    if (!data || data.length === 0) return 'No data available\n';
    const headers = ['Rank', 'Product Name', 'Category', 'Total Sold', 'Total Revenue', 'Average Sale Price'];
    const csvRows = [headers.join(',')];
    data.forEach((item, index) => {
      const row = [
        index + 1,
        `"${(item.product_name || '').replace(/"/g, '""')}"`,
        `"${(item.category || '').replace(/"/g, '""')}"`,
        item.total_sold || 0,
        item.total_revenue || 0,
        item.average_price || 0
      ];
      csvRows.push(row.join(','));
    });
    return csvRows.join('\n');
  };

  const handleExportCSV = async () => {
    try {
      setIsExporting(true);
      const csvContent = convertToCSV(performance);
      const filename = `stock_performance_report.csv`;
      await downloadCSV(csvContent, filename);
    } catch (err) {
      console.error('Error exporting CSV:', err);
      setError(err.message || 'Failed to export CSV.');
    } finally {
      setIsExporting(false);
    }
  };

  // Get top 10 products for chart
  const topProducts = performance.slice(0, 10);
  const maxValue = topProducts.length > 0
    ? Math.max(...topProducts.map(p => viewMode === 'revenue' ? parseFloat(p.total_revenue || 0) : parseInt(p.total_sold || 0)))
    : 100;

  // Summary stats
  const totalProducts = performance.length;
  const totalSold = performance.reduce((sum, item) => sum + (parseInt(item.total_sold) || 0), 0);
  const totalRevenue = performance.reduce((sum, item) => sum + (parseFloat(item.total_revenue) || 0), 0);
  const avgPrice = totalSold > 0 ? totalRevenue / totalSold : 0;

  // Category breakdown
  const categoryMap = {};
  performance.forEach(item => {
    const cat = item.category || 'Uncategorized';
    if (!categoryMap[cat]) categoryMap[cat] = { sold: 0, revenue: 0, count: 0 };
    categoryMap[cat].sold += parseInt(item.total_sold) || 0;
    categoryMap[cat].revenue += parseFloat(item.total_revenue) || 0;
    categoryMap[cat].count += 1;
  });
  const categories = Object.entries(categoryMap)
    .sort((a, b) => b[1].revenue - a[1].revenue)
    .slice(0, 6);
  const maxCatRevenue = categories.length > 0 ? Math.max(...categories.map(c => c[1].revenue)) : 100;

  const barColors = ['#dc3545', '#e74c5e', '#f06272', '#f57f8e', '#f99ca8', '#fdb9c2', '#fdd6da', '#fee3e6', '#fff0f1', '#fff8f8'];
  const catColors = ['#dc3545', '#2196F3', '#4caf50', '#ff9800', '#9c27b0', '#00bcd4'];

  return (
    <div>
      <Toast message={error} type="error" onClose={() => setError('')} />

      {loading ? (
        <div style={{ textAlign: 'center', padding: '40px' }}>
          <i className="fas fa-spinner fa-spin" style={{ fontSize: '24px', color: '#dc3545' }}></i>
          <p>Loading stock performance...</p>
        </div>
      ) : (
        <>
          {/* Summary Cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '12px', marginBottom: '24px' }}>
            <div style={{ background: 'linear-gradient(135deg, #dc3545, #c82333)', padding: '16px', borderRadius: '12px', color: '#fff' }}>
              <div style={{ fontSize: '12px', opacity: 0.85, marginBottom: '4px' }}>Total Products</div>
              <div style={{ fontSize: '28px', fontWeight: '800' }}>{totalProducts}</div>
            </div>
            <div style={{ background: 'linear-gradient(135deg, #9c27b0, #7b1fa2)', padding: '16px', borderRadius: '12px', color: '#fff' }}>
              <div style={{ fontSize: '12px', opacity: 0.85, marginBottom: '4px' }}>Qty Sold</div>
              <div style={{ fontSize: '28px', fontWeight: '800' }}>{totalSold.toLocaleString()}</div>
            </div>
            <div style={{ background: 'linear-gradient(135deg, #4caf50, #388e3c)', padding: '16px', borderRadius: '12px', color: '#fff' }}>
              <div style={{ fontSize: '12px', opacity: 0.85, marginBottom: '4px' }}>Total Revenue</div>
              <div style={{ fontSize: '28px', fontWeight: '800' }}>{formatCurrency(totalRevenue)}</div>
            </div>
            <div style={{ background: 'linear-gradient(135deg, #2196F3, #1976D2)', padding: '16px', borderRadius: '12px', color: '#fff' }}>
              <div style={{ fontSize: '12px', opacity: 0.85, marginBottom: '4px' }}>Avg Price</div>
              <div style={{ fontSize: '28px', fontWeight: '800' }}>{formatCurrency(avgPrice)}</div>
            </div>
          </div>

          {/* Top Products Bar Chart */}
          <div style={{ background: '#fff', border: '1px solid #eee', borderRadius: '12px', padding: '20px', marginBottom: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '10px' }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '16px', fontWeight: '700', color: '#333' }}>
                  <i className="fas fa-chart-bar" style={{ color: '#dc3545', marginRight: '8px' }}></i>
                  Top {topProducts.length} Products
                </h3>
                <p style={{ margin: '4px 0 0', fontSize: '12px', color: '#888' }}>Last 30 days performance</p>
              </div>
              <div style={{ display: 'flex', gap: '4px', background: '#f5f5f5', borderRadius: '8px', padding: '3px' }}>
                <button
                  onClick={() => setViewMode('revenue')}
                  style={{
                    padding: '6px 14px', border: 'none', borderRadius: '6px', fontSize: '12px', fontWeight: '600', cursor: 'pointer',
                    background: viewMode === 'revenue' ? '#dc3545' : 'transparent',
                    color: viewMode === 'revenue' ? '#fff' : '#666'
                  }}
                >Revenue</button>
                <button
                  onClick={() => setViewMode('quantity')}
                  style={{
                    padding: '6px 14px', border: 'none', borderRadius: '6px', fontSize: '12px', fontWeight: '600', cursor: 'pointer',
                    background: viewMode === 'quantity' ? '#dc3545' : 'transparent',
                    color: viewMode === 'quantity' ? '#fff' : '#666'
                  }}
                >Quantity</button>
              </div>
            </div>

            {topProducts.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '30px', color: '#999' }}>
                <i className="fas fa-chart-bar" style={{ fontSize: '36px', marginBottom: '10px', opacity: 0.4 }}></i>
                <p>No performance data available</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {topProducts.map((item, index) => {
                  const value = viewMode === 'revenue' ? parseFloat(item.total_revenue || 0) : parseInt(item.total_sold || 0);
                  const percentage = maxValue > 0 ? (value / maxValue) * 100 : 0;
                  const displayValue = viewMode === 'revenue' ? formatCurrency(value) : value.toLocaleString();
                  return (
                    <div key={item.id || item.item_code || index} style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <div style={{ width: '22px', textAlign: 'center', fontSize: '12px', fontWeight: '700', color: index < 3 ? '#dc3545' : '#999' }}>
                        {index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : `${index + 1}`}
                      </div>
                      <div style={{ width: '120px', fontSize: '12px', fontWeight: '600', color: '#333', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flexShrink: 0 }}>
                        {item.product_name || 'Unknown'}
                      </div>
                      <div style={{ flex: 1, background: '#f5f5f5', borderRadius: '6px', height: '28px', overflow: 'hidden', position: 'relative' }}>
                        <div style={{
                          width: `${Math.max(percentage, 2)}%`,
                          height: '100%',
                          background: `linear-gradient(90deg, ${barColors[index] || '#dc3545'}, ${barColors[index] || '#dc3545'}cc)`,
                          borderRadius: '6px',
                          transition: 'width 0.6s ease',
                          display: 'flex',
                          alignItems: 'center',
                          paddingLeft: '8px'
                        }}>
                          {percentage > 25 && (
                            <span style={{ fontSize: '11px', fontWeight: '600', color: '#fff' }}>{displayValue}</span>
                          )}
                        </div>
                        {percentage <= 25 && (
                          <span style={{ position: 'absolute', right: '8px', top: '50%', transform: 'translateY(-50%)', fontSize: '11px', fontWeight: '600', color: '#666' }}>
                            {displayValue}
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Category Breakdown */}
          {categories.length > 0 && (
            <div style={{ background: '#fff', border: '1px solid #eee', borderRadius: '12px', padding: '20px', marginBottom: '24px' }}>
              <h3 style={{ margin: '0 0 16px', fontSize: '16px', fontWeight: '700', color: '#333' }}>
                <i className="fas fa-th-large" style={{ color: '#dc3545', marginRight: '8px' }}></i>
                Category Breakdown
              </h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '12px' }}>
                {categories.map(([cat, data], index) => {
                  const catPercentage = maxCatRevenue > 0 ? (data.revenue / maxCatRevenue) * 100 : 0;
                  return (
                    <div key={cat} style={{ background: '#fafafa', borderRadius: '10px', padding: '14px', border: `1px solid ${catColors[index]}22` }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                        <span style={{ fontSize: '13px', fontWeight: '700', color: '#333' }}>{cat}</span>
                        <span style={{
                          padding: '2px 8px', borderRadius: '10px', fontSize: '11px', fontWeight: '600',
                          background: `${catColors[index]}15`, color: catColors[index]
                        }}>{data.count} items</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: '#666', marginBottom: '6px' }}>
                        <span>{data.sold.toLocaleString()} sold</span>
                        <span style={{ fontWeight: '700', color: catColors[index] }}>{formatCurrency(data.revenue)}</span>
                      </div>
                      <div style={{ background: '#eee', borderRadius: '4px', height: '6px', overflow: 'hidden' }}>
                        <div style={{
                          width: `${catPercentage}%`, height: '100%',
                          background: `linear-gradient(90deg, ${catColors[index]}, ${catColors[index]}aa)`,
                          borderRadius: '4px', transition: 'width 0.6s ease'
                        }}></div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Export Button */}
          <div style={{ textAlign: 'center' }}>
            <button
              onClick={handleExportCSV}
              disabled={isExporting || performance.length === 0}
              style={{
                padding: '10px 24px', fontSize: '14px', fontWeight: '600',
                background: performance.length === 0 ? '#ccc' : '#dc3545', color: '#fff',
                border: 'none', borderRadius: '8px', cursor: performance.length === 0 ? 'not-allowed' : 'pointer'
              }}
            >
              {isExporting ? <><i className="fas fa-spinner fa-spin"></i> Exporting...</> : <><i className="fas fa-download"></i> Export CSV</>}
            </button>
          </div>
        </>
      )}
    </div>
  );
};

export default StockPerformanceReportView;

