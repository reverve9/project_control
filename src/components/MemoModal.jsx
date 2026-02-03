import { useState, useEffect } from 'react'
import { Plus, X, Check } from 'lucide-react'

function MemoModal({ memo, onSave, onClose }) {
  const [title, setTitle] = useState('')
  const [details, setDetails] = useState([])
  const [newDetail, setNewDetail] = useState('')

  useEffect(() => {
    if (memo) {
      setTitle(memo.title)
      setDetails(memo.details?.map(d => ({
        content: d.content,
        completed: d.completed || false,
        completed_at: d.completed_at
      })) || [])
    } else {
      setTitle('')
      setDetails([])
    }
  }, [memo])

  const handleAddDetail = () => {
    if (!newDetail.trim()) return
    setDetails(prev => [...prev, { 
      content: newDetail.trim(), 
      completed: false,
      completed_at: null
    }])
    setNewDetail('')
  }

  const handleRemoveDetail = (index) => {
    setDetails(prev => prev.filter((_, i) => i !== index))
  }

  const handleToggleDetail = (index) => {
    setDetails(prev => prev.map((d, i) => {
      if (i !== index) return d
      const newCompleted = !d.completed
      return {
        ...d,
        completed: newCompleted,
        completed_at: newCompleted ? new Date().toISOString() : null
      }
    }))
  }

  const handleUpdateDetail = (index, newContent) => {
    setDetails(prev => prev.map((d, i) => 
      i === index ? { ...d, content: newContent } : d
    ))
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleAddDetail()
    }
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!title.trim()) return
    
    // 빈 내용 필터링
    const filteredDetails = details.filter(d => d.content.trim())
    
    onSave({
      title: title.trim(),
      details: filteredDetails
    })
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal modal-lg" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2 className="modal-title">
            {memo ? '메모 수정' : '새 메모'}
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
                placeholder="메모 제목을 입력하세요"
                autoFocus
              />
            </div>

            <div className="form-group">
              <label className="form-label">상세내용 추가</label>
              <div className="detail-input-row">
                <textarea
                  className="form-input form-textarea-sm"
                  value={newDetail}
                  onChange={e => setNewDetail(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="내용 입력 (Shift+Enter: 줄바꿈, Enter: 추가)"
                  rows={2}
                />
                <button 
                  type="button" 
                  className="btn btn-secondary"
                  onClick={handleAddDetail}
                >
                  <Plus size={16} />
                </button>
              </div>
              
              {details.length > 0 && (
                <ul className="detail-list">
                  {details.map((detail, index) => (
                    <li key={index} className={`detail-item ${detail.completed ? 'completed' : ''}`}>
                      <div 
                        className={`detail-checkbox ${detail.completed ? 'checked' : ''}`}
                        onClick={() => handleToggleDetail(index)}
                      >
                        {detail.completed && <Check size={10} />}
                      </div>
                      <textarea
                        className={`detail-edit-input ${detail.completed ? 'line-through' : ''}`}
                        value={detail.content}
                        onChange={e => handleUpdateDetail(index, e.target.value)}
                        rows={Math.max(1, detail.content.split('\n').length)}
                      />
                      <button
                        type="button"
                        className="detail-remove-btn"
                        onClick={() => handleRemoveDetail(index)}
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
            <button type="button" className="btn btn-ghost" onClick={onClose}>
              취소
            </button>
            <button type="submit" className="btn btn-primary" disabled={!title.trim()}>
              {memo ? '수정' : '추가'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default MemoModal
