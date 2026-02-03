import { FolderOpen, TrendingUp } from 'lucide-react'

function Dashboard({ projects, onSelectProject }) {
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
  
  // 전체 진행률
  const totalProgress = totalDetails > 0 ? Math.round((completedDetails / totalDetails) * 100) : 0

  // 프로젝트 진행률 (상세내용 기준)
  const projectProgress = projects.map(p => {
    const total = p.memos.reduce((sum, m) => sum + (m.details?.length || 0), 0)
    const completed = p.memos.reduce((sum, m) => 
      sum + (m.details?.filter(d => d.completed).length || 0), 0
    )
    const progress = total > 0 ? Math.round((completed / total) * 100) : 0
    return { ...p, progress, completed, total }
  }).sort((a, b) => b.progress - a.progress)

  // 서클 진행률 SVG 계산
  const circleRadius = 70
  const circleCircumference = 2 * Math.PI * circleRadius
  const circleOffset = circleCircumference - (totalProgress / 100) * circleCircumference

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
          {/* 좌측: 전체 진행률 (서클) */}
          <div className="dashboard-card">
            <div className="dashboard-card-header">
              <TrendingUp size={18} />
              전체 진행률
            </div>
            <div className="dashboard-card-body circle-progress-container">
              <div className="circle-progress">
                <svg width="180" height="180" viewBox="0 0 180 180">
                  <defs>
                    <linearGradient id="dashboardGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="var(--navy)" />
                      <stop offset="100%" stopColor="var(--blue)" />
                    </linearGradient>
                  </defs>
                  {/* 배경 원 */}
                  <circle
                    cx="90"
                    cy="90"
                    r={circleRadius}
                    fill="none"
                    stroke="var(--border)"
                    strokeWidth="6"
                  />
                  {/* 진행률 원 */}
                  <circle
                    cx="90"
                    cy="90"
                    r={circleRadius}
                    fill="none"
                    stroke="url(#dashboardGradient)"
                    strokeWidth="6"
                    strokeLinecap="round"
                    strokeDasharray={circleCircumference}
                    strokeDashoffset={circleOffset}
                    transform="rotate(-90 90 90)"
                    style={{ transition: 'stroke-dashoffset 0.5s ease' }}
                  />
                </svg>
                <div className="circle-progress-text">
                  <span className="circle-progress-value">{totalProgress}</span>
                  <span className="circle-progress-unit">%</span>
                </div>
              </div>
              <div className="circle-progress-stats">
                <div className="circle-stat">
                  <span className="circle-stat-value success">{completedDetails}</span>
                  <span className="circle-stat-label">완료</span>
                </div>
                <div className="circle-stat-divider" />
                <div className="circle-stat">
                  <span className="circle-stat-value warning">{pendingDetails}</span>
                  <span className="circle-stat-label">진행중</span>
                </div>
              </div>
            </div>
          </div>

          {/* 우측: 프로젝트별 진행률 */}
          <div className="dashboard-card">
            <div className="dashboard-card-header">
              <FolderOpen size={18} />
              프로젝트별 진행률
            </div>
            <div className="dashboard-card-body">
              {projectProgress.length === 0 ? (
                <div className="empty-state">
                  <FolderOpen />
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
