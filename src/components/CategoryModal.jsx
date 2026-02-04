import { useState, useEffect } from 'react'
import { Trash2 } from 'lucide-react'

function CategoryModal({ category, onSave, onDelete, onClose }) {
  const [name, setName] = useState('')

  useEffect(() => {
    if (category) {
      setName(category.name)
    } else {
      setName('')
    }
  }, [category])

  const handleOverlayClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose()
    }
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!name.trim()) return
    
    onSave({
      name: name.trim()
    })
  }

  const handleDelete = () => {
    if (category && window.confirm(`"${category.name}" 카테고리를 삭제할까요?\n프로젝트는 미분류로 이동됩니다.`)) {
      onDelete(category.id)
      onClose()
    }
  }

  return (
    <div className="modal-overlay" onMouseDown={handleOverlayClick}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2 className="modal-title">
            {category ? '카테고리 수정' : '새 카테고리'}
          </h2>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            <div className="form-group">
              <label className="form-label">카테고리 이름</label>
              <input
                type="text"
                className="form-input"
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="카테고리 이름을 입력하세요"
                autoFocus
              />
            </div>
          </div>

          <div className="modal-footer">
            {category && (
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
              {category ? '수정' : '만들기'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default CategoryModal
