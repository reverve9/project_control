import { Archive, RotateCcw, Trash2, FolderOpen, FileText } from 'lucide-react'

function ArchiveView({ archivedProjects, archivedMemos, onRestoreProject, onDeleteProject, onRestoreMemo, onDeleteMemo }) {
  const handleDeleteProject = (project) => {
    if (window.confirm(`"${project.name}" 프로젝트를 완전히 삭제할까요?\n모든 메모와 정보가 함께 삭제되며, 이 작업은 되돌릴 수 없습니다.`)) {
      onDeleteProject(project.id)
    }
  }

  const handleDeleteMemo = (memo) => {
    if (window.confirm(`"${memo.title}" 메모를 완전히 삭제할까요?\n이 작업은 되돌릴 수 없습니다.`)) {
      onDeleteMemo(memo.projectId, memo.id)
    }
  }

  const isEmpty = archivedProjects.length === 0 && archivedMemos.length === 0

  return (
    <>
      <header className="content-header">
        <h1 className="content-title">보관함</h1>
        <p className="content-subtitle">보관된 프로젝트와 메모를 관리하세요</p>
      </header>

      <div className="content-body">
        {isEmpty ? (
          <div className="empty-state" style={{ marginTop: '100px' }}>
            <Archive strokeWidth={1.2} />
            <div className="empty-state-title">보관된 항목이 없어요</div>
            <div className="empty-state-desc">프로젝트나 메모를 보관하면 여기에 표시됩니다</div>
          </div>
        ) : (
          <>
            {/* 프로젝트 섹션 */}
            {archivedProjects.length > 0 && (
              <div className="archive-section">
                <div className="archive-section-header">
                  <FolderOpen size={18} strokeWidth={1.2} />
                  프로젝트
                </div>
                <div className="archive-grid">
                  {archivedProjects.map(project => (
                    <div key={project.id} className="archive-card">
                      <div className="archive-card-project">
                        <div 
                          className="project-color" 
                          style={{ backgroundColor: project.color }}
                        />
                        <span>{project.name}</span>
                      </div>
                      {project.description && (
                        <div className="archive-card-desc">{project.description}</div>
                      )}
                      <div className="archive-card-actions">
                        <button 
                          className="btn btn-ghost btn-sm"
                          onClick={() => onRestoreProject(project.id)}
                        >
                          <RotateCcw size={14} />
                          복원
                        </button>
                        <button 
                          className="btn btn-ghost btn-sm delete"
                          onClick={() => handleDeleteProject(project)}
                        >
                          <Trash2 size={14} />
                          삭제
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 메모 섹션 */}
            {archivedMemos.length > 0 && (
              <div className="archive-section">
                <div className="archive-section-header">
                  <FileText size={18} strokeWidth={1.2} />
                  메모
                </div>
                <div className="archive-grid">
                  {archivedMemos.map(memo => (
                    <div key={memo.id} className="archive-card">
                      <div className="archive-card-project">
                        <div 
                          className="project-color" 
                          style={{ backgroundColor: memo.projectColor }}
                        />
                        <span>{memo.projectName}</span>
                      </div>
                      <div className="archive-card-title">{memo.title}</div>
                      {memo.details && memo.details.length > 0 && (
                        <div className="archive-card-details">
                          {memo.details.length}개 항목
                        </div>
                      )}
                      <div className="archive-card-actions">
                        <button 
                          className="btn btn-ghost btn-sm"
                          onClick={() => onRestoreMemo(memo.id)}
                        >
                          <RotateCcw size={14} />
                          복원
                        </button>
                        <button 
                          className="btn btn-ghost btn-sm delete"
                          onClick={() => handleDeleteMemo(memo)}
                        >
                          <Trash2 size={14} />
                          삭제
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </>
  )
}

export default ArchiveView
