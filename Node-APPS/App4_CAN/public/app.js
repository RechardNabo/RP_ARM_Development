// Connect to Socket.IO server
const socket = io();

// DOM elements
const connectionStatus = document.getElementById('connection-status');
const messagesSent = document.getElementById('messages-sent');
const messagesReceived = document.getElementById('messages-received');
const successRate = document.getElementById('success-rate');
const busLoad = document.getElementById('bus-load');
const peakLoad = document.getElementById('peak-load');
const errorFrames = document.getElementById('error-frames');
const messageLog = document.getElementById('message-log').querySelector('tbody');
const sendForm = document.getElementById('send-form');
const canId = document.getElementById('can-id');
const extendedId = document.getElementById('extended-id');
const canDlc = document.getElementById('can-dlc');
const byteContainer = document.getElementById('byte-container');
const asciiInput = document.getElementById('ascii-input');
const applyAsciiBtn = document.getElementById('apply-ascii');
const clearFormBtn = document.getElementById('clear-form');
const clearLogBtn = document.getElementById('clear-log');
const filterId = document.getElementById('filter-id');
const applyFilterBtn = document.getElementById('apply-filter');
const clearFilterBtn = document.getElementById('clear-filter');
const autoScrollCheckbox = document.getElementById('auto-scroll');
const darkModeToggle = document.getElementById('dark-mode');
const sniffToggle = document.getElementById('sniff-toggle');
const tabsContainer = document.getElementById('tabs-container');
const loggingToggle = document.getElementById('logging-toggle');
const availableLogsContainer = document.getElementById('available-logs');
const sequenceForm = document.getElementById('sequence-form');
const sequenceMessagesContainer = document.getElementById('sequence-messages');
const addSequenceMessageBtn = document.getElementById('add-sequence-message');
const saveSequenceBtn = document.getElementById('save-sequence');
const loadSequenceBtn = document.getElementById('load-sequence');
const sequenceNameInput = document.getElementById('sequence-name');
const sequenceListContainer = document.getElementById('sequence-list');
const replayControl = document.getElementById('replay-control');
const replayCountInput = document.getElementById('replay-count');
const replaySpeedInput = document.getElementById('replay-speed');
const startReplayBtn = document.getElementById('start-replay');
const maxLogRowsInput = document.getElementById('max-log-rows');

// State variables
let activeFilter = null;
let darkMode = localStorage.getItem('darkMode') === 'true';
let autoScroll = localStorage.getItem('autoScroll') !== 'false';
let sniffActive = true;
let currentSequenceName = '';
let activeTab = localStorage.getItem('activeTab') || 'send-tab';
let maxLogRows = parseInt(localStorage.getItem('maxLogRows') || '100');

// Initialize UI state
autoScrollCheckbox.checked = autoScroll;
maxLogRowsInput.value = maxLogRows;
if (darkMode) {
    document.body.classList.add('dark-mode');
    darkModeToggle.checked = true;
}

// Tab switching
function setupTabs() {
    document.querySelectorAll('.tab-button').forEach(button => {
        button.addEventListener('click', () => {
            const targetTab = button.dataset.tab;
            
            // Hide all tab content
            document.querySelectorAll('.tab-content').forEach(content => {
                content.classList.remove('active');
            });
            
            // Show the selected tab content
            document.getElementById(targetTab).classList.add('active');
            
            // Update active tab button
            document.querySelectorAll('.tab-button').forEach(btn => {
                btn.classList.remove('active');
            });
            button.classList.add('active');
            
            // Save preference
            localStorage.setItem('activeTab', targetTab);
            activeTab = targetTab;
        });
    });
    
    // Set initial active tab
    document.querySelector(`.tab-button[data-tab="${activeTab}"]`).click();
}

