/**
 * AI Front Desk Agent - Main Application
 */

import { useVoiceSession } from './hooks/useVoiceSession';
import { MicButton } from './components/MicButton';
import { TranscriptPanel } from './components/TranscriptPanel';
import { QueueCard } from './components/QueueCard';
import './App.css';

function App() {
  const {
    isConnected,
    isRecording,
    transcripts,
    queueInfo,
    error,
    connect,
    toggleRecording,
  } = useVoiceSession();

  return (
    <div className="app">
      <header className="app-header">
        <h1>Front Desk</h1>
        <div className="connection-status">
          <span className={`status-dot ${isConnected ? 'connected' : ''}`} />
          <span>{isConnected ? 'Connected' : 'Disconnected'}</span>
        </div>
      </header>

      <main className="app-main">
        <div className="app-content">
          {/* Queue Card - Shows when issued */}
          <QueueCard queueInfo={queueInfo} />

          {/* Transcript Panel */}
          <TranscriptPanel transcripts={transcripts} />

          {/* Error Display */}
          {error && (
            <div className="error-banner">
              <span>⚠️</span>
              <span>{error}</span>
            </div>
          )}
        </div>

        {/* Microphone Button */}
        <div className="mic-container">
          <MicButton
            isConnected={isConnected}
            isRecording={isRecording}
            onConnect={connect}
            onToggleRecording={toggleRecording}
          />
        </div>
      </main>

      <footer className="app-footer">
        <p>Selamat datang! Tekan mikrofon untuk mulai berbicara.</p>
        <p className="footer-hint">Welcome! Tap the microphone to start speaking.</p>
      </footer>
    </div>
  );
}

export default App;
