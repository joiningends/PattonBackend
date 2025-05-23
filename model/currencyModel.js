import { DataTypes, DECIMAL } from "sequelize";
import { sequelize } from "../config/connectDB.js";


export const Currency = sequelize.define("Currency", {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    currency_name: {
        type: DataTypes.STRING(30),
        allowNull: false
    },
    currency_code: {
        type: DataTypes.STRING(10),
        allowNull: false
    },
    currency_value: {
        type: DECIMAL(10, 6),
        allowNull:false
    },
    status: {
        type: DataTypes.BOOLEAN,
        defaultValue: true
    }
}, {
    tableName: 'currency_table',
    timestamps: true,
})