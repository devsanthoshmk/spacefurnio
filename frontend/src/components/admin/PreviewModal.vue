<script setup>
/**
 * PreviewModal.vue - Preview modal with direct component rendering
 * Renders the component directly and highlights element based on data-key attribute
 */
import { ref, watch, onMounted, onUnmounted, computed, nextTick, defineAsyncComponent, shallowRef } from 'vue';
import Button from 'primevue/button';

const props = defineProps({
  visible: {
    type: Boolean,
    default: false
  },
  highlightKey: {
    type: String,
    default: ''
  },
  componentName: {
    type: [Function, Array],
    default: null
  }
});

const emit = defineEmits(['close']);

const previewContainer = ref(null);
const isLoading = ref(true);
const activeTab = ref(0);

// Get component import functions to render (can be single or multiple)
const componentsToRender = computed(() => {
  if (!props.componentName) return [];
  if (Array.isArray(props.componentName)) {
    return props.componentName;
  }
  return [props.componentName];
});

// Current component import function based on active tab
const currentComponentLoader = computed(() => {
  return componentsToRender.value[activeTab.value] || null;
});

// Extract display name from the import function string representation
function getDisplayName(loader) {
  if (!loader) return '';
  // Convert function to string and extract component name from import path
  const funcStr = loader.toString();
  const match = funcStr.match(/import\s*\(\s*['"]([^'"]+)['"]\s*\)/);
  if (match) {
    const pathMatch = match[1].match(/([^/]+)\.vue$/);
    return pathMatch ? pathMatch[1] : match[1];
  }
  return 'Component';
}

// Loaded component
const loadedComponent = shallowRef(null);

// Load and render component by calling the import function directly
async function loadComponent() {
  const loader = currentComponentLoader.value;
  
  if (!loader || typeof loader !== 'function') {
    loadedComponent.value = null;
    isLoading.value = false;
    return;
  }

  isLoading.value = true;

  try {
    // Call the arrow function directly to import the component
    const module = await loader();
    loadedComponent.value = module.default;
    
    // Wait for next tick to ensure component is rendered
    await nextTick();
    
    // Small delay to ensure DOM is fully rendered
    setTimeout(() => {
      highlightElement();
      isLoading.value = false;
    }, 300);
  } catch (error) {
    console.error('Failed to load component:', error);
    loadedComponent.value = null;
    isLoading.value = false;
  }
}


// Highlight the element with matching data-key
function highlightElement() {
  if (!previewContainer.value || !props.highlightKey) return;

  // Remove any existing highlights
  const existingHighlights = previewContainer.value.querySelectorAll('.preview-highlight');
  existingHighlights.forEach(el => {
    el.style.outline = '';
    el.style.outlineOffset = '';
    el.classList.remove('preview-highlight');
  });

  // Find and highlight the element
  const element = previewContainer.value.querySelector(`[data-key="${props.highlightKey}"]`);
  if (element) {
    element.classList.add('preview-highlight');
    element.style.outline = '3px solid #f97316';
    element.style.outlineOffset = '4px';
    element.style.animation = 'pulse-highlight 1.5s ease-in-out infinite';
    
    // Scroll into view
    element.scrollIntoView({ behavior: 'smooth', block: 'center' });
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

// Load component when modal opens or component changes
watch([() => props.visible, () => props.componentName], ([visible]) => {
  if (visible) {
    activeTab.value = 0;
    loadComponent();
  }
}, { immediate: true });

// Reload when active tab changes
watch(activeTab, () => {
  loadComponent();
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

          <!-- Component Tabs (for multi-component content) -->
          <div v-if="componentsToRender.length > 1" class="component-tabs">
            <button
              v-for="(comp, index) in componentsToRender"
              :key="comp"
              class="component-tab"
              :class="{ active: activeTab === index }"
              @click="activeTab = index"
            >
              <i class="pi pi-code"></i>
              {{ getDisplayName(comp) }}
              <span v-if="activeTab === index" class="tab-indicator"></span>
            </button>
            <div class="tabs-info">
              <i class="pi pi-info-circle"></i>
              This content is used in {{ componentsToRender.length }} components
            </div>
          </div>

          <!-- Modal Body -->
          <div class="modal-body">
            <!-- Loading State -->
            <div v-if="isLoading" class="loading-overlay">
              <div class="loading-spinner"></div>
              <p>Loading component preview...</p>
            </div>

            <!-- Preview Container -->
            <div 
              ref="previewContainer" 
              class="preview-container"
              :class="{ 'scrollable': !isLoading }"
            >
              <component 
                v-if="loadedComponent && !isLoading" 
                :is="loadedComponent" 
                class="preview-component"
              />
              
              <!-- Fallback if no component -->
              <div v-if="!loadedComponent && !isLoading" class="no-component">
                <i class="pi pi-exclamation-circle"></i>
                <p>Component not found: {{ getDisplayName(currentComponentLoader) }}</p>
              </div>
            </div>
          </div>

          <!-- Modal Footer -->
          <div class="modal-footer">
            <p class="footer-note">
              <i class="pi pi-info-circle"></i>
              The highlighted element shows where this content appears in the component
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

.close-btn {
  color: #64748b;
}

/* Component Tabs */
.component-tabs {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1.5rem;
  background: linear-gradient(135deg, #faf5ff 0%, #f8fafc 100%);
  border-bottom: 1px solid #e2e8f0;
  flex-wrap: wrap;
}

.component-tab {
  display: flex;
  align-items: center;
  gap: 0.375rem;
  padding: 0.5rem 1rem;
  background: white;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  font-family: 'Inter', sans-serif;
  font-size: 0.75rem;
  font-weight: 500;
  color: #64748b;
  cursor: pointer;
  transition: all 0.2s ease;
  position: relative;
}

.component-tab:hover {
  border-color: #8b5cf6;
  color: #8b5cf6;
}

.component-tab.active {
  background: linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%);
  border-color: transparent;
  color: white;
}

.component-tab i {
  font-size: 0.75rem;
}

.tab-indicator {
  position: absolute;
  bottom: -0.75rem;
  left: 50%;
  transform: translateX(-50%);
  width: 0;
  height: 0;
  border-left: 6px solid transparent;
  border-right: 6px solid transparent;
  border-top: 6px solid #7c3aed;
}

.tabs-info {
  margin-left: auto;
  display: flex;
  align-items: center;
  gap: 0.375rem;
  font-family: 'Inter', sans-serif;
  font-size: 0.7rem;
  color: #8b5cf6;
}

.tabs-info i {
  font-size: 0.75rem;
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

.preview-container {
  width: 100%;
  height: 100%;
  overflow: hidden;
}

.preview-container.scrollable {
  overflow: auto;
}

.preview-component {
  min-height: 100%;
}

.no-component {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  color: #94a3b8;
  gap: 0.5rem;
}

.no-component i {
  font-size: 2rem;
  color: #f97316;
}

.no-component p {
  font-family: 'Inter', sans-serif;
  font-size: 0.875rem;
  margin: 0;
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

/* Highlight Animation */
@keyframes pulse-highlight {
  0%, 100% { outline-color: #f97316; }
  50% { outline-color: #ea580c; }
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

  .component-tabs {
    padding: 0.5rem 1rem;
  }

  .tabs-info {
    width: 100%;
    margin-left: 0;
    margin-top: 0.5rem;
    justify-content: center;
  }
}
</style>
