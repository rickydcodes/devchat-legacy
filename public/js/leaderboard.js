let sortOptions = document.querySelectorAll(".sortOption");
let sort = "mostFollowers";

getSortFromQueryString();
displayLeaderboard();
sortOptions.forEach((sortOption) => {
    sortOption.addEventListener("click", sortBy);
});

function getSortFromQueryString() {
    let queryString = location.search.substring(1);
    let parameters = queryString.split("&");
    for (let parameter of parameters) {
        let parameterParts = parameter.split("=");
        if (parameterParts[0] == "sort") {
            sort = parameterParts[1];
        }
    }
    let sorts = ["mostFollowers", "mostThreads"];
    let id = sorts.indexOf(sort);
    let element = sortOptions[id];
    document.querySelector(".selected").classList.remove("selected");
    element.classList.add("selected");
    displayLeaderboard();
}

function sortBy() {
    document.querySelector(".selected").classList.remove("selected");
    this.classList.add("selected");
    sort = ["mostFollowers", "mostThreads"][this.id];
    addToHistory(`?sort=${sort}`);
    displayLeaderboard();
}

function displayLeaderboard() {
    let request = new XMLHttpRequest();
    request.addEventListener("load", showThreads);
    request.open("GET", `/getLeaderboard?sort=${sort}`);
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
