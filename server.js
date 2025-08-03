const port = process.env.PORT || 3000;
const jwt = require("jsonwebtoken")
require("dotenv").config()
const express = require("express")
const app = express()
const bcrypt = require("bcrypt")
const cookieParser = require("cookie-parser")
const path = require("path");
const dbPath = process.env.DATABASE_URL || path.join(__dirname, "myDB.db");
const db = require("better-sqlite3")(dbPath);
db.pragma("journal_mode = WAL")

const tables = db.transaction(() => {
    db.prepare(`
        CREATE TABLE IF NOT EXISTS users(
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username STRING NOT NULL UNIQUE,
        password STRING NOT NULL 
        )
        `).run()

    db.prepare(`
        CREATE TABLE IF NOT EXISTS journals(
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title STRING NOT NULL,
        content STRING NOT NULL,
        authorid INTEGER NOT NULL,
        FOREIGN KEY (authorid) REFERENCES users(id)
        )
        `).run()

    db.prepare(`
        CREATE TABLE IF NOT EXISTS books(
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title STRING NOT NULL,
        content STRING NOT NULL,
        authorid INTEGER NOT NULL,
        FOREIGN KEY (authorid) REFERENCES users(id)
        )
        `).run()

    db.prepare(`
        CREATE TABLE IF NOT EXISTS stories(
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title STRING NOT NULL,
        content STRING NOT NULL,
        authorid INTEGER NOT NULL,
        FOREIGN KEY (authorid) REFERENCES users(id)
        )
        `).run()
})
tables();

app.set("view engine", "ejs")
app.use(express.urlencoded({extended : false}))
app.use(express.static("public"))
app.use(cookieParser())

app.use((req, res, next) => {
    res.locals.user = []

    try {
        const decoded = jwt.verify(req.cookies.statement1, process.env.JWTENCRYPTED)
        req.user = decoded
    } catch (error) {
        req.user = false
    }

    res.locals.user = req.user
    console.log(req.user)
    next()
})

app.get("/", (req, res) => {
    res.render("homepage")
})

app.get("/login", (req, res) => {
    res.render("login", {errors : []})
})

app.get("/logout", (req, res) => {
    return res.redirect("/")
})

function mustBeLoggedIn (req, res, next) {
    if (req.user) {
        return next()
    }

    res.redirect("/")
    next()
}

/* JOURNAL */

app.get("/journal", (req, res) => {
    const id = req.user.userid

    const dataStatement = db.prepare("SELECT * FROM journals WHERE authorid = ?")
    const journals = dataStatement.all(id)
    
    return res.render("journal", {journals})
})

app.get("/createjournal", mustBeLoggedIn, (req, res) => {
    return res.render("createjournal")
})

app.post("/createjournal", mustBeLoggedIn, (req, res) => {
    console.log(req.body.journaltitle, req.body.journalcontent, req.user.userid)

    const journalStatement = db.prepare("INSERT INTO journals(title, content, authorid) VALUES (?,?,?)")
    const result = journalStatement.run(req.body.journaltitle, req.body.journalcontent, req.user.userid)

    const getJournalStatement = db.prepare("SELECT * FROM journals WHERE ROWID = ?")
    getJournalStatement.get(result.lastInsertRowid)

    res.redirect(`/journal`)
})

app.get("/editjournal/:id", (req, res) => {
    const journalStatement = db.prepare("SELECT * FROM journals WHERE id = ?")
    const journal = journalStatement.get(req.params.id)

    res.render("editjournal", {journal})
})

app.post("/editjournal/:id", (req, res) => {
    const updateStatement = db.prepare("UPDATE journals SET title = ?, content = ? WHERE id = ?")
    updateStatement.run(req.body.journaltitle, req.body.journalcontent, req.params.id)

    res.redirect("/journal")
})

app.post("/deletejournal/:id", (req, res) => {
    const deleteStatement = db.prepare("DELETE FROM journals WHERE id = ?")
    deleteStatement.run(req.params.id)

    res.redirect("/journal")
})

/* BOOK */

app.get("/book", (req, res) => {
    const id = req.user.userid

    const dataStatement = db.prepare("SELECT * FROM books WHERE authorid = ?")
    const books = dataStatement.all(id)
    
    return res.render("book", {books})
})

app.get("/createbook", mustBeLoggedIn, (req, res) => {
    return res.render("createbook")
})

app.post("/createbook", mustBeLoggedIn, (req, res) => {
    console.log(req.body.booktitle, req.body.bookcontent, req.user.userid)

    const bookStatement = db.prepare("INSERT INTO books(title, content, authorid) VALUES (?,?,?)")
    const result = bookStatement.run(req.body.booktitle, req.body.bookcontent, req.user.userid)

    const getbookStatement = db.prepare("SELECT * FROM books WHERE ROWID = ?")
    getbookStatement.get(result.lastInsertRowid)

    res.redirect(`/book`)
})

app.post("/togglecheck/:id", (req, res) => {
    const isChecked = req.body.checked ? 1 : 0

    const checkStatement = db.prepare("UPDATE books SET checked = ? WHERE id = ?")
    checkStatement.run(isChecked, req.params.id)

    res.redirect("/book")
})

app.get("/editbook/:id", (req, res) => {
    const bookStatement = db.prepare("SELECT * FROM books WHERE id = ?")
    const book = bookStatement.get(req.params.id)

    res.render("editbook", {book})
})

