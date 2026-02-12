import React, { useState, useEffect } from 'react';
import Toast from './Toast';
import './staffAttendanceView.css';

const UnifiedAttendanceView = ({ onClose }) => {
  const [staffAttendance, setStaffAttendance] = useState([]);
  const [supervisorAttendance, setSupervisorAttendance] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [activeTab, setActiveTab] = useState('all'); // 'all', 'staff', 'supervisor'

  useEffect(() => {
    fetchAttendance();
  }, [selectedDate]);

  const fetchAttendance = async () => {
    setLoading(true);
    setError('');
    const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';
    
    try {
      // Fetch both staff and supervisor attendance in parallel
      const [staffResponse, supervisorResponse] = await Promise.all([
        fetch(`${apiUrl}/attendance/all?date=${selectedDate}`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token') || ''}`
          }
        }),
        fetch(`${apiUrl}/supervisor-attendance/all?date=${selectedDate}`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token') || ''}`
          }
        })
      ]);

      if (staffResponse.ok && supervisorResponse.ok) {
        const staffData = await staffResponse.json();
        const supervisorData = await supervisorResponse.json();
        
        if (staffData.success) {
          setStaffAttendance(staffData.attendance || []);
        }
        
        if (supervisorData.success) {
          setSupervisorAttendance(supervisorData.attendance || []);
        }
      } else {
        setError('Failed to fetch attendance data');
      }
    } catch (err) {
      console.error('Error fetching attendance:', err);
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleExportCSV = async (type = 'all') => {
    try {
      setError('');
      const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';
      const timestamp = selectedDate || new Date().toISOString().split('T')[0];
      
      if (type === 'all') {
        // Export combined attendance
        await exportCombinedCSV();
      } else if (type === 'staff') {
        const url = `${apiUrl}/attendance/export?date=${selectedDate}`;
        const { downloadFileFromServer } = await import('../utils/fileDownload');
        const filename = `staff_attendance_${timestamp}.csv`;
        await downloadFileFromServer(url, filename);
      } else if (type === 'supervisor') {
        const url = `${apiUrl}/supervisor-attendance/export?date=${selectedDate}`;
        const { downloadFileFromServer } = await import('../utils/fileDownload');
        const filename = `supervisor_attendance_${timestamp}.csv`;
        await downloadFileFromServer(url, filename);
      }
    } catch (err) {
      console.error('Error exporting CSV:', err);
      setError(err.message || 'Failed to export CSV. Please try again.');
    }
  };

  const exportCombinedCSV = async () => {
    try {
      const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';
      const timestamp = selectedDate || new Date().toISOString().split('T')[0];
      
      // Fetch both attendance data
      const [staffResponse, supervisorResponse] = await Promise.all([
        fetch(`${apiUrl}/attendance/all?date=${selectedDate}`),
        fetch(`${apiUrl}/supervisor-attendance/all?date=${selectedDate}`)
      ]);

      const staffData = await staffResponse.json();
      const supervisorData = await supervisorResponse.json();

      // Combine data
      const combinedData = [];
      
      // Add staff attendance with role indicator
      if (staffData.success && staffData.attendance) {
        staffData.attendance.forEach(record => {
          combinedData.push({
            ...record,
            role: 'Staff'
          });
        });
      }
      
      // Add supervisor attendance with role indicator
      if (supervisorData.success && supervisorData.attendance) {
        supervisorData.attendance.forEach(record => {
          combinedData.push({
            ...record,
            role: 'Supervisor'
          });
        });
      }

      // Generate CSV
      const csvHeader = 'Role,Name,Email,Username,Store,Date,Check-in Time,Check-out Time,Late,Late Minutes,Early Logout,Early Logout Minutes\n';
      const csvRows = combinedData.map(row => {
        return [
          `"${row.role || ''}"`,
          `"${row.full_name || ''}"`,
          `"${row.email || ''}"`,
          `"${row.username || ''}"`,
          `"${row.store_allocated || ''}"`,
          `"${row.attendance_date || selectedDate}"`,
          `"${row.check_in_time ? new Date(row.check_in_time).toLocaleString() : ''}"`,
          `"${row.check_out_time ? new Date(row.check_out_time).toLocaleString() : ''}"`,
          row.is_late ? 'Yes' : 'No',
          row.late_minutes || 0,
          row.is_early_logout ? 'Yes' : 'No',
          row.early_logout_minutes || 0
        ].join(',');
      }).join('\n');

      const csv = csvHeader + csvRows;
      
      // Download CSV
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `combined_attendance_${timestamp}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      console.error('Error exporting combined CSV:', err);
      throw err;
    }
  };

  const formatTime = (timestamp) => {
    if (!timestamp) return '-';
    return new Date(timestamp).toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: true 
    });
  };

  const getDisplayData = () => {
    if (activeTab === 'staff') {
      return staffAttendance.map(r => ({ ...r, role: 'Staff' }));
    } else if (activeTab === 'supervisor') {
      return supervisorAttendance.map(r => ({ ...r, role: 'Supervisor' }));
    } else {
      // Combined view
      const staff = staffAttendance.map(r => ({ ...r, role: 'Staff' }));
      const supervisors = supervisorAttendance.map(r => ({ ...r, role: 'Supervisor' }));
      return [...staff, ...supervisors];
    }
  };

  const displayData = getDisplayData();

  return (
    <div className="attendance-view-overlay" onClick={onClose}>
      <div className="attendance-view-modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '1200px', width: '95%' }}>
        <div className="attendance-view-header">
          <h2>Attendance Management - {new Date(selectedDate).toLocaleDateString()}</h2>
          <button className="close-btn" onClick={onClose}>
            <i className="fas fa-times"></i>
          </button>
        </div>

        <div className="attendance-view-body">
          <div className="attendance-controls" style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap', marginBottom: '20px' }}>
            <div className="date-selector">
              <label>Select Date:</label>
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                style={{ padding: '8px', borderRadius: '4px', border: '1px solid #ddd' }}
              />
            </div>
            
            {/* Tab Selector */}
            <div style={{ display: 'flex', gap: '8px', marginLeft: 'auto' }}>
              <button
                className={activeTab === 'all' ? 'btn-primary' : 'btn-secondary'}
                onClick={() => setActiveTab('all')}
                style={{ padding: '8px 16px', fontSize: '14px' }}
              >
                All ({staffAttendance.length + supervisorAttendance.length})
              </button>
              <button
                className={activeTab === 'staff' ? 'btn-primary' : 'btn-secondary'}
                onClick={() => setActiveTab('staff')}
                style={{ padding: '8px 16px', fontSize: '14px' }}
              >
                Staff ({staffAttendance.length})
              </button>
              <button
                className={activeTab === 'supervisor' ? 'btn-primary' : 'btn-secondary'}
                onClick={() => setActiveTab('supervisor')}
                style={{ padding: '8px 16px', fontSize: '14px' }}
              >
                Supervisors ({supervisorAttendance.length})
              </button>
            </div>

            {/* Export Buttons */}
            <div style={{ display: 'flex', gap: '8px' }}>
              {activeTab === 'all' && (
                <button className="btn-primary" onClick={() => handleExportCSV('all')} style={{ padding: '8px 16px', fontSize: '14px' }}>
                  <i className="fas fa-download"></i> Export All
                </button>
              )}
              {activeTab === 'staff' && (
                <button className="btn-primary" onClick={() => handleExportCSV('staff')} style={{ padding: '8px 16px', fontSize: '14px' }}>
                  <i className="fas fa-download"></i> Export Staff
                </button>
              )}
              {activeTab === 'supervisor' && (
                <button className="btn-primary" onClick={() => handleExportCSV('supervisor')} style={{ padding: '8px 16px', fontSize: '14px' }}>
                  <i className="fas fa-download"></i> Export Supervisors
                </button>
              )}
              <button className="btn-secondary" onClick={() => handleExportCSV('all')} style={{ padding: '8px 16px', fontSize: '14px' }}>
                <i className="fas fa-file-download"></i> Export Combined
              </button>
            </div>
          </div>

          <Toast message={error} type="error" onClose={() => setError('')} />

          {loading ? (
            <div style={{ textAlign: 'center', padding: '40px' }}>
              <i className="fas fa-spinner fa-spin" style={{ fontSize: '24px', color: '#dc3545' }}></i>
              <p>Loading attendance data...</p>
            </div>
          ) : displayData.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px', color: '#666' }}>
              <i className="fas fa-calendar-times" style={{ fontSize: '48px', marginBottom: '15px', opacity: 0.5 }}></i>
              <p>No attendance records found for this date.</p>
            </div>
          ) : (
            <div className="attendance-table-container">
              <table className="attendance-table">
                <thead>
                  <tr>
                    {activeTab === 'all' && <th>Role</th>}
                    <th>Name</th>
                    <th>Store</th>
                    <th>Check-in Time</th>
                    <th>Check-out Time</th>
                    <th>Status</th>
                    <th>Late</th>
                    <th>Early Logout</th>
                  </tr>
                </thead>
                <tbody>
                  {displayData.map((record, index) => (
                    <tr key={record.id || index}>
                      {activeTab === 'all' && (
                        <td>
                          <span className={`badge ${record.role === 'Staff' ? 'info' : 'warning'}`}>
                            {record.role}
                          </span>
                        </td>
                      )}
                      <td>{record.full_name || '-'}</td>
                      <td>{record.store_allocated || '-'}</td>
                      <td>{formatTime(record.check_in_time)}</td>
                      <td>{formatTime(record.check_out_time)}</td>
                      <td>
                        {record.check_out_time ? (
                          <span className="badge success">Completed</span>
                        ) : record.check_in_time ? (
                          <span className="badge warning">Checked In</span>
                        ) : (
                          <span className="badge danger">Absent</span>
                        )}
                      </td>
                      <td>
                        {record.is_late ? (
                          <span className="badge danger">
                            {record.late_minutes} min late
                          </span>
                        ) : (
                          <span className="badge success">On Time</span>
                        )}
                      </td>
                      <td>
                        {record.is_early_logout ? (
                          <span className="badge danger">
                            {record.early_logout_minutes} min early
                          </span>
                        ) : record.check_out_time ? (
                          <span className="badge success">On Time</span>
                        ) : (
                          <span>-</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default UnifiedAttendanceView;

