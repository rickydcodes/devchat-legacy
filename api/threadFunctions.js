const express = require("express");
const server = require("../server.js");
const rateLimit = require("express-rate-limit");
const mainDbHandler = require("./db/mainHandler.js");
const threadDbHandler = require("./db/threadHandler.js");
const adminHandler = require("./db/adminHandler.js");
const forumDbHandler = require("./db/forumHandler.js");
const middleware = require("./utils/middleware.js");
const router = express.Router();
const Joi = require("joi");
const replySchema = Joi.object({
    body: Joi.string().max(5000).required(),
});
const editSchema = Joi.object({
    body: Joi.string().max(5000).required(),
});
const likeDislikeLimit = rateLimit({
    windowMs: 10 * 60 * 1000,
    max: 50,
    message: "You can only like/dislike threads in a topic 50 times in 10 minutes",
});
const replyLimit = rateLimit({
    windowMs: 10 * 60 * 1000,
    max: 20,
    message: "You can only reply to posts in a topic 20 times in 10 minutes",
});
const editLimit = rateLimit({
    windowMs: 10 * 60 * 1000,
    max: 20,
    message: "You can only edit replies/threads 20 times in 10 minutes",
});
const deleteLimit = rateLimit({
    windowMs: 10 * 60 * 1000,
    max: 5,
    message: "You can only delete 5 threads/posts every 10 minutes.",
});

async function like(threadDocument, messageId, threadId, userId) {
    let post = messageId == 0;
    if (
        (post && !threadDocument.likes.includes(userId)) ||
        (!post &&
            !threadDocument.replies[messageId - 1].likes.includes(
                userId
            ))
    ) {
        await threadDbHandler.likeMessage(threadId, userId, messageId);

        let posterId = post ? threadDocument.posterId : threadDocument.replies[messageId - 1].posterId;

        await mainDbHandler.createNotification(posterId, {
            type: "like",
            message: post ?
                "You got a new like on your post!" : "You got a new like on your reply!",
            replyId: messageId,
            threadId: threadId,
        });
    } else if (
        (post && threadDocument.likes.includes(userId)) ||
        (!post &&
            threadDocument.replies[messageId - 1].likes.includes(userId))
    ) {
        await threadDbHandler.unlikeMessage(threadId, userId, messageId);
    }
}

async function dislike(threadDocument, messageId, threadId, userId) {
    let post = messageId == 0;
    if (
        (post && !threadDocument.dislikes.includes(userId)) ||
        (!post &&
            !threadDocument.replies[messageId - 1].dislikes.includes(
                userId
            ))
    ) {
        await threadDbHandler.dislikeMessage(threadId, userId, messageId);
    } else if (
        (post && threadDocument.dislikes.includes(userId)) ||
        (!post &&
            threadDocument.replies[messageId - 1].dislikes.includes(userId))
    ) {
        await threadDbHandler.undislikeMessage(threadId, userId, messageId);
    }
}

async function addProperThreadData(threadDocument, posterDocument) {
    let postDate = `${
        threadDocument.postDate.getMonth() + 1
    }/${threadDocument.postDate.getDate()}/${threadDocument.postDate.getFullYear()}`;
    threadDocument.postDate = postDate;
    for (let reply of threadDocument.replies) {
        let replyPosterDocument = await mainDbHandler.indexDbDocument("users", {
            _id: reply.posterId,
        });
        reply.username = replyPosterDocument.username;
        reply.profilepicture = replyPosterDocument.profilepicture;
        reply.skilllevel = replyPosterDocument.skilllevel;
        let replyPostDate = `${
            reply.postDate.getMonth() + 1
        }/${reply.postDate.getDate()}/${reply.postDate.getFullYear()}`;
        reply.postDate = replyPostDate;
    }

    threadDocument.username = posterDocument.username;
    threadDocument.profilepicture = posterDocument.profilepicture;
    threadDocument.skilllevel = posterDocument.skilllevel;
}

