import { Archive, RotateCcw, Trash2, FolderOpen, FileText } from 'lucide-react'

function ArchiveView({ archivedProjects, archivedTasks, onRestoreProject, onDeleteProject, onRestoreTask, onDeleteTask }) {
  const handleDeleteProject = (project) => {
    if (window.confirm(`"${project.name}" 프로젝트를 완전히 삭제할까요?\n모든 태스크와 정보가 함께 삭제되며, 이 작업은 되돌릴 수 없습니다.`)) {
      onDeleteProject(project.id)
    }
  }

  const handleDeleteTask = (task) => {
    if (window.confirm(`"${task.title}" 태스크를 완전히 삭제할까요?\n이 작업은 되돌릴 수 없습니다.`)) {
      onDeleteTask(task.projectId, task.id)
    }
  }

  const isEmpty = archivedProjects.length === 0 && archivedTasks.length === 0

  return (
    <>
      <header className="content-header">
        <h1 className="content-title">보관함</h1>
        <p className="content-subtitle">보관된 프로젝트와 태스크를 관리하세요</p>
      </header>

      <div className="content-body">
        {isEmpty ? (
          <div className="empty-state" style={{ marginTop: '100px' }}>
            <Archive strokeWidth={1.2} />
            <div className="empty-state-title">보관된 항목이 없어요</div>
            <div className="empty-state-desc">프로젝트나 태스크를 보관하면 여기에 표시됩니다</div>
          </div>
        ) : (
          <>
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
                        <div className="project-color" style={{ backgroundColor: project.color }} />
                        <span>{project.name}</span>
                      </div>
                      {project.description && (
                        <div className="archive-card-desc">{project.description}</div>
                      )}
                      <div className="archive-card-actions">
                        <button className="btn btn-ghost btn-sm" onClick={() => onRestoreProject(project.id)}>
                          <RotateCcw size={14} />
                          복원
                        </button>
                        <button className="btn btn-ghost btn-sm delete" onClick={() => handleDeleteProject(project)}>
                          <Trash2 size={14} />
                          삭제
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {archivedTasks.length > 0 && (
              <div className="archive-section">
                <div className="archive-section-header">
                  <FileText size={18} strokeWidth={1.2} />
                  태스크
                </div>
                <div className="archive-grid">
                  {archivedTasks.map(task => (
                    <div key={task.id} className="archive-card">
                      <div className="archive-card-project">
                        <div className="project-color" style={{ backgroundColor: task.projectColor }} />
                        <span>{task.projectName}</span>
                      </div>
                      <div className="archive-card-title">{task.title}</div>
                      {task.items && task.items.length > 0 && (
                        <div className="archive-card-details">
                          {task.items.length}개 항목
                        </div>
                      )}
                      <div className="archive-card-actions">
                        <button className="btn btn-ghost btn-sm" onClick={() => onRestoreTask(task.id)}>
                          <RotateCcw size={14} />
                          복원
                        </button>
                        <button className="btn btn-ghost btn-sm delete" onClick={() => handleDeleteTask(task)}>
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
