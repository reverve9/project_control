import { useState, useEffect } from 'react'
import { supabase } from './lib/supabase'
import Sidebar from './components/Sidebar'
import Dashboard from './components/Dashboard'
import ProjectDetail from './components/ProjectDetail'
import ProjectModal from './components/ProjectModal'
import TodoModal from './components/TodoModal'

const COLORS = ['#2c3e50', '#3498db', '#27ae60', '#e67e22', '#9b59b6', '#e74c3c', '#1abc9c', '#f39c12']

function App() {
  const [projects, setProjects] = useState([])
  const [loading, setLoading] = useState(true)
  const [activeView, setActiveView] = useState('dashboard')
  const [activeProjectId, setActiveProjectId] = useState(null)
  const [showProjectModal, setShowProjectModal] = useState(false)
  const [showTodoModal, setShowTodoModal] = useState(false)
  const [editingProject, setEditingProject] = useState(null)
  const [editingTodo, setEditingTodo] = useState(null)

  // 데이터 로드
  useEffect(() => {
    fetchProjects()
  }, [])

  const fetchProjects = async () => {
    try {
      // 프로젝트 조회
      const { data: projectsData, error: projectsError } = await supabase
        .from('projects')
        .select('*')
        .order('created_at', { ascending: true })

      if (projectsError) throw projectsError

      // 할일 조회
      const { data: todosData, error: todosError } = await supabase
        .from('todos')
        .select('*')
        .order('created_at', { ascending: true })

      if (todosError) throw todosError

      // 프로젝트에 할일 매핑
      const projectsWithTodos = projectsData.map(project => ({
        ...project,
        todos: todosData.filter(todo => todo.project_id === project.id)
      }))

      setProjects(projectsWithTodos)
    } catch (error) {
      console.error('데이터 로드 실패:', error)
    } finally {
      setLoading(false)
    }
  }

  const activeProject = projects.find(p => p.id === activeProjectId)

  // 프로젝트 추가/수정
  const handleAddProject = async (projectData) => {
    try {
      if (editingProject) {
        // 수정
        const { error } = await supabase
          .from('projects')
          .update({
            name: projectData.name,
            description: projectData.description,
            color: projectData.color
          })
          .eq('id', editingProject.id)

        if (error) throw error

        setProjects(prev => prev.map(p =>
          p.id === editingProject.id ? { ...p, ...projectData } : p
        ))
        setEditingProject(null)
      } else {
        // 추가
        const { data, error } = await supabase
          .from('projects')
          .insert({
            name: projectData.name,
            description: projectData.description,
            color: projectData.color
          })
          .select()
          .single()

        if (error) throw error

        setProjects(prev => [...prev, { ...data, todos: [] }])
      }
      setShowProjectModal(false)
    } catch (error) {
      console.error('프로젝트 저장 실패:', error)
    }
  }

  // 프로젝트 삭제
  const handleDeleteProject = async (projectId) => {
    try {
      const { error } = await supabase
        .from('projects')
        .delete()
        .eq('id', projectId)

      if (error) throw error

      setProjects(prev => prev.filter(p => p.id !== projectId))
      if (activeProjectId === projectId) {
        setActiveView('dashboard')
        setActiveProjectId(null)
      }
    } catch (error) {
      console.error('프로젝트 삭제 실패:', error)
    }
  }

  // 할일 추가/수정
  const handleAddTodo = async (todoData) => {
    try {
      if (editingTodo) {
        // 수정
        const { error } = await supabase
          .from('todos')
          .update({
            title: todoData.title,
            due_date: todoData.dueDate
          })
          .eq('id', editingTodo.id)

        if (error) throw error

        setProjects(prev => prev.map(p => ({
          ...p,
          todos: p.todos.map(t =>
            t.id === editingTodo.id ? { ...t, title: todoData.title, due_date: todoData.dueDate } : t
          )
        })))
        setEditingTodo(null)
      } else {
        // 추가
        const { data, error } = await supabase
          .from('todos')
          .insert({
            project_id: activeProjectId,
            title: todoData.title,
            due_date: todoData.dueDate,
            completed: false
          })
          .select()
          .single()

        if (error) throw error

        setProjects(prev => prev.map(p =>
          p.id === activeProjectId
            ? { ...p, todos: [...p.todos, data] }
            : p
        ))
      }
      setShowTodoModal(false)
    } catch (error) {
      console.error('할일 저장 실패:', error)
    }
  }

  // 할일 완료 토글
  const handleToggleTodo = async (projectId, todoId) => {
    const project = projects.find(p => p.id === projectId)
    const todo = project?.todos.find(t => t.id === todoId)
    if (!todo) return

    try {
      const { error } = await supabase
        .from('todos')
        .update({ completed: !todo.completed })
        .eq('id', todoId)

      if (error) throw error

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
    } catch (error) {
      console.error('할일 토글 실패:', error)
    }
  }

  // 할일 삭제
  const handleDeleteTodo = async (projectId, todoId) => {
    try {
      const { error } = await supabase
        .from('todos')
        .delete()
        .eq('id', todoId)

      if (error) throw error

      setProjects(prev => prev.map(p =>
        p.id === projectId
          ? { ...p, todos: p.todos.filter(t => t.id !== todoId) }
          : p
      ))
    } catch (error) {
      console.error('할일 삭제 실패:', error)
    }
  }

  const handleEditTodo = (todo) => {
    // DB 필드명을 컴포넌트 필드명으로 변환
    setEditingTodo({
      ...todo,
      dueDate: todo.due_date
    })
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

  if (loading) {
    return (
      <div className="app" style={{ alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ color: '#7f8c8d' }}>로딩 중...</div>
      </div>
    )
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
