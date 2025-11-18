let comments = [
    {
        id: 1,
        username: 'Jonasmdluli',
        team: 'Full-Stack',
        text: 'If any of the team member is facing challenges on their weekly task, they can post their comments here with the challenge and when their submission is due',
        timestamp: new Date('2025-11-17T14:05:25').toISOString()
    }
];

function getComments() {
    return comments;
}

function addComment(commentData) {
    const newComment = {
        id: Date.now(),
        ...commentData,
        timestamp: new Date().toISOString()
    };
    comments.unshift(newComment);
    return newComment;
}

module.exports = {
    getComments,
    addComment
};
