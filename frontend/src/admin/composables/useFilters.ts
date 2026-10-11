import { reactive, ref, computed } from 'vue'

type FilterValue = string | number | boolean | null | undefined

export function useFilters<T extends Record<string, FilterValue>>(defaults: T) {
  const filters = reactive<T>({ ...defaults } as T)
  const search = ref('')
  let debounceTimer: ReturnType<typeof setTimeout> | null = null

  function updateFilter<K extends keyof T>(key: K, value: T[K]): void {
    ;(filters as T)[key] = value
  }

  function resetFilters(): void {
    for (const key of Object.keys(defaults) as (keyof T)[]) {
      ;(filters as T)[key] = defaults[key]
    }
    search.value = ''
  }

  const queryParams = computed(() => {
    const params: Record<string, string> = {}
    for (const [key, value] of Object.entries(filters)) {
      const defaultValue = defaults[key as keyof T]
      if (value !== undefined && value !== null && value !== '' && value !== defaultValue) {
        params[key] = String(value)
      }
    }
    if (search.value.trim()) {
      params['search'] = search.value.trim()
    }
    return params
  })

  function setSearch(value: string, debounceMs = 300): void {
    if (debounceTimer !== null) clearTimeout(debounceTimer)
    debounceTimer = setTimeout(() => {
      search.value = value
    }, debounceMs)
  }

  return {
    filters,
    search,
    updateFilter,
    resetFilters,
    queryParams,
    setSearch,
  }
}
