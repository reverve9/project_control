import { useState, useEffect } from 'react'

function InfoModal({ info, onSave, onClose }) {
  const [type, setType] = useState('command')
  const [label, setLabel] = useState('')
  const [value, setValue] = useState('')

  useEffect(() => {
    if (info) {
      setType(info.type)
      setLabel(info.label)
      setValue(info.value)
    } else {
      setType('command')
      setLabel('')
      setValue('')
    }
  }, [info])

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!label.trim() || !value.trim()) return
    
    onSave({
      type,
      label: label.trim(),
      value: value.trim()
    })
  }

  const getPlaceholder = () => {
    switch (type) {
      case 'command': return 'npm run dev'
      case 'url': return 'https://github.com/...'
      case 'note': return '메모 내용'
      default: return ''
    }
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2 className="modal-title">
            {info ? '인포 수정' : '인포 추가'}
          </h2>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            <div className="form-group">
              <label className="form-label">타입</label>
              <div className="type-selector">
                <button
                  type="button"
                  className={`type-btn ${type === 'command' ? 'active' : ''}`}
                  onClick={() => setType('command')}
                >
                  명령어
                </button>
                <button
                  type="button"
                  className={`type-btn ${type === 'url' ? 'active' : ''}`}
                  onClick={() => setType('url')}
                >
                  URL
                </button>
                <button
                  type="button"
                  className={`type-btn ${type === 'note' ? 'active' : ''}`}
                  onClick={() => setType('note')}
                >
                  메모
                </button>
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">라벨</label>
              <input
                type="text"
                className="form-input"
                value={label}
                onChange={e => setLabel(e.target.value)}
                placeholder="표시될 이름"
              />
            </div>

            <div className="form-group">
              <label className="form-label">값</label>
              {type === 'note' ? (
                <textarea
                  className="form-input form-textarea"
                  value={value}
                  onChange={e => setValue(e.target.value)}
                  placeholder={getPlaceholder()}
                  rows={3}
                />
              ) : (
                <input
                  type="text"
                  className="form-input"
                  value={value}
                  onChange={e => setValue(e.target.value)}
                  placeholder={getPlaceholder()}
                />
              )}
            </div>
          </div>

          <div className="modal-footer">
            <button type="button" className="btn btn-ghost" onClick={onClose}>
              취소
            </button>
            <button 
              type="submit" 
              className="btn btn-primary" 
              disabled={!label.trim() || !value.trim()}
            >
              {info ? '수정' : '추가'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default InfoModal
