const express = require("express");
const rateLimit = require("express-rate-limit");
const mainDbHandler = require("./db/mainHandler.js");
const forumDbHandler = require("./db/forumHandler.js");
const middleware = require("./utils/middleware.js");
const server = require("../server.js");
const router = express.Router();
const createThreadLimit = rateLimit({
    windowMs: 10 * 60 * 1000,
    max: 1,
    message: "You can only post one thread every 10 minutes",
});
const getThreadLimit = rateLimit({
    windowMs: 10 * 60 * 1000,
    max: 35,
    message: "You can only get threads in a topic 35 times in 10 minutes",
});
const Joi = require("joi");
const getThreadsSchema = Joi.object({
    topic: Joi.string().max(50).required(),
    page: Joi.number().max(7500).required(),
    sort: Joi.string().max(9).required(),
});
const createThreadSchema = Joi.object({
    title: Joi.string().max(50).required(),
    topic: Joi.string().max(50).required(),
    body: Joi.string().max(5000).required(),
});

router.get(
    "/forum",
    middleware.notLoggedInRedirect,
    middleware.bannedRedirect,
    async (req, res) => {
        let user = req.userDocument;
        let topics = forumDbHandler.threadsAllowedToView(user);
        res.render("forum/forum", {
            title: "Forum",
            stylesheet: "forum/forum",
            script: "forum/forum",
            user: user,
            topics: topics,
        });
    }
);

router.get(
    "/createThread",
    middleware.notLoggedInRedirect,
    middleware.bannedRedirect,
    async (req, res) => {
        let user = req.userDocument;
        let allowedTopics = forumDbHandler.threadsAllowedToCreate(user);
        res.render("forum/createthread", {
            title: "Create Thread",
            stylesheet: "forum/createthread",
            script: "forum/createthread",
            user: user,
            topics: allowedTopics,
        });
    }
);

router.post(
    "/createThread",
    middleware.notLoggedInError,
    middleware.bannedError,
    createThreadLimit,
    async (req, res) => {
        let user = req.userDocument;
        let allowedTopics = forumDbHandler.threadsAllowedToCreate(user);
        let title = req.body.title;
        let topic = req.body.topic;
        let body = req.body.body;
        let enableReplies = req.body.enableReplies;
        let threadValidation = createThreadSchema.validate({
            title: title,
            topic: topic,
            body: body,
        });
        if (threadValidation.error != undefined) {
            res.status(400).send(threadValidation.error.message);
            return;
        }
        if (allowedTopics.indexOf(topic) == -1) {
            res.status(400).send("topic does not exist");
            return;
        }

        try {
            if (enableReplies == "true") enableReplies = true;
            if (enableReplies == "false") enableReplies = false;
            let settings = {
                enableReplies: enableReplies,
            };
            let newThread = await forumDbHandler.createThread(title, topic, body, user, settings);

            for (let follower of user.followers) {
                await mainDbHandler.createNotification(follower, {
                    type: "followingUserThreadPost",
                    threadId: await server.db.collection("threads").countDocuments(),
                    message: `A user you follow, ${user.username}, posted a new thread!`,
                });
            }

            res.status(200).send(newThread.ops[0]["_id"].toString());
            return;
        } catch (err) {
            console.log(err);
        }

        res.status(404).send("Something went wrong...");
    }
);

