'use client'

import { useEffect, useState } from 'react'

// Configuration
const ADMIN_ENDPOINT = "https://your-backend-server.com/api/admin/locations";
const REFRESH_INTERVAL = 5000; // 5 seconds

interface LocationData {
  latitude: number;
  longitude: number;
  accuracy: number | null;
  timestamp: number;
  userAgent: string;
  capturedAt: string;
  timezone?: string;
  platform?: string;
  language?: string;
  screenWidth?: number;
  screenHeight?: number;
}

export default function AdminDashboard() {
  const [locationData, setLocationData] = useState<LocationData[]>([]);
  const [connectionStatus, setConnectionStatus] = useState('📡 Monitoring for new location data...');
  const [statusType, setStatusType] = useState('info');
  const [autoRefresh, setAutoRefresh] = useState(true);

  // Load location data from server
  const loadLocationData = async () => {
    try {
      const response = await fetch(ADMIN_ENDPOINT, {
        method: 'GET',
        headers: {
          'Authorization': 'Bearer your-admin-token', // Replace with actual auth
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setLocationData(data.locations || []);
        setConnectionStatus('✅ Connected to server');
        setStatusType('info');
      } else {
        throw new Error(`Server error: ${response.status}`);
      }
    } catch (error) {
      console.error('Failed to load location data:', error);
      setConnectionStatus('⚠️ Unable to connect to server - showing demo data');
      setStatusType('warning');
      loadDemoData();
    }
  };

  // Load demo data for testing
  const loadDemoData = () => {
    const now = Date.now();
    setLocationData([
      {
        latitude: 40.7128,
        longitude: -74.0060,
        accuracy: 20,
        timestamp: now - 3600000,
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        capturedAt: new Date(now - 3600000).toISOString(),
        timezone: 'America/New_York',
        platform: 'Win32',
        language: 'en-US',
        screenWidth: 1920,
        screenHeight: 1080
      },
      {
        latitude: 34.0522,
        longitude: -118.2437,
        accuracy: 15,
        timestamp: now - 7200000,
        userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 15_0 like Mac OS X)',
        capturedAt: new Date(now - 7200000).toISOString(),
        timezone: 'America/Los_Angeles',
        platform: 'iPhone',
        language: 'en-US',
        screenWidth: 375,
        screenHeight: 812
      }
    ]);
  };

  // Calculate statistics
  const getStats = () => {
    const total = locationData.length;
    const today = new Date().toDateString();
    const todayCount = locationData.filter(loc => 
      new Date(loc.capturedAt).toDateString() === today
    ).length;
    
    const unique = new Set(locationData.map(loc => 
      `${Math.round(loc.latitude * 100)},${Math.round(loc.longitude * 100)}`
    )).size;
    
    const lastCapture = locationData.length > 0 
      ? new Date(Math.max(...locationData.map(loc => new Date(loc.capturedAt).getTime()))).toLocaleString()
      : 'Never';
    
    return { total, todayCount, unique, lastCapture };
  };

  // Export data as CSV
  const exportData = () => {
    if (locationData.length === 0) {
      alert('No data to export');
      return;
    }
    
    const headers = ['Timestamp', 'Latitude', 'Longitude', 'Accuracy', 'Timezone', 'User Agent'];
    const csvContent = [
      headers.join(','),
      ...locationData.map(loc => [
        loc.capturedAt,
        loc.latitude,
        loc.longitude,
        loc.accuracy || '',
        loc.timezone || '',
        `"${(loc.userAgent || '').replace(/"/g, '""')}"`
      ].join(','))
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `location-data-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  // Clear all data
  const clearData = () => {
    if (confirm('Are you sure you want to clear all location data? This action cannot be undone.')) {
      setLocationData([]);
      
      // Also send clear request to server
      fetch(ADMIN_ENDPOINT, {
        method: 'DELETE',
        headers: {
          'Authorization': 'Bearer your-admin-token',
          'Content-Type': 'application/json'
        }
      }).catch(console.error);
    }
  };

  useEffect(() => {
    loadLocationData();
    
    const interval = setInterval(() => {
      if (autoRefresh) {
        loadLocationData();
      }
    }, REFRESH_INTERVAL);
    
    return () => clearInterval(interval);
  }, [autoRefresh]);

  const stats = getStats();
  const sortedData = [...locationData].sort((a, b) => 
    new Date(b.capturedAt).getTime() - new Date(a.capturedAt).getTime()
  );

  return (
    <div style={{
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Oxygen, Ubuntu, Cantarell, sans-serif',
      background: '#f5f5f5',
      minHeight: '100vh',
      color: '#333',
      lineHeight: '1.6'
    }}>
      {/* Header */}
      <div style={{
        background: '#2c3e50',
        color: 'white',
        padding: '1rem 2rem',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
      }}>
        <h1 style={{ fontSize: '1.8rem', fontWeight: '600', margin: 0 }}>
          🗺️ Location Data Dashboard
        </h1>
        <p style={{ opacity: 0.8, marginTop: '0.5rem', margin: 0 }}>
          Monitor and analyze visitor location data
        </p>
      </div>

      <div style={{ maxWidth: '1200px', margin: '2rem auto', padding: '0 2rem' }}>
        {/* Connection Status */}
        <div style={{
          padding: '1rem',
          borderRadius: '5px',
          marginBottom: '1rem',
          fontWeight: '500',
          background: statusType === 'info' ? '#e3f2fd' : '#fff3e0',
          color: statusType === 'info' ? '#1976d2' : '#f57c00'
        }}>
          {connectionStatus}
        </div>

        {/* Statistics */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '1rem',
          marginBottom: '2rem'
        }}>
          {[
            { label: 'Total Locations', value: stats.total },
            { label: "Today's Captures", value: stats.todayCount },
            { label: 'Unique Visitors', value: stats.unique },
            { label: 'Last Capture', value: stats.lastCapture }
          ].map((stat, index) => (
            <div key={index} style={{
              background: 'white',
              padding: '1.5rem',
              borderRadius: '10px',
              boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
              textAlign: 'center'
            }}>
              <h3 style={{
                color: '#2c3e50',
                fontSize: index === 3 ? '1rem' : '2rem',
                marginBottom: '0.5rem'
              }}>
                {stat.value}
              </h3>
              <p style={{ color: '#666', fontWeight: '500', margin: 0 }}>
                {stat.label}
              </p>
            </div>
          ))}
        </div>

        {/* Controls */}
        <div style={{
          background: 'white',
          padding: '1.5rem',
          borderRadius: '10px',
          boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
          marginBottom: '2rem',
          display: 'flex',
          gap: '1rem',
          alignItems: 'center',
          flexWrap: 'wrap'
        }}>
          <button
            onClick={loadLocationData}
            style={{
              background: '#3498db',
              color: 'white',
              border: 'none',
              padding: '0.75rem 1.5rem',
              borderRadius: '5px',
              cursor: 'pointer',
              fontWeight: '500'
            }}
          >
            🔄 Refresh Data
          </button>
          <button
            onClick={exportData}
            style={{
              background: '#3498db',
              color: 'white',
              border: 'none',
              padding: '0.75rem 1.5rem',
              borderRadius: '5px',
              cursor: 'pointer',
              fontWeight: '500'
            }}
          >
            📥 Export CSV
          </button>
          <button
            onClick={clearData}
            style={{
              background: '#e74c3c',
              color: 'white',
              border: 'none',
              padding: '0.75rem 1.5rem',
              borderRadius: '5px',
              cursor: 'pointer',
              fontWeight: '500'
            }}
          >
            🗑️ Clear All Data
          </button>
          <span style={{ marginLeft: 'auto', color: '#666', fontSize: '0.9rem' }}>
            Auto-refresh: <span style={{ fontWeight: 'bold' }}>ON</span>
          </span>
        </div>

        {/* Data Table */}
        <div style={{
          background: 'white',
          borderRadius: '10px',
          boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
          overflow: 'hidden'
        }}>
          <div style={{
            background: '#34495e',
            color: 'white',
            padding: '1rem 1.5rem',
            fontWeight: '600'
          }}>
            📍 Location Captures
          </div>
          
          <div style={{ maxHeight: '600px', overflowY: 'auto' }}>
            {sortedData.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '3rem', color: '#666' }}>
                <p>No location data available yet.</p>
                <p style={{ marginTop: '0.5rem', fontSize: '0.9rem', opacity: 0.7 }}>
                  Data will appear here when visitors access the main page.
                </p>
              </div>
            ) : (
              sortedData.map((location, index) => (
                <div key={index} style={{
                  borderBottom: index < sortedData.length - 1 ? '1px solid #eee' : 'none',
                  padding: '1.5rem',
                  transition: 'background 0.3s'
                }}>
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: '1rem'
                  }}>
                    <div style={{ color: '#666', fontSize: '0.9rem' }}>
                      📅 {new Date(location.capturedAt).toLocaleString()}
                    </div>
                    <a
                      href={`https://www.google.com/maps?q=${location.latitude},${location.longitude}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        color: '#3498db',
                        textDecoration: 'none',
                        fontWeight: '500'
                      }}
                    >
                      🗺️ View on Map
                    </a>
                  </div>
                  
                  <div style={{
                    fontFamily: 'Courier New, monospace',
                    background: '#f8f9fa',
                    padding: '0.5rem',
                    borderRadius: '5px',
                    fontSize: '0.9rem',
                    marginBottom: '1rem'
                  }}>
                    📍 {location.latitude.toFixed(6)}, {location.longitude.toFixed(6)}
                    {location.accuracy && ` (±${location.accuracy}m)`}
                  </div>
                  
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                    gap: '1rem'
                  }}>
                    <div style={{ fontSize: '0.9rem' }}>
                      <div style={{ fontWeight: '600', color: '#2c3e50' }}>Timezone:</div>
                      <div style={{ color: '#666' }}>{location.timezone || 'Unknown'}</div>
                    </div>
                    <div style={{ fontSize: '0.9rem' }}>
                      <div style={{ fontWeight: '600', color: '#2c3e50' }}>Platform:</div>
                      <div style={{ color: '#666' }}>{location.platform || 'Unknown'}</div>
                    </div>
                    <div style={{ fontSize: '0.9rem' }}>
                      <div style={{ fontWeight: '600', color: '#2c3e50' }}>Language:</div>
                      <div style={{ color: '#666' }}>{location.language || 'Unknown'}</div>
                    </div>
                    <div style={{ fontSize: '0.9rem' }}>
                      <div style={{ fontWeight: '600', color: '#2c3e50' }}>Screen:</div>
                      <div style={{ color: '#666' }}>
                        {location.screenWidth && location.screenHeight 
                          ? `${location.screenWidth}x${location.screenHeight}` 
                          : 'Unknown'}
                      </div>
                    </div>
                    <div style={{ fontSize: '0.9rem', gridColumn: '1 / -1' }}>
                      <div style={{ fontWeight: '600', color: '#2c3e50' }}>User Agent:</div>
                      <div style={{ color: '#666', fontSize: '0.8rem', wordBreak: 'break-all' }}>
                        {location.userAgent || 'Unknown'}
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
