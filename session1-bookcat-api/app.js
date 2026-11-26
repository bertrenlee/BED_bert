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

app.use(express.json());

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

app.get("/authors", async (req, res) => {
  try {
    const db = await getPool();
    const result = await db.request().query("SELECT * FROM dbo.Author");
    res.json(result.recordset);
  } catch (err) {
    console.error("Query error:", err);
    res.status(500).json({ error: err.message });
  }
});

app.get("/authors/:id", async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (Number.isNaN(id)) {
      return res.status(400).json({ error: "Invalid author ID" });
    }

    const db = await getPool();
    const result = await db
      .request()
      .input("id", sql.Int, id)
      .query("SELECT * FROM dbo.Author WHERE AuthorId = @id");

    if (result.recordset.length === 0) {
      return res.status(404).json({ error: "Author not found" });
    }
    res.json(result.recordset[0]);
  } catch (err) {
    console.error("Query error:", err);
    res.status(500).json({ error: err.message });
  }
});

app.post("/authors", async (req, res) => {
  try {
    const rawId = req.body.AuthorId ?? req.body.id;
    const name = req.body.Name ?? req.body.name;
    const authorId = Number(rawId);

    if (rawId === undefined || rawId === null || Number.isNaN(authorId) || !name) {
      return res.status(400).json({ error: "id/AuthorId and name/Name are required" });
    }

    const db = await getPool();
    await db
      .request()
      .input("AuthorId", sql.Int, authorId)
      .input("Name", sql.VarChar, name)
      .query("INSERT INTO dbo.Author (AuthorId, Name) VALUES (@AuthorId, @Name)");

    res.status(201).json({ AuthorId: authorId, Name: name });
  } catch (err) {
    console.error("Insert error:", err);
    res.status(500).json({ error: err.message });
  }
});

app.put("/authors/:id", async (req, res) => {
  try {
    const id = Number(req.params.id);
    const name = req.body.Name ?? req.body.name;

    if (Number.isNaN(id) || !name) {
      return res.status(400).json({ error: "Valid author ID and name/Name are required" });
    }

    const db = await getPool();
    const result = await db
      .request()
      .input("id", sql.Int, id)
      .input("Name", sql.VarChar, name)
      .query("UPDATE dbo.Author SET Name = @Name WHERE AuthorId = @id");

    if (result.rowsAffected[0] === 0) {
      return res.status(404).json({ error: "Author not found" });
    }
    res.json({ AuthorId: id, Name: name });
  } catch (err) {
    console.error("Update error:", err);
    res.status(500).json({ error: err.message });
  }
});

app.delete("/authors/:id", async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (Number.isNaN(id)) {
      return res.status(400).json({ error: "Invalid author ID" });
    }

    const db = await getPool();
    const result = await db
      .request()
      .input("id", sql.Int, id)
      .query("DELETE FROM dbo.Author WHERE AuthorId = @id");

    if (result.rowsAffected[0] === 0) {
      return res.status(404).json({ error: "Author not found" });
    }
    res.json({ deleted: true, AuthorId: id });
  } catch (err) {
    console.error("Delete error:", err);
    res.status(500).json({ error: err.message });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});