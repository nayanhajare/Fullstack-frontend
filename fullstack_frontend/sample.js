// Open modal function (mode: "add" or "edit")
function openModal(mode = "add", todo = null) {
  modal.style.display = "flex";

  if (mode === "add") {
    modalTitle.innerText = "Add Todo";
    statusField.style.display = "none";
    titleInput.value = "";
    submitTodo.textContent = "Add";
  } else if (mode === "edit" && todo) {
    submitTodo.textContent = "Update";
    modalTitle.innerText = "Update Todo";
    statusField.style.display = "block";
    titleInput.value = todo.title;
    statusSelect.value = todo.status;
  }
}

// Close modal
document.getElementById("cancel-btn").addEventListener("click", () => {
  modal.style.display = "none";
});

window.addEventListener("click", (e) => {
  if (e.target === modal) {
    modal.style.display = "none";
  }
});

// For Add Todo Button
document.getElementById("add-todo-btn").addEventListener("click", () => {
  openModal("add", { title: "Learn Modal", status: false });
});

// For Update Todo Button (example)
window.onUpdateTodoClick = (todo)=> {
  openModal("edit", todo);
}

submitTodo.addEventListener("click", () => {
  if (submitTodo.textContent == "Update") {
    alert("Todo Updated");
  } else {
    alert("Todo Added");
  }
});