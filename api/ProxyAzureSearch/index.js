const axios = require('axios');

module.exports = async function (context, req) {
    const searchApiKey = process.env.AZURE_SEARCH_API_KEY;
    const searchEndpoint = process.env.AZURE_SEARCH_ENDPOINT;
    const indexName = "dev-001-v001"; // Your Azure Search index name

    if (!searchApiKey || !searchEndpoint) {
        context.res = {
            status: 500,
            body: "Azure Search API Key or Endpoint is not set in environment variables.",
        };
        return;
    }

    try {
        const query = req.body?.query || ""; // Extract the search query from the request body
        const top = req.body?.top || 5; // Extract optional 'top' parameter for number of results

        // Build the Azure Search query
        const searchUrl = `${searchEndpoint}/indexes/${indexName}/docs`;
        const searchPayload = { search: query, top };

        // Forward the request to Azure Cognitive Search
        const response = await axios.post(searchUrl, searchPayload, {
            headers: {
                "Content-Type": "application/json",
                "api-key": searchApiKey,
            },
        });

        // Return the search results as the response
        context.res = {
            status: 200,
            body: response.data,
        };
    } catch (error) {
        context.res = {
            status: error.response?.status || 500,
            body: error.response?.data || "An unexpected error occurred.",
        };
    }
};
