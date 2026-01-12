<script setup>
/**
 * PreviewModal.vue - Preview modal with iframe
 * Shows the page with highlighted element based on data-key attribute
 */
import { ref, watch, onMounted, onUnmounted } from 'vue';
import Button from 'primevue/button';

const props = defineProps({
  visible: {
    type: Boolean,
    default: false
  },
  url: {
    type: String,
    default: ''
  },
  highlightKey: {
    type: String,
    default: ''
  }
});

const emit = defineEmits(['close']);

const iframeRef = ref(null);
const isLoading = ref(true);

// Handle iframe load
function onIframeLoad() {
  isLoading.value = false;
  
  // Try to highlight element in iframe (if same origin)
  try {
    const iframeDoc = iframeRef.value?.contentWindow?.document;
    if (iframeDoc && props.highlightKey) {
      const element = iframeDoc.querySelector(`[data-key="${props.highlightKey}"]`);
      if (element) {
        // Add highlight styles
        element.style.outline = '3px solid #f97316';
        element.style.outlineOffset = '4px';
        element.style.animation = 'pulse-highlight 1.5s ease-in-out infinite';
        
        // Scroll into view
        element.scrollIntoView({ behavior: 'smooth', block: 'center' });
        
        // Add keyframe animation
        const style = iframeDoc.createElement('style');
        style.textContent = `
          @keyframes pulse-highlight {
            0%, 100% { outline-color: #f97316; }
            50% { outline-color: #ea580c; }
          }
        `;
        iframeDoc.head.appendChild(style);
      }
    }
  } catch (e) {
    // Cross-origin - can't access iframe content
    console.log('Preview is cross-origin, highlighting not available');
  }
}

// Close modal on escape
function handleKeydown(e) {
  if (e.key === 'Escape' && props.visible) {
    emit('close');
  }
}

onMounted(() => {
  document.addEventListener('keydown', handleKeydown);
});

onUnmounted(() => {
  document.removeEventListener('keydown', handleKeydown);
});

// Reset loading state when URL changes
watch(() => props.url, () => {
  isLoading.value = true;
});
</script>

<template>
  <Teleport to="body">
    <Transition name="modal">
      <div v-if="visible" class="preview-overlay" @click.self="$emit('close')">
        <div class="preview-modal">
          <!-- Modal Header -->
          <div class="modal-header">
            <div class="header-info">
              <h3 class="modal-title">
                <i class="pi pi-eye"></i>
                Live Preview
              </h3>
              <p class="modal-subtitle">
                Highlighting: <code>{{ highlightKey }}</code>
              </p>
            </div>
            <div class="header-actions">
              <a 
                :href="url" 
                target="_blank" 
                rel="noopener"
                class="external-link"
                title="Open in new tab"
              >
                <i class="pi pi-external-link"></i>
              </a>
              <Button
                icon="pi pi-times"
                class="close-btn"
                text
                rounded
                severity="secondary"
                @click="$emit('close')"
              />
            </div>
          </div>

          <!-- Modal Body -->
          <div class="modal-body">
            <!-- Loading State -->
            <div v-if="isLoading" class="loading-overlay">
              <div class="loading-spinner"></div>
              <p>Loading preview...</p>
            </div>

            <!-- Iframe -->
            <iframe
              v-if="url"
              ref="iframeRef"
              :src="url"
              class="preview-iframe"
              @load="onIframeLoad"
            ></iframe>
          </div>

          <!-- Modal Footer -->
          <div class="modal-footer">
            <p class="footer-note">
              <i class="pi pi-info-circle"></i>
              The highlighted element shows where this content appears on the page
            </p>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.preview-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.6);
  backdrop-filter: blur(4px);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 2rem;
  z-index: 1000;
}

.preview-modal {
  width: 100%;
  max-width: 1200px;
  height: 90vh;
  max-height: 800px;
  background: white;
  border-radius: 16px;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
}

/* Modal Header */
.modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1rem 1.5rem;
  background: #f8fafc;
  border-bottom: 1px solid #e2e8f0;
}

.header-info {
  flex: 1;
}

.modal-title {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-family: 'Montserrat', sans-serif;
  font-size: 1rem;
  font-weight: 600;
  color: #1e293b;
  margin: 0 0 0.25rem;
}

.modal-title i {
  color: #f97316;
}

.modal-subtitle {
  font-family: 'Inter', sans-serif;
  font-size: 0.75rem;
  color: #64748b;
  margin: 0;
}

.modal-subtitle code {
  background: #e2e8f0;
  padding: 0.125rem 0.375rem;
  border-radius: 4px;
  font-family: 'JetBrains Mono', 'Fira Code', monospace;
  font-size: 0.625rem;
  color: #ea580c;
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.external-link {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  color: #64748b;
  text-decoration: none;
  border-radius: 8px;
  transition: all 0.2s ease;
}

.external-link:hover {
  background: #e2e8f0;
  color: #1e293b;
}

.close-btn {
  color: #64748b;
}

/* Modal Body */
.modal-body {
  flex: 1;
  position: relative;
  overflow: hidden;
}

.loading-overlay {
  position: absolute;
  inset: 0;
  background: white;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 1rem;
  z-index: 10;
}

.loading-spinner {
  width: 40px;
  height: 40px;
  border: 3px solid #e2e8f0;
  border-top-color: #f97316;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.loading-overlay p {
  font-family: 'Inter', sans-serif;
  font-size: 0.875rem;
  color: #64748b;
  margin: 0;
}

.preview-iframe {
  width: 100%;
  height: 100%;
  border: none;
}

/* Modal Footer */
.modal-footer {
  padding: 0.75rem 1.5rem;
  background: #f8fafc;
  border-top: 1px solid #e2e8f0;
}

.footer-note {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-family: 'Inter', sans-serif;
  font-size: 0.75rem;
  color: #64748b;
  margin: 0;
}

.footer-note i {
  color: #f97316;
}

/* Transitions */
.modal-enter-active,
.modal-leave-active {
  transition: all 0.3s ease;
}

.modal-enter-from,
.modal-leave-to {
  opacity: 0;
}

.modal-enter-from .preview-modal,
.modal-leave-to .preview-modal {
  transform: scale(0.95) translateY(20px);
}

/* Responsive */
@media (max-width: 768px) {
  .preview-overlay {
    padding: 1rem;
  }

  .preview-modal {
    height: 95vh;
    max-height: none;
    border-radius: 12px;
  }

  .modal-header {
    padding: 0.875rem 1rem;
  }
}
</style>
