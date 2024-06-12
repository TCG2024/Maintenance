// Function to toggle password visibility
function togglePassword() {
    var passwordField = document.getElementById('passwordField');
    var toggleButton = document.querySelector('.toggle-password');
    if (passwordField.type === 'password') {
        passwordField.type = 'text';
        toggleButton.textContent = 'Hide';
    } else {
        passwordField.type = 'password';
        toggleButton.textContent = 'Show';
    }
}

// Function to show reset password form
function showResetPasswordForm() {
    document.getElementById('resetPasswordForm').style.display = 'block';
}

// Function to log in user
function loginUser(event) {
    event.preventDefault();
    var username = document.getElementById('usernameField').value;
    var password = document.getElementById('passwordField').value;
    var hashedPassword = CryptoJS.SHA256(password).toString();

    // Retrieve user information from the database
    firebase.database().ref('users/' + username).once('value').then(snapshot => {
        if (snapshot.exists()) {
            var user = snapshot.val();
            if (user.password === hashedPassword) {
                alert('Login successful!');
                // Store the username in local storage
                localStorage.setItem('username', username);
                window.location.href = 'service_entry.html';
            } else {
                alert('Invalid password.');
            }
        } else {
            alert('User not found.');
        }
    }).catch(error => {
        console.error('Error logging in user: ', error);
        alert('Error: ' + error.message);
    });
}

// Function to reset password
function resetPassword(event) {
    event.preventDefault();
    var username = document.getElementById('resetUsernameField').value;

    // Check if user exists in the database
    firebase.database().ref('users/' + username).once('value').then(snapshot => {
        if (snapshot.exists()) {
            // Generate a temporary password
            var tempPassword = Math.random().toString(36).slice(-8);
            var hashedTempPassword = CryptoJS.SHA256(tempPassword).toString();

            // Update the user's password in the database
            firebase.database().ref('users/' + username).update({ password: hashedTempPassword })
                .then(() => {
                    alert('Password has been reset. Your new password is: ' + tempPassword);
                }).catch(error => {
                    console.error('Error resetting password: ', error);
                    alert('Error: ' + error.message);
                });
        } else {
            alert('User not found.');
        }
    }).catch(error => {
        console.error('Error resetting password: ', error);
        alert('Error: ' + error.message);
    });
}

// Auto-login function
function autoLogin() {
    var username = localStorage.getItem('username');
    if (username) {
        // Retrieve user information from the database
        firebase.database().ref('users/' + username).once('value').then(snapshot => {
            if (snapshot.exists()) {
                //alert('Auto-login successful!');
                window.location.href = 'service_entry.html';
            } else {
                localStorage.removeItem('username');
            }
        }).catch(error => {
            console.error('Error auto-logging in user: ', error);
            localStorage.removeItem('username');
        });
    }
}

// Call autoLogin on page load
window.onload = autoLogin;
