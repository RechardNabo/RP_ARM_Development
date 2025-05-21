import { Chart } from "@/components/ui/chart"
document.addEventListener("DOMContentLoaded", () => {
  console.log("Dashboard initialized")

  // Setup navigation
  setupSidebarNavigation()

  // Setup logout button
  setupLogout()

  // Setup protocol tabs
  setupProtocolTabs()

  // Add some initial activity
  addActivityItem("Dashboard loaded")
})

// Check if user is authenticated
function checkAuthentication() {
  fetch("/api/devices")
    .then((response) => {
      if (response.status === 401) {
        // Not authenticated, redirect to login
        window.location.href = "/"
      }
    })
    .catch((error) => {
      console.error("Authentication check error:", error)
    })
}

// Initialize dashboard
function initDashboard() {
  // Set username in sidebar
  const username = document.getElementById("username")
  if (username) {
    // In a real app, you would get this from the server
    username.textContent = "admin"
  }

  // Initialize tabs
  initTabs()
}

// Initialize tabs
function initTabs() {
  const tabItems = document.querySelectorAll(".tab-item")
  const tabPanes = document.querySelectorAll(".tab-pane")

  console.log("Found tab items:", tabItems.length)
  console.log("Found tab panes:", tabPanes.length)

  tabItems.forEach((item) => {
    item.addEventListener("click", function () {
      console.log("Tab clicked:", this.getAttribute("data-tab"))

      // Remove active class from all tabs
      tabItems.forEach((tab) => tab.classList.remove("active"))
      tabPanes.forEach((pane) => pane.classList.remove("active"))

      // Add active class to clicked tab
      this.classList.add("active")

      // Show corresponding tab pane
      const tabId = this.getAttribute("data-tab")
      const tabPane = document.getElementById(`${tabId}-tab`)
      if (tabPane) {
        tabPane.classList.add("active")
      } else {
        console.error("Tab pane not found:", `${tabId}-tab`)
      }
    })
  })
}

// Setup sidebar navigation
function setupSidebarNavigation() {
  const navItems = document.querySelectorAll(".sidebar-nav .nav-item")
  const sections = document.querySelectorAll(".content-section")

  console.log("Found nav items:", navItems.length)
  console.log("Found sections:", sections.length)

  navItems.forEach((item) => {
    item.addEventListener("click", function (e) {
      e.preventDefault()
      console.log("Nav item clicked:", this.getAttribute("data-section"))

      // Remove active class from all items and sections
      navItems.forEach((i) => {
        i.classList.remove("active")
      })

      sections.forEach((s) => {
        s.classList.remove("active")
      })

      // Add active class to clicked item
      this.classList.add("active")

      // Show corresponding section
      const sectionId = this.getAttribute("data-section")
      const section = document.getElementById(sectionId)
      if (section) {
        section.classList.add("active")
      } else {
        console.error("Section not found:", sectionId)
      }
    })
  })
}

// Setup modals
function setupModals() {
  const modalContainer = document.getElementById("modalContainer")
  const modals = document.querySelectorAll(".modal")
  const modalTriggers = {
    addDeviceBtn: "addDeviceModal",
    addServerBtn: "addServerModal",
    addAlertBtn: "addAlertModal",
  }

  // Setup modal triggers
  Object.keys(modalTriggers).forEach((triggerId) => {
    const trigger = document.getElementById(triggerId)
    const modalId = modalTriggers[triggerId]

    if (trigger) {
      trigger.addEventListener("click", () => {
        openModal(modalId)
      })
    }
  })

  // Close modal when clicking outside
  if (modalContainer) {
    modalContainer.addEventListener("click", (e) => {
      if (e.target === modalContainer) {
        closeAllModals()
      }
    })
  }

  // Setup close buttons
  const closeButtons = document.querySelectorAll(".modal-close, .modal-cancel")
  closeButtons.forEach((button) => {
    button.addEventListener("click", closeAllModals)
  })

  // Setup form submissions
  setupFormSubmissions()
}

// Open a modal
function openModal(modalId) {
  const modalContainer = document.getElementById("modalContainer")
  const modal = document.getElementById(modalId)

  if (modalContainer && modal) {
    modalContainer.classList.add("active")

    // Hide all modals first
    document.querySelectorAll(".modal").forEach((m) => {
      m.classList.remove("active")
    })

    // Show the requested modal
    modal.classList.add("active")
  }
}

// Close all modals
function closeAllModals() {
  const modalContainer = document.getElementById("modalContainer")

  if (modalContainer) {
    modalContainer.classList.remove("active")

    document.querySelectorAll(".modal").forEach((modal) => {
      modal.classList.remove("active")
    })
  }
}

// Setup form submissions
function setupFormSubmissions() {
  // Add Device Form
  const addDeviceForm = document.getElementById("addDeviceForm")
  if (addDeviceForm) {
    addDeviceForm.addEventListener("submit", function (e) {
      e.preventDefault()

      const formData = new FormData(this)
      const device = {
        name: formData.get("name"),
        protocol: formData.get("protocol"),
        address: formData.get("address"),
        port: formData.get("port") ? Number.parseInt(formData.get("port")) : null,
        dataTypes: Array.from(formData.getAll("dataTypes")),
        dataSizes: Array.from(formData.getAll("dataSizes")),
        config: formData.get("config") ? JSON.parse(formData.get("config")) : {},
        status: "offline",
      }

      addDevice(device)
    })
  }

  // Add Server Form
  const addServerForm = document.getElementById("addServerForm")
  if (addServerForm) {
    addServerForm.addEventListener("submit", function (e) {
      e.preventDefault()

      const formData = new FormData(this)
      const server = {
        name: formData.get("name"),
        type: formData.get("type"),
        host: formData.get("host"),
        port: Number.parseInt(formData.get("port")),
        username: formData.get("username"),
        password: formData.get("password"),
        database: formData.get("database"),
        topic: formData.get("topic"),
        endpoint: formData.get("endpoint"),
        enabled: formData.get("enabled") === "on",
      }

      addServer(server)
    })
  }

  // Add Alert Form
  const addAlertForm = document.getElementById("addAlertForm")
  if (addAlertForm) {
    addAlertForm.addEventListener("submit", function (e) {
      e.preventDefault()

      const formData = new FormData(this)
      const alert = {
        deviceId: formData.get("deviceId"),
        parameter: formData.get("parameter"),
        condition: formData.get("condition"),
        threshold: Number.parseFloat(formData.get("threshold")),
        severity: formData.get("severity"),
        message: formData.get("message"),
      }

      addAlert(alert)
    })
  }

  // Settings Form
  const settingsForm = document.getElementById("settingsForm")
  if (settingsForm) {
    settingsForm.addEventListener("submit", function (e) {
      e.preventDefault()

      const formData = new FormData(this)
      const settings = {
        theme: formData.get("theme"),
        refreshRate: formData.get("refreshRate"),
        dateFormat: formData.get("dateFormat"),
        timeFormat: formData.get("timeFormat"),
        language: formData.get("language"),
      }

      saveSettings(settings)
    })
  }

  // Profile Form
  const profileForm = document.getElementById("profileForm")
  if (profileForm) {
    profileForm.addEventListener("submit", function (e) {
      e.preventDefault()

      const formData = new FormData(this)
      const currentPassword = formData.get("currentPassword")
      const newPassword = formData.get("newPassword")
      const confirmPassword = formData.get("confirmPassword")

      if (newPassword !== confirmPassword) {
        alert("New passwords do not match")
        return
      }

      updatePassword(currentPassword, newPassword)
    })
  }

  // Protocol Settings Forms
  const protocolForms = document.querySelectorAll('[id$="SettingsForm"]')
  protocolForms.forEach((form) => {
    if (form) {
      form.addEventListener("submit", function (e) {
        e.preventDefault()

        const formData = new FormData(this)
        const formId = this.id
        const protocol = formId.replace("SettingsForm", "")

        // Convert form data to object
        const settings = {}
        for (const [key, value] of formData.entries()) {
          settings[key] = value
        }

        saveProtocolSettings(protocol, settings)
      })
    }
  })

  // Report Form
  const reportForm = document.getElementById("reportForm")
  if (reportForm) {
    reportForm.addEventListener("submit", function (e) {
      e.preventDefault()

      const formData = new FormData(this)
      const report = {
        type: formData.get("reportType"),
        deviceId: formData.get("reportDevice"),
        startDate: formData.get("reportStartDate"),
        endDate: formData.get("reportEndDate"),
        format: formData.get("reportFormat"),
      }

      generateReport(report)
    })
  }

  // MongoDB Query Form
  const runMongoQuery = document.getElementById("runMongoQuery")
  if (runMongoQuery) {
    runMongoQuery.addEventListener("click", () => {
      const query = document.getElementById("mongoQuery").value
      executeMongoQuery(query)
    })
  }

  // InfluxDB Query Form
  const runInfluxQuery = document.getElementById("runInfluxQuery")
  if (runInfluxQuery) {
    runInfluxQuery.addEventListener("click", () => {
      const query = document.getElementById("influxQuery").value
      executeInfluxQuery(query)
    })
  }
}

