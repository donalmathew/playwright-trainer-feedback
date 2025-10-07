import {
  auth,
  login as firebaseLogin,
  logout as firebaseLogout,
  signup, saveUserProfile
} from "./firebase.js";

// Remove this after Firebase integration is complete
const validCredentials = {
  username: "admin",
  password: "password123",
};

document.addEventListener("DOMContentLoaded", function () {
  const loginForm = document.getElementById("loginForm");
  const signupForm = document.getElementById("signupForm");
  const showSignup = document.getElementById("showSignup");
  const showLogin = document.getElementById("showLogin");

  // Switch between login/signup forms
  if (showSignup) {
    showSignup.addEventListener("click", (e) => {
      e.preventDefault();
      loginForm.style.display = "none";
      signupForm.style.display = "block";
    });
  }
  if (showLogin) {
    showLogin.addEventListener("click", (e) => {
      e.preventDefault();
      signupForm.style.display = "none";
      loginForm.style.display = "block";
    });
  }

  // Handle signup
  if (signupForm) {
    signupForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      const name = document.getElementById("signupName").value;
      const email = document.getElementById("signupEmail").value;
      const password = document.getElementById("signupPassword").value;
      const role = "Admin";

      try {
        const user = await signup(email, password); // firebase.js function
        await saveUserProfile(user.uid, name, role, "", email); 
        alert("✅ Account created successfully! Please log in.");
        signupForm.reset();
        signupForm.style.display = "none";
        loginForm.style.display = "block";
      } catch (err) {
        alert("❌ Signup failed: " + err.message);
      }
    });
  }
});


document.addEventListener("DOMContentLoaded", function () {
  const loginForm = document.getElementById("loginForm");
  const mainApp = document.querySelector(".main-app");
  const loginContainer = document.querySelector(".login-container");

  // Check if user is already logged in
  if (sessionStorage.getItem("isLoggedIn")) {
    showApp();
  } else {
    showLogin();
  }

  loginForm.addEventListener("submit", async function (e) {
    e.preventDefault();

    const username = document.getElementById("username").value;
    const password = document.getElementById("password").value;

    // First try temporary login
    console.log("Attempting login with:", { username, password });
    if (
      username === validCredentials.username &&
      password === validCredentials.password
    ) {
      console.log("Temporary login successful");
      sessionStorage.setItem("isLoggedIn", "true");
      showApp();
      return;
    }
    console.log("Temporary login failed");

    // If temporary login fails, try Firebase
    try {
      // Firebase authentication (only if config is set up)
      if (auth.app.options.apiKey) {
        await firebaseLogin(username, password);
        sessionStorage.setItem("isLoggedIn", "true");
        showApp();
      } else {
        alert("Invalid credentials. Please try again.");
      }
    } catch (error) {
      alert("Invalid credentials. Please try again.");
      console.error("Login error:", error);
    }
  });

  // Handle logout
  document
    .querySelector(".logout")
    .addEventListener("click", async function (e) {
      e.preventDefault();
      try {
        await firebaseLogout();
        sessionStorage.removeItem("isLoggedIn");
        showLogin();
      } catch (error) {
        console.error("Logout error:", error);
        alert("Error logging out. Please try again.");
      }
    });

  function showApp() {
    console.log("Showing app");
    if (!mainApp) {
      console.error("mainApp element not found");
      return;
    }
    loginContainer.style.display = "none";
    mainApp.style.display = "block";
  }

  function showLogin() {
    console.log("Showing login");
    if (!loginContainer) {
      console.error("loginContainer element not found");
      return;
    }
    loginContainer.style.display = "flex";
    mainApp.style.display = "none";
  }

  // Sidebar functionality
  const sidebarLinks = document.querySelectorAll(".sidebar-menu li a");

  sidebarLinks.forEach((link) => {
    link.addEventListener("click", function (e) {
      // Remove active class from all links
      sidebarLinks.forEach((l) => l.parentElement.classList.remove("active"));
      // Add active class to clicked link
      this.parentElement.classList.add("active");

      // If it's a section link, scroll to that section
      if (this.getAttribute("href").startsWith("#")) {
        e.preventDefault();
        const targetId = this.getAttribute("href").substring(1);
        const targetElement = document.getElementById(targetId);
        if (targetElement) {
          targetElement.scrollIntoView({ behavior: "smooth" });
        }
      }
    });
  });
});
