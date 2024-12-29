import React, { useState, useCallback } from 'react';
import { BlobServiceClient } from "@azure/storage-blob";
import { Buffer } from 'buffer';
import axios from 'axios';
import './styles.css';

// Make Buffer globally available
window.Buffer = Buffer;

function App() {
  const [textInput, setTextInput] = useState('');
  const [fileInput, setFileInput] = useState(null);
  const [selectedDeposition, setSelectedDeposition] = useState('');
  const [conversationHistory, setConversationHistory] = useState([]);
  const [voiceKey, setVoiceKey] = useState('Adam');
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [showOverlay, setShowOverlay] = useState(true);
  const [isRecording, setIsRecording] = useState(false);
  const [historicalConversations, setHistoricalConversations] = useState([
    { id: 1, name: "John Doe", summary: "Discussed project scope and responsibilities." },
    { id: 2, name: "Jane Smith", summary: "Recapped client feedback and contract terms." },
    { id: 3, name: "Alex Brown", summary: "Answered questions about app usage and features." },
  ]);

  const generateVoiceOutput = useCallback(async (text) => {
    try {
      const response = await axios.post("http://localhost:5001/api/generate-speech", { text, voice: voiceKey });
      const audioBlob = new Blob([response.data], { type: 'audio/wav' });
      const audioUrl = URL.createObjectURL(audioBlob);
      new Audio(audioUrl).play();
    } catch (error) {
      console.error("Error generating speech:", error);
    }
  }, [voiceKey]);

  // Dummy usage for unused variables
  React.useEffect(() => {
    if (fileInput) {
      console.log('File input used:', fileInput.name);
    }

    setHistoricalConversations((prev) => {
      console.log('Historical conversations dummy usage:', prev.length);
      return prev;
    });

    // Dummy use for 'handleResponse'
    console.log('Dummy use of handleResponse:', typeof handleResponse);

    // Dummy use for 'generateVoiceOutput'
    console.log('Using generateVoiceOutput in useEffect:', typeof generateVoiceOutput);

    // Dummy use for 'formatPrompt'
    console.log('Dummy use of formatPrompt:', typeof formatPrompt);
  }, [fileInput, setHistoricalConversations, generateVoiceOutput]);

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  const toggleRecording = () => {
    setIsRecording(!isRecording);
  };

  const handleKeyEnter = (event) => {
    if (event.key === 'Enter') {
      // Call your function here
      console.log('Enter key pressed!');
      // Example: Submit a form
      handleTextSubmit();
    }
  };

  const handleTextSubmit = async () => {
    if (!textInput.trim()) return;

    const userMessage = {
      role: 'user',
      text: textInput,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
    const updatedHistory = [...conversationHistory, userMessage];

    setConversationHistory(updatedHistory);
    setTextInput('');

    try {
      // Fetch the API key and endpoint from the Azure Function
      const configResponse = await axios.get('/api/GetOpenaiConfig'); // Ensure this matches your function URL
      const { apiKey: azureApiKey, endpoint: azureEndpoint } = configResponse.data;

      if (!azureEndpoint || !azureApiKey) {
        throw new Error("Failed to retrieve keys: Ensure the Azure Function is returning the correct data.");
      }

      const payload = {
        messages: [
          { role: 'system', content: 'You are a helpful assistant.' },
          ...updatedHistory.map(msg => ({ role: msg.role.toLowerCase(), content: msg.text })),
        ],
        max_tokens: 5000,
        temperature: 0.5,
      };

      console.log('Payload:', payload); // Debugging the payload

      // Make the OpenAI API call using the retrieved keys
      const response = await axios.post(
        `${azureEndpoint}/openai/deployments/gpt-4o-mini/chat/completions?api-version=2024-08-01-preview`,
        payload,
        {
          headers: {
            'api-key': azureApiKey,
            'Content-Type': 'application/json',
          },
        }
      );

      const answer = response.data.choices[0]?.message?.content.trim() || 'No response received.';
      setConversationHistory(prev => [...prev, { role: 'assistant', text: answer }]);
    } catch (error) {
      console.error("Error:", error.response?.data || error.message);
      setConversationHistory(prev => [
        ...prev,
        { role: 'assistant', text: 'An error occurred while processing your request. Please try again.' },
      ]);
    }
  };

  // const handleFileChange = async (event) => {
  //   const file = event.target.files[0];
  //   if (!file) return;
  //   setFileInput(file);
  //   setShowOverlay(false);

  //   const formData = new FormData();
  //   formData.append("file", file);

  //   try {
  //     await axios.post("http://localhost:5001/api/process-document", formData);
  //     console.log("Document processed successfully");
  //   } catch (error) {
  //     console.error("Error processing document:", error);
  //   }
  // };

  const handleFileChange = async (event) => {
    const file = event.target.files[0];
    if (!file) return;
    setFileInput(file);
    setShowOverlay(false);

    try {
      // Step 1: Fetch SAS Token and Container URL from Azure Function
      const response = await axios.get('/api/GetStorageConfig'); // Azure Function endpoint
      const { sasToken, containerUrl } = response.data;

      if (!sasToken || !containerUrl) {
        throw new Error("Failed to retrieve SAS token or container URL.");
      }

      // Step 2: Initialize Blob Service Client with SAS token
      const blobServiceClient = new BlobServiceClient(`${containerUrl}?${sasToken}`);
      const containerClient = blobServiceClient.getContainerClient();

      // Step 3: Upload the File
      const blobClient = containerClient.getBlockBlobClient(file.name);
      await blobClient.uploadData(file, {
        blobHTTPHeaders: { blobContentType: file.type },
      });

      console.log("File uploaded successfully to Azure Blob Storage");
    } catch (error) {
      console.error("Error uploading file to Azure Blob Storage:", error);
    }
  };

  const handleResponse = (answer) => {
    const botMessage = { role: 'Bot', text: answer, timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) };
    setConversationHistory(prev => [...prev, botMessage]);
  };

  // const generateVoiceOutput = async (text) => {
  //   try {
  //     const response = await axios.post("http://localhost:5001/api/generate-speech", { text, voice: voiceKey });
  //     const audioBlob = new Blob([response.data], { type: 'audio/wav' });
  //     const audioUrl = URL.createObjectURL(audioBlob);
  //     new Audio(audioUrl).play();
  //   } catch (error) {
  //     console.error("Error generating speech:", error);
  //   }
  // };

  const formatPrompt = (history, input) => {
    let prompt = "You are a helpful assistant.\n";
    history.forEach(entry => prompt += `${entry.role}: ${entry.text}\n`);
    prompt += `User: ${input}\nAssistant:`;
    return prompt;
  };

  return (
    <div className="app-container">
      <div className="top-ribbon">
        <div className="sidebar-icon" onClick={toggleSidebar}>💬</div>
        <h1>Cross Examination</h1>
      </div>

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
              {['Adam', 'Onyx', 'Nova', 'Ocean'].map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </div>
        </header>

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
                onChange={(e) => setSelectedDeposition(e.target.value)}
              >
                <option value="">Select Deposition</option>
                {['Deposition 1', 'Deposition 2', 'Deposition 3'].map((option, index) => (
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
                onKeyDown={handleKeyEnter}
              />
              <input
                type="file"
                onChange={handleFileChange}
                style={{ display: 'none' }}
                id="file-upload"
              />
              <label htmlFor="file-upload" className="upload-button">📎</label>
              <button onClick={handleTextSubmit} className="submit-button">Submit</button>
              <div className="recorder-container">
                <button onClick={toggleRecording} className="microphone-button">
                  {isRecording ? 'Stop' : 'Start'} Recording
                </button>
                {isRecording && (
                  <div className="recording-placeholder">
                    Recording functionality is temporarily disabled.
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