// Notification system
function showNotification(message, type = 'info', duration = 3000) {
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.innerHTML = `
        <div class="notification-content">
            <span class="notification-message">${message}</span>
            <button class="notification-close">&times;</button>
        </div>
    `;
    
    document.getElementById('notification-container').appendChild(notification);
    
    // Add close button handler
    notification.querySelector('.notification-close').addEventListener('click', () => {
        notification.classList.add('notification-hiding');
        setTimeout(() => {
            notification.remove();
        }, 300);
    });
    
    // Auto-remove after duration
    setTimeout(() => {
        if (notification.parentElement) {
            notification.classList.add('notification-hiding');
            setTimeout(() => {
                if (notification.parentElement) {
                    notification.remove();
                }
            }, 300);
        }
    }, duration);
    
    // Animate in
    setTimeout(() => {
        notification.classList.add('notification-visible');
    }, 10);
}

// Socket.IO event handlers
socket.on('connect', () => {
    connectionStatus.classList.remove('offline');
    connectionStatus.classList.add('online');
    connectionStatus.querySelector('.status-text').textContent = 'Connected';
    showNotification('Connected to server', 'success');
    
    // Request logs list on connection
    socket.emit('get-logs');
});

socket.on('disconnect', () => {
    connectionStatus.classList.remove('online');
    connectionStatus.classList.add('offline');
    connectionStatus.querySelector('.status-text').textContent = 'Disconnected';
    showNotification('Disconnected from server', 'error');
});

socket.on('error', (error) => {
    console.error('Socket error:', error);
    showNotification(`Error: ${error.message}`, 'error');
});

socket.on('notify', (notification) => {
    showNotification(notification.message, notification.type);
});

socket.on('stats', (stats) => {
    messagesSent.textContent = stats.messagesSent;
    messagesReceived.textContent = stats.messagesReceived;
    
    const rate = stats.messagesSent > 0 
        ? ((stats.messagesReceived / stats.messagesSent) * 100).toFixed(1) 
        : '0.0';
    
    successRate.textContent = `${rate}%`;
    
    // New stats
    if (busLoad) busLoad.textContent = `${stats.busLoad.toFixed(1)}%`;
    if (peakLoad) peakLoad.textContent = `${stats.peakLoad.toFixed(1)}%`;
    if (errorFrames) errorFrames.textContent = stats.errorFrames;
    
    // Update the bus load graph
    updateBusLoadGraph(stats.busLoad);
});

// Simple bus load graph
let busLoadHistory = Array(30).fill(0);
function updateBusLoadGraph(currentLoad) {
    const graphContainer = document.getElementById('bus-load-graph');
    if (!graphContainer) return;
    
    busLoadHistory.push(currentLoad);
    busLoadHistory.shift();
    
    graphContainer.innerHTML = '';
    
    busLoadHistory.forEach((load) => {
        const bar = document.createElement('div');
        bar.className = 'graph-bar';
        
        const height = Math.min(Math.max(load, 0), 100);
        bar.style.height = `${height}%`;
        
        // Color based on load
        if (height < 30) {
            bar.style.backgroundColor = 'var(--color-success)';
        } else if (height < 70) {
            bar.style.backgroundColor = 'var(--color-warning)';
        } else {
            bar.style.backgroundColor = 'var(--color-error)';
        }
        
        graphContainer.appendChild(bar);
    });
}

socket.on('can-message', (message) => {
    // Skip if sniffing is disabled (except for messages we sent)
    if (!sniffActive && message.direction !== 'TX') {
        return;
    }
    
    // Check if message should be filtered
    if (activeFilter && !message.id.toLowerCase().includes(activeFilter.toLowerCase())) {
        return;
    }
    
    addMessageToLog(message);
});

socket.on('logging-status', (status) => {
    if (!loggingToggle) return;
    
    loggingToggle.checked = status.active;
    
    if (status.active) {
        document.getElementById('logging-status').textContent = 'Recording';
        document.getElementById('logging-status').classList.add('recording');
    } else {
        document.getElementById('logging-status').textContent = 'Idle';
        document.getElementById('logging-status').classList.remove('recording');
    }
});

