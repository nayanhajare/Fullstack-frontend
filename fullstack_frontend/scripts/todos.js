import { footer } from "../components/footer.js";
import navbar from "../components/navbar.js";
import { baseUrl } from "../components/utlis.js";

document.getElementById("navbar").innerHTML = navbar();
document.getElementById("footer").innerHTML = footer;

const modal = document.getElementById("todo-modal");
const titleInput = document.getElementById("todo-title");
const statusSelect = document.getElementById("todo-status");
const statusField = document.querySelector(".status-field");
const modalTitle = document.getElementById("modal-title");
const submitTodo = document.getElementById("submit-btn");
const container = document.getElementById("container");
const emptyState = document.getElementById("empty-state");

let token = localStorage.getItem("accessToken");
let refreshToken = localStorage.getItem("refreshToken");

if (!token || !refreshToken) {
  alert("User Not Logged In");
  window.location.href = "./login.html";
}

// Function to refresh access token
async function refreshAccessToken() {
  try {
    const response = await fetch(`${baseUrl}/users/refresh-token`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ refreshToken }),
    });
    
    if (response.ok) {
      const data = await response.json();
      localStorage.setItem("accessToken", data.accessToken);
      token = data.accessToken;
      return true;
    } else {
      localStorage.removeItem("accessToken");
      localStorage.removeItem("refreshToken");
      alert("Session expired. Please login again.");
      window.location.href = "./login.html";
      return false;
    }
  } catch (error) {
    console.error("Error refreshing token:", error);
    return false;
  }
}

// Function to make authenticated requests with automatic token refresh
async function makeAuthenticatedRequest(url, options = {}) {
  if (!token) {
    const refreshed = await refreshAccessToken();
    if (!refreshed) return null;
  }

  const response = await fetch(url, {
    ...options,
    headers: {
      ...options.headers,
      authorization: `Bearer ${token}`,
    },
  });

  if (response.status === 401) {
    const refreshed = await refreshAccessToken();
    if (refreshed) {
      return fetch(url, {
        ...options,
        headers: {
          ...options.headers,
          authorization: `Bearer ${token}`,
        },
      });
    }
  }

  return response;
}

// Update statistics
function updateStats(todos) {
  const totalTodos = todos.length;
  const completedTodos = todos.filter(todo => todo.status).length;
  const pendingTodos = totalTodos - completedTodos;

  document.getElementById("total-todos").textContent = totalTodos;
  document.getElementById("completed-todos").textContent = completedTodos;
  document.getElementById("pending-todos").textContent = pendingTodos;
}

// Modal functionality
document.getElementById("add-todo-btn").addEventListener("click", () => {
  modal.style.display = "flex";
  modalTitle.textContent = "Add Todo";
  titleInput.value = "";
  statusField.style.display = "none";
});

// Close modal functionality
document.getElementById("cancel-btn").addEventListener("click", () => {
  modal.style.display = "none";
});

document.getElementById("cancel-btn-secondary").addEventListener("click", () => {
  modal.style.display = "none";
});

// Close modal when clicking outside
modal.addEventListener("click", (e) => {
  if (e.target === modal) {
    modal.style.display = "none";
  }
});

// Add first todo button
document.getElementById("add-first-todo").addEventListener("click", () => {
  modal.style.display = "flex";
  modalTitle.textContent = "Add Todo";
  titleInput.value = "";
  statusField.style.display = "none";
});

// Add or Update Todo
submitTodo.addEventListener("click", async () => {
  event.preventDefault();

  let method;
  let endPoint;
  let body;

  if (modalTitle.textContent == "Add Todo") {
    let title = titleInput.value;
    method = "POST";
    endPoint = "add-todo";
    body = { title };
  } else {
    let todoId = document.getElementById("todo_id").value;
    let title = titleInput.value;
    let status = statusSelect.value;
    method = "PATCH";
    endPoint = `update-todo/${todoId}`;
    body = { title, status };
  }
  
  try {
    console.log(`${baseUrl}/todos/${endPoint}`);
    const response = await makeAuthenticatedRequest(`${baseUrl}/todos/${endPoint}`, {
      method: method,
      headers: {
        "content-type": "application/json",
      },
      body: JSON.stringify(body),
    });
    
    if (!response) {
      document.getElementById("message").textContent = "Authentication failed";
      document.getElementById("message").style.color = "red";
      return;
    }
    
    const data = await response.json();
    modal.style.display = "none";
    document.getElementById("message").style.color = "green";
    document.getElementById("message").textContent = data.message;
    titleInput.value = "";
    statusField.style.display = "none";
    getData();
  } catch (err) {
    document.getElementById("message").textContent = err.message;
    document.getElementById("message").style.color = "red";
  }
});

async function getData() {
  try {
    const response = await makeAuthenticatedRequest(`${baseUrl}/todos/alltodos`, {
      method: "GET",
    });
    
    if (!response) {
      document.getElementById("message").textContent = "Authentication failed";
      document.getElementById("message").style.color = "red";
      return;
    }
    
    const data = await response.json();
    console.log(data);
    displayTodos(data.todos);
  } catch (err) {
    document.getElementById("message").textContent = err.message;
    document.getElementById("message").style.color = "red";
  }
}

getData();

function displayTodos(arr) {
  updateStats(arr);
  
  if (arr.length === 0) {
    container.style.display = "none";
    emptyState.style.display = "block";
    return;
  }
  
  container.style.display = "grid";
  emptyState.style.display = "none";
  
  let cards = arr.map((todo) => {
    const statusClass = todo.status ? "completed" : "pending";
    const statusText = todo.status ? "✅ Completed" : "⏳ Pending";
    
    let card = `
      <div class='card'>
        <h3>${todo.title}</h3>
        <h4 class="${statusClass}">${statusText}</h4>
        <div class="card-buttons">
          <button onClick='updateTodo(${JSON.stringify(todo)})'>✏️ Update</button>
          <button onClick='deleteTodo(${JSON.stringify(todo._id)})'>🗑️ Delete</button>
        </div>
      </div>`;

    return card;
  });

  container.innerHTML = cards.join(" ");
}

window.updateTodo = (todo) => {
  modal.style.display = "flex";
  modalTitle.textContent = "Update Todo";
  statusField.style.display = "block";
  titleInput.value = todo.title;
  statusSelect.value = todo.status;
  document.getElementById("todo_id").value = todo._id;
};

window.deleteTodo = async (id) => {
  if (!confirm("Are you sure you want to delete this todo?")) {
    return;
  }

  try {
    const response = await makeAuthenticatedRequest(`${baseUrl}/todos/delete-todo/${id}`, {
      method: "DELETE",
    });
    
    if (!response) {
      document.getElementById("message").textContent = "Authentication failed";
      document.getElementById("message").style.color = "red";
      return;
    }
    
    const data = await response.json();
    document.getElementById("message").style.color = "green";
    document.getElementById("message").textContent = data.message;
    getData();
  } catch (err) {
    document.getElementById("message").textContent = err.message;
    document.getElementById("message").style.color = "red";
  }
};
