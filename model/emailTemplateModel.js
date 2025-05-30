import { DataTypes } from "sequelize";
import { sequelize } from "../config/connectDB.js";


export const EmailTemplate = sequelize.define("EmailTemplate", {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    template_name: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true
    },
    subject: {
        type: DataTypes.STRING,
        allowNull: false
    },
    email_content: {
        type: DataTypes.TEXT,
        allowNull: false
    },
    email_signature: {
        type: DataTypes.TEXT,
        allowNull: false
    },
    tags: {
        type: DataTypes.INTEGER,
        allowNull: true
    },
    status: {
        type: DataTypes.BOOLEAN,
        defaultValue: true
    }
}, {
    tableName: 'email_template_table',
    timestamps: true,
})