socket.on('available-logs', (logs) => {
    if (!availableLogsContainer) return;
    
    availableLogsContainer.innerHTML = '';
    
    if (logs.length === 0) {
        availableLogsContainer.innerHTML = '<p>No logs available</p>';
        return;
    }
    
    logs.forEach(log => {
        const logEntry = document.createElement('div');
        logEntry.className = 'log-entry';
        
        // Format the date
        const date = new Date(log.date);
        const formattedDate = `${date.toLocaleDateString()} ${date.toLocaleTimeString()}`;
        
        // Format the size
        const formattedSize = formatFileSize(log.size);
        
        logEntry.innerHTML = `
            <div class="log-entry-details">
                <div class="log-name">${log.name}</div>
                <div class="log-info">${formattedDate} - ${formattedSize}</div>
            </div>
            <div class="log-entry-actions">
                <button class="download-log" data-filename="${log.name}">Download</button>
                <button class="delete-log" data-filename="${log.name}">Delete</button>
            </div>
        `;
        
        availableLogsContainer.appendChild(logEntry);
    });
    
    // Add event listeners for download buttons
    document.querySelectorAll('.download-log').forEach(button => {
        button.addEventListener('click', () => {
            const filename = button.dataset.filename;
            window.open(`/logs/${filename}`, '_blank');
        });
    });
    
    // Add event listeners for delete buttons
    document.querySelectorAll('.delete-log').forEach(button => {
        button.addEventListener('click', () => {
            const filename = button.dataset.filename;
            if (confirm(`Are you sure you want to delete ${filename}?`)) {
                socket.emit('delete-log', filename);
            }
        });
    });
});

// Handle known patterns list
socket.on('known-patterns', (patterns) => {
    if (!sequenceListContainer) return;
    
    // Update sequence list
    updateSequenceList(patterns);
});

socket.on('pattern-data', (pattern) => {
    loadSequenceToForm(pattern);
});

socket.on('sequence-started', (data) => {
    showNotification(`Started sequence with ${data.count} messages`, 'info');
});

socket.on('replay-started', (data) => {
    showNotification(`Replaying ${data.count} messages`, 'info');
});

socket.on('log-deleted', (filename) => {
    showNotification(`Log file ${filename} deleted`, 'success');
    socket.emit('get-logs'); // Refresh logs list
});

// Format file size
function formatFileSize(bytes) {
    if (bytes < 1024) return bytes + ' B';
    else if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB';
    else return (bytes / 1048576).toFixed(1) + ' MB';
}

// Form submission handler
sendForm.addEventListener('submit', (e) => {
    e.preventDefault();
    
    const id = canId.value.trim();
    if (!id || !/^[0-9a-fA-F]+$/.test(id)) {
        showNotification('Please enter a valid hexadecimal CAN ID', 'error');
        return;
    }
    
    // Collect data bytes
    const dataBytes = [];
    const byteInputs = byteContainer.querySelectorAll('.byte-input');
    const dlc = parseInt(canDlc.value);
    
    for (let i = 0; i < dlc; i++) {
        const byteValue = byteInputs[i].value.trim();
        if (!byteValue || !/^[0-9a-fA-F]{1,2}$/.test(byteValue)) {
            showNotification(`Please enter a valid hexadecimal value for byte ${i+1}`, 'error');
            return;
        }
        dataBytes.push(parseInt(byteValue, 16));
    }
    
    // Send the CAN message
    socket.emit('send-can-message', {
        id: id,
        data: dataBytes,
        extended: extendedId.checked
    });
    
    // Optional: highlight form to show it was sent
    sendForm.classList.add('message-sent');
    setTimeout(() => {
        sendForm.classList.remove('message-sent');
    }, 300);
});

