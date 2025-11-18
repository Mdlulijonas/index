// Shared storage for all submissions
let submissions = [];

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
                    body: JSON.stringify(submissions)
                };

            case 'POST':
                const newSubmission = JSON.parse(event.body);
                const submission = {
                    id: Date.now(),
                    ...newSubmission,
                    timestamp: new Date().toISOString()
                };
                submissions.unshift(submission);
                
                return {
                    statusCode: 201,
                    headers: {
                        'Content-Type': 'application/json',
                        'Access-Control-Allow-Origin': '*',
                        'Access-Control-Allow-Headers': 'Content-Type'
                    },
                    body: JSON.stringify(submission)
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
