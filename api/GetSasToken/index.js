const { BlobServiceClient } = require("@azure/storage-blob");

module.exports = async function (context, req) {
    const AZURE_STORAGE_CONNECTION_STRING = process.env.AZURE_STORAGE_CONNECTION_STRING;
    const CONTAINER_NAME = "dev-docs-save";

    const blobServiceClient = BlobServiceClient.fromConnectionString(AZURE_STORAGE_CONNECTION_STRING);
    const containerClient = blobServiceClient.getContainerClient(CONTAINER_NAME);

    const blobSas = containerClient.generateSasUrl({
        permissions: "rwd", // Read, write, delete permissions
        startsOn: new Date(),
        expiresOn: new Date(new Date().valueOf() + 3600 * 1000), // 1-hour expiration
    });

    context.res = {
        status: 200,
        body: {
            sasToken: blobSas.split('?')[1],
            containerUrl: blobSas.split('?')[0],
        },
    };
};