// Apply ASCII to byte inputs
applyAsciiBtn.addEventListener('click', () => {
    const text = asciiInput.value;
    const byteInputs = byteContainer.querySelectorAll('.byte-input');
    
    // Clear existing inputs
    byteInputs.forEach(input => {
        input.value = '00';
    });
    
    // Set the ASCII values
    for (let i = 0; i < text.length && i < byteInputs.length; i++) {
        const charCode = text.charCodeAt(i);
        byteInputs[i].value = charCode.toString(16).toUpperCase().padStart(2, '0');
    }
    
    // Update DLC if necessary
    const requiredDlc = Math.min(text.length, 8);
    canDlc.value = requiredDlc > 0 ? requiredDlc : 1;
    updateByteInputs();
});

// Two-way ASCII conversion
document.querySelectorAll('.byte-input').forEach(input => {
    input.addEventListener('change', updateAsciiFromBytes);
});

function updateAsciiFromBytes() {
    const byteInputs = byteContainer.querySelectorAll('.byte-input');
    const dlc = parseInt(canDlc.value);
    let asciiText = '';
    
    for (let i = 0; i < dlc; i++) {
        const byteValue = byteInputs[i].value.trim();
        if (byteValue && /^[0-9a-fA-F]{1,2}$/.test(byteValue)) {
            const charCode = parseInt(byteValue, 16);
            asciiText += (charCode >= 32 && charCode <= 126) ? String.fromCharCode(charCode) : '.';
        } else {
            asciiText += '.';
        }
    }
    
    asciiInput.value = asciiText;
}

// Update byte input fields based on selected DLC
canDlc.addEventListener('change', updateByteInputs);

function updateByteInputs() {
    const dlc = parseInt(canDlc.value);
    const byteInputs = byteContainer.querySelectorAll('.byte-input');
    
    byteInputs.forEach((input, index) => {
        input.disabled = index >= dlc;
        if (index >= dlc) {
            input.classList.add('disabled');
        } else {
            input.classList.remove('disabled');
        }
    });
    
    // Update ASCII when DLC changes
    updateAsciiFromBytes();
}

// Clear form button handler
clearFormBtn.addEventListener('click', () => {
    canId.value = '123';
    extendedId.checked = false;
    canDlc.value = '8';
    
    const byteInputs = byteContainer.querySelectorAll('.byte-input');
    const defaultValues = ['52', '50', '33', '20', '43', '41', '4E', '00']; // "RP3 CAN\0"
    
    byteInputs.forEach((input, index) => {
        input.value = defaultValues[index] || '00';
    });
    
    asciiInput.value = 'RP3 CAN';
    updateByteInputs();
});

// Clear log button handler
clearLogBtn.addEventListener('click', () => {
    if (confirm('Are you sure you want to clear the message log?')) {
        messageLog.innerHTML = '';
    }
});

// Filter handlers
applyFilterBtn.addEventListener('click', () => {
    const filter = filterId.value.trim();
    if (filter) {
        activeFilter = filter;
        applyFilterBtn.textContent = 'Applied';
        applyFilterBtn.classList.add('active-filter');
        showNotification(`Filtering messages by ID: ${filter}`, 'info');
    } else {
        clearFilter();
    }
});

clearFilterBtn.addEventListener('click', clearFilter);

function clearFilter() {
    activeFilter = null;
    filterId.value = '';
    applyFilterBtn.textContent = 'Apply';
    applyFilterBtn.classList.remove('active-filter');
    showNotification('Filter cleared', 'info');
}

// Dark mode toggle
darkModeToggle.addEventListener('change', () => {
    darkMode = darkModeToggle.checked;
    document.body.classList.toggle('dark-mode', darkMode);
    localStorage.setItem('darkMode', darkMode);
});

// Auto-scroll toggle
autoScrollCheckbox.addEventListener('change', () => {
    autoScroll = autoScrollCheckbox.checked;
    localStorage.setItem('autoScroll', autoScroll);
});

