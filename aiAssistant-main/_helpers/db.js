const config = require('config.json');
const mysql = require('mysql2/promise');
const { Sequelize } = require('sequelize');

module.exports = db = {};

initialize();
async function initialize() {
    const { host, port, user, password, database } = config.database;
    const connection = await mysql.createConnection({ host, port, user, password });
    await connection.query(`CREATE DATABASE IF NOT EXISTS \`${database}\`;`);

    await connection.end();

    const sequelize = new Sequelize(database, user, password, { host: 'localhost', dialect: 'mysql' });

    // Initialize models and add them to the exported `db` object

    db.Account = require('../accounts/account.model')(sequelize);
    db.RefreshToken = require('../accounts/refresh-token.model')(sequelize);
    db.Preferences = require('../models/preferences.model')(sequelize);
    db.ActivityLog = require('../models/activitylog.model')(sequelize);
    db.User = require('../users/user.model')(sequelize);
    db.Task = require('../tasks/tasks.model')(sequelize);
    db.TaskAiTag = require('../task_ai_tags/task_ai_tags.model')(sequelize);

    // Add this relationship
    db.Task.hasOne(db.TaskAiTag, { foreignKey: 'taskId', onDelete: 'CASCADE' });
    db.TaskAiTag.belongsTo(db.Task, { foreignKey: 'taskId' });

    // Task creator association
    db.Task.belongsTo(db.Account, { foreignKey: 'userId', targetKey: 'AccountId', as: 'creator' });
    db.Account.hasMany(db.Task, { foreignKey: 'userId', sourceKey: 'AccountId', as: 'tasks' });

    db.Account.hasMany(db.RefreshToken, { foreignKey: 'AccountId', onDelete: 'CASCADE' });
    db.RefreshToken.belongsTo(db.Account, { foreignKey: 'AccountId' });

    db.ActivityLog.belongsTo(db.Account, { foreignKey: 'AccountId' });
    db.Preferences.belongsTo(db.Account, { foreignKey: 'AccountId' });

    await sequelize.sync({ alter: true });
}