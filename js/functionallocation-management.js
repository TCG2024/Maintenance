if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
}

function addLocation() {
    const locationId = document.getElementById('locationId').value;
    const locationName = document.getElementById('locationName').value;
    if (!locationId || !locationName) {
        alert('Please fill all fields.');
        return;
    }

    try {
        const locationsRef = firebase.database().ref('locations/' + locationId);
        locationsRef.set({
            locationName: locationName
        });
        alert('Location added successfully!');
        resetForm();
        loadLocations();
    } catch (error) {
        alert('Failed to add location: ' + error.message);
    }
}

function resetForm() {
    document.getElementById('locationId').value = '';
    document.getElementById('locationName').value = '';
}

async function loadLocations() {
    try {
        const snapshot = await firebase.database().ref('locations').once('value');
        const locations = snapshot.val();
        const locationList = document.getElementById('locationList');
        locationList.innerHTML = '';

        if (locations) {
            let table = '<table><tr><th>Location ID</th><th>Location Name</th><th>Actions</th></tr>';
            for (const locationId in locations) {
                const location = locations[locationId];
                table += `<tr>
                            <td>${locationId}</td>
                            <td>${location.locationName}</td>
                            <td><button class="delete-button" onclick="deleteLocation('${locationId}')">Delete</button></td>
                          </tr>`;
            }
            table += '</table>';
            locationList.innerHTML = table;
        } else {
            locationList.innerHTML = '<p>No locations found in the database.</p>';
        }
    } catch (error) {
        alert('Failed to load locations: ' + error.message);
    }
}

async function deleteLocation(locationId) {
    try {
        const equipmentSnapshot = await firebase.database().ref('equipment').orderByChild('locationId').equalTo(locationId).once('value');
        if (equipmentSnapshot.exists()) {
            alert('Cannot delete location with associated equipment.');
            return;
        }

        await firebase.database().ref('locations/' + locationId).remove();
        alert('Location deleted successfully!');
        loadLocations();
    } catch (error) {
        alert('Failed to delete location: ' + error.message);
    }
}

function logout() {
    localStorage.removeItem('username');
    localStorage.setItem('autoLogin', 'false'); // Clear auto-login flag
    window.location.href = 'login.html'; // Redirect to login page
}

function displayUsername() {
    const username = localStorage.getItem('username');
    if (username) {
        document.getElementById('usernameDisplay').textContent = username;
    } else {
        window.location.href = 'login.html'; // Redirect to login page if not logged in
    }
}

window.onload = function() {
    displayUsername();
    loadLocations();
};
