const express = require("express");
const server = require("../server.js");
const middleware = require("./utils/middleware.js");
const router = express.Router();

router.get(
    "/settings",
    middleware.notLoggedInRedirect,
    middleware.bannedRedirect,
    async (req, res) => {
        res.render("main/settings", {
            title: "Settings",
            stylesheet: "main/settings",
            script: "settings",
            user: req.userDocument,
        });
    }
);

router.put(
    "/settings/showRecentActivity",
    middleware.notLoggedInRedirect,
    middleware.bannedError,
    async (req, res) => {
        let show = req.query.show;

        if (show == undefined || (show != "true" && show != "false")) {
            res.status(403).send(
                "The client has not specified whether to show or hide recent activity."
            );
            return;
        }

        try {
            await server.db.collection("users").updateOne(
                { _id: req.session.accountid },
                {
                    $set: {
                        showRecentActivity: show == "true" ? true : false,
                    },
                }
            );
            res.status(200).send("Request successful");
            return;
        } catch (err) {
            if (err) console.log(err);
        }
        res.status(400).send("Something went wrong...");
    }
);

module.exports = router;
