export default async function (context, req) {
    context.res = {
        status: 200,
        body: {
            endpoint: 'hello',
            key: 'bye'
        }
    };
};