async function handleReplyPosterId(threadDocument, reply, threadId, userDocument) {
    let replyPosterId = replyToId == 0 ? threadDocument.posterId : threadDocument.replies[replyToId - 1].posterId;

    if (replyPosterId != userDocument["_id"]) {
        await mainDbHandler.createNotification(replyPosterId, {
            type: "reply",
            threadId: threadId,
            replyId: threadDocument.replies.length,
            message: `You got a new reply from ${userDocument.username}!`,
        });
        await server.db.collection("users").updateOne({
            _id: userDocument["_id"]
        }, {
            $push: {
                recentReplyActivity: {
                    threadId: threadId,
                    replyId: reply,
                },
            },
        });
    }
}

router.patch(
    "/like",
    likeDislikeLimit,
    middleware.notLoggedInError,
    middleware.bannedError,
    async (req, res) => {
        let threadId = parseInt(req.query.threadId);
        let messageId = parseInt(req.query.messageId);
        let threadDocument = await mainDbHandler.indexDbDocument("threads", {
            _id: threadId,
        });
        let allowedTopics = forumDbHandler.threadsAllowedToView(req.userDocument);
        if (!allowedTopics.includes(threadDocument.topic)) {
            res.status(401).send("You are not allowed to access threads in this topic.");
            return;
        }
        if (threadDocument == undefined) {
            res.status(404).send("No thread exists with this id");
            return;
        }
        try {
            await like(threadDocument, messageId, threadId, req.session.accountid);

            threadDocument = await mainDbHandler.indexDbDocument("threads", {
                _id: threadId,
            });

            let likes = messageId == 0 ? threadDocument.likes.length : threadDocument.replies[messageId - 1].likes.length;
            let dislikes = messageId == 0 ? threadDocument.dislikes.length : threadDocument.replies[messageId - 1].dislikes.length;

            res.status(200).send({
                likes: likes,
                dislikes: dislikes,
            });
        } catch (err) {
            console.log(err);
            res.status(404).send("Something went wrong...");
        }
    }
);

router.patch(
    "/dislike",
    likeDislikeLimit,
    middleware.notLoggedInError,
    middleware.bannedError,
    async (req, res) => {
        let threadId = parseInt(req.query.threadId);
        let messageId = parseInt(req.query.messageId);
        let threadDocument = await mainDbHandler.indexDbDocument("threads", {
            _id: threadId,
        });
        let allowedTopics = forumDbHandler.threadsAllowedToView(req.userDocument);
        if (!allowedTopics.includes(threadDocument.topic)) {
            res.status(401).send("You are not allowed to access threads in this topic.");
            return;
        }
        if (threadDocument == undefined) {
            res.status(404).send("No thread exists with this id");
            return;
        }
        try {
            await dislike(threadDocument, messageId, threadId, req.session.accountid);

            threadDocument = await mainDbHandler.indexDbDocument("threads", {
                _id: threadId,
            });

            let likes = messageId == 0 ? threadDocument.likes.length : threadDocument.replies[messageId - 1].likes.length;
            let dislikes = messageId == 0 ? threadDocument.dislikes.length : threadDocument.replies[messageId - 1].dislikes.length;

            res.status(200).send({
                likes: likes,
                dislikes: dislikes,
            });
        } catch (err) {
            console.log(err);
            res.status(404).send("Something went wrong...");
        }
    }
);

