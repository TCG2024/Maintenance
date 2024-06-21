const correctPassword = 'Hot@1rbaloon';  // Set your password here

function checkPassword() {
    const enteredPassword = document.getElementById('passwordInput').value;
    if (enteredPassword === correctPassword) {
        document.getElementById('passwordPrompt').style.display = 'none';
        document.getElementById('main-wrapper').style.display = 'block';
    } else {
        alert('Incorrect password. Please try again.');
    }
}

// Function to handle logout
function logout() {
    localStorage.removeItem('username');
    localStorage.setItem('autoLogin', 'false'); // Clear auto-login flag
    window.location.href = 'login.html'; // Redirect to login page
}

// Function to display username
function displayUsername() {
    const username = localStorage.getItem('username');
    if (username) {
        document.getElementById('usernameDisplay').textContent = username;
    } else {
        window.location.href = 'login.html';  // Redirect to login page if not logged in
    }
}

// Call displayUsername on page load
window.onload = displayUsername;

// Function to upload data
function uploadData(section) {
    const fileInput = document.getElementById(`upload${section.charAt(0).toUpperCase() + section.slice(1)}`);
    const file = fileInput.files[0];
    if (!file) {
        alert('Please select a file.');
        return;
    }
    const reader = new FileReader();
    reader.onload = function (e) {
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, { type: 'array' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const json = XLSX.utils.sheet_to_json(worksheet);
        
        let jsonWithIndex = {};
        if (section.toLowerCase() === 'locations') {
            json.forEach(item => {
                jsonWithIndex[item.locationId] = { locationName: item.locationName };
            });
        } else if (section.toLowerCase() === 'stores') {
            json.forEach(item => {
                if (!jsonWithIndex[item.storeID]) {
                    jsonWithIndex[item.storeID] = { racks: {} };
                }
                jsonWithIndex[item.storeID].racks[item.rackId] = { rackNo: item.rackNo };
                jsonWithIndex[item.storeID].storeName = item.storeName; // Adding storeName for completeness
            });
        } else if (section.toLowerCase() === 'users') {
            json.forEach(item => {
                jsonWithIndex[item.name] = {
                    email: item.email,
                    name: item.name,
                    password: item.password
                };
            });
        } else if (section.toLowerCase() === 'equipmenttypes') {
            json.forEach(item => {
                const id = item.equipmentTypeID;
                if (id) {
                    jsonWithIndex[id] = { equipmentName: item.equipmentName };
                }
            });
        } else if (section.toLowerCase() === 'equipment') {
            json.forEach((item, index) => {
                jsonWithIndex[index + 1] = {
                    equipmentDescription: item.equipmentDescription,
                    equipmentTag: item.equipmentTag,
                    equipmentType: item.equipmentType,
                    locationId: item.locationId,
                    manufacturer: item.manufacturer,
                    model: item.model,
                    serialNumber: item.serialNumber
                };
            });
        } else {
            json.forEach((item, index) => {
                jsonWithIndex[index + 1] = item;
            });
        }

        firebase.database().ref(section).set(jsonWithIndex).then(() => {
            alert(`${section.charAt(0).toUpperCase() + section.slice(1)} uploaded successfully!`);
        }).catch(error => {
            alert('Error: ' + error.message);
        });
    };
    reader.readAsArrayBuffer(file);
}

// Function to download data
function downloadData(section) {
    firebase.database().ref(section).once('value').then(snapshot => {
        const data = snapshot.val();
        if (!data) {
            alert(`No data available for ${section}`);
            return;
        }

        let jsonArray = [];
        if (section.toLowerCase() === 'locations') {
            jsonArray = Object.keys(data).map(key => ({
                locationId: key,
                locationName: data[key].locationName
            }));
        } else if (section.toLowerCase() === 'stores') {
            Object.keys(data).forEach(storeName => {
                const store = data[storeName];
                const racks = store.racks || {};
                Object.keys(racks).forEach(rackId => {
                    jsonArray.push({
                        storeID: storeName,
                        storeName: store.storeName || '',
                        rackId: rackId,
                        rackNo: racks[rackId].rackNo
                    });
                });
            });
        } else if (section.toLowerCase() === 'users') {
            jsonArray = Object.keys(data).map(key => ({
                email: data[key].email,
                name: data[key].name,
                password: data[key].password
            }));
        } else if (section.toLowerCase() === 'equipmenttypes') {
            jsonArray = Object.keys(data).map(key => ({
                equipmentTypeID: key,
                equipmentName: data[key].equipmentName
            }));
        } else if (section.toLowerCase() === 'equipment') {
            jsonArray = Object.keys(data).map(key => ({
                equipmentDescription: data[key].equipmentDescription,
                equipmentTag: data[key].equipmentTag,
                equipmentType: data[key].equipmentType,
                locationId: data[key].locationId,
                manufacturer: data[key].manufacturer,
                model: data[key].model,
                serialNumber: data[key].serialNumber
            }));
        } else {
            jsonArray = Object.values(data);
        }

        const worksheet = XLSX.utils.json_to_sheet(jsonArray);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, section);
        XLSX.writeFile(workbook, `${section}.xlsx`);
    }).catch(error => {
        alert('Error: ' + error.message);
    });
}

// Function to delete data
function deleteData(section) {
    firebase.database().ref(section).remove().then(() => {
        alert(`${section.charAt(0).toUpperCase() + section.slice(1)} deleted successfully!`);
    }).catch(error => {
        alert('Error: ' + error.message);
    });
}
