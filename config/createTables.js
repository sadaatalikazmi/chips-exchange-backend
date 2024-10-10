const mysql = require('mysql2');
const colors = require('colors');
require('dotenv').config({ path: `./.env.${process['env']['NODE_ENV']}` });
require('dotenv').config();

const creatTables = async () => {
  const connection = await mysql.createConnection({
    host: process.env.MY_SQL_HOST,
    user: process.env.MY_SQL_USER,
    password: process.env.MY_SQL_PASSWORD,
    database: process.env.MY_SQL_DB
  });

  await connection.connect((err) => {
    if (err) {
      console.error(`Error connecting to MySQL: ${err}`.bgRed);
      return;
    }

    console.log('Connected to MySQL server'.bgGreen);
  });

  const createUsersTableQuery = `
    CREATE TABLE users (
      id INT AUTO_INCREMENT PRIMARY KEY,
      username VARCHAR(255) UNIQUE,
      address VARCHAR(255),
      name VARCHAR(510),
      email VARCHAR(255),
      chips INT,
      imageUrl VARCHAR(255),
      gender ENUM('male', 'female') DEFAULT 'male',
      hashedPassword VARCHAR(255) NOT NULL,
      role ENUM('user', 'admin', 'super-admin') DEFAULT 'user',
      createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    )
  `;




  // await connection.execute(createUsersTableQuery);


  connection.end();
}

creatTables();