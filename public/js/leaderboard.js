let sortOptions = document.querySelectorAll(".sortOption");
let viewUserInput = document.querySelector("#viewUserInput");
let sort = "mostFollowers";
let highlighted = "";

getSortFromQueryString();
displayLeaderboard();
sortOptions.forEach((sortOption) => {
    sortOption.addEventListener("click", sortBy);
});
viewUserInput.addEventListener("input", () => {
    highlighted = viewUserInput.value;
});

document.querySelector("#reloadButton").addEventListener("click", displayLeaderboard);
viewUserInput.addEventListener("keydown", (e) => {
    if (e.keyCode == 13) {
        displayLeaderboard();
    }
});

function getSortFromQueryString() {
    let queryString = location.search.substring(1);
    let parameters = queryString.split("&");
    for (let parameter of parameters) {
        let parameterParts = parameter.split("=");
        if (parameterParts[0] == "sort") {
            sort = parameterParts[1];
        } else if (parameterParts[0] == "highlighted") {
            highlighted = parameterParts[1];
            viewUserInput.value = highlighted;
        }
    }
    let sorts = ["mostFollowers", "mostThreads", "mostPoints"];
    let id = sorts.indexOf(sort);
    let element = sortOptions[id];
    document.querySelector(".selected").classList.remove("selected");
    element.classList.add("selected");
    displayLeaderboard();
}

function sortBy() {
    document.querySelector(".selected").classList.remove("selected");
    this.classList.add("selected");
    sort = ["mostFollowers", "mostThreads", "mostPoints"][this.id];
    addToHistory(highlighted ? `?sort=${sort}&highlighted=${highlighted}` : `?sort=${sort}`);
    displayLeaderboard();
}

function displayLeaderboard() {
    let request = new XMLHttpRequest();
    request.addEventListener("load", showThreads);
    request.open("GET", `/getLeaderboard?sort=${sort}&selected=${highlighted}`);
    request.send();
}

function addToHistory(queryString) {
    if (history.pushState) {
        let url = `${location.protocol}//${location.host}${location.pathname.substring(
            0,
            12
        )}${queryString}`;
        history.pushState(null, null, url);
    }
}

function showThreads() {
    let response = this.response;
    document.querySelector("#leaderboard").innerHTML = response;
    // threadsDiv.insertAdjacentHTML("beforeend", response);
}
