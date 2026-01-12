<script setup>
/**
 * AdminContentsPage.vue - Contents management page
 * Lists content files and provides editing functionality
 */
import { ref, onMounted, computed, watch } from 'vue';
import ContentEditor from '@/components/admin/ContentEditor.vue';
import PreviewModal from '@/components/admin/PreviewModal.vue';
import Button from 'primevue/button';
import Toast from 'primevue/toast';
import { useToast } from 'primevue/usetoast';
import ProgressSpinner from 'primevue/progressspinner';

// Import content source files directly to get actual arrow functions for components
import homePageContent from '@/assets/contents/homePage.js';

const props = defineProps({
  patToken: {
    type: String,
    required: true
  }
});

const toast = useToast();

// API base URL
const API_BASE= import.meta.env.VITE_API_URL || 'https://spacefurnio.in/backend';

// State
const isLoading = ref(true);
const isSaving = ref(false);
const contentFiles = ref([]);
const activeFile = ref(null);
const fileContent = ref({});
const fileSha = ref('');
const pendingChanges = ref({});
const hasUnsavedChanges = computed(() => Object.keys(pendingChanges.value).length > 0);

// Preview modal state
const isPreviewOpen = ref(false);
const previewKey = ref('');
const previewUrl = ref('');
const previewComponent = ref(null);

// Page mapping for preview URLs
const pageMapping = {
  'homePage.js': '/'
};

// Map of content files to their imported modules
// Uses the local import to get actual arrow functions for component loading
const contentSourceMap = {
  'homePage.js': homePageContent
};

// Get component loader(s) from the original content source
// Returns the actual arrow function(s) for dynamic imports
// The component property can be a single function or an array showing all impacted components
function getComponentLoader(key) {
  const fileName = activeFile.value?.name;
  if (!fileName || !key) return null;
  
  const contentSource = contentSourceMap[fileName];
  if (!contentSource || !contentSource[key]) return null;
  
  const component = contentSource[key].component;
  if (!component) return null;
  
  // Return the component loader(s) directly
  // If it's an array, it means the content appears in multiple components
  // (e.g., child component and parent component - shows full impact of changes)
  return component;
}

// Load content files on mount
onMounted(async () => {
  // Check for pending changes in localStorage FIRST
  const stored = localStorage.getItem('admin_pending_changes');
  if (stored) {
    try {
      pendingChanges.value = JSON.parse(stored);
    } catch (e) {
      console.error('Failed to parse stored changes:', e);
    }
  }

  await loadContentFiles();
});

// Watch pending changes and save to localStorage
watch(pendingChanges, (newVal) => {
  if (Object.keys(newVal).length > 0) {
    localStorage.setItem('admin_pending_changes', JSON.stringify(newVal));
  } else {
    localStorage.removeItem('admin_pending_changes');
  }
  // Trigger update for reactive content files
  window.dispatchEvent(new Event('content:update'));
}, { deep: true });

// Load list of content files
async function loadContentFiles() {
  isLoading.value = true;

  try {
    const response = await fetch(
      `${API_BASE}/api/v1/admin/content/files?pat=${encodeURIComponent(props.patToken)}`
    );

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Failed to load files');
    }

    contentFiles.value = data.files;

    // Auto-select first file
    if (data.files.length > 0) {
      await selectFile(data.files[0]);
    }

  } catch (err) {
    console.error('Load content files error:', err);
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: err.message || 'Failed to load content files',
      life: 5000
    });
  } finally {
    isLoading.value = false;
  }
}

// Select and load a file
async function selectFile(file) {
  console.log('Selecting file:', file.name);
  if (activeFile.value?.name === file.name) return;

  activeFile.value = file;
  isLoading.value = true;

  try {
    const response = await fetch(
      `${API_BASE}/api/v1/admin/content/files/${file.name}?pat=${encodeURIComponent(props.patToken)}`
    );

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.message || 'Failed to load file');
    }

    fileContent.value = data.content;
    fileSha.value = data.sha;

    // Merge with any pending changes for this file
    if (pendingChanges.value[file.name]) {
      fileContent.value = { ...fileContent.value, ...pendingChanges.value[file.name] };
    }

  } catch (err) {
    console.error('Load file error:', err);
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: err.message || 'Failed to load file content',
      life: 5000
    });
  } finally {
    isLoading.value = false;
  }
}

