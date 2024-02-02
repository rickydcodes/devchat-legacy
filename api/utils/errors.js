const express = require("express");
let router = express.Router();
const server = require("../../server.js");

router.use((request, response, next) => {
    response.status(400).render("errors/400error", {
        title: "400 Error",
        stylesheet: "error",
        script: "",
        signin: false,
    });
});

router.use((request, response, next) => {
    response.status(500).render("errors/500error", {
        title: "500 Error",
        stylesheet: "error",
        script: "",
        signin: false,
    });
});

module.exports = router;