// Max log rows setting
maxLogRowsInput.addEventListener('change', () => {
    const newValue = parseInt(maxLogRowsInput.value);
    if (!isNaN(newValue) && newValue > 0) {
        maxLogRows = newValue;
        localStorage.setItem('maxLogRows', maxLogRows);
        showNotification(`Maximum log rows set to ${maxLogRows}`, 'info');
    }
});

// Sniffing toggle
sniffToggle.addEventListener('change', () => {
    sniffActive = sniffToggle.checked;
    if (sniffActive) {
        showNotification('CAN message sniffing enabled', 'success');
    } else {
        showNotification('CAN message sniffing disabled - only showing sent messages', 'warning');
    }
});

// Logging controls
loggingToggle.addEventListener('change', () => {
    if (loggingToggle.checked) {
        socket.emit('start-logging');
    } else {
        socket.emit('stop-logging');
    }
});

// Function to add a message to the log
function addMessageToLog(message) {
    const row = document.createElement('tr');
    row.classList.add(message.direction.toLowerCase());
    
    // Add replayed marker if applicable
    if (message.note === 'Replayed') {
        row.classList.add('replayed');
    }
    
    const dlc = message.data ? message.data.length : 0;
    
    row.innerHTML = `
        <td>${message.timestamp}</td>
        <td>${message.direction}</td>
        <td class="id-cell" data-id="${message.id}">${message.id}</td>
        <td>${dlc}</td>
        <td class="data-cell">${message.hex}</td>
        <td class="data-cell">${message.ascii}</td>
        <td class="data-cell">${message.decimal}</td>
        <td class="analysis-cell">${formatAnalysis(message.analysis)}</td>
    `;
    
    // Add event listener to ID cell for quick filtering
    row.querySelector('.id-cell').addEventListener('click', (e) => {
        const id = e.target.dataset.id;
        filterId.value = id;
        applyFilterBtn.click();
    });
    
    // Add to the top of the table
    if (messageLog.firstChild) {
        messageLog.insertBefore(row, messageLog.firstChild);
    } else {
        messageLog.appendChild(row);
    }
    
    // Limit the number of rows to prevent performance issues
    while (messageLog.children.length > maxLogRows) {
        messageLog.removeChild(messageLog.lastChild);
    }
    
    // Auto-scroll if enabled
    if (autoScroll) {
        const messageContainer = document.querySelector('.message-log-container');
        messageContainer.scrollTop = 0;
    }
}

// Format the analysis data for display
function formatAnalysis(analysis) {
    if (!analysis) return 'N/A';
    
    let result = `<strong>${analysis.messageType}</strong>`;
    
    if (analysis.details && Object.keys(analysis.details).length > 0) {
        result += '<ul>';
        for (const [key, value] of Object.entries(analysis.details)) {
            // Convert camelCase to Title Case with spaces
            const formattedKey = key.replace(/([A-Z])/g, ' $1')
                .replace(/^./, str => str.toUpperCase());
            
            result += `<li>${formattedKey}: ${value}</li>`;
        }
        result += '</ul>';
    }
    
    return result;
}

