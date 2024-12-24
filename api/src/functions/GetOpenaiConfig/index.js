// Path: api/callOpenAI/index.js

const axios = require('axios');

module.exports = async function (context, req) {
    // Ensure environment variables are configured in Azure portal
    const apiKey = process.env.REACT_APP_AZURE_OPENAI_KEY;
    const endpoint = process.env.REACT_APP_AZURE_OPENAI_ENDPOINT;

    if (!apiKey || !endpoint) {
        context.res = {
            status: 500,
            body: "API Key or Endpoint is not set in environment variables.",
        };
        return;
    }

    try {
        // Extract the payload from the incoming request
        const { prompt, deploymentId } = req.body;

        // Validate input
        if (!prompt || !deploymentId) {
            context.res = {
                status: 400,
                body: "Invalid input. 'prompt' and 'deploymentId' are required.",
            };
            return;
        }

        // Make the request to OpenAI API
        const response = await axios.post(
            `${endpoint}/openai/deployments/${deploymentId}/chat/completions?api-version=2023-03-15-preview`,
            {
                messages: [{ role: "user", content: prompt }],
                max_tokens: 1000,
            },
            {
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${apiKey}`,
                },
            }
        );

        // Respond with the OpenAI response
        context.res = {
            status: 200,
            body: response.data,
        };
    } catch (error) {
        // Handle errors
        context.res = {
            status: error.response?.status || 500,
            body: error.message,
        };
    }
};
