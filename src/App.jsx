import { useState, useEffect, useCallback } from 'react'
import { supabase } from './lib/supabase'
import Auth from './components/Auth'
import Sidebar from './components/Sidebar'
import Dashboard from './components/Dashboard'
import ProjectDetail from './components/ProjectDetail'
import ProjectModal from './components/ProjectModal'
import TaskModal from './components/TaskModal'
import TaskViewModal from './components/TaskViewModal'
import InfoModal from './components/InfoModal'
import AssignmentModal from './components/AssignmentModal'
import AssignmentDetail from './components/AssignmentDetail'
import SettingsPanel from './components/SettingsPanel'
import ArchiveView from './components/ArchiveView'

const COLORS = ['#2c3e50', '#3498db', '#27ae60', '#e67e22', '#9b59b6', '#e74c3c', '#1abc9c', '#f39c12']

function App() {
  const [user, setUser] = useState(null)
  const [userProfile, setUserProfile] = useState(null)
  const [authLoading, setAuthLoading] = useState(true)
  const [projects, setProjects] = useState([])
  const [assignments, setAssignments] = useState([])
  const [loading, setLoading] = useState(true)
  const [activeView, setActiveView] = useState('dashboard')
  const [activeProjectId, setActiveProjectId] = useState(null)
  const [activeAssignmentId, setActiveAssignmentId] = useState(null)
  const [showProjectModal, setShowProjectModal] = useState(false)
  const [showTaskModal, setShowTaskModal] = useState(false)
  const [showTaskViewModal, setShowTaskViewModal] = useState(false)
  const [showInfoModal, setShowInfoModal] = useState(false)
  const [showAssignmentModal, setShowAssignmentModal] = useState(false)
  const [showSettingsPanel, setShowSettingsPanel] = useState(false)
  const [editingProject, setEditingProject] = useState(null)
  const [editingTask, setEditingTask] = useState(null)
  const [viewingTask, setViewingTask] = useState(null)
  const [editingInfo, setEditingInfo] = useState(null)
  const [editingAssignment, setEditingAssignment] = useState(null)
  const [archivedProjects, setArchivedProjects] = useState([])
  const [archivedTasks, setArchivedTasks] = useState([])

  // 과제 데이터 가져오기
  const fetchAssignments = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('assignments')
        .select('*')
        .order('sort_order', { ascending: true })

      if (error) throw error
      setAssignments(data || [])
    } catch (error) {
      console.error('과제 로드 실패:', error)
    }
  }, [])

  // 프로젝트 데이터 가져오기
  const fetchProjects = useCallback(async () => {
    try {
      const { data: projectsData, error: projectsError } = await supabase
        .from('projects')
        .select('*')
        .order('sort_order', { ascending: true })

      if (projectsError) throw projectsError

      const { data: infosData, error: infosError } = await supabase
        .from('project_infos')
        .select('*')
        .order('created_at', { ascending: true })

      if (infosError) throw infosError

      const { data: tasksData, error: tasksError } = await supabase
        .from('tasks')
        .select('*')
        .order('created_at', { ascending: false })

      if (tasksError) throw tasksError

      const { data: itemsData, error: itemsError } = await supabase
        .from('task_items')
        .select('*')
        .order('created_at', { ascending: true })

      if (itemsError) throw itemsError

      const tasksWithItems = tasksData.map(task => ({
        ...task,
        items: itemsData.filter(d => d.task_id === task.id)
      }))

      const projectsWithData = projectsData
        .filter(project => !project.archived)
        .map(project => ({
          ...project,
          infos: infosData.filter(info => info.project_id === project.id),
          tasks: tasksWithItems.filter(task => task.project_id === project.id && !task.archived)
        }))

      setProjects(projectsWithData)
    } catch (error) {
      console.error('데이터 로드 실패:', error)
    } finally {
      setLoading(false)
    }
  }, [])

  // 인증 상태 체크
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null)
      setAuthLoading(false)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
    })

    return () => subscription.unsubscribe()
  }, [])

  // 유저 프로필 & 프로젝트 가져오기
  useEffect(() => {
    const fetchUserProfile = async () => {
      if (!user) return
      const { data } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', user.id)
        .single()

      if (data) {
        setUserProfile(data)
      }
    }

    if (user) {
      fetchUserProfile()
      fetchAssignments()
      fetchProjects()
    }
  }, [user, fetchProjects, fetchAssignments])

  // 보관함 뷰 진입 시 보관 항목 로드
  useEffect(() => {
    const loadArchivedItems = async () => {
      try {
        const { data: projectsData, error: projectsError } = await supabase
          .from('projects')
          .select('*')
          .eq('archived', true)
          .order('updated_at', { ascending: false })

        if (projectsError) throw projectsError
        setArchivedProjects(projectsData || [])

        const { data: tasksData, error: tasksError } = await supabase
          .from('tasks')
          .select('*')
          .eq('archived', true)
          .order('created_at', { ascending: false })

        if (tasksError) throw tasksError

        const { data: itemsData, error: itemsError } = await supabase
          .from('task_items')
          .select('*')

        if (itemsError) throw itemsError

        const { data: allProjects } = await supabase
          .from('projects')
          .select('id, name, color')

        const result = tasksData.map(task => {
          const project = allProjects?.find(p => p.id === task.project_id) || {}
          return {
            ...task,
            items: itemsData.filter(d => d.task_id === task.id),
            projectName: project.name || '삭제된 프로젝트',
            projectColor: project.color || '#ccc',
            projectId: task.project_id
          }
        })
        setArchivedTasks(result)
      } catch (error) {
        console.error('보관 항목 로드 실패:', error)
      }
    }

    if (activeView === 'archive') {
      loadArchivedItems()
    }
  }, [activeView])

  const handleLogout = async () => {
    await supabase.auth.signOut()
    setProjects([])
    setUserProfile(null)
    setActiveView('dashboard')
    setActiveProjectId(null)
  }

  if (authLoading) {
    return (
      <div className="loading-screen">
        <div className="loading-spinner"></div>
        <p>로딩중...</p>
      </div>
    )
  }

  if (!user) {
    return <Auth onAuthSuccess={setUser} />
  }

  if (userProfile && !userProfile.approved) {
    return (
      <div className="pending-screen">
        <div className="pending-card">
          <h2>승인 대기 중</h2>
          <p>관리자의 승인을 기다리고 있습니다.</p>
          <p className="pending-email">{user.email}</p>
          <button className="btn btn-ghost" onClick={handleLogout}>로그아웃</button>
        </div>
      </div>
    )
  }

  const activeProject = projects.find(p => p.id === activeProjectId)
  const activeAssignment = assignments.find(a => a.id === activeAssignmentId)

  const updateProjectTimestamp = async (projectId) => {
    await supabase
      .from('projects')
      .update({ updated_at: new Date().toISOString() })
      .eq('id', projectId)
  }

  const handleAddProject = async (projectData) => {
    try {
      if (editingProject) {
        const { error } = await supabase
          .from('projects')
          .update({
            name: projectData.name,
            description: projectData.description,
            color: projectData.color,
            assignment_id: projectData.assignment_id,
            deliverable: projectData.deliverable,
            assignee: projectData.assignee
          })
          .eq('id', editingProject.id)

        if (error) throw error

        setProjects(prev => prev.map(p =>
          p.id === editingProject.id ? { ...p, ...projectData } : p
        ))
        setEditingProject(null)
      } else {
        const { data, error } = await supabase
          .from('projects')
          .insert({
            name: projectData.name,
            description: projectData.description,
            color: projectData.color,
            assignment_id: projectData.assignment_id,
            deliverable: projectData.deliverable,
            assignee: projectData.assignee,
            user_id: user.id
          })
          .select()
          .single()

        if (error) throw error

        setProjects(prev => [...prev, { ...data, infos: [], tasks: [] }])
      }
      setShowProjectModal(false)
    } catch (error) {
      console.error('프로젝트 저장 실패:', error)
    }
  }

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

  const handleSaveInfo = async (infoData) => {
    console.log('handleSaveInfo called:', infoData, 'activeProjectId:', activeProjectId)
    try {
      if (editingInfo) {
        const { error } = await supabase
          .from('project_infos')
          .update({
            type: infoData.type,
            label: infoData.label,
            value: infoData.value,
            memo: infoData.memo
          })
          .eq('id', editingInfo.id)

        if (error) throw error
      } else {
        const { error } = await supabase
          .from('project_infos')
          .insert({
            project_id: activeProjectId,
            type: infoData.type,
            label: infoData.label,
            value: infoData.value,
            memo: infoData.memo,
            user_id: user.id
          })

        if (error) throw error
      }

      await updateProjectTimestamp(activeProjectId)
      await fetchProjects()
      setShowInfoModal(false)
      setEditingInfo(null)
    } catch (error) {
      console.error('인포 저장 실패:', error)
      alert('인포 저장 실패: ' + (error.message || JSON.stringify(error)))
    }
  }

  const handleDeleteInfo = async (infoId) => {
    try {
      const { error } = await supabase
        .from('project_infos')
        .delete()
        .eq('id', infoId)

      if (error) throw error

      await updateProjectTimestamp(activeProjectId)
      await fetchProjects()
    } catch (error) {
      console.error('인포 삭제 실패:', error)
    }
  }

  const handleSaveTask = async (taskData) => {
    try {
      if (editingTask) {
        const { error: taskError } = await supabase
          .from('tasks')
          .update({
            title: taskData.title,
            assignee: taskData.assignee,
            priority: taskData.priority || 0
          })
          .eq('id', editingTask.id)

        if (taskError) throw taskError

        const { error: deleteError } = await supabase
          .from('task_items')
          .delete()
          .eq('task_id', editingTask.id)

        if (deleteError) throw deleteError

        if (taskData.items.length > 0) {
          const itemsToInsert = taskData.items.map(d => ({
            task_id: editingTask.id,
            content: d.content,
            completed: d.completed,
            completed_at: d.completed ? (d.completed_at || new Date().toISOString()) : null,
            user_id: user.id
          }))

          const { error: insertError } = await supabase
            .from('task_items')
            .insert(itemsToInsert)

          if (insertError) throw insertError
        }

        await updateProjectTimestamp(activeProjectId)
        await fetchProjects()
        setEditingTask(null)
      } else {
        const { data: newTask, error: taskError } = await supabase
          .from('tasks')
          .insert({
            project_id: activeProjectId,
            title: taskData.title,
            assignee: taskData.assignee,
            priority: taskData.priority || 0,
            user_id: user.id,
            started_at: new Date().toISOString()
          })
          .select()
          .single()

        if (taskError) throw taskError

        if (taskData.items.length > 0) {
          const itemsToInsert = taskData.items.map(d => ({
            task_id: newTask.id,
            content: d.content,
            completed: d.completed,
            completed_at: d.completed ? new Date().toISOString() : null,
            user_id: user.id
          }))

          const { error: insertError } = await supabase
            .from('task_items')
            .insert(itemsToInsert)

          if (insertError) throw insertError
        }

        await updateProjectTimestamp(activeProjectId)
        await fetchProjects()
      }
      setShowTaskModal(false)
    } catch (error) {
      console.error('태스크 저장 실패:', error)
    }
  }

  const handleToggleItem = async (itemId, currentCompleted) => {
    const newCompleted = !currentCompleted
    const completedAt = newCompleted ? new Date().toISOString() : null

    try {
      const { error } = await supabase
        .from('task_items')
        .update({
          completed: newCompleted,
          completed_at: completedAt
        })
        .eq('id', itemId)

      if (error) throw error

      await updateProjectTimestamp(activeProjectId)
      await fetchProjects()
    } catch (error) {
      console.error('항목 토글 실패:', error)
    }
  }

  const handleDeleteTask = async (projectId, taskId) => {
    try {
      const { error } = await supabase
        .from('tasks')
        .delete()
        .eq('id', taskId)

      if (error) throw error

      await updateProjectTimestamp(projectId)
      setProjects(prev => prev.map(p =>
        p.id === projectId
          ? { ...p, tasks: p.tasks.filter(t => t.id !== taskId) }
          : p
      ))
    } catch (error) {
      console.error('태스크 삭제 실패:', error)
    }
  }

  const handleEditTask = (task) => {
    setEditingTask(task)
    setShowTaskModal(true)
  }

  // 대시보드에서 빠른 태스크 추가
  const handleQuickAddTask = async (projectId, taskData) => {
    try {
      const { data: newTask, error: taskError } = await supabase
        .from('tasks')
        .insert({
          project_id: projectId,
          title: taskData.title,
          user_id: user.id,
          started_at: new Date().toISOString()
        })
        .select()
        .single()

      if (taskError) throw taskError

      if (taskData.items.length > 0) {
        const itemsToInsert = taskData.items.map(d => ({
          task_id: newTask.id,
          content: d.content,
          completed: d.completed,
          completed_at: null,
          user_id: user.id
        }))

        const { error: insertError } = await supabase
          .from('task_items')
          .insert(itemsToInsert)

        if (insertError) throw insertError
      }

      await updateProjectTimestamp(projectId)
      await fetchProjects()
    } catch (error) {
      console.error('빠른 태스크 추가 실패:', error)
    }
  }

  const handleEditInfo = (info) => {
    setEditingInfo(info)
    setShowInfoModal(true)
  }

  const handleEditProject = (project) => {
    setEditingProject(project)
    setShowProjectModal(true)
  }

  const selectProject = (projectId) => {
    setActiveProjectId(projectId)
    setActiveAssignmentId(null)
    setActiveView('project')
  }

  const selectAssignment = (assignmentId) => {
    setActiveAssignmentId(assignmentId)
    setActiveProjectId(null)
    setActiveView('assignment')
  }

  const getExpiredTasks = () => {
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    return projects.flatMap(p =>
      p.tasks.filter(t => {
        if (!t.started_at) return false
        const startedAt = new Date(t.started_at)
        startedAt.setHours(0, 0, 0, 0)
        const diffDays = Math.floor((today - startedAt) / (1000 * 60 * 60 * 24))
        return diffDays >= 7
      }).map(t => ({
        ...t,
        projectName: p.name,
        projectColor: p.color,
        projectId: p.id
      }))
    )
  }

  const handleRestartTask = async (taskId) => {
    try {
      const { error } = await supabase
        .from('tasks')
        .update({ started_at: new Date().toISOString() })
        .eq('id', taskId)

      if (error) throw error
      await fetchProjects()
    } catch (error) {
      console.error('태스크 리셋 실패:', error)
    }
  }

  const handleCompleteTask = async (taskId) => {
    try {
      const { error } = await supabase
        .from('task_items')
        .update({
          completed: true,
          completed_at: new Date().toISOString()
        })
        .eq('task_id', taskId)

      if (error) throw error
      await fetchProjects()
    } catch (error) {
      console.error('태스크 완료 처리 실패:', error)
    }
  }

  const handleArchiveTask = async (taskId) => {
    try {
      const { error } = await supabase
        .from('tasks')
        .update({ archived: true })
        .eq('id', taskId)

      if (error) throw error
      await fetchProjects()
    } catch (error) {
      console.error('태스크 보관 실패:', error)
    }
  }

  const handleRestoreTask = async (taskId) => {
    try {
      const { error } = await supabase
        .from('tasks')
        .update({ archived: false })
        .eq('id', taskId)

      if (error) throw error
      await fetchProjects()
      setActiveView('archive')
    } catch (error) {
      console.error('태스크 복원 실패:', error)
    }
  }

  const handleArchiveProject = async (projectId) => {
    try {
      const { error } = await supabase
        .from('projects')
        .update({ archived: true })
        .eq('id', projectId)

      if (error) throw error
      setActiveView('dashboard')
      setActiveProjectId(null)
      await fetchProjects()
    } catch (error) {
      console.error('프로젝트 보관 실패:', error)
    }
  }

  const handleRestoreProject = async (projectId) => {
    try {
      const { error } = await supabase
        .from('projects')
        .update({ archived: false })
        .eq('id', projectId)

      if (error) throw error
      await fetchProjects()
      setActiveView('archive')
    } catch (error) {
      console.error('프로젝트 복원 실패:', error)
    }
  }

  const handleSaveAssignment = async (assignmentData) => {
    try {
      if (editingAssignment) {
        const { error } = await supabase
          .from('assignments')
          .update({
            name: assignmentData.name,
            start_date: assignmentData.start_date,
            end_date: assignmentData.end_date,
            color: assignmentData.color,
            priority: assignmentData.priority
          })
          .eq('id', editingAssignment.id)

        if (error) throw error
      } else {
        const maxOrder = assignments.reduce((max, c) => Math.max(max, c.sort_order || 0), 0)
        const { error } = await supabase
          .from('assignments')
          .insert({
            name: assignmentData.name,
            start_date: assignmentData.start_date,
            end_date: assignmentData.end_date,
            color: assignmentData.color,
            priority: assignmentData.priority,
            user_id: user.id,
            sort_order: maxOrder + 1
          })

        if (error) throw error
      }

      await fetchAssignments()
      setShowAssignmentModal(false)
      setEditingAssignment(null)
    } catch (error) {
      console.error('과제 저장 실패:', error)
    }
  }

  const handleDeleteAssignment = async (assignmentId) => {
    try {
      const { error } = await supabase
        .from('assignments')
        .delete()
        .eq('id', assignmentId)

      if (error) throw error

      await fetchAssignments()
      await fetchProjects()
    } catch (error) {
      console.error('과제 삭제 실패:', error)
    }
  }

  const handleReorderProject = async (projectId, targetProjectId, newCategoryId) => {
    try {
      if (targetProjectId === null) {
        const categoryProjects = projects.filter(p => p.assignment_id === newCategoryId)
        const maxOrder = categoryProjects.reduce((max, p) => Math.max(max, p.sort_order || 0), -1)

        const { error } = await supabase
          .from('projects')
          .update({
            assignment_id: newCategoryId,
            sort_order: maxOrder + 1
          })
          .eq('id', projectId)

        if (error) throw error
      } else {
        const draggedProject = projects.find(p => p.id === projectId)
        const categoryProjects = projects
          .filter(p => p.assignment_id === newCategoryId && p.id !== projectId)
          .sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0))

        const targetIndex = categoryProjects.findIndex(p => p.id === targetProjectId)
        categoryProjects.splice(targetIndex, 0, { ...draggedProject, assignment_id: newCategoryId })

        const updates = categoryProjects.map((p, index) => ({
          id: p.id,
          sort_order: index,
          assignment_id: newCategoryId
        }))

        for (const update of updates) {
          await supabase
            .from('projects')
            .update({
              sort_order: update.sort_order,
              assignment_id: update.assignment_id
            })
            .eq('id', update.id)
        }
      }

      await fetchProjects()
    } catch (error) {
      console.error('프로젝트 순서 변경 실패:', error)
    }
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
        assignments={assignments}
        activeView={activeView}
        activeProjectId={activeProjectId}
        activeAssignmentId={activeAssignmentId}
        onSelectDashboard={() => setActiveView('dashboard')}
        onSelectProject={selectProject}
        onSelectAssignment={selectAssignment}
        onSelectArchive={() => setActiveView('archive')}
        onAddProject={() => {
          setEditingProject(null)
          setShowProjectModal(true)
        }}
        onAddAssignment={() => {
          setEditingAssignment(null)
          setShowAssignmentModal(true)
        }}
        onEditAssignment={(assignment) => {
          setEditingAssignment(assignment)
          setShowAssignmentModal(true)
        }}
        onReorderProject={handleReorderProject}
        user={user}
        userProfile={userProfile}
        onOpenSettings={() => setShowSettingsPanel(true)}
      />

      <main className="main-content">
        {activeView === 'dashboard' ? (
          <Dashboard
            assignments={assignments}
            projects={projects}
            onSelectAssignment={selectAssignment}
          />
        ) : activeView === 'archive' ? (
          <ArchiveView
            archivedProjects={archivedProjects}
            archivedTasks={archivedTasks}
            onRestoreProject={handleRestoreProject}
            onDeleteProject={handleDeleteProject}
            onRestoreTask={handleRestoreTask}
            onDeleteTask={handleDeleteTask}
          />
        ) : activeView === 'assignment' && activeAssignment ? (
          <AssignmentDetail
            assignment={activeAssignment}
            projects={projects}
            user={user}
            onSelectProject={selectProject}
            onEditAssignment={(assignment) => {
              setEditingAssignment(assignment)
              setShowAssignmentModal(true)
            }}
          />
        ) : activeProject ? (
          <ProjectDetail
            project={activeProject}
            user={user}
            onToggleItem={handleToggleItem}
            onDeleteTask={(taskId) => handleDeleteTask(activeProject.id, taskId)}
            onEditTask={handleEditTask}
            onViewTask={(task) => {
              setViewingTask(task)
              setShowTaskViewModal(true)
            }}
            onAddTask={() => {
              setEditingTask(null)
              setShowTaskModal(true)
            }}
            onEditInfo={handleEditInfo}
            onDeleteInfo={handleDeleteInfo}
            onAddInfo={() => {
              console.log('onAddInfo called, activeProjectId:', activeProjectId)
              setEditingInfo(null)
              setShowInfoModal(true)
            }}
            onEditProject={() => handleEditProject(activeProject)}
            onDeleteProject={() => handleDeleteProject(activeProject.id)}
            onArchiveProject={() => handleArchiveProject(activeProject.id)}
            onArchiveTask={handleArchiveTask}
          />
        ) : null}
      </main>

      {showProjectModal && (
        <ProjectModal
          project={editingProject}
          assignments={assignments}
          colors={COLORS}
          onSave={handleAddProject}
          onClose={() => {
            setShowProjectModal(false)
            setEditingProject(null)
          }}
        />
      )}

      {showAssignmentModal && (
        <AssignmentModal
          assignment={editingAssignment}
          onSave={handleSaveAssignment}
          onDelete={handleDeleteAssignment}
          onClose={() => {
            setShowAssignmentModal(false)
            setEditingAssignment(null)
          }}
        />
      )}

      {showTaskModal && (
        <TaskModal
          task={editingTask}
          onSave={handleSaveTask}
          onClose={() => {
            setShowTaskModal(false)
            setEditingTask(null)
          }}
          onArchive={handleArchiveTask}
        />
      )}

      {showTaskViewModal && viewingTask && (
        <TaskViewModal
          task={viewingTask}
          onClose={() => {
            setShowTaskViewModal(false)
            setViewingTask(null)
          }}
          onEdit={(task) => {
            setEditingTask(task)
            setShowTaskModal(true)
          }}
          onDelete={(taskId) => handleDeleteTask(activeProjectId, taskId)}
          onArchive={handleArchiveTask}
          onToggleItem={handleToggleItem}
        />
      )}

      {showInfoModal && (
        <InfoModal
          info={editingInfo}
          onSave={handleSaveInfo}
          onClose={() => {
            setShowInfoModal(false)
            setEditingInfo(null)
          }}
        />
      )}

      {showSettingsPanel && (
        <SettingsPanel
          user={user}
          userProfile={userProfile}
          onClose={() => setShowSettingsPanel(false)}
          onLogout={handleLogout}
        />
      )}
    </div>
  )
}

export default App
