import { useEffect, useState } from 'react'
import './App.css'

const emptyTask = {
  title: '',
  description: '',
}

function App() {
  const [tasks, setTasks] = useState([])
  const [form, setForm] = useState(emptyTask)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  async function request(path, options = {}) {
    const response = await fetch(path, {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    })

    if (!response.ok) {
      throw new Error(`Request failed with status ${response.status}`)
    }

    if (response.status === 204) {
      return null
    }

    return response.json()
  }

  async function loadTasks() {
    try {
      setError('')
      const data = await request('/api/tasks')
      setTasks(data)
    } catch {
      setError('Backend is not reachable. Start Spring Boot on port 8080.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadTasks()
  }, [])

  async function handleSubmit(event) {
    event.preventDefault()

    if (!form.title.trim()) {
      return
    }

    try {
      const task = await request('/api/tasks', {
        method: 'POST',
        body: JSON.stringify({
          title: form.title.trim(),
          description: form.description.trim(),
        }),
      })

      setTasks((currentTasks) => [...currentTasks, task])
      setForm(emptyTask)
      setError('')
    } catch {
      setError('Task could not be created.')
    }
  }

  async function toggleTask(task) {
    try {
      const updatedTask = await request(`/api/tasks/${task.id}`, {
        method: 'PUT',
        body: JSON.stringify({
          ...task,
          completed: !task.completed,
        }),
      })

      setTasks((currentTasks) =>
        currentTasks.map((item) => (item.id === task.id ? updatedTask : item)),
      )
      setError('')
    } catch {
      setError('Task could not be updated.')
    }
  }

  async function deleteTask(taskId) {
    try {
      await request(`/api/tasks/${taskId}`, {
        method: 'DELETE',
      })

      setTasks((currentTasks) =>
        currentTasks.filter((task) => task.id !== taskId),
      )
      setError('')
    } catch {
      setError('Task could not be deleted.')
    }
  }

  const openTasks = tasks.filter((task) => !task.completed).length
  const completedTasks = tasks.length - openTasks

  return (
    <main className="dashboard">
      <header className="dashboard-header">
        <div>
          <p className="eyebrow">Personal dashboard</p>
          <h1>Tasks</h1>
        </div>
        <div className="stats" aria-label="Task statistics">
          <span>{tasks.length} total</span>
          <span>{openTasks} open</span>
          <span>{completedTasks} done</span>
        </div>
      </header>

      <section className="task-panel" aria-labelledby="new-task-heading">
        <h2 id="new-task-heading">New task</h2>
        <form className="task-form" onSubmit={handleSubmit}>
          <input
            type="text"
            value={form.title}
            onChange={(event) =>
              setForm((currentForm) => ({
                ...currentForm,
                title: event.target.value,
              }))
            }
            placeholder="Title"
            aria-label="Task title"
          />
          <input
            type="text"
            value={form.description}
            onChange={(event) =>
              setForm((currentForm) => ({
                ...currentForm,
                description: event.target.value,
              }))
            }
            placeholder="Description"
            aria-label="Task description"
          />
          <button type="submit">Add</button>
        </form>
        {error && <p className="error">{error}</p>}
      </section>

      <section className="task-list" aria-label="Tasks">
        {loading && <p className="empty-state">Loading tasks...</p>}

        {!loading && tasks.length === 0 && (
          <p className="empty-state">No tasks yet.</p>
        )}

        {tasks.map((task) => (
          <article
            className={task.completed ? 'task-item completed' : 'task-item'}
            key={task.id}
          >
            <label className="task-check">
              <input
                type="checkbox"
                checked={task.completed}
                onChange={() => toggleTask(task)}
              />
              <span>
                <strong>{task.title}</strong>
                {task.description && <small>{task.description}</small>}
              </span>
            </label>
            <button
              className="delete-button"
              type="button"
              onClick={() => deleteTask(task.id)}
            >
              Delete
            </button>
          </article>
        ))}
      </section>
    </main>
  )
}

export default App
