let usernameInput = document.querySelector("#usernameInput");
let passwordInput = document.querySelector("#passwordInput");
let signinButton = document.querySelector("#signinButton");

usernameInput.focus();
signinButton.addEventListener("click", signin);
usernameInput.addEventListener("keydown", keydown);
passwordInput.addEventListener("keydown", keydown);

function keydown(e) {
    if (e.keyCode == 13) {
        signin();
    }
}

function signin() {
    let username = usernameInput.value;
    let password = passwordInput.value;
    if (username != "" && password != "") {
        try {
            let request = new XMLHttpRequest();
            request.open("POST", "/signin");
            request.setRequestHeader("Content-Type", "application/x-www-form-urlencoded");
            request.addEventListener("load", function () {
                let response = this.response;
                passwordInput.value = "";
                if (response == "OK") {
                    window.location.href = "/home";
                } else {
                    alert(response);
                }
            });
            request.send(`username=${username}&password=${password}`);
        } catch (err) {
            console.log(err);
        }
    } else {
        alert("Username and Password fields cannot be blank.");
    }
}
