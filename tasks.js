let tasks = [
    { id: 1, subject: "Full-stack Week 1 Server Infrastructure", startDate: "2026-01-13T09:00:00.000Z", endDate: "2026-01-13T11:00:00.000Z", description: "Set up cloud server environment. Configure database architecture. Implement basic security protocols. Create deployment pipeline.", team: "Full-Stack", status: "pending" },
    { id: 2, subject: "Full-stack Week 1 Database Setup", startDate: "2026-01-14T09:00:00.000Z", endDate: "2026-01-14T11:00:00.000Z", description: "Design database schemas. Set up user tables and relationships. Implement data migration scripts. Create backup systems.", team: "Full-Stack", status: "pending" },
    { id: 3, subject: "UI/UX Week 1 Design System", startDate: "2026-01-13T11:00:00.000Z", endDate: "2026-01-13T13:00:00.000Z", description: "Create brand color palette. Design typography system. Build component library. Establish design principles.", team: "UI/UX", status: "pending" },
    { id: 4, subject: "UI/UX Week 1 Wireframes", startDate: "2026-01-14T11:00:00.000Z", endDate: "2026-01-14T13:00:00.000Z", description: "Create homepage wireframes. Design user onboarding flow. Map seller dashboard layout. Prototype product listing pages.", team: "UI/UX", status: "pending" },
    { id: 5, subject: "Marketing Week 1 Competitor Analysis", startDate: "2026-01-13T14:00:00.000Z", endDate: "2026-01-13T16:00:00.000Z", description: "Research 5 competitor platforms. Analyze their pricing strategies. Study user acquisition methods. Identify market gaps.", team: "Marketing", status: "pending" },
    { id: 6, subject: "Marketing Week 1 Target Audience", startDate: "2026-01-14T14:00:00.000Z", endDate: "2026-01-14T16:00:00.000Z", description: "Define primary user personas. Research creator demographics. Identify buyer pain points. Create audience segmentation.", team: "Marketing", status: "pending" },
    { id: 7, subject: "Support Week 1 Helpdesk Setup", startDate: "2026-01-13T16:00:00.000Z", endDate: "2026-01-13T17:30:00.000Z", description: "Choose helpdesk software. Set up ticketing system. Create support categories. Configure automation rules.", team: "Support", status: "planned" },
    { id: 8, subject: "Support Week 1 Documentation", startDate: "2026-01-14T16:00:00.000Z", endDate: "2026-01-14T17:30:00.000Z", description: "Create documentation structure. Write getting started guides. Develop FAQ templates. Set up knowledge base.", team: "Support", status: "planned" },
    { id: 9, subject: "Content Week 1 Content Calendar", startDate: "2026-01-13T13:00:00.000Z", endDate: "2026-01-13T15:00:00.000Z", description: "Plan 3-month content calendar. Research trending topics. Schedule blog post topics. Plan social media content.", team: "Content", status: "in-progress" },
    { id: 10, subject: "Content Week 1 Platform Setup", startDate: "2026-01-14T13:00:00.000Z", endDate: "2026-01-14T15:00:00.000Z", description: "Set up blog platform. Create social media accounts. Configure email newsletter. Set up analytics tracking.", team: "Content", status: "in-progress" },
];

function getTasks() {
    return tasks;
}

module.exports = {
    getTasks
};
