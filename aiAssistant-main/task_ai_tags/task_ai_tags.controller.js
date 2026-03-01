const express = require('express');
const router = express.Router();
const authorize = require('_middleware/authorize');
const db = require('_helpers/db');

// Only one route needed - get AI tag for a specific task
router.get('/:taskId', authorize(), getByTaskId);

module.exports = router;

function getByTaskId(req, res, next) {
    db.TaskAiTag.findOne({ where: { taskId: req.params.taskId } })
        .then(tag => {
            if (!tag) return res.status(404).json({ message: 'No AI tag found for this task' });
            res.json(tag);
        })
        .catch(next);
}