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
