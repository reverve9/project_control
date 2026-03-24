function Dashboard({ assignments, projects, onSelectAssignment }) {
  const totalWorx = assignments.length
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

  return (
    <>
      <header className="content-header">
        <h1 className="content-title">Dashboard</h1>
        <p className="content-subtitle">전체 현황을 한눈에 확인하세요</p>
      </header>

      <div className="content-body">
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-label">전체 WORX</div>
            <div className="stat-value">{totalWorx}</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">전체 Project</div>
            <div className="stat-value">{totalProjects}</div>
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

        {assignments.length > 0 ? (
          <div className="kanban-grid">
            {assignments.map(worx => {
              const worxProjects = projects.filter(p => p.assignment_id === worx.id)
              const totalTasks = worxProjects.reduce((sum, p) => sum + p.tasks.length, 0)
              const completedTasks = worxProjects.reduce((sum, p) =>
                sum + p.tasks.filter(t => {
                  const items = t.items || []
                  return items.length > 0 && items.every(d => d.completed)
                }).length, 0
              )
              const progress = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0

              return (
                <div
                  key={worx.id}
                  className="kanban-card"
                  onClick={() => onSelectAssignment(worx.id)}
                >
                  <div className="kanban-card-header">
                    <div className="kanban-card-title">
                      {worx.color && (
                        <div className="project-color" style={{ backgroundColor: worx.color }} />
                      )}
                      <span>{worx.name}</span>
                    </div>
                    {totalTasks > 0 && (
                      <span className="kanban-card-stats">{completedTasks}/{totalTasks} {progress}%</span>
                    )}
                  </div>
                  <div className="kanban-card-tasks">
                    {worxProjects.map(project => {
                      const pTasks = project.tasks.length
                      const pDone = project.tasks.filter(t => {
                        const items = t.items || []
                        return items.length > 0 && items.every(d => d.completed)
                      }).length
                      const allDone = pTasks > 0 && pDone === pTasks

                      return (
                        <div key={project.id} className={`kanban-task ${allDone ? 'done' : ''}`}>
                          <div className="kanban-task-header">
                            <div className="kanban-card-title">
                              <div className="project-color" style={{ backgroundColor: project.color }} />
                              <span className="kanban-task-title">{project.name}</span>
                            </div>
                            {pTasks > 0 && (
                              <span className="kanban-task-count">{pDone}/{pTasks}</span>
                            )}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )
            })}
          </div>
        ) : (
          <div className="empty-state" style={{ marginTop: '60px' }}>
            <div className="empty-state-title">WORX가 없어요</div>
            <div className="empty-state-desc">새 WORX를 만들어보세요</div>
          </div>
        )}
      </div>
    </>
  )
}

export default Dashboard
