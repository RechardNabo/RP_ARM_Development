const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const can = require('socketcan');
const fs = require('fs');
const path = require('path');

// Create Express app
const app = express();
const server = http.createServer(app);
const io = socketIo(server);

// Serve static files from 'public' directory
app.use(express.static('public'));
app.use(express.json());

// Configuration
const CAN_INTERFACE = "can0";
const PORT = 3020;
const LOG_DIRECTORY = path.join(__dirname, 'logs');

// Ensure log directory exists
if (!fs.existsSync(LOG_DIRECTORY)) {
  fs.mkdirSync(LOG_DIRECTORY, { recursive: true });
}

// Initialize CAN channel
let canChannel;
try {
  // Create a raw channel using the proper method
  canChannel = can.createRawChannel(CAN_INTERFACE, true);
  console.log(`Successfully connected to ${CAN_INTERFACE}`);
} catch (error) {
  console.error(`Failed to bind to ${CAN_INTERFACE}:`, error);
  process.exit(1);
}

// Function to get formatted timestamp
function getTimestamp() {
  const now = new Date();
  return now.toTimeString().split(' ')[0];
}

// Function to get formatted date for filenames
function getFormattedDate() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
}

// Message cache for replay functionality
let messageCache = [];
const MAX_CACHE_SIZE = 1000;

// Store known message patterns
let knownPatterns = {};
try {
  if (fs.existsSync(path.join(__dirname, 'patterns.json'))) {
    knownPatterns = JSON.parse(fs.readFileSync(path.join(__dirname, 'patterns.json'), 'utf8'));
  }
} catch (error) {
  console.error('Error loading patterns:', error);
  knownPatterns = {};
}

// Statistics
let stats = {
  messagesSent: 0,
  messagesReceived: 0,
  startTime: Date.now(),
  busLoad: 0,
  errorFrames: 0,
  peakLoad: 0
};

// Current logging state
let loggingActive = false;
let logStream = null;
let logFileName = '';

// Start logging to file
function startLogging() {
  if (loggingActive) return;
  
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  logFileName = path.join(LOG_DIRECTORY, `can-log-${timestamp}.csv`);
  
  logStream = fs.createWriteStream(logFileName);
  logStream.write('Timestamp,Direction,ID,DLC,Data,Hex,ASCII,Analysis\n');
  loggingActive = true;
  
  return logFileName;
}

// Stop logging to file
function stopLogging() {
  if (!loggingActive) return null;
  
  logStream.end();
  logStream = null;
  loggingActive = false;
  
  return logFileName;
}

// Log message to file
function logMessageToFile(message) {
  if (!loggingActive || !logStream) return;
  
  const analysis = message.analysis ? JSON.stringify(message.analysis).replace(/,/g, ';') : 'N/A';
  const line = `${message.timestamp},${message.direction},${message.id},${message.data.length},"${message.hex}","${message.ascii}",${analysis}\n`;
  
  logStream.write(line);
}

// Bus utilization calculation (simplified)
let messageCountInLastSecond = 0;
setInterval(() => {
  stats.busLoad = messageCountInLastSecond / 10; // Simplified calculation, real CAN bus max ~1000 msgs/sec
  if (stats.busLoad > stats.peakLoad) {
    stats.peakLoad = stats.busLoad;
  }
  messageCountInLastSecond = 0;
  io.emit('stats', stats);
}, 1000);

