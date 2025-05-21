const express = require("express")
const http = require("http")
const path = require("path")
const { exec } = require("child_process")
const mongoose = require("mongoose")
const session = require("express-session")
const bcrypt = require("bcrypt")
const mqtt = require("mqtt")
const WebSocket = require("ws")
const bodyParser = require("body-parser")
const fs = require("fs")

// Initialize Express app
const app = express()
const server = http.createServer(app)
const wss = new WebSocket.Server({ server })

// Middleware
app.use(express.static(path.join(__dirname, "public")))
app.use(bodyParser.json())
app.use(bodyParser.urlencoded({ extended: true }))
app.use(
  session({
    secret: "rpi-monitor-secret-key",
    resave: false,
    saveUninitialized: true,
    cookie: { secure: false, maxAge: 3600000 }, // 1 hour
  }),
)

// Default user credentials (in production, use environment variables or a secure database)
const DEFAULT_USERS = [
  {
    username: "admin",
    // Hashed password for 'admin123'
    passwordHash: "$2b$10$XJrS7/6QGC.XzYCtFnJRg.4Xt8XqGBYYIQH0X.oTVUVT8s9EiVxIK",
  },
]

// MongoDB Connection
mongoose
  .connect("mongodb://localhost:27017/deviceMonitor")
  .then(() => {
    console.log("Connected to MongoDB")
  })
  .catch((err) => {
    console.error("MongoDB connection error:", err)
  })

// InfluxDB v2.x Connection
const { InfluxDB, Point } = require("@influxdata/influxdb-client")
const { OrgsAPI, BucketsAPI } = require("@influxdata/influxdb-client-apis")

// InfluxDB v2 connection details
const influxUrl = "http://localhost:8086"
const influxToken = "GdIULJiH-GoFQbWgLvaCxXQJ3N1gcjynEObB5aAfwk6kHjf6s-ayVxCXWMN-2hM3N0atSxDy4J99FBj_YdSzVA=="
const influxOrgId = "13d05bde442bdf3e" // Using your exact organization ID
const influxBucket = "device_metrics" // This replaces the database concept

// Create InfluxDB client
const influxClient = new InfluxDB({ url: influxUrl, token: influxToken })
const writeApi = influxClient.getWriteApi(influxOrgId, influxBucket, "ns")
const queryApi = influxClient.getQueryApi(influxOrgId)

// Check if bucket exists and create if needed
async function setupInfluxDB() {
  try {
    const bucketsAPI = new BucketsAPI(influxClient)
    const buckets = await bucketsAPI.getBuckets({ orgID: influxOrgId })

    let bucketExists = false
    if (buckets && buckets.buckets) {
      bucketExists = buckets.buckets.some((b) => b.name === influxBucket)
    }

    if (!bucketExists) {
      await bucketsAPI.postBuckets({ body: { orgID: influxOrgId, name: influxBucket } })
    }

    console.log("InfluxDB setup complete")
  } catch (err) {
    console.error("InfluxDB setup error:", err)
  }
}

setupInfluxDB()

// Function to write data to InfluxDB
function writeToInflux(deviceId, protocol, dataType, value) {
  const point = new Point("device_data")
    .tag("deviceId", deviceId)
    .tag("protocol", protocol)
    .tag("dataType", dataType)
    .floatField("value", value)

  writeApi.writePoint(point)
  return writeApi.flush()
}

// Function to query data from InfluxDB
async function queryInflux(deviceId, start, end, limit = 100) {
  const fluxQuery = `
    from(bucket: "${influxBucket}")
    |> range(start: ${start || "-1h"}, stop: ${end || "now()"})
    |> filter(fn: (r) => r._measurement == "device_data")
    |> filter(fn: (r) => r.deviceId == "${deviceId}")
    |> sort(columns: ["_time"], desc: true)
    |> limit(n: ${limit})
  `

  return new Promise((resolve, reject) => {
    const results = []

    queryApi.queryRows(fluxQuery, {
      next(row, tableMeta) {
        const result = tableMeta.toObject(row)
        results.push(result)
      },
      error(error) {
        reject(error)
      },
      complete() {
        resolve(results)
      },
    })
  })
}

// MongoDB Models
const deviceSchema = new mongoose.Schema({
  name: String,
  protocol: String,
  address: String,
  port: Number,
  dataTypes: [String],
  dataSizes: [Number],
  config: Object,
  status: {
    type: String,
    enum: ["online", "offline", "warning", "error"],
    default: "offline",
  },
  lastSeen: Date,
  createdAt: {
    type: Date,
    default: Date.now,
  },
})