// Initialize charts
function initCharts() {
  // Check if Chart.js is loaded
  if (typeof Chart === "undefined") {
    console.error("Chart.js is not loaded")
    return
  }

  // Device Status Chart
  const deviceStatusCanvas = document.getElementById("deviceStatusCanvas")
  if (deviceStatusCanvas) {
    const ctx = deviceStatusCanvas.getContext("2d")
    window.deviceStatusChart = new Chart(ctx, {
      type: "doughnut",
      data: {
        labels: ["Online", "Offline", "Warning"],
        datasets: [
          {
            data: [0, 0, 0],
            backgroundColor: ["rgba(40, 167, 69, 0.7)", "rgba(220, 53, 69, 0.7)", "rgba(255, 193, 7, 0.7)"],
            borderColor: ["rgba(40, 167, 69, 1)", "rgba(220, 53, 69, 1)", "rgba(255, 193, 7, 1)"],
            borderWidth: 1,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: "bottom",
          },
        },
      },
    })
  }

  // Protocol Distribution Chart
  const protocolDistCanvas = document.getElementById("protocolDistCanvas")
  if (protocolDistCanvas) {
    const ctx = protocolDistCanvas.getContext("2d")
    window.protocolDistChart = new Chart(ctx, {
      type: "bar",
      data: {
        labels: ["Modbus", "CAN Bus", "MQTT", "HTTP", "I²C", "SPI", "Other"],
        datasets: [
          {
            label: "Devices by Protocol",
            data: [0, 0, 0, 0, 0, 0, 0],
            backgroundColor: "rgba(0, 123, 255, 0.7)",
            borderColor: "rgba(0, 123, 255, 1)",
            borderWidth: 1,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: false,
          },
        },
        scales: {
          y: {
            beginAtZero: true,
            ticks: {
              precision: 0,
            },
          },
        },
      },
    })
  }

  // Live Data Chart
  const liveDataCanvas = document.getElementById("liveDataCanvas")
  if (liveDataCanvas) {
    const ctx = liveDataCanvas.getContext("2d")
    window.liveDataChart = new Chart(ctx, {
      type: "line",
      data: {
        labels: [],
        datasets: [
          {
            label: "Data",
            data: [],
            borderColor: "rgba(0, 123, 255, 1)",
            backgroundColor: "rgba(0, 123, 255, 0.1)",
            borderWidth: 2,
            fill: false,
            tension: 0.4,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: "top",
          },
        },
        scales: {
          x: {
            type: "time",
            time: {
              unit: "minute",
            },
          },
          y: {
            beginAtZero: false,
          },
        },
      },
    })

    // Chart type switcher
    const chartTypeBtns = document.querySelectorAll(".chart-type-btn")
    chartTypeBtns.forEach((btn) => {
      btn.addEventListener("click", function () {
        chartTypeBtns.forEach((b) => b.classList.remove("active"))
        this.classList.add("active")

        const chartType = this.getAttribute("data-type")
        updateChartType(chartType)
      })
    })
  }

  // Correlation Chart
  const correlationCanvas = document.getElementById("correlationCanvas")
  if (correlationCanvas) {
    const ctx = correlationCanvas.getContext("2d")
    window.correlationChart = new Chart(ctx, {
      type: "scatter",
      data: {
        datasets: [
          {
            label: "Correlation",
            data: [],
            backgroundColor: "rgba(0, 123, 255, 0.7)",
            borderColor: "rgba(0, 123, 255, 1)",
            borderWidth: 1,
            pointRadius: 5,
            pointHoverRadius: 7,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: false,
          },
        },
        scales: {
          x: {
            title: {
              display: true,
              text: "Parameter 1",
            },
          },
          y: {
            title: {
              display: true,
              text: "Parameter 2",
            },
          },
        },
      },
    })
  }
}

// Update chart type
function updateChartType(type) {
  if (!window.liveDataChart) return

  const chart = window.liveDataChart

  // Save current data
  const data = chart.data.datasets[0].data
  const labels = chart.data.labels

  // Update chart type
  chart.config.type = type

  // Update fill option for area chart
  if (type === "area") {
    chart.config.type = "line" // Area is actually a line chart with fill
    chart.data.datasets[0].fill = true
  } else {
    chart.data.datasets[0].fill = false
  }

  // Restore data
  chart.data.datasets[0].data = data
  chart.data.labels = labels

  // Update chart
  chart.update()
}