router.post(
    "/reply",
    replyLimit,
    middleware.notLoggedInError,
    middleware.bannedError,
    async (req, res) => {
        let threadId = parseInt(req.query.threadId);
        let replyToId = parseInt(req.query.replyTo);
        let replyBody = req.body.replyBody;
        let threadValidation = replySchema.validate({
            body: replyBody,
        });
        let threadDocument = await mainDbHandler.indexDbDocument("threads", {
            _id: threadId,
        });
        let userDocument = req.userDocument;
        let allowedTopics = forumDbHandler.threadsAllowedToView(userDocument);
        if (!allowedTopics.includes(threadDocument.topic)) {
            res.status(401).send("You are not allowed to access threads in this topic.");
            return;
        }

        if (threadValidation.error != undefined) {
            res.status(400).send(threadValidation.error.message);
            return;
        }

        if (
            threadDocument != undefined &&
            threadDocument != null &&
            ((replyToId == 0 && !threadDocument.deleted) ||
                (replyToId != 0 && !threadDocument.replies[replyToId - 1].deleted))
        ) {
            res.status(404).send("No thread exists with this id");
            return;
        }

        if (
            threadDocument.enableReplies ||
            userDocument["_id"] == threadDocument.posterId ||
            userDocument.administrator
        ) {
            res.status(405).send("The poster has disabled replies.");
            return;
        }

        try {
            let reply = await threadDbHandler.reply(
                threadId,
                replyBody,
                req.session.accountid,
                replyToId
            );
            threadDocument = await mainDbHandler.indexDbDocument("threads", {
                _id: threadId,
            });

            handleReplyPosterId(threadDocument, reply, threadId, userDocument);

            let posterDocument = await mainDbHandler.indexDbDocument("users", {
                _id: threadDocument.posterId,
            });
            addProperThreadData(threadDocument, posterDocument);

            await server.db.collection("threads").updateOne({
                _id: threadId
            }, {
                $inc: {
                    replyNumber: 1
                }
            });

            res.render("forum/thread", {
                layout: "blank",
                thread: threadDocument,
                title: "Thread",
                script: "forum/thread",
                stylesheet: "forum/thread",
                posterDocument: posterDocument,
                userDocument: userDocument,
                user: userDocument,
                messages: [threadDocument, ...threadDocument.replies],
            });
        } catch (err) {
            console.log(err);
            res.status(404).send("Something went wrong...");
        }
    }
);