// Sequence management
function addSequenceMessage() {
    const messageTemplate = `
        <div class="sequence-message">
            <div class="sequence-message-header">
                <h4>Message</h4>
                <button type="button" class="remove-message">✕</button>
            </div>
            <div class="sequence-message-form">
                <div class="form-row">
                    <div class="form-group">
                        <label>CAN ID (hex):</label>
                        <input type="text" class="seq-can-id" placeholder="e.g., 123" value="123" required>
                        <div class="checkbox-group">
                            <input type="checkbox" class="seq-extended-id">
                            <label>Extended ID</label>
                        </div>
                    </div>
                    <div class="form-group">
                        <label>Delay (ms):</label>
                        <input type="number" class="seq-delay" value="100" min="0" max="10000">
                    </div>
                </div>
                <div class="form-group">
                    <label>Data Bytes (hex):</label>
                    <div class="byte-inputs">
                        <input type="text" class="seq-byte-input" maxlength="2" value="00">
                        <input type="text" class="seq-byte-input" maxlength="2" value="00">
                        <input type="text" class="seq-byte-input" maxlength="2" value="00">
                        <input type="text" class="seq-byte-input" maxlength="2" value="00">
                        <input type="text" class="seq-byte-input" maxlength="2" value="00">
                        <input type="text" class="seq-byte-input" maxlength="2" value="00">
                        <input type="text" class="seq-byte-input" maxlength="2" value="00">
                        <input type="text" class="seq-byte-input" maxlength="2" value="00">
                    </div>
                </div>
                <div class="form-group quick-input">
                    <label>ASCII:</label>
                    <input type="text" class="seq-ascii-input" placeholder="ASCII text">
                    <button type="button" class="apply-seq-ascii">Apply</button>
                </div>
            </div>
        </div>
    `;
    
    const container = document.createElement('div');
    container.innerHTML = messageTemplate;
    sequenceMessagesContainer.appendChild(container.firstElementChild);
    
    // Add event listeners for the new message
    const newMessage = sequenceMessagesContainer.lastElementChild;
    
    // Remove button
    newMessage.querySelector('.remove-message').addEventListener('click', function() {
        this.closest('.sequence-message').remove();
    });
    
    // ASCII conversion
    const asciiButton = newMessage.querySelector('.apply-seq-ascii');
    asciiButton.addEventListener('click', function() {
        const asciiInput = this.closest('.quick-input').querySelector('.seq-ascii-input');
        const byteInputs = this.closest('.sequence-message').querySelectorAll('.seq-byte-input');
        
        const text = asciiInput.value;
        
        // Clear existing inputs
        byteInputs.forEach(input => {
            input.value = '00';
        });
        
        // Set the ASCII values
        for (let i = 0; i < text.length && i < byteInputs.length; i++) {
            const charCode = text.charCodeAt(i);
            byteInputs[i].value = charCode.toString(16).toUpperCase().padStart(2, '0');
        }
    });
    
    // Two-way ASCII conversion for sequence message
    newMessage.querySelectorAll('.seq-byte-input').forEach(input => {
        input.addEventListener('change', function() {
            const messageElement = this.closest('.sequence-message');
            const byteInputs = messageElement.querySelectorAll('.seq-byte-input');
            const asciiInput = messageElement.querySelector('.seq-ascii-input');
            
            let asciiText = '';
            for (let i = 0; i < byteInputs.length; i++) {
                const byteValue = byteInputs[i].value.trim();
                if (byteValue && /^[0-9a-fA-F]{1,2}$/.test(byteValue)) {
                    const charCode = parseInt(byteValue, 16);
                    asciiText += (charCode >= 32 && charCode <= 126) ? String.fromCharCode(charCode) : '.';
                } else {
                    asciiText += '.';
                }
            }
            
            asciiInput.value = asciiText;
        });
    });
}

// Add initial sequence message if element exists
if (addSequenceMessageBtn) {
    addSequenceMessageBtn.addEventListener('click', addSequenceMessage);
}

