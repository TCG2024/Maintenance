if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
}

function addEquipmentType() {
    const equipmentTypeId = document.getElementById('equipmentTypeId').value;
    const equipmentTypeName = document.getElementById('equipmentTypeName').value;
    if (!equipmentTypeId || !equipmentTypeName) {
        alert('Please fill all fields.');
        return;
    }

    try {
        const equipmentTypesRef = firebase.database().ref('equipmentTypes/' + equipmentTypeId);
        equipmentTypesRef.set({
            equipmenttypeName: equipmentTypeName
        });
        alert('Equipment Type added successfully!');
        resetForm();
        loadEquipmentTypes();
    } catch (error) {
        alert('Failed to add equipment type: ' + error.message);
    }
}

function resetForm() {
    document.getElementById('equipmentTypeId').value = '';
    document.getElementById('equipmentTypeName').value = '';
}

async function loadEquipmentTypes() {
    try {
        const snapshot = await firebase.database().ref('equipmentTypes').once('value');
        const equipmentTypes = snapshot.val();
        const equipmentTypeList = document.getElementById('equipmentTypeList');
        equipmentTypeList.innerHTML = '';

        if (equipmentTypes) {
            let table = '<table><tr><th>Equipment Type ID</th><th>Equipment Type Name</th><th>Actions</th></tr>';
            for (const equipmentTypeId in equipmentTypes) {
                const equipmentType = equipmentTypes[equipmentTypeId];
                table += `<tr>
                            <td>${equipmentTypeId}</td>
                            <td>${equipmentType.equipmenttypeName}</td>
                            <td><button class="delete-button" onclick="deleteEquipmentType('${equipmentTypeId}')">Delete</button></td>
                          </tr>`;
            }
            table += '</table>';
            equipmentTypeList.innerHTML = table;
        } else {
            equipmentTypeList.innerHTML = '<p>No equipment types found in the database.</p>';
        }
    } catch (error) {
        alert('Failed to load equipment types: ' + error.message);
    }
}

async function deleteEquipmentType(equipmentTypeId) {
    try {
        const equipmentSnapshot = await firebase.database().ref('equipment').orderByChild('equipmentTypeId').equalTo(equipmentTypeId).once('value');
        if (equipmentSnapshot.exists()) {
            alert('Cannot delete equipment type with associated equipment.');
            return;
        }

        await firebase.database().ref('equipmentTypes/' + equipmentTypeId).remove();
        await restructureEquipmentTypeIDs();
        alert('Equipment type deleted successfully!');
        loadEquipmentTypes();
    } catch (error) {
        alert('Failed to delete equipment type: ' + error.message);
    }
}

async function restructureEquipmentTypeIDs() {
    try {
        const snapshot = await firebase.database().ref('equipmentTypes').once('value');
        const equipmentTypes = snapshot.val();
        if (equipmentTypes) {
            const updates = {};
            let id = 1;
            for (const key in equipmentTypes) {
                updates[id] = equipmentTypes[key];
                id++;
            }
            await firebase.database().ref('equipmentTypes').set(updates);
        }
    } catch (error) {
        alert('Error restructuring equipment type IDs: ' + error.message);
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
    loadEquipmentTypes();
};