router.delete(
    "/deleteReply",
    deleteLimit,
    middleware.notLoggedInError,
    middleware.bannedError,
    async (req, res) => {
        let threadId = parseInt(req.query.threadId);
        let replyId = parseInt(req.query.replyId);
        let threadDocument = await mainDbHandler.indexDbDocument("threads", {
            _id: threadId,
        });
        let userDocument = req.userDocument;

        if (threadDocument && !threadDocument.replies[replyId - 1].deleted) {
            if (
                userDocument.administrator ||
                threadDocument.replies[replyId - 1].posterId == req.session.accountid
            ) {
                try {
                    await threadDbHandler.deleteReply(threadId, replyId, threadDocument.replies);
                    if (userDocument.administrator) {
                        adminHandler.addToAuditLog(req.session.accountid, {
                            type: "deleteReply",
                            threadId: threadId,
                            replyId: replyId,
                            userId: -1,
                            reason: "Reply Broke Rules",
                        });
                    }

                    let replyPosterId = threadDocument.replies[replyId - 1].posterId;
                    if (replyPosterId != req.session.accountid) {
                        await mainDbHandler.createNotification(replyPosterId, {
                            type: "replyDeleted",
                            message: `Your reply, '${threadDocument.replies[replyId - 1].body.slice(
                                0,
                                10
                            )}' was deleted by an admin.`,
                        });
                    }

                    threadDocument = await mainDbHandler.indexDbDocument("threads", {
                        _id: threadId,
                    });

                    let posterDocument = await mainDbHandler.indexDbDocument("users", {
                        _id: threadDocument.posterId,
                    });
                    let postDate = `${
                        threadDocument.postDate.getMonth() + 1
                    }/${threadDocument.postDate.getDate()}/${threadDocument.postDate.getFullYear()}`;
                    threadDocument.postDate = postDate;
                    for (let reply of threadDocument.replies) {
                        let replyPosterDocument = await mainDbHandler.indexDbDocument("users", {
                            _id: reply.posterId,
                        });
                        reply.username = replyPosterDocument.username;
                        reply.profilepicture = replyPosterDocument.profilepicture;
                        reply.skilllevel = replyPosterDocument.skilllevel;
                        let replyPostDate = `${
                            reply.postDate.getMonth() + 1
                        }/${reply.postDate.getDate()}/${reply.postDate.getFullYear()}`;
                        reply.postDate = replyPostDate;
                    }

                    threadDocument.username = posterDocument.username;
                    threadDocument.profilepicture = posterDocument.profilepicture;
                    threadDocument.skilllevel = posterDocument.skilllevel;

                    await server.db.collection("threads").updateOne({
                        _id: threadId
                    }, {
                        $inc: {
                            replyNumber: -1
                        }
                    });

                    res.render("forum/thread", {
                        layout: "blank",
                        thread: threadDocument,
                        title: "Thread",
                        script: "forum/thread",
                        stylesheet: "forum/thread",
                        posterDocument: posterDocument,
                        userDocument: userDocument,
                        user: userDocument,
                        messages: [threadDocument, ...threadDocument.replies],
                    });
                } catch (err) {
                    console.log(err);
                    res.status(404).send("Something went wrong...");
                }
            } else {
                res.status(403).send(
                    "You must be the creator of the reply or an administrator to delete it."
                );
            }
        } else {
            res.status(404).send("No thread exists with this id");
        }
    }
);
router.put(
    "/editReply",
    editLimit,
    middleware.notLoggedInError,
    middleware.bannedError,
    async (req, res) => {
        let threadId = parseInt(req.query.threadId);
        let messageId = parseInt(req.query.messageId);
        let body = req.body.body;
        let threadDocument = await mainDbHandler.indexDbDocument("threads", {
            _id: threadId,
        });
        let userDocument = req.userDocument;
        let editValidation = editSchema.validate({
            body: body,
        });
        if (editValidation.error != undefined) {
            res.status(400).send(editValidation.error.message);
            return;
        }

        if (threadDocument != undefined && threadDocument != undefined) {
            if (threadDocument.replies[messageId - 1]) {
                try {
                    let replies = threadDocument.replies;
                    replies[messageId - 1].body = body;
                    await server.db.collection("threads").updateOne({
                        _id: threadId
                    }, {
                        $set: {
                            replies: replies,
                        },
                    });
                    threadDocument = await mainDbHandler.indexDbDocument("threads", {
                        _id: threadId,
                    });

                    let posterDocument = await mainDbHandler.indexDbDocument("users", {
                        _id: threadDocument.posterId,
                    });
                    let postDate = `${
                        threadDocument.postDate.getMonth() + 1
                    }/${threadDocument.postDate.getDate()}/${threadDocument.postDate.getFullYear()}`;
                    threadDocument.postDate = postDate;
                    for (let reply of threadDocument.replies) {
                        let replyPosterDocument = await mainDbHandler.indexDbDocument("users", {
                            _id: reply.posterId,
                        });
                        reply.username = replyPosterDocument.username;
                        reply.profilepicture = replyPosterDocument.profilepicture;
                        reply.skilllevel = replyPosterDocument.skilllevel;
                        let replyPostDate = `${
                            reply.postDate.getMonth() + 1
                        }/${reply.postDate.getDate()}/${reply.postDate.getFullYear()}`;
                        reply.postDate = replyPostDate;
                    }

                    threadDocument.username = posterDocument.username;
                    threadDocument.profilepicture = posterDocument.profilepicture;
                    threadDocument.skilllevel = posterDocument.skilllevel;
                    res.render("forum/thread", {
                        layout: "blank",
                        thread: threadDocument,
                        title: "Thread",
                        script: "forum/thread",
                        stylesheet: "forum/thread",
                        posterDocument: posterDocument,
                        userDocument: userDocument,
                        user: userDocument,
                        messages: [threadDocument, ...threadDocument.replies],
                    });
                } catch (err) {
                    console.log(err);
                    res.status(404).send("Something went wrong...");
                }
            } else {
                res.status(404).send("No reply exists with this id");
            }
        } else {
            res.status(404).send("No thread exists with this id");
        }
    }
);

module.exports = router;