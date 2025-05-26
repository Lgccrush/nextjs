import mysql from 'mysql2/promise';

// Define an interface for the connection options for type safety
interface DbConfig {
  host?: string;
  user?: string;
  password?: string;
  database?: string;
  port?: number;
}

// Function to get database connection details from environment variables
function getDbConfig(): DbConfig {
  const config: DbConfig = {
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    port: process.env.DB_PORT ? parseInt(process.env.DB_PORT, 10) : 3306,
  };

  // Basic validation
  if (!config.host || !config.user || !config.database) {
    console.error('Missing database configuration in environment variables (DB_HOST, DB_USER, DB_NAME are required).');
    // In a real application, you might throw an error or handle this more gracefully
  }

  return config;
}

// Create a connection pool
// The pool helps manage multiple connections efficiently
// It's generally recommended over creating single connections for each query
let pool: mysql.Pool | null = null;

export async function getConnection() {
  if (pool) {
    return pool;
  }

  const dbConfig = getDbConfig();

  // Check if essential config is present before attempting to create a pool
  if (!dbConfig.host || !dbConfig.user || !dbConfig.database) {
    throw new Error('Database configuration is incomplete. Cannot create connection pool.');
  }

  try {
    pool = mysql.createPool(dbConfig);
    console.log('Successfully connected to the database and created connection pool.');
    return pool;
  } catch (error) {
    console.error('Failed to create database connection pool:', error);
    throw error; // Re-throw the error to be handled by the caller
  }
}

// Example of how to use the connection for a query
// export async function executeQuery(query: string, params: any[] = []) {
//   const connectionPool = await getConnection();
//   const [results, fields] = await connectionPool.execute(query, params);
//   return results;
// }

// Note: It's important to handle potential errors when making queries.
// The actual query execution logic will be implemented in API routes or service layers.
