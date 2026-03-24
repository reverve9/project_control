import { Check, User } from 'lucide-react'

function Dashboard({ assignments, projects, onSelectProject }) {
  const totalWorx = assignments.length
  const totalProjects = projects.length

  const completedItems = projects.reduce((sum, p) =>
    sum + p.tasks.reduce((tSum, t) =>
      tSum + (t.items?.filter(d => d.completed).length || 0), 0
    ), 0
  )

  const totalItems = projects.reduce((sum, p) =>
    sum + p.tasks.reduce((tSum, t) => tSum + (t.items?.length || 0), 0), 0
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

        {projects.length > 0 ? (
          <div className="kanban-grid">
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
                      <span className="kanban-card-stats">{completed}/{total} {progress}%</span>
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
        ) : (
          <div className="empty-state" style={{ marginTop: '60px' }}>
            <div className="empty-state-title">Project가 없어요</div>
            <div className="empty-state-desc">새 Project를 만들어보세요</div>
          </div>
        )}
      </div>
    </>
  )
}

export default Dashboard
