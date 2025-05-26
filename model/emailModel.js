import { DataTypes } from "sequelize";
import { sequelize } from "../config/connectDB.js";

export const Email = sequelize.define("Email", {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    user: {
        type: DataTypes.STRING(100),
        allowNull: false
    },
    pass: {
        type: DataTypes.STRING(100),
        allowNull: false
    },
    tags: {
        type: DataTypes.STRING(100),
        allowNull: true
    },
    status: {
        type: DataTypes.BOOLEAN,
        defaultValue: true
    }
}, {
    tableName: 'email_table',
    timestamps: true,
})