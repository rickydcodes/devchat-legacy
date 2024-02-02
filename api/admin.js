const express = require("express");
const server = require("../server.js");
const mainDbHandler = require("./db/mainHandler.js");
const adminHandler = require("./db/adminHandler.js");
const rulesJSON = require("./utils/json/rules.json");
const middleware = require("./utils/middleware.js");
const rateLimit = require("express-rate-limit");
const router = express.Router();
const Joi = require("joi");
const deleteReasonSchema = Joi.object({
    reason: Joi.string().max(5000).required(),
});

const makeAdminLimit = rateLimit({
    windowMs: 30 * 60 * 1000,
    max: 3,
    message: "You can only give/remove admin powers three times every 30 mins",
});
const deleteLimit = rateLimit({
    windowMs: 10 * 60 * 1000,
    max: 5,
    message: "You can only delete threads 5 times in 10 minutes",
});
const banLimit = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 5,
    message: "You can only ban 5 users in 15 minutes",
});
const unBanLimit = rateLimit({
    windowMs: 10 * 60 * 1000,
    max: 3,
    message: "You can only unban 3 users in 10 minutes",
});

async function checkUserAdminError(req, res, next) {
    if (req.userDocument.administrator) {
        next();
    } else {
        res.status(403).send("You are not an administrator.");
    }
}

async function checkUserAdminPage(req, res, next) {
    if (req.userDocument.administrator) {
        next();
    } else {
        res.render("admin/notAdmin", {
            title: "Not Admin",
            stylesheet: "admin/notAdmin",
            script: "",
            message: "You are not an administrator.",
        });
    }
}

router.get(
    "/admin/delete/:threadId",
    middleware.notLoggedInRedirect,
    checkUserAdminPage,
    async (req, res) => {
        let threadId = parseInt(req.params.threadId);
        let threadDocument = await mainDbHandler.indexDbDocument("threads", {
            _id: threadId,
        });
        let user = req.userDocument;
        if (!threadDocument) {
            res.render("admin/notAdmin", {
                title: "Invalid ID",
                stylesheet: "admin/notAdmin",
                script: "",
                message: "Not a valid thread ID.",
            });
        } else if (threadDocument.deleted) {
            res.render("admin/notAdmin", {
                title: "Deleted Thread",
                stylesheet: "admin/notAdmin",
                script: "",
                message: "This thread has already been deleted.",
            });
        } else {
            let postDate = `${
                threadDocument.postDate.getMonth() + 1
            }/${threadDocument.postDate.getDate()}/${threadDocument.postDate.getFullYear()}`;
            threadDocument.postDate = postDate;

            let posterDocument = await mainDbHandler.indexDbDocument("users", {
                _id: threadDocument.posterId,
            });

            threadDocument.username = posterDocument.username;
            threadDocument.profilepicture = posterDocument.profilepicture;

            res.render("admin/deleteThread", {
                title: "Delete Thread",
                user: user,
                stylesheet: "admin/deleteThread",
                script: "admin/deleteThread",
                thread: threadDocument,
            });
        }
    }
);

router.delete(
    "/admin/deleteThread",
    middleware.notLoggedInRedirect,
    checkUserAdminError,
    deleteLimit,
    async (req, res) => {
        let threadId = parseInt(req.query.threadId);
        let reason = req.body.reason;
        let threadDocument = await mainDbHandler.indexDbDocument("threads", {
            _id: threadId,
        });
        let validReason = deleteReasonSchema.validate({
            reason: reason,
        });

        if (validReason.error != undefined) {
            res.status(400).send(validReason.error.message);
            return;
        }

        if (!threadDocument) {
            res.status(404).send("Thread does not exist");
        } else if (threadDocument.deleted) {
            res.status(404).send("Thread has already been deleted");
        } else {
            try {
                await adminHandler.addToAuditLog(req.session.accountid, {
                    type: "deleteThread",
                    threadId: threadId,
                    replyId: -1,
                    userId: -1,
                    reason: reason,
                });
                await adminHandler.deleteThread(threadId);
                res.status(200).send("OK");
            } catch (err) {
                console.log(err);
                res.status(500).send("Something went wrong...");
            }
        }
    }
);

router.get(
    "/admin/ban/:userId",
    middleware.notLoggedInRedirect,
    checkUserAdminPage,
    async (req, res) => {
        let userToBanId = parseInt(req.params.userId);
        let userToBan = await mainDbHandler.indexDbDocument("users", {
            _id: userToBanId,
        });
        let user = req.userDocument;
        if (!user) {
            res.render("admin/notAdmin", {
                title: "Invalid User ID",
                stylesheet: "admin/notAdmin",
                script: "",
                message: "Not a valid user id.",
            });
        } else {
            res.render("admin/banUser", {
                title: "Ban User",
                user: user,
                stylesheet: "admin/banUser",
                script: "admin/banUser",
                userToBan: userToBan,
                rules: rulesJSON,
            });
        }
    }
);

