if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
}

let materials = {};
let selectedMaterials = {};
let serviceLogId = 1;
let allEquipment = {};

$(document).ready(function() {
    $('#locationSelect').select2();
    $('#equipmentSelect').select2();
});

async function loadLocations() {
    try {
        const snapshot = await firebase.database().ref('locations').once('value');
        const locations = snapshot.val();
        const locationSelect = $('#locationSelect');
        locationSelect.empty().append('<option value="">Select Location</option>');
        if (locations) {
            for (const locationId in locations) {
                const option = $('<option>').val(locationId).text(locationId);
                locationSelect.append(option);
            }
        }
    } catch (error) {
        alert('Error: ' + error.message);
    }
}

async function loadEquipment() {
    try {
        const snapshot = await firebase.database().ref('equipment').once('value');
        allEquipment = snapshot.val() || {};
        filterEquipmentByLocation(); // Initial filter based on the default selection
    } catch (error) {
        alert('Error: ' + error.message);
    }
}

function filterEquipmentByLocation() {
    const locationId = $('#locationSelect').val();
    const equipmentSelect = $('#equipmentSelect');
    equipmentSelect.empty().append('<option value="">Select Equipment</option>');
    if (locationId && allEquipment) {
        for (const equipmentId in allEquipment) {
            const eq = allEquipment[equipmentId];
            if (eq.locationId === locationId) {
                const option = $('<option>').val(equipmentId).text(`${eq.equipmentTag} (${eq.manufacturer})`);
                equipmentSelect.append(option);
            }
        }
    }
}

async function loadMaterials() {
    try {
        const snapshot = await firebase.database().ref('materials').once('value');
        materials = snapshot.val() || {};
        displayMaterials(materials);
    } catch (error) {
        alert('Error: ' + error.message);
    }
}

function displayMaterials(materials) {
    const materialTable = $('#materialTable tbody');
    materialTable.empty();
    for (const materialId in materials) {
        const material = materials[materialId];
        const row = $('<tr>');
        row.append(`<td>${materialId}</td>`);
        row.append(`<td>${material.description || ' '}</td>`);
        row.append(`<td>${material.spec || ' '}</td>`);
        row.append(`<td>${material.supplier || ' '}</td>`);
        row.append(`<td>${material.quantity || '0'}</td>`);
        row.append(`<td>${material.uom || ' '}</td>`);
        row.append(`<td>${material.probablePlace || ' '}</td>`);
        row.append(`<td>${material.remarks || ' '}</td>`);
        row.append(`<td>${material.storeNo || ' '}</td>`);
        row.append(`<td>${material.rackNo || ' '}</td>`);
        const issueCell = $('<td>');
        const issueInput = $('<input>').attr({
            type: 'number',
            class: 'issue-input',
            min: '0',
            max: material.quantity || '0'
        }).on('change', function() {
            updateSelectedMaterials(materialId, $(this).val());
        });
        issueCell.append(issueInput);
        row.append(issueCell);
        materialTable.append(row);
    }
}

function updateSelectedMaterials(materialId, quantity) {
    if (quantity > 0) {
        selectedMaterials[materialId] = quantity;
    } else {
        delete selectedMaterials[materialId];
    }
}

function issueMaterials() {
    const issuedMaterialTable = $('#issuedMaterialTable tbody');
    issuedMaterialTable.empty();
    for (const materialId in selectedMaterials) {
        const row = $('<tr>');
        row.append(`<td>${materialId}</td>`);
        row.append(`<td>${materials[materialId].description || 'undefined'}</td>`);
        row.append(`<td>${selectedMaterials[materialId]}</td>`);
        issuedMaterialTable.append(row);
    }
}

