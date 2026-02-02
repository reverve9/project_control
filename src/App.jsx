import { useState, useEffect } from 'react'
import Sidebar from './components/Sidebar'
import Dashboard from './components/Dashboard'
import ProjectDetail from './components/ProjectDetail'
import ProjectModal from './components/ProjectModal'
import TodoModal from './components/TodoModal'

const COLORS = ['#2c3e50', '#3498db', '#27ae60', '#e67e22', '#9b59b6', '#e74c3c', '#1abc9c', '#f39c12']

function App() {
  const [projects, setProjects] = useState([])
  const [activeView, setActiveView] = useState('dashboard')
  const [activeProjectId, setActiveProjectId] = useState(null)
  const [showProjectModal, setShowProjectModal] = useState(false)
  const [showTodoModal, setShowTodoModal] = useState(false)
  const [editingProject, setEditingProject] = useState(null)
  const [editingTodo, setEditingTodo] = useState(null)

  // Load data on mount
  useEffect(() => {
    const loadData = async () => {
      if (window.api?.loadData) {
        const data = await window.api.loadData()
        setProjects(data.projects || [])
      } else {
        const saved = localStorage.getItem('projects')
        if (saved) {
          setProjects(JSON.parse(saved))
        }
      }
    }
    loadData()
  }, [])

  // Save data on change
  useEffect(() => {
    const saveData = async () => {
      if (window.api?.saveData) {
        await window.api.saveData({ projects })
      } else {
        localStorage.setItem('projects', JSON.stringify(projects))
      }
    }
    if (projects.length > 0 || localStorage.getItem('projects')) {
      saveData()
    }
  }, [projects])

  const activeProject = projects.find(p => p.id === activeProjectId)

  const handleAddProject = (projectData) => {
    if (editingProject) {
      setProjects(prev => prev.map(p => 
        p.id === editingProject.id ? { ...p, ...projectData } : p
      ))
      setEditingProject(null)
    } else {
      const newProject = {
        id: crypto.randomUUID(),
        ...projectData,
        todos: [],
        createdAt: new Date().toISOString()
      }
      setProjects(prev => [...prev, newProject])
    }
    setShowProjectModal(false)
  }

  const handleDeleteProject = (projectId) => {
    setProjects(prev => prev.filter(p => p.id !== projectId))
    if (activeProjectId === projectId) {
      setActiveView('dashboard')
      setActiveProjectId(null)
    }
  }

  const handleAddTodo = (todoData) => {
    if (editingTodo) {
      setProjects(prev => prev.map(p => ({
        ...p,
        todos: p.todos.map(t => 
          t.id === editingTodo.id ? { ...t, ...todoData } : t
        )
      })))
      setEditingTodo(null)
    } else {
      const newTodo = {
        id: crypto.randomUUID(),
        ...todoData,
        completed: false,
        createdAt: new Date().toISOString()
      }
      setProjects(prev => prev.map(p => 
        p.id === activeProjectId 
          ? { ...p, todos: [...p.todos, newTodo] }
          : p
      ))
    }
    setShowTodoModal(false)
  }

  const handleToggleTodo = (projectId, todoId) => {
    setProjects(prev => prev.map(p => 
      p.id === projectId
        ? {
            ...p,
            todos: p.todos.map(t =>
              t.id === todoId ? { ...t, completed: !t.completed } : t
            )
          }
        : p
    ))
  }

  const handleDeleteTodo = (projectId, todoId) => {
    setProjects(prev => prev.map(p =>
      p.id === projectId
        ? { ...p, todos: p.todos.filter(t => t.id !== todoId) }
        : p
    ))
  }

  const handleEditTodo = (todo) => {
    setEditingTodo(todo)
    setShowTodoModal(true)
  }

  const handleEditProject = (project) => {
    setEditingProject(project)
    setShowProjectModal(true)
  }

  const selectProject = (projectId) => {
    setActiveProjectId(projectId)
    setActiveView('project')
  }

  return (
    <div className="app">
      <Sidebar
        projects={projects}
        activeView={activeView}
        activeProjectId={activeProjectId}
        onSelectDashboard={() => setActiveView('dashboard')}
        onSelectProject={selectProject}
        onAddProject={() => {
          setEditingProject(null)
          setShowProjectModal(true)
        }}
      />

      <main className="main-content">
        {activeView === 'dashboard' ? (
          <Dashboard 
            projects={projects} 
            onSelectProject={selectProject}
          />
        ) : activeProject ? (
          <ProjectDetail
            project={activeProject}
            onToggleTodo={(todoId) => handleToggleTodo(activeProject.id, todoId)}
            onDeleteTodo={(todoId) => handleDeleteTodo(activeProject.id, todoId)}
            onEditTodo={handleEditTodo}
            onAddTodo={() => {
              setEditingTodo(null)
              setShowTodoModal(true)
            }}
            onEditProject={() => handleEditProject(activeProject)}
            onDeleteProject={() => handleDeleteProject(activeProject.id)}
          />
        ) : null}
      </main>

      {showProjectModal && (
        <ProjectModal
          project={editingProject}
          colors={COLORS}
          onSave={handleAddProject}
          onClose={() => {
            setShowProjectModal(false)
            setEditingProject(null)
          }}
        />
      )}

      {showTodoModal && (
        <TodoModal
          todo={editingTodo}
          onSave={handleAddTodo}
          onClose={() => {
            setShowTodoModal(false)
            setEditingTodo(null)
          }}
        />
      )}
    </div>
  )
}

export default App
