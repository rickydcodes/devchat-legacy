const express = require("express");
const server = require("../server.js");
const mainDbHandler = require("./db/mainHandler.js");
const middleware = require("./utils/middleware.js");
const router = express.Router();

router.get(
    "/blog",
    middleware.notLoggedInRedirect,
    middleware.bannedRedirect,
    async (req, res) => {
        res.render("main/blog", {
            title: "Blog",
            stylesheet: "main/blog",
            script: "",
            user: req.userDocument
        });
    }
);

module.exports = router;
