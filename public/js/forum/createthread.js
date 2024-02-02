let threadTitleInput = document.querySelector("#threadTitleInput");
let topicsList = document.querySelector("#topicsList");
let threadBodyInput = document.querySelector("#threadBodyInput");
let createThreadButton = document.querySelector("#createThreadButton");
let backButton = document.querySelector("#backButton");

createThreadButton.addEventListener("click", createThread);
backButton.addEventListener("click", () => history.back());

function createThread() {
    let title = threadTitleInput.value;
    let topic = topicsList.value;
    let body = threadBodyInput.value;
    let enableReplies = document.querySelector("#enableRepliesCheckbox").checked;
    if (title != "" && topic != "" && body != "") {
        let request = new XMLHttpRequest();
        request.addEventListener("load", createThreadResponse);
        request.open("POST", "/createThread");
        request.setRequestHeader("Content-Type", "application/x-www-form-urlencoded");
        request.send(`title=${title}&topic=${topic}&body=${body}&enableReplies=${enableReplies}`);
    }
}

function createThreadResponse() {
    let response = this.response;
    if (this.status == 200) {
        window.location.href = `/threads/${response}`;
    } else {
        alert(response);
    }
}
