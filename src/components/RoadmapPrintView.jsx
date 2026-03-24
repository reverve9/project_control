import { useEffect } from 'react'
import { X, Printer } from 'lucide-react'

const MONTH_NAMES = ['', '1월', '2월', '3월', '4월', '5월', '6월', '7월', '8월', '9월', '10월', '11월', '12월']

function RoadmapPrintView({ projectName, year, rows, cells, groupedRows, parseCellItems, onClose }) {

  useEffect(() => {
    const handleKeyDown = (e) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [onClose])

  const handlePrint = () => window.print()

  const months = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]

  const getCellItems = (rowId, month) => {
    const key = `${rowId}-${month}`
    const cell = cells[key]
    if (!cell) return null
    const items = parseCellItems(cell.content)
    return items.length > 0 ? items : null
  }

  const hasMinorAny = rows.some(r => r.minor)

  return (
    <div className="print-overlay">
      <div className="print-toolbar no-print">
        <div className="print-toolbar-title">업무추진 흐름도 미리보기</div>
        <div className="print-toolbar-actions">
          <button className="btn btn-primary btn-sm" onClick={handlePrint}>
            <Printer size={14} /> PDF 출력
          </button>
          <button className="btn btn-ghost btn-sm" onClick={onClose}>
            <X size={14} /> 닫기
          </button>
        </div>
      </div>

      <div className="print-content">
        <div className="print-page">
          <h2 className="print-title">{projectName} — 업무추진 흐름도({year}년도)</h2>

          <table className="print-table">
            <thead>
              <tr>
                <th className="print-th-label" rowSpan={hasMinorAny ? 2 : 1}>구분</th>
                {groupedRows.map((group, gi) => (
                  <th key={gi} className="print-th-major"
                    colSpan={group.rows.length}
                    rowSpan={!hasMinorAny ? 1 : group.rows.length === 1 && !group.rows[0].minor ? 2 : 1}>
                    {group.major}
                  </th>
                ))}
              </tr>
              {hasMinorAny && (
                <tr>
                  {groupedRows.map(group =>
                    group.rows.map(row => {
                      if (group.rows.length === 1 && !row.minor) return null
                      return (
                        <th key={row.id} className="print-th-minor">
                          {row.minor || ''}
                        </th>
                      )
                    })
                  )}
                </tr>
              )}
            </thead>

            <tbody>
              <tr className="print-row-meta">
                <td className="print-td-label">담당</td>
                {rows.map(row => (
                  <td key={row.id} className="print-td-meta">{row.assignee || ''}</td>
                ))}
              </tr>
              <tr className="print-row-meta">
                <td className="print-td-label">산출물</td>
                {rows.map(row => (
                  <td key={row.id} className="print-td-meta">{row.output || ''}</td>
                ))}
              </tr>

              {months.map(m => (
                <tr key={m} className="print-row-month">
                  <td className="print-td-label">{MONTH_NAMES[m]}</td>
                  {rows.map(row => {
                    const items = getCellItems(row.id, m)
                    return (
                      <td key={row.id} className="print-td-cell">
                        {items && (
                          <ul className="print-cell-list">
                            {items.map((item, idx) => (
                              <li key={idx} className={item.done ? 'done' : ''}>
                                {item.text}
                              </li>
                            ))}
                          </ul>
                        )}
                      </td>
                    )
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

export default RoadmapPrintView