// Setup other event listeners
function setupEventListeners() {
  // Logout button
  const logoutBtn = document.getElementById("logoutBtn")
  if (logoutBtn) {
    console.log("Found logout button")
    logoutBtn.addEventListener("click", () => {
      console.log("Logout button clicked")
      logout()
    })
  } else {
    console.error("Logout button not found")
  }

  // Refresh buttons
  const refreshOverview = document.getElementById("refreshOverview")
  if (refreshOverview) {
    refreshOverview.addEventListener("click", () => {
      console.log("Refresh overview clicked")
      loadServicesStatus()
      loadDevices() // To update device summary
    })
  }

  const refreshData = document.getElementById("refreshData")
  if (refreshData) {
    refreshData.addEventListener("click", () => {
      const deviceSelector = document.getElementById("deviceSelector")
      const dataTypeSelector = document.getElementById("dataTypeSelector")
      const timeRange = document.getElementById("timeRange")

      if (deviceSelector && deviceSelector.value) {
        loadDeviceData(deviceSelector.value, dataTypeSelector.value, timeRange.value)
      }
    })
  }

  // Device selector for data visualization
  const deviceSelector = document.getElementById("deviceSelector")
  const dataTypeSelector = document.getElementById("dataTypeSelector")
  const timeRange = document.getElementById("timeRange")

  if (deviceSelector && timeRange) {
    deviceSelector.addEventListener("change", function () {
      if (this.value) {
        loadDeviceData(this.value, dataTypeSelector.value, timeRange.value)
      } else {
        // Clear chart and table
        clearDataVisualization()
      }
    })

    dataTypeSelector.addEventListener("change", function () {
      if (deviceSelector.value) {
        loadDeviceData(deviceSelector.value, this.value, timeRange.value)
      }
    })

    timeRange.addEventListener("change", function () {
      if (deviceSelector.value) {
        loadDeviceData(deviceSelector.value, dataTypeSelector.value, this.value)
      }
    })
  }

  // Parameter selectors for correlation chart
  const param1Selector = document.getElementById("param1Selector")
  const param2Selector = document.getElementById("param2Selector")

  if (param1Selector && param2Selector) {
    param1Selector.addEventListener("change", updateCorrelationChart)
    param2Selector.addEventListener("change", updateCorrelationChart)
  }

  // Device search
  const deviceSearch = document.getElementById("deviceSearch")
  if (deviceSearch) {
    deviceSearch.addEventListener("input", function () {
      console.log("Device search input:", this.value)
      filterDevices(this.value)
    })
  }

  // Protocol filter
  const protocolFilter = document.getElementById("protocolFilter")
  if (protocolFilter) {
    protocolFilter.addEventListener("change", function () {
      filterDevicesByProtocol(this.value)
    })
  }

  // Alert filter
  const alertFilter = document.getElementById("alertFilter")
  if (alertFilter) {
    alertFilter.addEventListener("change", function () {
      filterAlerts(this.value)
    })
  }

  // Log filters
  const logTypeFilter = document.getElementById("logTypeFilter")
  if (logTypeFilter) {
    logTypeFilter.addEventListener("change", function () {
      filterLogs(this.value)
    })
  }

  const protocolLogFilter = document.getElementById("protocolLogFilter")
  if (protocolLogFilter) {
    protocolLogFilter.addEventListener("change", function () {
      filterProtocolLogs(this.value)
    })
  }

  // Log search
  const logSearch = document.getElementById("logSearch")
  if (logSearch) {
    logSearch.addEventListener("input", function () {
      searchLogs(this.value)
    })
  }

  // Clear logs button
  const clearLogs = document.getElementById("clearLogs")
  if (clearLogs) {
    clearLogs.addEventListener("click", () => {
      if (confirm("Are you sure you want to clear all logs?")) {
        clearAllLogs()
      }
    })
  }

  // Export buttons
  const exportDevicesBtn = document.getElementById("exportDevicesBtn")
  if (exportDevicesBtn) {
    exportDevicesBtn.addEventListener("click", () => {
      exportDevices()
    })
  }

  const exportDataBtn = document.getElementById("exportDataBtn")
  if (exportDataBtn) {
    exportDataBtn.addEventListener("click", () => {
      exportData()
    })
  }

  // Test connection buttons
  const testMongoConnection = document.getElementById("testMongoConnection")
  if (testMongoConnection) {
    testMongoConnection.addEventListener("click", () => {
      testMongoDbConnection()
    })
  }

  const testInfluxConnection = document.getElementById("testInfluxConnection")
  if (testInfluxConnection) {
    testInfluxConnection.addEventListener("click", () => {
      testInfluxDbConnection()
    })
  }
}

// Load services status
function loadServicesStatus() {
  const servicesStatus = document.getElementById("servicesStatus")
  const interfacesStatus = document.getElementById("interfacesStatus")

  if (servicesStatus) {
    servicesStatus.innerHTML = '<div class="loading">Loading system status...</div>'
  }

  if (interfacesStatus) {
    interfacesStatus.innerHTML = '<div class="loading">Loading interfaces...</div>'
  }

  fetch("/api/services")
    .then((response) => {
      if (!response.ok) {
        throw new Error("Network response was not ok")
      }
      return response.json()
    })
    .then((data) => {
      updateServicesStatus(data)
      updateInterfacesStatus(data)
      addActivityItem("System status updated")
    })
    .catch((error) => {
      console.error("Error loading services:", error)
      if (servicesStatus) {
        servicesStatus.innerHTML = '<div class="error">Error loading system status</div>'
      }
      if (interfacesStatus) {
        interfacesStatus.innerHTML = '<div class="error">Error loading interfaces</div>'
      }
    })
}

// Update services status
function updateServicesStatus(data) {
  const servicesStatus = document.getElementById("servicesStatus")

  if (!servicesStatus) return

  let html = ""

  // Filter out interfaces
  const services = Object.keys(data).filter((key) => !["can0", "i2c", "spi"].includes(key))

  if (services.length === 0) {
    html = '<div class="no-data">No services found</div>'
  } else {
    services.forEach((service) => {
      const status = data[service].status
      const statusClass = status === "active" ? "active" : "inactive"

      html += `
        <div class="status-item">
          <span class="status-name">${service}</span>
          <span class="status-value status-${statusClass}">
            <span class="status-indicator ${statusClass}"></span>
            ${status}
          </span>
        </div>
      `
    })
  }

  servicesStatus.innerHTML = html

  // Update database status
  const databaseStatus = document.getElementById("databaseStatus")
  if (databaseStatus) {
    let dbHtml = ""

    // MongoDB status
    const mongoStatus = data.mongod ? data.mongod.status : "inactive"
    const mongoStatusClass = mongoStatus === "active" ? "active" : "inactive"

    dbHtml += `
      <div class="status-item">
        <span class="status-name">MongoDB</span>
        <span class="status-value status-${mongoStatusClass}">
          <span class="status-indicator ${mongoStatusClass}"></span>
          ${mongoStatus === "active" ? "Active" : "Inactive"}
        </span>
      </div>
    `

    // InfluxDB status
    const influxStatus = data.influxdb ? data.influxdb.status : "inactive"
    const influxStatusClass = influxStatus === "active" ? "active" : "inactive"

    dbHtml += `
      <div class="status-item">
        <span class="status-name">InfluxDB</span>
        <span class="status-value status-${influxStatusClass}">
          <span class="status-indicator ${influxStatusClass}"></span>
          ${influxStatus === "active" ? "Active" : "Inactive"}
        </span>
      </div>
    `

    databaseStatus.innerHTML = dbHtml
  }
}

