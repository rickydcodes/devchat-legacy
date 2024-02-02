const server = require("../../server.js");
const mainDbHandler = require("./mainHandler.js");
const threadPermissions = require("../utils/json/threads.json");

module.exports.createThread = async function (title, topic, body, poster, settings) {
    // find ats, send notifications to anyone with the at
    let ats = body.split(" ").filter(word => word[0] == "@" && word.length > 2).splice(0, 3);
    
    for (let at of ats) {
        try {
            await mainDbHandler.createNotification({$exists: { _id: at.substring(1)}}, {
                type: "threadMention",
                threadId: await server.db.collection("threads").countDocuments() + 1,
                message: `You were mentioned in a thread.`,
            });
        } catch(err) {
            console.log(err);
        }
    }

    return server.db.collection("threads").insertOne({
        _id: (await server.db.collection("threads").countDocuments()) + 1,
        topic: topic,
        title: title,
        body: body,
        posterId: poster["_id"],
        postDate: new Date(),
        replies: [],
        views: 0,
        likes: [],
        dislikes: [],
        deleted: false,
        enableReplies: settings.enableReplies,
        replyNumber: 0
    });
};

module.exports.threadPageCount = async function (topic, page, sort, searchText, posterId) {
    if (page != undefined) {
        let queryBy = {
            recent: {
                topic: topic,
                deleted: false,
            },
            trending: {
                topic: topic,
                deleted: false,
            },
            mythreads: {
                topic: topic,
                posterId: posterId,
                deleted: false,
            },
            deleted: {
                topic: topic,
                deleted: true,
            },
        };
        if (searchText != "") {
            await server.db.collection("threads").createIndex( { title: "text" } )
            queryBy[sort] = Object.assign({$text: { $search: searchText }}, queryBy[sort]);
        }
        return server.db.collection("threads").find(queryBy[sort]).toArray();
    } else {
        return 0;
    }
};

module.exports.viewThread = async function (id) {
    let threadCollection = await server.db.collection("threads").findOne({
        _id: id,
    });
    return server.db.collection("threads").updateOne(
        {
            _id: id,
        },
        {
            $set: {
                views: threadCollection.views + 1,
            },
        }
    );
};

module.exports.getThreads = async function (topic, page, sort, searchText, posterId) {
    if (page != undefined) {
        let sortBy = {
            recent: {
                postDate: -1,
            },
            trending: {
                views: -1,
                replies: -1,
            },
            mythreads: {
                postDate: -1,
            },
            deleted: {
                postDate: -1,
            },
        };
        let queryBy = {
            recent: {
                topic: topic,
                deleted: false,
            },
            trending: {
                topic: topic,
                deleted: false,
            },
            mythreads: {
                topic: topic,
                posterId: posterId,
                deleted: false,
            },
            deleted: {
                topic: topic,
                deleted: true,
            },
        };
        if (searchText != "") {
            await server.db.collection("threads").createIndex( { title: "text" } )
            queryBy[sort] = Object.assign({$text: { $search: searchText }}, queryBy[sort]);
        }
        let posterHasThreads = await server.db
            .collection("threads")
            .find({
                posterId: posterId,
            })
            .toArray();
        // let poster = await mainDbHandler.indexDbDocument("users", { _id: posterId });
        if (sort == "mythreads" && posterHasThreads.length == 0) {
            return new Promise((resolve, reject) => {
                resolve({
                    hasThreads: false,
                });
            });
        }
        return server.db
            .collection("threads")
            .find(queryBy[sort], {
                projection: {
                    _id: 1,
                    topic: 1,
                    title: 1,
                    postDate: 1,
                    views: 1,
                    replyNumber: 1
                },
            })
            .sort(sortBy[sort])
            .skip(page * 12)
            .limit(12)
            .toArray();
    } else {
        return server.db
            .collection("threads")
            .find({
                topic: topic,
            })
            .toArray();
    }
};

function threadsAllowedToView(userDocument) {
    return threadPermissions[userDocument.administrator ? "admin" : "nonAdmin"]["allowedToView"];
}

function threadsAllowedToCreate(userDocument) {
    let admin = userDocument.administrator;
    return threadPermissions[admin ? admin : "nonAdmin"]["allowedToCreate"];
}

module.exports.threadsAllowedToView = threadsAllowedToView;

module.exports.threadsAllowedToCreate = threadsAllowedToCreate;
