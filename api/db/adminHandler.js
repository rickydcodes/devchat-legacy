const server = require("../../server.js");
const mainDbHandler = require("./mainHandler.js");
const rulesJSON = require("../utils/json/rules.json");

module.exports.getAuditLog = function (sort, adminId) {
    let query = {
        recentActions: {},
        myActions: {
            adminId: adminId,
        },
    };
    let sortObject = {
        recentActions: {
            postDate: -1,
        },
        myActions: {
            postDate: -1,
        },
    };

    return server.db
        .collection("auditLog")
        .find(query[sort])
        .limit(6)
        .sort(sortObject[sort])
        .toArray();
};

async function addToAuditLog(adminId, action) {
    // deleteReply, deleteThread, banUser, unBanUser
    return server.db.collection("auditLog").insertOne({
        _id: (await server.db.collection("auditLog").countDocuments()) + 1,
        adminId: adminId,
        actionType: action.type,
        threadId: action.threadId,
        replyId: action.replyId,
        userId: action.userId,
        reason: action.reason,
        date: new Date(),
    });
}

module.exports.addToAuditLog = addToAuditLog;

module.exports.deleteThread = function (threadId) {
    return server.db.collection("threads").updateOne(
        { _id: threadId },
        {
            $set: {
                deleted: true,
            },
        }
    );
};

module.exports.banUser = function (userId, ruleNumber, description) {
    return server.db.collection("users").updateOne(
        { _id: userId },
        {
            $set: {
                banned: {
                    rule: rulesJSON[ruleNumber],
                    length: new Date(new Date().setHours(rulesJSON[ruleNumber].banLength * 24)),
                    description: description,
                },
            },
        }
    );
};

module.exports.unbanUser = function (userId) {
    return server.db.collection("users").updateOne(
        { _id: userId },
        {
            $set: {
                banned: false,
            },
        }
    );
};
