
import React, { useRef } from 'react';
import './App.css';
import { useSignLanguage } from './hooks/useSignLanguage';
import { Camera, CameraOff, Trash2, Languages, Volume2, Info, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

function App() {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);

  const {
    gesture,
    sentence,
    isCameraActive,
    toggleCamera,
    clearSentence,
    loading,
    error
  } = useSignLanguage(videoRef, canvasRef);

  return (
    <div className="app-container">
      <header>
        <motion.h1
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
        >
          SignToWords AI
        </motion.h1>
        <p className="tagline">Smart Gesture Translation Engine</p>
      </header>

      <main className="main-content">
        <section className="camera-section">
          {!isCameraActive ? (
            <div className="camera-placeholder">
              {error ? (
                <div style={{ color: '#ef4444', marginBottom: '1rem', textAlign: 'center' }}>
                  <AlertCircle size={48} style={{ margin: '0 auto 1rem' }} />
                  <p><strong>Tracking Error:</strong> {error}</p>
                  <p style={{ fontSize: '0.8rem', opacity: 0.7 }}>Ensure the camera is connected and allowed.</p>
                </div>
              ) : (
                <>
                  <CameraOff className="icon-large" />
                  <p>Camera is paused. Start tracking to begin.</p>
                </>
              )}
              <button className="btn btn-primary" onClick={toggleCamera}>
                <Camera size={20} />
                {error ? 'Retry Camera' : 'Enable Camera'}
              </button>
            </div>
          ) : (
            <>
              <video
                ref={videoRef}
                className="video-feed"
                autoPlay
                playsInline
                muted
              />
              <canvas ref={canvasRef} className="overlay-canvas" />

              <div className="status-overlay">
                <div className="status-badge">
                  <div className={`status-indicator ${isCameraActive ? 'active' : ''}`} />
                  {loading ? 'Initializing AI...' : 'AI Active'}
                </div>
                <div className="status-badge">
                  <Languages size={14} />
                  English
                </div>
              </div>

              <AnimatePresence>
                {gesture && (
                  <motion.div
                    className="gesture-display"
                    initial={{ opacity: 0, y: 50, x: '-50%' }}
                    animate={{ opacity: 1, y: 0, x: '-50%' }}
                    exit={{ opacity: 0, y: 20, x: '-50%' }}
                  >
                    <span className="gesture-text">{gesture}</span>
                  </motion.div>
                )}
              </AnimatePresence>
            </>
          )}
        </section>

        <aside className="sidebar">
          <div className="glass-card sentence-card">
            <div className="card-header">
              <span className="card-title">Live Transcript</span>
              <Volume2 size={18} className="text-dim" />
            </div>
            <div className="sentence-display">
              <AnimatePresence>
                {sentence.length === 0 ? (
                  <span style={{ opacity: 0.4 }}>No gestures detected yet...</span>
                ) : (
                  sentence.map((word, i) => (
                    <motion.span
                      key={i}
                      initial={{ opacity: 0, x: -5 }}
                      animate={{ opacity: 1, x: 0 }}
                    >
                      {word}
                    </motion.span>
                  ))
                )}
              </AnimatePresence>
            </div>
          </div>

          <div className="glass-card controls-card">
            <span className="card-title">System Controls</span>
            <button className={`btn ${isCameraActive ? 'btn-secondary' : 'btn-primary'}`} onClick={toggleCamera}>
              {isCameraActive ? (
                <><CameraOff size={20} /> Pause Tracking</>
              ) : (
                <><Camera size={20} /> Start Tracking</>
              )}
            </button>
            <button className="btn btn-secondary" onClick={clearSentence}>
              <Trash2 size={20} className="btn-danger" />
              Clear Transcript
            </button>
          </div>

          <div className="glass-card">
            <div className="card-header">
              <span className="card-title">Quick Guide</span>
              <Info size={16} />
            </div>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-dim)', lineHeight: '1.4' }}>
              Hold gesture for 1 second to register. Lower hand to pause detection.
              Supported: Hello, OK, Peace, Numbers, Good, Yes, Stop, etc.
            </p>
          </div>
        </aside>
      </main>
    </div>
  );
}

export default App;
