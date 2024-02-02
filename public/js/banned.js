let agreeToRulesInput = document.querySelector("#agreeToRulesInput");
let logOutButton = document.querySelector("#logOutButton");
let rejoinButton = document.querySelector("#rejoinButton");

if (rejoinButton != undefined) {
    rejoinButton.addEventListener("click", rejoin);
} else if (logOutButton != undefined) {
    logOutButton.addEventListener("click", signOut);
}

function rejoin() {
    if (agreeToRulesInput.checked) {
        let request = new XMLHttpRequest();
        request.addEventListener("load", rejoinResponse);
        request.open("PATCH", `/reactivateAccount?agree=${agreeToRulesInput.checked}`);
        request.send();
    }
}

function rejoinResponse() {
    if (this.status == 200) {
        alert(this.response);
        location.reload();
    } else {
        alert(this.response);
    }
}