// Update interfaces status
function updateInterfacesStatus(data) {
  const interfacesStatus = document.getElementById("interfacesStatus")

  if (!interfacesStatus) return

  let html = ""

  // Filter only interfaces
  const interfaces = Object.keys(data).filter((key) => ["can0", "i2c", "spi"].includes(key))

  if (interfaces.length === 0) {
    html = '<div class="no-data">No interfaces found</div>'
  } else {
    interfaces.forEach((iface) => {
      const status = data[iface].status
      const statusClass = status === "active" ? "active" : "inactive"

      html += `
        <div class="status-item">
          <span class="status-name">${iface}</span>
          <span class="status-value status-${statusClass}">
            <span class="status-indicator ${statusClass}"></span>
            ${status}
          </span>
        </div>
      `
    })
  }

  interfacesStatus.innerHTML = html
}

// Load devices
function loadDevices() {
  const devicesTable = document.getElementById("devicesTable")
  const deviceSelector = document.getElementById("deviceSelector")
  const alertDevice = document.getElementById("alertDevice")
  const reportDevice = document.getElementById("reportDevice")

  if (devicesTable) {
    const tbody = devicesTable.querySelector("tbody")
    tbody.innerHTML = '<tr><td colspan="6" class="loading-cell">Loading devices...</td></tr>'
  }

  fetch("/api/devices")
    .then((response) => {
      if (!response.ok) {
        throw new Error("Network response was not ok")
      }
      return response.json()
    })
    .then((devices) => {
      updateDevicesTable(devices)
      updateDeviceSummary(devices)
      updateDeviceSelector(devices)
      updateDeviceStatusChart(devices)
      updateProtocolDistChart(devices)
      updateAlertDeviceSelector(devices)
      updateReportDeviceSelector(devices)
      addActivityItem("Devices loaded")
    })
    .catch((error) => {
      console.error("Error loading devices:", error)
      if (devicesTable) {
        const tbody = devicesTable.querySelector("tbody")
        tbody.innerHTML = '<tr><td colspan="6" class="error-cell">Error loading devices</td></tr>'
      }
    })
}

// Update devices table
function updateDevicesTable(devices) {
  const devicesTable = document.getElementById("devicesTable")

  if (!devicesTable) return

  const tbody = devicesTable.querySelector("tbody")

  if (devices.length === 0) {
    tbody.innerHTML = '<tr><td colspan="6" class="no-data-cell">No devices found</td></tr>'
    return
  }

  let html = ""

  devices.forEach((device) => {
    const lastSeen = device.lastSeen ? new Date(device.lastSeen).toLocaleString() : "Never"

    html += `
      <tr data-id="${device._id}" data-protocol="${device.protocol}">
        <td>${device.name}</td>
        <td>${device.protocol}</td>
        <td>${device.address}${device.port ? ":" + device.port : ""}</td>
        <td><span class="status-badge ${device.status}">${device.status}</span></td>
        <td>${lastSeen}</td>
        <td>
          <button class="btn-primary btn-edit" data-id="${device._id}"><i class="fas fa-edit"></i></button>
          <button class="btn-danger btn-delete" data-id="${device._id}"><i class="fas fa-trash"></i></button>
        </td>
      </tr>
    `
  })

  tbody.innerHTML = html

  // Add event listeners for edit and delete buttons
  const editButtons = tbody.querySelectorAll(".btn-edit")
  const deleteButtons = tbody.querySelectorAll(".btn-delete")

  editButtons.forEach((button) => {
    button.addEventListener("click", function () {
      const deviceId = this.getAttribute("data-id")
      editDevice(deviceId)
    })
  })

  deleteButtons.forEach((button) => {
    button.addEventListener("click", function () {
      const deviceId = this.getAttribute("data-id")
      deleteDevice(deviceId)
    })
  })
}

// Update device summary
function updateDeviceSummary(devices) {
  const totalDevices = document.getElementById("totalDevices")
  const onlineDevices = document.getElementById("onlineDevices")
  const offlineDevices = document.getElementById("offlineDevices")

  if (!totalDevices || !onlineDevices || !offlineDevices) return

  const total = devices.length
  const online = devices.filter((device) => device.status === "online").length
  const offline = total - online

  totalDevices.textContent = total
  onlineDevices.textContent = online
  offlineDevices.textContent = offline
}

// Update device selector
function updateDeviceSelector(devices) {
  const deviceSelector = document.getElementById("deviceSelector")

  if (!deviceSelector) return

  // Save current selection
  const currentValue = deviceSelector.value

  // Clear options except the first one
  while (deviceSelector.options.length > 1) {
    deviceSelector.remove(1)
  }

  // Add devices
  devices.forEach((device) => {
    const option = document.createElement("option")
    option.value = device._id
    option.textContent = device.name
    deviceSelector.appendChild(option)
  })

  // Restore selection if possible
  if (currentValue && Array.from(deviceSelector.options).some((option) => option.value === currentValue)) {
    deviceSelector.value = currentValue
  }
}

// Update alert device selector
function updateAlertDeviceSelector(devices) {
  const alertDevice = document.getElementById("alertDevice")

  if (!alertDevice) return

  // Save current selection
  const currentValue = alertDevice.value

  // Clear options except the first one
  while (alertDevice.options.length > 1) {
    alertDevice.remove(1)
  }

  // Add devices
  devices.forEach((device) => {
    const option = document.createElement("option")
    option.value = device._id
    option.textContent = device.name
    alertDevice.appendChild(option)
  })

  // Restore selection if possible
  if (currentValue && Array.from(alertDevice.options).some((option) => option.value === currentValue)) {
    alertDevice.value = currentValue
  }
}

// Update report device selector
function updateReportDeviceSelector(devices) {
  const reportDevice = document.getElementById("reportDevice")

  if (!reportDevice) return

  // Save current selection
  const currentValue = reportDevice.value

  // Clear options except the first one
  while (reportDevice.options.length > 1) {
    reportDevice.remove(1)
  }

  // Add devices
  devices.forEach((device) => {
    const option = document.createElement("option")
    option.value = device._id
    option.textContent = device.name
    reportDevice.appendChild(option)
  })

  // Restore selection if possible
  if (currentValue && Array.from(reportDevice.options).some((option) => option.value === currentValue)) {
    reportDevice.value = currentValue
  }
}

// Update device status chart
function updateDeviceStatusChart(devices) {
  if (!window.deviceStatusChart) return

  const online = devices.filter((device) => device.status === "online").length
  const warning = devices.filter((device) => device.status === "warning").length
  const offline = devices.filter((device) => device.status === "offline" || device.status === "error").length

  window.deviceStatusChart.data.datasets[0].data = [online, offline, warning]
  window.deviceStatusChart.update()
}