// Socket.IO connection handling
io.on('connection', (socket) => {
  console.log(`[${getTimestamp()}] Client connected`);
  
  // Send current statistics to newly connected client
  socket.emit('stats', stats);
  socket.emit('logging-status', { active: loggingActive, fileName: logFileName });
  socket.emit('known-patterns', Object.keys(knownPatterns));
  
  // Handle CAN message transmission requests from client
  socket.on('send-can-message', (message) => {
    try {
      const canMessage = {
        id: parseInt(message.id, 16),
        data: Buffer.from(message.data),
        ext: message.extended || false
      };
      
      canChannel.send(canMessage);
      stats.messagesSent++;
      
      // Log the sent message
      const logMessage = {
        timestamp: getTimestamp(),
        direction: 'TX',
        id: '0x' + canMessage.id.toString(16).toUpperCase().padStart(3, '0'),
        data: message.data,
        hex: [...Buffer.from(message.data)].map(b => b.toString(16).toUpperCase().padStart(2, '0')).join(' '),
        ascii: [...Buffer.from(message.data)].map(b => (b >= 32 && b <= 126) ? String.fromCharCode(b) : '.').join(''),
        decimal: [...Buffer.from(message.data)].map(b => b.toString().padStart(3, ' ')).join(' ')
      };
      
      // Add to message cache
      messageCache.push(logMessage);
      if (messageCache.length > MAX_CACHE_SIZE) {
        messageCache.shift();
      }
      
      // Log to file if active
      logMessageToFile(logMessage);
      
      // Broadcast the sent message to all clients
      io.emit('can-message', logMessage);
      io.emit('stats', stats);
      
    } catch (error) {
      console.error(`[${getTimestamp()}] Error sending CAN message:`, error);
      socket.emit('error', { message: 'Failed to send CAN message: ' + error.message });
    }
  });
  
  // Handle sequence transmission
  socket.on('send-sequence', (sequence) => {
    try {
      let delayCounter = 0;
      
      sequence.messages.forEach((msg, index) => {
        delayCounter += sequence.delays[index] || 0;
        
        setTimeout(() => {
          const canMessage = {
            id: parseInt(msg.id, 16),
            data: Buffer.from(msg.data),
            ext: msg.extended || false
          };
          
          canChannel.send(canMessage);
          stats.messagesSent++;
          
          // Log the sent message
          const logMessage = {
            timestamp: getTimestamp(),
            direction: 'TX',
            id: '0x' + canMessage.id.toString(16).toUpperCase().padStart(3, '0'),
            data: msg.data,
            hex: [...Buffer.from(msg.data)].map(b => b.toString(16).toUpperCase().padStart(2, '0')).join(' '),
            ascii: [...Buffer.from(msg.data)].map(b => (b >= 32 && b <= 126) ? String.fromCharCode(b) : '.').join(''),
            decimal: [...Buffer.from(msg.data)].map(b => b.toString().padStart(3, ' ')).join(' ')
          };
          
          // Add to message cache
          messageCache.push(logMessage);
          if (messageCache.length > MAX_CACHE_SIZE) {
            messageCache.shift();
          }
          
          // Log to file if active
          logMessageToFile(logMessage);
          
          // Broadcast the sent message to all clients
          io.emit('can-message', logMessage);
          io.emit('stats', stats);
        }, delayCounter);
      });
      
      socket.emit('sequence-started', { count: sequence.messages.length });
    } catch (error) {
      console.error(`[${getTimestamp()}] Error sending sequence:`, error);
      socket.emit('error', { message: 'Failed to send sequence: ' + error.message });
    }
  });
  
  // Replay cached messages
  socket.on('replay-messages', (options) => {
    try {
      const { count, speed } = options;
      const messagesToReplay = messageCache.slice(-count);
      const speedFactor = speed || 1;
      
      socket.emit('replay-started', { count: messagesToReplay.length });
      
      messagesToReplay.forEach((msg, index) => {
        setTimeout(() => {
          // Skip if it's not a TX message (we only replay what was sent before)
          if (msg.direction !== 'TX') return;
          
          const canMessage = {
            id: parseInt(msg.id.substring(2), 16),
            data: Buffer.from(msg.data),
            ext: msg.id.length > 5 // Simple heuristic for extended IDs
          };
          
          canChannel.send(canMessage);
          stats.messagesSent++;
          
          // Create a new log message
          const logMessage = {
            ...msg,
            timestamp: getTimestamp(),
            note: 'Replayed'
          };
          
          // Add to message cache
          messageCache.push(logMessage);
          if (messageCache.length > MAX_CACHE_SIZE) {
            messageCache.shift();
          }
          
          // Log to file if active
          logMessageToFile(logMessage);
          
          // Broadcast the message
          io.emit('can-message', logMessage);
          io.emit('stats', stats);
        }, index * (100 / speedFactor)); // Basic timing, adjust as needed
      });
    } catch (error) {
      console.error(`[${getTimestamp()}] Error replaying messages:`, error);
      socket.emit('error', { message: 'Failed to replay messages: ' + error.message });
    }
  });
  
  // Logging controls
  socket.on('start-logging', () => {
    const fileName = startLogging();
    io.emit('logging-status', { active: true, fileName });
    socket.emit('notify', { type: 'success', message: `Logging started: ${path.basename(fileName)}` });
  });
  
  socket.on('stop-logging', () => {
    const fileName = stopLogging();
    io.emit('logging-status', { active: false, fileName: null });
    if (fileName) {
      socket.emit('notify', { type: 'success', message: `Logging stopped: ${path.basename(fileName)}` });
    }
  });
  
  // Get available logs
  socket.on('get-logs', () => {
    try {
      const files = fs.readdirSync(LOG_DIRECTORY)
        .filter(file => file.endsWith('.csv'))
        .map(file => ({
          name: file,
          path: path.join(LOG_DIRECTORY, file),
          size: fs.statSync(path.join(LOG_DIRECTORY, file)).size,
          date: fs.statSync(path.join(LOG_DIRECTORY, file)).mtime
        }))
        .sort((a, b) => b.date - a.date);
      
      socket.emit('available-logs', files);
    } catch (error) {
      console.error('Error reading logs directory:', error);
      socket.emit('error', { message: 'Failed to read logs: ' + error.message });
    }
  });
  
  // Delete log file
  socket.on('delete-log', (filename) => {
    try {
      const filePath = path.join(LOG_DIRECTORY, filename);
      
      // Security check - make sure it's a CSV file in our logs directory
      if (!filename.endsWith('.csv') || path.dirname(filePath) !== LOG_DIRECTORY) {
        throw new Error('Invalid file path');
      }
      
      fs.unlinkSync(filePath);
      socket.emit('log-deleted', filename);
      socket.emit('notify', { type: 'success', message: `Log file ${filename} deleted` });
    } catch (error) {
      console.error('Error deleting log file:', error);
      socket.emit('error', { message: 'Failed to delete log file: ' + error.message });
    }
  });
  
  // Download log file route
  app.get('/logs/:filename', (req, res) => {
    const fileName = req.params.filename;
    const filePath = path.join(LOG_DIRECTORY, fileName);
    
    // Security check
    if (!fileName.endsWith('.csv') || path.dirname(filePath) !== LOG_DIRECTORY) {
      return res.status(400).send('Invalid file path');
    }
    
    if (fs.existsSync(filePath)) {
      res.download(filePath);
    } else {
      res.status(404).send('Log file not found');
    }
  });
  
  // Pattern management
  socket.on('save-pattern', (pattern) => {
    try {
      knownPatterns[pattern.name] = pattern;
      fs.writeFileSync(path.join(__dirname, 'patterns.json'), JSON.stringify(knownPatterns, null, 2));
      io.emit('known-patterns', Object.keys(knownPatterns));
      socket.emit('notify', { type: 'success', message: `Pattern "${pattern.name}" saved` });
    } catch (error) {
      console.error('Error saving pattern:', error);
      socket.emit('error', { message: 'Failed to save pattern: ' + error.message });
    }
  });
  
  socket.on('get-pattern', (patternName) => {
    const pattern = knownPatterns[patternName];
    if (pattern) {
      socket.emit('pattern-data', pattern);
    } else {
      socket.emit('error', { message: `Pattern "${patternName}" not found` });
    }
  });
  
  socket.on('delete-pattern', (patternName) => {
    if (knownPatterns[patternName]) {
      delete knownPatterns[patternName];
      fs.writeFileSync(path.join(__dirname, 'patterns.json'), JSON.stringify(knownPatterns, null, 2));
      io.emit('known-patterns', Object.keys(knownPatterns));
      socket.emit('notify', { type: 'success', message: `Pattern "${patternName}" deleted` });
    } else {
      socket.emit('error', { message: `Pattern "${patternName}" not found` });
    }
  });
  
  socket.on('disconnect', () => {
    console.log(`[${getTimestamp()}] Client disconnected`);
  });
});

