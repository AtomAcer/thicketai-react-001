module.exports = async function (context, req) {
    try {
        const AZURE_STORAGE_ACCOUNT_NAME = process.env.AZURE_STORAGE_ACCOUNT_NAME;
        const AZURE_STORAGE_ACCOUNT_KEY = process.env.AZURE_STORAGE_ACCOUNT_KEY;

        if (!AZURE_STORAGE_ACCOUNT_NAME || !AZURE_STORAGE_ACCOUNT_KEY) {
            throw new Error("Storage account name or key is not set.");
        }

        context.res = {
            status: 200,
            body: {
                accountName: AZURE_STORAGE_ACCOUNT_NAME,
                accountKey: AZURE_STORAGE_ACCOUNT_KEY,
                containerName: "dev-docs-save",
            },
        };
    } catch (error) {
        context.log.error("Error sending storage credentials:", error.message);
        context.res = {
            status: 500,
            body: "Failed to retrieve storage credentials.",
        };
    }
};