// Update protocol distribution chart
function updateProtocolDistChart(devices) {
  if (!window.protocolDistChart) return

  const protocols = ["modbus", "canbus", "mqtt", "http", "i2c", "spi"]
  const counts = protocols.map((protocol) => devices.filter((device) => device.protocol === protocol).length)

  // Count other protocols
  const otherCount = devices.filter((device) => !protocols.includes(device.protocol)).length
  counts.push(otherCount)

  window.protocolDistChart.data.datasets[0].data = counts
  window.protocolDistChart.update()
}

// Filter devices by search term
function filterDevices(query) {
  const devicesTable = document.getElementById("devicesTable")

  if (!devicesTable) return

  const rows = devicesTable.querySelectorAll("tbody tr")

  if (!query) {
    // Show all rows
    rows.forEach((row) => {
      row.style.display = ""
    })
    return
  }

  query = query.toLowerCase()

  rows.forEach((row) => {
  if (!query) {
    // Show all rows
    rows.forEach((row) => {
      row.style.display = ""
    })
    return
  }

  query = query.toLowerCase()

  rows.forEach((row) => {
    const text = row.textContent.toLowerCase()
    if (text.includes(query)) {
      row.style.display = ""
    } else {
      row.style.display = "none"
    }
  })
}

// Filter devices by protocol\
function filterDevicesByProtocol(protocol) {
  const devicesTable = document.getElementById("devicesTable")

  if (!devicesTable) return

  const rows = devicesTable.querySelectorAll("tbody tr")

  if (!protocol) {
    // Show all rows
    rows.forEach((row) => {
      row.style.display = ""
    })
    return
  }

  rows.forEach((row) => {
    const rowProtocol = row.getAttribute("data-protocol")
    if (rowProtocol === protocol) {
      row.style.display = ""
    } else {
      row.style.display = "none"
    }
  })
}

// Filter alerts
function filterAlerts(filter) {
  const alertsTable = document.getElementById("alertsTable")

  if (!alertsTable) return

  const rows = alertsTable.querySelectorAll("tbody tr")

  if (filter === "all") {
    // Show all rows
    rows.forEach((row) => {
      row.style.display = ""
    })
    return
  }

  rows.forEach((row) => {
    const status = row.getAttribute("data-status")
    const severity = row.getAttribute("data-severity")

    if (
      (filter === "active" && status === "active") ||
      (filter === "resolved" && status === "resolved") ||
      (filter === "critical" && severity === "critical") ||
      (filter === "warning" && severity === "warning") ||
      (filter === "info" && severity === "info")
    ) {
      row.style.display = ""
    } else {
      row.style.display = "none"
    }
  })
}

// Filter logs
function filterLogs(type) {
  const logEntries = document.querySelectorAll("#systemLogs .log-entry")

  if (type === "all") {
    // Show all logs
    logEntries.forEach((entry) => {
      entry.style.display = ""
    })
    return
  }

  logEntries.forEach((entry) => {
    const logLevel = entry.querySelector(".log-level")
    if (!logLevel) {
      entry.style.display = "none"
      return
    }

    const level = logLevel.classList.contains(type)

    if (level) {
      entry.style.display = ""
    } else {
      entry.style.display = "none"
    }
  })
}

// Filter protocol logs
function filterProtocolLogs(protocol) {
  const logEntries = document.querySelectorAll("#protocolLogs .log-entry")

  if (protocol === "all") {
    // Show all logs
    logEntries.forEach((entry) => {
      entry.style.display = ""
    })
    return
  }

  logEntries.forEach((entry) => {
    const logProtocol = entry.querySelector(".log-protocol")
    if (!logProtocol) {
      entry.style.display = "none"
      return
    }

    const protocolText = logProtocol.textContent.toLowerCase()

    if (protocolText.includes(protocol.toLowerCase())) {
      entry.style.display = ""
    } else {
      entry.style.display = "none"
    }
  })
}

// Search logs
function searchLogs(query) {
  const logEntries = document.querySelectorAll(".log-entry")

  if (!query) {
    // Show all logs
    logEntries.forEach((entry) => {
      entry.style.display = ""
    })
    return
  }

  query = query.toLowerCase()

  logEntries.forEach((entry) => {
    const text = entry.textContent.toLowerCase()
    if (text.includes(query)) {
      entry.style.display = ""
    } else {
      entry.style.display = "none"
    }
  })
}

// Clear all logs
function clearAllLogs() {
  const systemLogs = document.getElementById("systemLogs")
  const protocolLogs = document.getElementById("protocolLogs")

  if (systemLogs) {
    systemLogs.innerHTML = ""
  }

  if (protocolLogs) {
    protocolLogs.innerHTML = ""
  }

  addActivityItem("Logs cleared")
}

// Load servers
function loadServers() {
  const serversTable = document.getElementById("serversTable")

  if (serversTable) {
    const tbody = serversTable.querySelector("tbody")
    tbody.innerHTML = '<tr><td colspan="5" class="loading-cell">Loading servers...</td></tr>'
  }

  fetch("/api/servers")
    .then((response) => {
      if (!response.ok) {
        throw new Error("Network response was not ok")
      }
      return response.json()
    })
    .then((servers) => {
      updateServersTable(servers)
      addActivityItem("Servers loaded")
    })
    .catch((error) => {
      console.error("Error loading servers:", error)
      if (serversTable) {
        const tbody = serversTable.querySelector("tbody")
        tbody.innerHTML = '<tr><td colspan="5" class="error-cell">Error loading servers</td></tr>'
      }
    })
}

// Update servers table
function updateServersTable(servers) {
  const serversTable = document.getElementById("serversTable")

  if (!serversTable) return

  const tbody = serversTable.querySelector("tbody")

  if (servers.length === 0) {
    tbody.innerHTML = '<tr><td colspan="5" class="no-data-cell">No servers found</td></tr>'
    return
  }

  let html = ""

  servers.forEach((server) => {
    html += `
      <tr data-id="${server._id}">
        <td>${server.name}</td>
        <td>${server.type}</td>
        <td>${server.host}:${server.port}</td>
        <td><span class="status-badge ${server.enabled ? "online" : "offline"}">${server.enabled ? "Enabled" : "Disabled"}</span></td>
        <td>
          <button class="btn-primary btn-edit" data-id="${server._id}"><i class="fas fa-edit"></i></button>
          <button class="btn-danger btn-delete" data-id="${server._id}"><i class="fas fa-trash"></i></button>
        </td>
      </tr>
    `
  })

  tbody.innerHTML = html

  // Add event listeners for edit and delete buttons
  const editButtons = tbody.querySelectorAll(".btn-edit")
  const deleteButtons = tbody.querySelectorAll(".btn-delete")

  editButtons.forEach((button) => {
    button.addEventListener("click", function () {
      const serverId = this.getAttribute("data-id")
      editServer(serverId)
    })
  })

  deleteButtons.forEach((button) => {
    button.addEventListener("click", function () {
      const serverId = this.getAttribute("data-id")
      deleteServer(serverId)
    })
  })
}

// Load device data
function loadDeviceData(deviceId, dataType, timeRange) {
  const dataChart = document.getElementById("dataChart")
  const dataTable = document.getElementById("dataTable")

  if (dataChart) {
    dataChart.querySelector(".no-data-message").style.display = "none"
  }

  if (dataTable) {
    const tbody = dataTable.querySelector("tbody")
    tbody.innerHTML = '<tr><td colspan="5" class="loading-cell">Loading data...</td></tr>'
  }

  // Convert time range to start time
  let start
  switch (timeRange) {
    case "1m":
      start = "-1m"
      break
    case "5m":
      start = "-5m"
      break
    case "15m":
      start = "-15m"
      break
    case "1h":
      start = "-1h"
      break
    case "6h":
      start = "-6h"
      break
    case "24h":
      start = "-24h"
      break
    case "7d":
      start = "-7d"
      break
    case "30d":
      start = "-30d"
      break
    default:
      start = "-1h"
  }

  fetch(`/api/data/${deviceId}?start=${start}&dataType=${dataType || ""}`)
    .then((response) => {
      if (!response.ok) {
        throw new Error("Network response was not ok")
      }
      return response.json()
    })
    .then((data) => {
      updateDataChart(data, dataType)
      updateDataTable(data)
      addActivityItem(`Data loaded for device ${deviceId}`)
    })
    .catch((error) => {
      console.error("Error loading device data:", error)
      if (dataTable) {
        const tbody = dataTable.querySelector("tbody")
        tbody.innerHTML = '<tr><td colspan="5" class="error-cell">Error loading data</td></tr>'
      }
    })
}

// Update data chart
function updateDataChart(data, dataType) {
  if (!window.liveDataChart || !data || data.length === 0) {
    return
  }

  const chart = window.liveDataChart

  // Filter by data type if specified
  if (dataType) {
    data = data.filter((item) => item.dataType === dataType)
  }

  // Sort data by time
  data.sort((a, b) => new Date(a._time) - new Date(b._time))

  // Extract labels (time) and values
  const labels = data.map((item) => new Date(item._time))
  const values = data.map((item) => item._value)

  // Update chart data
  chart.data.labels = labels
  chart.data.datasets[0].data = values

  // Update dataset label
  const deviceSelector = document.getElementById("deviceSelector")
  const deviceName = deviceSelector ? deviceSelector.options[deviceSelector.selectedIndex].text : "Device"
  const paramName = dataType || "All Parameters"
  chart.data.datasets[0].label = `${deviceName} - ${paramName}`

  // Update chart
  chart.update()
}

// Update data table
function updateDataTable(data) {
  const dataTable = document.getElementById("dataTable")

  if (!dataTable || !data) return

  const tbody = dataTable.querySelector("tbody")

  if (data.length === 0) {
    tbody.innerHTML = '<tr><td colspan="5" class="no-data-cell">No data available</td></tr>'
    return
  }

  // Sort data by time (newest first)
  data.sort((a, b) => new Date(b._time) - new Date(a._time))

  let html = ""

  data.forEach((item) => {
    const time = new Date(item._time).toLocaleString()
    const deviceName = item.deviceId || "Unknown"
    const dataType = item.dataType || "Unknown"
    const value = item._value !== undefined ? item._value : "N/A"
    const unit = getUnitForDataType(dataType)

    html += `
      <tr>
        <td>${time}</td>
        <td>${deviceName}</td>
        <td>${dataType}</td>
        <td>${value}</td>
        <td>${unit}</td>
      </tr>
    `
  })

  tbody.innerHTML = html
}

// Get unit for data type
function getUnitForDataType(dataType) {
  switch (dataType) {
    case "temperature":
      return "°C"
    case "humidity":
      return "%"
    case "pressure":
      return "hPa"
    case "voltage":
      return "V"
    case "current":
      return "A"
    case "flow":
      return "L/min"
    case "level":
      return "%"
    case "speed":
      return "RPM"
    case "position":
      return "mm"
    default:
      return ""
  }
}

// Clear data visualization
function clearDataVisualization() {
  if (window.liveDataChart) {
    window.liveDataChart.data.labels = []
    window.liveDataChart.data.datasets[0].data = []
    window.liveDataChart.update()
  }

  const dataTable = document.getElementById("dataTable")
  if (dataTable) {
    const tbody = dataTable.querySelector("tbody")
    tbody.innerHTML = '<tr><td colspan="5" class="no-data-cell">No data available</td></tr>'
  }

  const dataChart = document.getElementById("dataChart")
  if (dataChart) {
    dataChart.querySelector(".no-data-message").style.display = "block"
  }
}

// Update correlation chart
function updateCorrelationChart() {
  const param1Selector = document.getElementById("param1Selector")
  const param2Selector = document.getElementById("param2Selector")
  const deviceSelector = document.getElementById("deviceSelector")

  if (
    !param1Selector ||
    !param2Selector ||
    !deviceSelector ||
    !deviceSelector.value ||
    !param1Selector.value ||
    !param2Selector.value
  ) {
    return
  }

  const deviceId = deviceSelector.value
  const param1 = param1Selector.value
  const param2 = param2Selector.value

  // Fetch data for both parameters
  Promise.all([
    fetch(`/api/data/${deviceId}?dataType=${param1}`).then((res) => res.json()),
    fetch(`/api/data/${deviceId}?dataType=${param2}`).then((res) => res.json()),
  ])
    .then(([data1, data2]) => {
      // Create a map of timestamps to values for param1
      const param1Map = new Map()
      data1.forEach((item) => {
        param1Map.set(item._time, item._value)
      })

      // Create correlation data points where we have both parameters
      const correlationData = []
      data2.forEach((item) => {
        if (param1Map.has(item._time)) {
          correlationData.push({
            x: param1Map.get(item._time),
            y: item._value,
          })
        }
      })

      // Update chart
      if (window.correlationChart) {
        window.correlationChart.data.datasets[0].data = correlationData
        window.correlationChart.options.scales.x.title.text = param1
        window.correlationChart.options.scales.y.title.text = param2
        window.correlationChart.update()
      }
    })
    .catch((error) => {
      console.error("Error loading correlation data:", error)
    })
}

// Add device
function addDevice(device) {
  fetch("/api/devices", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(device),
  })
    .then((response) => {
      if (!response.ok) {
        throw new Error("Network response was not ok")
      }
      return response.json()
    })
    .then((data) => {
      closeAllModals()
      loadDevices()
      addActivityItem(`Device "${device.name}" added`)
    })
    .catch((error) => {
      console.error("Error adding device:", error)
      alert("Error adding device")
    })
}

// Edit device
function editDevice(deviceId) {
  // In a real app, you would fetch the device details and show an edit form
  console.log("Edit device:", deviceId)
  alert("Edit device functionality not implemented yet")
}

// Delete device
function deleteDevice(deviceId) {
  if (!confirm("Are you sure you want to delete this device?")) {
    return
  }

  fetch(`/api/devices/${deviceId}`, {
    method: "DELETE",
  })
    .then((response) => {
      if (!response.ok) {
        throw new Error("Network response was not ok")
      }
      return response.json()
    })
    .then((data) => {
      loadDevices()
      addActivityItem("Device deleted")
    })
    .catch((error) => {
      console.error("Error deleting device:", error)
      alert("Error deleting device")
    })
}

// Add server
function addServer(server) {
  fetch("/api/servers", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(server),
  })
    .then((response) => {
      if (!response.ok) {
        throw new Error("Network response was not ok")
      }
      return response.json()
    })
    .then((data) => {
      closeAllModals()
      loadServers()
      addActivityItem(`Server "${server.name}" added`)
    })
    .catch((error) => {
      console.error("Error adding server:", error)
      alert("Error adding server")
    })
}

