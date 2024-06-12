function displayUsername() {
    var username = localStorage.getItem('username');
    if (username) {
        document.getElementById('usernameDisplay').textContent = username;
    } else {
        document.getElementById('usernameDisplay').textContent = 'Guest';
    }
}

function checkPasswordStrength() {
    var password = document.getElementById('newPassword').value;
    var strengthText = document.getElementById('passwordStrength');
    if (password.length < 8 || !password.match(/[a-z]/i) || !password.match(/[0-9]/) || !password.match(/[^a-zA-Z0-9]/)) {
        strengthText.textContent = 'Password is too weak';
        strengthText.style.color = 'red';
        return false;
    } else {
        strengthText.textContent = 'Password is strong';
        strengthText.style.color = 'green';
        return true;
    }
}

function changePassword(event) {
    event.preventDefault();
    var currentPassword = document.getElementById('currentPassword').value;
    var newPassword = document.getElementById('newPassword').value;
    var confirmPassword = document.getElementById('confirmPassword').value;

    if (newPassword !== confirmPassword) {
        alert('New passwords do not match.');
        return;
    }

    if (!checkPasswordStrength()) {
        alert('Your new password does not meet the strength requirements.');
        return;
    }

    var hashedCurrentPassword = CryptoJS.SHA256(currentPassword).toString();
    var hashedNewPassword = CryptoJS.SHA256(newPassword).toString();
    var username = localStorage.getItem('username'); 

    firebase.database().ref('users/' + username).once('value').then(snapshot => {
        if (snapshot.exists()) {
            var user = snapshot.val();
            if (user.password === hashedCurrentPassword) {
                firebase.database().ref('users/' + username).update({ password: hashedNewPassword })
                    .then(() => {
                        alert('Password has been changed successfully.');
                        window.location.href = 'index.html'; 
                    }).catch(error => {
                        console.error('Error changing password: ', error);
                        alert('Error: ' + error.message);
                    });
            } else {
                alert('Current password is incorrect.');
            }
        } else {
            alert('User not found.');
        }
    }).catch(error => {
        console.error('Error changing password: ', error);
        alert('Error: ' + error.message);
    });
}

function logout() {
    window.location.href = 'index.html'; 
}

window.onload = displayUsername;
