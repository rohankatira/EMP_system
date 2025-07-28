const express = require('express');
const bodyParser = require('body-parser');
const app = express();
const port = 3000;

// In-memory data
let employees = [];
let tasks = [];
let nextEmpId = 1;
let nextTaskId = 1;

// Middleware
app.set('view engine', 'ejs');
app.use(express.static('public'));
app.use(bodyParser.urlencoded({ extended: true }));

// ------------------ Home ------------------

// List Employees
app.get('/', (req, res) => {
  const q = req.query.q?.toLowerCase() || '';
  const filtered = employees.filter(emp =>
    emp.name.toLowerCase().includes(q) ||
    emp.department.toLowerCase().includes(q)
  );
  res.render('index', { employees: filtered });
});

// ------------------ Employee Routes ------------------

// Show Add Employee Form
app.get('/add', (req, res) => {
  res.render('add');
});

// Add Employee
app.post('/add', (req, res) => {
  const { name, department, salary } = req.body;
  if (!name || !department || !salary) return res.send('All fields required.');
  const id = String(nextEmpId++);
  employees.push({ id, name, department, salary });
  res.redirect('/');
});

// Show Edit Employee Form
app.get('/edit/:id', (req, res) => {
  const emp = employees.find(e => e.id === req.params.id);
  if (!emp) return res.send('Employee not found.');
  res.render('edit', { emp });
});

// Edit Employee
app.post('/edit/:id', (req, res) => {
  const { name, department, salary } = req.body;
  const emp = employees.find(e => e.id === req.params.id);
  if (emp) {
    emp.name = name;
    emp.department = department;
    emp.salary = salary;
  }
  res.redirect('/');
});

// Delete Employee
app.post('/delete/:id', (req, res) => {
  employees = employees.filter(e => e.id !== req.params.id);
  tasks = tasks.filter(t => t.employeeId !== req.params.id); // also delete related tasks
  res.redirect('/');
});

// ------------------ Task Routes ------------------

// List Tasks
app.get('/tasks', (req, res) => {
  const enrichedTasks = tasks.map(task => {
    const emp = employees.find(e => e.id === task.employeeId);
    return { ...task, employeeName: emp ? emp.name : 'Unknown' };
  });
  res.render('tasks', { tasks: enrichedTasks });
});

// Show Add Task Form
app.get('/tasks/add', (req, res) => {
  res.render('addTask', { employees });
});

// Add Task
app.post('/tasks/add', (req, res) => {
  const { title, employeeId } = req.body;
  const employee = employees.find(e => e.id === employeeId);
  if (!title || !employee) return res.send('Invalid input');
  const task = {
    id: String(nextTaskId++),
    title,
    employeeId,
    employeeName: employee.name,
    status: 'Pending',
    description: ''
  };
  tasks.push(task);
  res.redirect('/tasks');
});

// Show Edit Task Form
app.get('/tasks/edit/:id', (req, res) => {
  const task = tasks.find(t => t.id === req.params.id);
  if (!task) return res.send('Task not found');
  res.render('editTask', { task, employees });
});

// Edit Task
app.post('/tasks/edit/:id', (req, res) => {
  const { title, employeeId, status } = req.body;
  const task = tasks.find(t => t.id === req.params.id);
  if (task) {
    task.title = title;
    task.employeeId = employeeId;
    task.employeeName = employees.find(emp => emp.id === employeeId)?.name || 'Unknown';
    task.status = status;
  }
  res.redirect('/tasks');
});

// Delete Task
app.post('/tasks/delete/:id', (req, res) => {
  tasks = tasks.filter(t => t.id !== req.params.id);
  res.redirect('/tasks');
});

// Mark as Completed
app.post('/tasks/complete/:id', (req, res) => {
  const task = tasks.find(t => t.id === req.params.id);
  if (task) task.status = 'Completed';
  res.redirect('/tasks');
});

// ------------------ Employee Task Submission ------------------

// Show Submit Task Form
app.get('/tasks/submit/:id', (req, res) => {
  const task = tasks.find(t => t.id === req.params.id);
  if (!task) return res.send('Task not found');
  res.render('submitTask', { task });
});

// Handle Submit Task
app.post('/tasks/submit/:id', (req, res) => {
  const { description, status } = req.body;
  const task = tasks.find(t => t.id === req.params.id);
  if (task) {
    task.description = description;
    task.status = status;
  }
  res.redirect('/tasks');
});

// ------------------ Server ------------------

app.listen(port, () => {
  console.log(` Server running at http://localhost:${port}`);
});
