import { Check, Edit2, Trash2, Archive, X } from 'lucide-react'

function MemoViewModal({ memo, onClose, onEdit, onDelete, onArchive, onToggleDetail }) {
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
    if (window.confirm(`"${memo.title}" 메모를 삭제할까요?`)) {
      onDelete(memo.id)
      onClose()
    }
  }

  const handleArchive = () => {
    if (window.confirm(`"${memo.title}" 메모를 보관할까요?`)) {
      onArchive(memo.id)
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
            <span className="memo-view-date">{formatDate(memo.created_at)}</span>
            <h2 className="modal-title">{memo.title}</h2>
          </div>
          <button className="modal-close-btn" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        <div className="modal-body">
          <div className="memo-view-priority">
            <span className="memo-view-label">중요도</span>
            {renderPriority(memo.priority)}
          </div>

          {memo.details && memo.details.length > 0 && (
            <div className="memo-view-details">
              <span className="memo-view-label">상세내용</span>
              <ul className="memo-view-detail-list">
                {memo.details.map((detail) => (
                  <li 
                    key={detail.id} 
                    className={`memo-view-detail-item ${detail.completed ? 'completed' : ''}`}
                  >
                    <div 
                      className={`detail-checkbox ${detail.completed ? 'checked' : ''}`}
                      onClick={() => onToggleDetail(detail.id, detail.completed)}
                    >
                      {detail.completed && <Check size={10} strokeWidth={1.2} />}
                    </div>
                    <span className="detail-content">{detail.content}</span>
                    <span className="detail-time-ago">
                      {formatTimeAgo(detail.created_at)}
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
          <button className="btn btn-primary" onClick={() => { onEdit(memo); onClose(); }}>
            <Edit2 size={16} />
            수정
          </button>
        </div>
      </div>
    </div>
  )
}

export default MemoViewModal