const serverConfigSchema = new mongoose.Schema({
  name: String,
  type: {
    type: String,
    enum: ["mongodb", "influxdb", "mqtt", "http"],
  },
  host: String,
  port: Number,
  username: String,
  password: String,
  database: String,
  topic: String, // For MQTT
  endpoint: String, // For HTTP API
  enabled: {
    type: Boolean,
    default: true,
  },
})

// User schema for authentication
const userSchema = new mongoose.Schema({
  username: String,
  passwordHash: String,
  isAdmin: Boolean,
})

const Device = mongoose.model("Device", deviceSchema)
const ServerConfig = mongoose.model("ServerConfig", serverConfigSchema)
const User = mongoose.model("User", userSchema)

// Authentication middleware
const authenticate = (req, res, next) => {
  if (req.session.authenticated) {
    return next()
  }
  res.status(401).json({ error: "Authentication required" })
}

// Routes
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"))
})

// Login route
app.post("/api/login", async (req, res) => {
  const { username, password } = req.body;

  try {
    // Read users from file
    let users = [];
    try {
      const usersData = fs.readFileSync('users.json', 'utf8');
      users = JSON.parse(usersData);
    } catch (err) {
      console.error('Error reading users file:', err);
      // If file doesn't exist, use default users
      users = DEFAULT_USERS;
    }

    // Find user
    const user = users.find(u => u.username === username);

    if (!user || !user.passwordHash) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    // Compare password
    const match = await bcrypt.compare(password, user.passwordHash);

    if (match) {
      req.session.authenticated = true;
      req.session.username = username;
      req.session.isAdmin = user.isAdmin || false;
      res.json({ success: true });
    } else {
      res.status(401).json({ error: "Invalid credentials" });
    }
  } catch (err) {
    console.error("Login error:", err);
    res.status(500).json({ error: "Server error" });
  }
})

// Logout route
app.post("/api/logout", (req, res) => {
  req.session.destroy()
  res.json({ success: true })
})

// Get system services status
app.get("/api/services", authenticate, (req, res) => {
  const services = ["mongod", "influxdb", "grafana-server", "nginx", "webmin"]
  const results = {}

  let pendingChecks = services.length

  services.forEach((service) => {
    exec(`systemctl is-active ${service}`, (error, stdout, stderr) => {
      results[service] = {
        status: stdout.trim(),
        error: stderr || null,
      }

      pendingChecks--
      if (pendingChecks === 0) {
        // Check interfaces
        checkInterfaces(results).then(() => {
          res.json(results)
        })
      }
    })
  })
})

// Check network interfaces
function checkInterfaces(results) {
  return new Promise((resolve) => {
    const interfaces = ["can0", "i2c-1", "spi0.0"]
    let pendingChecks = interfaces.length

    interfaces.forEach((iface) => {
      if (iface.startsWith("can")) {
        exec(`ifconfig ${iface}`, (error, stdout, stderr) => {
          results[iface] = {
            status: error ? "inactive" : "active",
            details: stdout || null,
            error: stderr || null,
          }
          checkDone()
        })
      } else if (iface.startsWith("i2c")) {
        exec("ls /dev/i2c*", (error, stdout, stderr) => {
          results["i2c"] = {
            status: error ? "inactive" : "active",
            details: stdout || null,
            error: stderr || null,
          }
          checkDone()
        })
      } else if (iface.startsWith("spi")) {
        exec("ls /dev/spidev*", (error, stdout, stderr) => {
          results["spi"] = {
            status: error ? "inactive" : "active",
            details: stdout || null,
            error: stderr || null,
          }
          checkDone()
        })
      } else {
        checkDone()
      }
    })

    function checkDone() {
      pendingChecks--
      if (pendingChecks === 0) {
        resolve()
      }
    }
  })
}

