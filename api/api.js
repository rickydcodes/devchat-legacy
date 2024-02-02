const express = require("express");
const server = require("../server.js");
const rateLimit = require("express-rate-limit");
const mainDbHandler = require("./db/mainHandler.js");
const forumDbHandler = require("./db/forumHandler.js");
const middleware = require("./utils/middleware.js");
const router = express.Router();
const searchLimit = rateLimit({
    windowMs: 10 * 60 * 1000,
    max: 15,
    message: "Too many requests sent, please try again in 10 minutes",
});
const changeStatusLimit = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 5,
    message: "Too many requests sent, please try again in 15 minutes",
});
const viewThreadLimit = rateLimit({
    windowMs: 3 * 60 * 1000,
    max: 20,
    message: "To prevent spamming views of threads, try again in a few minutes",
});
const changePasswordLimit = rateLimit({
    windowMs: 24 * 60 * 60 * 1000,
    max: 1,
    message: "You can only change your password once per day. Wait 24 hours to try again.",
});
const Joi = require("joi");
const changePasswordSchema = Joi.object({
    password: Joi.string().min(6).max(20).required(),
    newPassword: Joi.string().min(6).max(20).required(),
    confirmedPassword: Joi.string().min(6).max(20).required(),
});

router.get("/getPublicInfo/", async (req, res) => {
    let publicUserData = await mainDbHandler.getPublicInfo(req.body.id);
    res.send(publicUserData);
});

router.get("/search", middleware.notLoggedInRedirect, searchLimit, async (req, res) => {
    let username = req.query.username;
    let user = await mainDbHandler.indexDbDocument("users", {
        username: username,
    });
    if (user == undefined) {
        res.status(404).send("User does not exist");
        return;
    }
    res.send(user["_id"].toString());
});

router.put("/changeStatus", middleware.notLoggedInError, changeStatusLimit, async (req, res) => {
    let status = req.body.status;
    if (status == undefined) res.send("Proper arguments not passed");
    try {
        await mainDbHandler.updateUserById(req.session.accountid, {
            status: status,
        });
    } catch (err) {
        throw err;
    }
    res.send("OK");
});

router.post("/signout", middleware.notLoggedInError, (req, res) => {
    req.session.accountid = null;
    res.send("OK");
});

router.patch(
    "/viewThread",
    middleware.notLoggedInError,
    middleware.bannedError,
    viewThreadLimit,
    async (req, res) => {
        let id = parseInt(req.query.id);
        let threadDocument = await mainDbHandler.indexDbDocument("threads", {
            _id: id,
        });
        if (threadDocument == undefined) {
            res.status(404).send("Thread does not exist");
        } else {
            await forumDbHandler.viewThread(id);
            res.send("OK");
        }
    }
);

router.patch("/reactivateAccount", middleware.notLoggedInError, async (req, res) => {
    let agreed = req.query.agree;
    if (new Date() >= req.userDocument.banned.length && agreed == "true") {
        await server.db.collection("users").updateOne(
            { _id: req.session.accountid },
            {
                $set: {
                    banned: false,
                },
            }
        );
        res.status(200).send("Successfully re-activated account");
    } else {
        res.status(400).send("The user's account cannot be re-activated as they're still banned.");
    }
});

router.put(
    "/changePassword",
    middleware.notLoggedInError,
    middleware.bannedError,
    changePasswordLimit,
    async (req, res) => {
        let password = req.query.password;
        let newPassword = req.query.newPassword;
        let confirmedPassword = req.query.confirmedPassword;

        let userDocument = req.userDocument;

        let passwordValidation = changePasswordSchema.validate({
            password: password,
            newPassword: newPassword,
            confirmedPassword: confirmedPassword,
        });
        let secondPasswordValidation = mainDbHandler.verifyChangingPasswordData(
            password,
            newPassword,
            confirmedPassword,
            userDocument
        );
        if (passwordValidation.error != undefined) {
            res.status(400).send(passwordValidation.error.message);
            return;
        }
        if (secondPasswordValidation != false) {
            res.status(400).send(secondPasswordValidation);
            return;
        }

        try {
            await server.db.collection("users").updateOne(
                { _id: req.session.accountid },
                {
                    $set: {
                        password: newPassword,
                    },
                }
            );
            res.status(200).send("Password changed successfully!");
            return;
        } catch (err) {
            if (err) console.log(err);
        }

        res.status(404).send("Something went wrong.");
    }
);

router.put("/setOnline", middleware.notLoggedInError, middleware.bannedError, async (req, res) => {
    try {
        await server.db.collection("users").updateOne(
            {
                _id: req.session.accountid,
            },
            {
                $set: {
                    lastOnline: new Date(),
                },
            }
        );

        res.status(200).send("OK");
        return;
    } catch (err) {
        console.log(err);
    }

    res.status(404).send("Something went wrong.");
});

module.exports = router;
