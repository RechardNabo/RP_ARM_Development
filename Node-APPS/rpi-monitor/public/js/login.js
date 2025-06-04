document.addEventListener("DOMContentLoaded", () => {
  const loginForm = document.getElementById("loginForm") || document.querySelector("form")

  if (loginForm) {
    loginForm.addEventListener("submit", async (e) => {
      e.preventDefault()

      const usernameInput = document.getElementById("username") || document.querySelector('input[name="username"]')
      const passwordInput = document.getElementById("password") || document.querySelector('input[name="password"]')

      if (!usernameInput || !passwordInput) {
        alert("Form inputs not found")
        return
      }

      const username = usernameInput.value
      const password = passwordInput.value

      try {
        const response = await fetch("/api/login", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ username, password }),
        })

        const data = await response.json()

        if (response.ok && data.success) {
          // Successful login - redirect to dashboard
          window.location.href = "/dashboard.html"
        } else {
          // Failed login
          alert("Login failed: " + (data.error || "Invalid credentials"))
        }
      } catch (error) {
        console.error("Login error:", error)
        alert("Login failed. Please try again.")
      }
    })
  } else {
    console.error("Login form not found")
  }
})

