import { useState } from 'react'
import { FolderOpen, Plus, FileText, Check, User } from 'lucide-react'

function Dashboard({ projects, onSelectProject, onAddTask }) {
  const [selectedProjectId, setSelectedProjectId] = useState('')
  const [taskTitle, setTaskTitle] = useState('')
  const [taskItem, setTaskItem] = useState('')

  const formatDate = (dateStr) => {
    if (!dateStr) return ''
    const date = new Date(dateStr)
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    return `${month}/${day}`
  }

  const totalProjects = projects.length

  const totalItems = projects.reduce((sum, p) =>
    sum + p.tasks.reduce((tSum, t) => tSum + (t.items?.length || 0), 0), 0
  )

  const completedItems = projects.reduce((sum, p) =>
    sum + p.tasks.reduce((tSum, t) =>
      tSum + (t.items?.filter(d => d.completed).length || 0), 0
    ), 0
  )

  const pendingItems = totalItems - completedItems

  const projectProgress = projects.map(p => {
    const total = p.tasks.reduce((sum, t) => sum + (t.items?.length || 0), 0)
    const completed = p.tasks.reduce((sum, t) =>
      sum + (t.items?.filter(d => d.completed).length || 0), 0
    )
    const progress = total > 0 ? Math.round((completed / total) * 100) : 0
    return { ...p, progress, completed, total }
  }).sort((a, b) => b.progress - a.progress)

  const allTasks = projects.flatMap(p =>
    p.tasks.map(t => ({ ...t, projectName: p.name, projectColor: p.color, projectId: p.id }))
  ).sort((a, b) => new Date(b.created_at) - new Date(a.created_at))

  const handleSubmitTask = (e) => {
    e.preventDefault()
    if (!selectedProjectId || !taskTitle.trim()) return

    const items = taskItem.trim()
      ? [{ content: taskItem.trim(), completed: false }]
      : []

    onAddTask(selectedProjectId, {
      title: taskTitle.trim(),
      items
    })

    setTaskTitle('')
    setTaskItem('')
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing) {
      e.preventDefault()
      handleSubmitTask(e)
    }
  }

  return (
    <>
      <header className="content-header">
        <h1 className="content-title">대시보드</h1>
        <p className="content-subtitle">전체 프로젝트 현황을 한눈에 확인하세요</p>
      </header>

      <div className="content-body">
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-label">전체 프로젝트</div>
            <div className="stat-value">{totalProjects}</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">전체 항목</div>
            <div className="stat-value">{totalItems}</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">완료됨</div>
            <div className="stat-value success">{completedItems}</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">진행중</div>
            <div className="stat-value warning">{pendingItems}</div>
          </div>
        </div>

        <div className="progress-grid">
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
                    <div className="project-color" style={{ backgroundColor: project.color }} />
                    <div className="project-progress-info">
                      <div className="project-progress-name">{project.name}</div>
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

          <div className="dashboard-card">
            <div className="dashboard-card-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Plus size={18} strokeWidth={1.2} />
                빠른 태스크 추가
              </div>
              <button
                type="button"
                className="btn btn-primary btn-sm"
                disabled={!selectedProjectId || !taskTitle.trim()}
                onClick={handleSubmitTask}
              >
                <Plus size={14} strokeWidth={1.2} />
                추가
              </button>
            </div>
            <div className="dashboard-card-body">
              <form onSubmit={handleSubmitTask} className="quick-memo-form-vertical">
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
                    placeholder="태스크 제목"
                    value={taskTitle}
                    onChange={e => setTaskTitle(e.target.value)}
                    onKeyDown={handleKeyDown}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">항목 (선택)</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="항목 입력"
                    value={taskItem}
                    onChange={e => setTaskItem(e.target.value)}
                    onKeyDown={handleKeyDown}
                  />
                </div>
              </form>
            </div>
          </div>
        </div>

        {/* 프로젝트 칸반 보드 (메이슨리) */}
        {projects.length > 0 && (
          <div className="kanban-masonry">
            {projects.filter(p => p.tasks.length > 0).map(project => {
              const total = project.tasks.reduce((sum, t) => sum + (t.items?.length || 0), 0)
              const completed = project.tasks.reduce((sum, t) =>
                sum + (t.items?.filter(d => d.completed).length || 0), 0
              )
              const progress = total > 0 ? Math.round((completed / total) * 100) : 0

              return (
                <div
                  key={project.id}
                  className="kanban-card"
                  onClick={() => onSelectProject(project.id)}
                >
                  <div className="kanban-card-header">
                    <div className="kanban-card-title">
                      <div className="project-color" style={{ backgroundColor: project.color }} />
                      <span>{project.name}</span>
                    </div>
                    {total > 0 && (
                      <div className="kanban-card-progress">
                        <div className="kanban-progress-bar">
                          <div
                            className="kanban-progress-fill"
                            style={{ width: `${progress}%`, backgroundColor: project.color }}
                          />
                        </div>
                        <span className="kanban-progress-text">{progress}%</span>
                      </div>
                    )}
                  </div>
                  <div className="kanban-card-tasks">
                    {project.tasks.map(task => {
                      const taskTotal = task.items?.length || 0
                      const taskDone = task.items?.filter(d => d.completed).length || 0
                      const allDone = taskTotal > 0 && taskDone === taskTotal

                      return (
                        <div key={task.id} className={`kanban-task ${allDone ? 'done' : ''}`}>
                          <div className="kanban-task-header">
                            <span className="kanban-task-title">{task.title}</span>
                            {taskTotal > 0 && (
                              <span className="kanban-task-count">{taskDone}/{taskTotal}</span>
                            )}
                          </div>
                          {task.assignee && (
                            <div className="kanban-task-assignee">
                              <User size={11} strokeWidth={1.2} />
                              <span>{task.assignee}</span>
                            </div>
                          )}
                          {task.items && task.items.length > 0 && (
                            <ul className="kanban-task-items">
                              {task.items.map(item => (
                                <li key={item.id} className={item.completed ? 'done' : ''}>
                                  <div className={`kanban-check ${item.completed ? 'checked' : ''}`}>
                                    {item.completed && <Check size={8} strokeWidth={2} />}
                                  </div>
                                  <span>{item.content}</span>
                                </li>
                              ))}
                            </ul>
                          )}
                        </div>
                      )
                    })}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </>
  )
}

export default Dashboard