// Edit server
function editServer(serverId) {
  // In a real app, you would fetch the server details and show an edit form
  console.log("Edit server:", serverId)
  alert("Edit server functionality not implemented yet")
}

// Delete server
function deleteServer(serverId) {
  if (!confirm("Are you sure you want to delete this server?")) {
    return
  }

  fetch(`/api/servers/${serverId}`, {
    method: "DELETE",
  })
    .then((response) => {
      if (!response.ok) {
        throw new Error("Network response was not ok")
      }
      return response.json()
    })
    .then((data) => {
      loadServers()
      addActivityItem("Server deleted")
    })
    .catch((error) => {
      console.error("Error deleting server:", error)
      alert("Error deleting server")
    })
}

// Add alert
function addAlert(alert) {
  // In a real app, you would send this to the server
  console.log("Add alert:", alert)

  // Simulate adding an alert
  const alertsTable = document.getElementById("alertsTable")
  if (alertsTable) {
    const tbody = alertsTable.querySelector("tbody")

    // Clear "no data" message if present
    if (tbody.querySelector(".no-data-cell")) {
      tbody.innerHTML = ""
    }

    // Create a new row
    const tr = document.createElement("tr")
    tr.setAttribute("data-status", "active")
    tr.setAttribute("data-severity", alert.severity)

    const time = new Date().toLocaleString()
    const deviceName =
      document.getElementById("alertDevice").options[document.getElementById("alertDevice").selectedIndex].text

    tr.innerHTML = `
      <td>${time}</td>
      <td>${deviceName}</td>
      <td>${alert.parameter}</td>
      <td><span class="status-badge ${alert.severity}">${alert.severity}</span></td>
      <td>${alert.message}</td>
      <td>
        <button class="btn-primary btn-sm"><i class="fas fa-check"></i> Resolve</button>
      </td>
    `

    tbody.insertBefore(tr, tbody.firstChild)

    // Add event listener for resolve button
    const resolveBtn = tr.querySelector("button")
    resolveBtn.addEventListener("click", function () {
      tr.setAttribute("data-status", "resolved")
      tr.querySelector("td:nth-child(4) .status-badge").className = "status-badge offline"
      tr.querySelector("td:nth-child(4) .status-badge").textContent = "resolved"
      this.disabled = true
      addActivityItem(`Alert resolved for ${deviceName}`)
    })
  }

  closeAllModals()
  addActivityItem(
    `Alert added for ${document.getElementById("alertDevice").options[document.getElementById("alertDevice").selectedIndex].text}`,
  )
}

