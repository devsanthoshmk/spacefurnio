/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * Deep recursive AST comparator for Draft vs Published state in Spacefurnio CMS Admin.
 * Handles primitives, objects, arrays (by ID or index), and multiline text diffs.
 */

export type DiffType = 'added' | 'removed' | 'modified' | 'unchanged'

export interface DiffNode {
  path: string
  label: string
  type: DiffType
  oldValue?: any
  newValue?: any
  children?: DiffNode[]
}

export interface DiffSummary {
  totalChanges: number
  addedCount: number
  removedCount: number
  modifiedCount: number
  nodes: DiffNode[]
}

function isPlainObject(val: any): boolean {
  return (
    val !== null &&
    typeof val === 'object' &&
    !Array.isArray(val) &&
    !(val instanceof Date) &&
    !(val instanceof RegExp)
  )
}

function formatPrimitivePreview(val: any): string {
  if (val === null) return 'null'
  if (val === undefined) return 'undefined'
  if (typeof val === 'string') {
    return val.length > 24 ? `"${val.slice(0, 21)}..."` : `"${val}"`
  }
  if (typeof val === 'number' || typeof val === 'boolean') {
    return String(val)
  }
  if (Array.isArray(val)) {
    return `[${val.length} items]`
  }
  if (typeof val === 'object') {
    return '{...}'
  }
  return String(val)
}

/**
 * Returns a human-readable string representation of any value without [object Object] or Array[3] bugs.
 */
export function formatDiffValue(val: any): string {
  if (val === null) return 'null'
  if (val === undefined) return '—'
  if (typeof val === 'string') return `"${val}"`
  if (typeof val === 'number' || typeof val === 'boolean') return String(val)

  if (Array.isArray(val)) {
    if (val.length === 0) return '[]'
    if (val.every((x) => typeof x !== 'object' || x === null)) {
      return `[${val.map((x) => (x === null ? 'null' : typeof x === 'string' ? `"${x}"` : String(x))).join(', ')}]`
    }
    const previews = val.slice(0, 3).map((item) => {
      if (!item || typeof item !== 'object') return String(item)
      return item.title || item.name || item.key || item.id || 'item'
    })
    return `[${val.length} item${val.length === 1 ? '' : 's'}: ${previews.join(', ')}${val.length > 3 ? ', ...' : ''}]`
  }

  if (typeof val === 'object') {
    const keys = Object.keys(val)
    if (keys.length === 0) return '{}'
    if (val.title || val.name) {
      return `"${val.title || val.name}"`
    }
    const entries = keys.slice(0, 3).map((k) => `${k}: ${formatPrimitivePreview(val[k])}`)
    return `{ ${entries.join(', ')}${keys.length > 3 ? ', ...' : ''} }`
  }

  return String(val)
}

function findArrayIdentifierKey(arrA: any[], arrB: any[]): string | null {
  const candidates = ['id', 'key', 'slug', 'name', 'title']
  for (const candidate of candidates) {
    const hasInA = arrA.some(
      (item) => item && typeof item === 'object' && candidate in item && item[candidate] != null
    )
    const hasInB = arrB.some(
      (item) => item && typeof item === 'object' && candidate in item && item[candidate] != null
    )
    if (hasInA || hasInB) {
      return candidate
    }
  }
  return null
}

function getItemLabel(item: any, idKey?: string | null, index?: number): string {
  if (item === null || item === undefined) {
    return index !== undefined ? `Item #${index + 1}` : 'Item'
  }
  if (typeof item !== 'object') {
    return index !== undefined ? `Item #${index + 1} (${formatPrimitivePreview(item)})` : String(item)
  }
  if (item.title) return String(item.title)
  if (item.name) return String(item.name)
  if (item.key) return String(item.key)
  if (item.slug) return String(item.slug)
  if (idKey && item[idKey] != null) return `${idKey}: ${item[idKey]}`
  if (item.id != null) return `ID: ${item.id}`
  if (index !== undefined) return `Item #${index + 1}`
  return 'Item'
}

