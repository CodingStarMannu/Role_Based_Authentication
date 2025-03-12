require("dotenv").config();
const { Sequelize } = require("sequelize");
const path = require('path');

const config = require(path.join(__dirname, "config.js"))[
  process.env.NODE_ENV || "development"
];

// Function to create database if it doesn't exist
const createDatabaseIfNotExists = async () => {
  const tempSequelize = new Sequelize('master', config.username, config.password, {
    host: config.host,
    port: config.port,
    dialect: config.dialect,
    logging: false,
    dialectOptions: {
      options: {
        encrypt: false,
        enableArithAbort: true,
        trustServerCertificate: true,
        connectionTimeout: 30000
      }
    }
  });
  
  try {
    console.log("Connecting to master database to create application database if needed...");
    await tempSequelize.authenticate();
    console.log("Connected to master database successfully.");
    
    await tempSequelize.query(`IF NOT EXISTS (SELECT * FROM sys.databases WHERE name = '${config.database}')
    BEGIN
      CREATE DATABASE ${config.database};
      PRINT 'Database ${config.database} created successfully';
    END
    ELSE
    BEGIN
      PRINT 'Database ${config.database} already exists';
    END`);
    
    console.log(`Database ${config.database} verified.`);
  } catch (error) {
    console.error("Error creating database:", error);
    throw error;
  } finally {
    await tempSequelize.close();
  }
};

// Create the main Sequelize instance
const sequelize = new Sequelize(
  config.database,
  config.username,
  config.password,
  {
    host: config.host,
    port: config.port,
    dialect: config.dialect,
    logging: false,
    dialectOptions: {
      options: {
        encrypt: false,
        enableArithAbort: true,
        trustServerCertificate: true,
        connectionTimeout: 30000
      }
    },
    pool: {
      max: 5,
      min: 0,
      acquire: 60000,
      idle: 10000
    }
  }
);

// Connect with retry mechanism
const connectWithRetry = async () => {
  console.log("Starting database connection process...");
  let retries = 10;
  let connected = false;
  
  while (retries > 0 && !connected) {
    try {
      console.log(`Waiting for SQL Server to be ready... (${retries} attempts left)`);
      
      // First attempt to create the database
      if (retries === 10) {
        try {
          await createDatabaseIfNotExists();
        } catch (error) {
          console.log("Could not create database yet, will retry...");
        }
      }
      
      // Try to connect to the application database
      await sequelize.authenticate();
      console.log("Connection to database established successfully!");
      connected = true;
    } catch (error) {
      console.error("Failed to connect to database:", error.message);
      retries -= 1;
      
      if (retries === 0) {
        console.error("Max retries reached. Could not connect to database.");
        throw error;
      }
      
      // Wait for 5 seconds before retrying
      console.log("Waiting 5 seconds before retrying...");
      await new Promise(resolve => setTimeout(resolve, 5000));
    }
  }
};

// Start the connection process
connectWithRetry()
  .then(() => {
    console.log("Database connection process completed successfully.");
  })
  .catch(err => {
    console.error("Database connection process failed:", err);
    process.exit(1); // Exit the application if database connection fails
  });

module.exports = sequelize;