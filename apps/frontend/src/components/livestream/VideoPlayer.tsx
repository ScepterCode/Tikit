import { useState, useRef, useEffect } from 'react';

interface VideoPlayerProps {
  eventId: string;
  isLive: boolean;
  streamUrl?: string;
}

export function VideoPlayer({ eventId, isLive, streamUrl }: VideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(1);
  const [error, setError] = useState<string | null>(null);

  // Mock stream URL for demo purposes
  const mockStreamUrl = streamUrl || `https://demo-stream.example.com/live/${eventId}`;

  useEffect(() => {
    if (isLive && videoRef.current) {
      // In a real implementation, you would:
      // 1. Connect to WebRTC stream
      // 2. Use HLS.js for HTTP Live Streaming
      // 3. Connect to RTMP stream
      // 4. Use WebSocket for real-time updates
      
      // For demo, we'll show a placeholder
      console.log(`🔴 Would connect to live stream: ${mockStreamUrl}`);
    }
  }, [isLive, mockStreamUrl]);

  const handlePlay = () => {
    if (videoRef.current) {
      videoRef.current.play();
      setIsPlaying(true);
    }
  };

  const handlePause = () => {
    if (videoRef.current) {
      videoRef.current.pause();
      setIsPlaying(false);
    }
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVolume = parseFloat(e.target.value);
    setVolume(newVolume);
    if (videoRef.current) {
      videoRef.current.volume = newVolume;
    }
  };

  if (!isLive) {
    return (
      <div style={styles.offlineContainer}>
        <div style={styles.offlineContent}>
          <span style={styles.offlineIcon}>📺</span>
          <h3 style={styles.offlineTitle}>Stream Offline</h3>
          <p style={styles.offlineText}>
            The livestream will start when the organizer begins the event.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <div style={styles.videoContainer}>
        {/* Live indicator */}
        <div style={styles.liveIndicator}>
          <span style={styles.liveDot}></span>
          <span style={styles.liveText}>LIVE</span>
        </div>

        {/* Video element - in production this would connect to actual stream */}
        <video
          ref={videoRef}
          style={styles.video}
          poster="/api/placeholder/640/360"
          onError={() => setError('Failed to load stream')}
          onLoadStart={() => setError(null)}
        >
          {/* In production, add actual stream sources */}
          <source src={mockStreamUrl} type="application/x-mpegURL" />
          <source src={mockStreamUrl.replace('.m3u8', '.mp4')} type="video/mp4" />
          Your browser does not support the video tag.
        </video>

        {/* Demo overlay since we don't have real stream */}
        <div style={styles.demoOverlay}>
          <div style={styles.demoContent}>
            <span style={styles.demoIcon}>🎥</span>
            <h3 style={styles.demoTitle}>Live Stream Demo</h3>
            <p style={styles.demoText}>
              In production, this would show the actual live video stream
            </p>
            <div style={styles.demoStats}>
              <span>📡 Stream URL: {mockStreamUrl}</span>
            </div>
          </div>
        </div>

        {/* Video controls */}
        <div style={styles.controls}>
          <div style={styles.playControls}>
            {!isPlaying ? (
              <button style={styles.controlButton} onClick={handlePlay}>
                ▶️
              </button>
            ) : (
              <button style={styles.controlButton} onClick={handlePause}>
                ⏸️
              </button>
            )}
          </div>

          <div style={styles.volumeControls}>
            <span style={styles.volumeIcon}>🔊</span>
            <input
              type="range"
              min="0"
              max="1"
              step="0.1"
              value={volume}
              onChange={handleVolumeChange}
              style={styles.volumeSlider}
            />
          </div>

          <div style={styles.qualityControls}>
            <select style={styles.qualitySelect}>
              <option value="auto">Auto</option>
              <option value="1080p">1080p</option>
              <option value="720p">720p</option>
              <option value="480p">480p</option>
            </select>
          </div>
        </div>
      </div>

      {error && (
        <div style={styles.errorContainer}>
          <span style={styles.errorIcon}>⚠️</span>
          <span style={styles.errorText}>{error}</span>
        </div>
      )}

      {/* Stream info */}
      <div style={styles.streamInfo}>
        <div style={styles.infoItem}>
          <span style={styles.infoLabel}>Viewers:</span>
          <span style={styles.infoValue}>{Math.floor(Math.random() * 500) + 100}</span>
        </div>
        <div style={styles.infoItem}>
          <span style={styles.infoLabel}>Quality:</span>
          <span style={styles.infoValue}>720p</span>
        </div>
        <div style={styles.infoItem}>
          <span style={styles.infoLabel}>Latency:</span>
          <span style={styles.infoValue}>2.3s</span>
        </div>
      </div>
    </div>
  );
}

const styles = {
  container: {
    width: '100%',
    backgroundColor: '#000000',
    borderRadius: '8px',
    overflow: 'hidden',
    marginBottom: '16px',
  },
  offlineContainer: {
    width: '100%',
    height: '200px',
    backgroundColor: '#1f2937',
    borderRadius: '8px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: '16px',
  },
  offlineContent: {
    textAlign: 'center' as const,
    color: '#ffffff',
  },
  offlineIcon: {
    fontSize: '48px',
    marginBottom: '12px',
    display: 'block',
    opacity: 0.7,
  },
  offlineTitle: {
    fontSize: '18px',
    fontWeight: '600',
    marginBottom: '8px',
    color: '#ffffff',
  },
  offlineText: {
    fontSize: '14px',
    color: '#d1d5db',
    margin: 0,
  },
  videoContainer: {
    position: 'relative' as const,
    width: '100%',
    paddingBottom: '56.25%', // 16:9 aspect ratio
    height: 0,
  },
  video: {
    position: 'absolute' as const,
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    objectFit: 'cover' as const,
  },
  liveIndicator: {
    position: 'absolute' as const,
    top: '12px',
    left: '12px',
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    backgroundColor: 'rgba(220, 38, 38, 0.9)',
    color: 'white',
    padding: '4px 8px',
    borderRadius: '4px',
    fontSize: '12px',
    fontWeight: '600',
    zIndex: 10,
  },
  liveDot: {
    width: '8px',
    height: '8px',
    backgroundColor: 'white',
    borderRadius: '50%',
    animation: 'pulse 2s infinite',
  },
  liveText: {
    fontSize: '12px',
  },
  demoOverlay: {
    position: 'absolute' as const,
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 5,
  },
  demoContent: {
    textAlign: 'center' as const,
    color: 'white',
    padding: '20px',
  },
  demoIcon: {
    fontSize: '48px',
    marginBottom: '12px',
    display: 'block',
  },
  demoTitle: {
    fontSize: '20px',
    fontWeight: '600',
    marginBottom: '8px',
    color: 'white',
  },
  demoText: {
    fontSize: '14px',
    color: '#d1d5db',
    marginBottom: '16px',
  },
  demoStats: {
    fontSize: '12px',
    color: '#9ca3af',
    fontFamily: 'monospace',
  },
  controls: {
    position: 'absolute' as const,
    bottom: 0,
    left: 0,
    right: 0,
    background: 'linear-gradient(transparent, rgba(0, 0, 0, 0.7))',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '12px',
    zIndex: 10,
  },
  playControls: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
  controlButton: {
    background: 'none',
    border: 'none',
    color: 'white',
    fontSize: '18px',
    cursor: 'pointer',
    padding: '4px',
  },
  volumeControls: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
  volumeIcon: {
    fontSize: '16px',
  },
  volumeSlider: {
    width: '80px',
  },
  qualityControls: {
    display: 'flex',
    alignItems: 'center',
  },
  qualitySelect: {
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    color: 'white',
    border: '1px solid rgba(255, 255, 255, 0.3)',
    borderRadius: '4px',
    padding: '4px 8px',
    fontSize: '12px',
  },
  errorContainer: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '12px',
    backgroundColor: '#fee2e2',
    color: '#991b1b',
    fontSize: '14px',
  },
  errorIcon: {
    fontSize: '16px',
  },
  errorText: {
    fontSize: '14px',
  },
  streamInfo: {
    display: 'flex',
    justifyContent: 'space-around',
    padding: '12px',
    backgroundColor: 'rgba(0, 0, 0, 0.1)',
    fontSize: '12px',
  },
  infoItem: {
    display: 'flex',
    flexDirection: 'column' as const,
    alignItems: 'center',
    gap: '4px',
  },
  infoLabel: {
    color: '#6b7280',
    fontSize: '11px',
  },
  infoValue: {
    color: '#1f2937',
    fontWeight: '600',
    fontSize: '13px',
  },
};