// Listen for CAN messages
canChannel.addListener('onMessage', (msg) => {
  try {
    stats.messagesReceived++;
    messageCountInLastSecond++;
    
    // Convert the data buffer to arrays for display
    const dataBuffer = Buffer.from(msg.data);
    const hexData = [...dataBuffer].map(b => b.toString(16).toUpperCase().padStart(2, '0')).join(' ');
    const asciiData = [...dataBuffer].map(b => (b >= 32 && b <= 126) ? String.fromCharCode(b) : '.').join('');
    const decimalData = [...dataBuffer].map(b => b.toString().padStart(3, ' ')).join(' ');
    
    // Format the received message
    const logMessage = {
      timestamp: getTimestamp(),
      direction: 'RX',
      id: '0x' + msg.id.toString(16).toUpperCase().padStart(3, '0'),
      data: [...dataBuffer],
      hex: hexData,
      ascii: asciiData,
      decimal: decimalData
    };
    
    // Add analysis based on the ID
    logMessage.analysis = analyzeCanMessage(msg);
    
    // Add to message cache for possible later replay
    messageCache.push(logMessage);
    if (messageCache.length > MAX_CACHE_SIZE) {
      messageCache.shift();
    }
    
    // Log to file if active
    logMessageToFile(logMessage);
    
    // Broadcast the received message to all clients
    io.emit('can-message', logMessage);
    io.emit('stats', stats);
  } catch (error) {
    console.error(`[${getTimestamp()}] Error processing CAN message:`, error);
    stats.errorFrames++;
  }
});