// Handle value change from editor
function handleValueChange(key, value) {
  // Update local content
  // We recreate the object to ensure Vue detects the change and propagates it to ContentEditor props
  fileContent.value = {
    ...fileContent.value,
    [key]: value
  };

  // Track pending changes
  if (!activeFile.value) return;
  
  if (!pendingChanges.value[activeFile.value.name]) {
    pendingChanges.value[activeFile.value.name] = {};
  }
  pendingChanges.value[activeFile.value.name][key] = value;
}

// Open preview modal
function openPreview(key) {
  previewKey.value = key;

  // Get the page URL for this file
  const pageUrl = pageMapping[activeFile.value?.name] || '/';
  previewUrl.value = `${window.location.origin}${pageUrl}?highlight=${key}`;

  // Get the component loader(s) directly from the original content source
  // This uses the actual arrow functions defined in homePage.js
  previewComponent.value = getComponentLoader(key);

  isPreviewOpen.value = true;
}

// Close preview modal
function closePreview() {
  isPreviewOpen.value = false;
  previewKey.value = '';
  previewUrl.value = '';
  previewComponent.value = null;
}

// Save changes to GitHub
async function saveChanges() {
  if (!hasUnsavedChanges.value || !activeFile.value) return;

  isSaving.value = true;

  try {
    // Get the full content with merged changes
    const updatedContent = { ...fileContent.value };

    const response = await fetch(`${API_BASE}/api/v1/admin/content/update`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        pat: props.patToken,
        filename: activeFile.value.name,
        content: updatedContent,
        sha: fileSha.value,
        commitMessage: `Update content: ${Object.keys(pendingChanges.value[activeFile.value.name] || {}).join(', ')}`
      })
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Failed to save changes');
    }

    // Update SHA for future updates
    fileSha.value = data.newSha;

    // Clear pending changes for this file
    delete pendingChanges.value[activeFile.value.name];
    pendingChanges.value = { ...pendingChanges.value }; // Trigger reactivity

    toast.add({
      severity: 'success',
      summary: 'Saved!',
      detail: data.message || 'Changes saved to GitHub',
      life: 5000
    });

  } catch (err) {
    console.error('Save error:', err);
    toast.add({
      severity: 'error',
      summary: 'Save Failed',
      detail: err.message || 'Failed to save changes to GitHub',
      life: 5000
    });
  } finally {
    isSaving.value = false;
  }
}

// Discard pending changes
function discardChanges() {
  if (!activeFile.value) return;

  delete pendingChanges.value[activeFile.value.name];
  pendingChanges.value = { ...pendingChanges.value };

  // Reload file content
  selectFile(activeFile.value);

  toast.add({
    severity: 'info',
    summary: 'Changes Discarded',
    detail: 'Local changes have been discarded',
    life: 3000
  });
}

// Format filename for display
function formatFilename(filename) {
  return filename
    .replace('.json', '')
    .replace(/([A-Z])/g, ' $1')
    .replace(/^./, str => str.toUpperCase())
    .trim();
}
</script>

<template>
  <Toast />

  <div class="contents-page">
    <!-- Page Header -->
    <div class="page-top">
      <div class="page-info">
        <h2 class="section-title">Content Management</h2>
        <p class="section-subtitle">Edit website content and save to repository</p>
      </div>

      <div class="page-actions">
        <Button
          v-if="hasUnsavedChanges"
          label="Discard"
          icon="pi pi-times"
          class="discard-btn"
          text
          severity="secondary"
          @click="discardChanges"
        />
        <Button
          label="Save to GitHub"
          icon="pi pi-github"
          class="save-btn"
          :loading="isSaving"
          :disabled="!hasUnsavedChanges"
          @click="saveChanges"
        />
      </div>
    </div>

    <!-- Unsaved Changes Banner -->
    <div v-if="hasUnsavedChanges" class="unsaved-banner">
      <i class="pi pi-exclamation-circle"></i>
      <span>You have unsaved changes. They are stored locally until you save.</span>
    </div>

    <!-- Loading State -->
    <div v-if="isLoading && !activeFile" class="loading-state">
      <ProgressSpinner strokeWidth="4" />
      <p>Loading content files...</p>
    </div>

    <!-- Content Grid -->
    <div v-else class="content-grid">
      <!-- File Tabs -->
      <div class="file-tabs">
        <button
          v-for="file in contentFiles"
          :key="file.name"
          class="file-tab"
          :class="{ active: activeFile?.name === file.name }"
          @click="selectFile(file)"
        >
          <i class="pi pi-file"></i>
          <span>{{ formatFilename(file.name) }}</span>
          <span
            v-if="pendingChanges[file.name]"
            class="changes-indicator"
            :title="`${Object.keys(pendingChanges[file.name]).length} unsaved changes`"
          >
            {{ Object.keys(pendingChanges[file.name]).length }}
          </span>
        </button>
      </div>

      <!-- Editor Area -->
      <div class="editor-area">
        <ContentEditor
          v-if="activeFile && !isLoading"
          :content="fileContent"
          :filename="activeFile.name"
          @value-change="handleValueChange"
          @preview="openPreview"
        />

        <div v-else-if="isLoading" class="loading-editor">
          <ProgressSpinner strokeWidth="4" />
        </div>

        <div v-else class="empty-state">
          <i class="pi pi-folder-open"></i>
          <p>Select a file to edit</p>
        </div>
      </div>
    </div>

    <!-- Preview Modal -->
    <PreviewModal
      :visible="isPreviewOpen"
      :component-name="previewComponent"
      :highlight-key="previewKey"
      @close="closePreview"
    />
  </div>