async function createServiceLog() {
    const callLogId = $('#callLogId').val();
    const locationId = $('#locationSelect').val();
    const equipmentId = $('#equipmentSelect').val();
    const maintenanceType = $('#maintenanceType').val();
    const jobDescription = $('#jobDescription').val();
    const actionTaken = $('#actionTaken').val();
    const username = localStorage.getItem('username');

    if (!callLogId || !locationId || !equipmentId || !maintenanceType || !jobDescription || !actionTaken) {
        alert('Please fill all mandatory fields.');
        return;
    }

    const now = new Date();
    const timestamp = new Date(now.getTime() + (5.5 * 60 * 60 * 1000)).toISOString(); // Convert to IST
    const threeMonthsAgo = new Date(now.setMonth(now.getMonth() - 3)).toISOString();

    try {
        // Check and delete old service logs
        const serviceLogRef = firebase.database().ref('serviceLogs');
        const serviceLogSnapshot = await serviceLogRef.once('value');
        const serviceLogs = serviceLogSnapshot.val();

        if (serviceLogs) {
            for (const logId in serviceLogs) {
                if (serviceLogs[logId].timestamp < threeMonthsAgo) {
                    await serviceLogRef.child(logId).remove();
                }
            }
        }

        // Check and delete old issued material logs
        const issuedMaterialRef = firebase.database().ref('issuedMaterials');
        const issuedMaterialSnapshot = await issuedMaterialRef.once('value');
        const issuedMaterialsLogs = issuedMaterialSnapshot.val();

        if (issuedMaterialsLogs) {
            for (const logId in issuedMaterialsLogs) {
                if (issuedMaterialsLogs[logId].timestamp < threeMonthsAgo) {
                    await issuedMaterialRef.child(logId).remove();
                }
            }
        }

        const snapshot = await serviceLogRef.once('value');
        const logs = snapshot.val();
        let newLogId = 1;
        if (logs) {
            const logIds = Object.keys(logs).map(id => parseInt(id)).filter(id => !isNaN(id));
            const maxId = Math.max(...logIds);
            newLogId = maxId + 1;
        }

        const issuedMaterialsArray = [];
        const materialUpdates = {};
        const logEntries = [];

        // Update material quantities and log issued materials
        for (const materialId in selectedMaterials) {
            const issuedQuantity = parseInt(selectedMaterials[materialId]);

            // Update the material quantity
            materialUpdates[`materials/${materialId}/quantity`] = firebase.database.ServerValue.increment(-issuedQuantity);

            // Add to issued materials array for service log
            issuedMaterialsArray.push({
                materialId: materialId,
                description: materials[materialId].description,
                quantity: issuedQuantity,
                uom: materials[materialId].uom // Include uom here
            });

            // Log issued materials
            const issuedMaterialRef = firebase.database().ref('issuedMaterials');
            const issuedSnapshot = await issuedMaterialRef.once('value');
            const issuedLogs = issuedSnapshot.val();
            let newIssuedLogId = 1;
            if (issuedLogs) {
                const issuedLogIds = Object.keys(issuedLogs).map(id => parseInt(id)).filter(id => !isNaN(id));
                const maxIssuedId = Math.max(...issuedLogIds);
                newIssuedLogId = maxIssuedId + 1;
            }

            await issuedMaterialRef.child(newIssuedLogId).set({
                description: materials[materialId].description,
                invNumber: '',
                materialId: materialId,
                poNumber: '',
                quantity: issuedQuantity,
                uom: materials[materialId].uom, // Include uom here
                timestamp: timestamp,
                username: username
            });
        }

        await firebase.database().ref().update(materialUpdates);

        await serviceLogRef.child(newLogId).set({
            callLogId: callLogId,
            locationId: locationId,
            equipmentId: equipmentId,
            maintenanceType: maintenanceType,
            jobDescription: jobDescription,
            actionTaken: actionTaken,
            timestamp: timestamp,
            username: username,
            issuedMaterials: issuedMaterialsArray
        });

        // Save log entries to Firebase
        const logsRef = firebase.database().ref('logs');
        for (const logEntry of logEntries) {
            await logsRef.push(logEntry);
        }

        alert('Service log created successfully!');
        resetForm();
    } catch (error) {
        alert('Error: ' + error.message);
    }
}


function resetForm() {
    $('#callLogId').val('');
    $('#locationSelect').val('').trigger('change');
    $('#equipmentSelect').val('').trigger('change');
    $('#maintenanceType').val('');
    $('#jobDescription').val('');
    $('#actionTaken').val('');
    $('#issuedMaterialTable tbody').empty();
    selectedMaterials = {};
    loadMaterials();
}

$(document).ready(function() {
    $('#locationSelect, #equipmentSelect').select2({
        width: 'resolve'
    });

    displayUsername();
    loadLocations();
    loadEquipment();
    loadMaterials();
});


function searchMaterials() {
    const searchInput = $('#searchInput').val().toLowerCase();
    const filteredMaterials = {};
    for (const materialId in materials) {
        const material = materials[materialId];
        if (Object.values(material).some(value => value.toString().toLowerCase().includes(searchInput))) {
            filteredMaterials[materialId] = material;
        }
    }
    displayMaterials(filteredMaterials);
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
        window.location.href = 'login.html';
    }
}


window.onload = function() {
    displayUsername();
    loadLocations();
    loadEquipment();
    loadMaterials();
};
