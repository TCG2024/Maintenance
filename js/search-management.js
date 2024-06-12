let materials = {};
let highlightedIndex = -1;
let highlightedCells = [];

if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
}

async function loadMaterials() {
    try {
        const snapshot = await firebase.database().ref('materials').once('value');
        materials = snapshot.val() || {};
        displayMaterials(materials);
        collectHighlightedCells(); // Collect cells after displaying materials
    } catch (error) {
        alert('Error: ' + error.message);
    }
}

function displayMaterials(materials) {
    const materialTable = document.getElementById('materialTable').getElementsByTagName('tbody')[0];
    materialTable.innerHTML = ''; // Clear the table before adding rows
    for (const materialId in materials) {
        const material = materials[materialId];
        const row = materialTable.insertRow();
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
    const filteredMaterials = {};
    for (const materialId in materials) {
        const material = materials[materialId];
        if (Object.values(material).some(value => value.toString().toLowerCase().includes(searchInput))) {
            filteredMaterials[materialId] = material;
        }
    }
    displayMaterials(filteredMaterials);
    collectHighlightedCells(); // Collect cells after displaying filtered materials
}

function searchNext() {
    const searchText = document.getElementById('navigateSearchInput').value.toLowerCase();
    if (searchText === '') return;

    if (highlightedIndex >= 0) {
        removeHighlight(highlightedCells[highlightedIndex]);
    }

    for (let i = highlightedIndex + 1; i < highlightedCells.length; i++) {
        const cell = highlightedCells[i];
        if (cell.innerText.toLowerCase().includes(searchText)) {
            highlightText(cell, searchText);
            highlightedIndex = i;
            return;
        }
    }

    for (let i = 0; i <= highlightedIndex; i++) {
        const cell = highlightedCells[i];
        if (cell.innerText.toLowerCase().includes(searchText)) {
            highlightText(cell, searchText);
            highlightedIndex = i;
            return;
        }
    }
}

function searchPrevious() {
    const searchText = document.getElementById('navigateSearchInput').value.toLowerCase();
    if (searchText === '') return;

    if (highlightedIndex >= 0) {
        removeHighlight(highlightedCells[highlightedIndex]);
    }

    for (let i = highlightedIndex - 1; i >= 0; i--) {
        const cell = highlightedCells[i];
        if (cell.innerText.toLowerCase().includes(searchText)) {
            highlightText(cell, searchText);
            highlightedIndex = i;
            return;
        }
    }

    for (let i = highlightedCells.length - 1; i > highlightedIndex; i--) {
        const cell = highlightedCells[i];
        if (cell.innerText.toLowerCase().includes(searchText)) {
            highlightText(cell, searchText);
            highlightedIndex = i;
            return;
        }
    }
}

function highlightText(cell, text) {
    const innerHTML = cell.innerHTML;
    const index = innerHTML.toLowerCase().indexOf(text.toLowerCase());
    if (index >= 0) {
        cell.innerHTML = innerHTML.substring(0, index) + '<span class="highlight">' + innerHTML.substring(index, index + text.length) + '</span>' + innerHTML.substring(index + text.length);
    }
}

function removeHighlight(cell) {
    cell.innerHTML = cell.innerText;
}

function collectHighlightedCells() {
    const materialTable = document.getElementById('materialTable').getElementsByTagName('tbody')[0];
    highlightedCells = Array.from(materialTable.getElementsByTagName('td'));
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
    loadMaterials();
};
