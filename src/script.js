// Get references to HTML elements
const tasksContainer = document.getElementById('tasks-container');
const taskForm = document.getElementById('task-form');
const taskInput = document.getElementById('task-input');
let tasks = []; // Initialize an empty array to store tasks

// Function to fetch tasks from the server
function fetchTasks() {
    fetch('/tasks') // Send GET request to the '/tasks' endpoint
        .then(response => response.json()) // Parse response as JSON
        .then(data => {
            tasks = data; // Update tasks array with fetched data
            displayTasks(tasks); // Call function to display tasks
        })
        .catch(error => console.error('Error fetching tasks:', error)); // Log any errors
}

// Function to fetch and display tasks without storing them in the global 'tasks' variable
function fetchAndDisplayTasks() {
    fetch('/tasks')
        .then(response => response.json())
        .then(data => {
            displayTasks(data); // Display fetched tasks directly
        })
        .catch(error => console.error('Error fetching tasks:', error));
}

// Adding an event listener to execute code when the DOM content is fully loaded
document.addEventListener('DOMContentLoaded', () => {
    fetchAndDisplayTasks(); // Function call to fetch and display tasks
});

// Function to escape HTML entities from a text
function escapeHTML(text) {
    const div = document.createElement('div'); // Creates a new <div> element

    div.textContent = text; // Sets the text content of the <div> element

    return div.innerHTML; // Retrieves the HTML content of the <div>, which contains escaped HTML entities
}

// Function to display tasks on the webpage
function displayTasks(tasksToDisplay) {
    tasksContainer.innerHTML = ''; // Clear previous tasks displayed on the webpage

    tasksToDisplay.forEach(task => {
        const taskElement = document.createElement('div'); // Create a div for each task
        taskElement.textContent = escapeHTML(task.title); // Display task title safely using escapeHTML function

        taskElement.classList.add('task'); // Add 'task' class to the task element

        // Add 'completed' or 'uncompleted' class based on task completion status
        if (task.completed) {
            taskElement.classList.add('completed');
        } else {
            taskElement.classList.add('uncompleted');
        }

        // Create buttons for delete, mark as completed, and edit task
        // Add event listeners to these buttons
        const deleteButton = document.createElement('button');
        deleteButton.textContent = '❌';
        deleteButton.addEventListener('click', () => deleteTask(task.id));

        const completeButton = document.createElement('button');
        completeButton.textContent = '✅';
        completeButton.addEventListener('click', () => markAsCompleted(task.id));

        const editButton = document.createElement('button');
        editButton.textContent = '✏️ Edit';
        editButton.addEventListener('click', () => editTask(task.id));

        // Create a div to contain the task buttons
        const taskButtons = document.createElement('div');
        taskButtons.classList.add('task-buttons');
        taskButtons.appendChild(deleteButton);
        taskButtons.appendChild(completeButton);
        taskButtons.appendChild(editButton);

        // Append buttons to the task element
        taskElement.appendChild(taskButtons);
        tasksContainer.appendChild(taskElement); // Append task element to the tasks container
    });
}

// Function to filter tasks based on completion status
function filterTasks(filterType) {
    let filteredTasks = [];

    if (filterType === 'completed') {
        filteredTasks = tasks.filter(task => task.completed);
    } else if (filterType === 'uncompleted') {
        filteredTasks = tasks.filter(task => !task.completed);
    } else {
        filteredTasks = tasks; // If no filter applied, display all tasks
    }

    displayTasks(filteredTasks); // Display filtered tasks
}

// Function to add a new task
function addTask(title) {
    const newTask = { title: title, completed: false }; // Create a new task object
    fetch('/tasks', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(newTask) // Send POST request to add a new task
    })
        .then(() => {
            fetchTasks(); // After adding the task, fetch all tasks again to update the display
        })
        .catch(error => console.error('Error adding task:', error)); // Log any errors
}

// Function to delete a task by its ID
function deleteTask(taskId) {
    fetch(`/tasks/${taskId}`, {
        method: 'DELETE' // Send DELETE request to remove the specified task
    })
        .then(() => {
            fetchTasks(); // After deleting the task, fetch all tasks again to update the display
        })
        .catch(error => console.error('Error deleting task:', error)); // Log any errors
}

// Function to mark a task as completed by its ID
function markAsCompleted(taskId) {
    const taskToUpdate = tasks.find(task => task.id === taskId); // Find the task to update
    taskToUpdate.completed = true; // Update task completion status

    fetch(`/tasks/${taskId}`, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(taskToUpdate) // Send PUT request to update the task
    })
        .then(() => {
            fetchTasks(); // After marking task as completed, fetch all tasks again to update the display
        })
        .catch(error => console.error('Error marking task as completed:', error)); // Log any errors
}

// Variable to track if a task is being edited
let isEditing = false;

// Function to edit a task by its ID
function editTask(taskId) {
    if (!isEditing) {
        isEditing = true; // Set editing flag to true

        const taskToEdit = tasks.find(task => task.id === taskId); // Find the task to edit

        // Create input field and buttons for editing the task title
        const editTaskInput = document.createElement('input');
        editTaskInput.type = 'text';
        editTaskInput.value = taskToEdit.title;

        const saveButton = document.createElement('button');
        saveButton.textContent = 'Save';
        saveButton.addEventListener('click', () => {
            const newTitle = editTaskInput.value.trim();
            if (newTitle !== '') {
                taskToEdit.title = newTitle; // Update task title
                updateTask(taskToEdit); // Call function to update the task
                editTaskForm.style.display = 'none'; // Hide the edit form
                isEditing = false; // Set editing flag to false
            }
        });

        const cancelButton = document.createElement('button');
        cancelButton.textContent = 'Cancel';
        cancelButton.addEventListener('click', () => {
            editTaskForm.style.display = 'none'; // Hide the edit form
            isEditing = false; // Set editing flag to false
        });

        // Create a form to edit the task
        const editTaskForm = document.createElement('div');
        editTaskForm.id = 'edit-task-form';
        editTaskForm.appendChild(editTaskInput);
        editTaskForm.appendChild(saveButton);
        editTaskForm.appendChild(cancelButton);
        document.body.appendChild(editTaskForm); // Append the form to the body

        editTaskForm.style.display = 'block'; // Display the edit form
    }
}

// Function to update a task with new data
function updateTask(updatedTask) {
    fetch(`/tasks/${updatedTask.id}`, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(updatedTask) // Send PUT request to update the task
    })
        .then(() => {
            fetchTasks(); // After updating the task, fetch all tasks again to update the display
        })
        .catch(error => console.error('Error updating task:', error)); // Log any errors
}


// Event listener for the task form submission
taskForm.addEventListener('submit', event => {
    event.preventDefault(); // Prevent default form submission behavior
    const newTaskTitle = taskInput.value.trim(); // Get the trimmed value from the input field

    if (newTaskTitle !== '') {
        addTask(newTaskTitle); // Add a new task with the provided title
        taskInput.value = ''; // Clear the input field after adding the task
    }
});

// Function to log out the user
function logout() {
    fetch('/logout', {
        method: 'GET' // Send GET request to log out the user
    })
        .then(() => {
            window.location.href = '/login'; // Redirect to the login page after successful logout
        })
        .catch(error => console.error('Error logging out:', error)); // Log any errors
}

fetchTasks(); // Initial fetch of tasks when the page loads