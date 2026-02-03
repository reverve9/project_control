import { useState } from 'react'
import { FolderOpen, Plus, FileText, Palette } from 'lucide-react'

function Dashboard({ projects, onSelectProject, onAddMemo, onOpenStyleGuide }) {
  const [selectedProjectId, setSelectedProjectId] = useState('')
  const [memoTitle, setMemoTitle] = useState('')
  const [memoDetail, setMemoDetail] = useState('')

  // 통계 계산 (상세내용 기준)
  const totalProjects = projects.length
  
  const totalDetails = projects.reduce((sum, p) => 
    sum + p.memos.reduce((mSum, m) => mSum + (m.details?.length || 0), 0), 0
  )
  
  const completedDetails = projects.reduce((sum, p) => 
    sum + p.memos.reduce((mSum, m) => 
      mSum + (m.details?.filter(d => d.completed).length || 0), 0
    ), 0
  )
  
  const pendingDetails = totalDetails - completedDetails

  // 프로젝트 진행률 (상세내용 기준)
  const projectProgress = projects.map(p => {
    const total = p.memos.reduce((sum, m) => sum + (m.details?.length || 0), 0)
    const completed = p.memos.reduce((sum, m) => 
      sum + (m.details?.filter(d => d.completed).length || 0), 0
    )
    const progress = total > 0 ? Math.round((completed / total) * 100) : 0
    return { ...p, progress, completed, total }
  }).sort((a, b) => b.progress - a.progress)

  // 전체 메모 (최신순)
  const allMemos = projects.flatMap(p => 
    p.memos.map(m => ({ ...m, projectName: p.name, projectColor: p.color, projectId: p.id }))
  ).sort((a, b) => new Date(b.created_at) - new Date(a.created_at))

  const formatDate = (dateStr) => {
    if (!dateStr) return ''
    const date = new Date(dateStr)
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    return `${month}/${day}`
  }

  const handleSubmitMemo = (e) => {
    e.preventDefault()
    if (!selectedProjectId || !memoTitle.trim()) return

    const details = memoDetail.trim() 
      ? [{ content: memoDetail.trim(), completed: false }] 
      : []

    onAddMemo(selectedProjectId, {
      title: memoTitle.trim(),
      details
    })

    setMemoTitle('')
    setMemoDetail('')
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing) {
      e.preventDefault()
      handleSubmitMemo(e)
    }
  }

  return (
    <>
      <header className="content-header">
        <div className="content-header-row">
          <div className="content-header-left">
            <h1 className="content-title">대시보드</h1>
            <p className="content-subtitle">전체 프로젝트 현황을 한눈에 확인하세요</p>
          </div>
          <button className="btn btn-ghost btn-sm" onClick={onOpenStyleGuide}>
            <Palette size={16} />
            스타일 가이드
          </button>
        </div>
      </header>

      <div className="content-body">
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-label">전체 프로젝트</div>
            <div className="stat-value">{totalProjects}</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">전체 항목</div>
            <div className="stat-value">{totalDetails}</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">완료됨</div>
            <div className="stat-value success">{completedDetails}</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">진행중</div>
            <div className="stat-value warning">{pendingDetails}</div>
          </div>
        </div>

        <div className="progress-grid">
          {/* 좌측: 프로젝트별 진행률 */}
          <div className="dashboard-card">
            <div className="dashboard-card-header">
              <FolderOpen size={18} strokeWidth={1.2} />
              프로젝트별 진행률
            </div>
            <div className="dashboard-card-body">
              {projectProgress.length === 0 ? (
                <div className="empty-state">
                  <FolderOpen strokeWidth={1.2} />
                  <div className="empty-state-title">프로젝트가 없어요</div>
                  <div className="empty-state-desc">새 프로젝트를 만들어보세요</div>
                </div>
              ) : (
                projectProgress.map(project => (
                  <div 
                    key={project.id} 
                    className="project-progress-item"
                    onClick={() => onSelectProject(project.id)}
                    style={{ cursor: 'pointer' }}
                  >
                    <div 
                      className="project-color" 
                      style={{ backgroundColor: project.color }}
                    />
                    <div className="project-progress-info">
                      <div className="project-progress-name">{project.name}</div>
                      <div className="project-progress-bar">
                        <div 
                          className="project-progress-fill"
                          style={{ 
                            width: `${project.progress}%`,
                            backgroundColor: project.color
                          }}
                        />
                      </div>
                    </div>
                    <div className="project-progress-stats">
                      <span className="project-progress-count">{project.completed}/{project.total}</span>
                      <span className="project-progress-value">{project.progress}%</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* 우측: 빠른 메모 입력 */}
          <div className="dashboard-card">
            <div className="dashboard-card-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Plus size={18} strokeWidth={1.2} />
                빠른 메모 추가
              </div>
              <button 
                type="button" 
                className="btn btn-primary btn-sm"
                disabled={!selectedProjectId || !memoTitle.trim()}
                onClick={handleSubmitMemo}
              >
                <Plus size={14} strokeWidth={1.2} />
                추가
              </button>
            </div>
            <div className="dashboard-card-body">
              <form onSubmit={handleSubmitMemo} className="quick-memo-form-vertical">
                <div className="form-group">
                  <label className="form-label">프로젝트</label>
                  <select
                    className="form-input"
                    value={selectedProjectId}
                    onChange={e => setSelectedProjectId(e.target.value)}
                  >
                    <option value="">프로젝트 선택</option>
                    {projects.map(p => (
                      <option key={p.id} value={p.id}>{p.name}</option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">제목</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="메모 제목"
                    value={memoTitle}
                    onChange={e => setMemoTitle(e.target.value)}
                    onKeyDown={handleKeyDown}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">상세내용 (선택)</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="상세내용 입력"
                    value={memoDetail}
                    onChange={e => setMemoDetail(e.target.value)}
                    onKeyDown={handleKeyDown}
                  />
                </div>
              </form>
            </div>
          </div>
        </div>

        {/* 전체 메모 리스트 */}
        <div className="dashboard-card full-width">
          <div className="dashboard-card-header">
            <FileText size={18} strokeWidth={1.2} />
            전체 메모
          </div>
          <div className="dashboard-card-body">
            {allMemos.length === 0 ? (
              <div className="empty-state">
                <FileText strokeWidth={1.2} />
                <div className="empty-state-title">메모가 없어요</div>
                <div className="empty-state-desc">위에서 빠른 메모를 추가해보세요</div>
              </div>
            ) : (
              <div className="all-memo-grid">
                {allMemos.map(memo => (
                  <div 
                    key={memo.id} 
                    className="all-memo-card"
                    onClick={() => onSelectProject(memo.projectId)}
                  >
                    <div className="all-memo-header">
                      <span className="all-memo-date">[{formatDate(memo.created_at)}]</span>
                      <span className="all-memo-title">{memo.title}</span>
                    </div>
                    <div className="all-memo-project">
                      <div 
                        className="project-color" 
                        style={{ backgroundColor: memo.projectColor }}
                      />
                      <span>{memo.projectName}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  )
}

export default Dashboard
