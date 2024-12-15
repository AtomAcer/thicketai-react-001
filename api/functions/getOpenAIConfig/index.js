module.exports = async function (context, req) {
    context.res = {
        status: 200,
        body: {
            endpoint: process.env.REACT_APP_AZURE_OPENAI_ENDPOINT,
            key: process.env.REACT_APP_AZURE_OPENAI_KEY
        }
    };
};  