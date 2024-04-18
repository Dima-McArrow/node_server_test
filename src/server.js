// src/server.js
const path = require("path");
// require('dotenv').config({ path: path.join(__dirname, '../app_config/.env') })
const express = require("express");
const mysql = require("mysql");
const { body, validationResult } = require("express-validator");
const helmet = require("helmet");
const app = express();
const port = process.env.PORT || 3000;

// Create a MySQL database connection using environment variables
const db = mysql.createConnection({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASS,
  database: process.env.DB_NAME,
});

// Connect to the database
db.connect((err) => {
  if (err) {
    console.error("Error connecting to the database: " + err.stack);
    return;
  }
  console.log("Connected to database with ID " + db.threadId);
});

// Middleware to parse JSON and urlencoded form bodies
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(helmet()); // Secure apps by setting various HTTP headers

// Serve static files from 'public' directory
app.use(express.static(path.join(__dirname, "..", "public")));
app.use("/scripts", express.static(path.join(__dirname, "..", "scripts")));


// Handle GET request for the root URL
app.get("/", (req, res) => {
  // Redirect to ../public/index.html
  res.redirect("/index.html");
});

// Handle POST request from the form with validation and sanitization
app.post(
  "/submit",
  [
    body("name")
      .trim()
      .escape()
      .isLength({ min: 1 }),
    body("email")
      .isEmail()
      .normalizeEmail(),
    body("message")
      .trim()
      .escape()
      .isLength({ min: 1 })
  ],
  (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { name, email, message } = req.body;
    const sql = `INSERT INTO messages (name, email, message) VALUES (?, ?, ?)`;
    const values = [name, email, message];

    db.query(sql, values, (error, results) => {
      if (error) {
        console.error("Failed to insert into database:", error);
        res.status(500).send("Error submitting message");
        return;
      }
      // res.send("Message submitted successfully!");
      res.send(`
        <script src="/scripts/redirect.js"></script>
      `);
    });
  }
);

// Start the server
app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});
