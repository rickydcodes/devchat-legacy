let backButton = document.querySelector("#backButton");
let banUserButton = document.querySelector("#banUserButton");
let descriptionInput = document.querySelector("#descriptionInput");
let rulesList = document.querySelector("#rulesList");
let userId = location.href.substring(location.href.lastIndexOf("/") + 1);

backButton.addEventListener("click", () => history.back());
banUserButton.addEventListener("click", banUser);

function banUser() {
    if (
        rulesList.value != "" &&
        descriptionInput.value.length >= 10 &&
        descriptionInput.value.length <= 5000
    ) {
        let request = new XMLHttpRequest();
        request.addEventListener("load", banUserResponse);
        request.open("PATCH", `/admin/banUser?userId=${userId}`);
        request.setRequestHeader("Content-Type", "application/x-www-form-urlencoded");
        request.send(`rule=${rulesList.value}&description=${descriptionInput.value}`);
    }
}

function banUserResponse() {
    let response = this.response;
    if (this.status == 200) {
        alert(`Successfully banned user for ${response}`);
    } else {
        alert(response);
    }
}
