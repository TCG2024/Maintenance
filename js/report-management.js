if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
}

async function viewReport() {
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

function generateEquipmentSummaryReport(startDate, endDate) {
    const reportContent = document.getElementById('reportContent');
    reportContent.innerHTML = ''; // Clear previous report

    // Fetch equipment types data
    firebase.database().ref('equipmentTypes').once('value').then(equipmentTypesSnapshot => {
        const equipmentTypes = equipmentTypesSnapshot.val();

        // Fetch equipment data
        firebase.database().ref('equipment').once('value').then(equipmentSnapshot => {
            const equipment = equipmentSnapshot.val();
            let table = '<table><thead><tr><th>ID</th><th>Tag</th><th>Description</th><th>Location</th><th>Type</th><th>Manufacturer</th><th>Model</th><th>Serial Number</th></tr></thead><tbody>';
            for (let id in equipment) {
                if (equipment[id]) {
                    const equipmentType = equipment[id].equipmentType;
                    const equipmentTypeName = equipmentTypes[equipmentType] ? equipmentTypes[equipmentType].equipmenttypeName : 'Unknown';

                    table += `<tr>
                                <td>${id}</td>
                                <td>${equipment[id].equipmentTag}</td>
                                <td>${equipment[id].equipmentDescription}</td>
                                <td>${equipment[id].locationId}</td>
                                <td>${equipmentTypeName}</td>
                                <td>${equipment[id].manufacturer}</td>
                                <td>${equipment[id].model}</td>
                                <td>${equipment[id].serialNumber}</td>
                              </tr>`;
                }
            }
            table += '</tbody></table>';
            reportContent.innerHTML = table;
        }).catch(error => {
            alert('Error fetching equipment data: ' + error.message);
        });
    }).catch(error => {
        alert('Error fetching equipment types data: ' + error.message);
    });
}

function generateFunctionalLocationReport(startDate, endDate) {
    const reportContent = document.getElementById('reportContent');
    reportContent.innerHTML = ''; // Clear previous report

    firebase.database().ref('locations').once('value').then(locationSnapshot => {
        const locations = locationSnapshot.val();
        firebase.database().ref('equipment').once('value').then(equipmentSnapshot => {
            const equipment = equipmentSnapshot.val();
            let locationEquipmentCount = {};

            for (let id in locations) {
                locationEquipmentCount[id] = 0;
            }

            for (let eqId in equipment) {
                let equipmentLocation = equipment[eqId].locationId;
                if (locationEquipmentCount.hasOwnProperty(equipmentLocation)) {
                    locationEquipmentCount[equipmentLocation]++;
                }
            }

            let table = '<table><thead><tr><th>ID</th><th>Name</th><th>Equipment Count</th></tr></thead><tbody>';
            for (let id in locations) {
                if (locations[id]) {
                    table += `<tr>
                                <td>${id}</td>
                                <td>${locations[id].locationName}</td>
                                <td>${locationEquipmentCount[id]}</td>
                              </tr>`;
                }
            }
            table += '</tbody></table>';
            reportContent.innerHTML = table;
        });
    }).catch(error => {
        alert('Error: ' + error.message);
    });
}

function generateMaintenanceHistoryReport(startDate, endDate) {
    const reportContent = document.getElementById('reportContent');
    reportContent.innerHTML = ''; // Clear previous report

    const start = new Date(startDate).getTime();
    const end = new Date(endDate).getTime();

    firebase.database().ref('serviceLogs').orderByKey().once('value').then(async snapshot => {
        const serviceLogs = snapshot.val();
        let table = '<table><thead><tr><th>ID</th><th>Timestamp</th><th>Action Taken</th><th>Call Log ID</th><th>Equipment Details</th><th>Job Description</th><th>Location ID</th><th>Type</th><th>Materials</th><th>Username</th></tr></thead><tbody>';

        const equipmentSnapshot = await firebase.database().ref('equipment').once('value');
        const equipmentData = equipmentSnapshot.val();

        for (let id in serviceLogs) {
            const log = serviceLogs[id];
            const logTime = new Date(log.timestamp).getTime();

            if (log && logTime >= start && logTime <= end) {
                // Convert UTC time to IST by adding 5 hours and 30 minutes
                const logDate = new Date(log.timestamp);
                logDate.setHours(logDate.getHours() + 5);
                logDate.setMinutes(logDate.getMinutes() + 30);
                const formattedTime = logDate.toLocaleString('en-GB', {
                    hour12: true
                });

                const equipmentDetails = log.equipmentId && equipmentData[log.equipmentId] ?
                    `${log.equipmentId} - ${equipmentData[log.equipmentId].equipmentTag} - ${equipmentData[log.equipmentId].equipmentDescription} - ${equipmentData[log.equipmentId].manufacturer} - ${equipmentData[log.equipmentId].model} - ${equipmentData[log.equipmentId].serialNumber}` :
                    'undefined';

                let materialsDescription = 'No materials';
                if (log.issuedMaterials) {
                    materialsDescription = Object.values(log.issuedMaterials)
                        .map(m => `${m.description} (${m.quantity})`)
                        .join(', ');
                }

                table += `<tr>
                            <td>${id}</td>
                            <td>${formattedTime}</td>
                            <td>${log.actionTaken}</td>
                            <td>${log.callLogId}</td>
                            <td>${equipmentDetails}</td>
                            <td>${log.jobDescription}</td>
                            <td>${log.locationId}</td>
                            <td>${log.maintenanceType}</td>
                            <td>${materialsDescription}</td>
                            <td>${log.username}</td>
                          </tr>`;
            }
        }
        table += '</tbody></table>';
        reportContent.innerHTML = table;
    }).catch(error => {
        alert('Error: ' + error.message);
    });
}

function generateMaterialReceiptReport(startDate, endDate) {
    const reportContent = document.getElementById('reportContent');
    reportContent.innerHTML = ''; // Clear previous content

    const start = new Date(startDate).getTime();
    const end = new Date(endDate).getTime();

    firebase.database().ref('receivedMaterials').once('value').then(async snapshot => {
        const materials = snapshot.val();
        let table = '<table><thead><tr><th>Serial No.</th><th>Description</th><th>Specification</th><th>Quantity</th><th>UOM</th><th>Supplier</th><th>PO Number</th><th>Invoice Number</th><th>Timestamp</th><th>Username</th></tr></thead><tbody>';
        let serialNumber = 1;

        // Fetch all materials for reference
        const materialsSnapshot = await firebase.database().ref('materials').once('value');
        const allMaterials = materialsSnapshot.val();

        for (let id in materials) {
            const material = materials[id];
            const receiptTime = new Date(material.timestamp).getTime();

            if (material && receiptTime >= start && receiptTime <= end) {
                // Get the specification from the materials data
                const materialDetails = allMaterials[material.materialId];
                const specification = materialDetails ? materialDetails.spec : 'N/A';

                // Convert timestamp to IST
                const receiptDate = new Date(material.timestamp);
                receiptDate.setHours(receiptDate.getHours() - 5);
                receiptDate.setMinutes(receiptDate.getMinutes() - 30);
                const formattedTime = receiptDate.toLocaleString('en-GB', {
                    hour12: true
                });

                table += `<tr>
                            <td>${serialNumber++}</td>
                            <td>${material.description}</td>
                            <td>${specification}</td>
                            <td>${material.quantity}</td>
                            <td>${material.uom}</td>
                            <td>${material.currentSupplier}</td>
                            <td>${material.poNumber}</td>
                            <td>${material.invNumber}</td>
                            <td>${formattedTime}</td>
                            <td>${material.username}</td>
                          </tr>`;
            }
        }
        table += '</tbody></table>';
        reportContent.innerHTML = table;
    }).catch(error => {
        reportContent.innerHTML = 'Error fetching receipt logs: ' + error.message;
    });
}

function generateMaterialIssuedReport(startDate, endDate) {
    const reportContent = document.getElementById('reportContent');
    reportContent.innerHTML = ''; // Clear previous content

    const start = new Date(startDate).getTime();
    const end = new Date(endDate).getTime();

    firebase.database().ref('issuedMaterials').once('value').then(async snapshot => {
        const materials = snapshot.val();
        let table = '<table><thead><tr><th>Serial No.</th><th>Description</th><th>Specification</th><th>Quantity</th><th>UOM</th><th>Timestamp</th><th>Username</th></tr></thead><tbody>';
        let serialNumber = 1;

        // Fetch all materials for reference
        const materialsSnapshot = await firebase.database().ref('materials').once('value');
        const allMaterials = materialsSnapshot.val();

        for (let id in materials) {
            const material = materials[id];
            const issueTime = new Date(material.timestamp).getTime();

            if (material && issueTime >= start && issueTime <= end) {
                // Get the specification from the materials data
                const materialDetails = allMaterials[material.materialId];
                const specification = materialDetails ? materialDetails.spec : 'N/A';

                // Convert timestamp to IST
                const issueDate = new Date(material.timestamp);
                issueDate.setHours(issueDate.getHours() - 5);
                issueDate.setMinutes(issueDate.getMinutes() - 30);
                const formattedTime = issueDate.toLocaleString('en-GB', {
                    hour12: true
                });

                table += `<tr>
                            <td>${serialNumber++}</td>
                            <td>${material.description}</td>
                            <td>${specification}</td>
                            <td>${material.quantity}</td>
                            <td>${material.uom}</td>
                            <td>${formattedTime}</td>
                            <td>${material.username}</td>
                          </tr>`;
            }
        }
        table += '</tbody></table>';
        reportContent.innerHTML = table;
    }).catch(error => {
        reportContent.innerHTML = 'Error fetching issued material logs: ' + error.message;
    });
}

function generateMaterialInventoryReport(startDate, endDate) {
    const reportContent = document.getElementById('reportContent');
    reportContent.innerHTML = ''; // Clear previous report

    firebase.database().ref('materials').once('value').then(snapshot => {
        const materials = snapshot.val();
        let table = '<table><thead><tr><th>ID</th><th>Description</th><th>Probable Place</th><th>Quantity</th><th>Rack No</th><th>UOM</th><th>Store No</th><th>Supplier</th><th>Remarks</th><th>Spec</th></tr></thead><tbody>';
        for (let id in materials) {
            if (materials[id]) {
                table += `<tr>
                            <td>${id}</td>
                            <td>${materials[id].description}</td>
                            <td>${materials[id].probablePlace}</td>
                            <td>${materials[id].quantity}</td>
                            <td>${materials[id].rackNo}</td>
                            <td>${materials[id].uom}</td>
                            <td>${materials[id].storeNo}</td>
                            <td>${materials[id].supplier}</td>
                            <td>${materials[id].remarks}</td>
                            <td>${materials[id].spec}</td>
                          </tr>`;
            }
        }
        table += '</tbody></table>';
        reportContent.innerHTML = table;
    }).catch(error => {
        alert('Error fetching materials: ' + error.message);
    });
}

function generateRackUtilizationReport(startDate, endDate) {
    const reportContent = document.getElementById('reportContent');
    reportContent.innerHTML = ''; // Clear previous content

    firebase.database().ref('materials').once('value').then(materialSnapshot => {
        const materials = materialSnapshot.val();
        let storeRackUtilization = {};

        for (let materialId in materials) {
            const material = materials[materialId];
            const storeId = material.storeNo;
            const rackNo = material.rackNo;
            const quantity = parseInt(material.quantity, 10);

            if (!storeRackUtilization[storeId]) {
                storeRackUtilization[storeId] = {};
            }
            if (!storeRackUtilization[storeId][rackNo]) {
                storeRackUtilization[storeId][rackNo] = {
                    totalQuantity: 0,
                    materials: []
                };
            }
            storeRackUtilization[storeId][rackNo].totalQuantity += quantity;
            storeRackUtilization[storeId][rackNo].materials.push({
                materialId: materialId,
                description: material.description,
                quantity: quantity
            });
        }

        let table = '<table><thead><tr><th>Store ID</th><th>Rack No</th><th>Total Quantity</th><th>Materials Details</th></tr></thead><tbody>';
        for (let storeId in storeRackUtilization) {
            for (let rackNo in storeRackUtilization[storeId]) {
                const rack = storeRackUtilization[storeId][rackNo];
                let materialsDetails = rack.materials.map(mat => `${mat.description} (${mat.quantity})`).join(', ');
                table += `<tr>
                            <td>${storeId}</td>
                            <td>${rackNo}</td>
                            <td>${rack.totalQuantity}</td>
                            <td>${materialsDetails}</td>
                          </tr>`;
            }
        }
        table += '</tbody></table>';
        reportContent.innerHTML = table;
    }).catch(error => {
        reportContent.innerHTML = 'Error fetching materials: ' + error.message;
    });
}

function generateEquipmentMovementReport(startDate, endDate) {
    const reportContent = document.getElementById('reportContent');
    reportContent.innerHTML = ''; // Clear previous report

    const start = new Date(startDate).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' });
    const end = new Date(endDate).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' });

    const parsedStart = Date.parse(start);
    const parsedEnd = Date.parse(end);

    console.log('Start Date:', startDate, 'Parsed Start Time:', parsedStart);
    console.log('End Date:', endDate, 'Parsed End Time:', parsedEnd);

    firebase.database().ref('activityLogs').once('value').then(snapshot => {
        const logs = snapshot.val();

        let createLogs = [];
        let modifyLogs = [];
        let deleteLogs = [];

        for (let logId in logs) {
            const log = logs[logId];
            const logTime = Date.parse(log.timestamp);

            if (logTime >= parsedStart && logTime <= parsedEnd) {
                switch (log.action) {
                    case 'create':
                        if (log.newData) {
                            createLogs.push(log);
                        }
                        break;
                    case 'modify':
                        if (log.newData && log.oldData) {
                            modifyLogs.push(log);
                        }
                        break;
                    case 'delete':
                        if (log.oldData) {
                            deleteLogs.push(log);
                        }
                        break;
                    default:
                        break;
                }
            }
        }

        let createTable = '<h3>Create Logs</h3><table><thead><tr><th>Equipment Description</th><th>Equipment Tag</th><th>Equipment Type</th><th>Location ID</th><th>Manufacturer</th><th>Model</th><th>Serial Number</th><th>Timestamp</th><th>Username</th></tr></thead><tbody>';
        createLogs.forEach(log => {
            createTable += `<tr>
                <td>${log.newData.equipmentDescription}</td>
                <td>${log.newData.equipmentTag}</td>
                <td>${log.newData.equipmentType}</td>
                <td>${log.newData.locationId}</td>
                <td>${log.newData.manufacturer}</td>
                <td>${log.newData.model}</td>
                <td>${log.newData.serialNumber}</td>
                <td>${log.timestamp}</td>
                <td>${log.username}</td>
            </tr>`;
        });
        createTable += '</tbody></table>';

        let modifyTable = '<h3>Modify Logs</h3><table><thead><tr><th>New Equipment Description</th><th>New Equipment Tag</th><th>New Equipment Type</th><th>New Location ID</th><th>New Manufacturer</th><th>New Model</th><th>New Serial Number</th><th>Old Equipment Description</th><th>Old Equipment Tag</th><th>Old Equipment Type</th><th>Old Location ID</th><th>Old Manufacturer</th><th>Old Model</th><th>Old Serial Number</th><th>Timestamp</th><th>Username</th></tr></thead><tbody>';
        modifyLogs.forEach(log => {
            modifyTable += `<tr>
                <td>${log.newData.equipmentDescription}</td>
                <td>${log.newData.equipmentTag}</td>
                <td>${log.newData.equipmentType}</td>
                <td>${log.newData.locationId}</td>
                <td>${log.newData.manufacturer}</td>
                <td>${log.newData.model}</td>
                <td>${log.newData.serialNumber}</td>
                <td>${log.oldData.equipmentDescription}</td>
                <td>${log.oldData.equipmentTag}</td>
                <td>${log.oldData.equipmentType}</td>
                <td>${log.oldData.locationId}</td>
                <td>${log.oldData.manufacturer}</td>
                <td>${log.oldData.model}</td>
                <td>${log.oldData.serialNumber}</td>
                <td>${log.timestamp}</td>
                <td>${log.username}</td>
            </tr>`;
        });
        modifyTable += '</tbody></table>';

        let deleteTable = '<h3>Delete Logs</h3><table><thead><tr><th>Equipment Description</th><th>Equipment Tag</th><th>Equipment Type</th><th>Location ID</th><th>Manufacturer</th><th>Model</th><th>Serial Number</th><th>Timestamp</th><th>Username</th></tr></thead><tbody>';
        deleteLogs.forEach(log => {
            deleteTable += `<tr>
                <td>${log.oldData.equipmentDescription}</td>
                <td>${log.oldData.equipmentTag}</td>
                <td>${log.oldData.equipmentType}</td>
                <td>${log.oldData.locationId}</td>
                <td>${log.oldData.manufacturer}</td>
                <td>${log.oldData.model}</td>
                <td>${log.oldData.serialNumber}</td>
                <td>${log.timestamp}</td>
                <td>${log.username}</td>
            </tr>`;
        });
        deleteTable += '</tbody></table>';

        reportContent.innerHTML = createTable + modifyTable + deleteTable;
    }).catch(error => {
        console.log('Error fetching activity logs:', error);
        reportContent.innerHTML = 'Error fetching activity logs: ' + error.message;
    });
}

function formatLogData(data) {
    if (!data) return '';
    let formattedData = '<table>';
    for (let key in data) {
        formattedData += `<tr><td>${key}</td><td>${data[key]}</td></tr>`;
    }
    formattedData += '</table>';
    return formattedData;
}

function downloadReport() {
    const reportContent = document.getElementById('reportContent');
    const reportSelect = document.getElementById('reportSelect').value;

    // Get all tables in the report content
    const tables = reportContent.querySelectorAll('table');

    const wb = XLSX.utils.book_new();

    tables.forEach((table, index) => {
        const sheetName = `Sheet${index + 1}`;
        const ws = XLSX.utils.table_to_sheet(table);
        XLSX.utils.book_append_sheet(wb, ws, sheetName);
    });

    XLSX.writeFile(wb, `${reportSelect}_report.xlsx`);
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
