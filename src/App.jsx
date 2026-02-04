import { useState, useEffect, useCallback } from 'react'
import { supabase } from './lib/supabase'
import Auth from './components/Auth'
import Sidebar from './components/Sidebar'
import Dashboard from './components/Dashboard'
import ProjectDetail from './components/ProjectDetail'
import ProjectModal from './components/ProjectModal'
import MemoModal from './components/MemoModal'
import MemoViewModal from './components/MemoViewModal'
import InfoModal from './components/InfoModal'
import CategoryModal from './components/CategoryModal'
import SettingsPanel from './components/SettingsPanel'
import ArchiveView from './components/ArchiveView'

const COLORS = ['#2c3e50', '#3498db', '#27ae60', '#e67e22', '#9b59b6', '#e74c3c', '#1abc9c', '#f39c12']

function App() {
  const [user, setUser] = useState(null)
  const [userProfile, setUserProfile] = useState(null)
  const [authLoading, setAuthLoading] = useState(true)
  const [projects, setProjects] = useState([])
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)
  const [activeView, setActiveView] = useState('dashboard')
  const [activeProjectId, setActiveProjectId] = useState(null)
  const [showProjectModal, setShowProjectModal] = useState(false)
  const [showMemoModal, setShowMemoModal] = useState(false)
  const [showMemoViewModal, setShowMemoViewModal] = useState(false)
  const [showInfoModal, setShowInfoModal] = useState(false)
  const [showCategoryModal, setShowCategoryModal] = useState(false)
  const [showSettingsPanel, setShowSettingsPanel] = useState(false)
  const [editingProject, setEditingProject] = useState(null)
  const [editingMemo, setEditingMemo] = useState(null)
  const [viewingMemo, setViewingMemo] = useState(null)
  const [editingInfo, setEditingInfo] = useState(null)
  const [editingCategory, setEditingCategory] = useState(null)
  const [archivedProjects, setArchivedProjects] = useState([])
  const [archivedMemos, setArchivedMemos] = useState([])

  // 카테고리 데이터 가져오기
  const fetchCategories = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('project_categories')
        .select('*')
        .order('sort_order', { ascending: true })

      if (error) throw error
      setCategories(data || [])
    } catch (error) {
      console.error('카테고리 로드 실패:', error)
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

      // archived가 아닌 프로젝트만, archived가 아닌 메모만 포함
      const projectsWithData = projectsData
        .filter(project => !project.archived)
        .map(project => ({
          ...project,
          infos: infosData.filter(info => info.project_id === project.id),
          memos: memosWithDetails.filter(memo => memo.project_id === project.id && !memo.archived)
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
      fetchCategories()
      fetchProjects()
    }
  }, [user, fetchProjects, fetchCategories])

  // 보관함 뷰 진입 시 보관 항목 로드
  useEffect(() => {
    const loadArchivedItems = async () => {
      try {
        // 보관된 프로젝트 로드
        const { data: projectsData, error: projectsError } = await supabase
          .from('projects')
          .select('*')
          .eq('archived', true)
          .order('updated_at', { ascending: false })

        if (projectsError) throw projectsError
        setArchivedProjects(projectsData || [])

        // 보관된 메모 로드
        const { data: memosData, error: memosError } = await supabase
          .from('memos')
          .select('*')
          .eq('archived', true)
          .order('created_at', { ascending: false })

        if (memosError) throw memosError

        const { data: detailsData, error: detailsError } = await supabase
          .from('memo_details')
          .select('*')

        if (detailsError) throw detailsError

        // 모든 프로젝트 정보 가져오기 (보관된 것 포함)
        const { data: allProjects } = await supabase
          .from('projects')
          .select('id, name, color')

        const result = memosData.map(memo => {
          const project = allProjects?.find(p => p.id === memo.project_id) || {}
          return {
            ...memo,
            details: detailsData.filter(d => d.memo_id === memo.id),
            projectName: project.name || '삭제된 프로젝트',
            projectColor: project.color || '#ccc',
            projectId: memo.project_id
          }
        })
        setArchivedMemos(result)
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

  // 로그인 안 됐으면 Auth 화면
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

  // 승인 안 됐으면 대기 화면
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
            color: projectData.color,
            category_id: projectData.category_id
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
            category_id: projectData.category_id,
            user_id: user.id
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
            value: infoData.value,
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
          .update({ 
            title: memoData.title,
            priority: memoData.priority || 0
          })
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
            completed_at: d.completed ? (d.completed_at || new Date().toISOString()) : null,
            user_id: user.id
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
            title: memoData.title,
            priority: memoData.priority || 0,
            user_id: user.id,
            started_at: new Date().toISOString()
          })
          .select()
          .single()

        if (memoError) throw memoError

        if (memoData.details.length > 0) {
          const detailsToInsert = memoData.details.map(d => ({
            memo_id: newMemo.id,
            content: d.content,
            completed: d.completed,
            completed_at: d.completed ? new Date().toISOString() : null,
            user_id: user.id
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
          title: memoData.title,
          user_id: user.id,
          started_at: new Date().toISOString()
        })
        .select()
        .single()

      if (memoError) throw memoError

      if (memoData.details.length > 0) {
        const detailsToInsert = memoData.details.map(d => ({
          memo_id: newMemo.id,
          content: d.content,
          completed: d.completed,
          completed_at: null,
          user_id: user.id
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

  // 정리 필요 메모 핸들러
  const getExpiredMemos = () => {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    
    return projects.flatMap(p => 
      p.memos.filter(m => {
        if (!m.started_at) return false
        const startedAt = new Date(m.started_at)
        startedAt.setHours(0, 0, 0, 0)
        const diffDays = Math.floor((today - startedAt) / (1000 * 60 * 60 * 24))
        return diffDays >= 7
      }).map(m => ({
        ...m,
        projectName: p.name,
        projectColor: p.color,
        projectId: p.id
      }))
    )
  }

  const handleRestartMemo = async (memoId) => {
    try {
      const { error } = await supabase
        .from('memos')
        .update({ started_at: new Date().toISOString() })
        .eq('id', memoId)

      if (error) throw error
      await fetchProjects()
    } catch (error) {
      console.error('메모 리셋 실패:', error)
    }
  }

  const handleCompleteMemo = async (memoId) => {
    try {
      // 해당 메모의 모든 상세내용을 완료 처리
      const { error } = await supabase
        .from('memo_details')
        .update({ 
          completed: true,
          completed_at: new Date().toISOString()
        })
        .eq('memo_id', memoId)

      if (error) throw error
      await fetchProjects()
    } catch (error) {
      console.error('메모 완료 처리 실패:', error)
    }
  }

  const handleArchiveMemo = async (memoId) => {
    try {
      const { error } = await supabase
        .from('memos')
        .update({ archived: true })
        .eq('id', memoId)

      if (error) throw error
      await fetchProjects()
    } catch (error) {
      console.error('메모 보관 실패:', error)
    }
  }

  const handleRestoreMemo = async (memoId) => {
    try {
      const { error } = await supabase
        .from('memos')
        .update({ archived: false })
        .eq('id', memoId)

      if (error) throw error
      await fetchProjects()
      setActiveView('archive') // 보관함 새로고침
    } catch (error) {
      console.error('메모 복원 실패:', error)
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
      setActiveView('archive') // 보관함 새로고침
    } catch (error) {
      console.error('프로젝트 복원 실패:', error)
    }
  }

  // 카테고리 저장
  const handleSaveCategory = async (categoryData) => {
    try {
      if (editingCategory) {
        const { error } = await supabase
          .from('project_categories')
          .update({ name: categoryData.name })
          .eq('id', editingCategory.id)

        if (error) throw error
      } else {
        const maxOrder = categories.reduce((max, c) => Math.max(max, c.sort_order || 0), 0)
        const { error } = await supabase
          .from('project_categories')
          .insert({
            name: categoryData.name,
            user_id: user.id,
            sort_order: maxOrder + 1
          })

        if (error) throw error
      }
      
      await fetchCategories()
      setShowCategoryModal(false)
      setEditingCategory(null)
    } catch (error) {
      console.error('카테고리 저장 실패:', error)
    }
  }

  // 카테고리 삭제
  const handleDeleteCategory = async (categoryId) => {
    try {
      const { error } = await supabase
        .from('project_categories')
        .delete()
        .eq('id', categoryId)

      if (error) throw error
      
      await fetchCategories()
      await fetchProjects()
    } catch (error) {
      console.error('카테고리 삭제 실패:', error)
    }
  }

  // 프로젝트 순서/카테고리 변경
  const handleReorderProject = async (projectId, targetProjectId, newCategoryId) => {
    try {
      // 카테고리만 변경
      if (targetProjectId === null) {
        const { error } = await supabase
          .from('projects')
          .update({ category_id: newCategoryId })
          .eq('id', projectId)

        if (error) throw error
      } else {
        // 순서 변경 로직
        const targetProject = projects.find(p => p.id === targetProjectId)
        const { error } = await supabase
          .from('projects')
          .update({ 
            category_id: newCategoryId,
            sort_order: targetProject?.sort_order || 0
          })
          .eq('id', projectId)

        if (error) throw error
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
        categories={categories}
        activeView={activeView}
        activeProjectId={activeProjectId}
        onSelectDashboard={() => setActiveView('dashboard')}
        onSelectProject={selectProject}
        onSelectArchive={() => setActiveView('archive')}
        onAddProject={() => {
          setEditingProject(null)
          setShowProjectModal(true)
        }}
        onAddCategory={() => {
          setEditingCategory(null)
          setShowCategoryModal(true)
        }}
        onEditCategory={(category) => {
          setEditingCategory(category)
          setShowCategoryModal(true)
        }}
        onReorderProject={handleReorderProject}
        user={user}
        userProfile={userProfile}
        onOpenSettings={() => setShowSettingsPanel(true)}
      />

      <main className="main-content">
        {activeView === 'dashboard' ? (
          <Dashboard
            projects={projects}
            onSelectProject={selectProject}
            onAddMemo={handleQuickAddMemo}
          />
        ) : activeView === 'archive' ? (
          <ArchiveView
            archivedProjects={archivedProjects}
            archivedMemos={archivedMemos}
            onRestoreProject={handleRestoreProject}
            onDeleteProject={handleDeleteProject}
            onRestoreMemo={handleRestoreMemo}
            onDeleteMemo={handleDeleteMemo}
          />
        ) : activeProject ? (
          <ProjectDetail
            project={activeProject}
            onToggleDetail={handleToggleDetail}
            onDeleteMemo={(memoId) => handleDeleteMemo(activeProject.id, memoId)}
            onEditMemo={handleEditMemo}
            onViewMemo={(memo) => {
              setViewingMemo(memo)
              setShowMemoViewModal(true)
            }}
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
            onArchiveProject={() => handleArchiveProject(activeProject.id)}
            onArchiveMemo={handleArchiveMemo}
          />
        ) : null}
      </main>

      {showProjectModal && (
        <ProjectModal
          project={editingProject}
          categories={categories}
          colors={COLORS}
          onSave={handleAddProject}
          onClose={() => {
            setShowProjectModal(false)
            setEditingProject(null)
          }}
        />
      )}

      {showCategoryModal && (
        <CategoryModal
          category={editingCategory}
          onSave={handleSaveCategory}
          onDelete={handleDeleteCategory}
          onClose={() => {
            setShowCategoryModal(false)
            setEditingCategory(null)
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
          onArchive={handleArchiveMemo}
        />
      )}

      {showMemoViewModal && viewingMemo && (
        <MemoViewModal
          memo={viewingMemo}
          onClose={() => {
            setShowMemoViewModal(false)
            setViewingMemo(null)
          }}
          onEdit={(memo) => {
            setEditingMemo(memo)
            setShowMemoModal(true)
          }}
          onDelete={(memoId) => handleDeleteMemo(activeProjectId, memoId)}
          onArchive={handleArchiveMemo}
          onToggleDetail={handleToggleDetail}
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
