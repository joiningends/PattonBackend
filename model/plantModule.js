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
    // process_engineer: {
    //     type: DataTypes.INTEGER,
    //     allowNull: true
    // },
    // npd_engineer: {
    //     type: DataTypes.INTEGER,
    //     allowNull: true
    // },
    // vendor_development_engineer: {
    //     type: DataTypes.INTEGER,
    //     allowNull: true
    // },
    address1: {
        type: DataTypes.STRING(655),
        allowNull: true
    },
    address2: {
        type: DataTypes.STRING(655),
        allowNull: true
    },
    city: {
        type: DataTypes.STRING(655),
        allowNull: true
    },
    state: {
        type: DataTypes.STRING(655),
        allowNull: true
    },
    pincode: {
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