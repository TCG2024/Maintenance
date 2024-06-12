let editingStoreId = null;

if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
}

async function createStore() {
    const storeId = document.getElementById('storeId').value;
    const storeName = document.getElementById('storeName').value;

    if (!storeId || !storeName) {
        alert('Please fill all mandatory fields.');
        return;
    }

    try {
        const storesRef = firebase.database().ref('stores');
        const snapshot = await storesRef.child(storeId).once('value');
        if (snapshot.exists()) {
            alert('Store ID already exists. Please provide a unique Store ID.');
            return;
        }

        await storesRef.child(storeId).set({
            storeName: storeName
        });
        alert('Store created successfully!');
        resetForm();
        loadStores();
    } catch (error) {
        alert('Error: ' + error.message);
    }
}

function resetForm() {
    document.getElementById('storeId').value = '';
    document.getElementById('storeName').value = '';
    document.getElementById('createButton').style.display = 'inline-block';
    document.getElementById('updateButton').style.display = 'none';
    editingStoreId = null;
}

async function loadStores() {
    try {
        const snapshot = await firebase.database().ref('stores').once('value');
        const stores = snapshot.val();
        const storeList = document.getElementById('storeList');
        storeList.innerHTML = '';

        if (stores) {
            let table = '<table><tr><th>ID</th><th>Store Name</th><th>Actions</th></tr>';
            for (const storeId in stores) {
                const store = stores[storeId];
                table += `<tr>
                            <td>${storeId}</td>
                            <td>${store.storeName}</td>
                            <td><button class="edit-button" onclick="editStore('${storeId}')">Edit</button> <button class="delete-button" onclick="deleteStore('${storeId}')">Delete</button></td>
                          </tr>`;
            }
            table += '</table>';
            storeList.innerHTML = table;
        } else {
            storeList.innerHTML = '<p>No stores found in the database.</p>';
        }
    } catch (error) {
        alert('Error: ' + error.message);
    }
}

function editStore(storeId) {
    const storeRef = firebase.database().ref('stores/' + storeId);
    storeRef.once('value', snapshot => {
        const store = snapshot.val();
        document.getElementById('storeId').value = storeId;
        document.getElementById('storeName').value = store.storeName;

        document.getElementById('createButton').style.display = 'none';
        document.getElementById('updateButton').style.display = 'inline-block';
        editingStoreId = storeId;
    }).catch(error => {
        alert('Error: ' + error.message);
    });
}

async function updateStore() {
    if (!editingStoreId) return;

    const storeId = document.getElementById('storeId').value;
    const storeName = document.getElementById('storeName').value;

    if (!storeId || !storeName) {
        alert('Please fill all mandatory fields.');
        return;
    }

    try {
        await firebase.database().ref('stores/' + editingStoreId).update({
            storeName: storeName
        });
        alert('Store updated successfully!');
        resetForm();
        loadStores();
    } catch (error) {
        alert('Error: ' + error.message);
    }
}

async function deleteStore(storeId) {
    try {
        const storeRef = firebase.database().ref('stores/' + storeId);
        await storeRef.remove();
        loadStores();
        alert('Store deleted successfully!');
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
    setTimeout(() => {
        loadStores();
    }, 1000);
};
