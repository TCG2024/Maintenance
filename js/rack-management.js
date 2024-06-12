let editingRackId = null;

if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
}

async function loadStores() {
    try {
        const snapshot = await firebase.database().ref('stores').once('value');
        const stores = snapshot.val();
        const storeSelect = document.getElementById('storeId');
        storeSelect.innerHTML = '<option value="">Select Store</option>';
        if (stores) {
            for (const storeId in stores) {
                const option = document.createElement('option');
                option.value = storeId;
                option.text = stores[storeId].storeName;
                storeSelect.appendChild(option);
            }
        }
    } catch (error) {
        alert('Error: ' + error.message);
    }
}

async function createRack() {
    const storeId = document.getElementById('storeId').value;
    const rackNo = document.getElementById('rackNo').value;

    if (!storeId || !rackNo) {
        alert('Please fill all mandatory fields.');
        return;
    }

    try {
        const racksRef = firebase.database().ref(`stores/${storeId}/racks`);
        const snapshot = await racksRef.once('value');
        const racks = snapshot.val();
        const newRackId = racks ? Object.keys(racks).length + 1 : 1;

        await racksRef.child(newRackId).set({
            rackNo: rackNo
        });
        alert('Rack created successfully!');
        resetForm();
        loadRacks(storeId);
    } catch (error) {
        alert('Error: ' + error.message);
    }
}

function resetForm() {
    document.getElementById('storeId').value = '';
    document.getElementById('rackNo').value = '';
    document.getElementById('createButton').style.display = 'inline-block';
    document.getElementById('updateButton').style.display = 'none';
    editingRackId = null;
}

async function loadRacks(storeId) {
    try {
        const snapshot = await firebase.database().ref(`stores/${storeId}/racks`).once('value');
        const racks = snapshot.val();
        const rackList = document.getElementById('rackList');
        rackList.innerHTML = '';

        if (racks) {
            let table = '<table><tr><th>Rack ID</th><th>Rack No</th><th>Actions</th></tr>';
            for (const rackId in racks) {
                const rack = racks[rackId];
                table += `<tr>
                            <td>${rackId}</td>
                            <td>${rack.rackNo}</td>
                            <td><button class="edit-button" onclick="editRack('${storeId}', '${rackId}')">Edit</button> <button class="delete-button" onclick="deleteRack('${storeId}', '${rackId}')">Delete</button></td>
                          </tr>`;
            }
            table += '</table>';
            rackList.innerHTML = table;
        } else {
            rackList.innerHTML = '<p>No racks found in the database.</p>';
        }
    } catch (error) {
        alert('Error: ' + error.message);
    }
}

function editRack(storeId, rackId) {
    const rackRef = firebase.database().ref(`stores/${storeId}/racks/${rackId}`);
    rackRef.once('value', snapshot => {
        const rack = snapshot.val();
        document.getElementById('storeId').value = storeId;
        document.getElementById('rackNo').value = rack.rackNo;

        document.getElementById('createButton').style.display = 'none';
        document.getElementById('updateButton').style.display = 'inline-block';
        editingRackId = rackId;
    }).catch(error => {
        alert('Error: ' + error.message);
    });
}

async function updateRack() {
    const storeId = document.getElementById('storeId').value;
    const rackNo = document.getElementById('rackNo').value;

    if (!editingRackId || !storeId || !rackNo) {
        alert('Please fill all mandatory fields.');
        return;
    }

    try {
        await firebase.database().ref(`stores/${storeId}/racks/${editingRackId}`).update({
            rackNo: rackNo
        });
        alert('Rack updated successfully!');
        resetForm();
        loadRacks(storeId);
    } catch (error) {
        alert('Error: ' + error.message);
    }
}

async function deleteRack(storeId, rackId) {
    try {
        const racksRef = firebase.database().ref(`stores/${storeId}/racks`);
        await racksRef.child(rackId).remove();
        loadRacks(storeId);
        alert('Rack deleted successfully!');
    } catch (error) {
        alert('Error: ' + error.message);
    }
}

function toggleMenu(element) {
    const ul = element.nextElementSibling;
    ul.style.display = ul.style.display === 'block' ? 'none' : 'block';
}

function navigateTo(page) {
    window.location.href = page;
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
    loadStores();
};
