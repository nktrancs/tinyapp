const express = require("express");
const app = express();
const PORT = 8080;
const bodyParser = require("body-parser");
var cookieParser = require('cookie-parser')
const bcrypt = require('bcryptjs');
var cookieSession = require('cookie-session')
const { getUserByEmail, verifyNewEmail, urlsForUser, shortUrlBelongsToUser } = require('./helpers')

app.use(cookieParser());
app.use(bodyParser.urlencoded({extended: true}));
app.set("view engine", "ejs");

app.use(cookieSession({
  name: 'session',
  keys: ['dancing monkies'],

  // Cookie Options
  maxAge: 24 * 60 * 60 * 1000 // 24 hours
}))

//Links database
const urlDatabase = {
  b6UTxQ: {
        longURL: "https://www.tsn.ca",
        userID: "1"
    },
  sgq3y6: {
        longURL: "https://www.google.ca",
        userID: "2"
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
};

//Checks if email is already registered, returns true if already exists
// const verifyNewEmail = (email) => {
//   const givenEmail = email;
//   for (let userKey in users) {    
//     if (users[userKey].email === givenEmail) {
//       return true;
//     }
//   }
//   return false;
// };

// Check if user id matches logged in id and returns their own links
// const urlsForUser = (id) => {
//   const userList = {}
//   for (let [keyUser, value] of Object.entries(urlDatabase)) {
//     if (value.userID === id) {
//       userList[keyUser] = value
//     }
//   } return userList;
// };

// Check if user is logged in matches the shortURL
// const shortUrlBelongsToUser = (id, shortURL) => {
//   for (let item in urlDatabase) {
//     if ((urlDatabase[item].userID === id) && (item === shortURL)) { 
//       return true;
//     }
//   }
//   return false;
// };

//---------------------------------------------------------
app.get("/", (req, res) => {
  res.redirect("/urls");
});

app.get("/urls.json", (req, res) => {
  res.send(urlDatabase);
});

app.get("./hello", (req, res) => {
  res.send("<html><body>Hello <b>World</b></body></html>\n");
});

app.get("/urls", (req, res) => {
  const user_id = req.session["user_id"];
  const templateVars = {
    urls: urlsForUser(user_id, urlDatabase),
    user: users[user_id]
  }
  res.render("urls_index", templateVars);
});

//Generating random strings and assigning to object urlDatabase
app.post("/urls", (req, res) => {
  const longURL = req.body.longURL; 
  const shortURL = generateRandom();
  userID = req.session['user_id'];
  urlDatabase[shortURL] = { longURL, userID }; 

  res.redirect(`/urls/${shortURL}`);         
});

//redirects to actual longURL
app.get("/u/:shortURL", (req, res) => {
  const longURL =  urlDatabase[req.params.shortURL].longURL;
  res.redirect(longURL);
 });

 //Creates new shortURLs, must be logged in
app.get("/urls/new", (req, res) => {
  if (req.session["user_id"]) {
    user_id = req.session["user_id"];
    templateVars = {
    user: users[user_id]
    };
  res.render("urls_new", templateVars);
  } else {
    res.send('Please login first to create new URLs!')
  };
});

//Pulls shortURL parameter, adds it as key with long URL value in database
app.get("/urls/:shortURL", (req, res) => {
  const user_id = req.session["user_id"];
  const shortURL = req.params.shortURL;
  if(shortUrlBelongsToUser(req.session['user_id'], shortURL), urlDatabase) {
    if (urlDatabase[req.params.shortURL]) {
      const templateVars = {
        shortURL: req.params.shortURL, 
        longURL: urlDatabase[req.params.shortURL].longURL,
        user_id: req.session["user_id"],
        user: users[user_id]
      }
    res.render("urls_show", templateVars);
    } else {
      res.send('Error 404');
    }
    }res.send('Not logged in!');
});

app.post("/urls/:shortURL/delete", (req, res) => {
  const shortURL = req.params.shortURL;
  if(shortUrlBelongsToUser(req.session['user_id'], shortURL), urlDatabase) {
    delete urlDatabase[req.params.shortURL]
    res.redirect(`/urls`);
  } else {
    return res.send('You can only delete your own generated links!');
  };
});

//Reassigning newLongURL to existing shortURL - Edit
app.post("/urls/:shortURL/update", (req, res) => {
  const shortURL = req.params.shortURL;
  if(shortUrlBelongsToUser(req.session['user_id'], shortURL), urlDatabase) {
    urlDatabase[shortURL] = {
      longURL: req.body.longURL,
      userID: req.session['user_id']
    }
    res.redirect('/urls');
  } else {
    return res.send('You can only edit your own generated links!');
  };
});

app.get("/login", (req, res) => {
  const templateVars = { 
    user: req.session["user_id"]
  };
  res.render("login", templateVars);
});

//Pulls username field and assigns as cookie
app.post("/login", (req, res) => {
  const user = getUserByEmail(req.body.email, users);

  if (user && bcrypt.compareSync(req.body.password, user.password)) {
    req.session.user_id = user.id;
    res.redirect('/urls');
  };
  return res.send('Invalid email or password');
});

//Clears cookies/username and logs out
app.post("/logout", (req, res) => {
  req.session = null;
  res.redirect('/urls/');
});

app.get("/register", (req, res) => {
  const user_id = req.session["user_id"];
  const templateVars = { 
    shortURL: req.params.shortURL, 
    longURL: urlDatabase[req.params.shortURL],
    user_id: req.session["user_id"],
    user: users[user_id]
  };
  res.render("register", templateVars);
});

//Checks if email is new, and creates a newID if it is
app.post("/register", (req, res) => {
  const newUser= req.body.email;
  const newUserPass = req.body.password;
  const newID = generateRandom();
  
  if (!verifyNewEmail(newUser, users) && req.body.email.length !== 0 && req.body.password.length !==0){
    users[newID] = {
      id: newID,
      email: newUser,
      password: bcrypt.hashSync(newUserPass, 10)
    }
  } else {
    return res.send('Error 400');
  }
    
  req.session.user_id = newID;
  res.redirect('/urls');
});

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});