app.post("/editbook/:id", (req, res) => {
    const updateStatement = db.prepare("UPDATE books SET title = ?, content = ? WHERE id = ?")
    updateStatement.run(req.body.booktitle, req.body.bookcontent, req.params.id)

    res.redirect("/book")
})

app.post("/deletebook/:id", (req, res) => {
    const deleteStatement = db.prepare("DELETE FROM books WHERE id = ?")
    deleteStatement.run(req.params.id)

    res.redirect("/book")
})

/* STORY */

app.get("/story", (req, res) => {
    const id = req.user.userid

    const dataStatement = db.prepare("SELECT * FROM stories WHERE authorid = ?")
    const stories = dataStatement.all(id)
    
    return res.render("story", {stories})
})

app.get("/createstory", mustBeLoggedIn, (req, res) => {
    return res.render("createstory")
})

app.post("/createstory", mustBeLoggedIn, (req, res) => {
    console.log(req.body.storytitle, req.body.storycontent, req.user.userid)

    const storyStatement = db.prepare("INSERT INTO stories(title, content, authorid) VALUES (?,?,?)")
    const result = storyStatement.run(req.body.storytitle, req.body.storycontent, req.user.userid)

    const getstoryStatement = db.prepare("SELECT * FROM stories WHERE ROWID = ?")
    getstoryStatement.get(result.lastInsertRowid)

    res.redirect(`/story`)
})

app.get("/editstory/:id", (req, res) => {
    const storyStatement = db.prepare("SELECT * FROM stories WHERE id = ?")
    const story = storyStatement.get(req.params.id)

    res.render("editstory", {story})
})

app.post("/editstory/:id", (req, res) => {
    const updateStatement = db.prepare("UPDATE stories SET title = ?, content = ? WHERE id = ?")
    updateStatement.run(req.body.storytitle, req.body.storycontent, req.params.id)

    res.redirect("/story")
})

app.post("/deletestory/:id", (req, res) => {
    const deleteStatement = db.prepare("DELETE FROM stories WHERE id = ?")
    deleteStatement.run(req.params.id)

    res.redirect("/story")
})

app.post("/loggedin", (req, res) => {
    const errors = []

    if (!req.body.username) errors.push("You must provide username.")
    if (!req.body.password) errors.push("You must provide password.")

    const userLoggedin = db.prepare("SELECT * FROM users WHERE username = ?")
    const loggedin = userLoggedin.get(req.body.username)

    if (!loggedin || !bcrypt.compareSync(req.body.password, loggedin.password)) {
    errors.push("Invalid credentials");
    }

    if (errors.length) {
        return res.render("login", {errors})
    }

    const jwtValue = jwt.sign({exp : Math.floor(Date.now() / 1000) + 60 * 60 * 24, userid : loggedin.id, username : loggedin.username}, process.env.JWTENCRYPTED)

    res.cookie("statement1", jwtValue, {
        httpOnly : true,
        secure : true,
        sameSite : "strict", 
        maxAge : 1000 * 60 * 60 * 24
    })

    return res.redirect(`/dashboard/${loggedin.id}`)
})

app.get("/createstory", (req, res) => {
    res.render("createstory")
})

app.get("/story", (req, res) => {
    res.render("story")
})

app.get("/dashboard/:id", (req, res) => {
    const id = req.params.id;

    const dataStatement1 = db.prepare("SELECT * FROM journals WHERE authorid = ?")
    const journals = dataStatement1.all(id);

    const dataStatement2 = db.prepare("SELECT * FROM stories WHERE authorid = ?")
    const stories = dataStatement2.all(id);

    const dataStatement3 = db.prepare("SELECT * FROM books WHERE authorid = ?")
    const books = dataStatement3.all(id);

    return res.render("dashboard", {user : req.user, journals, stories, books})
})

app.get("/signup", (req, res) => {
    res.render("signup", {errors : []})
})

app.post("/signedup", (req, res) => {

    const errors = []

    if (!req.body.username) errors.push("You must provide username.")
    if (!req.body.password) errors.push("You must provide password.")
    if (!req.body.confirmpassword) errors.push("You should confirm password.")

    if (req.body.password !== req.body.confirmpassword) errors.push("Password and confirm password should be same.")

    if (req.body.username.length > 30 || req.body.username.length < 3) errors.push("Username must be of minimum 4 characters and maximum 30 characters.")
    if (req.body.password.length < 8) errors.push("Password must be longer than 8 characters.")

    if (errors.length) {
        return res.render("signup", {errors})
    }

    const salt = bcrypt.genSaltSync(10)
    req.body.password = bcrypt.hashSync(req.body.password, salt)

    const signupStatement = db.prepare("INSERT INTO users (username, password) VALUES (?, ?)")
    console.log(req.body.username, req.body.password)
    const result = signupStatement.run(req.body.username, req.body.password)

    const lookupStatement = db.prepare("SELECT * FROM users WHERE ROWID = ?")
    const ourUser = lookupStatement.get(result.lastInsertRowid)

    const jwtValue = jwt.sign({exp : Math.floor(Date.now() / 1000) + 60 * 60 * 24, userid : ourUser.id, username : ourUser.username}, process.env.JWTENCRYPTED)

    res.cookie("statement1", jwtValue, {
        httpOnly : true,
        secure : true,
        sameSite : "strict", 
        maxAge : 1000 * 60 * 60 * 24
    })

    return res.redirect(`/dashboard/${ourUser.id}`)
})

app.listen(port, () => {
    console.log(`Server running on port ${port}`)
})