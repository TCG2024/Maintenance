let materials = {};
let filteredMaterials = {};
let selectedRow = null;
let highlightedIndex = -1;
let highlightedCells = [];

if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
}

async function loadMaterials() {
    console.log('Loading materials...');
    try {
        const snapshot = await firebase.database().ref('materials').once('value');
        materials = snapshot.val() || {};
        console.log('Materials loaded from database:', materials);
        displayMaterials(materials);
        collectHighlightedCells(); // Collect cells after displaying materials
    } catch (error) {
        console.error('Error loading materials: ', error);
        alert('Error: ' + error.message);
    }
}

function logout() {
    localStorage.removeItem('username');
    localStorage.setItem('autoLogin', 'false'); // Clear auto-login flag
    window.location.href = 'login.html'; // Redirect to login page
}

function displayMaterials(materials) {
    const materialTable = document.getElementById('materialTable').getElementsByTagName('tbody')[0];
    materialTable.innerHTML = ''; // Clear the table before adding rows
    for (const materialId in materials) {
        const material = materials[materialId];
        const row = materialTable.insertRow();
        row.onclick = () => selectMaterial(materialId, row);
        row.insertCell(0).innerText = materialId;
        row.insertCell(1).innerText = material.description || ' ';
        row.insertCell(2).innerText = material.spec || ' ';
        row.insertCell(3).innerText = material.supplier || ' ';
        row.insertCell(4).innerText = material.quantity || '0';
        row.insertCell(5).innerText = material.uom || ' ';
        row.insertCell(6).innerText = material.probablePlace || ' ';
        row.insertCell(7).innerText = material.remarks || ' ';
        row.insertCell(8).innerText = material.storeNo || ' ';
        row.insertCell(9).innerText = material.rackNo || ' ';
    }
}

function searchMaterials() {
    const searchInput = document.getElementById('searchInput').value.toLowerCase();
    filteredMaterials = {};
    for (const materialId in materials) {
        const material = materials[materialId];
        if (Object.values(material).some(value => value.toString().toLowerCase().includes(searchInput))) {
            filteredMaterials[materialId] = material;
        }
    }
    displayMaterials(filteredMaterials);
    collectHighlightedCells(); // Collect cells after displaying filtered materials
}

function selectMaterial(materialId, row) {
    if (selectedRow) {
        selectedRow.classList.remove('selected-row');
    }
    selectedRow = row;
    selectedRow.classList.add('selected-row');

    const material = materials[materialId];
    document.getElementById('materialIdLabel').innerText = materialId;
    document.getElementById('materialDescriptionLabel').innerText = material.description;
    document.getElementById('currentQuantityLabel').innerText = material.quantity;
    document.getElementById('updateForm').classList.remove('hidden');
}

async function updateQuantity() {
    const materialId = document.getElementById('materialIdLabel').innerText;
    const newQuantity = parseInt(document.getElementById('newQuantity').value);
    const currentSupplier = document.getElementById('currentSupplier').value;
    const poNumber = document.getElementById('poNumber').value;
    const invNumber = document.getElementById('invNumber').value;
    const username = localStorage.getItem('username');
    if (isNaN(newQuantity) || newQuantity <= 0) {
        alert('Please enter a valid quantity.');
        return;
    }

    const currentQuantity = parseInt(document.getElementById('currentQuantityLabel').innerText);
    const updatedQuantity = currentQuantity + newQuantity;
    const uom = materials[materialId].uom;

    const now = new Date();
    const threeMonthsAgo = new Date(now.setMonth(now.getMonth() - 3)).toISOString();

    try {
        // Check and delete old received materials logs
        const receivedMaterialRef = firebase.database().ref('receivedMaterials');
        const receivedMaterialSnapshot = await receivedMaterialRef.once('value');
        const receivedMaterialsLogs = receivedMaterialSnapshot.val();

        if (receivedMaterialsLogs) {
            for (const logId in receivedMaterialsLogs) {
                if (receivedMaterialsLogs[logId].timestamp < threeMonthsAgo) {
                    await receivedMaterialRef.child(logId).remove();
                }
            }
        }

        // Get the current maximum key in "receivedMaterials"
        const receivedSnapshot = await firebase.database().ref('receivedMaterials').once('value');
        const receivedMaterials = receivedSnapshot.val() || {};
        const receivedKeys = Object.keys(receivedMaterials);
        const nextKey = receivedKeys.length ? Math.max(...receivedKeys.map(Number)) + 1 : 1;

        // Get current UTC time
        const utcTimestamp = new Date();
        // Convert to IST (UTC +5:30)
        const istTimestamp = new Date(utcTimestamp.getTime() + 330 * 60000);

        await firebase.database().ref('materials/' + materialId).update({ quantity: updatedQuantity });

        await firebase.database().ref('receivedMaterials/' + nextKey).set({
            materialId: materialId,
            description: materials[materialId].description,
            quantity: newQuantity,
            currentSupplier: currentSupplier,
            poNumber: poNumber,
            invNumber: invNumber,
            uom: uom,
            timestamp: istTimestamp.toISOString(),
            username: username
        });
        alert('Quantity updated successfully!');
        materials[materialId].quantity = updatedQuantity;
        document.getElementById('updateForm').classList.add('hidden');
        document.getElementById('newQuantity').value = '';
        document.getElementById('currentSupplier').value = '';
        document.getElementById('poNumber').value = '';
        document.getElementById('invNumber').value = '';
        if (selectedRow) {
            selectedRow.classList.remove('selected-row');
        }
        selectedRow = null;
        displayMaterials(materials);
        collectHighlightedCells(); // Collect cells after updating materials
    } catch (error) {
        console.error('Error updating quantity: ', error);
        alert('Error: ' + error.message);
    }
}
