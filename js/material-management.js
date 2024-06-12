let editingMaterialId = null;
let materials = {};

if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
}

$(document).ready(function() {
    $('#storeNo').select2({
        placeholder: 'Select Store',
        allowClear: true
    });
    $('#rackId').select2({
        placeholder: 'Select Rack',
        allowClear: true
    });
});

async function createMaterial() {
    const description = document.getElementById('description').value;
    const probablePlace = document.getElementById('probablePlace').value;
    const quantity = document.getElementById('quantity').value;
    const uom = document.getElementById('uom').value;
    const rackId = document.getElementById('rackId').value;
    const remarks = document.getElementById('remarks').value;
    const spec = document.getElementById('spec').value;
    const storeNo = document.getElementById('storeNo').value;
    const supplier = document.getElementById('supplier').value;

    if (!description || !rackId || !storeNo || !uom) {
        alert('Please fill all mandatory fields.');
        return;
    }

    try {
        const racksRef = firebase.database().ref(`stores/${storeNo}/racks/${rackId}`);
        const snapshot = await racksRef.once('value');
        const rack = snapshot.val();
        if (!rack) {
            alert('Rack not found.');
            return;
        }

        const rackNo = rack.rackNo;

        const materialsRef = firebase.database().ref('materials');
        const snapshotMaterials = await materialsRef.once('value');
        const materials = snapshotMaterials.val();
        const newMaterialId = materials ? Object.keys(materials).length + 1 : 1;

        await materialsRef.child(newMaterialId).set({
            description: description,
            probablePlace: probablePlace,
            quantity: quantity,
            uom: uom,
            rackNo: rackNo,
            remarks: remarks,
            spec: spec,
            storeNo: storeNo,
            supplier: supplier
        });
        alert('Material created successfully!');
        resetForm();
        loadMaterials();
    } catch (error) {
        alert('Error: ' + error.message);
    }
}

function resetForm() {
    document.getElementById('description').value = '';
    document.getElementById('probablePlace').value = '';
    document.getElementById('quantity').value = '0';
    document.getElementById('uom').value = '';
    document.getElementById('rackId').value = '';
    document.getElementById('remarks').value = '';
    document.getElementById('spec').value = '';
    document.getElementById('storeNo').value = '';
    document.getElementById('supplier').value = '';
    document.getElementById('createButton').style.display = 'inline-block';
    document.getElementById('updateButton').style.display = 'none';
    editingMaterialId = null;
}

async function loadMaterials() {
    try {
        const snapshot = await firebase.database().ref('materials').once('value');
        materials = snapshot.val();
        const materialList = document.getElementById('materialList');
        materialList.innerHTML = '';

        if (materials) {
            let table = '<table><tr><th>ID</th><th>Description</th><th>Probable Place</th><th>Quantity</th><th>UOM</th><th>Rack No</th><th>Remarks</th><th>Specification</th><th>Store No</th><th>Supplier</th><th>Actions</th></tr>';
            for (const materialId in materials) {
                const material = materials[materialId];
                table += `<tr>
                            <td>${materialId}</td>
                            <td>${material.description}</td>
                            <td>${material.probablePlace}</td>
                            <td>${material.quantity}</td>
                            <td>${material.uom}</td>
                            <td>${material.rackNo}</td>
                            <td>${material.remarks}</td>
                            <td>${material.spec}</td>
                            <td>${material.storeNo}</td>
                            <td>${material.supplier}</td>
                            <td><button class="edit-button" onclick="editMaterial('${materialId}')">Edit</button> <button class="delete-button" onclick="deleteMaterial('${materialId}')">Delete</button></td>
                          </tr>`;
            }
            table += '</table>';
            materialList.innerHTML = table;
        } else {
            materialList.innerHTML = '<p>No materials found in the database.</p>';
        }
    } catch (error) {
        alert('Error: ' + error.message);
    }
}

function editMaterial(materialId) {
    const materialRef = firebase.database().ref('materials/' + materialId);
    materialRef.once('value', snapshot => {
        const material = snapshot.val();
        document.getElementById('description').value = material.description;
        document.getElementById('probablePlace').value = material.probablePlace;
        document.getElementById('quantity').value = material.quantity;
        document.getElementById('uom').value = material.uom;
        document.getElementById('rackId').value = material.rackNo; // store rackNo for update
        document.getElementById('remarks').value = material.remarks;
        document.getElementById('spec').value = material.spec;
        document.getElementById('storeNo').value = material.storeNo;
        document.getElementById('supplier').value = material.supplier;

        document.getElementById('createButton').style.display = 'none';
        document.getElementById('updateButton').style.display = 'inline-block';
        editingMaterialId = materialId;
    }).catch(error => {
        alert('Error: ' + error.message);
    });
}

