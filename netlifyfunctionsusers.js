// Shared storage for all users
let users = [
    { username: 'admin', password: 'password', team: 'Administrator', isOnline: false, lastLogin: null, lastLogout: null },
    { username: 'dev', password: 'password', team: 'Full-Stack', isOnline: false, lastLogin: null, lastLogout: null },
    { username: 'designer', password: 'password', team: 'UI/UX', isOnline: false, lastLogin: null, lastLogout: null },
    { username: 'marketer', password: 'password', team: 'Marketing', isOnline: false, lastLogin: null, lastLogout: null },
    { username: 'support', password: 'password', team: 'Support', isOnline: false, lastLogin: null, lastLogout: null },
    { username: 'writer', password: 'password', team: 'Content', isOnline: false, lastLogin: null, lastLogout: null }
];

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
                    body: JSON.stringify(users)
                };

            case 'POST':
                const { username, updates, action } = JSON.parse(event.body);
                
                if (action === 'update') {
                    const userIndex = users.findIndex(u => u.username === username);
                    if (userIndex !== -1) {
                        users[userIndex] = { ...users[userIndex], ...updates };
                        return {
                            statusCode: 200,
                            headers: {
                                'Content-Type': 'application/json',
                                'Access-Control-Allow-Origin': '*',
                                'Access-Control-Allow-Headers': 'Content-Type'
                            },
                            body: JSON.stringify(users[userIndex])
                        };
                    }
                }

                return {
                    statusCode: 404,
                    body: JSON.stringify({ error: 'User not found' })
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