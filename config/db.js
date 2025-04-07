const mysql = require("mysql2"); // ✅ Use promise-based MySQL
require("dotenv").config(); // Load environment variables

// ✅ Create MySQL Connection Pool
const db = mysql.createConnection({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  port: process.env.DB_PORT || 3306,
  waitForConnections: true,
  connectionLimit: 10, // Limit concurrent connections
  queueLimit: 0,
});

console.log("DB_USER:", process.env.DB_USER); // Debugging database connection
// ✅ Connect to MySQL
db.connect((err) => {
  if (err) {
      console.error("❌ MySQL Connection Failed:", err);
  } else {
      console.log("✅ Connected to MySQL Database");
  }
});



// ✅ SQL Query to Create `users` Table (For Login/Register)
const createUsersTable = `
CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(255) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL, -- Hashed Password
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
`;

db.query(createUsersTable, (err) => {
  if (err) {
      console.error("❌ Error Creating Table:", err);
  } else {
      console.log("✅ Table 'My_faces' Ready");
  }
});


// ✅ SQL Query to Create `My_faces` Table (For Face Data Storage)
const createFacesTable = `
CREATE TABLE IF NOT EXISTS My_faces (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) DEFAULT 'Unknown',
    age INT,
    emotion VARCHAR(50),
    gender VARCHAR(50),
    status ENUM('active', 'inactive') DEFAULT 'active',
    face_image VARCHAR(255) NOT NULL,
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
`;

db.query(createFacesTable, (err) => {
  if (err) {
      console.error("❌ Error Creating Table:", err);
  } else {
      console.log("✅ Table 'My_faces' Ready");
  }
});


module.exports = db;
