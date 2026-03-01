const { DataTypes } = require('sequelize');

module.exports = model;

function model(sequelize) {
    const attributes = {
        id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
        taskId: { type: DataTypes.INTEGER, allowNull: true },
        ai_priority: { type: DataTypes.STRING },
        ai_deadline: { type: DataTypes.DATE },
        ai_raw_response: { type: DataTypes.TEXT }
    };

    const options = {
        timestamps: false
    };

    return sequelize.define('TaskAiTag', attributes, options);
}
