const express = require("express");
const app = express();
const PORT = 8080;
const bodyParser = require("body-parser");
var cookieParser = require('cookie-parser')

app.use(cookieParser());
app.use(bodyParser.urlencoded({extended: true}));
app.set("view engine", "ejs");


//Link database
const urlDatabase = {
  "b2xVn2": "http://www.lighthouselabs.ca",
  "9sm5xK": "http://www.google.com"
};
//User database
const users = {
  1: {id: 1, email: "lh@lh.com", password: "123"}
};
//--------------------------------------------------------
//FUNCTIONS & METHODS
function generateRandom() {
  return Math.random().toString(16).substring(2,8);

}
//Verifies user login input
const verifyUser = (email, password) => {
  const givenEmail = email;
  const givenPass = password;
  for (let userKey in users) {    
    if (users[userKey].email === givenEmail && users[userKey].password === givenPass) {
      return users[userKey];
    }
  }
  return false;
}
//---------------------------------------------------------
app.get("/", (req, res) => {
  res.send("Hello!");
});

app.get("/urls.json", (req, res) => {
  res.send(urlDatabase);
});

app.get("./hello", (req, res) => {
  res.send("<html><body>Hello <b>World</b></body></html>\n");
});

app.get("/urls", (req, res) => {
  const templateVars = {
    urls: urlDatabase, 
    user_id: req.cookies["user_id"]
  }
  console.log("cookie email:", req.cookies["user_id"])
  res.render("urls_index", templateVars);
});

app.get("/u/:shortURL", (req, res) => {
  const longURL = urlDatabase[req.params.shortURL] 
   res.redirect(longURL);
 });

app.get("/urls/new", (req, res) => {
  templateVars = {user_id: req.cookies["user_id"]}
  res.render("urls_new", templateVars);
});

//Pulls shortURL parameter, adds it as key with long URL value in database
app.get("/urls/:shortURL", (req, res) => {
  const templateVars = { 
    shortURL: req.params.shortURL, 
    longURL: urlDatabase[req.params.shortURL],
    user_id: req.cookies["user_id"],
    password: req.cookies["password"]
  };
  res.render("urls_show", templateVars);
});

//Generating random strings and assigning to object urlDatabase
app.post("/urls", (req, res) => {
  const longURL = req.body.longURL; 
  const shortURL = generateRandom();
  urlDatabase[shortURL] = longURL; 
  res.redirect(`/urls/${shortURL}`);         
});

app.post("/urls/:shortURL/delete", (req, res) => {
  delete urlDatabase[req.params.shortURL]
  res.redirect(`/urls`);
});

//Reassigning newLongURL to existing shortURL - Edit
app.post("/urls/:shortURL/update", (req, res) => {
  const shortURL = req.params.shortURL
  urlDatabase[shortURL] = req.body.longURL
  res.redirect(`/urls/`);
});

//Pulls username field and assigns as cookie
app.post("/login", (req, res) => {
  // console.log("email:", req.body.email)
  // console.log("password:", req.body.password)
  const user = verifyUser(req.body.email, req.body.password);
  const randomID = generateRandom();
  // console.log(user)
  if (user) {
    res.cookie('user_id', user.id)
    res.redirect('/urls/');
  }
  return res.send('Invalid email or password');
})

//Clears cookies/username 
app.post("/logout", (req, res) => {
  res.clearCookie("user_id")
  res.redirect(`/urls/`);
})

app.get("/register", (req, res) => {
  const templateVars = { 
    shortURL: req.params.shortURL, 
    longURL: urlDatabase[req.params.shortURL],
    user_id: req.cookies["user_id"]
  };
  res.render("register", templateVars);
});

app.post("/register", (req, res) => {
  const newUser= req.body.email
  const newUserPass = req.body.password
  const newID = generateRandom() 
  const user = {
    id: newID,
    email: newUser,
    password: newUserPass
  }
  users[newID] = user;
  res.cookie('user_id', newID)
  res.redirect('/urls')
})

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});