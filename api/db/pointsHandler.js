const server = require("../../server.js");

module.exports.addChallengePoints = async function (points, userId) {
    let userDocument = await server.db.collection("users").findOne({
        _id: userId,
    });
    userDocument.points += points;

    updateChallengePoints(userId);

    return server.db.collection("users").updateOne(
        {
            _id: userId,
        },
        {
            $inc: {
                points: points,
            },
        }
    );
};

module.exports.calculateBarLevel = function (userDocument) {
    let skillLevels = {
        Novice: { nextSkillLevel: "Advanced Beginner", nextActivity: 20 },
        "Advanced Beginner": { nextSkillLevel: "Competent", nextActivity: 50 },
        Competent: { nextSkillLevel: "Proficient", nextActivity: 100 },
        Proficient: { nextSkillLevel: "Expert", nextActivity: 150 },
        Expert: { nextSkillLevel: "Expert", nextActivity: userDocument.points },
    };

    return {
        percentage: Math.floor(
            (userDocument.points / skillLevels[userDocument.skilllevel].nextActivity) * 100
        ),
        skilllevel: skillLevels[userDocument.skilllevel].nextSkillLevel,
    };
};

module.exports.updateChallengePoints = updateChallengePoints;
async function updateChallengePoints(userId) {
    let userDocument = await server.db.collection("users").findOne({
        _id: userId,
    });
    let skillLevels = {
        0: "Novice",
        20: "Advanced Beginner",
        50: "Competent",
        100: "Proficient",
        150: "Expert",
    };

    for (let skillLevel in skillLevels) {
        if (userDocument.points >= parseInt(skillLevel)) {
            await server.db.collection("users").updateOne(
                {
                    _id: userId,
                },
                {
                    $set: {
                        skilllevel: skillLevels[skillLevel],
                    },
                }
            );
        }
    }
}