async function updateMaterial() {
    if (!editingMaterialId) return;

    const description = document.getElementById('description').value;
    const probablePlace = document.getElementById('probablePlace').value;
    const quantity = document.getElementById('quantity').value;
    const uom = document.getElementById('uom').value;
    const rackId = document.getElementById('rackId').value;
    const remarks = document.getElementById('remarks').value;
    const spec = document.getElementById('spec').value;
    const storeNo = document.getElementById('storeNo').value;
    const supplier = document.getElementById('supplier').value;

    if (!description || !rackId || !storeNo || !uom) {
        alert('Please fill all mandatory fields.');
        return;
    }

    try {
        const racksRef = firebase.database().ref(`stores/${storeNo}/racks/${rackId}`);
        const snapshot = await racksRef.once('value');
        const rack = snapshot.val();
        if (!rack) {
            alert('Rack not found.');
            return;
        }

        const rackNo = rack.rackNo;

        await firebase.database().ref('materials/' + editingMaterialId).update({
            description: description,
            probablePlace: probablePlace,
            quantity: quantity,
            uom: uom,
            rackNo: rackNo,
            remarks: remarks,
            spec: spec,
            storeNo: storeNo,
            supplier: supplier
        });
        alert('Material updated successfully!');
        resetForm();
        loadMaterials();
    } catch (error) {
        alert('Error: ' + error.message);
    }
}

async function deleteMaterial(materialId) {
    try {
        const materialRef = firebase.database().ref('materials/' + materialId);
        const oldMaterial = (await materialRef.once('value')).val();
        await materialRef.remove();
        await restructureMaterialIDs();
        await firebase.database().ref('logs').push({
            materialId: materialId,
            action: 'delete',
            oldData: oldMaterial,
            newData: null,
            username: localStorage.getItem('username'),
            timestamp: new Date().toLocaleString('en-US', { timeZone: 'Asia/Kolkata' })
        });
        loadMaterials();
        alert('Material deleted successfully!');
    } catch (error) {
        alert('Error: ' + error.message);
    }
}

async function restructureMaterialIDs() {
    try {
        const snapshot = await firebase.database().ref('materials').once('value');
        const materials = snapshot.val();
        if (materials) {
            const updates = {};
            let id = 1;
            for (const key in materials) {
                updates[id] = materials[key];
                id++;
            }
            await firebase.database().ref('materials').set(updates);
        }
    } catch (error) {
        alert('Error restructuring material IDs: ' + error.message);
    }
}

async function loadStores() {
    try {
        const snapshot = await firebase.database().ref('stores').once('value');
        const stores = snapshot.val();
        const storeNoSelect = document.getElementById('storeNo');
        storeNoSelect.innerHTML = '<option value="">Select Store</option>';
        if (stores) {
            for (const storeId in stores) {
                const option = document.createElement('option');
                option.value = storeId;
                option.text = stores[storeId].storeName;
                storeNoSelect.appendChild(option);
            }
            $('#storeNo').select2();
        }
    } catch (error) {
        alert('Error: ' + error.message);
    }
}

async function loadRacks() {
    const storeNo = document.getElementById('storeNo').value;
    if (!storeNo) {
        document.getElementById('rackId').innerHTML = '<option value="">Select Rack</option>';
        return;
    }

    try {
        const snapshot = await firebase.database().ref('stores/' + storeNo + '/racks').once('value');
        const racks = snapshot.val();
        const rackIdSelect = document.getElementById('rackId');
        rackIdSelect.innerHTML = '<option value="">Select Rack</option>';
        if (racks) {
            for (const rackId in racks) {
                const option = document.createElement('option');
                option.value = rackId;
                option.text = racks[rackId].rackNo;
                rackIdSelect.appendChild(option);
            }
            $('#rackId').select2();
        }
    } catch (error) {
        alert('Error: ' + error.message);
    }
}

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

function displayMaterials(filteredMaterials) {
    const materialList = document.getElementById('materialList');
    materialList.innerHTML = '';

    if (filteredMaterials) {
        let table = '<table><tr><th>ID</th><th>Description</th><th>Probable Place</th><th>Quantity</th><th>UOM</th><th>Rack No</th><th>Remarks</th><th>Specification</th><th>Store No</th><th>Supplier</th><th>Actions</th></tr>';
        for (const materialId in filteredMaterials) {
            const material = filteredMaterials[materialId];
            table += `<tr>
                        <td>${materialId}</td>
                        <td>${material.description}</td>
                        <td>${material.probablePlace}</td>
                        <td>${material.quantity}</td>
                        <td>${material.uom}</td>
                        <td>${material.rackNo}</td>
                        <td>${material.remarks}</td>
                        <td>${material.spec}</td>
                        <td>${material.storeNo}</td>
                        <td>${material.supplier}</td>
                        <td><button class="edit-button" onclick="editMaterial('${materialId}')">Edit</button> <button class="delete-button" onclick="deleteMaterial('${materialId}')">Delete</button></td>
                      </tr>`;
        }
        table += '</table>';
        materialList.innerHTML = table;
    } else {
        materialList.innerHTML = '<p>No materials found in the database.</p>';
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
        window.location.href = 'login.html';
    }
}

window.onload = function() {
    displayUsername();
    loadStores();
    setTimeout(() => {
        loadMaterials();
    }, 1000);
};
