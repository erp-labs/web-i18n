/**
 * Flatten nested object to dot-key paths → string leaves.
 */
export function flattenKeys(obj, prefix = '') {
  /** @type {Record<string, string>} */
  const out = {}
  if (obj === null || obj === undefined) return out
  if (typeof obj === 'string') {
    if (prefix) out[prefix] = obj
    return out
  }
  if (typeof obj !== 'object' || Array.isArray(obj)) return out
  for (const [k, v] of Object.entries(obj)) {
    const path = prefix ? `${prefix}.${k}` : k
    if (typeof v === 'string') {
      out[path] = v
    } else if (v && typeof v === 'object' && !Array.isArray(v)) {
      Object.assign(out, flattenKeys(v, path))
    }
  }
  return out
}

/**
 * Rebuild nested object from dot-key paths.
 */
export function unflattenKeys(flat) {
  /** @type {Record<string, unknown>} */
  const root = {}
  for (const [path, value] of Object.entries(flat)) {
    const parts = path.split('.')
    let cur = root
    for (let i = 0; i < parts.length - 1; i++) {
      const p = parts[i]
      if (!(p in cur) || typeof cur[p] !== 'object' || cur[p] === null) {
        cur[p] = {}
      }
      cur = /** @type {Record<string, unknown>} */ (cur[p])
    }
    cur[parts[parts.length - 1]] = value
  }
  return root
}

export function deepClone(obj) {
  return JSON.parse(JSON.stringify(obj))
}