// Send sequence
if (sequenceForm) {
    sequenceForm.addEventListener('submit', (e) => {
        e.preventDefault();
        
        const messages = [];
        const delays = [];
        const messageElements = sequenceMessagesContainer.querySelectorAll('.sequence-message');
        
        if (messageElements.length === 0) {
            showNotification('Add at least one message to the sequence', 'error');
            return;
        }
        
        messageElements.forEach((msgElement) => {
            const id = msgElement.querySelector('.seq-can-id').value.trim();
            const extended = msgElement.querySelector('.seq-extended-id').checked;
            const delay = parseInt(msgElement.querySelector('.seq-delay').value);
            
            if (!id || !/^[0-9a-fA-F]+$/.test(id)) {
                showNotification('Please enter a valid hexadecimal CAN ID', 'error');
                return;
            }
            
            const dataBytes = [];
            const byteInputs = msgElement.querySelectorAll('.seq-byte-input');
            
            for (let i = 0; i < byteInputs.length; i++) {
                const byteValue = byteInputs[i].value.trim();
                if (!byteValue || !/^[0-9a-fA-F]{1,2}$/.test(byteValue)) {
                    showNotification(`Please enter a valid hexadecimal value for byte ${i+1}`, 'error');
                    return;
                }
                dataBytes.push(parseInt(byteValue, 16));
            }
            
            messages.push({
                id: id,
                data: dataBytes,
                extended: extended
            });
            
            delays.push(delay);
        });
        
        // Send the sequence
        socket.emit('send-sequence', {
            messages: messages,
            delays: delays
        });
        
        // Highlight the form to show it was sent
        sequenceForm.classList.add('message-sent');
        setTimeout(() => {
            sequenceForm.classList.remove('message-sent');
        }, 300);
    });
}

// Save sequence button
if (saveSequenceBtn) {
    saveSequenceBtn.addEventListener('click', () => {
        const name = sequenceNameInput.value.trim();
        if (!name) {
            showNotification('Please enter a name for the sequence', 'error');
            return;
        }
        
        const messages = [];
        const delays = [];
        const messageElements = sequenceMessagesContainer.querySelectorAll('.sequence-message');
        
        if (messageElements.length === 0) {
            showNotification('Add at least one message to the sequence', 'error');
            return;
        }
        
        messageElements.forEach((msgElement) => {
            const id = msgElement.querySelector('.seq-can-id').value.trim();
            const extended = msgElement.querySelector('.seq-extended-id').checked;
            const delay = parseInt(msgElement.querySelector('.seq-delay').value);
            
            if (!id || !/^[0-9a-fA-F]+$/.test(id)) {
                showNotification('Please enter a valid hexadecimal CAN ID', 'error');
                return;
            }
            
            const dataBytes = [];
            const byteInputs = msgElement.querySelectorAll('.seq-byte-input');
            
            for (let i = 0; i < byteInputs.length; i++) {
                const byteValue = byteInputs[i].value.trim();
                if (!byteValue || !/^[0-9a-fA-F]{1,2}$/.test(byteValue)) {
                    showNotification(`Please enter a valid hexadecimal value for byte ${i+1}`, 'error');
                    return;
                }
                dataBytes.push(parseInt(byteValue, 16));
            }
            
            messages.push({
                id: id,
                data: dataBytes,
                extended: extended
            });
            
            delays.push(delay);
        });
        
        // Save the sequence
        socket.emit('save-pattern', {
            name: name,
            messages: messages,
            delays: delays
        });
        
        currentSequenceName = name;
    });
}

// Load sequence button
if (loadSequenceBtn) {
    loadSequenceBtn.addEventListener('click', () => {
        // Show saved sequences tab
        document.querySelector('.tab-button[data-tab="sequence-tab"]').click();
        // Focus on the sequences list
        const savedSequencesSection = document.querySelector('.saved-sequences');
        if (savedSequencesSection) {
            savedSequencesSection.scrollIntoView({ behavior: 'smooth' });
        }
        showNotification('Click on a sequence to load it', 'info');
    });
}

// Update sequence list
function updateSequenceList(patterns) {
    if (!sequenceListContainer) return;
    
    sequenceListContainer.innerHTML = '';
    
    if (!patterns || patterns.length === 0) {
        sequenceListContainer.innerHTML = '<p>No saved sequences</p>';
        return;
    }
    
    patterns.forEach(pattern => {
        const patternElement = document.createElement('div');
        patternElement.className = 'sequence-item';
        patternElement.innerHTML = `
            <span>${pattern}</span>
            <div class="sequence-item-actions">
                <button class="load-pattern" data-name="${pattern}">Load</button>
                <button class="delete-pattern" data-name="${pattern}">Delete</button>
            </div>
        `;
        
        sequenceListContainer.appendChild(patternElement);
    });
    
    // Add event listeners
    document.querySelectorAll('.load-pattern').forEach(button => {
        button.addEventListener('click', () => {
            const name = button.dataset.name;
            socket.emit('get-pattern', name);
        });
    });
    
    document.querySelectorAll('.delete-pattern').forEach(button => {
        button.addEventListener('click', () => {
            const name = button.dataset.name;
            if (confirm(`Are you sure you want to delete sequence "${name}"?`)) {
                socket.emit('delete-pattern', name);
            }
        });
    });
}

