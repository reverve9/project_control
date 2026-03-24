import { useState } from 'react'
import { Edit2, Check, User } from 'lucide-react'
import RoadmapView from './RoadmapView'

function AssignmentDetail({ assignment, projects, user, onEditAssignment, onSelectProject }) {
  const [activeTab, setActiveTab] = useState('dashboard')

  const assignmentProjects = projects.filter(p => p.assignment_id === assignment.id)
  const projectIds = assignmentProjects.map(p => p.id)

  const priorityLabel = { low: '낮음', medium: '보통', high: '높음' }

  // 통계
  const totalProjects = assignmentProjects.length
  const totalTasks = assignmentProjects.reduce((sum, p) => sum + p.tasks.length, 0)
  const completedTasks = assignmentProjects.reduce((sum, p) =>
    sum + p.tasks.filter(t => {
      const items = t.items || []
      return items.length > 0 && items.every(d => d.completed)
    }).length, 0
  )
  const pendingTasks = totalTasks - completedTasks

  return (
    <>
      <header className="content-header">
        <div className="project-header">
          <div className="project-title-section">
            {assignment.color && (
              <div
                className="project-color-large"
                style={{ backgroundColor: assignment.color }}
              />
            )}
            <h1 className="content-title">{assignment.name}</h1>
          </div>
          <div className="project-actions">
            {assignment.priority && (
              <span className="assignment-priority-badge">{priorityLabel[assignment.priority] || assignment.priority}</span>
            )}
            {assignment.start_date && assignment.end_date && (
              <span className="assignment-date-range">{assignment.start_date} ~ {assignment.end_date}</span>
            )}
            <button className="btn btn-ghost btn-sm" onClick={() => onEditAssignment(assignment)}>
              <Edit2 size={14} strokeWidth={1.2} />
              수정
            </button>
          </div>
        </div>
        <div className="project-tabs">
          <button
            className={`project-tab ${activeTab === 'dashboard' ? 'active' : ''}`}
            onClick={() => setActiveTab('dashboard')}
          >
            대시보드
          </button>
          <button
            className={`project-tab ${activeTab === 'roadmap' ? 'active' : ''}`}
            onClick={() => setActiveTab('roadmap')}
          >
            업무추진표
          </button>
        </div>
      </header>

      <div className="content-body">
        {activeTab === 'roadmap' ? (
          <RoadmapView
            projectIds={projectIds}
            user={user}
            assignmentName={assignment.name}
          />
        ) : (
          <>
            <div className="stats-grid">
              <div className="stat-card">
                <div className="stat-label">전체 Project</div>
                <div className="stat-value">{totalProjects}</div>
              </div>
              <div className="stat-card">
                <div className="stat-label">전체 Task</div>
                <div className="stat-value">{totalTasks}</div>
              </div>
              <div className="stat-card">
                <div className="stat-label">완료됨</div>
                <div className="stat-value success">{completedTasks}</div>
              </div>
              <div className="stat-card">
                <div className="stat-label">진행중</div>
                <div className="stat-value warning">{pendingTasks}</div>
              </div>
            </div>

            {assignmentProjects.length > 0 ? (
              <div className="kanban-grid">
                {assignmentProjects.filter(p => p.tasks.length > 0).map(project => {
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
                <div className="empty-state-title">프로젝트가 없어요</div>
                <div className="empty-state-desc">이 WORX에 Project를 추가해보세요</div>
              </div>
            )}
          </>
        )}
      </div>
    </>
  )
}

export default AssignmentDetail
