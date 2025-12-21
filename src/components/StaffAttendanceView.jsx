import React, { useState, useEffect } from 'react';
import './staffAttendanceView.css';

const StaffAttendanceView = ({ onClose }) => {
  const [attendance, setAttendance] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);

  useEffect(() => {
    fetchAttendance();
  }, [selectedDate]);

  const fetchAttendance = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await fetch(
        `${process.env.REACT_APP_API_URL || 'http://localhost:5000/api'}/attendance/all?date=${selectedDate}`,
        {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token') || ''}`
          }
        }
      );

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setAttendance(data.attendance || []);
        } else {
          setError('Failed to fetch attendance data');
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

  const handleExportCSV = async () => {
    try {
      setError('');
      const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';
      const url = `${apiUrl}/attendance/export?date=${selectedDate}`;
      
      // Use downloadFileFromServer for mobile APK compatibility
      const { downloadFileFromServer } = await import('../utils/fileDownload');
      const timestamp = selectedDate || new Date().toISOString().split('T')[0];
      const filename = `attendance_${timestamp}.csv`;
      
      await downloadFileFromServer(url, filename);
    } catch (err) {
      console.error('Error exporting CSV:', err);
      setError(err.message || 'Failed to export CSV. Please try again.');
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

  return (
    <div className="attendance-view-overlay" onClick={onClose}>
      <div className="attendance-view-modal" onClick={(e) => e.stopPropagation()}>
        <div className="attendance-view-header">
          <h2>Staff Attendance - {new Date(selectedDate).toLocaleDateString()}</h2>
          <button className="close-btn" onClick={onClose}>
            <i className="fas fa-times"></i>
          </button>
        </div>

        <div className="attendance-view-body">
          <div className="attendance-controls">
            <div className="date-selector">
              <label>Select Date:</label>
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                style={{ padding: '8px', borderRadius: '4px', border: '1px solid #ddd' }}
              />
            </div>
            <button className="btn-primary" onClick={handleExportCSV}>
              <i className="fas fa-download"></i> Export CSV
            </button>
          </div>

          {error && (
            <div className="error-message" style={{ padding: '10px', background: '#fee', color: '#c33', borderRadius: '4px', marginBottom: '15px' }}>
              {error}
            </div>
          )}

          {loading ? (
            <div style={{ textAlign: 'center', padding: '40px' }}>
              <i className="fas fa-spinner fa-spin" style={{ fontSize: '24px', color: '#dc3545' }}></i>
              <p>Loading attendance data...</p>
            </div>
          ) : attendance.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px', color: '#666' }}>
              <i className="fas fa-calendar-times" style={{ fontSize: '48px', marginBottom: '15px', opacity: 0.5 }}></i>
              <p>No attendance records found for this date.</p>
            </div>
          ) : (
            <div className="attendance-table-container">
              <table className="attendance-table">
                <thead>
                  <tr>
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
                  {attendance.map((record) => (
                    <tr key={record.id}>
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

export default StaffAttendanceView;

