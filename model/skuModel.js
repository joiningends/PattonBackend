import { DataTypes } from "sequelize";
import { sequelize } from "../config/connectDB.js";


export const Sku = sequelize.define("Sku", {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    sku_name: {
        type: DataTypes.STRING(100),
        allowNull: false
    },
    repeat: {
        type: DataTypes.INTEGER,
        allowNull: true
    },
    tooling_cost: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: true
    },
    quantity: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: true
    },
    assembly_cost: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: true
    },
    packaging_cost: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: true
    },
    description: {
        type: DataTypes.STRING(255),
        allowNull: true
    },
    drawing_no: {
        type: DataTypes.INTEGER,
        allowNull: true
    },
    size: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: true
    },
    status: {
        type: DataTypes.BOOLEAN,
        allowNull: true
    }
}, {
    tableName: 'sku_table',
    timestamps: true,
});


// CREATE TABLE sku_table (
//     id SERIAL PRIMARY KEY,
// 	sku_name VARCHAR(100) NOT NULL,
// 	repeat INT,
// 	tooling_cost DECIMAL(10, 2),
// 	quantity DECIMAL(10,2),
//   	assembly_cost DECIMAL(10,2),								
//   	packaging_cost DECIMAL(10,2),	
// 	description VARCHAR(255),
//   	drawing_no INT,
// 	size DECIMAL(10, 2),
//     status BOOLEAN DEFAULT TRUE, 
//     createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
//     updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP	
// );