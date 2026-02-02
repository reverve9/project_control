import { Clock, FolderOpen, Calendar, TrendingUp } from 'lucide-react'

function Dashboard({ projects, onSelectProject }) {
  // 통계 계산
  const totalProjects = projects.length
  const totalTodos = projects.reduce((sum, p) => sum + p.todos.length, 0)
  const completedTodos = projects.reduce((sum, p) => sum + p.todos.filter(t => t.completed).length, 0)
  
  // 지연된 할일 (마감일 지난 미완료 할일)
  const today = new Date().toISOString().split('T')[0]
  const overdueTodos = projects.reduce((sum, p) => 
    sum + p.todos.filter(t => !t.completed && t.due_date && t.due_date < today).length, 0
  )

  // 다가오는 마감 (7일 이내)
  const sevenDaysLater = new Date()
  sevenDaysLater.setDate(sevenDaysLater.getDate() + 7)
  const upcomingDeadlines = []
  
  projects.forEach(project => {
    project.todos.forEach(todo => {
      if (!todo.completed && todo.due_date) {
        const dueDate = new Date(todo.due_date)
        if (dueDate <= sevenDaysLater) {
          upcomingDeadlines.push({
            ...todo,
            projectName: project.name,
            projectColor: project.color,
            projectId: project.id
          })
        }
      }
    })
  })
  
  upcomingDeadlines.sort((a, b) => new Date(a.due_date) - new Date(b.due_date))

  // 프로젝트 진행률
  const projectProgress = projects.map(p => {
    const total = p.todos.length
    const completed = p.todos.filter(t => t.completed).length
    const progress = total > 0 ? Math.round((completed / total) * 100) : 0
    return { ...p, progress, completed, total }
  }).sort((a, b) => b.progress - a.progress)

  const formatDate = (dateStr) => {
    const date = new Date(dateStr)
    const diff = Math.ceil((date - new Date()) / (1000 * 60 * 60 * 24))
    
    if (diff < 0) return { text: `${Math.abs(diff)}일 지남`, className: 'overdue' }
    if (diff === 0) return { text: '오늘', className: 'soon' }
    if (diff === 1) return { text: '내일', className: 'soon' }
    if (diff <= 3) return { text: `${diff}일 남음`, className: 'soon' }
    return { text: `${diff}일 남음`, className: '' }
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
            <div className="stat-label">전체 할 일</div>
            <div className="stat-value">{totalTodos}</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">완료됨</div>
            <div className="stat-value success">{completedTodos}</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">지연됨</div>
            <div className="stat-value danger">{overdueTodos}</div>
          </div>
        </div>

        <div className="dashboard-grid">
          <div className="dashboard-card">
            <div className="dashboard-card-header">
              <Clock size={18} />
              다가오는 마감
            </div>
            <div className="dashboard-card-body">
              {upcomingDeadlines.length === 0 ? (
                <div className="empty-state">
                  <Calendar />
                  <div className="empty-state-title">예정된 할 일이 없어요</div>
                  <div className="empty-state-desc">마감일이 있는 할 일을 추가해보세요</div>
                </div>
              ) : (
                upcomingDeadlines.slice(0, 5).map(todo => {
                  const dateInfo = formatDate(todo.due_date)
                  return (
                    <div 
                      key={todo.id} 
                      className="deadline-item"
                      onClick={() => onSelectProject(todo.projectId)}
                      style={{ cursor: 'pointer' }}
                    >
                      <div 
                        className="deadline-color" 
                        style={{ backgroundColor: todo.projectColor }}
                      />
                      <div className="deadline-info">
                        <div className="deadline-title">{todo.title}</div>
                        <div className="deadline-project">{todo.projectName}</div>
                      </div>
                      <div className={`deadline-date ${dateInfo.className}`}>
                        {dateInfo.text}
                      </div>
                    </div>
                  )
                })
              )}
            </div>
          </div>

          <div className="dashboard-card">
            <div className="dashboard-card-header">
              <TrendingUp size={18} />
              프로젝트 진행률
            </div>
            <div className="dashboard-card-body">
              {projectProgress.length === 0 ? (
                <div className="empty-state">
                  <FolderOpen />
                  <div className="empty-state-title">프로젝트가 없어요</div>
                  <div className="empty-state-desc">새 프로젝트를 만들어보세요</div>
                </div>
              ) : (
                projectProgress.slice(0, 5).map(project => (
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
                    <div className="project-progress-value">{project.progress}%</div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  )
}

export default Dashboard
