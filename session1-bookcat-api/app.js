const express = require("express");
const sql = require("mssql");

const app = express();
const PORT = 3000;

const dbConfig = {
  user: "npbookstore_user",
  password: "ihatemuthu123",
  server: "DESKTOP-41VAC2N", // or your SQL Server instance, e.g. "localhost\\SQLEXPRESS"
  database: "NPBookstore",
  options: {
    encrypt: false, // set to true if your SQL Server requires encrypted connections
    trustServerCertificate: true, // helpful for local self-signed dev certificates
  },
};

let pool;

async function getPool() {
  if (!pool) {
    pool = await sql.connect(dbConfig);
  }
  return pool;
}

app.get("/test-db", async (req, res) => {
  try {
    const db = await getPool();
    await db.request().query("SELECT 1 AS ok");
    res.json({ connected: true });
  } catch (err) {
    console.error("Database connection error:", err);
    res.status(500).json({ connected: false, error: err.message });
  }
});

app.get("/books", async (req, res) => {
  try {
    const db = await getPool();
    const result = await db.request().query("SELECT TOP 10 * FROM dbo.Book");
    res.json(result.recordset);
  } catch (err) {
    console.error("Query error:", err);
    res.status(500).json({ error: err.message });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});