import { Plus, Edit2, Trash2, Check, FileText, Copy, ExternalLink, StickyNote, Archive } from 'lucide-react'
import { useState } from 'react'

function ProjectDetail({ 
  project, 
  onToggleDetail,
  onDeleteMemo, 
  onEditMemo,
  onViewMemo,
  onAddMemo,
  onEditInfo,
  onDeleteInfo,
  onAddInfo,
  onEditProject, 
  onDeleteProject,
  onArchiveProject,
  onArchiveMemo
}) {
  const [copiedId, setCopiedId] = useState(null)
  const [sortOrder, setSortOrder] = useState('newest') // newest, oldest, priority

  // 삭제 확인
  const handleDeleteProject = () => {
    if (window.confirm(`"${project.name}" 프로젝트를 삭제할까요?\n모든 메모와 정보가 함께 삭제됩니다.`)) {
      onDeleteProject()
    }
  }

  const handleArchiveProject = () => {
    if (window.confirm(`"${project.name}" 프로젝트를 보관할까요?`)) {
      onArchiveProject()
    }
  }

  // 상세내용 기준 진행률
  const totalCount = project.memos.reduce((sum, m) => sum + (m.details?.length || 0), 0)
  const completedCount = project.memos.reduce((sum, m) => 
    sum + (m.details?.filter(d => d.completed).length || 0), 0
  )
  const progress = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0

  // 서클 진행률 계산
  const circleRadius = 50
  const circleCircumference = 2 * Math.PI * circleRadius
  const circleOffset = circleCircumference - (progress / 100) * circleCircumference

  const formatDate = (dateStr) => {
    if (!dateStr) return ''
    const date = new Date(dateStr)
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    return `${month}/${day}`
  }

  const handleCopy = async (id, value) => {
    try {
      await navigator.clipboard.writeText(value)
      setCopiedId(id)
      setTimeout(() => setCopiedId(null), 1500)
    } catch (err) {
      console.error('복사 실패:', err)
    }
  }

  const handleOpenUrl = (url) => {
    window.open(url, '_blank')
  }

  // 정렬
  const sortedMemos = [...project.memos].sort((a, b) => {
    switch (sortOrder) {
      case 'oldest':
        return new Date(a.created_at) - new Date(b.created_at)
      case 'priority':
        return (b.priority || 0) - (a.priority || 0)
      case 'newest':
      default:
        return new Date(b.created_at) - new Date(a.created_at)
    }
  })

  const renderPriority = (priority) => {
    const filled = priority || 0
    return (
      <div className="priority-display-sm">
        {[1, 2, 3, 4, 5].map(i => (
          <span 
            key={i} 
            className="priority-star-sm"
          >
            {i <= filled ? '★' : '☆'}
          </span>
        ))}
      </div>
    )
  }

  const getInfoIcon = (type) => {
    switch (type) {
      case 'command': return <Copy size={14} strokeWidth={1.2} />
      case 'url': return <ExternalLink size={14} strokeWidth={1.2} />
      case 'note': return <StickyNote size={14} strokeWidth={1.2} />
      default: return null
    }
  }

  return (
    <>
      <header className="content-header">
        <div className="project-header">
          <div className="project-title-section">
            <div 
              className="project-color-large" 
              style={{ backgroundColor: project.color }}
            />
            <h1 className="content-title">{project.name}</h1>
          </div>
          <div className="project-actions">
            <button className="btn btn-ghost btn-sm" onClick={onEditProject}>
              <Edit2 size={14} strokeWidth={1.2} />
              수정
            </button>
            <button className="btn btn-ghost btn-sm" onClick={handleArchiveProject}>
              <Archive size={14} strokeWidth={1.2} />
              보관
            </button>
            <button className="btn btn-ghost btn-sm" onClick={handleDeleteProject}>
              <Trash2 size={14} strokeWidth={1.2} />
              삭제
            </button>
          </div>
        </div>
        {project.description && (
          <p className="content-subtitle">{project.description}</p>
        )}
      </header>

      <div className="content-body">
        {/* 진행률 + 프로젝트 인포 2열 그리드 */}
        <div className="progress-info-grid">
          {/* 좌측: 프로그레스 써클 (1/3) */}
          <div className="progress-circle-card">
            <div className="circle-progress">
              <svg width="120" height="120" viewBox="0 0 120 120">
                <defs>
                  <linearGradient id="progressGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor={project.color} stopOpacity="0.3" />
                    <stop offset="100%" stopColor={project.color} />
                  </linearGradient>
                </defs>
                <circle
                  cx="60"
                  cy="60"
                  r={circleRadius}
                  fill="none"
                  stroke="var(--border)"
                  strokeWidth="6"
                />
                <circle
                  cx="60"
                  cy="60"
                  r={circleRadius}
                  fill="none"
                  stroke="url(#progressGradient)"
                  strokeWidth="6"
                  strokeLinecap="round"
                  strokeDasharray={circleCircumference}
                  strokeDashoffset={circleOffset}
                  transform="rotate(-90 60 60)"
                  style={{ transition: 'stroke-dashoffset 0.5s ease' }}
                />
              </svg>
              <div className="circle-progress-text">
                <span className="circle-progress-value">{progress}</span>
                <span className="circle-progress-unit">%</span>
              </div>
            </div>
            <div className="circle-progress-label">
              {completedCount} / {totalCount} 완료
            </div>
            {/* 메모별 진행률 */}
            {project.memos.length > 0 && (
              <div className="memo-progress-list">
                {project.memos.map(memo => {
                  const memoTotal = memo.details?.length || 0
                  const memoCompleted = memo.details?.filter(d => d.completed).length || 0
                  const memoProgress = memoTotal > 0 ? Math.round((memoCompleted / memoTotal) * 100) : 0
                  return (
                    <div key={memo.id} className="memo-progress-row">
                      <span className="memo-progress-title">{memo.title}</span>
                      <span className="memo-progress-percent">{memoProgress}%</span>
                    </div>
                  )
                })}
              </div>
            )}
          </div>

          {/* 우측: 프로젝트 인포 (2/3) */}
          <div className="info-card">
            <div className="info-card-header">
              <span className="info-card-title">프로젝트 인포</span>
              <button className="btn btn-secondary btn-sm" onClick={onAddInfo}>
                <Plus size={14} strokeWidth={1.2} />
                추가
              </button>
            </div>

            {project.infos && project.infos.length > 0 ? (
              <div className="info-list">
                {project.infos.map(info => (
                  <div key={info.id} className="info-item">
                    <div className="info-content">
                      <span className="info-label">{info.label}</span>
                      <div className="info-value-box">
                        <span className="info-value">{info.value}</span>
                      </div>
                    </div>
                    <div className="info-actions">
                      {info.type === 'url' ? (
                        <button 
                          className="info-action-btn"
                          onClick={() => handleOpenUrl(info.value)}
                        >
                          <ExternalLink size={14} strokeWidth={1.2} />
                        </button>
                      ) : (
                        <button 
                          className={`info-action-btn ${copiedId === info.id ? 'copied' : ''}`}
                          onClick={() => handleCopy(info.id, info.value)}
                        >
                          {copiedId === info.id ? (
                            <Check size={14} strokeWidth={1.2} />
                          ) : (
                            <Copy size={14} strokeWidth={1.2} />
                          )}
                        </button>
                      )}
                      <button 
                        className="info-action-btn"
                        onClick={() => onEditInfo(info)}
                      >
                        <Edit2 size={14} strokeWidth={1.2} />
                      </button>
                      <button 
                        className="info-action-btn delete"
                        onClick={() => onDeleteInfo(info.id)}
                      >
                        <Trash2 size={14} strokeWidth={1.2} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="info-empty">
                자주 쓰는 명령어, URL, 메모를 추가하세요
              </div>
            )}
          </div>
        </div>

        {/* 메모 섹션 */}
        <div className="memo-section">
          <div className="memo-header">
            <h2 className="memo-title">메모</h2>
            <div className="memo-header-actions">
              <select 
                className="memo-sort-select"
                value={sortOrder}
                onChange={e => setSortOrder(e.target.value)}
              >
                <option value="newest">최신순</option>
                <option value="oldest">오래된순</option>
                <option value="priority">중요도순</option>
              </select>
              <button className="btn btn-primary btn-sm" onClick={onAddMemo}>
                <Plus size={14} strokeWidth={1.2} />
                추가
              </button>
            </div>
          </div>

          {sortedMemos.length === 0 ? (
            <div className="memo-empty">
              <div className="empty-state">
                <FileText strokeWidth={1.2} />
                <div className="empty-state-title">메모가 없어요</div>
                <div className="empty-state-desc">새로운 메모를 추가해보세요</div>
              </div>
            </div>
          ) : (
            <div className="memo-grid">
              {sortedMemos.map(memo => {
                const memoCompleted = memo.details?.length > 0 && 
                  memo.details.every(d => d.completed)
                
                return (
                  <div 
                    key={memo.id} 
                    className={`memo-card ${memoCompleted ? 'all-completed' : ''}`}
                    onClick={() => onViewMemo(memo)}
                  >
                    <div className="memo-card-header">
                      <span className="memo-card-date">{formatDate(memo.created_at)}</span>
                      <span className="memo-card-title">
                        {memo.title}
                      </span>
                      {renderPriority(memo.priority)}
                    </div>
                    
                    {memo.details && memo.details.length > 0 && (
                      <ul className="memo-card-details">
                        {memo.details.map((detail) => (
                          <li 
                            key={detail.id} 
                            className={`detail-item-row ${detail.completed ? 'completed' : ''}`}
                            onClick={e => e.stopPropagation()}
                          >
                            <div 
                              className={`detail-checkbox ${detail.completed ? 'checked' : ''}`}
                              onClick={() => onToggleDetail(detail.id, detail.completed)}
                            >
                              {detail.completed && <Check size={10} strokeWidth={1.2} />}
                            </div>
                            <span className="detail-content">{detail.content}</span>
                            {detail.completed_at && (
                              <span className="detail-completed-date">
                                {formatDate(detail.completed_at)}
                              </span>
                            )}
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </>
  )
}

export default ProjectDetail