// Device routes
app.get("/api/devices", authenticate, async (req, res) => {
  try {
    const devices = await Device.find()
    res.json(devices)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

app.post("/api/devices", authenticate, async (req, res) => {
  try {
    const device = new Device(req.body)
    await device.save()
    res.status(201).json(device)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

app.get("/api/devices/:id", authenticate, async (req, res) => {
  try {
    const device = await Device.findById(req.params.id)
    if (!device) return res.status(404).json({ error: "Device not found" })
    res.json(device)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

app.put("/api/devices/:id", authenticate, async (req, res) => {
  try {
    const device = await Device.findByIdAndUpdate(req.params.id, req.body, { new: true })
    if (!device) return res.status(404).json({ error: "Device not found" })
    res.json(device)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

app.delete("/api/devices/:id", authenticate, async (req, res) => {
  try {
    const device = await Device.findByIdAndDelete(req.params.id)
    if (!device) return res.status(404).json({ error: "Device not found" })
    res.json({ message: "Device deleted" })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// Server configuration routes
app.get("/api/servers", authenticate, async (req, res) => {
  try {
    const servers = await ServerConfig.find()
    res.json(servers)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

app.post("/api/servers", authenticate, async (req, res) => {
  try {
    const server = new ServerConfig(req.body)
    await server.save()
    res.status(201).json(server)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

app.put("/api/servers/:id", authenticate, async (req, res) => {
  try {
    const server = await ServerConfig.findByIdAndUpdate(req.params.id, req.body, { new: true })
    if (!server) return res.status(404).json({ error: "Server not found" })
    res.json(server)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

app.delete("/api/servers/:id", authenticate, async (req, res) => {
  try {
    const server = await ServerConfig.findByIdAndDelete(req.params.id)
    if (!server) return res.status(404).json({ error: "Server not found" })
    res.json({ message: "Server deleted" })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// Data routes
app.get("/api/data/:deviceId", authenticate, async (req, res) => {
  try {
    const { deviceId } = req.params
    const { start, end, limit } = req.query

    const data = await queryInflux(deviceId, start, end, Number.parseInt(limit) || 100)
    res.json(data)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

app.post("/api/data", authenticate, async (req, res) => {
  try {
    const { deviceId, protocol, dataType, value } = req.body

    // Save to InfluxDB
    await writeToInflux(deviceId, protocol, dataType, value)

    // Update device last seen
    await Device.findByIdAndUpdate(deviceId, {
      lastSeen: new Date(),
      status: "online",
    })

    // Forward to external servers if configured
    forwardDataToExternalServers(req.body)

    res.status(201).json({ success: true })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// Function to forward data to external servers
async function forwardDataToExternalServers(data) {
  try {
    const servers = await ServerConfig.find({ enabled: true })

    servers.forEach((server) => {
      switch (server.type) {
        case "mongodb":
          // MongoDB forwarding logic
          const MongoClient = require("mongodb").MongoClient
          const url = `mongodb://${server.host}:${server.port}`
          MongoClient.connect(url, (err, client) => {
            if (err) {
              console.error("Error connecting to external MongoDB:", err)
              return
            }
            const db = client.db(server.database)
            db.collection("device_data").insertOne(
              {
                ...data,
                timestamp: new Date(),
              },
              (err) => {
                if (err) console.error("Error inserting to external MongoDB:", err)
                client.close()
              },
            )
          })
          break

        case "influxdb":
          // InfluxDB forwarding logic
          const Influx = require("influx") // Import Influx
          const externalInflux = new Influx.InfluxDB({
            host: server.host,
            port: server.port,
            database: server.database,
            username: server.username,
            password: server.password,
          })

          externalInflux
            .writePoints([
              {
                measurement: "device_data",
                tags: {
                  deviceId: data.deviceId,
                  protocol: data.protocol,
                  dataType: data.dataType,
                },
                fields: { value: data.value },
              },
            ])
            .catch((err) => {
              console.error("Error writing to external InfluxDB:", err)
            })
          break

        case "mqtt":
          // MQTT forwarding logic
          const mqttClient = mqtt.connect(`mqtt://${server.host}:${server.port}`, {
            username: server.username,
            password: server.password,
          })

          mqttClient.on("connect", () => {
            mqttClient.publish(
              server.topic,
              JSON.stringify({
                ...data,
                timestamp: new Date(),
              }),
            )
            mqttClient.end()
          })

          mqttClient.on("error", (err) => {
            console.error("MQTT forwarding error:", err)
          })
          break

        case "http":
          // HTTP API forwarding logic
          const axios = require("axios")
          axios
            .post(
              server.endpoint,
              {
                ...data,
                timestamp: new Date(),
              },
              {
                auth: {
                  username: server.username,
                  password: server.password,
                },
              },
            )
            .catch((err) => {
              console.error("HTTP forwarding error:", err)
            })
          break
      }
    })
  } catch (err) {
    console.error("Error forwarding data:", err)
  }
}

// WebSocket for real-time updates
wss.on("connection", (ws) => {
  console.log("WebSocket client connected")

  ws.on("message", (message) => {
    try {
      const data = JSON.parse(message)

      // Handle different message types
      if (data.type === "subscribe") {
        ws.deviceId = data.deviceId
      }
    } catch (err) {
      console.error("WebSocket message error:", err)
    }
  })

  ws.on("close", () => {
    console.log("WebSocket client disconnected")
  })
})

// Broadcast device data to WebSocket clients
function broadcastDeviceData(deviceId, data) {
  wss.clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN && (!client.deviceId || client.deviceId === deviceId)) {
      client.send(
        JSON.stringify({
          type: "device_data",
          deviceId,
          data,
        }),
      )
    }
  })
}

// Start the server
const PORT = process.env.PORT || 305
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`)
})
