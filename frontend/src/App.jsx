import { useEffect, useState } from 'react'
import checklistLogo from './assets/CheckListLogo.png'
import './App.css'

function App() {
  const [tasks, setTasks] = useState([])
  const [selectedTaskId, setSelectedTaskId] = useState(null)
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

  async function createTask() {
    try {
      const task = await request('/api/tasks', {
        method: 'POST',
        body: JSON.stringify({
          title: '',
          description: '',
        }),
      })

      setTasks((currentTasks) => [...currentTasks, task])
      setSelectedTaskId(task.id)
      setError('')
    } catch {
      setError('Task could not be created.')
    }
  }

  async function updateTaskText(task, changes) {
    const updatedDraft = {
      ...task,
      ...changes,
    }

    setTasks((currentTasks) =>
      currentTasks.map((item) =>
        item.id === task.id ? { ...item, ...changes } : item,
      ),
    )

    try {
      const updatedTask = await request(`/api/tasks/${task.id}`, {
        method: 'PUT',
        body: JSON.stringify(updatedDraft),
      })

      setTasks((currentTasks) =>
        currentTasks.map((item) =>
          item.id === task.id ? updatedTask : item,
        ),
      )
      setError('')
    } catch {
      setError('Task could not be updated.')
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
    if (taskId === null) {
      return
    }

    try {
      await request(`/api/tasks/${taskId}`, {
        method: 'DELETE',
      })

      setTasks((currentTasks) =>
        currentTasks.filter((task) => task.id !== taskId),
      )
      setSelectedTaskId(null)
      setError('')
    } catch {
      setError('Task could not be deleted.')
    }
  }

  return (
    <main className="dashboard">
      <section className="dashboard-main" aria-label="Dashboard content">
        <p className="eyebrow">Personal dashboard</p>
        <h1>Dashboard</h1>
      </section>

      <aside className="todo-window" aria-label="Todo list">
        <header className="todo-titlebar">
          <div className="todo-brand">
            <img src={checklistLogo} alt="" />
            <span>Todo-List</span>
          </div>
        </header>

        <div className="todo-toolbar">
          <button type="button" aria-label="Create task" onClick={createTask}>
            +
          </button>
          <button
            type="button"
            aria-label="Remove selected task"
            onClick={() => deleteTask(selectedTaskId)}
          >
            -
          </button>
          <button type="button">Done</button>
          <button type="button">Storage</button>
        </div>

        <section className="task-list" aria-label="Tasks">
          {loading && <p className="empty-state">Loading tasks...</p>}

          {!loading && tasks.length === 0 && (
            <p className="empty-state">No tasks yet.</p>
          )}

          {tasks.map((task) => (
            <article
              className={[
                'task-item',
                task.completed ? 'completed' : '',
                selectedTaskId === task.id ? 'selected' : '',
              ]
                .filter(Boolean)
                .join(' ')}
              key={task.id}
              onClick={() => setSelectedTaskId(task.id)}
              onKeyDown={(event) => {
                if (event.key === 'Enter' || event.key === ' ') {
                  event.preventDefault()
                  setSelectedTaskId(task.id)
                }
              }}
              role="button"
              tabIndex={0}
            >
              <div className="task-check">
                <input
                  type="checkbox"
                  checked={task.completed}
                  onChange={() => {
                    setSelectedTaskId(task.id)
                    toggleTask(task)
                  }}
                />
                <span>
                  <input
                    className="task-title-input"
                    type="text"
                    value={task.title}
                    onChange={(event) =>
                      setTasks((currentTasks) =>
                        currentTasks.map((item) =>
                          item.id === task.id
                            ? { ...item, title: event.target.value }
                            : item,
                        ),
                      )
                    }
                    onBlur={(event) =>
                      updateTaskText(task, { title: event.target.value })
                    }
                    onClick={(event) => event.stopPropagation()}
                    placeholder="Title"
                    aria-label="Task title"
                  />
                  <textarea
                    className="task-description-input"
                    value={task.description}
                    onChange={(event) =>
                      setTasks((currentTasks) =>
                        currentTasks.map((item) =>
                          item.id === task.id
                            ? { ...item, description: event.target.value }
                            : item,
                        ),
                      )
                    }
                    onBlur={(event) =>
                      updateTaskText(task, { description: event.target.value })
                    }
                    onClick={(event) => event.stopPropagation()}
                    placeholder="Description"
                    aria-label="Task description"
                    rows={5}
                  />
                </span>
              </div>
            </article>
          ))}
          {error && <p className="error">{error}</p>}
        </section>

      </aside>
    </main>
  )
}

export default App
