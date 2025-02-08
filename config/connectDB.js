import { Sequelize } from "sequelize";

const sequelize = new Sequelize(process.env.DATABASE, process.env.DB_USERNAME, process.env.DB_PASSWORD, {
    host: process.env.DB_HOST,
    dialect: 'postgres',
    dialectOptions: {
        ssl: {
            require: true,
            rejectUnauthorized: false // You may need this if you're using a self-signed certificate
        }
    },
    pool: {
        max: 5,
        min: 0,
        acquire: 30000,
        idle: 10000
    }
});



const connectdb = async() => {
    try {
        await sequelize.authenticate();
        console.log('✅ Connection has been established successfully.');

        // Sync models
        await sequelize.sync({ force: false });
        console.log('✅ Models synchronized');
        
    } catch (error) {
        console.error('❌ Unable to connect to the database:', error.message);
        // Log more details if needed
        if (error.original) {
            console.error('Original error:', error.original.message);
        }
        process.exit(1);
    }
}



export  {connectdb, sequelize};