import mysql  from 'mysql2';
import dotenv from 'dotenv'

dotenv.config();

export const db = mysql.createConnection({
  host: process.env.SERVER,
  user: process.env.USERNAME,
  password: process.env.PASSWORD,
  database: process.env.DBNAME
});

db.connect((err) => {
  if (err) {
    console.error('Database connection error:', err.stack);
    return;
  }
  console.log('Connected to the database');
});


