import { Plus, Edit2, Trash2, Check, Calendar } from 'lucide-react'

function ProjectDetail({ 
  project, 
  onToggleTodo, 
  onDeleteTodo, 
  onEditTodo, 
  onAddTodo, 
  onEditProject, 
  onDeleteProject 
}) {
  const completedCount = project.todos.filter(t => t.completed).length
  const totalCount = project.todos.length
  const progress = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0

  const today = new Date().toISOString().split('T')[0]

  const formatDueDate = (dateStr) => {
    if (!dateStr) return null
    
    const date = new Date(dateStr)
    const diff = Math.ceil((date - new Date()) / (1000 * 60 * 60 * 24))
    
    const formatted = date.toLocaleDateString('ko-KR', { 
      month: 'short', 
      day: 'numeric' 
    })

    if (diff < 0) return { text: `${formatted} (${Math.abs(diff)}일 지남)`, className: 'overdue' }
    if (diff === 0) return { text: `${formatted} (오늘)`, className: 'soon' }
    if (diff === 1) return { text: `${formatted} (내일)`, className: 'soon' }
    if (diff <= 3) return { text: `${formatted} (${diff}일 남음)`, className: 'soon' }
    return { text: formatted, className: '' }
  }

  // 정렬: 미완료 먼저, 그 다음 마감일 순
  const sortedTodos = [...project.todos].sort((a, b) => {
    if (a.completed !== b.completed) return a.completed ? 1 : -1
    if (a.due_date && b.due_date) return new Date(a.due_date) - new Date(b.due_date)
    if (a.due_date) return -1
    if (b.due_date) return 1
    return 0
  })

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
              <Edit2 size={14} />
              수정
            </button>
            <button className="btn btn-ghost btn-sm" onClick={onDeleteProject}>
              <Trash2 size={14} />
              삭제
            </button>
          </div>
        </div>
        {project.description && (
          <p className="content-subtitle">{project.description}</p>
        )}
      </header>

      <div className="content-body">
        <div className="progress-section">
          <div className="progress-header">
            <span className="progress-label">진행률</span>
            <span className="progress-value">{completedCount} / {totalCount} 완료 ({progress}%)</span>
          </div>
          <div className="progress-bar">
            <div 
              className="progress-fill" 
              style={{ width: `${progress}%`, backgroundColor: project.color }}
            />
          </div>
        </div>

        <div className="todo-section">
          <div className="todo-header">
            <h2 className="todo-title">할 일 목록</h2>
            <button className="btn btn-primary btn-sm" onClick={onAddTodo}>
              <Plus size={14} />
              추가
            </button>
          </div>

          <div className="todo-list">
            {sortedTodos.length === 0 ? (
              <div className="empty-state">
                <Calendar />
                <div className="empty-state-title">할 일이 없어요</div>
                <div className="empty-state-desc">새로운 할 일을 추가해보세요</div>
              </div>
            ) : (
              sortedTodos.map(todo => {
                const dueInfo = formatDueDate(todo.due_date)
                
                return (
                  <div key={todo.id} className="todo-item">
                    <div 
                      className={`todo-checkbox ${todo.completed ? 'checked' : ''}`}
                      onClick={() => onToggleTodo(todo.id)}
                    >
                      {todo.completed && <Check size={12} />}
                    </div>
                    <div className="todo-content">
                      <div className={`todo-text ${todo.completed ? 'completed' : ''}`}>
                        {todo.title}
                      </div>
                      {dueInfo && !todo.completed && (
                        <div className={`todo-due ${dueInfo.className}`}>
                          {dueInfo.text}
                        </div>
                      )}
                    </div>
                    <div className="todo-actions">
                      <button 
                        className="todo-action-btn"
                        onClick={() => onEditTodo(todo)}
                      >
                        <Edit2 size={14} />
                      </button>
                      <button 
                        className="todo-action-btn delete"
                        onClick={() => onDeleteTodo(todo.id)}
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                )
              })
            )}
          </div>
        </div>
      </div>
    </>
  )
}

export default ProjectDetail
