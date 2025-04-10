import { DataTypes } from "sequelize";
import { sequelize } from "../config/connectDB.js";

export const JobTypes = sequelize.define("JobTypes", {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    job_name: {
        type: DataTypes.STRING(100),
        allowNull: false
    },
    status: {
        type: DataTypes.BOOLEAN,
        defaultValue: true
    }
}, {
    tableName: 'job_table',
    timestamps: true,
})