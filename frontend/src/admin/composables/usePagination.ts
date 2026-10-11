import { ref, computed } from 'vue'

export function usePagination(defaultLimit = 25) {
  const page = ref(1)
  const limit = ref(defaultLimit)
  const total = ref(0)

  const totalPages = computed(() => Math.ceil(total.value / limit.value) || 1)
  const hasNextPage = computed(() => page.value < totalPages.value)
  const hasPrevPage = computed(() => page.value > 1)

  function setTotal(t: number): void {
    total.value = t
  }

  function resetPage(): void {
    page.value = 1
  }

  function nextPage(): void {
    if (hasNextPage.value) page.value++
  }

  function prevPage(): void {
    if (hasPrevPage.value) page.value--
  }

  function goToPage(p: number): void {
    page.value = Math.max(1, Math.min(p, totalPages.value))
  }

  return {
    page,
    limit,
    total,
    totalPages,
    hasNextPage,
    hasPrevPage,
    setTotal,
    resetPage,
    nextPage,
    prevPage,
    goToPage,
  }
}
