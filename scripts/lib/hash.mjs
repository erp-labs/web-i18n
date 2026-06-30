import { createHash } from 'node:crypto'

export function hashJson(value) {
  const json = JSON.stringify(value)
  return `sha256:${createHash('sha256').update(json, 'utf8').digest('hex')}`
}
