const { BlobServiceClient, StorageSharedKeyCredential, generateBlobSASQueryParameters } = require("@azure/storage-blob");

module.exports = async function (context, req) {
    try {
        const AZURE_STORAGE_ACCOUNT_NAME = process.env.AZURE_STORAGE_ACCOUNT_NAME;
        const AZURE_STORAGE_ACCOUNT_KEY = process.env.AZURE_STORAGE_ACCOUNT_KEY;
        const containerName = "dev-docs-save";

        if (!AZURE_STORAGE_ACCOUNT_NAME || !AZURE_STORAGE_ACCOUNT_KEY) {
            throw new Error("Storage account name or key is missing. Check your environment variables.");
        }

        // Initialize the Shared Key Credential
        const sharedKeyCredential = new StorageSharedKeyCredential(
            AZURE_STORAGE_ACCOUNT_NAME,
            AZURE_STORAGE_ACCOUNT_KEY
        );

        // Initialize Blob Service Client
        const blobServiceClient = new BlobServiceClient(
            `https://${AZURE_STORAGE_ACCOUNT_NAME}.blob.core.windows.net`,
            sharedKeyCredential
        );

        // Get container client
        const containerClient = blobServiceClient.getContainerClient(containerName);

        // Set SAS permissions and expiry time
        const permissions = "rw"; // Read and write permissions
        const expiryTime = new Date(Date.now() + 3600 * 1000);

        // Generate SAS query parameters
        const sasQueryParams = generateBlobSASQueryParameters({
            containerName,
            permissions,
            expiryTime,
            sharedKeyCredential,
        });

        // Construct the SAS token
        const sasToken = `?${sasQueryParams.toString()}`;

        // Return the SAS token and container URL
        context.res = {
            status: 200,
            body: {
                sasToken,
                containerUrl: containerClient.url,
            },
        };
    } catch (error) {
        context.log.error("Failed to generate SAS token:", error.message);
        context.res = {
            status: 500,
            body: { error: "Failed to generate SAS token.", details: error.message },
        };
    }
};
