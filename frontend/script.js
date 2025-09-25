const API_BASE = "http://localhost:5000/api"; // backend URL

document.addEventListener("DOMContentLoaded", () => {
  /* ------------------ SIGNUP ------------------ */
  const signupForm = document.getElementById("signupForm");
  if (signupForm) {
    signupForm.addEventListener("submit", async (e) => {
      e.preventDefault();

      const name = document.getElementById("name").value.trim();
      const username = document.getElementById("username").value.trim();
      const email = document.getElementById("email").value.trim();
      const phone = document.getElementById("phone").value.trim();
      const password = document.getElementById("password").value;
      const confirmPassword = document.getElementById("confirmPassword").value;
      const message = document.getElementById("message");

      if (password !== confirmPassword) {
        message.textContent = "Passwords do not match!";
        return;
      }

      try {
        const res = await fetch(`${API_BASE}/auth/register`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name: name, username, email, phone, password }),
        });

        const data = await res.json();
        if (res.ok) {
          message.style.color = "green";
          message.textContent = "Signup successful! Please login.";
          setTimeout(() => {
            window.location.href = "login.html";
          }, 1500);
        } else {
          message.style.color = "red";
          message.textContent = data.message || "Signup failed!";
        }
      } catch (err) {
        message.style.color = "red";
        message.textContent = "Error connecting to server.";
      }
    });
  }

  /* ------------------ LOGIN ------------------ */
  const loginForm = document.getElementById("loginForm");
  if (loginForm) {
    loginForm.addEventListener("submit", async (e) => {
      e.preventDefault();

      const username = document.getElementById("username").value.trim();
      const password = document.getElementById("password").value;
      const loginMessage = document.getElementById("loginMessage");

      try {
        const res = await fetch(`${API_BASE}/auth/login`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ username, password }),
        });

        const data = await res.json();
        if (res.ok) {
          localStorage.setItem("token", data.token); // Save JWT
          loginMessage.style.color = "green";
          loginMessage.textContent = "Login successful!";
          setTimeout(() => {
            window.location.href = "index.html"; // redirect to dashboard
          }, 1200);
        } else {
          loginMessage.style.color = "red";
          loginMessage.textContent =
            data.message || "Invalid login. Please sign up first.";
        }
      } catch (err) {
        loginMessage.style.color = "red";
        loginMessage.textContent = "Error connecting to server.";
      }
    });
  }

  /* ------------------ DASHBOARD (Profile + Expenses CRUD) ------------------ */

  // Utility functions
  function getToken() {
    return localStorage.getItem("token");
  }
  function redirectToLogin() {
    window.location.href = "login.html";
  }

  // Load Profile
  async function loadProfile() {
    const token = getToken();
    if (!token) return;

    try {
      const res = await fetch(`${API_BASE}/user/me`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const user = await res.json();

      if (res.ok) {
        if (document.getElementById("profile-name")) {
          document.getElementById("profile-name").textContent = user.name || "";
          document.getElementById("profile-username").textContent =
            user.username || "";
          document.getElementById("profile-email").textContent =
            user.email || "";
          document.getElementById("profile-phone").textContent =
            user.phone || "";
          document.getElementById("profile-wallet").textContent =
            user.walletBalance || 0;
        }
      } else {
        redirectToLogin();
      }
    } catch (err) {
      console.error(err);
      redirectToLogin();
    }
  }

  // Load Expenses
  async function loadExpenses() {
    const token = getToken();
    if (!token) return;

    try {
      const res = await fetch(`${API_BASE}/expense`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const expenses = await res.json();

      const list = document.getElementById("expenses");
      if (!list) return;
      list.innerHTML = "";

      expenses.forEach((exp) => {
        const li = document.createElement("li");
        li.innerHTML = `
          <span>${exp.description} - ₹${exp.amount}</span>
          <span>
            <button onclick="editExpense('${exp._id}', '${exp.description}', '${exp.amount}')">✏️</button>
            <button onclick="deleteExpense('${exp._id}')">🗑️</button>
          </span>
        `;
        list.appendChild(li);
      });
    } catch (err) {
      console.error(err);
    }
  }

  // Add Expense
  const expenseForm = document.getElementById("expenseForm");
  if (expenseForm) {
    expenseForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      const description = document.getElementById("description").value.trim();
      const amount = document.getElementById("amount").value;

      const token = getToken();
      try {
        const res = await fetch(`${API_BASE}/expense`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ description, amount }),
        });

        if (res.ok) {
          expenseForm.reset();
          loadExpenses();
        } else {
          alert("Failed to add expense");
        }
      } catch (err) {
        console.error(err);
      }
    });
  }

  // Logout
  const logoutBtn = document.getElementById("logoutBtn");
  if (logoutBtn) {
    logoutBtn.addEventListener("click", () => {
      localStorage.removeItem("token");
      redirectToLogin();
    });
  }

  // Initial load only on dashboard
  if (document.getElementById("profile-name")) {
    loadProfile();
    loadExpenses();
  }

  /* ------------------ EXPENSE CRUD Helpers ------------------ */
  window.editExpense = async function (id, oldDesc, oldAmt) {
    const newDesc = prompt("Update Description:", oldDesc);
    const newAmt = prompt("Update Amount:", oldAmt);
    if (!newDesc || !newAmt) return;

    const token = getToken();
    try {
      const res = await fetch(`${API_BASE}/expense/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ description: newDesc, amount: newAmt }),
      });

      if (res.ok) {
        loadExpenses();
      } else {
        alert("Failed to update expense");
      }
    } catch (err) {
      console.error(err);
    }
  };

  window.deleteExpense = async function (id) {
    if (!confirm("Are you sure you want to delete this expense?")) return;

    const token = getToken();
    try {
      const res = await fetch(`${API_BASE}/expense/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.ok) {
        loadExpenses();
      } else {
        alert("Failed to delete expense");
      }
    } catch (err) {
      console.error(err);
    }
  };
});
