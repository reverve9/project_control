import { useState, useEffect } from 'react'
import { supabase } from './lib/supabase'
import Sidebar from './components/Sidebar'
import Dashboard from './components/Dashboard'
import ProjectDetail from './components/ProjectDetail'
import ProjectModal from './components/ProjectModal'
import MemoModal from './components/MemoModal'
import InfoModal from './components/InfoModal'

const COLORS = ['#2c3e50', '#3498db', '#27ae60', '#e67e22', '#9b59b6', '#e74c3c', '#1abc9c', '#f39c12']

function App() {
  const [projects, setProjects] = useState([])
  const [loading, setLoading] = useState(true)
  const [activeView, setActiveView] = useState('dashboard')
  const [activeProjectId, setActiveProjectId] = useState(null)
  const [showProjectModal, setShowProjectModal] = useState(false)
  const [showMemoModal, setShowMemoModal] = useState(false)
  const [showInfoModal, setShowInfoModal] = useState(false)
  const [editingProject, setEditingProject] = useState(null)
  const [editingMemo, setEditingMemo] = useState(null)
  const [editingInfo, setEditingInfo] = useState(null)

  useEffect(() => {
    fetchProjects()
  }, [])

  const fetchProjects = async () => {
    try {
      const { data: projectsData, error: projectsError } = await supabase
        .from('projects')
        .select('*')
        .order('updated_at', { ascending: false })

      if (projectsError) throw projectsError

      const { data: infosData, error: infosError } = await supabase
        .from('project_infos')
        .select('*')
        .order('created_at', { ascending: true })

      if (infosError) throw infosError

      const { data: memosData, error: memosError } = await supabase
        .from('memos')
        .select('*')
        .order('created_at', { ascending: false })

      if (memosError) throw memosError

      const { data: detailsData, error: detailsError } = await supabase
        .from('memo_details')
        .select('*')
        .order('created_at', { ascending: true })

      if (detailsError) throw detailsError

      const memosWithDetails = memosData.map(memo => ({
        ...memo,
        details: detailsData.filter(d => d.memo_id === memo.id)
      }))

      const projectsWithData = projectsData.map(project => ({
        ...project,
        infos: infosData.filter(info => info.project_id === project.id),
        memos: memosWithDetails.filter(memo => memo.project_id === project.id)
      }))

      setProjects(projectsWithData)
    } catch (error) {
      console.error('데이터 로드 실패:', error)
    } finally {
      setLoading(false)
    }
  }

  const activeProject = projects.find(p => p.id === activeProjectId)

  // 프로젝트 updated_at 업데이트
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
            color: projectData.color
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
            color: projectData.color
          })
          .select()
          .single()

        if (error) throw error

        setProjects(prev => [...prev, { ...data, infos: [], memos: [] }])
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

  // 프로젝트 인포 저장
  const handleSaveInfo = async (infoData) => {
    try {
      if (editingInfo) {
        const { error } = await supabase
          .from('project_infos')
          .update({
            type: infoData.type,
            label: infoData.label,
            value: infoData.value
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
            value: infoData.value
          })

        if (error) throw error
      }

      await updateProjectTimestamp(activeProjectId)
      await fetchProjects()
      setShowInfoModal(false)
      setEditingInfo(null)
    } catch (error) {
      console.error('인포 저장 실패:', error)
    }
  }

  // 프로젝트 인포 삭제
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

  const handleSaveMemo = async (memoData) => {
    try {
      if (editingMemo) {
        const { error: memoError } = await supabase
          .from('memos')
          .update({ title: memoData.title })
          .eq('id', editingMemo.id)

        if (memoError) throw memoError

        const { error: deleteError } = await supabase
          .from('memo_details')
          .delete()
          .eq('memo_id', editingMemo.id)

        if (deleteError) throw deleteError

        if (memoData.details.length > 0) {
          const detailsToInsert = memoData.details.map(d => ({
            memo_id: editingMemo.id,
            content: d.content,
            completed: d.completed,
            completed_at: d.completed ? (d.completed_at || new Date().toISOString()) : null
          }))

          const { error: insertError } = await supabase
            .from('memo_details')
            .insert(detailsToInsert)

          if (insertError) throw insertError
        }

        await updateProjectTimestamp(activeProjectId)
        await fetchProjects()
        setEditingMemo(null)
      } else {
        const { data: newMemo, error: memoError } = await supabase
          .from('memos')
          .insert({
            project_id: activeProjectId,
            title: memoData.title
          })
          .select()
          .single()

        if (memoError) throw memoError

        if (memoData.details.length > 0) {
          const detailsToInsert = memoData.details.map(d => ({
            memo_id: newMemo.id,
            content: d.content,
            completed: d.completed,
            completed_at: d.completed ? new Date().toISOString() : null
          }))

          const { error: insertError } = await supabase
            .from('memo_details')
            .insert(detailsToInsert)

          if (insertError) throw insertError
        }

        await updateProjectTimestamp(activeProjectId)
        await fetchProjects()
      }
      setShowMemoModal(false)
    } catch (error) {
      console.error('메모 저장 실패:', error)
    }
  }

  const handleToggleDetail = async (detailId, currentCompleted) => {
    const newCompleted = !currentCompleted
    const completedAt = newCompleted ? new Date().toISOString() : null

    try {
      const { error } = await supabase
        .from('memo_details')
        .update({ 
          completed: newCompleted,
          completed_at: completedAt
        })
        .eq('id', detailId)

      if (error) throw error

      await updateProjectTimestamp(activeProjectId)
      await fetchProjects()
    } catch (error) {
      console.error('상세내용 토글 실패:', error)
    }
  }

  const handleDeleteMemo = async (projectId, memoId) => {
    try {
      const { error } = await supabase
        .from('memos')
        .delete()
        .eq('id', memoId)

      if (error) throw error

      await updateProjectTimestamp(projectId)
      setProjects(prev => prev.map(p =>
        p.id === projectId
          ? { ...p, memos: p.memos.filter(m => m.id !== memoId) }
          : p
      ))
    } catch (error) {
      console.error('메모 삭제 실패:', error)
    }
  }

  const handleEditMemo = (memo) => {
    setEditingMemo(memo)
    setShowMemoModal(true)
  }

  // 대시보드에서 빠른 메모 추가
  const handleQuickAddMemo = async (projectId, memoData) => {
    try {
      const { data: newMemo, error: memoError } = await supabase
        .from('memos')
        .insert({
          project_id: projectId,
          title: memoData.title
        })
        .select()
        .single()

      if (memoError) throw memoError

      if (memoData.details.length > 0) {
        const detailsToInsert = memoData.details.map(d => ({
          memo_id: newMemo.id,
          content: d.content,
          completed: d.completed,
          completed_at: null
        }))

        const { error: insertError } = await supabase
          .from('memo_details')
          .insert(detailsToInsert)

        if (insertError) throw insertError
      }

      await updateProjectTimestamp(projectId)
      await fetchProjects()
    } catch (error) {
      console.error('빠른 메모 추가 실패:', error)
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
            onAddMemo={handleQuickAddMemo}
            onOpenStyleGuide={() => window.electronAPI?.openStyleGuide?.()}
          />
        ) : activeProject ? (
          <ProjectDetail
            project={activeProject}
            onToggleDetail={handleToggleDetail}
            onDeleteMemo={(memoId) => handleDeleteMemo(activeProject.id, memoId)}
            onEditMemo={handleEditMemo}
            onAddMemo={() => {
              setEditingMemo(null)
              setShowMemoModal(true)
            }}
            onEditInfo={handleEditInfo}
            onDeleteInfo={handleDeleteInfo}
            onAddInfo={() => {
              setEditingInfo(null)
              setShowInfoModal(true)
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

      {showMemoModal && (
        <MemoModal
          memo={editingMemo}
          onSave={handleSaveMemo}
          onClose={() => {
            setShowMemoModal(false)
            setEditingMemo(null)
          }}
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
    </div>
  )
}

export default App
