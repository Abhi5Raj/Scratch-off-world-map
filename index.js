import express from "express";
import bodyParser from "body-parser";
import pg from "pg";

const app = express();
const port = 3000;

const db = new pg.Client({
  user: "postgres",
  host: "localhost",
  database: "world",
  password: "@bhi5Raj", // ⚠️ don’t expose passwords in production
  port: 5432,
});
db.connect();

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));

async function checkVisited() {
  const result = await db.query("SELECT country_code FROM visited_countries");
  return result.rows.map((c) => c.country_code);
}

// GET home page
app.get("/", async (req, res) => {
  const countries = await checkVisited();
  res.render("index.ejs", { countries, total: countries.length });
});

// INSERT / REMOVE country
app.post("/action", async (req, res) => {
  const { country, action } = req.body;
  const input = country.toLowerCase();

  if (action === "add") {
    try {
      const result = await db.query(
        "SELECT country_code FROM countries WHERE LOWER(country_name) LIKE '%' || $1 || '%';",
        [input]
      );

      const data = result.rows[0];
      if (!data) {
        const countries = await checkVisited();
        return res.render("index.ejs", {
          countries,
          total: countries.length,
          error: "Country name does not exist, try again.",
        });
      }

      const countryCode = data.country_code;

      try {
        await db.query(
          "INSERT INTO visited_countries (country_code) VALUES ($1);",
          [countryCode]
        );
        res.redirect("/");
      } catch (err) {
        console.log(err);
        const countries = await checkVisited();
        res.render("index.ejs", {
          countries,
          total: countries.length,
          error: "Country has already been added, try again.",
        });
      }
    } catch (err) {
      console.log(err);
      const countries = await checkVisited();
      res.render("index.ejs", {
        countries,
        total: countries.length,
        error: "Error adding country.",
      });
    }
  }

  else if (action === "remove") {
    try {
      const result = await db.query(
        "SELECT country_code FROM countries WHERE LOWER(country_name) LIKE '%' || $1 || '%';",
        [input]
      );

      const data = result.rows[0];
      if (!data) {
        const countries = await checkVisited();
        return res.render("index.ejs", {
          countries,
          total: countries.length,
          error: "Country name does not exist, try again.",
        });
      }

      const countryCode = data.country_code;

      const deleted = await db.query(
        "DELETE FROM visited_countries WHERE country_code = $1;",
        [countryCode]
      );

      if (deleted.rowCount === 0) {
        const countries = await checkVisited();
        return res.render("index.ejs", {
          countries,
          total: countries.length,
          error: "That country is not in your visited list.",
        });
      }

      res.redirect("/");
    } catch (err) {
      console.log(err);
      const countries = await checkVisited();
      res.render("index.ejs", {
        countries,
        total: countries.length,
        error: "Error removing country.",
      });
    }
  }
});

app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});
