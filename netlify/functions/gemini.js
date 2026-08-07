// Netlify Functions Entrypoint Proxy
const handler = require('../../api/gemini.js');

exports.handler = async (event, context) => {
    let body = {};
    try { body = JSON.parse(event.body || '{}'); } catch(e) {}

    let responseData = {};
    let statusCode = 200;

    const resMock = {
        setHeader: () => {},
        status: (code) => {
            statusCode = code;
            return {
                json: (data) => { responseData = data; },
                end: () => {}
            };
        }
    };

    const reqMock = {
        method: event.httpMethod,
        body: body
    };

    await handler(reqMock, resMock);

    return {
        statusCode: statusCode,
        headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
        },
        body: JSON.stringify(responseData)
    };
};
