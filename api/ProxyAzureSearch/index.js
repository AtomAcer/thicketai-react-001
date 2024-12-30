const axios = require('axios');

module.exports = async function (context, req) {
    const searchApiKey = process.env.AZURE_SEARCH_API_KEY;
    const searchEndpoint = process.env.AZURE_SEARCH_ENDPOINT;
    const indexName = process.env.AZURE_SEARCH_INDEX || "dev-001-v001"; // Use env variable or default

    if (!searchApiKey || !searchEndpoint) {
        context.log.error("Azure Search API Key or Endpoint is missing in environment variables.");
        context.res = {
            status: 500,
            body: "Azure Search API Key or Endpoint is not set in environment variables.",
        };
        return;
    }

    try {
        const query = req.body?.query?.trim() || ""; // Ensure query is a non-empty string
        const top = req.body?.top && Number.isInteger(req.body.top) ? req.body.top : 5; // Default 'top' to 5

        if (!query) {
            context.res = {
                status: 400,
                body: "Search query is required.",
            };
            return;
        }

        const searchUrl = `${searchEndpoint}/indexes/${indexName}/docs?api-version=2021-04-30-Preview`;

        const searchPayload = { search: query, top };

        const response = await axios.post(searchUrl, searchPayload, {
            headers: {
                "Content-Type": "application/json",
                "api-key": searchApiKey,
            },
            timeout: 5000, // Set a 5-second timeout
        });

        context.res = {
            status: 200,
            body: response.data,
        };
    } catch (error) {
        context.log.error("Error during Azure Search API call:", error.stack || error);

        context.res = {
            status: error.response?.status || 500,
            body: error.response?.data || { error: "An unexpected error occurred." },
        };
    }
};
