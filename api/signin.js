const express = require("express");
const rateLimit = require("express-rate-limit");
const mainDbHandler = require("./db/mainHandler.js");
const middleware = require("./utils/middleware.js");
const server = require("../server.js");
const axios = require("axios");
const router = express.Router();
const Joi = require("joi");
const signInLimiter = rateLimit({
    windowMs: 10 * 60 * 1000,
    max: 15,
    message: "Too many sign-in attempts received from this IP, please try again in 10 minutes",
});
const signUpLimiter = rateLimit({
    windowMs: 60 * 60 * 1000,
    max: 3,
    message:
        "Do not create more than one account. If you are having issues signing up, wait 1 hour and try again.",
});
const signUpSchema = Joi.object({
    username: Joi.string().alphanum().required(),
    password: Joi.string().min(6).max(20).required(),
});

router.get("/", middleware.loggedInRedirect, (req, res) => {
    res.render("signin", {
        layout: "signinLayout",
        title: "Sign In",
        stylesheet: "signin",
        script: "signin",
    });
});

router.get("/signup", middleware.loggedInRedirect, (req, res) => {
    res.render("signup", {
        layout: "signinLayout",
        title: "Sign Up",
        stylesheet: "signup",
        script: "signup",
    });
});

router.post("/signin", middleware.loggedInError, signInLimiter, async (req, res) => {
    let username = req.body.username;
    let password = req.body.password;

    try {
        var dbDocument = await mainDbHandler.indexDbDocument("users", {
            username: username,
            password: password,
        });
        if (dbDocument == undefined) {
            res.status(403).send("Username or password was incorrect");
            return;
        }
    } catch (err) {
        console.log(err);
    }

    req.session.accountid = dbDocument["_id"];
    res.status(200).send("OK");
});

router.post("/signup", middleware.loggedInError, signUpLimiter, async (req, res) => {
    let username = req.body.username;
    let password = req.body.password;

    if (username.length < 5 || username.length > 12) {
        res.status(403).send("Username must be between 5 and 12 characters long");
        return;
    }

    for (let char of username) {
        let allowed = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ";
        if (!allowed.includes(char)) {
            res.status(403).send("Username must be letters only");
            return;
        }
    }

    try {
        var dbDocument = await server.db.collection("users").findOne({username: username});
        if (dbDocument != undefined) {
            res.status(403).send("Username already in use");
            return;
        }
    } catch (err) {
        console.log(err);
    }

    try {
        // create the account
        let createAccount = await mainDbHandler.createUserDocument(username, password);
        if (typeof createAccount == "object") {
            req.session.accountid = createAccount.ops[0]["_id"];
            res.status(200).send("OK");
            return;
        }
    } catch (err) {
        console.log(err);
    }
    res.status(404).send("Something went wrong...");
});

module.exports = router;
