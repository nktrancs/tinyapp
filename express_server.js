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
  b6UTxQ: {
        longURL: "https://www.tsn.ca",
        userID: "2"
    },
  i3BoGr: {
        longURL: "https://www.google.ca",
        userID: "1"
    }
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
//Verifies user login input is correct
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

//Checks if email is already registered, returns true if already exists
const verifyNewEmail = (email) => {
  const givenEmail = email;
  for (let userKey in users) {    
    if (users[userKey].email === givenEmail) {
      return true;
    }
  }
  return false;
}

const urlsForUser = (id) => {
  const userList = {}
  for (let [keyUser, value] of Object.entries(urlDatabase)) {
    if (value.userID === id) {
      userList[keyUser] = value
    }
  } return userList;
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
  const user_id = req.cookies["user_id"]
  // console.log("user:", urlDatabase[req.params.shortURL])
  
  const templateVars = {
    urls: urlsForUser(user_id), 
    user: users[user_id]

  }
  // console.log("cookie email:", req.cookies["user_id"])
  res.render("urls_index", templateVars);
});

//Generating random strings and assigning to object urlDatabase
app.post("/urls", (req, res) => {
  const longURL = req.body.longURL; 
  const shortURL = generateRandom();
  userID = req.cookies['user_id']
  urlDatabase[shortURL] = { longURL, userID }; 

  console.log("CHECK SHORTURL:", urlDatabase[shortURL])
  console.log("CHECK LONG URL:", longURL)
  res.redirect(`/urls/${shortURL}`);         
});

app.get("/u/:shortURL", (req, res) => {
  const longURL =  urlDatabase[req.params.shortURL];
  res.redirect(longURL);
 });

app.get("/urls/new", (req, res) => {
  user_id = req.cookies["user_id"]
  templateVars = {
    user: users[user_id]
  }
  res.render("urls_new", templateVars);
});

//Pulls shortURL parameter, adds it as key with long URL value in database
app.get("/urls/:shortURL", (req, res) => {
  const user_id = req.cookies["user_id"]
  if (urlDatabase[req.params.shortURL]) {
    const templateVars = { 
      shortURL: req.params.shortURL, 
      longURL: urlDatabase[req.params.shortURL],
      user_id: req.cookies["user_id"],
      user: users[user_id]
    }
    // console.log("CHECK:", urlDatabase[req.params.shortURL])
    res.render("urls_show", templateVars);
  } else {
    res.send('Error 404')
  }
  // console.log("LONGURL:", urlDatabase[req.params.shortURL])
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

app.get("/login", (req, res) => {
  const user_id = req.cookies["user_id"]
  const templateVars = { 
    shortURL: req.params.shortURL, 
    longURL: urlDatabase[req.params.shortURL],
    user_id: req.cookies["user_id"],
    user: users[user_id]
  };
  res.render("login", templateVars);
});

//Pulls username field and assigns as cookie
app.post("/login", (req, res) => {
  // console.log("email:", req.body.email)
  // console.log("password:", req.body.password)
  const user = verifyUser(req.body.email, req.body.password);
  // console.log(user)
  if (user) {
    res.cookie('user_id', user.id)
    res.redirect('/urls/');
  }
  return res.send('Invalid email or password');
})

//Clears cookies/username and logs out
app.post("/logout", (req, res) => {
  res.clearCookie("user_id")
  res.redirect('/urls/');
})

app.get("/register", (req, res) => {
  const user_id = req.cookies["user_id"]
  const templateVars = { 
    shortURL: req.params.shortURL, 
    longURL: urlDatabase[req.params.shortURL],
    user_id: req.cookies["user_id"],
    user: users[user_id]
  };
  res.render("register", templateVars);
});

//Checks if email is new, and creates a newID if it is
app.post("/register", (req, res) => {
  const newUser= req.body.email
  const newUserPass = req.body.password
  const newID = generateRandom() 
  
  if (!verifyNewEmail(newUser) && req.body.email.length !== 0){
    users[newID] = {
      id: newID,
      email: newUser,
      password: newUserPass
    }
  } else {
    return res.send('Error 400')
  }
    
  res.cookie('user_id', newID)
  res.redirect('/urls')
})

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});