function countChanges(node: DiffNode): { added: number; removed: number; modified: number } {
  if (node.type === 'added') {
    return { added: 1, removed: 0, modified: 0 }
  }
  if (node.type === 'removed') {
    return { added: 0, removed: 1, modified: 0 }
  }
  if (node.type === 'unchanged') {
    return { added: 0, removed: 0, modified: 0 }
  }

  // node.type === 'modified'
  if (!node.children || node.children.length === 0) {
    return { added: 0, removed: 0, modified: 1 }
  }

  let added = 0
  let removed = 0
  let modified = 0
  for (const child of node.children) {
    const counts = countChanges(child)
    added += counts.added
    removed += counts.removed
    modified += counts.modified
  }

  if (added === 0 && removed === 0 && modified === 0) {
    modified = 1
  }

  return { added, removed, modified }
}

function compareValues(oldVal: any, newVal: any, path: string, label: string): DiffNode {
  // Identical primitives
  if (Object.is(oldVal, newVal)) {
    return {
      path,
      label,
      type: 'unchanged',
      oldValue: oldVal,
      newValue: newVal,
    }
  }

  // Value added
  if (oldVal === undefined) {
    if (isPlainObject(newVal)) {
      const children = Object.keys(newVal).map((k) =>
        compareValues(undefined, newVal[k], path ? `${path}.${k}` : k, k)
      )
      return {
        path,
        label,
        type: 'added',
        newValue: newVal,
        children,
      }
    }
    if (Array.isArray(newVal)) {
      const children = diffArrays([], newVal, path)
      return {
        path,
        label,
        type: 'added',
        newValue: newVal,
        children,
      }
    }
    return {
      path,
      label,
      type: 'added',
      newValue: newVal,
    }
  }

  // Value removed
  if (newVal === undefined) {
    if (isPlainObject(oldVal)) {
      const children = Object.keys(oldVal).map((k) =>
        compareValues(oldVal[k], undefined, path ? `${path}.${k}` : k, k)
      )
      return {
        path,
        label,
        type: 'removed',
        oldValue: oldVal,
        children,
      }
    }
    if (Array.isArray(oldVal)) {
      const children = diffArrays(oldVal, [], path)
      return {
        path,
        label,
        type: 'removed',
        oldValue: oldVal,
        children,
      }
    }
    return {
      path,
      label,
      type: 'removed',
      oldValue: oldVal,
    }
  }

  // Both are plain objects
  if (isPlainObject(oldVal) && isPlainObject(newVal)) {
    const allKeys = Array.from(new Set([...Object.keys(oldVal), ...Object.keys(newVal)]))
    const children = allKeys.map((k) =>
      compareValues(oldVal[k], newVal[k], path ? `${path}.${k}` : k, k)
    )
    const isUnchanged = children.every((c) => c.type === 'unchanged')
    const isAllAdded = children.every((c) => c.type === 'added')
    const isAllRemoved = children.every((c) => c.type === 'removed')

    const type: DiffType = isUnchanged
      ? 'unchanged'
      : isAllAdded
      ? 'added'
      : isAllRemoved
      ? 'removed'
      : 'modified'

    return {
      path,
      label,
      type,
      oldValue: oldVal,
      newValue: newVal,
      children,
    }
  }

  // Both are arrays
  if (Array.isArray(oldVal) && Array.isArray(newVal)) {
    const children = diffArrays(oldVal, newVal, path)
    const isUnchanged = children.every((c) => c.type === 'unchanged')
    const isAllAdded = children.every((c) => c.type === 'added')
    const isAllRemoved = children.every((c) => c.type === 'removed')

    const type: DiffType = isUnchanged
      ? 'unchanged'
      : isAllAdded
      ? 'added'
      : isAllRemoved
      ? 'removed'
      : 'modified'

    return {
      path,
      label,
      type,
      oldValue: oldVal,
      newValue: newVal,
      children,
    }
  }

  // Primitives or mixed types modified
  return {
    path,
    label,
    type: 'modified',
    oldValue: oldVal,
    newValue: newVal,
  }
}