// Function to analyze CAN messages based on their ID
function analyzeCanMessage(msg) {
  const analysis = {
    messageType: 'Unknown',
    details: {}
  };
  
  // Extended message analysis based on common automotive standards
  switch (msg.id) {
    case 0x7DF: // OBD-II request
      analysis.messageType = 'OBD-II Request';
      if (msg.data.length >= 2) {
        const service = msg.data[1];
        analysis.details.service = `0x${service.toString(16).toUpperCase()}`;
        switch (service) {
          case 0x01:
            analysis.details.description = 'Show current data';
            break;
          case 0x03:
            analysis.details.description = 'Show stored DTCs';
            break;
          case 0x04:
            analysis.details.description = 'Clear DTCs';
            break;
          case 0x09:
            analysis.details.description = 'Request vehicle info';
            break;
        }
      }
      break;
      
    case 0x7E8: // OBD-II response (ECU #1)
    case 0x7E9: // OBD-II response (ECU #2)
    case 0x7EA: // OBD-II response (ECU #3)
    case 0x7EB: // OBD-II response (ECU #4)
      analysis.messageType = `OBD-II Response (ECU #${msg.id - 0x7E7})`;
      if (msg.data.length >= 3) {
        const service = msg.data[1];
        analysis.details.service = `0x${service.toString(16).toUpperCase()}`;
        const pid = msg.data[2];
        analysis.details.pid = `0x${pid.toString(16).toUpperCase()}`;
        
        // Analyze common PIDs
        if (service === 0x41) { // Service 01 response
          switch (pid) {
            case 0x0C: // RPM
              if (msg.data.length >= 4) {
                const rpm = ((msg.data[3] * 256) + msg.data[4]) / 4;
                analysis.details.value = `${rpm} RPM`;
              }
              break;
            case 0x0D: // Speed
              if (msg.data.length >= 3) {
                analysis.details.value = `${msg.data[3]} km/h`;
              }
              break;
            case 0x05: // Coolant temperature
              if (msg.data.length >= 3) {
                analysis.details.value = `${msg.data[3] - 40}°C`;
              }
              break;
          }
        }
      }
      break;
      
    case 0x123:
      analysis.messageType = 'Standard test message';
      if (msg.data.length >= 8) {
        analysis.details.counterValue = msg.data[7];
      }
      break;
      
    case 0x100:
      analysis.messageType = 'Sensor data';
      if (msg.data.length >= 2) {
        analysis.details.sensorValue = (msg.data[0] << 8) | msg.data[1];
      }
      break;
      
    default:
      // Check if it's in the range of standard J1939 PGNs
      if (msg.id > 0x0FFF0000 && msg.ext) { // Extended CAN ID for J1939
        const pgn = (msg.id >> 8) & 0x1FFFF;
        const sourceAddress = msg.id & 0xFF;
        
        analysis.messageType = `J1939 Message`;
        analysis.details.pgn = `0x${pgn.toString(16).toUpperCase()}`;
        analysis.details.sourceAddress = `0x${sourceAddress.toString(16).toUpperCase()}`;
        
        // Add common PGN descriptions
        switch (pgn) {
          case 0xF004:
            analysis.details.description = 'Electronic Engine Controller 1';
            break;
          case 0xFEF1:
            analysis.details.description = 'Cruise Control/Vehicle Speed';
            break;
        }
      } else {
        analysis.messageType = `Unknown (ID: 0x${msg.id.toString(16).toUpperCase()})`;
      }
  }
  
  return analysis;
}

// Start the channel
canChannel.start();

// Start the server
server.listen(PORT, () => {
  console.log(`[${getTimestamp()}] CAN Web Interface running on http://localhost:${PORT}`);
  console.log(`[${getTimestamp()}] Monitoring CAN interface: ${CAN_INTERFACE}`);
});

// Handle process termination
process.on('SIGINT', () => {
  console.log(`[${getTimestamp()}] Stopping CAN channel and closing server...`);
  if (loggingActive) {
    stopLogging();
  }
  if (canChannel) {
    canChannel.stop();
  }
  server.close(() => {
    process.exit(0);
  });
});
