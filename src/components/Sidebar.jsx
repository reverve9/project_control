import { useState } from 'react'
import { Plus, Settings, Archive, ChevronDown, ChevronRight, FolderPlus, Edit2, ArrowUp, ArrowDown } from 'lucide-react'

function Sidebar({
  projects,
  assignments,
  activeView,
  activeProjectId,
  activeAssignmentId,
  onSelectDashboard,
  onSelectProject,
  onSelectAssignment,
  onAddProject,
  onSelectArchive,
  onAddAssignment,
  onEditAssignment,
  onReorderProject,
  user,
  userProfile,
  onOpenSettings
}) {
  const [expandedAssignments, setExpandedAssignments] = useState({})
  const [draggedProject, setDraggedProject] = useState(null)
  const [dragOverAssignment, setDragOverAssignment] = useState(null)
  const [dragOverDropzone, setDragOverDropzone] = useState(null)

  const toggleAssignment = (assignmentId) => {
    setExpandedAssignments(prev => ({
      ...prev,
      [assignmentId]: !prev[assignmentId]
    }))
  }

  // 과제별 프로젝트 그룹화
  const sortedAssignments = [...assignments].sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0))

  const groupedProjects = sortedAssignments.map(asn => ({
    ...asn,
    projects: projects
      .filter(p => p.assignment_id === asn.id)
      .sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0))
  }))

  // 과제 미지정 프로젝트
  const unassignedProjects = projects
    .filter(p => !p.assignment_id)
    .sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0))

  const getProjectCounts = (project) => {
    const totalCount = project.tasks.reduce((sum, m) => sum + (m.details?.length || 0), 0)
    const completedCount = project.tasks.reduce((sum, m) =>
      sum + (m.details?.filter(d => d.completed).length || 0), 0
    )
    return { totalCount, completedCount }
  }

  // 프로젝트 드래그
  const handleProjectDragStart = (e, project) => {
    setDraggedProject(project)
    e.dataTransfer.effectAllowed = 'move'
  }

  const handleProjectDragOver = (e, targetProject, assignmentId) => {
    e.preventDefault()
    if (!draggedProject || draggedProject.id === targetProject.id) return
  }

  const handleProjectDrop = (e, targetProject, assignmentId) => {
    e.preventDefault()
    if (!draggedProject || draggedProject.id === targetProject.id) return

    onReorderProject(draggedProject.id, targetProject.id, assignmentId)
    setDraggedProject(null)
  }

  const handleAssignmentDrop = (e, assignmentId) => {
    e.preventDefault()
    if (!draggedProject) return

    if (draggedProject.assignment_id !== assignmentId) {
      onReorderProject(draggedProject.id, null, assignmentId)
    }
    setDraggedProject(null)
    setDragOverAssignment(null)
  }

  const handleAssignmentDragOver = (e, assignmentId) => {
    e.preventDefault()
    setDragOverAssignment(assignmentId)
  }

  const handleAssignmentDragLeave = () => {
    setDragOverAssignment(null)
  }

  const handleDragEnd = () => {
    setDraggedProject(null)
    setDragOverAssignment(null)
    setDragOverDropzone(null)
  }

  // 드롭존 핸들러
  const handleDropzoneDragOver = (e, dropzoneId) => {
    e.preventDefault()
    e.stopPropagation()
    if (!draggedProject) return
    setDragOverDropzone(dropzoneId)
  }

  const handleDropzoneDragLeave = (e) => {
    e.stopPropagation()
    setDragOverDropzone(null)
  }

  const handleDropzoneDrop = (e, position, assignmentId, assignmentProjects) => {
    e.preventDefault()
    e.stopPropagation()
    if (!draggedProject) return

    let targetProjectId = null

    if (position === 'top' && assignmentProjects.length > 0) {
      targetProjectId = assignmentProjects[0].id
    } else if (position === 'bottom') {
      targetProjectId = null
    } else if (typeof position === 'number' && assignmentProjects[position]) {
      targetProjectId = assignmentProjects[position].id
    }

    onReorderProject(draggedProject.id, targetProjectId, assignmentId)
    setDraggedProject(null)
    setDragOverDropzone(null)
  }

  const handleMoveProject = (e, project, assignmentId, direction) => {
    e.stopPropagation()
    const list = assignmentId
      ? projects.filter(p => p.assignment_id === assignmentId).sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0))
      : unassignedProjects
    const idx = list.findIndex(p => p.id === project.id)
    const targetIdx = direction === 'up' ? idx - 1 : idx + 1
    if (targetIdx < 0 || targetIdx >= list.length) return
    onReorderProject(project.id, list[targetIdx].id, assignmentId)
  }

  const renderProject = (project, assignmentId, listLength, listIndex) => {
    const { totalCount, completedCount } = getProjectCounts(project)

    return (
      <div
        key={project.id}
        className={`project-item ${activeProjectId === project.id ? 'active' : ''}`}
        onClick={() => onSelectProject(project.id)}
        draggable
        onDragStart={(e) => handleProjectDragStart(e, project)}
        onDragOver={(e) => handleProjectDragOver(e, project, assignmentId)}
        onDrop={(e) => handleProjectDrop(e, project, assignmentId)}
        onDragEnd={handleDragEnd}
      >
        <div
          className="project-color"
          style={{ backgroundColor: project.color }}
        />
        <span className="project-name">{project.name}</span>
        {totalCount > 0 && (
          <span className="project-count">{completedCount}/{totalCount}</span>
        )}
        {listLength > 1 && (
          <div className="project-reorder-btns">
            <button className="project-reorder-btn" onClick={(e) => handleMoveProject(e, project, assignmentId, 'up')} disabled={listIndex === 0}>
              <ArrowUp size={10} />
            </button>
            <button className="project-reorder-btn" onClick={(e) => handleMoveProject(e, project, assignmentId, 'down')} disabled={listIndex === listLength - 1}>
              <ArrowDown size={10} />
            </button>
          </div>
        )}
      </div>
    )
  }

  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <div className="sidebar-logo">
          <img src="./app-icon.png" alt="PC" className="sidebar-logo-icon" />
          <span className="sidebar-logo-text">Project Control</span>
        </div>
      </div>

      <div className="sidebar-sections">
        <div className="sidebar-section-header">
          <span
            className={`sidebar-section-title clickable ${activeView === 'dashboard' ? 'active' : ''}`}
            onClick={onSelectDashboard}
          >
            WORX
          </span>
          <button className="sidebar-add-category-btn" onClick={onAddAssignment} title="WORX 추가">
            <FolderPlus size={14} />
          </button>
        </div>

        <div className="project-list">
          {/* 과제별 프로젝트 */}
          {groupedProjects.map(assignment => (
            <div key={assignment.id} className="category-group">
              <div
                className={`category-header ${activeAssignmentId === assignment.id ? 'active' : ''} ${dragOverAssignment === assignment.id ? 'drag-over' : ''}`}
                onDragOver={(e) => handleAssignmentDragOver(e, assignment.id)}
                onDragLeave={handleAssignmentDragLeave}
                onDrop={(e) => handleAssignmentDrop(e, assignment.id)}
              >
                <div
                  className="category-toggle"
                  onClick={() => toggleAssignment(assignment.id)}
                >
                  {expandedAssignments[assignment.id] ?
                    <ChevronDown size={14} /> :
                    <ChevronRight size={14} />
                  }
                </div>
                <span
                  className="category-name"
                  onClick={() => onSelectAssignment(assignment.id)}
                >
                  {assignment.name}
                </span>
                <span className="category-count">{assignment.projects.length}</span>
                <button
                  className="category-edit-btn"
                  onClick={(e) => {
                    e.stopPropagation()
                    onEditAssignment(assignment)
                  }}
                >
                  <Edit2 size={12} />
                </button>
              </div>

              {expandedAssignments[assignment.id] && (
                <div className="category-projects">
                  {/* 상단 드롭존 */}
                  <div
                    className={`dropzone dropzone-top ${dragOverDropzone === `${assignment.id}-top` ? 'active' : ''}`}
                    onDragOver={(e) => handleDropzoneDragOver(e, `${assignment.id}-top`)}
                    onDragLeave={handleDropzoneDragLeave}
                    onDrop={(e) => handleDropzoneDrop(e, 'top', assignment.id, assignment.projects)}
                  />
                  {assignment.projects.map((project, index) => (
                    <div key={project.id}>
                      {renderProject(project, assignment.id, assignment.projects.length, index)}
                      {/* 프로젝트 사이 드롭존 */}
                      <div
                        className={`dropzone ${dragOverDropzone === `${assignment.id}-${index}` ? 'active' : ''}`}
                        onDragOver={(e) => handleDropzoneDragOver(e, `${assignment.id}-${index}`)}
                        onDragLeave={handleDropzoneDragLeave}
                        onDrop={(e) => handleDropzoneDrop(e, index + 1, assignment.id, assignment.projects)}
                      />
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}

          {/* 미분류 프로젝트 */}
          {unassignedProjects.length > 0 && (
            <div className="category-group">
              <div
                className={`category-header uncategorized ${dragOverAssignment === 'uncategorized' ? 'drag-over' : ''}`}
                onDragOver={(e) => handleAssignmentDragOver(e, 'uncategorized')}
                onDragLeave={handleAssignmentDragLeave}
                onDrop={(e) => handleAssignmentDrop(e, null)}
              >
                <div
                  className="category-toggle"
                  onClick={() => toggleAssignment('uncategorized')}
                >
                  {expandedAssignments['uncategorized'] ?
                    <ChevronDown size={14} /> :
                    <ChevronRight size={14} />
                  }
                </div>
                <span
                  className="category-name"
                  onClick={() => toggleAssignment('uncategorized')}
                >
                  미분류
                </span>
                <span className="category-count">{unassignedProjects.length}</span>
              </div>

              {expandedAssignments['uncategorized'] && (
                <div className="category-projects">
                  {/* 상단 드롭존 */}
                  <div
                    className={`dropzone dropzone-top ${dragOverDropzone === 'uncategorized-top' ? 'active' : ''}`}
                    onDragOver={(e) => handleDropzoneDragOver(e, 'uncategorized-top')}
                    onDragLeave={handleDropzoneDragLeave}
                    onDrop={(e) => handleDropzoneDrop(e, 'top', null, unassignedProjects)}
                  />
                  {unassignedProjects.map((project, index) => (
                    <div key={project.id}>
                      {renderProject(project, null, unassignedProjects.length, index)}
                      {/* 프로젝트 사이 드롭존 */}
                      <div
                        className={`dropzone ${dragOverDropzone === `uncategorized-${index}` ? 'active' : ''}`}
                        onDragOver={(e) => handleDropzoneDragOver(e, `uncategorized-${index}`)}
                        onDragLeave={handleDropzoneDragLeave}
                        onDrop={(e) => handleDropzoneDrop(e, index + 1, null, unassignedProjects)}
                      />
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      <div
        className={`nav-item archive-nav ${activeView === 'archive' ? 'active' : ''}`}
        onClick={onSelectArchive}
      >
        <Archive size={18} />
        <span>보관함</span>
      </div>

      <button className="add-project-btn" onClick={onAddProject}>
        <Plus size={16} />
        새 프로젝트
      </button>

      <div className="sidebar-footer">
        <div className="sidebar-user">
          <span className="sidebar-user-email">{user?.email}</span>
        </div>
        <button className="sidebar-settings-btn" onClick={onOpenSettings}>
          <Settings size={16} />
          설정
        </button>
      </div>
    </aside>
  )
}

export default Sidebar
