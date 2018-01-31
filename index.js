/*global __dirname*/
/*eslint no-console: "off"*/

const host = "0.0.0.0";
const port = 80;
const express = require("express");
const exphbs  = require("express-handlebars");
const bodyParser = require("body-parser");

const authenticationController = require("./controllers/authentication");

const app = express();
const hbs = exphbs.create({
    // Specify helpers which are only registered on this instance.
    extname: ".hbs",
    helpers: {
        json: function (content) { return JSON.stringify(content); }
    }
});

app.use(bodyParser.json());

app.engine(".hbs", hbs.engine);
app.set("view engine", ".hbs");


app.get("/", function (req, res) {
    const accessToken = req.query.access_token ? req.query.access_token : null;

    res.render("index", {
        hasToken: !!accessToken
    }, function(err, html) {
        res.send(html);
    });
});

app.get("/authenticate", function (req, res) {
    const access_token = req.query.access_token ? req.query.access_token : null;

    if (!access_token) {
        return res.send("Error");
    }

    res.render("auth", {}, function(err, html) {
        res.send(html);
    });
});

app.post("/authenticate", authenticationController.credentialsCheck);
app.post("/access_token", authenticationController.accessTokenCheck);
app.post("/user", authenticationController.createAUser);

app.use("/", express.static(__dirname + "/static"));

app.listen(port, host);

console.log("Watching files from:" + __dirname + "/");
console.log("Running server at http://localhost:" + port + "/");