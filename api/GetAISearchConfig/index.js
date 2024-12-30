module.exports = async function (context, req) {
    // Read Azure Cognitive Search key and endpoint from environment variables
    const searchApiKey = process.env.AZURE_SEARCH_API_KEY;
    const searchEndpoint = process.env.AZURE_SEARCH_ENDPOINT;

    if (!searchApiKey || !searchEndpoint) {
        // Return error if the environment variables are not set
        context.res = {
            status: 500,
            body: "Azure Search API Key or Endpoint is not set in environment variables.",
        };
        return;
    }

    try {
        // Return the Azure Search key and endpoint as JSON
        context.res = {
            status: 200,
            body: {
                apiKey: searchApiKey,     // Azure Cognitive Search API Key
                endpoint: searchEndpoint, // Azure Cognitive Search Endpoint
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
