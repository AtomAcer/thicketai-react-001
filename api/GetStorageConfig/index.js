const { BlobServiceClient, StorageSharedKeyCredential, generateBlobSasQueryParameters, ContainerSasPermissions } = require("@azure/storage-blob");

module.exports = async function (context, req) {
    try {
        const AZURE_STORAGE_ACCOUNT_NAME = process.env.AZURE_STORAGE_ACCOUNT_NAME;
        const AZURE_STORAGE_ACCOUNT_KEY = process.env.AZURE_STORAGE_ACCOUNT_KEY;
        const CONTAINER_NAME = "dev-docs-save";

        if (!AZURE_STORAGE_ACCOUNT_NAME || !AZURE_STORAGE_ACCOUNT_KEY) {
            throw new Error("Azure Storage account name or key is missing.");
        }

        const sharedKeyCredential = new StorageSharedKeyCredential(AZURE_STORAGE_ACCOUNT_NAME, AZURE_STORAGE_ACCOUNT_KEY);
        const blobServiceClient = new BlobServiceClient(
            `https://${AZURE_STORAGE_ACCOUNT_NAME}.blob.core.windows.net`,
            sharedKeyCredential
        );

        const containerClient = blobServiceClient.getContainerClient(CONTAINER_NAME);

        // Generate SAS token
        const sasToken = generateBlobSasQueryParameters(
            {
                containerName: CONTAINER_NAME,
                permissions: ContainerSasPermissions.parse("rwd"), // Read, Write, Delete permissions
                startsOn: new Date(),
                expiresOn: new Date(new Date().valueOf() + 3600 * 1000), // 1-hour expiration
            },
            sharedKeyCredential
        ).toString();

        context.res = {
            status: 200,
            body: {
                sasToken,
                containerUrl: containerClient.url,
            },
        };
    } catch (error) {
        context.log.error("Error generating SAS token:", error.message);
        context.res = {
            status: 500,
            body: "Failed to generate SAS token.",
        };
    }
};
