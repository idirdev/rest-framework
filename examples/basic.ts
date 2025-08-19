import { App } from '../src/App';
import { bodyParser } from '../src/middleware/bodyParser';
import { cors } from '../src/middleware/cors';
import { logger } from '../src/middleware/logger';

const app = new App();

// Global middleware
app.use(logger());
app.use(cors({ origin: '*', credentials: false }));
app.use(bodyParser({ limit: 512 * 1024 }));

// In-memory data store
interface Todo { id: number; title: string; done: boolean; }
let todos: Todo[] = [
  { id: 1, title: 'Build a REST framework', done: true },
  { id: 2, title: 'Add middleware support', done: true },
  { id: 3, title: 'Write documentation', done: false },
];
let nextId = 4;

// Root route
app.get('/', (req, res) => {
  res.json({ name: 'rest-framework', version: '1.0.0', endpoints: ['/todos', '/todos/:id'] });
});

// API route group
app.group('/todos', (router) => {
  // List all todos
  router.get('/', (req, res) => {
    const filter = req.query.done;
    let result = todos;
    if (filter === 'true') result = todos.filter(t => t.done);
    if (filter === 'false') result = todos.filter(t => !t.done);
    res.json(result);
  });

  // Get single todo
  router.get('/:id', (req, res) => {
    const todo = todos.find(t => t.id === parseInt(req.params.id));
    if (!todo) { res.status(404).json({ error: 'Todo not found' }); return; }
    res.json(todo);
  });

  // Create todo
  router.post('/', (req, res) => {
    const { title } = req.body || {};
    if (!title) { res.status(400).json({ error: 'Title is required' }); return; }
    const todo: Todo = { id: nextId++, title, done: false };
    todos.push(todo);
    res.status(201).json(todo);
  });

  // Update todo
  router.patch('/:id', (req, res) => {
    const todo = todos.find(t => t.id === parseInt(req.params.id));
    if (!todo) { res.status(404).json({ error: 'Todo not found' }); return; }
    if (req.body.title !== undefined) todo.title = req.body.title;
    if (req.body.done !== undefined) todo.done = req.body.done;
    res.json(todo);
  });

  // Delete todo
  router.delete('/:id', (req, res) => {
    const index = todos.findIndex(t => t.id === parseInt(req.params.id));
    if (index === -1) { res.status(404).json({ error: 'Todo not found' }); return; }
    const deleted = todos.splice(index, 1)[0];
    res.json({ deleted });
  });
});

// Start server
const PORT = parseInt(process.env.PORT || '3000');
app.listen(PORT, () => {
  console.log(`rest-framework running on http://localhost:${PORT}`);
  console.log('Routes:');
  console.log('  GET    /');
  console.log('  GET    /todos');
  console.log('  GET    /todos/:id');
  console.log('  POST   /todos');
  console.log('  PATCH  /todos/:id');
  console.log('  DELETE /todos/:id');
});
