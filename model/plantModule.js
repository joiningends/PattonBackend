import { DataTypes } from "sequelize";
import { sequelize } from "../config/connectDB.js";



export const Plant = sequelize.define("Plant", {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    plantname: {
        type: DataTypes.STRING(100),
        allowNull: false
    },
    plant_head: {
        type: DataTypes.INTEGER,
        allowNull: true
    },
    plant_engineer: {
        type: DataTypes.INTEGER,
        allowNull: true
    },
    status: {
        type: DataTypes.BOOLEAN,
        defaultValue: true
    }
}, {
    tableName: "plant_table",
    timestamps: true,
})