// Accepts messy spreadsheet values and returns what the database expects (or null).
export const normCode = c => (c || '').trim().toUpperCase().replace(/^([A-Z]{3,4})\s*(\d{3})$/, '$1 $2')
export const normLevel = v => { const m = String(v || '').match(/\d{3}/); return m && ['100', '200', '300', '400', '500'].includes(m[0]) ? m[0] : null }
export const normSemester = v => {
  const s = String(v || '').trim().toLowerCase()
  if (/^(1|first|alpha)/.test(s)) return 'First'
  if (/^(2|second|omega)/.test(s)) return 'Second'
  return null
}
