import React, { useState } from 'react';
import { BlobServiceClient } from "@azure/storage-blob";
import { SearchClient, AzureKeyCredential } from "@azure/search-documents";
import { Buffer } from 'buffer';
import axios from 'axios';
import './styles.css';

// Make Buffer globally available
window.Buffer = Buffer;

function App() {
  const [textInput, setTextInput] = useState('');
  const [setFileInput] = useState(null);
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

  // Dummy use for 'handleResponse'
  console.log('Dummy use of setHistoricalConversations:', typeof setHistoricalConversations);

  // Azure Cognitive Search Integration
  const queryAzureSearch = async (query) => {
    try {
      // Fetch Azure Search API configuration
      const { data: { apiKey: azureSearchApiKey, endpoint: azureSearchEndpoint } } =
        await axios.get("/api/GetAISearchConfig");

      if (!azureSearchApiKey || !azureSearchEndpoint) {
        throw new Error("Missing Azure Search configuration");
      }

      const indexName = "dev-001-v001";

      // Initialize SearchClient
      const searchClient = new SearchClient(
        azureSearchEndpoint,
        indexName,
        new AzureKeyCredential(azureSearchApiKey)
      );

      // Search options
      const searchOptions = {
        top: 5, // Limit to top 5 results
        select: "*", // Retrieve all fields dynamically
      };

      // Perform the search
      const searchResults = await searchClient.search(query, searchOptions);

      const formattedResults = [];
      const answers = searchResults["@search.answers"] || []; // Extract semantic answers if present

      // Format semantic answers
      if (answers.length > 0) {
        formattedResults.push("Semantic Answers:");
        answers.forEach((answer, idx) => {
          formattedResults.push(`Answer ${idx + 1}:`);
          formattedResults.push(`Text: ${answer.text}`);
          if (answer.highlights) {
            formattedResults.push(`Highlights: ${answer.highlights}`);
          }
          formattedResults.push(`Score: ${answer.score}\n`);
        });
      }

      // Process search documents dynamically
      formattedResults.push("Search Results:");
      for await (const result of searchResults.results) {
        const document = result.document;

        formattedResults.push(`Result:`);
        Object.entries(document).forEach(([key, value]) => {
          if (!key.startsWith("@")) { // Exclude metadata fields like @search.score
            formattedResults.push(`${key}: ${value || "Not available"}`);
          }
        });

        // Include special fields like score and captions if available
        const captions = document["@search.captions"] || [];
        const captionText = captions.length > 0 ? captions[0].text : "No captions available.";
        formattedResults.push(`Caption: ${captionText}`);
        formattedResults.push(`Score: ${result["@search.score"] || "N/A"}`);
        formattedResults.push(`Reranker Score: ${result["@search.rerankerScore"] || "N/A"}\n`);
      }

      if (formattedResults.length === 0) {
        return "No relevant information found in the search index.";
      }

      return formattedResults;
    } catch (error) {
      console.error("Error querying Azure Cognitive Search:", error);

      if (error.response) {
        const status = error.response.status;
        const message = error.response.data?.error?.message || error.response.statusText;
        throw new Error(`Azure Search API error (${status}): ${message}`);
      }

      throw new Error(`Azure Search error: ${error.message}`);
    }
  };

  // Handle text input submission
  const handleTextSubmit = async () => {
    if (!textInput.trim()) return;

    const userMessage = {
      role: "user",
      text: textInput,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };
    const updatedHistory = [...conversationHistory, userMessage];

    setConversationHistory(updatedHistory);
    setTextInput("");

    try {
      const contextFromSearch = await queryAzureSearch(textInput);

      const prompt = `
        Based on the following context, answer the question below strictly using the given information:
        Context:
        ${contextFromSearch}

        Question:
        ${textInput}
      `;

      const configResponse = await axios.get("/api/GetOpenaiConfig");
      const { apiKey: azureApiKey, endpoint: azureEndpoint } = configResponse.data;

      const payload = {
        messages: [{ role: "system", content: prompt }],
        max_tokens: 5000,
        temperature: 0.5,
      };

      const response = await axios.post(
        `${azureEndpoint}/openai/deployments/gpt-4o-mini/chat/completions?api-version=2024-08-01-preview`,
        payload,
        {
          headers: {
            "api-key": azureApiKey,
            "Content-Type": "application/json",
          },
        }
      );

      const answer = response.data.choices[0]?.message?.content.trim() || "No response received.";
      setConversationHistory((prev) => [...prev, { role: "assistant", text: answer }]);
    } catch (error) {
      console.error("Error:", error.response?.data || error.message);
      setConversationHistory((prev) => [
        ...prev,
        { role: "assistant", text: "An error occurred while processing your request. Please try again." },
      ]);
    }
  };

  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);

  const toggleRecording = () => setIsRecording(!isRecording);

  const handleKeyEnter = (event) => {
    if (event.key === "Enter") handleTextSubmit();
  };

  const handleFileChange = async (event) => {
    const file = event.target.files[0];
    if (!file) return;
    setFileInput(file);
    setShowOverlay(false);

    try {
      const response = await axios.get('/api/GetStorageConfig');
      const { sasToken, containerUrl } = response.data;

      if (!sasToken || !containerUrl) {
        throw new Error("Failed to retrieve SAS token or container URL.");
      }

      const blobServiceClient = new BlobServiceClient(`${containerUrl}?${sasToken}`);
      const containerClient = blobServiceClient.getContainerClient();
      const blobClient = containerClient.getBlockBlobClient(file.name);

      await blobClient.uploadData(file, {
        blobHTTPHeaders: { blobContentType: file.type },
      });

      console.log("File uploaded successfully to Azure Blob Storage");
    } catch (error) {
      console.error("Error uploading file to Azure Blob Storage:", error);
    }
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