router.get(
    "/getThreads",
    middleware.notLoggedInError,
    middleware.bannedError,
    getThreadLimit,
    async (req, res) => {
        let topic = req.query.topic;
        let page = parseInt(req.query.page);
        let sort = req.query.sort;
        let searchText = req.query.search;
        let topicValidation = getThreadsSchema.validate({
            topic: topic,
            page: page,
            sort: sort,
        });
        let userDocument = req.userDocument;
        if (topicValidation.error != undefined) {
            res.status(400).send(topicValidation.error.message);
            return;
        }
        let allTopics = forumDbHandler.threadsAllowedToView({
            ...userDocument,
            administrator: true,
        });

        if (!allTopics.includes(topic)) {
            res.status(400).render("forum/nothreads", {
                layout: "blank",
                message: "Topic does not exist",
                user: userDocument,
            });
            return;
        }

        let topics = forumDbHandler.threadsAllowedToView(userDocument);

        if (!topics.includes(topic)) {
            res.status(401).render("forum/nothreads", {
                layout: "blank",
                message: "You do not have access to this topic",
                user: userDocument,
            });
            return;
        }

        if (["recent", "trending", "mythreads", "deleted"].indexOf(sort) == -1) {
            res.status(400).render("forum/nothreads", {
                layout: "blank",
                message: "User cannot sort by this",
                user: userDocument,
            });
            return;
        }

        let threads = await forumDbHandler.getThreads(topic, page, sort, searchText, req.session.accountid);
        let threadPageCount = await forumDbHandler.threadPageCount(
            topic,
            page,
            sort,
            searchText,
            req.session.accountid
        );
        if (page > Math.ceil(threadPageCount.length / 12) && threadPageCount.length > 0) {
            res.render("forum/nothreads", {
                layout: "blank",
                message: "There are no more threads on this page",
                user: userDocument,
            });
            return;
        }
        if (threads.hasThreads == false) {
            res.render("forum/nothreads", {
                layout: "blank",
                message: "You don't have any created threads",
                user: userDocument,
            });
            return;
        }
        for (let thread in threads) {
            threads[thread].timeDifference = threads[thread].postDate.findDifference();
        }
        if (threads.length > 0) {
            res.render("forum/threads", {
                layout: "blank",
                threads: threads,
                threadPageCount: Math.ceil(threadPageCount.length / 12),
                page: page,
                user: userDocument,
            });
        } else {
            res.render("forum/nothreads", {
                layout: "blank",
                message: "There are no threads in this category.",
                user: userDocument,
            });
        }
    }
);

router.get(
    "/threads/:id",
    middleware.notLoggedInRedirect,
    middleware.bannedRedirect,
    async (req, res) => {
        let id = parseInt(req.params.id);
        let threadDocument = await mainDbHandler.indexDbDocument("threads", {
            _id: id,
        });
        let userDocument = req.userDocument;
        let allowedTopics = forumDbHandler.threadsAllowedToView(userDocument);
        if (!allowedTopics.includes(threadDocument.topic)) {
            res.render("forum/nothreads", {
                script: "",
                stylesheet: "",
                title: "Topic Unallowed",
                message: "You are not allowed to view threads in this topic.",
                user: userDocument,
            });
            return;
        }
        if (threadDocument != null) {
            if (!threadDocument.deleted || userDocument.administrator) {
                let posterDocument = await mainDbHandler.indexDbDocument("users", {
                    _id: threadDocument.posterId,
                });
                if (posterDocument != null) {
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
                        reply.postDate = `${
                            reply.postDate.getMonth() + 1
                        }/${reply.postDate.getDate()}/${reply.postDate.getFullYear()}`;
                    }

                    threadDocument.username = posterDocument.username;
                    threadDocument.profilepicture = posterDocument.profilepicture;
                    threadDocument.skilllevel = posterDocument.skilllevel;

                    res.render("forum/thread", {
                        thread: threadDocument,
                        title: "Thread",
                        script: "forum/thread",
                        stylesheet: "forum/thread",
                        posterDocument: posterDocument,
                        userDocument: userDocument,
                        user: userDocument,
                        messages: [threadDocument, ...threadDocument.replies],
                    });
                }
            } else {
                res.render("forum/nothreads", {
                    script: "",
                    stylesheet: "",
                    title: "Deleted Thread",
                    message: "This thread has been deleted.",
                    user: userDocument,
                });
            }
        } else {
            res.status(404).send("No thread exists with this id");
        }
    }
);

module.exports = router;
