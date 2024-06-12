function loadContent(page) {
    fetch(page)
      .then(response => response.text())
      .then(data => {
        document.getElementById('main-content').innerHTML = data;
      });
}

function viewReport() {
    const reportSelect = document.getElementById('reportSelect').value;
    const startDate = document.getElementById('startDate').value;
    const endDate = document.getElementById('endDate').value;

    switch (reportSelect) {
      case 'equipmentSummary':
        generateEquipmentSummaryReport(startDate, endDate);
        break;
      case 'functionalLocation':
        generateFunctionalLocationReport(startDate, endDate);
        break;
      case 'maintenanceHistory':
        generateMaintenanceHistoryReport(startDate, endDate);
        break;
      case 'receiptHistory':
        generateMaterialReceiptReport(startDate, endDate);
        break;
      case 'issueHistory':
        generateMaterialIssuedReport(startDate, endDate);
        break;
      case 'materialInventory':
        generateMaterialInventoryReport(startDate, endDate);
        break;
      case 'rackUtilization':
        generateRackUtilizationReport(startDate, endDate);
        break;
      case 'equipmentMovement':
        generateEquipmentMovementReport(startDate, endDate);
        break;
      default:
        alert('Please select a valid report.');
        break;
    }
}

function downloadReport() {
    const reportContent = document.getElementById('reportContent');
    const reportSelect = document.getElementById('reportSelect').value;

    // Get all tables in the report content
    const tables = reportContent.querySelectorAll('table');

    const wb = XLSX.utils.book_new();

    tables.forEach((table, index) => {
        let sheetName = table.previousElementSibling ? table.previousElementSibling.textContent.trim() : `Sheet${index + 1}`;
        const ws = XLSX.utils.table_to_sheet(table);
        XLSX.utils.book_append_sheet(wb, ws, sheetName);
    });

    if (wb.SheetNames.length > 0) {
      XLSX.writeFile(wb, `${reportSelect}_report.xlsx`);
    } else {
      alert("No data to download");
    }
}

function searchTable() {
    const searchInput = document.getElementById('searchInput').value.toLowerCase();
    const table = document.querySelector('#reportContent table');
    const rows = table.getElementsByTagName('tr');
    for (let i = 1; i < rows.length; i++) {
      const cells = rows[i].getElementsByTagName('td');
      let rowMatch = false;
      for (let j = 0; j < cells.length; j++) {
        if (cells[j].innerHTML.toLowerCase().indexOf(searchInput) > -1) {
          rowMatch = true;
          break;
        }
      }
      if (rowMatch) {
        rows[i].style.display = '';
      } else {
        rows[i].style.display = 'none';
      }
    }
}

function toggleMenu(element) {
    const ul = element.nextElementSibling;
    ul.style.display = ul.style.display === 'block' ? 'none' : 'block';
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
};
