import { DataTypes } from "sequelize";
import { sequelize } from "../config/connectDB.js";

export const State = sequelize.define("State", {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    state_id: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    state_description: {
        type: DataTypes.STRING(655),
        allowNull: false
    },
    status: {
        type: DataTypes.BOOLEAN,
        defaultValue: true
    }
}, {
    tableName: 'state_table',
    timestamps: true,
})