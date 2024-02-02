const server = require("../../server.js");
const mainDbHandler = require("./mainHandler.js");

module.exports.reply = async function (id, body, posterId, replyto) {
    let threadCollection = await server.db.collection("threads").findOne({
        _id: id,
    });

    let ats = body.split(" ").filter(word => word[0] == "@" && word.length > 2).splice(0, 3);
    
    for (let at of ats) {
        try {
            await mainDbHandler.createNotification({$exists: { _id: at.substring(1)}}, {
                type: "replyMention",
                threadId: id,
                replyId: threadCollection.replies.length + 1,
                message: `You were mentioned in a reply to a thread.`,
            });
        } catch(err) {
            console.log(err);
        }
    }

    let replyPosterId;

    if (replyto == 0) {
        replyPosterId = threadCollection.posterId;
    } else {
        replyPosterId = threadCollection.replies[replyto - 1].posterId;
    }

    let replyToUsername = await server.db.collection("users").findOne({
        _id: replyPosterId,
    });

    await server.db.collection("threads").updateOne(
        {
            _id: id,
        },
        {
            $push: {
                replies: {
                    _id: threadCollection.replies.length + 1,
                    posterId: posterId,
                    body: body,
                    likes: [],
                    dislikes: [],
                    replyto: replyto,
                    replyToUsername: replyToUsername.username,
                    postDate: new Date(),
                    deleted: false,
                },
            },
        }
    );

    return threadCollection.replies.length + 1;
};

module.exports.deleteReply = async function (threadId, replyId, replies) {
    replies[replyId - 1].deleted = true;
    return server.db.collection("threads").updateOne(
        { _id: threadId },
        {
            $set: {
                replies: replies,
            },
        }
    );
};

module.exports.likeMessage = async function (threadId, userId, messageid) {
    if (messageid == 0) {
        let threadPoster = await mainDbHandler.indexDbDocument("threads", {
            _id: threadId,
        });

        return server.db.collection("threads").updateOne(
            {
                _id: threadId,
            },
            {
                $push: {
                    likes: userId,
                },
                $pull: {
                    dislikes: userId,
                },
            }
        );
    } else {
        let replies = await server.db.collection("threads").findOne({
            _id: threadId,
        });
        let reply = replies.replies[messageid - 1];

        if (!reply.likes.includes(userId)) {
            reply.likes.push(userId);
        }

        if (reply.dislikes.includes(userId)) {
            let dislikesIndex = reply.likes.indexOf(userId);
            reply.dislikes.splice(dislikesIndex, dislikesIndex + 1);
        }

        replies.replies[messageid - 1] = reply;

        return server.db.collection("threads").updateOne(
            {
                _id: threadId,
            },
            {
                $set: {
                    replies: replies.replies,
                },
            }
        );
    }
};

module.exports.unlikeMessage = async function (threadId, userId, messageid) {
    if (messageid == 0) {
        return server.db.collection("threads").updateOne(
            {
                _id: threadId,
            },
            {
                $pull: {
                    likes: userId,
                },
            }
        );
    } else {
        let replies = await server.db.collection("threads").findOne({
            _id: threadId,
        });
        let reply = replies.replies[messageid - 1];

        if (reply.likes.includes(userId)) {
            let likesIndex = reply.likes.indexOf(userId);
            reply.likes.splice(likesIndex, likesIndex + 1);
        }

        replies.replies[messageid - 1] = reply;

        return server.db.collection("threads").updateOne(
            {
                _id: threadId,
            },
            {
                $set: {
                    replies: replies.replies,
                },
            }
        );
    }
};

module.exports.dislikeMessage = async function (threadId, userId, messageid) {
    if (messageid == 0) {
        return server.db.collection("threads").updateOne(
            {
                _id: threadId,
            },
            {
                $push: {
                    dislikes: userId,
                },
                $pull: {
                    likes: userId,
                },
            }
        );
    } else {
        let replies = await server.db.collection("threads").findOne({
            _id: threadId,
        });
        let reply = replies.replies[messageid - 1];

        if (!reply.dislikes.includes(userId)) {
            reply.dislikes.push(userId);
        }

        if (reply.likes.includes(userId)) {
            let likesIndex = reply.likes.indexOf(userId);
            reply.likes.splice(likesIndex, likesIndex + 1);
        }

        replies.replies[messageid - 1] = reply;

        return server.db.collection("threads").updateOne(
            {
                _id: threadId,
            },
            {
                $set: {
                    replies: replies.replies,
                },
            }
        );
    }
};

module.exports.undislikeMessage = async function (threadId, userId, messageid) {
    if (messageid == 0) {
        return server.db.collection("threads").updateOne(
            {
                _id: threadId,
            },
            {
                $pull: {
                    dislikes: userId,
                },
            }
        );
    } else {
        let replies = await server.db.collection("threads").findOne({
            _id: threadId,
        });
        let reply = replies.replies[messageid - 1];

        if (reply.dislikes.includes(userId)) {
            let dislikesIndex = reply.dislikes.indexOf(userId);
            reply.dislikes.splice(dislikesIndex, dislikesIndex + 1);
        }

        replies.replies[messageid - 1] = reply;

        return server.db.collection("threads").updateOne(
            {
                _id: threadId,
            },
            {
                $set: {
                    replies: replies.replies,
                },
            }
        );
    }
};
