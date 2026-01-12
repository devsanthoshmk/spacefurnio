<script setup>
/**
 * ContentEditor.vue - Reusable content key-value editor component
 * Displays each key as a human-readable label with editable values
 */
import { computed } from 'vue';
import InputText from 'primevue/inputtext';
import Textarea from 'primevue/textarea';
import Button from 'primevue/button';

const props = defineProps({
  content: {
    type: Object,
    required: true
  },
  filename: {
    type: String,
    required: true
  }
});

const emit = defineEmits(['value-change', 'preview']);

// Convert snake_case key to human-readable label
function formatLabel(key) {
  return key
    .replace(/_/g, ' ')
    .replace(/\b\w/g, char => char.toUpperCase());
}

// Get description/hint for a key
function getHint(key) {
  const hints = {
    hero_brand_name: 'Main brand name displayed in the hero section',
    hero_tagline: 'Tagline shown below the brand name',
    new_arrivals_heading: 'Heading for the new arrivals section',
    coming_soon: 'Text shown on coming soon overlay',
    cta_line_1: 'First line of call-to-action',
    cta_line_2: 'Second line of call-to-action (colored)',
    grab_now_button: 'Text on the main action button',
    product_section_heading: 'Heading for the products section',
    scroll_text_1: 'First scroll animation text',
    scroll_text_2: 'Second scroll animation text'
  };
  return hints[key] || null;
}

// Determine if a value should use textarea (longer text)
function shouldUseTextarea(value) {
  return typeof value === 'string' && (value.length > 50 || value.includes('\n'));
}

// Get sorted content entries
const contentEntries = computed(() => {
  return Object.entries(props.content).sort(([a], [b]) => a.localeCompare(b));
});

// Handle value change
function onValueChange(key, value) {
  emit('value-change', key, value);
}

// Open preview
function openPreview(key) {
  emit('preview', key);
}
</script>

<template>
  <div class="content-editor">
    <div class="editor-header">
      <h3 class="editor-title">
        <i class="pi pi-pencil"></i>
        Editing: {{ filename }}
      </h3>
      <p class="editor-subtitle">
        {{ contentEntries.length }} editable fields
      </p>
    </div>

    <div class="fields-grid">
      <div 
        v-for="[key, value] in contentEntries" 
        :key="key"
        class="field-card"
      >
        <div class="field-header">
          <div class="field-info">
            <label :for="key" class="field-label">
              {{ formatLabel(key) }}
            </label>
            <span class="field-key">{{ key }}</span>
          </div>
          <Button
            icon="pi pi-eye"
            class="preview-btn"
            text
            rounded
            severity="secondary"
            title="Preview on page"
            @click="openPreview(key)"
          />
        </div>

        <p v-if="getHint(key)" class="field-hint">
          {{ getHint(key) }}
        </p>

        <div class="field-input">
          <Textarea
            v-if="shouldUseTextarea(value)"
            :id="key"
            :modelValue="value"
            class="input-textarea"
            rows="3"
            autoResize
            @update:modelValue="onValueChange(key, $event)"
          />
          <InputText
            v-else
            :id="key"
            :modelValue="value"
            class="input-text"
            @update:modelValue="onValueChange(key, $event)"
          />
        </div>

        <div class="field-footer">
          <span class="char-count">
            {{ String(value).length }} characters
          </span>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.content-editor {
  min-height: 100%;
}

/* Editor Header */
.editor-header {
  margin-bottom: 1.5rem;
  padding-bottom: 1rem;
  border-bottom: 1px solid #e2e8f0;
}

.editor-title {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-family: 'Montserrat', sans-serif;
  font-size: 1rem;
  font-weight: 600;
  color: #1e293b;
  margin: 0 0 0.25rem;
}

.editor-title i {
  color: #f97316;
  font-size: 0.875rem;
}

.editor-subtitle {
  font-family: 'Inter', sans-serif;
  font-size: 0.75rem;
  color: #94a3b8;
  margin: 0;
}

/* Fields Grid */
.fields-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
  gap: 1.25rem;
}

/* Field Card */
.field-card {
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  padding: 1.25rem;
  transition: all 0.2s ease;
}

.field-card:hover {
  border-color: #f97316;
  box-shadow: 0 4px 12px rgba(249, 115, 22, 0.1);
}

.field-card:focus-within {
  border-color: #f97316;
  box-shadow: 0 0 0 3px rgba(249, 115, 22, 0.1);
}

/* Field Header */
.field-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 0.75rem;
  margin-bottom: 0.5rem;
}

.field-info {
  flex: 1;
  min-width: 0;
}

.field-label {
  display: block;
  font-family: 'Inter', sans-serif;
  font-size: 0.875rem;
  font-weight: 600;
  color: #1e293b;
  margin-bottom: 0.125rem;
}

.field-key {
  display: inline-block;
  font-family: 'JetBrains Mono', 'Fira Code', monospace;
  font-size: 0.625rem;
  color: #94a3b8;
  background: #e2e8f0;
  padding: 0.125rem 0.375rem;
  border-radius: 4px;
}

.preview-btn {
  flex-shrink: 0;
  width: 32px;
  height: 32px;
  color: #64748b;
}

.preview-btn:hover {
  color: #f97316;
  background: rgba(249, 115, 22, 0.1);
}

/* Field Hint */
.field-hint {
  font-family: 'Inter', sans-serif;
  font-size: 0.75rem;
  color: #64748b;
  margin: 0 0 0.75rem;
  line-height: 1.4;
}

/* Field Input */
.field-input {
  margin-bottom: 0.5rem;
}

.input-text,
.input-textarea {
  width: 100%;
  font-family: 'Inter', sans-serif;
  font-size: 0.875rem;
  background: white;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  padding: 0.75rem 1rem;
  color: #1e293b;
  transition: all 0.2s ease;
}

.input-text:focus,
.input-textarea:focus {
  outline: none;
  border-color: #f97316;
  box-shadow: 0 0 0 3px rgba(249, 115, 22, 0.1);
}

.input-textarea {
  resize: vertical;
  min-height: 80px;
}

/* Field Footer */
.field-footer {
  display: flex;
  justify-content: flex-end;
}

.char-count {
  font-family: 'Inter', sans-serif;
  font-size: 0.625rem;
  color: #94a3b8;
}

/* Responsive */
@media (max-width: 768px) {
  .fields-grid {
    grid-template-columns: 1fr;
  }

  .field-card {
    padding: 1rem;
  }
}
</style>
