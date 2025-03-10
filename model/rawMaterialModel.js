import { DataTypes } from "sequelize";
import { sequelize } from "../config/connectDB.js";



export const RawMaterial = sequelize.define("RawMaterial", {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    raw_material_name: {
        type: DataTypes.STRING(30),
        allowNull: false
    },
    raw_material_rate: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false
    },
    // quantity_per_assembly: {
    //     type: DataTypes.DECIMAL(10, 2),
    //     allowNull: true
    // },
    scrap_rate: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false
    },
    status: {
        type: DataTypes.BOOLEAN,
        defaultValue: true
    }
}, {
    tableName: 'raw_material_table',
    timestamps: true,
})