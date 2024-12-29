module.exports = async function (context, req) {
    try {
        const AZURE_STORAGE_CONNECTION_STRING = process.env.AZURE_STORAGE_CONNECTION_STRING;
        const CONTAINER_NAME = "dev-docs-save";

        if (!AZURE_STORAGE_CONNECTION_STRING) {
            throw new Error("Azure Storage connection string is not set.");
        }

        context.res = {
            status: 200,
            body: {
                connectionString: AZURE_STORAGE_CONNECTION_STRING,
                containerName: CONTAINER_NAME,
            },
        };
    } catch (error) {
        context.log.error("Error retrieving connection string:", error.message);
        context.res = {
            status: 500,
            body: "Failed to retrieve connection string.",
        };
    }
};
