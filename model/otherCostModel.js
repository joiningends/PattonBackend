import { DataTypes } from "sequelize";
import { sequelize } from "../config/connectDB.js";

export const OtherCost = sequelize.define("otherCost", {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    cost_name: {
        type: DataTypes.STRING(100),
        allowNull: false
    },
    status: {
        type: DataTypes.BOOLEAN,
        defaultValue: true
    }
}, {
    tableName: 'other_cost_table',
    timestamps: true,
})