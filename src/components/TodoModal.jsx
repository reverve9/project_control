import { useState, useEffect } from 'react'

function TodoModal({ todo, onSave, onClose }) {
  const [title, setTitle] = useState('')
  const [dueDate, setDueDate] = useState('')

  useEffect(() => {
    if (todo) {
      setTitle(todo.title)
      setDueDate(todo.dueDate || '')
    }
  }, [todo])

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!title.trim()) return
    
    onSave({
      title: title.trim(),
      dueDate: dueDate || null
    })
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2 className="modal-title">
            {todo ? '할 일 수정' : '새 할 일'}
          </h2>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            <div className="form-group">
              <label className="form-label">할 일</label>
              <input
                type="text"
                className="form-input"
                value={title}
                onChange={e => setTitle(e.target.value)}
                placeholder="할 일을 입력하세요"
                autoFocus
              />
            </div>

            <div className="form-group">
              <label className="form-label">마감일 (선택)</label>
              <input
                type="date"
                className="form-input"
                value={dueDate}
                onChange={e => setDueDate(e.target.value)}
              />
            </div>
          </div>

          <div className="modal-footer">
            <button type="button" className="btn btn-ghost" onClick={onClose}>
              취소
            </button>
            <button type="submit" className="btn btn-primary" disabled={!title.trim()}>
              {todo ? '수정' : '추가'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default TodoModal
