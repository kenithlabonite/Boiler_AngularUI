const db = require('_helpers/db');
const { classifyPriority } = require('../task_ai_tags/task_ai_tags.service');

module.exports = {
    create,
    getAll,
    getAdminUsers,
    getAdminUserTasks,
    update,
    edit,
    deactivate,
    delete: _delete
};

// ✅ Helper: calculate default deadline based on priority
function getDefaultDeadline(priority) {
    const now = new Date();
    const daysMap = { 'High': 3, 'Medium': 14, 'Low': 30 };
    const days = daysMap[priority] || 14;
    now.setDate(now.getDate() + days);
    now.setHours(23, 59, 59, 0);
    return now;
}

async function create(userId, params) {
    // ✅ Duplicate check: same user, same title, active task
    const existing = await db.Task.findOne({
        where: { userId, title: params.title, isActive: true }
    });
    if (existing) {
        const err = new Error('Duplicate task: a task with this title already exists.');
        err.status = 400;
        throw err;
    }

    const aiResult = await classifyPriority(params.description);

    // ✅ Use user-supplied deadline if provided, else AI deadline, else default
    let deadline;
    if (params.deadline) {
        deadline = new Date(new Date(params.deadline).setHours(23, 59, 59, 0));
    } else if (aiResult.deadline) {
        deadline = new Date(new Date(aiResult.deadline).setHours(23, 59, 59, 0));
    } else {
        deadline = getDefaultDeadline(aiResult.priority);
    }

    const task = await db.Task.create({
        userId,
        title: params.title,
        description: params.description,
        priority: aiResult.priority,
        deadline,
        status: 'Pending',
        isActive: true
    });

    await db.TaskAiTag.create({
        taskId: task.id,
        ai_priority: aiResult.priority,
        ai_deadline: deadline,
        ai_raw_response: aiResult.raw
    });

    return task;
}

async function getAll(userId, role) {
    if (role === 'Admin') {
        return await db.Task.findAll({
            include: [{
                model: db.Account,
                as: 'creator',
                attributes: ['AccountId', 'firstName', 'lastName', 'email']
            }],
            order: [['created_at', 'DESC']]
        });
    }
    return await db.Task.findAll({
        where: { userId },
        order: [['created_at', 'DESC']]
    });
}

// ✅ Admin: get list of users with their task count
async function getAdminUsers() {
    const accounts = await db.Account.findAll({
        attributes: ['AccountId', 'firstName', 'lastName', 'email', 'role'],
        include: [{
            model: db.Task,
            as: 'tasks',
            attributes: ['id', 'status', 'isActive']
        }]
    });
    return accounts.map(a => ({
        AccountId: a.AccountId,
        firstName: a.firstName,
        lastName: a.lastName,
        email: a.email,
        role: a.role,
        totalTasks: a.tasks.length,
        activeTasks: a.tasks.filter(t => t.isActive).length,
        completedTasks: a.tasks.filter(t => t.status === 'Completed').length
    }));
}

// ✅ Admin: get tasks for a specific user
async function getAdminUserTasks(userId) {
    return await db.Task.findAll({
        where: { userId },
        include: [{
            model: db.Account,
            as: 'creator',
            attributes: ['AccountId', 'firstName', 'lastName', 'email']
        }],
        order: [['created_at', 'DESC']]
    });
}

async function update(taskId, params) {
    const task = await db.Task.findByPk(taskId);
    if (!task) throw new Error('Task not found');
    Object.assign(task, params);
    await task.save();
    return task;
}

// ✅ Edit task — for users, deadline is auto-reset; for admin, deadline can be set freely
async function edit(taskId, params, role) {
    const task = await db.Task.findByPk(taskId);
    if (!task) throw new Error('Task not found');

    task.title = params.title ?? task.title;
    task.description = params.description ?? task.description;

    if (role === 'Admin' && params.deadline) {
        task.deadline = new Date(new Date(params.deadline).setHours(23, 59, 59, 0));
    } else if (role !== 'Admin') {
        // Re-run AI to determine new priority and reset deadline
        const aiResult = await classifyPriority(task.description);
        task.priority = aiResult.priority;
        task.deadline = getDefaultDeadline(aiResult.priority);
    }

    if (role === 'Admin' && params.priority) {
        task.priority = params.priority;
    }

    await task.save();
    return task;
}

// ✅ Deactivate (soft-delete)
async function deactivate(taskId) {
    const task = await db.Task.findByPk(taskId);
    if (!task) throw new Error('Task not found');
    task.isActive = false;
    await task.save();
    return task;
}

async function _delete(taskId) {
    const task = await db.Task.findByPk(taskId);
    if (!task) throw new Error('Task not found');
    await task.destroy();
}