$(document).ready(function() {
    $('#locationSelect').select2();
    $('#equipmentSelect').select2();
    $('#maintenanceType').select2();
    adjustColumnWidths();
});

function loadContent(page) {
    fetch(page)
      .then(response => response.text())
      .then(data => {
        document.getElementById('main-content').innerHTML = data;
      });
}

function adjustColumnWidths() {
    const table = document.querySelector('table');
    const colWidths = [];

    // Calculate max width required for each column
    const rows = table.querySelectorAll('tr');
    rows.forEach(row => {
        const cells = row.children;
        for (let i = 0; i < cells.length; i++) {
            const cell = cells[i];
            const cellWidth = cell.offsetWidth;
            if (!colWidths[i] || cellWidth > colWidths[i]) {
                colWidths[i] = cellWidth;
            }
        }
    });

    // Apply max width to each column
    rows.forEach(row => {
        const cells = row.children;
        for (let i = 0; i < cells.length; i++) {
            cells[i].style.width = `${colWidths[i]}px`;
        }
    });
}

function displayUsername() {
    const username = localStorage.getItem('username');
    if (username) {
        document.getElementById('usernameDisplay').textContent = username;
    } else {
        window.location.href = 'login.html';
    }
}

function logout() {
    localStorage.removeItem('username');
    localStorage.setItem('autoLogin', 'false'); // Clear auto-login flag
    window.location.href = 'login.html'; // Redirect to login page
}

window.onload = function() {
    displayUsername();
    loadLocations();
    loadEquipment();
    loadMaterials();
};
