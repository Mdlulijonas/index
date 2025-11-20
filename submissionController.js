const Submission = require('../models/Submission');

exports.create = async (req, res) => {
  try {
    const { reportText, team } = req.body;
    const file = req.file;
    const newSub = new Submission({
      author: req.user._id,
      authorName: req.user.name,
      team,
      reportText,
      fileUrl: file ? `/uploads/${file.filename}` : null,
      fileName: file ? file.originalname : null
    });
    await newSub.save();
    res.json(newSub);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

exports.list = async (req, res) => {
  try {
    const subs = await Submission.find().sort({ createdAt: -1 }).limit(200);
    res.json(subs);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

exports.get = async (req, res) => {
  try {
    const sub = await Submission.findById(req.params.id);
    if (!sub) return res.status(404).json({ message: 'Not found' });
    res.json(sub);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

exports.download = async (req, res) => {
  try {
    const sub = await Submission.findById(req.params.id);
    if (!sub || !sub.fileUrl) return res.status(404).json({ message: 'File not found' });
    const filePath = require('path').join(__dirname, '..', sub.fileUrl);
    res.download(filePath, sub.fileName);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};
