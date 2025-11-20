const Comment = require('../models/Comment');

exports.create = async (req, res) => {
  try {
    const { submissionId, text } = req.body;
    const comment = new Comment({
      submissionId,
      authorId: req.user._id,
      authorName: req.user.name,
      text
    });
    await comment.save();
    res.json(comment);
  } catch (err) {
    res.sta
