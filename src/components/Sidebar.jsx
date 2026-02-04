import { useState } from 'react'
import { LayoutDashboard, Plus, Settings, Archive, ChevronDown, ChevronRight, FolderPlus, Edit2 } from 'lucide-react'

function Sidebar({ 
  projects, 
  categories,
  activeView, 
  activeProjectId, 
  onSelectDashboard, 
  onSelectProject, 
  onAddProject, 
  onSelectArchive, 
  onAddCategory,
  onEditCategory,
  onReorderProject,
  user, 
  userProfile, 
  onOpenSettings 
}) {
  const [expandedCategories, setExpandedCategories] = useState({})
  const [draggedProject, setDraggedProject] = useState(null)
  const [dragOverCategory, setDragOverCategory] = useState(null)
  const [dragOverDropzone, setDragOverDropzone] = useState(null)

  const toggleCategory = (categoryId) => {
    setExpandedCategories(prev => ({
      ...prev,
      [categoryId]: !prev[categoryId]
    }))
  }

  // 카테고리별 프로젝트 그룹화
  const sortedCategories = [...categories].sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0))
  
  const categorizedProjects = sortedCategories.map(cat => ({
    ...cat,
    projects: projects
      .filter(p => p.category_id === cat.id)
      .sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0))
  }))

  // 카테고리 없는 프로젝트
  const uncategorizedProjects = projects
    .filter(p => !p.category_id)
    .sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0))

  const getProjectCounts = (project) => {
    const totalCount = project.memos.reduce((sum, m) => sum + (m.details?.length || 0), 0)
    const completedCount = project.memos.reduce((sum, m) => 
      sum + (m.details?.filter(d => d.completed).length || 0), 0
    )
    return { totalCount, completedCount }
  }

  // 프로젝트 드래그
  const handleProjectDragStart = (e, project) => {
    setDraggedProject(project)
    e.dataTransfer.effectAllowed = 'move'
  }

  const handleProjectDragOver = (e, targetProject, categoryId) => {
    e.preventDefault()
    if (!draggedProject || draggedProject.id === targetProject.id) return
  }

  const handleProjectDrop = (e, targetProject, categoryId) => {
    e.preventDefault()
    if (!draggedProject || draggedProject.id === targetProject.id) return
    
    onReorderProject(draggedProject.id, targetProject.id, categoryId)
    setDraggedProject(null)
  }

  const handleCategoryDrop = (e, categoryId) => {
    e.preventDefault()
    if (!draggedProject) return
    
    // 카테고리로 직접 드롭 (카테고리 변경)
    if (draggedProject.category_id !== categoryId) {
      onReorderProject(draggedProject.id, null, categoryId)
    }
    setDraggedProject(null)
    setDragOverCategory(null)
  }

  const handleCategoryDragOver = (e, categoryId) => {
    e.preventDefault()
    setDragOverCategory(categoryId)
  }

  const handleCategoryDragLeave = () => {
    setDragOverCategory(null)
  }

  const handleDragEnd = () => {
    setDraggedProject(null)
    setDragOverCategory(null)
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

  const handleDropzoneDrop = (e, position, categoryId, categoryProjects) => {
    e.preventDefault()
    e.stopPropagation()
    if (!draggedProject) return

    // position: 'top', 'bottom', 또는 프로젝트 인덱스
    let targetProjectId = null
    
    if (position === 'top' && categoryProjects.length > 0) {
      targetProjectId = categoryProjects[0].id
    } else if (position === 'bottom') {
      targetProjectId = null // 맨 뒤로
    } else if (typeof position === 'number' && categoryProjects[position]) {
      targetProjectId = categoryProjects[position].id
    }

    onReorderProject(draggedProject.id, targetProjectId, categoryId)
    setDraggedProject(null)
    setDragOverDropzone(null)
  }

  const renderProject = (project, categoryId) => {
    const { totalCount, completedCount } = getProjectCounts(project)
    
    return (
      <div
        key={project.id}
        className={`project-item ${activeProjectId === project.id ? 'active' : ''}`}
        onClick={() => onSelectProject(project.id)}
        draggable
        onDragStart={(e) => handleProjectDragStart(e, project)}
        onDragOver={(e) => handleProjectDragOver(e, project, categoryId)}
        onDrop={(e) => handleProjectDrop(e, project, categoryId)}
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

      <nav className="sidebar-nav">
        <div 
          className={`nav-item ${activeView === 'dashboard' ? 'active' : ''}`}
          onClick={onSelectDashboard}
        >
          <LayoutDashboard />
          <span>대시보드</span>
        </div>
      </nav>

      <div className="sidebar-projects">
        <div className="sidebar-section-header">
          <span className="sidebar-section-title">프로젝트</span>
          <button className="sidebar-add-category-btn" onClick={onAddCategory} title="카테고리 추가">
            <FolderPlus size={14} />
          </button>
        </div>
        
        <div className="project-list">
          {/* 카테고리별 프로젝트 */}
          {categorizedProjects.map(category => (
            <div key={category.id} className="category-group">
              <div 
                className={`category-header ${dragOverCategory === category.id ? 'drag-over' : ''}`}
                onDragOver={(e) => handleCategoryDragOver(e, category.id)}
                onDragLeave={handleCategoryDragLeave}
                onDrop={(e) => handleCategoryDrop(e, category.id)}
              >
                <div 
                  className="category-toggle"
                  onClick={() => toggleCategory(category.id)}
                >
                  {expandedCategories[category.id] ? 
                    <ChevronDown size={14} /> : 
                    <ChevronRight size={14} />
                  }
                </div>
                <span 
                  className="category-name"
                  onClick={() => toggleCategory(category.id)}
                >
                  {category.name}
                </span>
                <span className="category-count">{category.projects.length}</span>
                <button 
                  className="category-edit-btn"
                  onClick={(e) => {
                    e.stopPropagation()
                    onEditCategory(category)
                  }}
                >
                  <Edit2 size={12} />
                </button>
              </div>
              
              {expandedCategories[category.id] && (
                <div className="category-projects">
                  {/* 상단 드롭존 */}
                  <div 
                    className={`dropzone dropzone-top ${dragOverDropzone === `${category.id}-top` ? 'active' : ''}`}
                    onDragOver={(e) => handleDropzoneDragOver(e, `${category.id}-top`)}
                    onDragLeave={handleDropzoneDragLeave}
                    onDrop={(e) => handleDropzoneDrop(e, 'top', category.id, category.projects)}
                  />
                  {category.projects.map((project, index) => (
                    <div key={project.id}>
                      {renderProject(project, category.id)}
                      {/* 프로젝트 사이 드롭존 */}
                      <div 
                        className={`dropzone ${dragOverDropzone === `${category.id}-${index}` ? 'active' : ''}`}
                        onDragOver={(e) => handleDropzoneDragOver(e, `${category.id}-${index}`)}
                        onDragLeave={handleDropzoneDragLeave}
                        onDrop={(e) => handleDropzoneDrop(e, index + 1, category.id, category.projects)}
                      />
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}

          {/* 미분류 프로젝트 */}
          {uncategorizedProjects.length > 0 && (
            <div className="category-group">
              <div 
                className={`category-header uncategorized ${dragOverCategory === 'uncategorized' ? 'drag-over' : ''}`}
                onDragOver={(e) => handleCategoryDragOver(e, 'uncategorized')}
                onDragLeave={handleCategoryDragLeave}
                onDrop={(e) => handleCategoryDrop(e, null)}
              >
                <div 
                  className="category-toggle"
                  onClick={() => toggleCategory('uncategorized')}
                >
                  {expandedCategories['uncategorized'] ? 
                    <ChevronDown size={14} /> : 
                    <ChevronRight size={14} />
                  }
                </div>
                <span 
                  className="category-name"
                  onClick={() => toggleCategory('uncategorized')}
                >
                  미분류
                </span>
                <span className="category-count">{uncategorizedProjects.length}</span>
              </div>
              
              {expandedCategories['uncategorized'] && (
                <div className="category-projects">
                  {/* 상단 드롭존 */}
                  <div 
                    className={`dropzone dropzone-top ${dragOverDropzone === 'uncategorized-top' ? 'active' : ''}`}
                    onDragOver={(e) => handleDropzoneDragOver(e, 'uncategorized-top')}
                    onDragLeave={handleDropzoneDragLeave}
                    onDrop={(e) => handleDropzoneDrop(e, 'top', null, uncategorizedProjects)}
                  />
                  {uncategorizedProjects.map((project, index) => (
                    <div key={project.id}>
                      {renderProject(project, null)}
                      {/* 프로젝트 사이 드롭존 */}
                      <div 
                        className={`dropzone ${dragOverDropzone === `uncategorized-${index}` ? 'active' : ''}`}
                        onDragOver={(e) => handleDropzoneDragOver(e, `uncategorized-${index}`)}
                        onDragLeave={handleDropzoneDragLeave}
                        onDrop={(e) => handleDropzoneDrop(e, index + 1, null, uncategorizedProjects)}
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
