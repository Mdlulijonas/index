// Shared storage for all tasks
let tasks = [
    { id: 1, subject: "Full-stack Week 1 Server Infrastructure", startDate: "2026-01-13T09:00:00.000Z", endDate: "2026-01-13T11:00:00.000Z", description: "Set up cloud server environment. Configure database architecture. Implement basic security protocols. Create deployment pipeline.", team: "Full-Stack", status: "pending" },
    { id: 2, subject: "Full-stack Week 1 Database Setup", startDate: "2026-01-14T09:00:00.000Z", endDate: "2026-01-14T11:00:00.000Z", description: "Design database schemas. Set up user tables and relationships. Implement data migration scripts. Create backup systems.", team: "Full-Stack", status: "pending" },
    { id: 3, subject: "UI/UX Week 1 Design System", startDate: "2026-01-13T11:00:00.000Z", endDate: "2026-01-13T13:00:00.000Z", description: "Create brand color palette. Design typography system. Build component library. Establish design principles.", team: "UI/UX", status: "pending" },
    { id: 4, subject: "UI/UX Week 1 Wireframes", startDate: "2026-01-14T11:00:00.000Z", endDate: "2026-01-14T13:00:00.000Z", description: "Create homepage wireframes. Design user onboarding flow. Map seller dashboard layout. Prototype product listing pages.", team: "UI/UX", status: "pending" }
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
                    body: JSON.stringify(tasks)
                };

            case 'OPTIONS':
                return {
                    statusCode: 200,
                    headers: {
                        'Access-Control-Allow-Origin': '*',
                        'Access-Control-Allow-Headers': 'Content-Type',
                        'Access-Control-Allow-Methods': 'GET, OPTIONS'
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