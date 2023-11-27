let complete = false;
let difficulty = true;

let difficultySortInput = document.querySelector("#difficultySortInput");
let pointsSortInput = document.querySelector("#pointsSortInput");
let incompleteSortInput = document.querySelector("#incompleteSortInput");
let completedSortInput = document.querySelector("#completedSortInput");

let inputs = document.querySelectorAll("#sort input");

inputs.forEach((input) => input.addEventListener("click", checkInput));

getSortFromQueryString();
displayChallenges();

function checkInput() {
    if (this == difficultySortInput) pointsSortInput.checked = false;
    if (this == pointsSortInput) difficultySortInput.checked = false;
    if (this == incompleteSortInput) completedSortInput.checked = false;
    if (this == completedSortInput) incompleteSortInput.checked = false;
}

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
    displayChallenges();
}

function sortBy() {
    document.querySelector(".selected").classList.remove("selected");
    this.classList.add("selected");
    sort = ["mostFollowers", "mostThreads", "mostPoints"][this.id];
    addToHistory(`?sort=${sort}&highlighted=${highlighted}`);
    displayChallenges();
}

function displayChallenges() {
    let request = new XMLHttpRequest();
    request.addEventListener("load", showThreads);
    request.open("GET", `/getChallenges`);
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
    document.querySelector("#challenges").innerHTML = this.response;
}
