const mainDbHandler = require("../db/mainHandler.js");

module.exports.notLoggedInError = async function (req, res, next) {
    if (process.env.production != "false") {
        if (req.session.accountid > 0) {
            req.userDocument = await mainDbHandler.indexDbDocument("users", {
                _id: req.session.accountid,
            });
            next();
        } else {
            res.status(401).send("Cannot perform action: user is not logged in");
            return;
        }
    } else {
        req.session.accountid = parseInt(process.env.developmentAccountId);
        req.userDocument = await mainDbHandler.indexDbDocument("users", {
            _id: req.session.accountid,
        });
        next();
    }
};

module.exports.notLoggedInRedirect = async function (req, res, next) {
    if (process.env.production != "false") {
        if (req.session.accountid > 0) {
            req.userDocument = await mainDbHandler.indexDbDocument("users", {
                _id: req.session.accountid,
            });
            next();
        } else {
            res.redirect("/");
            return;
        }
    } else {
        req.session.accountid = parseInt(process.env.developmentAccountId);
        req.userDocument = await mainDbHandler.indexDbDocument("users", {
            _id: req.session.accountid,
        });
        next();
    }
};

module.exports.loggedInRedirect = async function (req, res, next) {
    if (process.env.production != "false") {
        if (!req.session.accountid) {
            req.userDocument = await mainDbHandler.indexDbDocument("users", {
                _id: req.session.accountid,
            });
            next();
        } else {
            res.redirect("/home");
            return;
        }
    } else {
        req.session.accountid = parseInt(process.env.developmentAccountId);
        req.userDocument = await mainDbHandler.indexDbDocument("users", {
            _id: req.session.accountid,
        });
        next();
    }
};

module.exports.loggedInError = async function (req, res, next) {
    if (process.env.production != "false") {
        if (!req.session.accountid) {
            req.userDocument = await mainDbHandler.indexDbDocument("users", {
                _id: req.session.accountid,
            });
            next();
        } else {
            res.status(401).send("Cannot perform action: user is logged in");
            return;
        }
    } else {
        req.session.accountid = parseInt(process.env.developmentAccountId);
        req.userDocument = await mainDbHandler.indexDbDocument("users", {
            _id: req.session.accountid,
        });
        next();
    }
};

module.exports.bannedRedirect = function (req, res, next) {
    if (!req.userDocument.banned) {
        next();
    } else {
        res.render("banned", {
            title: "Banned",
            stylesheet: "banned",
            script: "banned",
            user: req.userDocument,
        });
    }
};

module.exports.bannedError = function (req, res, next) {
    if (!req.userDocument.banned) {
        next();
    } else {
        res.status(401).send("Server cannot complete the request because the user is banned.");
    }
};
