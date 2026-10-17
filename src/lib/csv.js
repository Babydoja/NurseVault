// Small CSV reader: handles quotes, commas and line breaks inside quotes, CRLF and a BOM.
export function parseCSV(t) {
  t = t.replace(/^\uFEFF/, '')
  const rows = []; let row = [], cell = '', q = false
  for (let i = 0; i < t.length; i++) {
    const c = t[i]
    if (q) { if (c === '"') { if (t[i + 1] === '"') { cell += '"'; i++ } else q = false } else cell += c }
    else if (c === '"') q = true
    else if (c === ',') { row.push(cell); cell = '' }
    else if (c === '\n' || c === '\r') { if (c === '\r' && t[i + 1] === '\n') i++; row.push(cell); cell = ''; rows.push(row); row = [] }
    else cell += c
  }
  if (cell !== '' || row.length) { row.push(cell); rows.push(row) }
  return rows.filter(r => r.some(x => x.trim()))
}
export const download = (name, text) => {
  const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([text], { type: 'text/csv' })); a.download = name; a.click()
}
