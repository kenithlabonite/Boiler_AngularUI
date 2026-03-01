const express = require('express');
const router = express.Router();
const authorize = require('_middleware/authorize');
const Role = require('_helpers/role');
const taskService = require('./tasks.service');

// Admin-only routes (must come BEFORE /:taskId to avoid param collision)
router.get('/admin/users', authorize(Role.Admin), getAdminUsers);
router.get('/admin/users/:userId/tasks', authorize(Role.Admin), getAdminUserTasks);

// User routes
router.post('/', authorize(), create);
router.get('/', authorize(), getAll);
router.put('/:taskId', authorize(), update);
router.put('/:taskId/edit', authorize(), edit);
router.put('/:taskId/deactivate', authorize(), deactivate);
router.delete('/:taskId', authorize(), _delete);

module.exports = router;

function create(req, res, next) {
    taskService.create(req.user.AccountId, req.body)
        .then(task => res.json(task))
        .catch(next);
}

function getAll(req, res, next) {
    taskService.getAll(req.user.AccountId, req.user.role)
        .then(tasks => res.json(tasks))
        .catch(next);
}

function getAdminUsers(req, res, next) {
    taskService.getAdminUsers()
        .then(users => res.json(users))
        .catch(next);
}

function getAdminUserTasks(req, res, next) {
    taskService.getAdminUserTasks(req.params.userId)
        .then(tasks => res.json(tasks))
        .catch(next);
}

function update(req, res, next) {
    taskService.update(req.params.taskId, req.body)
        .then(task => res.json(task))
        .catch(next);
}

function edit(req, res, next) {
    taskService.edit(req.params.taskId, req.body, req.user.role)
        .then(task => res.json(task))
        .catch(next);
}

function deactivate(req, res, next) {
    taskService.deactivate(req.params.taskId)
        .then(task => res.json(task))
        .catch(next);
}

function _delete(req, res, next) {
    taskService.delete(req.params.taskId)
        .then(() => res.json({ message: "Task deleted" }))
        .catch(next);
}