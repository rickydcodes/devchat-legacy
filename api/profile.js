const express = require("express");
const mainDbHandler = require("./db/mainHandler.js");
const middleware = require("./utils/middleware.js");
const router = express.Router();

router.get("/profile", middleware.notLoggedInRedirect, async (req, res) => {
    res.redirect(`/users/${req.session.accountid}`);
});

router.get(
    "/users/:id",
    middleware.notLoggedInRedirect,
    middleware.bannedRedirect,
    async (req, res) => {
        let id = req.params.id;
        let profileUser = await mainDbHandler.indexDbDocument("users", {
            _id: parseInt(id),
        });
        let user = req.userDocument;
        if (profileUser == undefined) {
            res.render("forum/nothreads", {
                stylesheet: "",
                script: "",
                title: "404",
                message: "This user does not exist.",
                user: user,
            });
            return;
        }
        if (!profileUser.banned) {
            let joinDate = `${
                profileUser.joindate.getMonth() + 1
            }/${profileUser.joindate.getDate()}/${profileUser.joindate.getFullYear()}`;
            let lastOnline = `${
                profileUser.lastOnline.getMonth() + 1
            }/${profileUser.lastOnline.getDate()}/${profileUser.lastOnline.getFullYear()}`;
            let recentThreads = await mainDbHandler.getRecentThreads(req.session.accountid);

            for (let thread of recentThreads) {
                thread.timeDifference = thread.postDate.findDifference();
            }

            res.render("main/profile", {
                title: "Profile",
                stylesheet: "main/profile",
                script: "profile",
                joindate: joinDate,
                online: new Date() - profileUser.lastOnline <= 1000 * 60 * 5 ? true : false,
                lastOnline: lastOnline,
                profileUser: profileUser,
                user: user,
                recentThreads: recentThreads,
            });
        } else {
            res.render("bannedProfile", {
                title: "Banned",
                stylesheet: "",
                script: "",
            });
        }
    }
);

router.get(
    "/users/:id/followers",
    middleware.notLoggedInRedirect,
    middleware.bannedRedirect,
    async (req, res) => {
        let id = req.params.id;
        let profileUser = await mainDbHandler.indexDbDocument("users", {
            _id: parseInt(id),
        });
        let user = req.userDocument;
        if (profileUser == undefined) {
            res.render("forum/nothreads", {
                stylesheet: "",
                script: "",
                title: "404",
                message: "This user does not exist.",
                user: user,
            });
            return;
        }
        if (!profileUser.banned) {
            let followers = [];
            for (let followerId of profileUser.followers) {
                try {
                    let followerDocument = await mainDbHandler.indexDbDocument("users", {
                        _id: parseInt(followerId),
                    });
                    followerDocument.joindate = `${
                        followerDocument.joindate.getMonth() + 1
                    }/${followerDocument.joindate.getDate()}/${followerDocument.joindate.getFullYear()}`;
                    followers.push(followerDocument);
                } catch (err) {
                    console.log(err);
                }
            }

            res.render("followers", {
                title: "Followers",
                stylesheet: "followers",
                script: "",
                profileUser: profileUser,
                followers: followers,
            });
        } else {
            res.render("banned", {
                title: "Banned",
                stylesheet: "",
                script: "",
            });
        }
    }
);

router.get(
    "/users/:id/following",
    middleware.notLoggedInRedirect,
    middleware.bannedRedirect,
    async (req, res) => {
        let id = req.params.id;
        let profileUser = await mainDbHandler.indexDbDocument("users", {
            _id: parseInt(id),
        });
        let user = req.userDocument;
        if (profileUser == undefined) {
            res.render("forum/nothreads", {
                stylesheet: "",
                script: "",
                title: "404",
                message: "This user does not exist.",
                user: user,
            });
            return;
        }
        if (!profileUser.banned) {
            let following = [];
            for (let followerId of profileUser.following) {
                try {
                    let followerDocument = await mainDbHandler.indexDbDocument("users", {
                        _id: parseInt(followerId),
                    });
                    followerDocument.joindate = `${
                        followerDocument.joindate.getMonth() + 1
                    }/${followerDocument.joindate.getDate()}/${followerDocument.joindate.getFullYear()}`;
                    following.push(followerDocument);
                } catch (err) {
                    console.log(err);
                }
            }

            res.render("following", {
                title: "Following",
                stylesheet: "following",
                script: "",
                profileUser: profileUser,
                following: following,
            });
        } else {
            res.render("banned", {
                title: "Banned",
                stylesheet: "",
                script: "",
            });
        }
    }
);

router.patch("/follow", middleware.notLoggedInError, middleware.bannedError, async (req, res) => {
    let followingId = parseInt(req.query.id);
    let user = req.userDocument;
    let followingUser = await mainDbHandler.indexDbDocument("users", {
        _id: followingId,
    });
    if (followingUser != undefined) {
        try {
            if (!followingUser.followers.includes(req.session.accountid)) {
                mainDbHandler.follow(req.session.accountid, followingId);
                await mainDbHandler.createNotification(followingId, {
                    type: "follow",
                    userId: req.session.accountid,
                    message: `${user.username} is following you!`,
                });
            } else {
                mainDbHandler.unfollow(req.session.accountid, followingId);
            }
            res.status(200).send("OK");
        } catch (err) {
            console.log(err);
        }
    } else {
        res.status(400).send("The user you tried to follow does not exist...");
    }
});

module.exports = router;
