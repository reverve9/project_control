import { Check, Edit2, Trash2, Archive, X, User } from 'lucide-react'

function TaskViewModal({ task, onClose, onEdit, onDelete, onArchive, onToggleItem }) {
  const formatDate = (dateStr) => {
    if (!dateStr) return ''
    const date = new Date(dateStr)
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    return `${month}/${day}`
  }

  const formatTimeAgo = (dateStr) => {
    if (!dateStr) return ''
    const now = new Date()
    const date = new Date(dateStr)
    const diffMs = now - date
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

    if (diffHours < 1) return '방금'
    if (diffHours < 24) return `${diffHours}시간 전`
    return `${diffDays}일 전`
  }

  const handleDelete = () => {
    if (window.confirm(`"${task.title}" 태스크를 삭제할까요?`)) {
      onDelete(task.id)
      onClose()
    }
  }

  const handleArchive = () => {
    if (window.confirm(`"${task.title}" 태스크를 보관할까요?`)) {
      onArchive(task.id)
      onClose()
    }
  }

  const renderPriority = (priority) => {
    const filled = priority || 0
    return (
      <div className="priority-display">
        {[1, 2, 3, 4, 5].map(i => (
          <span
            key={i}
            className="priority-star"
          >
            {i <= filled ? '★' : '☆'}
          </span>
        ))}
      </div>
    )
  }

  const handleOverlayClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose()
    }
  }

  return (
    <div className="modal-overlay" onMouseDown={handleOverlayClick}>
      <div className="modal modal-lg" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <div className="memo-view-header-content">
            <span className="memo-view-date">{formatDate(task.created_at)}</span>
            <h2 className="modal-title">{task.title}</h2>
          </div>
          <button className="modal-close-btn" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        <div className="modal-body">
          {task.assignee && (
            <div className="memo-view-priority">
              <span className="memo-view-label">담당자</span>
              <span className="task-assignee-value">
                <User size={14} strokeWidth={1.2} />
                {task.assignee}
              </span>
            </div>
          )}

          <div className="memo-view-priority">
            <span className="memo-view-label">중요도</span>
            {renderPriority(task.priority)}
          </div>

          {task.items && task.items.length > 0 && (
            <div className="memo-view-details">
              <span className="memo-view-label">항목</span>
              <ul className="memo-view-detail-list">
                {task.items.map((item) => (
                  <li
                    key={item.id}
                    className={`memo-view-detail-item ${item.completed ? 'completed' : ''}`}
                  >
                    <div
                      className={`detail-checkbox ${item.completed ? 'checked' : ''}`}
                      onClick={() => onToggleItem(item.id, item.completed)}
                    >
                      {item.completed && <Check size={10} strokeWidth={1.2} />}
                    </div>
                    <span className="detail-content">{item.content}</span>
                    <span className="detail-time-ago">
                      {formatTimeAgo(item.created_at)}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        <div className="modal-footer">
          <button className="btn btn-ghost" onClick={handleArchive}>
            <Archive size={16} />
            보관
          </button>
          <button className="btn btn-ghost delete" onClick={handleDelete}>
            <Trash2 size={16} />
            삭제
          </button>
          <div style={{ flex: 1 }} />
          <button className="btn btn-primary" onClick={() => { onEdit(task); onClose(); }}>
            <Edit2 size={16} />
            수정
          </button>
        </div>
      </div>
    </div>
  )
}

export default TaskViewModal
