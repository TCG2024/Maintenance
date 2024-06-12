if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
}

$(document).ready(function() {
    // Initialize Select2
    $('#locationSelect').select2({
        placeholder: 'Select Location',
        allowClear: true
    });
    $('#equipmentTypeSelect').select2({
        placeholder: 'Select Equipment Type',
        allowClear: true
    });
});

let editingEquipmentId = null;

async function createEquipment() {
    const locationId = document.getElementById('locationSelect').value;
    const equipmentType = document.getElementById('equipmentTypeSelect').value;
    const equipmentTag = document.getElementById('equipmentTag').value || '';
    const equipmentDescription = document.getElementById('equipmentDescription').value;
    const manufacturer = document.getElementById('manufacturer').value || '';
    const model = document.getElementById('model').value || '';
    const serialNumber = document.getElementById('serialNumber').value || '';

    if (!locationId || !equipmentType || !equipmentDescription) {
        alert('Please fill all mandatory fields.');
        return;
    }

    try {
        const equipmentRef = firebase.database().ref('equipment');
        const newEquipmentId = equipmentRef.push().key;

        await equipmentRef.child(newEquipmentId).set({
            locationId: locationId,
            equipmentType: equipmentType,
            equipmentTag: equipmentTag,
            equipmentDescription: equipmentDescription,
            manufacturer: manufacturer,
            model: model,
            serialNumber: serialNumber
        });
        alert('Equipment created successfully!');
        resetForm();
        loadEquipment();
    } catch (error) {
        alert('Error: ' + error.message);
    }
}

function resetForm() {
    $('#locationSelect').val(null).trigger('change');
    $('#equipmentTypeSelect').val(null).trigger('change');
    document.getElementById('equipmentTag').value = '';
    document.getElementById('equipmentDescription').value = '';
    document.getElementById('manufacturer').value = '';
    document.getElementById('model').value = '';
    document.getElementById('serialNumber').value = '';
    document.getElementById('createButton').style.display = 'inline-block';
    document.getElementById('updateButton').style.display = 'none';
    editingEquipmentId = null;
}

async function loadEquipment() {
    try {
        const snapshot = await firebase.database().ref('equipment').once('value');
        const equipment = snapshot.val();
        const equipmentList = document.getElementById('equipmentList');
        equipmentList.innerHTML = '';

        if (equipment) {
            let table = '<table><tr><th>ID</th><th>Location</th><th>Equipment Type</th><th>Tag</th><th>Description</th><th>Manufacturer</th><th>Model</th><th>Serial Number</th><th>Actions</th></tr>';
            for (const equipmentId in equipment) {
                const item = equipment[equipmentId];
                table += `<tr>
                            <td>${equipmentId}</td>
                            <td>${item.locationId}</td>
                            <td>${item.equipmentType}</td>
                            <td>${item.equipmentTag}</td>
                            <td>${item.equipmentDescription}</td>
                            <td>${item.manufacturer}</td>
                            <td>${item.model}</td>
                            <td>${item.serialNumber}</td>
                            <td>
                                <button class="edit-button" onclick="editEquipment('${equipmentId}')">Edit</button>
                                <button class="delete-button" onclick="deleteEquipment('${equipmentId}')">Delete</button>
                            </td>
                          </tr>`;
            }
            table += '</table>';
            equipmentList.innerHTML = table;
        } else {
            equipmentList.innerHTML = '<p>No equipment found in the database.</p>';
        }
    } catch (error) {
        alert('Failed to load equipment: ' + error.message);
    }
}

async function editEquipment(equipmentId) {
    try {
        const snapshot = await firebase.database().ref(`equipment/${equipmentId}`).once('value');
        const item = snapshot.val();
        document.getElementById('locationSelect').value = item.locationId;
        document.getElementById('equipmentTypeSelect').value = item.equipmentType;
        document.getElementById('equipmentTag').value = item.equipmentTag;
        document.getElementById('equipmentDescription').value = item.equipmentDescription;
        document.getElementById('manufacturer').value = item.manufacturer;
        document.getElementById('model').value = item.model;
        document.getElementById('serialNumber').value = item.serialNumber;

        $('#locationSelect').trigger('change'); // Update Select2
        $('#equipmentTypeSelect').trigger('change'); // Update Select2

        document.getElementById('createButton').style.display = 'none';
        document.getElementById('updateButton').style.display = 'inline-block';
        editingEquipmentId = equipmentId;
    } catch (error) {
        alert('Failed to edit equipment: ' + error.message);
    }
}

async function updateEquipment() {
    if (!editingEquipmentId) return;

    const locationId = document.getElementById('locationSelect').value;
    const equipmentType = document.getElementById('equipmentTypeSelect').value;
    const equipmentTag = document.getElementById('equipmentTag').value || '';
    const equipmentDescription = document.getElementById('equipmentDescription').value;
    const manufacturer = document.getElementById('manufacturer').value || '';
    const model = document.getElementById('model').value || '';
    const serialNumber = document.getElementById('serialNumber').value || '';

    if (!locationId || !equipmentType || !equipmentDescription) {
        alert('Please fill all mandatory fields.');
        return;
    }

    try {
        await firebase.database().ref(`equipment/${editingEquipmentId}`).update({
            locationId: locationId,
            equipmentType: equipmentType,
            equipmentTag: equipmentTag,
            equipmentDescription: equipmentDescription,
            manufacturer: manufacturer,
            model: model,
            serialNumber: serialNumber
        });
        alert('Equipment updated successfully!');
        resetForm();
        loadEquipment();
    } catch (error) {
        alert('Error: ' + error.message);
    }
}

async function deleteEquipment(equipmentId) {
    try {
        await firebase.database().ref('equipment/' + equipmentId).remove();
        alert('Equipment deleted successfully!');
        loadEquipment();
    } catch (error) {
        alert('Failed to delete equipment: ' + error.message);
    }
}

async function loadLocations() {
    try {
        const snapshot = await firebase.database().ref('locations').once('value');
        const locations = snapshot.val();
        const locationSelect = document.getElementById('locationSelect');
        locationSelect.innerHTML = '<option value="">Select Location</option>';
        if (locations) {
            for (const locationId in locations) {
                const option = document.createElement('option');
                option.value = locationId;
                option.text = locationId;
                locationSelect.appendChild(option);
            }
            $('#locationSelect').trigger('change'); // Update Select2
        }
    } catch (error) {
        alert('Error: ' + error.message);
    }
}

async function loadEquipmentTypes() {
    try {
        const snapshot = await firebase.database().ref('equipmentTypes').once('value');
        const equipmentTypes = snapshot.val();
        const equipmentTypeSelect = document.getElementById('equipmentTypeSelect');
        equipmentTypeSelect.innerHTML = '<option value="">Select Equipment Type</option>';
        if (equipmentTypes) {
            for (const equipmentTypeId in equipmentTypes) {
                const option = document.createElement('option');
                option.value = equipmentTypeId;
                option.text = equipmentTypes[equipmentTypeId].equipmenttypeName; // Corrected property
                equipmentTypeSelect.appendChild(option);
            }
            $('#equipmentTypeSelect').trigger('change'); // Update Select2
        }
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
    window.location.href = 'index.html'; // Redirect to index page
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
    loadEquipmentTypes();
    loadEquipment();
};
