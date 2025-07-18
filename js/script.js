// DOM Elements
const connectBtn = document.getElementById('connectBtn');
const disconnectBtn = document.getElementById('disconnectBtn');
const connectionStatus = document.getElementById('connectionStatus');
const yellowFlagBtn = document.getElementById('yellowFlagBtn');
const clearYellowFlagBtn = document.getElementById('clearYellowFlagBtn');
const redFlagBtn = document.getElementById('redFlagBtn');
const clearRedFlagBtn = document.getElementById('clearRedFlagBtn');
const safetyCarBtn = document.getElementById('safetyCarBtn');
const clearSafetyCarBtn = document.getElementById('clearSafetyCarBtn');
const vscBtn = document.getElementById('vscBtn');
const clearVscBtn = document.getElementById('clearVscBtn');
const messageInput = document.getElementById('messageInput');
const sendMessageBtn = document.getElementById('sendMessageBtn');
const raceStatus = document.getElementById('raceStatus');

// WebSocket
let socket;

// Function to generate a random delay between 2000ms (2s) and 4000ms (4s)
function getRandomDelay() {
    return Math.floor(Math.random() * (4000 - 2000 + 1)) + 2000;
}

// Check if the current page is nosteward.html
const isNoStewardPage = window.location.pathname.includes('nosteward.html');

// WebSocket Connection
connectBtn.addEventListener('click', () => {
    socket = new WebSocket('wss://your-websocket-url'); // Replace with your WebSocket URL
    socket.onopen = () => {
        connectionStatus.textContent = 'Connected';
        connectionStatus.style.color = 'green';
        connectBtn.disabled = true;
        disconnectBtn.disabled = false;
    };
    socket.onclose = () => {
        connectionStatus.textContent = 'Disconnected';
        connectionStatus.style.color = 'red';
        connectBtn.disabled = false;
        disconnectBtn.disabled = true;
    };
    socket.onerror = (error) => {
        console.error('WebSocket Error:', error);
        connectionStatus.textContent = 'Error';
        connectionStatus.style.color = 'red';
    };
    socket.onmessage = (event) => {
        const data = JSON.parse(event.data);
        if (data.type === 'statusUpdate') {
            raceStatus.textContent = `Race Status: ${data.status}`;
        }
    };
});

disconnectBtn.addEventListener('click', () => {
    if (socket) {
        socket.close();
    }
});

// Flag Controls
yellowFlagBtn.addEventListener('click', () => {
    if (socket && socket.readyState === WebSocket.OPEN) {
        socket.send(JSON.stringify({ type: 'yellowFlag' }));
        raceStatus.textContent = 'Race Status: Yellow Flag';
    } else {
        alert('Not connected to server');
    }
});

clearYellowFlagBtn.addEventListener('click', () => {
    if (socket && socket.readyState === WebSocket.OPEN) {
        if (isNoStewardPage) {
            const delay = getRandomDelay();
            setTimeout(() => {
                socket.send(JSON.stringify({ type: 'clearYellowFlag' }));
                raceStatus.textContent = 'Race Status: Green';
            }, delay);
        } else {
            socket.send(JSON.stringify({ type: 'clearYellowFlag' }));
            raceStatus.textContent = 'Race Status: Green';
        }
    } else {
        alert('Not connected to server');
    }
});

redFlagBtn.addEventListener('click', () => {
    if (socket && socket.readyState === WebSocket.OPEN) {
        socket.send(JSON.stringify({ type: 'redFlag' }));
        raceStatus.textContent = 'Race Status: Red Flag';
    } else {
        alert('Not connected to server');
    }
});

clearRedFlagBtn.addEventListener('click', () => {
    if (socket && socket.readyState === WebSocket.OPEN) {
        if (isNoStewardPage) {
            const delay = getRandomDelay();
            setTimeout(() => {
                socket.send(JSON.stringify({ type: 'clearRedFlag' }));
                raceStatus.textContent = 'Race Status: Green';
            }, delay);
        } else {
            socket.send(JSON.stringify({ type: 'clearRedFlag' }));
            raceStatus.textContent = 'Race Status: Green';
        }
    } else {
        alert('Not connected to server');
    }
});

safetyCarBtn.addEventListener('click', () => {
    if (socket && socket.readyState === WebSocket.OPEN) {
        socket.send(JSON.stringify({ type: 'safetyCar' }));
        raceStatus.textContent = 'Race Status: Safety Car';
    } else {
        alert('Not connected to server');
    }
});

clearSafetyCarBtn.addEventListener('click', () => {
    if (socket && socket.readyState === WebSocket.OPEN) {
        socket.send(JSON.stringify({ type: 'clearSafetyCar' }));
        raceStatus.textContent = 'Race Status: Green';
    } else {
        alert('Not connected to server');
    }
});

vscBtn.addEventListener('click', () => {
    if (socket && socket.readyState === WebSocket.OPEN) {
        socket.send(JSON.stringify({ type: 'vsc' }));
        raceStatus.textContent = 'Race Status: Virtual Safety Car';
    } else {
        alert('Not connected to server');
    }
});

clearVscBtn.addEventListener('click', () => {
    if (socket && socket.readyState === WebSocket.OPEN) {
        socket.send(JSON.stringify({ type: 'clearVsc' }));
        raceStatus.textContent = 'Race Status: Green';
    } else {
        alert('Not connected to server');
    }
});

// Send Custom Message
sendMessageBtn.addEventListener('click', () => {
    const message = messageInput.value.trim();
    if (message && socket && socket.readyState === WebSocket.OPEN) {
        socket.send(JSON.stringify({ type: 'message', content: message }));
        messageInput.value = '';
    } else if (!message) {
        alert('Please enter a message');
    } else {
        alert('Not connected to server');
    }
});