// Update password
function updatePassword(currentPassword, newPassword) {
  // In a real app, you would send this to the server
  console.log("Update password:", currentPassword, newPassword)
  alert("Password updated successfully")
}

// Save settings
function saveSettings(settings) {
  // Save settings to localStorage
  localStorage.setItem("settings", JSON.stringify(settings))

  // Apply settings
  applySettings()

  alert("Settings saved")
  addActivityItem("Application settings updated")
}

// Apply settings
function applySettings() {
  // Get settings from localStorage
  const settingsJson = localStorage.getItem("settings")

  if (!settingsJson) return

  const settings = JSON.parse(settingsJson)

  // Apply theme
  if (settings.theme) {
    document.documentElement.setAttribute("data-theme", settings.theme)

    // Update theme selector
    const themeSelector = document.getElementById("theme")
    if (themeSelector) {
      themeSelector.value = settings.theme
    }
  }

  // Apply refresh rate
  if (settings.refreshRate) {
    // Update refresh rate selector
    const refreshRateSelector = document.getElementById("refreshRate")
    if (refreshRateSelector) {
      refreshRateSelector.value = settings.refreshRate
    }
  }

  // Apply date format
  if (settings.dateFormat) {
    // Update date format selector
    const dateFormatSelector = document.getElementById("dateFormat")
    if (dateFormatSelector) {
      dateFormatSelector.value = settings.dateFormat
    }
  }

  // Apply time format
  if (settings.timeFormat) {
    // Update time format selector
    const timeFormatSelector = document.getElementById("timeFormat")
    if (timeFormatSelector) {
      timeFormatSelector.value = settings.timeFormat
    }
  }

  // Apply language
  if (settings.language) {
    // Update language selector
    const languageSelector = document.getElementById("language")
    if (languageSelector) {
      languageSelector.value = settings.language
    }
  }
}

// Save protocol settings
function saveProtocolSettings(protocol, settings) {
  // In a real app, you would send this to the server
  console.log(`Save ${protocol} settings:`, settings)
  alert(`${protocol.toUpperCase()} settings saved`)
  addActivityItem(`${protocol.toUpperCase()} protocol settings updated`)
}

// Generate report
function generateReport(report) {
  // In a real app, you would send this to the server
  console.log("Generate report:", report)

  // Simulate generating a report
  const reportsTable = document.getElementById("reportsTable")
  if (reportsTable) {
    const tbody = reportsTable.querySelector("tbody")

    // Clear "no data" message if present
    if (tbody.querySelector(".no-data-cell")) {
      tbody.innerHTML = ""
    }

    // Create a new row
    const tr = document.createElement("tr")

    const time = new Date().toLocaleString()
    const deviceName = report.deviceId
      ? document.getElementById("reportDevice").options[document.getElementById("reportDevice").selectedIndex].text
      : "All Devices"

    tr.innerHTML = `
      <td>${time}</td>
      <td>${report.type.replace("_", " ")}</td>
      <td>admin</td>
      <td>${report.format.toUpperCase()}</td>
      <td>
        <button class="btn-primary btn-sm"><i class="fas fa-download"></i> Download</button>
        <button class="btn-danger btn-sm"><i class="fas fa-trash"></i></button>
      </td>
    `

    tbody.insertBefore(tr, tbody.firstChild)

    // Add event listeners for buttons
    const downloadBtn = tr.querySelector(".btn-primary")
    const deleteBtn = tr.querySelector(".btn-danger")

    downloadBtn.addEventListener("click", () => {
      alert(`Downloading ${report.type} report in ${report.format.toUpperCase()} format`)
    })

    deleteBtn.addEventListener("click", () => {
      if (confirm("Are you sure you want to delete this report?")) {
        tr.remove()
        addActivityItem("Report deleted")
      }
    })
  }

  alert("Report generated successfully")
  addActivityItem(`${report.type.replace("_", " ")} report generated`)
}

