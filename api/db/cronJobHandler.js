// const mainDbHandler = require("./mainHandler.js");
const pointsHandler = require("./pointsHandler.js");
const server = require("../../server.js");
const CronJob = require("cron").CronJob;

let job = new CronJob(
    // "*/5 * * * *",
    "0 */2 * * *",
    function () {
        updateVeteranBadge();
        updateSkillLevels();
        updateExpProgrammerBadge();
    },
    null,
    true
);

async function updateSkillLevels() {
    let users = await server.db.collection("users").countDocuments();
    for (let i = 1; i <= users; i++) {
        pointsHandler.updateChallengePoints(i);
    }
}

async function updateExpProgrammerBadge() {
    try {
        await server.db.collection("users").updateMany(
            {
                skilllevel: "Expert",
            },
            {
                $push: {
                    badges: {
                        $each: [
                            {
                                title: "Expert",
                                description: "This user knows a thing or two about programming.",
                                image: "expert.png",
                            },
                        ],
                        $position: 0,
                    },
                },
            }
        );
    } catch (err) {
        console.log(err);
    }
}

async function updateVeteranBadge() {
    try {
        await server.db.collection("users").updateMany(
            {
                "badges.title": {
                    $ne: "Veteran",
                },
                joindate: {
                    $lte: new Date(new Date() - 1000 * 60 * 60 * 24 * 360),
                },
            },
            {
                $push: {
                    badges: {
                        $each: [
                            {
                                title: "Veteran",
                                description:
                                    "This user has been on devchat for longer than a year.",
                                image: "veteran.png",
                            },
                        ],
                        $position: 0,
                    },
                },
            }
        );
    } catch (err) {
        console.log(err);
    }
}
