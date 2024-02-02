const server = require("../../server.js");

let indexDbDocument = function (collection, query) {
    return server.db.collection(collection).findOne(query);
};

module.exports.indexDbDocument = indexDbDocument;

module.exports.updateUserById = function (id, changeParameters) {
    return server.db.collection("users").updateOne(
        {
            _id: id,
        },
        {
            $set: changeParameters,
        }
    );
};

module.exports.getPublicInfo = function (id) {
    return server.db.collection("users").findOne(
        {
            _id: id,
        },
        {
            projection: {
                _id: 0,
                profilepicture: 1,
                administrator: 1,
                banned: 1,
                joindate: 1,
                lastOnline: 1,
                badges: 1,
                status: 1,
                skilllevel: 1,
                online: 1,
            },
        }
    );
};

module.exports.createUserDocument = async function (username, password) {
    return server.db.collection("users").insertOne({
        _id: (await server.db.collection("users").countDocuments()) + 1,
        username: username,
        password: password,
        profilepicture: `https://api.dicebear.com/7.x/bottts-neutral/svg?seed=${username}`,
        administrator: false,
        banned: false,
        joindate: new Date(),
        lastOnline: new Date(),
        badges: [
            {
                title: "Stepping Stone",
                description: "This user has just joined devchat.",
                image: "steppingstone.png",
            },
        ],
        status: "Set your status to something cool. Example: 'I like to code'",
        skilllevel: "Novice",
        points: 0,
        followers: [],
        following: [],
        showRecentActivity: true,
        notifyMyFollowers: true,
        recentReplyActivity: [],
        notifications: [],
    });
};

module.exports.getRecentThreads = async function (id) {
    return server.db
        .collection("threads")
        .find(
            {
                posterId: id,
            },
            {
                projection: {
                    _id: 1,
                    topic: 1,
                    title: 1,
                    postDate: 1,
                    views: 1,
                },
            }
        )
        .sort({
            postDate: -1,
            views: -1,
        })
        .limit(10)
        .toArray();
};

module.exports.verifyChangingPasswordData = function (
    password,
    newPassword,
    confirmedPassword,
    userDocument
) {
    if (newPassword != confirmedPassword) {
        return "The new password and confirmed password must be the same.";
    }
    if (password != userDocument.password) {
        return "The old password you entered is incorrect.";
    }
    if (newPassword == password) {
        return "The new password and the old password cannot be the same.";
    }
    return false;
};

module.exports.follow = async function (userId, followerId) {
    await server.db.collection("users").updateOne(
        {
            _id: userId,
        },
        {
            $push: {
                following: followerId,
            },
        }
    );
    await server.db.collection("users").updateOne(
        {
            _id: followerId,
        },
        {
            $push: {
                followers: userId,
            },
        }
    );
};

module.exports.unfollow = async function (userId, followerId) {
    await server.db.collection("users").updateOne(
        {
            _id: userId,
        },
        {
            $pull: {
                following: followerId,
            },
        }
    );
    await server.db.collection("users").updateOne(
        {
            _id: followerId,
        },
        {
            $pull: {
                followers: userId,
            },
        }
    );
};

module.exports.createNotification = async function (userToNotify, notification) {
    let userToNotifyDocument = await indexDbDocument("users", { _id: userToNotify });
    if (!userToNotifyDocument.notifications.includes(notification)) {
        userToNotifyDocument.notifications.unshift(notification);

        await server.db.collection("users").updateOne(
            {
                _id: userToNotify,
            },
            {
                $set: {
                    notifications: userToNotifyDocument.notifications,
                },
            }
        );
    }
};

module.exports.getLeaderboardJSON = async function (sort) {
    let allDevChatUsers = await server.db
        .collection("users")
        .find(
            { banned: false },
            {
                projection: {
                    _id: 1,
                    username: 1,
                    skilllevel: 1,
                    followers: 1,
                },
            }
        )
        .toArray();

    for (let user of allDevChatUsers) {
        let threads = await server.db
            .collection("threads")
            .find({ posterId: user["_id"] })
            .toArray();
        user.threads = threads.length;
    }

    if (sort == "mostThreads") {
        allDevChatUsers.sort(function (a, b) {
            return b.threads - a.threads;
        });
    } else if (sort == "mostFollowers") {
        allDevChatUsers.sort(function (a, b) {
            return b.followers.length - a.followers.length;
        });
    }

    return allDevChatUsers;
};
