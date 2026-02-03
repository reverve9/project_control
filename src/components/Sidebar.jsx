import { LayoutDashboard, Plus } from 'lucide-react'

function Sidebar({ projects, activeView, activeProjectId, onSelectDashboard, onSelectProject, onAddProject }) {
  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <div className="sidebar-logo">
          <img src="./app-icon.png" alt="PC" className="sidebar-logo-icon" />
          <span className="sidebar-logo-text">Project Control</span>
        </div>
      </div>

      <nav className="sidebar-nav">
        <div 
          className={`nav-item ${activeView === 'dashboard' ? 'active' : ''}`}
          onClick={onSelectDashboard}
        >
          <LayoutDashboard />
          <span>대시보드</span>
        </div>
      </nav>

      <div className="sidebar-section-title">프로젝트</div>
      
      <div className="project-list">
        {projects.map(project => {
          // 상세내용 기준 카운트
          const totalCount = project.memos.reduce((sum, m) => sum + (m.details?.length || 0), 0)
          const completedCount = project.memos.reduce((sum, m) => 
            sum + (m.details?.filter(d => d.completed).length || 0), 0
          )
          
          return (
            <div
              key={project.id}
              className={`project-item ${activeProjectId === project.id ? 'active' : ''}`}
              onClick={() => onSelectProject(project.id)}
            >
              <div 
                className="project-color" 
                style={{ backgroundColor: project.color }}
              />
              <span className="project-name">{project.name}</span>
              {totalCount > 0 && (
                <span className="project-count">{completedCount}/{totalCount}</span>
              )}
            </div>
          )
        })}
      </div>

      <button className="add-project-btn" onClick={onAddProject}>
        <Plus size={16} />
        새 프로젝트
      </button>
    </aside>
  )
}

export default Sidebar
