import { DataTypes } from "sequelize";
import { sequelize } from "../config/connectDB.js";

export const Page = sequelize.define("Page", {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    pagename: {
        type: DataTypes.STRING(100),
        allowNull: false
    },
    context: {
        type: DataTypes.STRING(255),
    },
    status: {
        type: DataTypes.BOOLEAN,
        defaultValue: true
    }
}, {
    tableName: 'page_table',
    timestamps: true,
})