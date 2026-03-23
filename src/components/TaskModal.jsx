import { useState, useEffect } from 'react'
import { Plus, X, Check, Archive } from 'lucide-react'

function TaskModal({ task, onSave, onClose, onArchive }) {
  const [title, setTitle] = useState('')
  const [assignee, setAssignee] = useState('')
  const [priority, setPriority] = useState(0)
  const [items, setItems] = useState([])
  const [newItem, setNewItem] = useState('')

  useEffect(() => {
    if (task) {
      setTitle(task.title)
      setAssignee(task.assignee || '')
      setPriority(task.priority || 0)
      setItems(task.items?.map(d => ({
        content: d.content,
        completed: d.completed || false,
        completed_at: d.completed_at
      })) || [])
    } else {
      setTitle('')
      setAssignee('')
      setPriority(0)
      setItems([])
    }
  }, [task])

  const handleAddItem = () => {
    if (!newItem.trim()) return
    setItems(prev => [...prev, {
      content: newItem.trim(),
      completed: false,
      completed_at: null
    }])
    setNewItem('')
  }

  const handleRemoveItem = (index) => {
    setItems(prev => prev.filter((_, i) => i !== index))
  }

  const handleToggleItem = (index) => {
    setItems(prev => prev.map((d, i) => {
      if (i !== index) return d
      const newCompleted = !d.completed
      return {
        ...d,
        completed: newCompleted,
        completed_at: newCompleted ? new Date().toISOString() : null
      }
    }))
  }

  const handleUpdateItem = (index, newContent) => {
    setItems(prev => prev.map((d, i) =>
      i === index ? { ...d, content: newContent } : d
    ))
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing) {
      e.preventDefault()
      handleAddItem()
    }
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!title.trim()) return

    const filteredItems = items.filter(d => d.content.trim())

    onSave({
      title: title.trim(),
      assignee: assignee.trim() || null,
      priority,
      items: filteredItems
    })
  }

  const handleArchive = () => {
    if (onArchive && task) {
      if (window.confirm(`"${task.title}" 태스크를 보관할까요?`)) {
        onArchive(task.id)
        onClose()
      }
    }
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
          <h2 className="modal-title">
            {task ? '태스크 수정' : '새 태스크'}
          </h2>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            <div className="form-group">
              <label className="form-label">타이틀</label>
              <input
                type="text"
                className="form-input"
                value={title}
                onChange={e => setTitle(e.target.value)}
                placeholder="태스크 제목을 입력하세요"
                autoFocus
              />
            </div>

            <div className="form-group">
              <label className="form-label">담당자</label>
              <input
                type="text"
                className="form-input"
                value={assignee}
                onChange={e => setAssignee(e.target.value)}
                placeholder="담당자 이름"
              />
            </div>

            <div className="form-group">
              <label className="form-label">중요도</label>
              <div className="priority-selector">
                {[1, 2, 3, 4, 5].map(i => (
                  <span
                    key={i}
                    className="priority-star clickable"
                    onClick={() => setPriority(i === priority ? 0 : i)}
                  >
                    {i <= priority ? '★' : '☆'}
                  </span>
                ))}
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">항목 추가</label>
              <div className="detail-input-row">
                <textarea
                  className="form-input form-textarea-sm"
                  value={newItem}
                  onChange={e => setNewItem(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="내용 입력 (Shift+Enter: 줄바꿈, Enter: 추가)"
                  rows={2}
                />
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={handleAddItem}
                >
                  <Plus size={16} />
                </button>
              </div>

              {items.length > 0 && (
                <ul className="detail-list">
                  {items.map((item, index) => (
                    <li key={index} className={`detail-item ${item.completed ? 'completed' : ''}`}>
                      <div
                        className={`detail-checkbox ${item.completed ? 'checked' : ''}`}
                        onClick={() => handleToggleItem(index)}
                      >
                        {item.completed && <Check size={10} />}
                      </div>
                      <textarea
                        className={`detail-edit-input ${item.completed ? 'line-through' : ''}`}
                        value={item.content}
                        onChange={e => handleUpdateItem(index, e.target.value)}
                        rows={Math.max(1, item.content.split('\n').length)}
                      />
                      <button
                        type="button"
                        className="detail-remove-btn"
                        onClick={() => handleRemoveItem(index)}
                      >
                        <X size={14} />
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>

          <div className="modal-footer">
            {task && (
              <button
                type="button"
                className="btn btn-ghost"
                onClick={handleArchive}
                title="보관"
              >
                <Archive size={16} />
                보관
              </button>
            )}
            <div style={{ flex: 1 }} />
            <button type="button" className="btn btn-ghost" onClick={onClose}>
              취소
            </button>
            <button type="submit" className="btn btn-primary" disabled={!title.trim()}>
              {task ? '수정' : '추가'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default TaskModal
