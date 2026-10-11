import { reactive } from 'vue'

interface ConfirmOptions {
  title?: string
  message: string
  confirmLabel?: string
  danger?: boolean
}

interface ConfirmState {
  visible: boolean
  title: string
  message: string
  confirmLabel: string
  danger: boolean
}

export function useConfirm() {
  const confirmState = reactive<ConfirmState>({
    visible: false,
    title: 'Confirm',
    message: '',
    confirmLabel: 'Confirm',
    danger: false,
  })

  let resolvePromise: ((value: boolean) => void) | null = null

  function confirm(options: ConfirmOptions): Promise<boolean> {
    confirmState.visible = true
    confirmState.title = options.title ?? 'Confirm'
    confirmState.message = options.message
    confirmState.confirmLabel = options.confirmLabel ?? 'Confirm'
    confirmState.danger = options.danger ?? false

    return new Promise<boolean>((resolve) => {
      resolvePromise = resolve
    })
  }

  function handleConfirm(): void {
    confirmState.visible = false
    resolvePromise?.(true)
    resolvePromise = null
  }

  function handleCancel(): void {
    confirmState.visible = false
    resolvePromise?.(false)
    resolvePromise = null
  }

  const showConfirm = confirm

  return {
    showConfirm,
    confirmState,
    confirm,
    handleConfirm,
    handleCancel,
  }
}
