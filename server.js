const express = require("express");
const ejsLayouts = require(`express-ejs-layouts`);
const mongodb = require("mongodb");
const session = require("express-session");
const fileUpload = require(`express-fileupload`);

const signin = require("./api/signin.js");
const main = require("./api/main.js");
const profile = require("./api/profile.js");
const forum = require("./api/forum.js");
const threadFunctions = require("./api/threadFunctions.js");
const settings = require("./api/settings.js");
const api = require("./api/api.js");
const admin = require("./api/admin.js");

const datePrototype = require("./api/utils/dates.js");

const errorsMiddleware = require("./api/utils/errors.js");

const app = express();
let db;
require("dotenv").config();
app.use(express.static("public"));
app.use(
    express.urlencoded({
        extended: true,
    })
);
app.use(express.json());
app.use(ejsLayouts);
app.use(fileUpload());
app.use(
    session({
        secret: "$2b$10$CPLOK68sJbdbvckRNPSfBeyenkUTH7bCVUYlP3e81D6qXQDPg91S.",
        resave: true,
        saveUninitialized: true,
        cookie: {
            secure: false,
        },
    })
);
app.set("view engine", "ejs");
app.set("trust proxy", 1);

app.use("/", main);
app.use("/", profile);
app.use("/", signin);
app.use("/", forum);
app.use("/", threadFunctions);
app.use("/", settings);
app.use("/", api);
app.use("/", admin);
app.use(errorsMiddleware);

async function connectToDB() {
    const mongoUri = process.env.dbURI;
    let client = mongodb.MongoClient(mongoUri, {
        useNewUrlParser: true,
        useUnifiedTopology: true,
    });
    try {
        let dbObject = await client.connect();
        if (process.env.production == "false") {
            module.exports.db = dbObject.db("devchat-dev");
        } else {
            module.exports.db = dbObject.db("devchat");
        }
    } catch (err) {
        console.log(err);
    }
}
connectToDB();

app.listen(process.env.PORT, function (err) {
    if (err) console.log("Error in server setup");
    console.log("Server listening on Port", process.env.PORT);
});

// io.on("connection", socket => {
//   // socket stuff
// });