router.patch(
    "/admin/banUser",
    middleware.notLoggedInError,
    checkUserAdminError,
    banLimit,
    async (req, res) => {
        let userToBanId = parseInt(req.query.userId);
        let ruleNumber = parseInt(req.body.rule);
        let description = req.body.description;
        let validReason = deleteReasonSchema.validate({
            reason: description,
        });

        let userToBanDocument = await mainDbHandler.indexDbDocument("users", {
            _id: userToBanId,
        });

        if (validReason.error != undefined) {
            res.status(400).send(validReason.error.message);
            return;
        }

        if (!userToBanDocument) {
            res.status(404).send("User does not exist");
        } else if (userToBanDocument.banned != false) {
            res.status(404).send(
                "User has already been banned. If they violate a rule during the time that they're banned, you can permanently ban them when their current ban has expired."
            );
        } else {
            try {
                await adminHandler.addToAuditLog(req.session.accountid, {
                    type: "banUser",
                    threadId: -1,
                    replyId: -1,
                    userId: userToBanId,
                    reason: description,
                });
                await adminHandler.banUser(userToBanId, ruleNumber, description);
                res.status(200).send(`${rulesJSON[ruleNumber].banLength} hours`);
            } catch (err) {
                console.log(err);
                res.status(500).send("Something went wrong...");
            }
        }
    }
);

router.patch(
    "/admin/unbanUser",
    middleware.notLoggedInError,
    checkUserAdminError,
    unBanLimit,
    async (req, res) => {
        let userToBanId = parseInt(req.query.userId);
        let ruleNumber = parseInt(req.body.rule);
        let description = req.body.description;
        let validReason = deleteReasonSchema.validate({
            reason: description,
        });

        let userToBanDocument = await mainDbHandler.indexDbDocument("users", {
            _id: userToBanId,
        });

        if (validReason.error != undefined) {
            res.status(400).send(validReason.error.message);
            return;
        }

        if (!userToBanDocument) {
            res.status(404).send("User does not exist");
        } else if (!userToBanDocument.banned) {
            res.status(404).send("User is not banned.");
        } else {
            try {
                await adminHandler.addToAuditLog(req.session.accountid, {
                    type: "unBanUser",
                    threadId: -1,
                    replyId: -1,
                    userId: userToBanId,
                    reason: description,
                });
                await adminHandler.unbanUser(userToBanId, ruleNumber, description);
                res.status(200).send(`User unbanned.`);
            } catch (err) {
                console.log(err);
                res.status(500).send("Something went wrong...");
            }
        }
    }
);

router.get("/getAuditLog", middleware.notLoggedInError, checkUserAdminError, async (req, res) => {
    let user = req.userDocument;
    let sort = req.query.sort || "recentActions";
    if (["recentActions", "myActions"].includes(sort)) {
        let logs = await adminHandler.getAuditLog(sort, req.session.accountid);
        if (logs.length) {
            for (let log of logs) {
                log.date = log.date.findDifference();
                let adminDoc = await server.db.collection("users").findOne({ _id: log.adminId });
                log.adminUsername = adminDoc.username;

                if (log.replyId != -1) {
                    let threadDoc = await server.db
                        .collection("threads")
                        .findOne({ _id: log.threadId });
                    log.replyBody = threadDoc.replies[replyId - 1].splice(0, 15);
                } else if (log.threadId != -1) {
                    let threadDoc = await server.db
                        .collection("threads")
                        .findOne({ _id: log.threadId });
                    log.threadTitle = threadDoc.title.slice(0, 15);
                } else if (log.userId != -1) {
                    let userDoc = await server.db.collection("users").findOne({ _id: log.userId });
                    log.username = userDoc.username;
                }
            }
            logs.unshift({});
            res.render("admin/auditLog", {
                layout: "blank",
                title: "Audit Log",
                stylesheet: "",
                script: "",
                user: user,
                logs: logs,
            });
        } else {
            res.render("forum/nothreads", {
                layout: "blank",
                stylesheet: "",
                script: "",
                title: "",
                message: "No audit logs exist that match the filter.",
                user: user,
            });
        }
    } else {
        res.render("forum/nothreads", {
            layout: "blank",
            stylesheet: "",
            script: "",
            title: "404",
            message: "You cannot sort by this.",
            user: user,
        });
    }
});

router.put("/admin/setAdmin", middleware.notLoggedInError, checkUserAdminError, makeAdminLimit, async (req, res) => {
    let userId = parseInt(req.query.userId);
    let setAdminUser = await mainDbHandler.indexDbDocument("users", {
        _id: userId,
    });
    if (req.userDocument.administrator == "Owner") {
        try {
            let adminUpdate = {
                $set: {
                    administrator: setAdminUser.administrator ? false : true
                }
            }
            let adminBadge = {
                title: "Administrator",
                description: "This user is an administrator.",
                image: "admin.png",
            }
            if (!setAdminUser.administrator) {
                adminUpdate = Object.assign({
                    $push: {
                        badges: {
                            $each: [adminBadge],
                            $position: 0,
                        },
                    },
                }, adminUpdate);
            } else {
                adminUpdate = Object.assign({
                    $pull: {
                        badges: adminBadge
                    },
                }, adminUpdate);
            }
            await server.db.collection("users").updateOne({_id: userId}, adminUpdate);
            res.status(200).send(setAdminUser.administrator ? "Give Admin Powers" : "Remove Admin Powers")
        } catch (err) {
            res.status(404).send(err);
        }
    } else {
        res.status(401).send("You do not possess owner powers. - Admin ;) ")
    }
});

module.exports = router;
