// Import required packages and modules
const express = require('express');
const session = require('express-session');
const path = require('path');
const bcrypt = require('bcrypt');
const { body, validationResult } = require('express-validator');
const fs = require('fs');

// Create an instance of Express
const app = express();
const port = 3000; // Set the port number for the server

// Configure Express middleware
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(express.static(path.join(__dirname, 'src')));

// Initialize users with hardcoded usernames and hashed passwords
const users = [
    { id: 1, username: 'wea', password: '$2a$12$nClo3i0tEfqCjfxWJJLGEuebJNF97eVS8JxErCE4VLrBv9BY/Xh5S' },
    { id: 2, username: 'admin', password: '$2a$12$pf5LfVonwFZpVIjz5tzEmutcIt.mzob7e1gsIt7yHWCYrU8WP5OUa' },
];

// Function to authenticate user credentials
function authenticateUser(username, password) {
    // Compares the provided username and password with stored user credentials
    const user = users.find(user => user.username === username);
    if (user) {
        return bcrypt.compareSync(password, user.password);
    }
    return false;
}

// Set up Express session handling
app.use(session({
    secret: 'your-secret-key', // Secret key for session data encryption
    resave: false,
    saveUninitialized: true,
    cookie: { secure: false } // Cookie settings
}));

// File path for storing tasks
const tasksFilePath = 'tasks.json';

// Function to load tasks from a file
function loadTasks() {
    try {
        const data = fs.readFileSync(tasksFilePath);
        return JSON.parse(data);
    } catch (error) {
        return []; // Return an empty array if there's an error or no data
    }
}

// Function to save tasks to a file
function saveTasks(tasks) {
    try {
        fs.writeFileSync(tasksFilePath, JSON.stringify(tasks, null, 2));
    } catch (error) {
        console.error('Error saving tasks:', error); // Log any errors during task saving
    }
}

let tasks = loadTasks(); // Load tasks initially

// Middleware function to check if a user is authenticated
function requireAuth(req, res, next) {
    if (req.session && req.session.authenticated) {
        return next();
    } else {
        return res.redirect('/login'); // Redirect to login if not authenticated
    }
}

// Route for handling user login with authentication
app.post('/login', (req, res) => {
    // Check provided credentials against stored user data
    if (authenticateUser(req.body.username, req.body.password)) {
        // Set session data for authenticated user
        req.session.authenticated = true;
        req.session.username = req.body.username;
        res.redirect('/'); // Redirect to home page after successful login
    } else {
        // Send error message if authentication fails
        res.status(401).send(
            '<div style="font-family: \'Roboto\', sans-serif; background-color: #f4f4f4; padding: 20px; border-radius: 5px; box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1); text-align: center;">' +
            '<h2 style="color: #f44336;">Invalid username or password</h2>' +
            '<p style="color: #666;">Please check your credentials and try again.</p>' +
            '<a href="/login" style="display: inline-block; margin-top: 15px; padding: 10px 20px; border-radius: 5px; background-color: #3498db; color: white; text-decoration: none; transition: background-color 0.3s ease;">Back to Login</a>' +
            '</div>'
        );
    }
});

// Route for serving the login page
app.get('/login', (req, res) => {
    res.sendFile(path.join(__dirname, 'login.html'));
});

// Route for serving the home page after authentication
app.get('/', requireAuth, (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// Route for handling user logout
app.get('/logout', (req, res) => {
    // Destroy session data on logout
    req.session.destroy(err => {
        if (err) {
            console.error(err);
        }
        res.redirect('/login'); // Redirect to login page after logout
    });
});

// Route definitions for serving static files (scripts, stylesheets)
app.get('/script.js', (req, res) => {
    res.sendFile(path.join(__dirname, 'script.js'));
});

app.get('/styles.css', (req, res) => {
    res.sendFile(path.join(__dirname, 'styles.css'));
});

// Routes for managing tasks (get, add, delete, update)
app.get('/tasks', (req, res) => {
    res.json(tasks); // Send tasks as JSON response
});

app.post('/tasks', [
    body('title').isString().trim().escape(),
    body('completed').isBoolean()
], (req, res) => {
    // Validate incoming task data
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    // Add a new task and save tasks to file
    const { title, completed } = req.body;
    const newTask = { id: tasks.length + 1, title, completed };
    tasks.push(newTask);
    saveTasks(tasks);
    res.status(201).send('Task added successfully');
});

// Route for deleting tasks
app.delete('/tasks/:id', (req, res) => {
    const { id } = req.params;
    tasks = tasks.filter(task => task.id !== parseInt(id)); // Remove task by ID
    saveTasks(tasks);
    res.send('Task deleted successfully');
});

// Route for updating tasks
app.put('/tasks/:id', (req, res) => {
    const { id } = req.params;
    const updatedTask = req.body;
    tasks = tasks.map(task => (task.id === parseInt(id) ? updatedTask : task)); // Update task by ID
    saveTasks(tasks);
    res.send('Task updated successfully');
});

// Middleware for handling 404 (Not Found) errors
app.use((req, res, next) => {
    res.status(404).send(
        '<div style="font-family: \'Roboto\', sans-serif; background-color: #f4f4f4; padding: 20px; border-radius: 5px; box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1); text-align: center;">' +
        '<h2 style="color: #f44336;">Page Not Found</h2>' +
        '<p style="color: #666;">The requested page was not found.</p>' +
        '<a href="/login" style="display: inline-block; margin-top: 15px; padding: 10px 20px; border-radius: 5px; background-color: #3498db; color: white; text-decoration: none; transition: background-color 0.3s ease;">Back to Login</a>' +
        '</div>'
    );
});

// Start the Express server
app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});
