import { Sequelize } from 'sequelize';
import dotenv from 'dotenv';

dotenv.config();

// Using Supabase direct connection string
// Format: postgresql://postgres:[YOUR_PASSWORD]@db.jixfxhogxsrmjhpbqdtx.supabase.co:5432/postgres

const sequelize = new Sequelize(
  'postgres', // database name
  'postgres', // username
  process.env.SUPABASE_DB_PASSWORD, // Your database password
  {
    host: 'db.jixfxhogxsrmjhpbqdtx.supabase.co',
    port: 5432,
    dialect: 'postgres',
    dialectOptions: {
      ssl: {
        require: true,
        rejectUnauthorized: false
      }
    },
    logging: false, // Set to console.log to see SQL queries
    pool: {
      max: 10,
      min: 0,
      acquire: 30000,
      idle: 10000
    },
    define: {
      timestamps: true,
      underscored: true,
      freezeTableName: true
    }
  }
);

// Test the connection
sequelize.authenticate()
  .then(() => {
    console.log('✅ Database connection established successfully.');
  })
  .catch(err => {
    console.error('❌ Unable to connect to the database:', err.message);
  });

export { sequelize };