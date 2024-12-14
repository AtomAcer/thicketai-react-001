// Load environment variables
require('dotenv').config();

// Import necessary packages
const express = require('express');
const multer = require('multer');
const axios = require('axios');
const fs = require('fs');
const cors = require('cors');
const path = require('path');

const app = express();
const upload = multer({ dest: 'uploads/' });

// Enable CORS for requests from http://localhost:3000
app.use(cors({
    origin: 'http://localhost:3000',
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Document Processing Endpoint
app.post('/api/process-document', upload.single('file'), async (req, res) => {
    const filePath = req.file.path;
    try {
        const fileText = fs.readFileSync(filePath, 'utf8'); // Assuming it's a text file
        console.log("Document processed:", fileText.slice(0, 100)); // Log first 100 characters for demo
        res.json({ message: 'Document processed successfully' });
    } catch (error) {
        console.error("Error processing document:", error);
        res.status(500).json({ error: "Document processing failed" });
    } finally {
        fs.unlinkSync(filePath); // Delete file after processing
    }
});

// Audio Transcription Endpoint
app.post('/api/transcribe-audio', upload.single('file'), async (req, res) => {
    const filePath = req.file.path;
    try {
        const response = await axios.post(
            'https://api.openai.com/v1/audio/transcriptions',
            {
                file: fs.createReadStream(filePath),
                model: 'whisper-1',
                response_format: 'text',
                language: 'en',
            },
            {
                headers: {
                    'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
                    'Content-Type': 'multipart/form-data',
                },
            }
        );

        // Send transcription back to client in JSON format
        res.json({ transcript: response.data.text });
    } catch (error) {
        console.error("Error transcribing audio:", error.response?.data || error.message);
        res.status(500).json({ error: "Transcription failed" });
    } finally {
        fs.unlinkSync(filePath); // Clean up uploaded file
    }
});

// TTS Generation Endpoint
app.post('/api/generate-speech', async (req, res) => {
    const { text, voice } = req.body;
    try {
        // Placeholder for TTS service - send mock response here
        const audioData = Buffer.from("Audio data here", "utf-8"); // Mocked audio data for demonstration
        res.setHeader('Content-Type', 'audio/wav'); // Set correct content type for audio
        res.send(audioData);
    } catch (error) {
        console.error("Error generating speech:", error);
        res.status(500).json({ error: "TTS generation failed" });
    }
});

// Start the server
const PORT = 5001;
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
    console.log("API Key:", process.env.REACT_APP_OPENAI_API_KEY);
    console.log("API Key:", process.env.OPENAI_API_KEY);
});
