// frontend/src/components/DeviceDebugger.jsx
import React, { useState, useEffect } from 'react';
import { useWebRTC } from '../context/WebRTCContext';

const DeviceDebugger = () => {
  const { availableDevices, deviceError, checkAvailableDevices } = useWebRTC();
  const [debugInfo, setDebugInfo] = useState({});

  useEffect(() => {
    const gatherDebugInfo = async () => {
      try {
        const info = {
          userAgent: navigator.userAgent,
          mediaDevicesSupported: !!navigator.mediaDevices,
          getUserMediaSupported: !!navigator.mediaDevices?.getUserMedia,
          enumerateDevicesSupported: !!navigator.mediaDevices?.enumerateDevices,
          isSecureContext: window.isSecureContext,
          protocol: window.location.protocol,
        };

        if (navigator.mediaDevices?.enumerateDevices) {
          try {
            const devices = await navigator.mediaDevices.enumerateDevices();
            info.totalDevices = devices.length;
            info.videoInputs = devices.filter(d => d.kind === 'videoinput').length;
            info.audioInputs = devices.filter(d => d.kind === 'audioinput').length;
            info.audioOutputs = devices.filter(d => d.kind === 'audiooutput').length;
          } catch (error) {
            info.enumerateError = error.message;
          }
        }

        setDebugInfo(info);
      } catch (error) {
        console.error('Debug info gathering failed:', error);
      }
    };

    gatherDebugInfo();
  }, []);

  if (process.env.NODE_ENV === 'production') {
    return null; // Don't show in production
  }

  return (
    <div className="fixed bottom-4 left-4 bg-black bg-opacity-80 text-white p-4 rounded-lg text-xs max-w-sm z-50">
      <h3 className="font-bold mb-2">🔧 Device Debug Info</h3>
      
      <div className="space-y-1">
        <div>Secure Context: {debugInfo.isSecureContext ? '✅' : '❌'}</div>
        <div>Protocol: {debugInfo.protocol}</div>
        <div>MediaDevices API: {debugInfo.mediaDevicesSupported ? '✅' : '❌'}</div>
        <div>getUserMedia: {debugInfo.getUserMediaSupported ? '✅' : '❌'}</div>
        <div>enumerateDevices: {debugInfo.enumerateDevicesSupported ? '✅' : '❌'}</div>
        
        {debugInfo.totalDevices !== undefined && (
          <>
            <div>Total Devices: {debugInfo.totalDevices}</div>
            <div>Video Inputs: {debugInfo.videoInputs}</div>
            <div>Audio Inputs: {debugInfo.audioInputs}</div>
            <div>Audio Outputs: {debugInfo.audioOutputs}</div>
          </>
        )}
        
        {availableDevices && (
          <>
            <div>Available Video: {availableDevices.video?.length || 0}</div>
            <div>Available Audio: {availableDevices.audio?.length || 0}</div>
          </>
        )}
        
        {deviceError && (
          <div className="text-red-400">Error: {deviceError}</div>
        )}
        
        {debugInfo.enumerateError && (
          <div className="text-red-400">Enum Error: {debugInfo.enumerateError}</div>
        )}
      </div>
      
      <button
        onClick={checkAvailableDevices}
        className="mt-2 px-2 py-1 bg-blue-600 rounded text-xs"
      >
        Refresh Devices
      </button>
    </div>
  );
};

export default DeviceDebugger;