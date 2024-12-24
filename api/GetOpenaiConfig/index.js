// Path: api/GetOpenaiConfig/index.js

module.exports = async function (context, req) {
    // Read OpenAI key and endpoint from environment variables
    const apiKey = process.env.REACT_APP_AZURE_OPENAI_KEY;
    const endpoint = process.env.REACT_APP_AZURE_OPENAI_ENDPOINT;

    if (!apiKey || !endpoint) {
        // Return error if the environment variables are not set
        context.res = {
            status: 500,
            body: "API Key or Endpoint is not set in environment variables.",
        };
        return;
    }

    try {
        // Return the OpenAI key and endpoint as JSON
        context.res = {
            status: 200,
            body: {
                apiKey: apiKey,        // OpenAI Key
                endpoint: endpoint,    // OpenAI Endpoint
            },
        };
    } catch (error) {
        // Handle unexpected errors
        context.res = {
            status: 500,
            body: "An unexpected error occurred: " + error.message,
        };
    }
};
