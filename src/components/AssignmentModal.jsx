import { useState, useEffect } from 'react'
import { Trash2 } from 'lucide-react'

const PRIORITY_OPTIONS = [
  { value: 'low', label: '낮음' },
  { value: 'medium', label: '보통' },
  { value: 'high', label: '높음' }
]

const ASSIGNMENT_COLORS = ['#2c3e50', '#3498db', '#27ae60', '#e67e22', '#9b59b6', '#e74c3c', '#1abc9c', '#f39c12']

function AssignmentModal({ assignment, onSave, onDelete, onClose }) {
  const [name, setName] = useState('')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [color, setColor] = useState('')
  const [priority, setPriority] = useState('medium')

  useEffect(() => {
    if (assignment) {
      setName(assignment.name)
      setStartDate(assignment.start_date || '')
      setEndDate(assignment.end_date || '')
      setColor(assignment.color || '')
      setPriority(assignment.priority || 'medium')
    } else {
      setName('')
      setStartDate('')
      setEndDate('')
      setColor('')
      setPriority('medium')
    }
  }, [assignment])

  const handleOverlayClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose()
    }
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!name.trim()) return

    onSave({
      name: name.trim(),
      start_date: startDate || null,
      end_date: endDate || null,
      color: color || null,
      priority
    })
  }

  const handleDelete = () => {
    if (assignment && window.confirm(`"${assignment.name}" WORX를 삭제할까요?\nProject는 미분류로 이동됩니다.`)) {
      onDelete(assignment.id)
      onClose()
    }
  }

  return (
    <div className="modal-overlay" onMouseDown={handleOverlayClick}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2 className="modal-title">
            {assignment ? 'WORX 수정' : '새 WORX'}
          </h2>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            <div className="form-group">
              <label className="form-label">WORX 이름</label>
              <input
                type="text"
                className="form-input"
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="WORX 이름을 입력하세요"
                autoFocus
              />
            </div>

            <div className="form-group">
              <label className="form-label">중요도</label>
              <select
                className="form-input"
                value={priority}
                onChange={e => setPriority(e.target.value)}
              >
                {PRIORITY_OPTIONS.map(opt => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>

            <div className="form-row">
              <div className="form-group" style={{ flex: 1 }}>
                <label className="form-label">시작일</label>
                <input
                  type="date"
                  className="form-input"
                  value={startDate}
                  onChange={e => setStartDate(e.target.value)}
                />
              </div>
              <div className="form-group" style={{ flex: 1 }}>
                <label className="form-label">종료일</label>
                <input
                  type="date"
                  className="form-input"
                  value={endDate}
                  onChange={e => setEndDate(e.target.value)}
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">색상</label>
              <div className="color-picker">
                {ASSIGNMENT_COLORS.map(c => (
                  <div
                    key={c}
                    className={`color-option ${color === c ? 'selected' : ''}`}
                    style={{ backgroundColor: c }}
                    onClick={() => setColor(c)}
                  />
                ))}
              </div>
            </div>
          </div>

          <div className="modal-footer">
            {assignment && (
              <button type="button" className="btn btn-ghost delete" onClick={handleDelete}>
                <Trash2 size={16} />
                삭제
              </button>
            )}
            <div style={{ flex: 1 }} />
            <button type="button" className="btn btn-ghost" onClick={onClose}>
              취소
            </button>
            <button type="submit" className="btn btn-primary" disabled={!name.trim()}>
              {assignment ? '수정' : '만들기'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default AssignmentModal
