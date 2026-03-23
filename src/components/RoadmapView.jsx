import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import { Plus, Trash2, ChevronLeft, ChevronRight } from 'lucide-react'

const QUARTERS = [
  { label: 'Q1', months: [1, 2, 3] },
  { label: 'Q2', months: [4, 5, 6] },
  { label: 'Q3', months: [7, 8, 9] },
  { label: 'Q4', months: [10, 11, 12] }
]

const MONTH_NAMES = ['', '1월', '2월', '3월', '4월', '5월', '6월', '7월', '8월', '9월', '10월', '11월', '12월']

function RoadmapView({ user }) {
  const [year, setYear] = useState(new Date().getFullYear())
  const [quarterIndex, setQuarterIndex] = useState(Math.floor(new Date().getMonth() / 3))
  const [rows, setRows] = useState([])
  const [cells, setCells] = useState({})
  const [newRowLabel, setNewRowLabel] = useState('')
  const [editingCell, setEditingCell] = useState(null)
  const [editingCellValue, setEditingCellValue] = useState('')
  const [editingRowId, setEditingRowId] = useState(null)
  const [editingRowLabel, setEditingRowLabel] = useState('')

  const quarter = QUARTERS[quarterIndex]

  const fetchData = useCallback(async () => {
    const { data: rowsData } = await supabase
      .from('roadmap_rows')
      .select('*')
      .order('sort_order', { ascending: true })

    if (rowsData) setRows(rowsData)

    const { data: cellsData } = await supabase
      .from('roadmap_cells')
      .select('*')
      .eq('year', year)

    if (cellsData) {
      const cellMap = {}
      cellsData.forEach(c => {
        cellMap[`${c.row_id}-${c.month}`] = c
      })
      setCells(cellMap)
    }
  }, [year])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const handleAddRow = async () => {
    if (!newRowLabel.trim()) return
    const maxOrder = rows.reduce((max, r) => Math.max(max, r.sort_order || 0), 0)

    const { error } = await supabase
      .from('roadmap_rows')
      .insert({
        label: newRowLabel.trim(),
        user_id: user.id,
        sort_order: maxOrder + 1
      })

    if (!error) {
      setNewRowLabel('')
      await fetchData()
    }
  }

  const handleDeleteRow = async (rowId) => {
    if (!window.confirm('이 항목을 삭제할까요?')) return
    await supabase.from('roadmap_rows').delete().eq('id', rowId)
    await fetchData()
  }

  const handleUpdateRowLabel = async (rowId) => {
    if (!editingRowLabel.trim()) {
      setEditingRowId(null)
      return
    }
    await supabase
      .from('roadmap_rows')
      .update({ label: editingRowLabel.trim() })
      .eq('id', rowId)

    setEditingRowId(null)
    await fetchData()
  }

  const getCellKey = (rowId, month) => `${rowId}-${month}`

  const handleCellClick = (rowId, month) => {
    const key = getCellKey(rowId, month)
    const cell = cells[key]
    setEditingCell(key)
    setEditingCellValue(cell?.content || '')
  }

  const handleCellSave = async (rowId, month) => {
    const key = getCellKey(rowId, month)
    const existing = cells[key]

    if (editingCellValue.trim() === '' && existing) {
      await supabase.from('roadmap_cells').delete().eq('id', existing.id)
    } else if (editingCellValue.trim() !== '') {
      if (existing) {
        await supabase
          .from('roadmap_cells')
          .update({ content: editingCellValue.trim() })
          .eq('id', existing.id)
      } else {
        await supabase
          .from('roadmap_cells')
          .insert({
            row_id: rowId,
            year,
            month,
            content: editingCellValue.trim(),
            user_id: user.id
          })
      }
    }

    setEditingCell(null)
    await fetchData()
  }

  const handleCellKeyDown = (e, rowId, month) => {
    if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing) {
      e.preventDefault()
      handleCellSave(rowId, month)
    }
    if (e.key === 'Escape') {
      setEditingCell(null)
    }
  }

  const handlePrevQuarter = () => {
    if (quarterIndex === 0) {
      setYear(y => y - 1)
      setQuarterIndex(3)
    } else {
      setQuarterIndex(q => q - 1)
    }
  }

  const handleNextQuarter = () => {
    if (quarterIndex === 3) {
      setYear(y => y + 1)
      setQuarterIndex(0)
    } else {
      setQuarterIndex(q => q + 1)
    }
  }

  const handleAddRowKeyDown = (e) => {
    if (e.key === 'Enter' && !e.nativeEvent.isComposing) {
      e.preventDefault()
      handleAddRow()
    }
  }

  return (
    <>
      <header className="content-header">
        <h1 className="content-title">업무 일람</h1>
        <div className="roadmap-nav">
          <button className="btn btn-ghost btn-sm" onClick={handlePrevQuarter}>
            <ChevronLeft size={16} />
          </button>
          <span className="roadmap-nav-label">{year}년 {quarter.label}</span>
          <button className="btn btn-ghost btn-sm" onClick={handleNextQuarter}>
            <ChevronRight size={16} />
          </button>
        </div>
      </header>

      <div className="content-body">
        <div className="roadmap-table-wrapper">
          <table className="roadmap-table">
            <thead>
              <tr>
                <th className="roadmap-th-label">항목</th>
                {quarter.months.map(m => (
                  <th key={m} className="roadmap-th-month">{MONTH_NAMES[m]}</th>
                ))}
                <th className="roadmap-th-action"></th>
              </tr>
            </thead>
            <tbody>
              {rows.map(row => (
                <tr key={row.id}>
                  <td className="roadmap-td-label">
                    {editingRowId === row.id ? (
                      <input
                        className="roadmap-row-input"
                        value={editingRowLabel}
                        onChange={e => setEditingRowLabel(e.target.value)}
                        onBlur={() => handleUpdateRowLabel(row.id)}
                        onKeyDown={e => {
                          if (e.key === 'Enter' && !e.nativeEvent.isComposing) handleUpdateRowLabel(row.id)
                          if (e.key === 'Escape') setEditingRowId(null)
                        }}
                        autoFocus
                      />
                    ) : (
                      <span
                        className="roadmap-row-label"
                        onDoubleClick={() => {
                          setEditingRowId(row.id)
                          setEditingRowLabel(row.label)
                        }}
                      >
                        {row.label}
                      </span>
                    )}
                  </td>
                  {quarter.months.map(m => {
                    const key = getCellKey(row.id, m)
                    const cell = cells[key]
                    const isEditing = editingCell === key

                    return (
                      <td key={m} className="roadmap-td-cell" onClick={() => !isEditing && handleCellClick(row.id, m)}>
                        {isEditing ? (
                          <textarea
                            className="roadmap-cell-input"
                            value={editingCellValue}
                            onChange={e => setEditingCellValue(e.target.value)}
                            onBlur={() => handleCellSave(row.id, m)}
                            onKeyDown={e => handleCellKeyDown(e, row.id, m)}
                            autoFocus
                          />
                        ) : (
                          <div className="roadmap-cell-content">
                            {cell?.content || ''}
                          </div>
                        )}
                      </td>
                    )
                  })}
                  <td className="roadmap-td-action">
                    <button
                      className="roadmap-delete-btn"
                      onClick={() => handleDeleteRow(row.id)}
                    >
                      <Trash2 size={13} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="roadmap-add-row">
          <input
            className="form-input roadmap-add-input"
            placeholder="항목 추가"
            value={newRowLabel}
            onChange={e => setNewRowLabel(e.target.value)}
            onKeyDown={handleAddRowKeyDown}
          />
          <button
            className="btn btn-secondary btn-sm"
            onClick={handleAddRow}
            disabled={!newRowLabel.trim()}
          >
            <Plus size={14} />
            추가
          </button>
        </div>
      </div>
    </>
  )
}

export default RoadmapView
