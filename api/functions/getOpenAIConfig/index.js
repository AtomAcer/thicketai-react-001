module.exports = async function (context, req) {
    context.res = {
        status: 200,
        body: {
            endpoint: 'hello',
            key: 'bye'
        }
    };
};

// module.exports = async function (context, req) {
//     context.res = {
//         status: 200,
//         body: {
//             endpoint: process.env['REACT_APP_AZURE_OPENAI_ENDPOINT'],
//             key: process.env['REACT_APP_AZURE_OPENAI_KEY']
//         }
//     };
// };

// async function timerTrigger1(myTimer, context) {
//     context.log(`WEBSITE_SITE_NAME: ${process.env["WEBSITE_SITE_NAME"]}`);
// }