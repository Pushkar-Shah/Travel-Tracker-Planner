import express from "express";
import bodyParser from "body-parser";
import pg from "pg";

const app = express();
const port = 3000;
var err = 'Enter country name';
const db = new pg.Client({
  user: "postgres",
  host: "localhost",
  database: "world",
  password: "Pushkar@24",
  port: 5432,
});
db.connect();

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));

let currentUserId = 1;

let users = [
  { id: 1, name: "Angela", color: "teal" },
  { id: 2, name: "Jack", color: "powderblue" },
];

async function checkVisisted(user_id) {
  // const user_info = await db.query("SELECT * FROM users WHERE name = ($1)",[user])
  const result = await db.query("SELECT country_code FROM visited_countries WHERE user_id = ($1)",[user_id]);
  let countries = [];
  result.rows.forEach((country) => {
    countries.push(country.country_code);
  });
  console.log(countries);
  return countries;
}

async function getUser(){
  const result = await db.query("SELECT * FROM users");
  users = await result.rows;
  const currUser = users.find((user)=> user.id == currentUserId);
  return currUser;
}

// requests.. 
app.get("/", async (req, res) => {
  const countries = await checkVisisted(currentUserId);
  const currentUser = await getUser();
  console.log(currentUser);
  res.render("index.ejs", {
    countries: await countries,
    total: await countries.length,
    users: await users,
    color: await currentUser.color,
    error:err
  });
});
app.post("/add", async (req, res) => {
  const country = req.body["country"];

  try {
    // const user_id = await db.query("SELECT id FROM users WHERE name = $1",[user])
    const result = await db.query(
      "SELECT country_code FROM countries WHERE LOWER(country_name) = $1",
      [country.toLowerCase()]
    );

    const data = result.rows[0];
    const countryCode = data.country_code;
    try {
      await db.query(
        "INSERT INTO visited_countries (country_code,user_id) VALUES ($1,$2)",
        [countryCode,currentUserId]
      );
      err = `Enter your country name`;
      res.redirect("/");
    } catch (error) {
      console.log(error);
      err = `${country} is Already been added.. Try again`;
      res.redirect("/");
    }
  } catch (error) {
    console.log(err);
    err = `country named ${country} doesn't exist! Try again`;
    res.redirect("/");
  }
  
});
app.post("/user", async (req, res) => {
  const cases = req.body.add;
  if (cases == "new"){
    res.render("new.ejs");
  }else{
    currentUserId = req.body.user;
    console.log(req.body.user);
    res.redirect("/");
  }
});

app.post("/new", async (req, res) => {
  const user = {id:users.length+1,name : req.body.name,color:req.body.color};
  const addid = await db.query("INSERT INTO users(name,color) VALUES ($1,$2) RETURNING id",[user.name,user.color]);
  user.id = addid;
  users = await db.query("SELECT * FROM users ").rows;
  res.redirect("/");
  // we need to add it 
  //Hint: The RETURNING keyword can return the data that was inserted.
  //https://www.postgresql.org/docs/current/dml-returning.html
});

app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});
