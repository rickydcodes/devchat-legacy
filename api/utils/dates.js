Date.prototype.findDifference = function () {
    let msPerMinute = 60 * 1000;
    let msPerHour = msPerMinute * 60;
    let msPerDay = msPerHour * 24;
    let msPerMonth = msPerDay * 30;
    let msPerYear = msPerDay * 365;
    let elapsed = new Date() - this;
    if (elapsed < msPerMinute) {
        return Math.round(elapsed / 1000) + " seconds ago";
    } else if (elapsed < msPerHour) {
        return Math.floor(elapsed / msPerMinute) + " minutes ago";
    } else if (elapsed < msPerDay) {
        return Math.floor(elapsed / msPerHour) + " hours ago";
    } else if (elapsed < msPerMonth) {
        return Math.floor(elapsed / msPerDay) + " days ago";
    } else if (elapsed < msPerYear) {
        return Math.floor(elapsed / msPerMonth) + " months ago";
    } else {
        return Math.floor(elapsed / msPerYear) + " years ago";
    }
};
