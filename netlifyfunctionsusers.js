// netlify/functions/users.js
let users = [
    { username: 'admin', password: 'password', team: 'Administrator', isOnline: false, lastLogin: null, lastLogout: null },
    { username: 'dev', password: 'password', team: 'Full-Stack', isOnline: false, lastLogin: null, lastLogout: null },
    { username: 'designer', password: 'password', team: 'UI/UX', isOnline: false, lastLogin: null, lastLogout: null },
    { username: 'marketer', password: 'password', team: 'Marketing', isOnline: false, lastLogin: null, lastLogout: null },
    { username: 'support', password: 'password', team: 'Support', isOnline: false, lastLogin: null, lastLogout: null },
    { username: 'writer', password: 'password', team: 'Content', isOnline: false, lastLogin: null, lastLogout: null }
];

exports.handler = async function (event, context) {
    // Set CORS headers
    const headers = {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS'
    };

    // Handle OPTIONS request for CORS
    if (event.httpMethod === 'OPTIONS') {
        return {
            statusCode: 200,
            headers,
            body: ''
        };
    }

    try {
        if (event.httpMethod === 'GET') {
            return {
                statusCode: 200,
                headers,
                body: JSON.stringify(users)
            };
        }

        if (event.httpMethod === 'POST') {
            const body = JSON.parse(event.body);
            const { username, updates, action } = body;
            
            if (action === 'update') {
                const userIndex = users.findIndex(u => u.username === username);
                if (userIndex !== -1) {
                    users[userIndex] = { ...users[userIndex], ...updates };
                    return {
                        statusCode: 200,
                        headers,
                        body: JSON.stringify(users[userIndex])
                    };
                }
                return {
                    statusCode: 404,
                    headers,
                    body: JSON.stringify({ error: 'User not found' })
                };
            }

            // Handle login verification
            if (action === 'login') {
                const user = users.find(u => u.username === username && u.password === updates.password);
                if (user) {
                    return {
                        statusCode: 200,
                        headers,
                        body: JSON.stringify(user)
                    };
                }
                return {
                    statusCode: 401,
                    headers,
                    body: JSON.stringify({ error: 'Invalid credentials' })
                };
            }
        }

        return {
            statusCode: 405,
            headers,
            body: JSON.stringify({ error: 'Method Not Allowed' })
        };

    } catch (error) {
        return {
            statusCode: 500,
            headers,
            body: JSON.stringify({ error: error.message })
        };
    }
};
