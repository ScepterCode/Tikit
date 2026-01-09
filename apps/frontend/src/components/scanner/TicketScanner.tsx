import { useState, useRef, useEffect } from 'react';
import { Html5Qrcode } from 'html5-qrcode';

interface TicketScannerProps {
  onScanSuccess: (qrCode: string) => void;
  onScanError?: (error: string) => void;
}

export const TicketScanner: React.FC<TicketScannerProps> = ({
  onScanSuccess,
  onScanError,
}) => {
  const [isScanning, setIsScanning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [cameras, setCameras] = useState<{ id: string; label: string }[]>([]);
  const [selectedCamera, setSelectedCamera] = useState<string>('');
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const scannerElementId = 'qr-scanner';

  // Get available cameras on mount
  useEffect(() => {
    Html5Qrcode.getCameras()
      .then((devices: any[]) => {
        if (devices && devices.length > 0) {
          const cameraList = devices.map((device: any) => ({
            id: device.id,
            label: device.label || `Camera ${device.id}`,
          }));
          setCameras(cameraList);
          // Select the back camera by default (usually the last one)
          setSelectedCamera(cameraList[cameraList.length - 1].id);
        } else {
          setError('No cameras found on this device');
        }
      })
      .catch((err: any) => {
        console.error('Error getting cameras:', err);
        setError('Failed to access camera. Please grant camera permissions.');
        onScanError?.('Failed to access camera');
      });

    // Cleanup on unmount
    return () => {
      if (scannerRef.current && isScanning) {
        scannerRef.current
          .stop()
          .catch((err: any) => console.error('Error stopping scanner:', err));
      }
    };
  }, []);

  const startScanning = async () => {
    if (!selectedCamera) {
      setError('Please select a camera');
      return;
    }

    try {
      setError(null);
      setIsScanning(true);

      // Initialize scanner if not already initialized
      if (!scannerRef.current) {
        scannerRef.current = new Html5Qrcode(scannerElementId);
      }

      // Start scanning
      await scannerRef.current.start(
        selectedCamera,
        {
          fps: 10, // Frames per second
          qrbox: { width: 250, height: 250 }, // QR code scanning box
        },
        (decodedText: string) => {
          // Success callback - QR code detected
          console.log('QR Code detected:', decodedText);
          onScanSuccess(decodedText);
          
          // Stop scanning after successful scan
          stopScanning();
        },
        (_errorMessage: any) => {
          // Error callback - no QR code detected (this is normal)
          // We don't show these errors as they happen continuously while scanning
        }
      );
    } catch (err: any) {
      console.error('Error starting scanner:', err);
      setError(err.message || 'Failed to start camera');
      setIsScanning(false);
      onScanError?.(err.message || 'Failed to start camera');
    }
  };

  const stopScanning = async () => {
    if (scannerRef.current && isScanning) {
      try {
        await scannerRef.current.stop();
        setIsScanning(false);
      } catch (err: any) {
        console.error('Error stopping scanner:', err);
        setError(err.message || 'Failed to stop camera');
      }
    }
  };

  const handleCameraChange = (cameraId: string) => {
    setSelectedCamera(cameraId);
    // If currently scanning, restart with new camera
    if (isScanning) {
      stopScanning().then(() => {
        setSelectedCamera(cameraId);
        // Wait a bit before restarting
        setTimeout(() => startScanning(), 500);
      });
    }
  };

  return (
    <div className="ticket-scanner">
      <div className="scanner-header">
        <h2>Scan Ticket QR Code</h2>
        <p>Position the QR code within the frame to scan</p>
      </div>

      {/* Camera selection */}
      {cameras.length > 1 && (
        <div className="camera-selector">
          <label htmlFor="camera-select">Select Camera:</label>
          <select
            id="camera-select"
            value={selectedCamera}
            onChange={(e) => handleCameraChange(e.target.value)}
            disabled={isScanning}
          >
            {cameras.map((camera) => (
              <option key={camera.id} value={camera.id}>
                {camera.label}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Scanner viewport */}
      <div className="scanner-viewport">
        <div id={scannerElementId} style={{ width: '100%' }} />
      </div>

      {/* Error display */}
      {error && (
        <div className="scanner-error" role="alert">
          <p>{error}</p>
        </div>
      )}

      {/* Control buttons */}
      <div className="scanner-controls">
        {!isScanning ? (
          <button
            onClick={startScanning}
            disabled={!selectedCamera || !!error}
            className="btn-primary"
          >
            Start Scanning
          </button>
        ) : (
          <button onClick={stopScanning} className="btn-secondary">
            Stop Scanning
          </button>
        )}
      </div>

      {/* Instructions */}
      <div className="scanner-instructions">
        <h3>Instructions:</h3>
        <ul>
          <li>Allow camera access when prompted</li>
          <li>Hold the device steady</li>
          <li>Ensure good lighting</li>
          <li>Position the QR code within the scanning frame</li>
          <li>The scan will happen automatically when detected</li>
        </ul>
      </div>
    </div>
  );
};