function diffArrays(oldArr: any[], newArr: any[], basePath: string): DiffNode[] {
  const identifierKey = findArrayIdentifierKey(oldArr, newArr)

  if (identifierKey) {
    const nodes: DiffNode[] = []
    const oldMap = new Map<string, { item: any; index: number }>()
    const newMap = new Map<string, { item: any; index: number }>()

    for (let i = 0; i < oldArr.length; i++) {
      const item = oldArr[i]
      if (item && typeof item === 'object' && item[identifierKey] != null) {
        oldMap.set(String(item[identifierKey]), { item, index: i })
      }
    }

    for (let i = 0; i < newArr.length; i++) {
      const item = newArr[i]
      if (item && typeof item === 'object' && item[identifierKey] != null) {
        newMap.set(String(item[identifierKey]), { item, index: i })
      }
    }

    // Process newArr items (matching or added)
    for (let i = 0; i < newArr.length; i++) {
      const newItem = newArr[i]
      const id =
        newItem && typeof newItem === 'object' && newItem[identifierKey] != null
          ? String(newItem[identifierKey])
          : null

      if (id !== null && oldMap.has(id)) {
        const oldEntry = oldMap.get(id)!
        const label = getItemLabel(newItem, identifierKey)
        const path = basePath ? `${basePath}[${id}]` : `[${id}]`
        nodes.push(compareValues(oldEntry.item, newItem, path, label))
      } else if (id !== null) {
        const label = getItemLabel(newItem, identifierKey)
        const path = basePath ? `${basePath}[${id}]` : `[${id}]`
        nodes.push(compareValues(undefined, newItem, path, label))
      } else {
        const path = basePath ? `${basePath}[${i}]` : `[${i}]`
        nodes.push(compareValues(undefined, newItem, path, `Item #${i + 1}`))
      }
    }

    // Process removed items
    for (let i = 0; i < oldArr.length; i++) {
      const oldItem = oldArr[i]
      const id =
        oldItem && typeof oldItem === 'object' && oldItem[identifierKey] != null
          ? String(oldItem[identifierKey])
          : null

      if (id !== null && !newMap.has(id)) {
        const label = getItemLabel(oldItem, identifierKey)
        const path = basePath ? `${basePath}[${id}]` : `[${id}]`
        nodes.push(compareValues(oldItem, undefined, path, label))
      }
    }

    return nodes
  }

  // Index-by-index comparison when no identifier exists
  const maxLen = Math.max(oldArr.length, newArr.length)
  const nodes: DiffNode[] = []

  for (let i = 0; i < maxLen; i++) {
    const itemPath = basePath ? `${basePath}[${i}]` : `[${i}]`
    const oldItem = i < oldArr.length ? oldArr[i] : undefined
    const newItem = i < newArr.length ? newArr[i] : undefined
    const label = getItemLabel(newItem ?? oldItem, null, i)
    nodes.push(compareValues(oldItem, newItem, itemPath, label))
  }

  return nodes
}

/**
 * Computes deep recursive diff between two states (e.g. Draft vs Published).
 */
export function computeDeepDiff(oldObj: any, newObj: any, basePath: string = ''): DiffSummary {
  if (isPlainObject(oldObj) && isPlainObject(newObj)) {
    const allKeys = Array.from(new Set([...Object.keys(oldObj), ...Object.keys(newObj)]))
    const nodes: DiffNode[] = []
    let addedCount = 0
    let removedCount = 0
    let modifiedCount = 0

    for (const key of allKeys) {
      const childPath = basePath ? `${basePath}.${key}` : key
      const node = compareValues(oldObj[key], newObj[key], childPath, key)
      nodes.push(node)
      const counts = countChanges(node)
      addedCount += counts.added
      removedCount += counts.removed
      modifiedCount += counts.modified
    }

    return {
      totalChanges: addedCount + removedCount + modifiedCount,
      addedCount,
      removedCount,
      modifiedCount,
      nodes,
    }
  }

  if (Array.isArray(oldObj) && Array.isArray(newObj)) {
    const nodes = diffArrays(oldObj, newObj, basePath)
    let addedCount = 0
    let removedCount = 0
    let modifiedCount = 0

    for (const node of nodes) {
      const counts = countChanges(node)
      addedCount += counts.added
      removedCount += counts.removed
      modifiedCount += counts.modified
    }

    return {
      totalChanges: addedCount + removedCount + modifiedCount,
      addedCount,
      removedCount,
      modifiedCount,
      nodes,
    }
  }

  const rootNode = compareValues(oldObj, newObj, basePath || 'root', basePath || 'root')
  const counts = countChanges(rootNode)

  return {
    totalChanges: counts.added + counts.removed + counts.modified,
    addedCount: counts.added,
    removedCount: counts.removed,
    modifiedCount: counts.modified,
    nodes: [rootNode],
  }
}

