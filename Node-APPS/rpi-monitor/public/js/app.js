import { Chart } from "@/components/ui/chart"
document.addEventListener("DOMContentLoaded", () => {
  // DOM Elements
  const loginScreen = document.getElementById("login-screen")
  const app = document.getElementById("app")
  const loginBtn = document.getElementById("login-btn")
  const loginError = document.getElementById("login-error")
  const usernameInput = document.getElementById("username")
  const passwordInput = document.getElementById("password")
  const usernameDisplay = document.getElementById("username-display")
  const logoutBtn = document.getElementById("logout-btn")
  const themeToggle = document.getElementById("theme-toggle")
  const mainNavItems = document.querySelectorAll(".main-nav li")
  const sidebarSections = document.querySelectorAll(".sidebar-section")
  const tabContents = document.querySelectorAll(".tab-content")
  const sidebarItems = document.querySelectorAll(".sidebar-section li")
  const sectionContents = document.querySelectorAll(".section-content")
  const addDeviceBtn = document.getElementById("add-device-btn")
  const addServerBtn = document.getElementById("add-server-btn")
  const cancelServerBtn = document.getElementById("cancel-server-btn")
  const serverFormContainer = document.getElementById("server-form-container")
  const serverTypeSelect = document.getElementById("server-type")
  const serverSpecificFields = document.querySelectorAll(".server-specific")

  // Check if user is already logged in
  checkAuthStatus()

  // Initialize theme
  initTheme()

  // Event Listeners
  loginBtn.addEventListener("click", handleLogin)
  logoutBtn.addEventListener("click", handleLogout)
  themeToggle.addEventListener("click", toggleTheme)

  // Navigation
  mainNavItems.forEach((item) => {
    item.addEventListener("click", function () {
      const tabId = this.getAttribute("data-tab")

      // Update active state in main nav
      mainNavItems.forEach((navItem) => navItem.classList.remove("active"))
      this.classList.add("active")

      // Show corresponding tab content
      tabContents.forEach((content) => content.classList.remove("active"))
      document.getElementById(tabId).classList.add("active")

      // Show corresponding sidebar section
      sidebarSections.forEach((section) => {
        if (section.getAttribute("data-parent") === tabId) {
          section.classList.remove("hidden")
        } else {
          section.classList.add("hidden")
        }
      })

      // Activate first sidebar item
      const firstSidebarItem = document.querySelector(`.sidebar-section[data-parent="${tabId}"] li`)
      if (firstSidebarItem) {
        sidebarItems.forEach((item) => item.classList.remove("active"))
        firstSidebarItem.classList.add("active")

        const sectionId = firstSidebarItem.getAttribute("data-section")
        sectionContents.forEach((content) => content.classList.remove("active"))
        document.getElementById(sectionId).classList.add("active")
      }
    })
  })

  // Sidebar Navigation
  sidebarItems.forEach((item) => {
    item.addEventListener("click", function () {
      const sectionId = this.getAttribute("data-section")

      // Update active state in sidebar
      sidebarItems.forEach((sidebarItem) => sidebarItem.classList.remove("active"))
      this.classList.add("active")

      // Show corresponding section content
      sectionContents.forEach((content) => content.classList.remove("active"))
      document.getElementById(sectionId).classList.add("active")
    })
  })

  // Add Device Button
  if (addDeviceBtn) {
    addDeviceBtn.addEventListener("click", () => {
      // Activate the Add Device tab
      mainNavItems.forEach((item) => {
        if (item.getAttribute("data-tab") === "devices") {
          item.click()
        }
      })

      // Activate the Add Device section
      sidebarItems.forEach((item) => {
        if (item.getAttribute("data-section") === "add-device") {
          item.click()
        }
      })
    })
  }

  // Add Server Button
  if (addServerBtn) {
    addServerBtn.addEventListener("click", () => {
      serverFormContainer.classList.remove("hidden")
    })
  }

  // Cancel Server Button
  if (cancelServerBtn) {
    cancelServerBtn.addEventListener("click", () => {
      serverFormContainer.classList.add("hidden")
      document.getElementById("add-server-form").reset()
    })
  }

  // Server Type Change
  if (serverTypeSelect) {
    serverTypeSelect.addEventListener("change", function () {
      const selectedType = this.value

      serverSpecificFields.forEach((field) => {
        field.classList.add("hidden")
      })

      if (selectedType) {
        document.querySelectorAll(`.server-specific.${selectedType}`).forEach((field) => {
          field.classList.remove("hidden")
        })
      }
    })
  }

  // Initialize WebSocket connection
  let ws = null

  function initWebSocket() {
    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:"
    const wsUrl = `${protocol}//${window.location.host}`

    ws = new WebSocket(wsUrl)

    ws.onopen = () => {
      console.log("WebSocket connection established")
    }

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data)
        handleWebSocketMessage(data)
      } catch (err) {
        console.error("Error parsing WebSocket message:", err)
      }
    }

    ws.onclose = () => {
      console.log("WebSocket connection closed")
      // Try to reconnect after a delay
      setTimeout(initWebSocket, 5000)
    }

    ws.onerror = (error) => {
      console.error("WebSocket error:", error)
    }
  }

  // Handle WebSocket messages
  function handleWebSocketMessage(data) {
    if (data.type === "device_data") {
      updateDeviceData(data.deviceId, data.data)
    }
  }

  // Update device data in UI
  function updateDeviceData(deviceId, data) {
    // Update charts and other UI elements with the new data
    console.log(`Received data for device ${deviceId}:`, data)
  }

  // Initialize charts
  function initCharts() {
    // Line Chart
    const lineCtx = document.getElementById("line-chart")
    if (lineCtx) {
      new Chart(lineCtx, {
        type: "line",
        data: {
          labels: Array.from({ length: 10 }, (_, i) => i),
          datasets: [
            {
              label: "Temperature",
              data: Array.from({ length: 10 }, () => Math.random() * 30),
              borderColor: "#0d6efd",
              tension: 0.1,
              fill: false,
            },
          ],
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          scales: {
            y: {
              beginAtZero: true,
            },
          },
        },
      })
    }

    // Area Chart
    const areaCtx = document.getElementById("area-chart")
    if (areaCtx) {
      new Chart(areaCtx, {
        type: "line",
        data: {
          labels: Array.from({ length: 10 }, (_, i) => i),
          datasets: [
            {
              label: "Humidity",
              data: Array.from({ length: 10 }, () => Math.random() * 100),
              borderColor: "#20c997",
              backgroundColor: "rgba(32, 201, 151, 0.2)",
              tension: 0.1,
              fill: true,
            },
          ],
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          scales: {
            y: {
              beginAtZero: true,
            },
          },
        },
      })
    }

    // Streaming Chart (placeholder)
    const streamingCtx = document.getElementById("streaming-chart")
    if (streamingCtx) {
      new Chart(streamingCtx, {
        type: "line",
        data: {
          labels: Array.from({ length: 20 }, (_, i) => i),
          datasets: [
            {
              label: "Voltage",
              data: Array.from({ length: 20 }, () => Math.random() * 5),
              borderColor: "#dc3545",
              tension: 0.4,
              fill: false,
            },
          ],
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          scales: {
            y: {
              beginAtZero: true,
            },
          },
          animation: {
            duration: 0,
          },
        },
      })
    }

    // Multi-Line Chart
    const multiLineCtx = document.getElementById("multi-line-chart")
    if (multiLineCtx) {
      new Chart(multiLineCtx, {
        type: "line",
        data: {
          labels: Array.from({ length: 24 }, (_, i) => i),
          datasets: [
            {
              label: "Temperature",
              data: Array.from({ length: 24 }, () => Math.random() * 30 + 10),
              borderColor: "#0d6efd",
              tension: 0.1,
              fill: false,
            },
            {
              label: "Humidity",
              data: Array.from({ length: 24 }, () => Math.random() * 50 + 30),
              borderColor: "#20c997",
              tension: 0.1,
              fill: false,
            },
            {
              label: "Pressure",
              data: Array.from({ length: 24 }, () => Math.random() * 10 + 1000),
              borderColor: "#ffc107",
              tension: 0.1,
              fill: false,
            },
          ],
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          scales: {
            y: {
              beginAtZero: false,
            },
          },
        },
      })
    }

    // Bar Chart
    const barCtx = document.getElementById("bar-chart")
    if (barCtx) {
      new Chart(barCtx, {
        type: "bar",
        data: {
          labels: ["Device 1", "Device 2", "Device 3", "Device 4", "Device 5"],
          datasets: [
            {
              label: "Data Points",
              data: [12, 19, 3, 5, 2],
              backgroundColor: [
                "rgba(13, 110, 253, 0.6)",
                "rgba(32, 201, 151, 0.6)",
                "rgba(255, 193, 7, 0.6)",
                "rgba(220, 53, 69, 0.6)",
                "rgba(13, 202, 240, 0.6)",
              ],
              borderColor: [
                "rgba(13, 110, 253, 1)",
                "rgba(32, 201, 151, 1)",
                "rgba(255, 193, 7, 1)",
                "rgba(220, 53, 69, 1)",
                "rgba(13, 202, 240, 1)",
              ],
              borderWidth: 1,
            },
          ],
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          scales: {
            y: {
              beginAtZero: true,
            },
          },
        },
      })
    }

    // Stacked Bar Chart
    const stackedBarCtx = document.getElementById("stacked-bar-chart")
    if (stackedBarCtx) {
      new Chart(stackedBarCtx, {
        type: "bar",
        data: {
          labels: ["Jan", "Feb", "Mar", "Apr", "May"],
          datasets: [
            {
              label: "Device 1",
              data: [12, 19, 3, 5, 2],
              backgroundColor: "rgba(13, 110, 253, 0.6)",
              borderColor: "rgba(13, 110, 253, 1)",
              borderWidth: 1,
            },
            {
              label: "Device 2",
              data: [5, 15, 10, 8, 12],
              backgroundColor: "rgba(32, 201, 151, 0.6)",
              borderColor: "rgba(32, 201, 151, 1)",
              borderWidth: 1,
            },
            {
              label: "Device 3",
              data: [8, 4, 6, 9, 7],
              backgroundColor: "rgba(255, 193, 7, 0.6)",
              borderColor: "rgba(255, 193, 7, 1)",
              borderWidth: 1,
            },
          ],
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          scales: {
            x: {
              stacked: true,
            },
            y: {
              stacked: true,
              beginAtZero: true,
            },
          },
        },
      })
    }
  }

  // Initialize services status
  function initServicesStatus() {
    fetch("/api/services", {
      headers: {
        "Content-Type": "application/json",
      },
    })
      .then((response) => {
        if (!response.ok) {
          throw new Error("Failed to fetch services status")
        }
        return response.json()
      })
      .then((data) => {
        updateServicesStatus(data)
      })
      .catch((error) => {
        console.error("Error fetching services status:", error)
      })
  }

  // Update services status in UI
  function updateServicesStatus(data) {
    const servicesStatus = document.getElementById("services-status")
    const interfaceStatus = document.getElementById("interface-status")

    if (servicesStatus) {
      // Update services
      for (const service in data) {
        if (["mongod", "influxdb", "grafana-server", "nginx", "webmin"].includes(service)) {
          const statusItem = servicesStatus.querySelector(`.status-item:has(.status-label:contains("${service}"))`)
          if (statusItem) {
            const statusValue = statusItem.querySelector(".status-value")
            if (statusValue) {
              statusValue.innerHTML = getStatusIcon(data[service].status === "active")
            }
          }
        }
      }
    }

    if (interfaceStatus) {
      // Update interfaces
      if (data.can0) {
        const canStatus = interfaceStatus.querySelector(".status-item:first-child .status-value")
        if (canStatus) {
          canStatus.innerHTML = getStatusIcon(data.can0.status === "active")
        }
      }

      if (data.i2c) {
        const i2cStatus = interfaceStatus.querySelector(".status-item:nth-child(2) .status-value")
        if (i2cStatus) {
          i2cStatus.innerHTML = getStatusIcon(data.i2c.status === "active")
        }
      }

      if (data.spi) {
        const spiStatus = interfaceStatus.querySelector(".status-item:nth-child(3) .status-value")
        if (spiStatus) {
          spiStatus.innerHTML = getStatusIcon(data.spi.status === "active")
        }
      }
    }
  }

  // Get status icon HTML
  function getStatusIcon(isActive) {
    return isActive
      ? '<i class="fas fa-circle active" style="color: var(--light-success);"></i>'
      : '<i class="fas fa-circle inactive" style="color: var(--light-danger);"></i>'
  }

  // Initialize devices
  function initDevices() {
    fetch("/api/devices", {
      headers: {
        "Content-Type": "application/json",
      },
    })
      .then((response) => {
        if (!response.ok) {
          throw new Error("Failed to fetch devices")
        }
        return response.json()
      })
      .then((devices) => {
        updateDevicesList(devices)
        updateDeviceSummary(devices)
        populateDeviceSelects(devices)
      })
      .catch((error) => {
        console.error("Error fetching devices:", error)
      })
  }

  // Update devices list in UI
  function updateDevicesList(devices) {
    const tableBody = document.getElementById("devices-table-body")
    if (!tableBody) return

    if (devices.length === 0) {
      tableBody.innerHTML = '<tr><td colspan="6" class="text-center">No devices found</td></tr>'
      return
    }

    tableBody.innerHTML = ""

    devices.forEach((device) => {
      const row = document.createElement("tr")

      const lastSeen = device.lastSeen ? new Date(device.lastSeen).toLocaleString() : "Never"

      row.innerHTML = `
        <td>${device.name}</td>
        <td>${device.protocol}</td>
        <td>${device.address}${device.port ? `:${device.port}` : ""}</td>
        <td><span class="status-${device.status}">${device.status}</span></td>
        <td>${lastSeen}</td>
        <td>
          <button class="btn btn-small" data-action="edit" data-id="${device._id}">
            <i class="fas fa-edit"></i>
          </button>
          <button class="btn btn-small" data-action="delete" data-id="${device._id}">
            <i class="fas fa-trash"></i>
          </button>
        </td>
      `

      tableBody.appendChild(row)
    })

    // Add event listeners to action buttons
    tableBody.querySelectorAll('[data-action="edit"]').forEach((btn) => {
      btn.addEventListener("click", function () {
        const deviceId = this.getAttribute("data-id")
        editDevice(deviceId)
      })
    })

    tableBody.querySelectorAll('[data-action="delete"]').forEach((btn) => {
      btn.addEventListener("click", function () {
        const deviceId = this.getAttribute("data-id")
        deleteDevice(deviceId)
      })
    })
  }

  // Update device summary in UI
  function updateDeviceSummary(devices) {
    const totalDevices = document.getElementById("total-devices")
    const onlineDevices = document.getElementById("online-devices")
    const offlineDevices = document.getElementById("offline-devices")
    const warningDevices = document.getElementById("warning-devices")

    if (totalDevices) totalDevices.textContent = devices.length

    if (onlineDevices) {
      onlineDevices.textContent = devices.filter((device) => device.status === "online").length
    }

    if (offlineDevices) {
      offlineDevices.textContent = devices.filter((device) => device.status === "offline").length
    }

    if (warningDevices) {
      warningDevices.textContent = devices.filter(
        (device) => device.status === "warning" || device.status === "error",
      ).length
    }
  }

  // Populate device select dropdowns
  function populateDeviceSelects(devices) {
    const selects = [document.getElementById("graph-device-select"), document.getElementById("history-device-select")]

    selects.forEach((select) => {
      if (!select) return

      // Clear existing options except the first one
      while (select.options.length > 1) {
        select.remove(1)
      }

      // Add device options
      devices.forEach((device) => {
        const option = document.createElement("option")
        option.value = device._id
        option.textContent = device.name
        select.appendChild(option)
      })
    })
  }

  // Edit device
  function editDevice(deviceId) {
    // Navigate to configure device section
    mainNavItems.forEach((item) => {
      if (item.getAttribute("data-tab") === "devices") {
        item.click()
      }
    })

    sidebarItems.forEach((item) => {
      if (item.getAttribute("data-section") === "configure-device") {
        item.click()
      }
    })

    // Fetch device details and populate form
    fetch(`/api/devices/${deviceId}`, {
      headers: {
        "Content-Type": "application/json",
      },
    })
      .then((response) => {
        if (!response.ok) {
          throw new Error("Failed to fetch device details")
        }
        return response.json()
      })
      .then((device) => {
        // Create and populate the edit form
        const container = document.querySelector(".device-config-container")
        if (container) {
          container.innerHTML = `
          <h3>Edit Device: ${device.name}</h3>
          <form id="edit-device-form" data-id="${device._id}">
            <div class="form-group">
              <label for="edit-device-name">Device Name</label>
              <input type="text" id="edit-device-name" value="${device.name}" required>
            </div>
            
            <div class="form-group">
              <label for="edit-device-protocol">Communication Protocol</label>
              <select id="edit-device-protocol" required>
                <!-- Protocol options will be populated dynamically -->
              </select>
            </div>
            
            <div class="form-group">
              <label for="edit-device-address">Address/Port</label>
              <input type="text" id="edit-device-address" value="${device.address}" required>
            </div>
            
            <div class="form-group">
              <label for="edit-device-data-types">Data Types</label>
              <select id="edit-device-data-types" multiple>
                <!-- Data type options will be populated dynamically -->
              </select>
              <small>Hold Ctrl/Cmd to select multiple</small>
            </div>
            
            <div class="form-group">
              <label for="edit-device-config">Additional Configuration (JSON)</label>
              <textarea id="edit-device-config" rows="5">${JSON.stringify(device.config || {}, null, 2)}</textarea>
            </div>
            
            <div class="form-actions">
              <button type="submit" class="btn btn-primary">Update Device</button>
              <button type="button" id="cancel-edit-btn" class="btn btn-secondary">Cancel</button>
            </div>
          </form>
        `

          // Populate protocol select
          const protocolSelect = document.getElementById("edit-device-protocol")
          if (protocolSelect) {
            const protocols = [
              "UART",
              "SPI",
              "I2C",
              "CAN",
              "CANopen",
              "MODBUS",
              "PROFIBUS",
              "DeviceNet",
              "HART",
              "EthernetIP",
              "ModbusTCP",
              "PROFINET",
              "EtherCAT",
              "POWERLINK",
              "CCLinkIE",
              "TSN",
              "WiFi",
              "Bluetooth",
              "LoRaWAN",
              "Zigbee",
              "6LoWPAN",
              "NB-IoT",
              "LTE-M",
              "WirelessHART",
              "MQTT",
              "CoAP",
              "OPC-UA",
              "HTTP",
              "WebSockets",
            ]

            protocols.forEach((protocol) => {
              const option = document.createElement("option")
              option.value = protocol
              option.textContent = protocol
              option.selected = device.protocol === protocol
              protocolSelect.appendChild(option)
            })
          }

          // Populate data types select
          const dataTypesSelect = document.getElementById("edit-device-data-types")
          if (dataTypesSelect) {
            const dataTypes = [
              "int8",
              "int16",
              "int32",
              "int64",
              "uint8",
              "uint16",
              "uint32",
              "uint64",
              "float",
              "double",
              "boolean",
              "string",
              "binary",
              "timestamp",
            ]

            dataTypes.forEach((type) => {
              const option = document.createElement("option")
              option.value = type
              option.textContent = type
              option.selected = device.dataTypes && device.dataTypes.includes(type)
              dataTypesSelect.appendChild(option)
            })
          }

          // Add event listeners
          const editForm = document.getElementById("edit-device-form")
          if (editForm) {
            editForm.addEventListener("submit", (e) => {
              e.preventDefault()
              updateDevice(device._id)
            })
          }

          const cancelBtn = document.getElementById("cancel-edit-btn")
          if (cancelBtn) {
            cancelBtn.addEventListener("click", () => {
              container.innerHTML = "<p>Select a device from the list to configure</p>"
            })
          }
        }
      })
      .catch((error) => {
        console.error("Error fetching device details:", error)
      })
  }

  // Update device
  function updateDevice(deviceId) {
    const name = document.getElementById("edit-device-name").value
    const protocol = document.getElementById("edit-device-protocol").value
    const address = document.getElementById("edit-device-address").value

    const dataTypesSelect = document.getElementById("edit-device-data-types")
    const dataTypes = Array.from(dataTypesSelect.selectedOptions).map((option) => option.value)

    let config = {}
    try {
      const configText = document.getElementById("edit-device-config").value
      if (configText.trim()) {
        config = JSON.parse(configText)
      }
    } catch (err) {
      alert("Invalid JSON in configuration field")
      return
    }

    fetch(`/api/devices/${deviceId}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        name,
        protocol,
        address,
        dataTypes,
        config,
      }),
    })
      .then((response) => {
        if (!response.ok) {
          throw new Error("Failed to update device")
        }
        return response.json()
      })
      .then(() => {
        alert("Device updated successfully")
        initDevices()

        // Navigate back to device list
        sidebarItems.forEach((item) => {
          if (item.getAttribute("data-section") === "device-list") {
            item.click()
          }
        })
      })
      .catch((error) => {
        console.error("Error updating device:", error)
        alert("Failed to update device")
      })
  }

  // Delete device
  function deleteDevice(deviceId) {
    if (!confirm("Are you sure you want to delete this device?")) {
      return
    }

    fetch(`/api/devices/${deviceId}`, {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
      },
    })
      .then((response) => {
        if (!response.ok) {
          throw new Error("Failed to delete device")
        }
        return response.json()
      })
      .then(() => {
        alert("Device deleted successfully")
        initDevices()
      })
      .catch((error) => {
        console.error("Error deleting device:", error)
        alert("Failed to delete device")
      })
  }

  // Initialize servers
  function initServers() {
    fetch("/api/servers", {
      headers: {
        "Content-Type": "application/json",
      },
    })
      .then((response) => {
        if (!response.ok) {
          throw new Error("Failed to fetch servers")
        }
        return response.json()
      })
      .then((servers) => {
        updateServersList(servers)
      })
      .catch((error) => {
        console.error("Error fetching servers:", error)
      })
  }

  // Update servers list in UI
  function updateServersList(servers) {
    const tableBody = document.getElementById("servers-table-body")
    if (!tableBody) return

    if (servers.length === 0) {
      tableBody.innerHTML = '<tr><td colspan="5" class="text-center">No servers configured</td></tr>'
      return
    }

    tableBody.innerHTML = ""

    servers.forEach((server) => {
      const row = document.createElement("tr")

      row.innerHTML = `
        <td>${server.name}</td>
        <td>${server.type}</td>
        <td>${server.host}:${server.port}</td>
        <td><span class="status-${server.enabled ? "online" : "offline"}">${server.enabled ? "Enabled" : "Disabled"}</span></td>
        <td>
          <button class="btn btn-small" data-action="edit-server" data-id="${server._id}">
            <i class="fas fa-edit"></i>
          </button>
          <button class="btn btn-small" data-action="delete-server" data-id="${server._id}">
            <i class="fas fa-trash"></i>
          </button>
          <button class="btn btn-small" data-action="toggle-server" data-id="${server._id}" data-enabled="${server.enabled}">
            <i class="fas fa-${server.enabled ? "pause" : "play"}"></i>
          </button>
        </td>
      `

      tableBody.appendChild(row)
    })

    // Add event listeners to action buttons
    tableBody.querySelectorAll('[data-action="edit-server"]').forEach((btn) => {
      btn.addEventListener("click", function () {
        const serverId = this.getAttribute("data-id")
        editServer(serverId)
      })
    })

    tableBody.querySelectorAll('[data-action="delete-server"]').forEach((btn) => {
      btn.addEventListener("click", function () {
        const serverId = this.getAttribute("data-id")
        deleteServer(serverId)
      })
    })

    tableBody.querySelectorAll('[data-action="toggle-server"]').forEach((btn) => {
      btn.addEventListener("click", function () {
        const serverId = this.getAttribute("data-id")
        const enabled = this.getAttribute("data-enabled") === "true"
        toggleServer(serverId, !enabled)
      })
    })
  }

  // Edit server
  function editServer(serverId) {
    // Fetch server details and populate form
    fetch(`/api/servers/${serverId}`, {
      headers: {
        "Content-Type": "application/json",
      },
    })
      .then((response) => {
        if (!response.ok) {
          throw new Error("Failed to fetch server details")
        }
        return response.json()
      })
      .then((server) => {
        // Show the server form
        serverFormContainer.classList.remove("hidden")

        // Populate form fields
        document.getElementById("server-name").value = server.name
        document.getElementById("server-type").value = server.type
        document.getElementById("server-host").value = server.host
        document.getElementById("server-port").value = server.port
        document.getElementById("server-username").value = server.username || ""
        document.getElementById("server-password").value = server.password || ""

        if (server.database) {
          document.getElementById("server-database").value = server.database
        }

        if (server.topic) {
          document.getElementById("server-topic").value = server.topic
        }

        if (server.endpoint) {
          document.getElementById("server-endpoint").value = server.endpoint
        }

        // Show relevant fields based on server type
        serverSpecificFields.forEach((field) => {
          field.classList.add("hidden")
        })

        document.querySelectorAll(`.server-specific.${server.type}`).forEach((field) => {
          field.classList.remove("hidden")
        })

        // Update form for edit mode
        const form = document.getElementById("add-server-form")
        form.setAttribute("data-mode", "edit")
        form.setAttribute("data-id", serverId)

        const submitBtn = form.querySelector('button[type="submit"]')
        if (submitBtn) {
          submitBtn.textContent = "Update Server"
        }
      })
      .catch((error) => {
        console.error("Error fetching server details:", error)
      })
  }

  // Delete server
  function deleteServer(serverId) {
    if (!confirm("Are you sure you want to delete this server?")) {
      return
    }

    fetch(`/api/servers/${serverId}`, {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
      },
    })
      .then((response) => {
        if (!response.ok) {
          throw new Error("Failed to delete server")
        }
        return response.json()
      })
      .then(() => {
        alert("Server deleted successfully")
        initServers()
      })
      .catch((error) => {
        console.error("Error deleting server:", error)
        alert("Failed to delete server")
      })
  }

  // Toggle server enabled state
  function toggleServer(serverId, enabled) {
    fetch(`/api/servers/${serverId}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ enabled }),
    })
      .then((response) => {
        if (!response.ok) {
          throw new Error("Failed to update server")
        }
        return response.json()
      })
      .then(() => {
        initServers()
      })
      .catch((error) => {
        console.error("Error updating server:", error)
        alert("Failed to update server")
      })
  }

  // Handle form submissions
  document.addEventListener("submit", (e) => {
    if (e.target.id === "add-device-form") {
      e.preventDefault()
      addDevice()
    } else if (e.target.id === "add-server-form") {
      e.preventDefault()
      const mode = e.target.getAttribute("data-mode")
      if (mode === "edit") {
        const serverId = e.target.getAttribute("data-id")
        updateServer(serverId)
      } else {
        addServer()
      }
    }
  })

  // Add device
  function addDevice() {
    const name = document.getElementById("device-name").value
    const protocol = document.getElementById("device-protocol").value
    const address = document.getElementById("device-address").value

    const dataTypesSelect = document.getElementById("device-data-types")
    const dataTypes = Array.from(dataTypesSelect.selectedOptions).map((option) => option.value)

    let config = {}
    try {
      const configText = document.getElementById("device-config").value
      if (configText.trim()) {
        config = JSON.parse(configText)
      }
    } catch (err) {
      alert("Invalid JSON in configuration field")
      return
    }

    fetch("/api/devices", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        name,
        protocol,
        address,
        dataTypes,
        config,
        status: "offline",
      }),
    })
      .then((response) => {
        if (!response.ok) {
          throw new Error("Failed to add device")
        }
        return response.json()
      })
      .then(() => {
        alert("Device added successfully")
        document.getElementById("add-device-form").reset()
        initDevices()

        // Navigate back to device list
        sidebarItems.forEach((item) => {
          if (item.getAttribute("data-section") === "device-list") {
            item.click()
          }
        })
      })
      .catch((error) => {
        console.error("Error adding device:", error)
        alert("Failed to add device")
      })
  }

  // Add server
  function addServer() {
    const name = document.getElementById("server-name").value
    const type = document.getElementById("server-type").value
    const host = document.getElementById("server-host").value
    const port = document.getElementById("server-port").value
    const username = document.getElementById("server-username").value
    const password = document.getElementById("server-password").value

    const data = {
      name,
      type,
      host,
      port: Number.parseInt(port),
      username,
      password,
      enabled: true,
    }

    if (type === "mongodb" || type === "influxdb") {
      data.database = document.getElementById("server-database").value
    } else if (type === "mqtt") {
      data.topic = document.getElementById("server-topic").value
    } else if (type === "http") {
      data.endpoint = document.getElementById("server-endpoint").value
    }

    fetch("/api/servers", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    })
      .then((response) => {
        if (!response.ok) {
          throw new Error("Failed to add server")
        }
        return response.json()
      })
      .then(() => {
        alert("Server added successfully")
        document.getElementById("add-server-form").reset()
        serverFormContainer.classList.add("hidden")
        initServers()
      })
      .catch((error) => {
        console.error("Error adding server:", error)
        alert("Failed to add server")
      })
  }

  // Update server
  function updateServer(serverId) {
    const name = document.getElementById("server-name").value
    const type = document.getElementById("server-type").value
    const host = document.getElementById("server-host").value
    const port = document.getElementById("server-port").value
    const username = document.getElementById("server-username").value
    const password = document.getElementById("server-password").value

    const data = {
      name,
      type,
      host,
      port: Number.parseInt(port),
      username,
      password,
    }

    if (type === "mongodb" || type === "influxdb") {
      data.database = document.getElementById("server-database").value
    } else if (type === "mqtt") {
      data.topic = document.getElementById("server-topic").value
    } else if (type === "http") {
      data.endpoint = document.getElementById("server-endpoint").value
    }

    fetch(`/api/servers/${serverId}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    })
      .then((response) => {
        if (!response.ok) {
          throw new Error("Failed to update server")
        }
        return response.json()
      })
      .then(() => {
        alert("Server updated successfully")
        document.getElementById("add-server-form").reset()
        serverFormContainer.classList.add("hidden")

        // Reset form to add mode
        const form = document.getElementById("add-server-form")
        form.removeAttribute("data-mode")
        form.removeAttribute("data-id")

        const submitBtn = form.querySelector('button[type="submit"]')
        if (submitBtn) {
          submitBtn.textContent = "Add Server"
        }

        initServers()
      })
      .catch((error) => {
        console.error("Error updating server:", error)
        alert("Failed to update server")
      })
  }

  // Login function
  function handleLogin() {
    const username = usernameInput.value
    const password = passwordInput.value

    if (!username || !password) {
      loginError.textContent = "Please enter both username and password"
      return
    }

    fetch("/api/login", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ username, password }),
    })
      .then((response) => {
        if (!response.ok) {
          throw new Error("Login failed")
        }
        return response.json()
      })
      .then((data) => {
        if (data.success) {
          loginScreen.classList.add("hidden")
          app.classList.remove("hidden")
          usernameDisplay.textContent = username

          // Initialize app data
          initWebSocket()
          initCharts()
          initServicesStatus()
          initDevices()
          initServers()
        } else {
          loginError.textContent = data.error || "Login failed"
        }
      })
      .catch((error) => {
        console.error("Login error:", error)
        loginError.textContent = "Login failed. Please try again."
      })
  }

  // Logout function
  function handleLogout() {
    fetch("/api/logout", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
    })
      .then(() => {
        app.classList.add("hidden")
        loginScreen.classList.remove("hidden")
        usernameInput.value = ""
        passwordInput.value = ""
        loginError.textContent = ""
      })
      .catch((error) => {
        console.error("Logout error:", error)
      })
  }

  // Check authentication status
  function checkAuthStatus() {
    fetch("/api/devices", {
      headers: {
        "Content-Type": "application/json",
      },
    })
      .then((response) => {
        if (response.ok) {
          // User is authenticated
          loginScreen.classList.add("hidden")
          app.classList.remove("hidden")

          // Initialize app data
          initWebSocket()
          initCharts()
          initServicesStatus()
          initDevices()
          initServers()
        } else {
          // User is not authenticated
          loginScreen.classList.remove("hidden")
          app.classList.add("hidden")
        }
      })
      .catch(() => {
        // Error checking auth status, assume not authenticated
        loginScreen.classList.remove("hidden")
        app.classList.add("hidden")
      })
  }

  // Theme functions
  function initTheme() {
    const savedTheme = localStorage.getItem("theme")
    if (savedTheme === "dark") {
      document.body.classList.remove("light-theme")
      document.body.classList.add("dark-theme")
      themeToggle.checked = true
    } else {
      document.body.classList.add("light-theme")
      document.body.classList.remove("dark-theme")
      themeToggle.checked = false
    }
  }

  function toggleTheme() {
    if (themeToggle.checked) {
      document.body.classList.remove("light-theme")
      document.body.classList.add("dark-theme")
      localStorage.setItem("theme", "dark")
    } else {
      document.body.classList.add("light-theme")
      document.body.classList.remove("dark-theme")
      localStorage.setItem("theme", "light")
    }
  }
})

