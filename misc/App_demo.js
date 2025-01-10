import React, { useState } from 'react';
import axios from 'axios';
import Recorder from 'react-mp3-recorder';
import './styles.css';

function App() {
  const [textInput, setTextInput] = useState('');
  const [fileInput, setFileInput] = useState(null);
  const [selectedDeposition, setSelectedDeposition] = useState('');
  const [conversationHistory, setConversationHistory] = useState([]);
  const [voiceKey, setVoiceKey] = useState('Adam');
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [showOverlay, setShowOverlay] = useState(true); // Overlay visible by default
  const [historicalConversations, setHistoricalConversations] = useState([
    { id: 1, name: "John Doe", summary: "Discussed project scope and responsibilities." },
    { id: 2, name: "Jane Smith", summary: "Recapped client feedback and contract terms." },
    { id: 3, name: "Alex Brown", summary: "Answered questions about app usage and features." },
  ]);

  const voiceOptions = ['Adam', 'Onyx', 'Nova', 'Ocean'];
  const depositionOptions = ['Deposition 1', 'Deposition 2', 'Deposition 3'];

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  const handleTextSubmit = async () => {
    if (textInput.trim() === '' && !fileInput) return;

    const newMessage = {
      role: 'You',
      text: textInput || 'File uploaded',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      file: fileInput ? fileInput.name : null,
    };

    setConversationHistory([...conversationHistory, newMessage]);
    setTextInput('');
    setFileInput(null);

    try {
      const formData = new FormData();
      formData.append('input', textInput);
      formData.append('voiceKey', voiceKey);
      if (fileInput) formData.append('file', fileInput);

      const res = await axios.post('http://localhost:5000/api/query', formData);
      handleResponse(res.data.answer);
    } catch (error) {
      console.error(error);
    }
  };

  const handleAudioStop = async (recordedBlob) => {
    const formData = new FormData();
    formData.append('file', recordedBlob);
    formData.append('voiceKey', voiceKey);

    try {
      const res = await axios.post('http://localhost:5000/api/voice-query', formData);
      handleResponse(res.data.answer);
    } catch (error) {
      console.error(error);
    }
  };

  const handleResponse = (answer) => {
    const botMessage = {
      role: 'Bot',
      text: answer,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
    setConversationHistory((prev) => [...prev, botMessage]);
  };

  const handleFileChange = (event) => {
    setFileInput(event.target.files[0]);
    setShowOverlay(false); // Hide overlay on selection
  };

  const handleDepositionSelect = (event) => {
    setSelectedDeposition(event.target.value);
    setShowOverlay(false); // Hide overlay on selection
  };

  return (
    <div className="app-container">
      {/* Top Ribbon */}
      <div className="top-ribbon">
        <div className="sidebar-icon" onClick={toggleSidebar}>💬</div>
        <h1>Cross Examination</h1>
      </div>

      {/* Sidebar */}
      <div className={`sidebar ${isSidebarOpen ? 'open' : 'closed'}`}>
        <div className="sidebar-header">
          <h2>Conversations</h2>
        </div>

        <div className="history-sidebar">
          <ul className="history-list">
            {historicalConversations.map((conv) => (
              <li key={conv.id} className="history-item">
                <div className="history-avatar">{conv.name[0]}</div>
                <div className="history-text">
                  <strong>{conv.name}</strong>
                  <p>{conv.summary}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>

        <div className="sidebar-footer">
          <button className="discover-button">Discover Our Products</button>
          <div className="footer-item">User</div>
          <div className="footer-item">Settings</div>
        </div>
      </div>

      {/* Main Content */}
      <div className="main-content">
        <header className="header">
          <div className="voice-select-container">
            <label htmlFor="voice-select">Select Voice:</label>
            <select
              id="voice-select"
              className="dropdown"
              value={voiceKey}
              onChange={(e) => setVoiceKey(e.target.value)}
            >
              {voiceOptions.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </div>
        </header>

        {/* Overlay for Upload/Use Existing Options */}
        {showOverlay && (
          <div className="center-overlay">
            <div className="upload-box">
              <span className="upload-icon">📄</span>
              <p className="upload-text">Upload Deposition</p>
              <button className="upload-btn" onClick={() => document.getElementById("file-upload").click()}>Upload</button>
            </div>

            <div className="existing-box">
              <span className="existing-icon">📂</span>
              <p className="existing-text">Use Existing</p>
              <select
                className="existing-dropdown"
                value={selectedDeposition}
                onChange={handleDepositionSelect}
              >
                <option value="">Select Deposition</option>
                {depositionOptions.map((option, index) => (
                  <option key={index} value={option}>{option}</option>
                ))}
              </select>
            </div>
          </div>
        )}

        <div className="chat-container">
          <div className="chat-area">
            <div className="conversation">
              {conversationHistory.map((entry, index) => (
                <div key={index} className={`message ${entry.role === 'You' ? 'user' : 'bot'}`}>
                  <span className="message-info">
                    <strong>{entry.role}</strong> <span className="timestamp">{entry.timestamp}</span>
                  </span>
                  <div className="message-text">
                    {entry.text}
                    {entry.file && (
                      <div className="file-attachment">
                        📎 <a href="#" onClick={(e) => e.preventDefault()}>{entry.file}</a>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
            <div className="input-section">
              <input
                type="text"
                value={textInput}
                onChange={(e) => setTextInput(e.target.value)}
                placeholder="Enter your message"
                className="text-input"
              />
              <input
                type="file"
                onChange={handleFileChange}
                style={{ display: 'none' }}
                id="file-upload"
              />
              <label htmlFor="file-upload" className="upload-button">📎</label>
              <button onClick={handleTextSubmit} className="submit-button">Send</button>
              <div className="recorder-container">
                <Recorder
                  onRecordingComplete={(blob) => handleAudioStop(blob)}
                  onNotAllowed={(err) => console.error('Permission denied', err)}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
