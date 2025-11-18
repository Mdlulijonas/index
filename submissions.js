let submissions = [];

function getSubmissions() {
    return submissions;
}

function addSubmission(submissionData) {
    const newSubmission = {
        id: Date.now(),
        ...submissionData,
        timestamp: new Date().toISOString()
    };
    submissions.unshift(newSubmission);
    return newSubmission;
}

function deleteSubmission(submissionId) {
    const submissionIndex = submissions.findIndex(s => s.id == submissionId);
    if (submissionIndex === -1) {
        throw new Error('Submission not found');
    }
    submissions.splice(submissionIndex, 1);
}

module.exports = {
    getSubmissions,
    addSubmission,
    deleteSubmission
};