/**
 * Compares two multiline texts line-by-line using LCS algorithm.
 */
export function computeTextLineDiff(
  oldText: string,
  newText: string
): Array<{ type: 'added' | 'removed' | 'unchanged'; line: string }> {
  const normOld = (oldText ?? '').replace(/\r\n/g, '\n').replace(/\r/g, '\n')
  const normNew = (newText ?? '').replace(/\r\n/g, '\n').replace(/\r/g, '\n')

  if (!normOld && !normNew) {
    return []
  }

  const linesA = normOld ? normOld.split('\n') : []
  const linesB = normNew ? normNew.split('\n') : []

  if (linesA.length === 0) {
    return linesB.map((line) => ({ type: 'added' as const, line }))
  }

  if (linesB.length === 0) {
    return linesA.map((line) => ({ type: 'removed' as const, line }))
  }

  const result: Array<{ type: 'added' | 'removed' | 'unchanged'; line: string }> = []

  // Trim common prefix lines
  let start = 0
  while (start < linesA.length && start < linesB.length && linesA[start] === linesB[start]) {
    result.push({ type: 'unchanged', line: linesA[start] })
    start++
  }

  // Trim common suffix lines
  let endA = linesA.length - 1
  let endB = linesB.length - 1
  while (endA >= start && endB >= start && linesA[endA] === linesB[endB]) {
    endA--
    endB--
  }

  const midA = linesA.slice(start, endA + 1)
  const midB = linesB.slice(start, endB + 1)

  if (midA.length === 0) {
    for (const line of midB) {
      result.push({ type: 'added', line })
    }
  } else if (midB.length === 0) {
    for (const line of midA) {
      result.push({ type: 'removed', line })
    }
  } else {
    const dp: number[][] = Array.from({ length: midA.length + 1 }, () =>
      new Array(midB.length + 1).fill(0)
    )

    for (let i = 1; i <= midA.length; i++) {
      for (let j = 1; j <= midB.length; j++) {
        if (midA[i - 1] === midB[j - 1]) {
          dp[i][j] = dp[i - 1][j - 1] + 1
        } else {
          dp[i][j] = Math.max(dp[i - 1][j], dp[i][j - 1])
        }
      }
    }

    let i = midA.length
    let j = midB.length
    const midResult: Array<{ type: 'added' | 'removed' | 'unchanged'; line: string }> = []

    while (i > 0 || j > 0) {
      if (i > 0 && j > 0 && midA[i - 1] === midB[j - 1]) {
        midResult.push({ type: 'unchanged', line: midA[i - 1] })
        i--
        j--
      } else if (j > 0 && (i === 0 || dp[i][j - 1] >= dp[i - 1][j])) {
        midResult.push({ type: 'added', line: midB[j - 1] })
        j--
      } else if (i > 0 && (j === 0 || dp[i][j - 1] < dp[i - 1][j])) {
        midResult.push({ type: 'removed', line: midA[i - 1] })
        i--
      }
    }

    midResult.reverse()
    result.push(...midResult)
  }

  for (let k = endA + 1; k < linesA.length; k++) {
    result.push({ type: 'unchanged', line: linesA[k] })
  }

  return result
}
