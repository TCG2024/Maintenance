function loadContent(page) {
    fetch(page)
      .then(response => response.text())
      .then(data => {
        document.getElementById('main-content').innerHTML = data;
      });
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
    setTimeout(loadMaterials, 1000);
};