</template>

<style scoped>
.contents-page {
  max-width: 1400px;
  margin: 0 auto;
}

/* Page Top */
.page-top {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  margin-bottom: 1.5rem;
  gap: 1rem;
  flex-wrap: wrap;
}

.section-title {
  font-family: 'Montserrat', sans-serif;
  font-size: 1.25rem;
  font-weight: 700;
  color: #1e293b;
  margin: 0 0 0.25rem;
}

.section-subtitle {
  font-family: 'Inter', sans-serif;
  font-size: 0.875rem;
  color: #64748b;
  margin: 0;
}

.page-actions {
  display: flex;
  gap: 0.75rem;
}

.save-btn {
  background: linear-gradient(135deg, #f97316 0%, #ea580c 100%);
  border: none;
  font-weight: 600;
}

.save-btn:hover:not(:disabled) {
  background: linear-gradient(135deg, #ea580c 0%, #dc2626 100%);
}

.save-btn:disabled {
  background: #e2e8f0;
  color: #94a3b8;
}

.discard-btn {
  color: #64748b;
}

/* Unsaved Banner */
.unsaved-banner {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.875rem 1rem;
  background: linear-gradient(135deg, rgba(249, 115, 22, 0.1) 0%, rgba(234, 88, 12, 0.05) 100%);
  border: 1px solid rgba(249, 115, 22, 0.2);
  border-radius: 10px;
  margin-bottom: 1.5rem;
  font-family: 'Inter', sans-serif;
  font-size: 0.875rem;
  color: #ea580c;
}

.unsaved-banner i {
  font-size: 1rem;
}

/* Loading State */
.loading-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 4rem 2rem;
  color: #64748b;
}

.loading-state p {
  margin-top: 1rem;
  font-family: 'Inter', sans-serif;
}

/* Content Grid */
.content-grid {
  background: white;
  border-radius: 16px;
  border: 1px solid #e2e8f0;
  overflow: hidden;
}

/* File Tabs */
.file-tabs {
  display: flex;
  gap: 0.25rem;
  padding: 0.75rem;
  background: #f8fafc;
  border-bottom: 1px solid #e2e8f0;
  overflow-x: auto;
}

.file-tab {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.625rem 1rem;
  background: transparent;
  border: none;
  border-radius: 8px;
  font-family: 'Inter', sans-serif;
  font-size: 0.875rem;
  font-weight: 500;
  color: #64748b;
  cursor: pointer;
  transition: all 0.2s ease;
  white-space: nowrap;
}

.file-tab:hover {
  background: #e2e8f0;
  color: #1e293b;
}

.file-tab.active {
  background: white;
  color: #ea580c;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.file-tab i {
  font-size: 0.875rem;
}

.changes-indicator {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 18px;
  height: 18px;
  padding: 0 0.375rem;
  background: #f97316;
  color: white;
  font-size: 0.625rem;
  font-weight: 600;
  border-radius: 20px;
}

/* Editor Area */
.editor-area {
  padding: 1.5rem;
  min-height: 400px;
}

.loading-editor {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 300px;
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 4rem 2rem;
  color: #94a3b8;
}

.empty-state i {
  font-size: 3rem;
  margin-bottom: 1rem;
}

.empty-state p {
  font-family: 'Inter', sans-serif;
  font-size: 0.875rem;
  margin: 0;
}

/* Responsive */
@media (max-width: 768px) {
  .page-top {
    flex-direction: column;
    align-items: stretch;
  }

  .page-actions {
    justify-content: flex-end;
  }

  .file-tabs {
    padding: 0.5rem;
  }

  .editor-area {
    padding: 1rem;
  }
}
</style>