// Load sequence to form
function loadSequenceToForm(pattern) {
    if (!sequenceMessagesContainer || !sequenceNameInput) return;
    
    // Clear existing messages
    sequenceMessagesContainer.innerHTML = '';
    
    // Set the name
    sequenceNameInput.value = pattern.name;
    currentSequenceName = pattern.name;
    
    // Add each message
    pattern.messages.forEach((msg, index) => {
        addSequenceMessage();
        
        const messageElement = sequenceMessagesContainer.lastElementChild;
        messageElement.querySelector('.seq-can-id').value = msg.id;
        messageElement.querySelector('.seq-extended-id').checked = msg.extended;
        messageElement.querySelector('.seq-delay').value = pattern.delays[index] || 100;
        
        const byteInputs = messageElement.querySelectorAll('.seq-byte-input');
        
        msg.data.forEach((byte, byteIndex) => {
            if (byteIndex < byteInputs.length) {
                byteInputs[byteIndex].value = byte.toString(16).toUpperCase().padStart(2, '0');
            }
        });
        
        // Update ASCII representation
        let asciiText = '';
        msg.data.forEach(byte => {
            asciiText += (byte >= 32 && byte <= 126) ? String.fromCharCode(byte) : '.';
        });
        
        messageElement.querySelector('.seq-ascii-input').value = asciiText;
    });
    
    showNotification(`Loaded sequence "${pattern.name}"`, 'success');
}

// Replay functionality
if (startReplayBtn) {
    startReplayBtn.addEventListener('click', () => {
        const count = parseInt(replayCountInput.value);
        const speed = parseFloat(replaySpeedInput.value);
        
        if (isNaN(count) || count < 1) {
            showNotification('Please enter a valid replay count', 'error');
            return;
        }
        
        if (isNaN(speed) || speed <= 0) {
            showNotification('Please enter a valid replay speed', 'error');
            return;
        }
        
        socket.emit('replay-messages', {
            count: count,
            speed: speed
        });
    });
}

// Initialize byte inputs
updateByteInputs();

// Initialize tabs
setupTabs();

// Add an initial sequence message if the container exists
if (sequenceMessagesContainer && sequenceMessagesContainer.children.length === 0) {
    addSequenceMessage();
}

// Handle keyboard shortcuts
document.addEventListener('keydown', (e) => {
    // Ctrl+Enter to send message when in send form
    if (e.ctrlKey && e.key === 'Enter' && activeTab === 'send-tab') {
        if (document.activeElement.closest('#send-form')) {
            e.preventDefault();
            sendForm.querySelector('button[type="submit"]').click();
        }
    }
    
    // Ctrl+L to clear log
    if (e.ctrlKey && e.key === 'l') {
        e.preventDefault();
        if (clearLogBtn) clearLogBtn.click();
    }
    
    // Escape to clear filter
    if (e.key === 'Escape' && activeFilter) {
        e.preventDefault();
        if (clearFilterBtn) clearFilterBtn.click();
    }
});

// Warn about missing SocketCAN support in browser (this is just for user info)
// In a real implementation, the server handles the SocketCAN interface
if (!window.location.hostname.includes('localhost') && !window.location.hostname.includes('127.0.0.1')) {
    showNotification('Warning: This application requires direct access to CAN hardware and should be run on the device connected to the CAN bus.', 'warning', 8000);
}
