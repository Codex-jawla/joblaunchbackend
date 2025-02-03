import mysql  from 'mysql2';
import dotenv from 'dotenv'

dotenv.config();

export const db = mysql.createConnection({
  host: "localhost",
  user: "root",
  password: "",
  database: "Sonipat_joblaunch"
});

db.connect((err) => {
  if (err) {
    console.error('Database connection error:', err.stack);
    return;
  }
  console.log('Connected to the database');
});


