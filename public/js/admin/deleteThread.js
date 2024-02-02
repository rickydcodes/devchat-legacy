let backButton = document.querySelector("#backButton");
let deleteThreadButton = document.querySelector("#deleteThreadButton");
let reasonInput = document.querySelector("#reasonInput");
let threadId = location.href.substring(location.href.lastIndexOf("/") + 1);

backButton.addEventListener("click", () => history.back());
deleteThreadButton.addEventListener("click", deleteThread);

function deleteThread() {
    if (reasonInput.value.length >= 10 && reasonInput.value.length <= 5000) {
        let request = new XMLHttpRequest();
        request.addEventListener("load", deleteThreadResponse);
        request.open("DELETE", `/admin/deleteThread?threadId=${threadId}`);
        request.setRequestHeader("Content-Type", "application/x-www-form-urlencoded");
        request.send(`reason=${reasonInput.value}`);
    }
}

function deleteThreadResponse() {
    let response = this.response;
    if (this.status == 200) {
        alert("Successfully deleted");
        window.href = "/home";
    } else {
        alert(response);
    }
}