// Execute MongoDB query
function executeMongoQuery(query) {
  // In a real app, you would send this to the server
  console.log("Execute MongoDB query:", query)

  const resultContainer = document.getElementById("mongoQueryResult")
  if (resultContainer) {
    resultContainer.innerHTML = '<div class="loading">Executing query...</div>'

    // Simulate query execution
    setTimeout(() => {
      resultContainer.innerHTML = `
        <pre>{
  "result": [
    {
      "_id": "60d21b4667d0d8992e610c85",
      "name": "Temperature Sensor",
      "protocol": "modbus",
      "address": "192.168.1.100",
      "port": 502,
      "status": "online"
    },
    {
      "_id": "60d21b4667d0d8992e610c86",
      "name": "Pressure Sensor",
      "protocol": "canbus",
      "address": "0x123",
      "status": "offline"
    }
  ],
  "count": 2
}</pre>
      `
    }, 1000)
  }

  addActivityItem("MongoDB query executed")
}

// Execute InfluxDB query
function executeInfluxQuery(query) {
  // In a real app, you would send this to the server
  console.log("Execute InfluxDB query:", query)

  const resultContainer = document.getElementById("influxQueryResult")
  if (resultContainer) {
    resultContainer.innerHTML = '<div class="loading">Executing query...</div>'

    // Simulate query execution
    setTimeout(() => {
      resultContainer.innerHTML = `
        <pre>[
  {
    "_time": "2025-04-03T09:00:00Z",
    "_measurement": "device_data",
    "deviceId": "60d21b4667d0d8992e610c85",
    "dataType": "temperature",
    "_value": 25.4
  },
  {
    "_time": "2025-04-03T09:01:00Z",
    "_measurement": "device_data",
    "deviceId": "60d21b4667d0d8992e610c85",
    "dataType": "temperature",
    "_value": 25.6
  },
  {
    "_time": "2025-04-03T09:02:00Z",
    "_measurement": "device_data",
    "deviceId": "60d21b4667d0d8992e610c85",
    "dataType": "temperature",
    "_value": 25.8
  }
]</pre>
      `
    }, 1000)
  }

  addActivityItem("InfluxDB query executed")
}

// Test MongoDB connection
function testMongoDbConnection() {
  const host = document.getElementById("mongoHost").value
  const port = document.getElementById("mongoPort").value
  const database = document.getElementById("mongoDatabase").value

  // In a real app, you would send this to the server
  console.log("Test MongoDB connection:", host, port, database)

  // Simulate connection test
  setTimeout(() => {
    alert("MongoDB connection successful")
  }, 1000)
}

// Test InfluxDB connection
function testInfluxDbConnection() {
  const url = document.getElementById("influxUrl").value
  const token = document.getElementById("influxToken").value
  const org = document.getElementById("influxOrg").value
  const bucket = document.getElementById("influxBucket").value

  // In a real app, you would send this to the server
  console.log("Test InfluxDB connection:", url, token, org, bucket)

  // Simulate connection test
  setTimeout(() => {
    alert("InfluxDB connection successful")
  }, 1000)
}

// Export devices
function exportDevices() {
  // In a real app, you would send this to the server
  console.log("Export devices")

  // Simulate export
  setTimeout(() => {
    const a = document.createElement("a")
    a.href =
      "data:text/csv;charset=utf-8,Name,Protocol,Address,Status,Last Seen\nTemperature Sensor,modbus,192.168.1.100:502,online,2025-04-03 09:00:00\nPressure Sensor,canbus,0x123,offline,Never"
    a.download = "devices.csv"
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
  }, 1000)

  addActivityItem("Devices exported")
}

// Export data
function exportData() {
  // In a real app, you would send this to the server
  console.log("Export data")

  // Simulate export
  setTimeout(() => {
    const a = document.createElement("a")
    a.href =
      "data:text/csv;charset=utf-8,Time,Device,Data Type,Value,Unit\n2025-04-03 09:00:00,Temperature Sensor,temperature,25.4,°C\n2025-04-03 09:01:00,Temperature Sensor,temperature,25.6,°C\n2025-04-03 09:02:00,Temperature Sensor,temperature,25.8,°C"
    a.download = "device_data.csv"
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
  }, 1000)

  addActivityItem("Data exported")
}

// Add activity item
function addActivityItem(text) {
  const activityList = document.getElementById("activityList");
  
  if (!activityList) return;
  
  const now = new Date();
  const timeString = now.toLocaleTimeString();
  
  const li = document.createElement("li");
  li.className = "activity-item";
  li.innerHTML = `
    <span class="activity-time">${timeString}</span>
    <span class="activity-text">${text}</span>
  `;
  
  // Add to the beginning of the list
  activityList.insertBefore(li, activityList.firstChild);
  
  // Limit to 10 items
  while (activityList.children.length > 10) {
    activityList.removeChild(activityList.lastChild);
  }
}

// Update current time
function updateCurrentTime() {
  const currentTime = document.getElementById("current-time")

  if (currentTime) {
    const now = new Date()
    currentTime.textContent = now.toLocaleString()
  }
}

// Setup logout button
function setupLogout() {
  const logoutBtn = document.getElementById("logoutBtn");
  
  if (logoutBtn) {
    console.log("Found logout button");
    
    logoutBtn.addEventListener("click", () => {
      console.log("Logout button clicked");
      // Simple redirect for now
      window.location.href = "/";
    });
  } else {
    console.error("Logout button not found");
  }
}

// Logout
function logout() {
  console.log("Logging out...")
  fetch("/api/logout", {
    method: "POST",
  })
    .then((response) => {
      console.log("Logout response:", response.status)
      // Redirect to login page regardless of response
      window.location.href = "/"
    })
    .catch((error) => {
      console.error("Logout error:", error)
      // Still redirect to login page on error
      window.location.href = "/"
    })
}

// Setup protocol tabs
function setupProtocolTabs() {
  const tabItems = document.querySelectorAll(".tab-item");
  const tabPanes = document.querySelectorAll(".tab-pane");
  
  console.log("Found tab items:", tabItems.length);
  console.log("Found tab panes:", tabPanes.length);
  
  tabItems.forEach((item) => {
    item.addEventListener("click", function() {
      const tabId = this.getAttribute("data-tab");
      console.log("Tab clicked:", tabId);
      
      // Remove active class from all tabs
      tabItems.forEach((tab) => {
        tab.classList.remove("active");
      });
      
      tabPanes.forEach((pane) => {
        pane.classList.remove("active");
      });
      
      // Add active class to clicked tab
      this.classList.add("active");
      
      // Show corresponding tab pane
      const tabPane = document.getElementById(tabId + "-tab");
      if (tabPane) {
        tabPane.classList.add("active");
      } else {
        console.error("Tab pane not found:", tabId + "-tab");
      }
    });
  });
}

// Declare setupTabs function
function setupTabs() {
  // Implementation of setupTabs function
  console.log("Setting up tabs...")
}

