import React, { useState } from 'react';
import axios from 'axios';
import Recorder from 'react-mp3-recorder';
import './styles.css';

function App() {
  const [textInput, setTextInput] = useState('');
  const [fileInput, setFileInput] = useState(null);
  const [conversationHistory, setConversationHistory] = useState([]);
  const [voiceKey, setVoiceKey] = useState('Adam');
  const [historicalConversations, setHistoricalConversations] = useState([
    { id: 1, title: "Deposition of John Doe", summary: "Detailed account of John's testimony on project involvement..." },
    { id: 2, title: "Deposition of Jane Smith", summary: "Discussed feedback on contractual obligations..." },
    { id: 3, title: "Deposition of Alex Brown", summary: "Explored insights on client interactions..." },
  ]); // Sample historical data

  const voiceOptions = ['Adam', 'Onyx', 'Nova', 'Ocean'];

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
  };

  return (
    <div className="app-container">
      <div className="sidebar">
        <div className="sidebar-icon" title="Cross Examination">💬</div>
        <div className="sidebar-icon" title="Interview">🎤</div>
      </div>
      <div className="main-content">
        <header className="header">
          <h1>Cross Examination</h1>
          <select
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
        </header>
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
            {/* Input section moved to bottom */}
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

              {/* Recorder wrapped in container for scaling */}
              <div className="recorder-container">
                <Recorder
                  onRecordingComplete={(blob) => handleAudioStop(blob)}
                  onNotAllowed={(err) => console.error('Permission denied', err)}
                />
              </div>
            </div>
          </div>

          {/* Historical Conversations Sidebar */}
          <div className="history-sidebar">
            <h3>History</h3>
            <ul className="history-list">
              {historicalConversations.map((conv) => (
                <li key={conv.id} className="history-item">
                  <strong>{conv.title}</strong>
                  <p>{conv.summary}</p>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
