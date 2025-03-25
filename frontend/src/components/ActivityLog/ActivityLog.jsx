import React, { useState, useEffect } from 'react';
import { assets } from '../../assets/assets';

const ActivityLog = () => {
  const [activityLog, setActivityLog] = useState([]);
  
  // Load activity log from localStorage on component mount
  useEffect(() => {
    const savedLog = JSON.parse(localStorage.getItem('activityLog')) || [];
    setActivityLog(savedLog);
  }, []);
  
  // Format the timestamp to a readable date and time
  const formatTimestamp = (timestamp) => {
    const date = new Date(timestamp);
    return `${date.toLocaleDateString()} at ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
  };
  
  // Delete an activity entry
  const deleteActivity = (index) => {
    const updatedLog = [...activityLog];
    updatedLog.splice(index, 1);
    setActivityLog(updatedLog);
    localStorage.setItem('activityLog', JSON.stringify(updatedLog));
  };
  
  return (
    <div className="activity-container">
      <div className="activity-header">
        <h1>Activity History</h1>
      </div>
      
      {activityLog.length === 0 ? (
        <div className="empty-state">
          <p>You haven't had any conversations yet.</p>
        </div>
      ) : (
        <div className="activity-list">
          {activityLog.map((activity, index) => (
            <div key={index} className="activity-item">
              <div className="activity-time">{formatTimestamp(activity.timestamp)}</div>
              <div className="activity-query">{activity.query}</div>
              <div className="activity-response">{activity.response.length > 150 ? activity.response.substring(0, 150) + '...' : activity.response}</div>
              <div className="activity-delete" onClick={() => deleteActivity(index)}>
                <img src={assets.delete_icon} alt="Delete" width="18" />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ActivityLog;