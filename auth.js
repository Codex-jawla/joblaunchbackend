
import jwt from 'jsonwebtoken'
import {db} from './db.js'
import dotenv from 'dotenv'

dotenv.config();

export const loginUser = (user_name, user_pwd, callback) => {
  const query = 'SELECT * FROM master_ac WHERE user_name = ?';
  console.log(`SELECT * FROM master_ac WHERE user_name = ${user_name}`)
  db.query(query, [user_name], (err, result) => {
    if (err) return callback(err);
    if (result.length === 0) {
      console.log(result);
      return callback(null, { message: 'User not found' });}

      const user = result[0];

      // Compare user_pwd with the stored user_pwd (in plain text)
      if (user_pwd !== user.user_pwd) {
        return callback(null, { message: 'Incorrect user_pwd' });
      }

    // Create JWT token without including the user_pwd
    const token = jwt.sign(
      { id: user.id, username: user.user_name, user_name: user.user_name },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRATION }
    );
    return callback(null, { token });
  });
};


