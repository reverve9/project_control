import { useState, useEffect } from 'react'

function ProjectModal({ project, assignments, colors, onSave, onClose }) {
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [color, setColor] = useState(colors[0])
  const [assignmentId, setAssignmentId] = useState('')
  const [deliverable, setDeliverable] = useState('')
  const [assignee, setAssignee] = useState('')

  useEffect(() => {
    if (project) {
      setName(project.name)
      setDescription(project.description || '')
      setColor(project.color)
      setAssignmentId(project.assignment_id || '')
      setDeliverable(project.deliverable || '')
      setAssignee(project.assignee || '')
    } else {
      setName('')
      setDescription('')
      setColor(colors[0])
      setAssignmentId('')
      setDeliverable('')
      setAssignee('')
    }
  }, [project, colors])

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!name.trim()) return

    onSave({
      name: name.trim(),
      description: description.trim(),
      color,
      assignment_id: assignmentId || null,
      deliverable: deliverable.trim(),
      assignee: assignee.trim()
    })
  }

  const handleOverlayClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose()
    }
  }

  return (
    <div className="modal-overlay" onMouseDown={handleOverlayClick}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2 className="modal-title">
            {project ? '프로젝트 수정' : '새 프로젝트'}
          </h2>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            <div className="form-group">
              <label className="form-label">프로젝트 이름</label>
              <input
                type="text"
                className="form-input"
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="프로젝트 이름을 입력하세요"
                autoFocus
              />
            </div>

            <div className="form-group">
              <label className="form-label">과제</label>
              <select
                className="form-input"
                value={assignmentId}
                onChange={e => setAssignmentId(e.target.value)}
              >
                <option value="">미분류</option>
                {assignments.map(asn => (
                  <option key={asn.id} value={asn.id}>{asn.name}</option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">담당자</label>
              <input
                type="text"
                className="form-input"
                value={assignee}
                onChange={e => setAssignee(e.target.value)}
                placeholder="담당자를 입력하세요"
              />
            </div>

            <div className="form-group">
              <label className="form-label">최종산출물</label>
              <input
                type="text"
                className="form-input"
                value={deliverable}
                onChange={e => setDeliverable(e.target.value)}
                placeholder="최종산출물을 입력하세요"
              />
            </div>

            <div className="form-group">
              <label className="form-label">설명 (선택)</label>
              <textarea
                className="form-input form-textarea"
                value={description}
                onChange={e => setDescription(e.target.value)}
                placeholder="프로젝트에 대한 간단한 설명"
              />
            </div>

            <div className="form-group">
              <label className="form-label">색상</label>
              <div className="color-picker">
                {colors.map(c => (
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
            <button type="button" className="btn btn-ghost" onClick={onClose}>
              취소
            </button>
            <button type="submit" className="btn btn-primary" disabled={!name.trim()}>
              {project ? '수정' : '만들기'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default ProjectModal
