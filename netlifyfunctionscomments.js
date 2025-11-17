// Shared storage for all comments
let comments = [];

exports.handler = async function (event, context) {
    try {
        switch (event.httpMethod) {
            case 'GET':
                return {
                    statusCode: 200,
                    headers: {
                        'Content-Type': 'application/json',
                        'Access-Control-Allow-Origin': '*',
                        'Access-Control-Allow-Headers': 'Content-Type'
                    },
                    body: JSON.stringify(comments)
                };

            case 'POST':
                const newComment = JSON.parse(event.body);
                const comment = {
                    id: Date.now(),
                    ...newComment,
                    timestamp: new Date().toISOString()
                };
                comments.unshift(comment);
                
                return {
                    statusCode: 201,
                    headers: {
                        'Content-Type': 'application/json',
                        'Access-Control-Allow-Origin': '*',
                        'Access-Control-Allow-Headers': 'Content-Type'
                    },
                    body: JSON.stringify(comment)
                };

            case 'OPTIONS':
                return {
                    statusCode: 200,
                    headers: {
                        'Access-Control-Allow-Origin': '*',
                        'Access-Control-Allow-Headers': 'Content-Type',
                        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS'
                    },
                    body: ''
                };

            default:
                return {
                    statusCode: 405,
                    body: 'Method Not Allowed'
                };
        }
    } catch (error) {
        return {
            statusCode: 500,
            body: JSON.stringify({ error: error.message })
        };
    }
};