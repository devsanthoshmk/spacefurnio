<template>
  <div class="flex h-full min-h-[calc(100vh-4rem)] flex-col bg-slate-100/70 text-slate-800">
    <Toast />

    <!-- TOPBAR -->
    <header class="sticky top-0 z-20 border-b border-slate-200 bg-white/95 px-4 py-2.5 backdrop-blur-md sm:px-6">
      <div class="flex flex-wrap items-center justify-between gap-3">
        <!-- Left: Back button & Breadcrumbs -->
        <div class="flex min-w-0 items-center gap-3">
          <button
            type="button"
            class="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 shadow-2xs transition hover:bg-slate-50 hover:text-slate-900 focus:outline-none focus:ring-2 focus:ring-admin-primary"
            title="Back to CMS Hub"
            aria-label="Back to CMS Hub"
            @click="handleBack"
          >
            <i class="pi pi-arrow-left text-sm" />
          </button>

          <nav class="flex min-w-0 items-center gap-1.5 text-xs sm:text-sm" aria-label="Breadcrumb">
            <button
              type="button"
              class="font-medium text-slate-500 transition hover:text-slate-800"
              @click="handleBack"
            >
              CMS
            </button>
            <i class="pi pi-angle-right text-[10px] text-slate-400" />
            <span class="font-medium text-slate-600 truncate max-w-[120px] sm:max-w-xs">{{ pageTitle }}</span>
            <template v-if="activeSection">
              <i class="pi pi-angle-right text-[10px] text-slate-400" />
              <span class="font-semibold text-slate-900 truncate max-w-[140px] sm:max-w-xs">
                {{ getSectionTitle(activeSection) }}
              </span>
            </template>
          </nav>
        </div>

        <!-- Center: Status & Dirty Badges -->
        <div class="flex items-center gap-2">
          <!-- Dirty indicator chip -->
          <span
            v-if="pageHasUnpublishedChanges || hasAnySectionDraftChanges"
            class="inline-flex items-center gap-1.5 rounded-full border border-amber-200 bg-amber-50 px-2.5 py-0.5 text-xs font-medium text-amber-800 shadow-2xs"
            title="There are unpublished changes staged in draft"
          >
            <span class="h-1.5 w-1.5 rounded-full bg-amber-500 animate-pulse" />
            Draft changes active
          </span>

          <!-- Autosave status indicator -->
          <div
            class="inline-flex items-center gap-1.5 rounded-md px-2 py-0.5 text-xs font-medium transition-colors"
            :class="{
              'text-blue-600 bg-blue-50': saveStatus === 'saving',
              'text-emerald-700 bg-emerald-50': saveStatus === 'saved',
              'text-amber-700 bg-amber-50': saveStatus === 'unsaved',
            }"
          >
            <i
              v-if="saveStatus === 'saving'"
              class="pi pi-spin pi-spinner text-xs"
            />
            <i
              v-else-if="saveStatus === 'saved'"
              class="pi pi-check text-xs"
            />
            <span
              v-else
              class="h-1.5 w-1.5 rounded-full bg-amber-500"
            />
            <span>{{ statusLabel }}</span>
          </div>
        </div>

        <!-- Right: Breakpoints & Action Controls -->
        <div class="flex items-center gap-2">
          <!-- Device Breakpoint Toggles -->
          <div
            class="hidden md:inline-flex items-center rounded-lg border border-slate-200 bg-slate-100 p-0.5 text-slate-600"
            role="group"
            aria-label="Responsive Device Preview"
          >
            <button
              type="button"
              class="inline-flex items-center gap-1 rounded-md px-2.5 py-1 text-xs font-medium transition"
              :class="activeBreakpoint === 'desktop' ? 'bg-white text-admin-primary shadow-2xs font-semibold' : 'hover:text-slate-900'"
              title="Desktop Breakpoint (100% / 1440px)"
              @click="activeBreakpoint = 'desktop'"
            >
              <i class="pi pi-desktop text-xs" />
              <span>Desktop</span>
            </button>
            <button
              type="button"
              class="inline-flex items-center gap-1 rounded-md px-2.5 py-1 text-xs font-medium transition"
              :class="activeBreakpoint === 'tablet' ? 'bg-white text-admin-primary shadow-2xs font-semibold' : 'hover:text-slate-900'"
              title="Tablet Breakpoint (768px)"
              @click="activeBreakpoint = 'tablet'"
            >
              <i class="pi pi-tablet text-xs" />
              <span>Tablet</span>
            </button>
            <button
              type="button"
              class="inline-flex items-center gap-1 rounded-md px-2.5 py-1 text-xs font-medium transition"
              :class="activeBreakpoint === 'mobile' ? 'bg-white text-admin-primary shadow-2xs font-semibold' : 'hover:text-slate-900'"
              title="Mobile Breakpoint (375px)"
              @click="activeBreakpoint = 'mobile'"
            >
              <i class="pi pi-mobile text-xs" />
              <span>Mobile</span>
            </button>
          </div>

          <!-- View Diff Button -->
          <button
            type="button"
            class="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-700 shadow-2xs transition hover:bg-slate-50 hover:text-slate-900 focus:outline-none focus:ring-2 focus:ring-admin-primary"
            title="Compare live published vs draft"
            @click="openDiffViewer"
          >
            <i class="pi pi-sliders-h text-xs text-slate-500" />
            <span class="hidden sm:inline">View Diff</span>
          </button>

          <!-- History Button -->
          <button
            type="button"
            class="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-700 shadow-2xs transition hover:bg-slate-50 hover:text-slate-900 focus:outline-none focus:ring-2 focus:ring-admin-primary"
            title="Version history and rollbacks"
            @click="versionDrawerOpen = true"
          >
            <i class="pi pi-history text-xs text-slate-500" />
            <span class="hidden sm:inline">History</span>
          </button>

          <!-- Manual Save Draft Button -->
          <button
            type="button"
            :disabled="saveStatus === 'saving' || !activeSection"
            class="inline-flex items-center gap-1.5 rounded-lg bg-admin-primary px-3.5 py-1.5 text-xs font-semibold text-white shadow-xs transition hover:bg-admin-primary-hover focus:outline-none focus:ring-2 focus:ring-admin-primary focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60"
            @click="handleManualSave"
          >
            <i
              :class="[
                'text-xs',
                saveStatus === 'saving' ? 'pi pi-spin pi-spinner' : 'pi pi-save',
              ]"
            />
            <span>Save Draft</span>
          </button>
        </div>
      </div>
    </header>

    <!-- WORKSPACE BODY (TWO-COLUMN WORK AREA) -->
    <div class="relative flex flex-1 flex-col overflow-hidden lg:flex-row">
      <!-- MOBILE / TABLET NAV TOGGLE STRIP -->
      <div class="flex items-center justify-between border-b border-slate-200 bg-white px-4 py-2 lg:hidden">
        <button
          type="button"
          class="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-semibold text-slate-700"
          @click="mobileSidebarOpen = !mobileSidebarOpen"
        >
          <i class="pi pi-list text-xs" />
          <span>Sections ({{ sections.length }})</span>
          <i
            :class="[
              'pi text-[10px] text-slate-400 transition-transform',
              mobileSidebarOpen ? 'pi-chevron-up' : 'pi-chevron-down',
            ]"
          />
        </button>

        <!-- Mobile View Mode Segmented Controls -->
        <div class="inline-flex rounded-lg border border-slate-200 bg-slate-100 p-0.5 text-xs">
          <button
            type="button"
            class="rounded-md px-2.5 py-1 font-medium transition"
            :class="viewMode === 'form' ? 'bg-white text-admin-primary shadow-2xs font-semibold' : 'text-slate-600'"
            @click="viewMode = 'form'"
          >
            <i class="pi pi-file-edit mr-1 text-[11px]" />
            Editor
          </button>
          <button
            type="button"
            class="rounded-md px-2.5 py-1 font-medium transition"
            :class="viewMode === 'preview' ? 'bg-white text-admin-primary shadow-2xs font-semibold' : 'text-slate-600'"
            @click="viewMode = 'preview'"
          >
            <i class="pi pi-eye mr-1 text-[11px]" />
            Preview
          </button>
        </div>
      </div>

      <!-- LEFT COLUMN: SECTIONS OUTLINE & NAVIGATOR -->
      <aside
        :class="[
          'z-10 flex flex-col border-r border-slate-200 bg-white shrink-0 transition-all duration-200',
          'lg:w-80 xl:w-88',
          mobileSidebarOpen ? 'block max-h-80 overflow-y-auto border-b lg:border-b-0' : 'hidden lg:flex',
        ]"
      >
        <!-- Sidebar Header -->
        <div class="flex items-center justify-between border-b border-slate-200 px-4 py-3 bg-slate-50/70">
          <div class="flex items-center gap-2">
            <i class="pi pi-th-large text-xs text-slate-500" />
            <h2 class="text-xs font-bold uppercase tracking-wider text-slate-600">
              Page Outline
            </h2>
          </div>
          <span class="rounded-full bg-slate-200 px-2 py-0.5 text-[11px] font-semibold text-slate-700">
            {{ sections.length }} {{ sections.length === 1 ? 'section' : 'sections' }}
          </span>
        </div>

        <!-- Sections List -->
        <div class="flex-1 overflow-y-auto p-2.5 space-y-1.5">
          <div
            v-if="loading && sections.length === 0"
            class="flex flex-col items-center justify-center py-12 text-slate-400"
          >
            <i class="pi pi-spin pi-spinner text-2xl text-admin-primary mb-2" />
            <span class="text-xs">Loading sections...</span>
          </div>

          <div
            v-for="(section, idx) in sections"
            :key="section.id"
            :draggable="true"
            @dragstart="onDragStart(idx, $event)"
            @dragover.prevent="onDragOver(idx)"
            @drop="onDrop(idx)"
            :class="[
              'group relative rounded-xl border p-3 transition-all cursor-pointer select-none',
              activeSectionId === section.id
                ? 'border-blue-500 bg-blue-50/40 ring-1 ring-blue-500/30 shadow-xs'
                : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50/60',
              !section.enabled && 'opacity-65',
              dragOverIndex === idx && 'border-dashed border-admin-primary bg-blue-50/60',
            ]"
            @click="selectSection(section.id)"
          >
            <!-- Card Top: Drag Handle + Reorder + Title + Dirty Dot -->
            <div class="flex items-start justify-between gap-2">
              <div class="flex items-center gap-2 min-w-0">
                <span
                  class="cursor-grab active:cursor-grabbing text-slate-400 hover:text-slate-600"
                  title="Drag to reorder"
                >
                  <i class="pi pi-bars text-xs" />
                </span>

                <div class="min-w-0">
                  <div class="flex items-center gap-1.5">
                    <h3 class="text-xs font-semibold text-slate-900 truncate">
                      {{ getSectionTitle(section) }}
                    </h3>
                    <!-- Dirty dot -->
                    <span
                      v-if="isSectionDirty(section)"
                      class="h-2 w-2 shrink-0 rounded-full bg-amber-500"
                      title="Section has uncommitted draft modifications"
                    />
                  </div>
                  <p class="text-[11px] font-mono text-slate-400 truncate">
                    #{{ section.sectionKey }}
                  </p>
                </div>
              </div>

              <!-- Reorder Buttons -->
              <div class="flex items-center gap-0.5 opacity-80 group-hover:opacity-100">
                <button
                  type="button"
                  :disabled="idx === 0 || reordering"
                  class="flex h-6 w-6 items-center justify-center rounded text-slate-400 hover:bg-slate-200/70 hover:text-slate-700 disabled:opacity-20 disabled:hover:bg-transparent"
                  title="Move section up"
                  @click.stop="moveSection(idx, 'up')"
                >
                  <i class="pi pi-chevron-up text-[10px]" />
                </button>
                <button
                  type="button"
                  :disabled="idx === sections.length - 1 || reordering"
                  class="flex h-6 w-6 items-center justify-center rounded text-slate-400 hover:bg-slate-200/70 hover:text-slate-700 disabled:opacity-20 disabled:hover:bg-transparent"
                  title="Move section down"
                  @click.stop="moveSection(idx, 'down')"
                >
                  <i class="pi pi-chevron-down text-[10px]" />
                </button>
              </div>
            </div>

            <!-- Card Bottom: Status Pill & Visibility Switch -->
            <div class="mt-2.5 flex items-center justify-between border-t border-slate-100 pt-2 text-[11px]">
              <span
                :class="[
                  'inline-flex items-center gap-1 rounded-full px-2 py-0.5 font-medium border text-[10px]',
                  section.enabled
                    ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                    : 'border-slate-200 bg-slate-100 text-slate-500',
                ]"
              >
                <span
                  class="h-1.5 w-1.5 rounded-full"
                  :class="section.enabled ? 'bg-emerald-500' : 'bg-slate-400'"
                />
                {{ section.enabled ? 'Enabled' : 'Hidden' }}
              </span>

              <label
                class="flex items-center gap-1.5 cursor-pointer text-slate-600 hover:text-slate-900"
                @click.stop
              >
                <input
                  type="checkbox"
                  :checked="section.enabled"
                  class="h-3.5 w-3.5 rounded border-slate-300 text-admin-primary focus:ring-admin-primary cursor-pointer"
                  @change="toggleSectionVisibility(section)"
                />
                <span class="text-[11px]">{{ section.enabled ? 'Visible' : 'Hide' }}</span>
              </label>
            </div>
          </div>
        </div>
      </aside>

      <!-- CENTER / RIGHT COLUMN: DYNAMIC INSPECTOR & LIVE PREVIEW -->
      <main class="flex flex-1 flex-col overflow-hidden bg-slate-50">
        <!-- Desktop View Mode Toolbar -->
        <div class="hidden lg:flex items-center justify-between border-b border-slate-200 bg-white px-6 py-2.5">
          <div class="flex items-center gap-2">
            <span class="text-xs font-semibold text-slate-700">Active Section:</span>
            <span
              v-if="activeSection"
              class="inline-flex items-center gap-1.5 rounded-md bg-slate-100 px-2 py-1 text-xs font-medium text-slate-800 border border-slate-200"
            >
              <i class="pi pi-folder text-admin-primary text-[11px]" />
              {{ getSectionTitle(activeSection) }}
            </span>
          </div>

          <!-- Segmented View Mode Tabs: Form Inspector | Split | Preview -->
          <div class="inline-flex items-center rounded-lg border border-slate-200 bg-slate-100 p-0.5 text-xs">
            <button
              type="button"
              class="inline-flex items-center gap-1.5 rounded-md px-3 py-1 font-medium transition"
              :class="viewMode === 'form' ? 'bg-white text-admin-primary shadow-2xs font-semibold' : 'text-slate-600 hover:text-slate-900'"
              @click="viewMode = 'form'"
            >
              <i class="pi pi-file-edit text-xs" />
              <span>Editor &amp; Form</span>
            </button>
            <button
              type="button"
              class="inline-flex items-center gap-1.5 rounded-md px-3 py-1 font-medium transition"
              :class="viewMode === 'split' ? 'bg-white text-admin-primary shadow-2xs font-semibold' : 'text-slate-600 hover:text-slate-900'"
              @click="viewMode = 'split'"
            >
              <i class="pi pi-pause text-xs" />
              <span>Split View</span>
            </button>
            <button
              type="button"
              class="inline-flex items-center gap-1.5 rounded-md px-3 py-1 font-medium transition"
              :class="viewMode === 'preview' ? 'bg-white text-admin-primary shadow-2xs font-semibold' : 'text-slate-600 hover:text-slate-900'"
              @click="viewMode = 'preview'"
            >
              <i class="pi pi-eye text-xs" />
              <span>Live Viewport Preview</span>
            </button>
          </div>
        </div>

        <!-- WORKSPACE CONTENT CONTAINER -->
        <div class="relative flex flex-1 overflow-hidden">
          <!-- FORM INSPECTOR PANEL -->
          <section
            v-show="viewMode === 'form' || viewMode === 'split'"
            :class="[
              'flex flex-col overflow-y-auto bg-white p-4 sm:p-6 transition-all',
              viewMode === 'split' ? 'w-full lg:w-1/2 xl:w-5/12 border-r border-slate-200' : 'w-full',
            ]"
          >
            <!-- Inspector Banner -->
            <div
              v-if="activeSection"
              class="mb-6 rounded-xl border border-slate-200 bg-slate-50/80 p-4"
            >
              <div class="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h3 class="text-sm font-bold text-slate-900 sm:text-base">
                    {{ getSectionTitle(activeSection) }}
                  </h3>
                  <p class="text-xs text-slate-500">
                    Section Key: <span class="font-mono font-medium text-slate-700">{{ activeSection.sectionKey }}</span>
                    • Sort Index: <span class="font-mono font-medium text-slate-700">{{ activeSection.sortOrder }}</span>
                  </p>
                </div>

                <div class="flex items-center gap-2">
                  <!-- Discard / Reset Button -->
                  <button
                    v-if="isSectionDirty(activeSection)"
                    type="button"
                    class="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-xs font-medium text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                    title="Revert draft changes to live published state"
                    @click="resetActiveSectionDraft"
                  >
                    <i class="pi pi-undo text-[10px]" />
                    <span>Reset Draft</span>
                  </button>

                  <!-- Visibility Switch -->
                  <label class="flex items-center gap-2 cursor-pointer rounded-lg border border-slate-200 bg-white px-3 py-1 text-xs font-medium text-slate-700">
                    <input
                      type="checkbox"
                      :checked="activeSection.enabled"
                      class="h-3.5 w-3.5 rounded border-slate-300 text-admin-primary focus:ring-admin-primary cursor-pointer"
                      @change="toggleSectionVisibility(activeSection)"
                    />
                    <span>{{ activeSection.enabled ? 'Enabled' : 'Hidden' }}</span>
                  </label>
                </div>
              </div>
            </div>

            <!-- Dynamic Form Generator -->
            <div v-if="activeSection" class="space-y-5">
              <div
                v-for="field in activeFormFields"
                :key="field.key"
                class="rounded-xl border border-slate-200/80 bg-white p-4 shadow-2xs transition hover:border-slate-300"
              >
                <!-- Field Label Header -->
                <div class="mb-2 flex items-center justify-between gap-2">
                  <label :for="`field-${field.key}`" class="block text-xs font-bold uppercase tracking-wider text-slate-700">
                    {{ field.label }}
                  </label>
                  <span class="font-mono text-[10px] text-slate-400">
                    {{ field.key }}
                  </span>
                </div>

                <!-- 1. IMAGE FIELD -->
                <div v-if="field.type === 'image'" class="space-y-3">
                  <div class="flex items-center gap-4">
                    <!-- Thumbnail Preview -->
                    <div
                      class="relative flex h-20 w-28 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-slate-200 bg-slate-100"
                    >
                      <img
                        v-if="field.value"
                        :src="field.value"
                        :alt="field.label"
                        class="h-full w-full object-cover"
                        @error="onImageError"
                      />
                      <div v-else class="flex flex-col items-center justify-center text-slate-400 p-2 text-center">
                        <i class="pi pi-image text-lg mb-1" />
                        <span class="text-[10px]">No Image</span>
                      </div>
                    </div>

                    <!-- Action buttons & info -->
                    <div class="flex flex-1 flex-col gap-2">
                      <div class="flex flex-wrap items-center gap-2">
                        <button
                          type="button"
                          class="inline-flex items-center gap-1.5 rounded-lg bg-blue-50 px-3 py-1.5 text-xs font-semibold text-admin-primary border border-blue-200 hover:bg-blue-100 focus:outline-none focus:ring-2 focus:ring-admin-primary"
                          @click="openImagePicker(activeSection.draftData, field.key)"
                        >
                          <i class="pi pi-images text-xs" />
                          <span>{{ field.value ? 'Change Image' : 'Select Image' }}</span>
                        </button>

                        <button
                          v-if="field.value"
                          type="button"
                          class="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-600 hover:bg-red-50 hover:text-red-600 hover:border-red-200"
                          title="Clear image URL"
                          @click="updateFormField(field.key, '')"
                        >
                          <i class="pi pi-times text-[10px]" />
                          <span>Clear</span>
                        </button>
                      </div>
                      <p class="text-[11px] text-slate-400">
                        Spacefurnio Media Library, Presets, or Direct URL
                      </p>
                    </div>
                  </div>

                  <!-- Direct URL input -->
                  <div>
                    <input
                      :id="`field-${field.key}`"
                      type="text"
                      :value="field.value || ''"
                      placeholder="https://..."
                      class="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs text-slate-800 placeholder-slate-400 focus:border-admin-primary focus:outline-none focus:ring-1 focus:ring-admin-primary"
                      @input="onFieldInput(field.key, ($event.target as HTMLInputElement).value)"
                    />
                  </div>
                </div>

                <!-- 2. MULTILINE / TEXTAREA FIELD -->
                <div v-else-if="field.type === 'textarea'" class="space-y-1.5">
                  <textarea
                    :id="`field-${field.key}`"
                    :value="field.value || ''"
                    rows="4"
                    class="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs leading-relaxed text-slate-800 placeholder-slate-400 focus:border-admin-primary focus:outline-none focus:ring-1 focus:ring-admin-primary"
                    placeholder="Enter content..."
                    @input="onFieldInput(field.key, ($event.target as HTMLTextAreaElement).value)"
                  />
                  <div class="flex items-center justify-between text-[11px] text-slate-400">
                    <span>Markdown/Paragraph supported</span>
                    <span>{{ (field.value || '').length }} characters</span>
                  </div>
                </div>

                <!-- 3. ARRAYS OF OBJECTS (e.g. Pillars, Social Links) -->
                <div v-else-if="field.type === 'array_objects'" class="space-y-3">
                  <div class="flex items-center justify-between border-b border-slate-100 pb-2">
                    <span class="text-xs font-semibold text-slate-600">
                      {{ (field.value || []).length }} Items
                    </span>
                    <button
                      type="button"
                      class="inline-flex items-center gap-1 rounded-md bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-200 focus:outline-none"
                      @click="addArrayObjectItem(field.key)"
                    >
                      <i class="pi pi-plus text-[10px]" />
                      <span>Add Item</span>
                    </button>
                  </div>

                  <div class="space-y-2.5">
                    <div
                      v-for="(item, itemIdx) in (field.value || [])"
                      :key="itemIdx"
                      class="rounded-lg border border-slate-200 bg-slate-50/60 p-3"
                    >
                      <div class="mb-2 flex items-center justify-between border-b border-slate-200/60 pb-1.5">
                        <span class="rounded bg-slate-200 px-1.5 py-0.5 text-[10px] font-bold text-slate-700">
                          #{{ itemIdx + 1 }}
                        </span>
                        <div class="flex items-center gap-1">
                          <button
                            type="button"
                            :disabled="itemIdx === 0"
                            class="flex h-5 w-5 items-center justify-center rounded text-slate-400 hover:bg-slate-200 hover:text-slate-700 disabled:opacity-20"
                            title="Move item up"
                            @click="moveArrayItem(field.key, itemIdx, 'up')"
                          >
                            <i class="pi pi-chevron-up text-[10px]" />
                          </button>
                          <button
                            type="button"
                            :disabled="itemIdx === (field.value || []).length - 1"
                            class="flex h-5 w-5 items-center justify-center rounded text-slate-400 hover:bg-slate-200 hover:text-slate-700 disabled:opacity-20"
                            title="Move item down"
                            @click="moveArrayItem(field.key, itemIdx, 'down')"
                          >
                            <i class="pi pi-chevron-down text-[10px]" />
                          </button>
                          <button
                            type="button"
                            class="flex h-5 w-5 items-center justify-center rounded text-slate-400 hover:bg-red-100 hover:text-red-600"
                            title="Delete item"
                            @click="removeArrayItem(field.key, itemIdx)"
                          >
                            <i class="pi pi-trash text-[10px]" />
                          </button>
                        </div>
                      </div>

                      <!-- Sub fields for each key in object -->
                      <div class="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
                        <div
                          v-for="(propVal, propKey) in item"
                          :key="String(propKey)"
                          :class="isSubFieldMultiline(String(propKey), propVal) ? 'sm:col-span-2' : ''"
                        >
                          <label class="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">
                            {{ formatFieldLabel(String(propKey)) }}
                          </label>

                          <!-- Sub field image -->
                          <div v-if="isImageKey(String(propKey))" class="flex items-center gap-2">
                            <input
                              type="text"
                              :value="propVal || ''"
                              placeholder="Image URL"
                              class="w-full rounded border border-slate-300 px-2 py-1 text-xs text-slate-800 focus:border-admin-primary focus:outline-none"
                              @input="onSubFieldInput(field.key, itemIdx, String(propKey), ($event.target as HTMLInputElement).value)"
                            />
                            <button
                              type="button"
                              class="rounded bg-blue-50 px-2 py-1 text-xs font-semibold text-admin-primary border border-blue-200 shrink-0"
                              @click="openImagePicker(item, String(propKey))"
                            >
                              Browse
                            </button>
                          </div>

                          <!-- Sub field textarea -->
                          <textarea
                            v-else-if="isSubFieldMultiline(String(propKey), propVal)"
                            :value="propVal || ''"
                            rows="2"
                            class="w-full rounded border border-slate-300 px-2 py-1 text-xs leading-normal text-slate-800 focus:border-admin-primary focus:outline-none"
                            @input="onSubFieldInput(field.key, itemIdx, String(propKey), ($event.target as HTMLTextAreaElement).value)"
                          />

                          <!-- Sub field text input -->
                          <input
                            v-else
                            type="text"
                            :value="propVal || ''"
                            class="w-full rounded border border-slate-300 px-2 py-1 text-xs text-slate-800 focus:border-admin-primary focus:outline-none"
                            @input="onSubFieldInput(field.key, itemIdx, String(propKey), ($event.target as HTMLInputElement).value)"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <!-- 4. BOOLEAN FIELD -->
                <div v-else-if="field.type === 'boolean'" class="flex items-center gap-3">
                  <label class="flex items-center gap-2 cursor-pointer">
                    <input
                      :id="`field-${field.key}`"
                      type="checkbox"
                      :checked="Boolean(field.value)"
                      class="h-4 w-4 rounded border-slate-300 text-admin-primary focus:ring-admin-primary cursor-pointer"
                      @change="onFieldInput(field.key, ($event.target as HTMLInputElement).checked)"
                    />
                    <span class="text-xs text-slate-700">{{ field.value ? 'Active / Yes' : 'Inactive / No' }}</span>
                  </label>
                </div>

                <!-- 5. NUMBER FIELD -->
                <div v-else-if="field.type === 'number'" class="space-y-1">
                  <input
                    :id="`field-${field.key}`"
                    type="number"
                    :value="field.value"
                    class="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs text-slate-800 focus:border-admin-primary focus:outline-none focus:ring-1 focus:ring-admin-primary"
                    @input="onFieldInput(field.key, Number(($event.target as HTMLInputElement).value))"
                  />
                </div>

                <!-- 6. STANDARD STRING / TEXT FIELD -->
                <div v-else class="space-y-1">
                  <input
                    :id="`field-${field.key}`"
                    type="text"
                    :value="field.value || ''"
                    class="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs text-slate-800 focus:border-admin-primary focus:outline-none focus:ring-1 focus:ring-admin-primary"
                    placeholder="Enter text..."
                    @input="onFieldInput(field.key, ($event.target as HTMLInputElement).value)"
                  />
                  <div class="flex justify-end text-[11px] text-slate-400">
                    <span>{{ (field.value || '').length }} characters</span>
                  </div>
                </div>
              </div>
            </div>

            <!-- Empty State for Section with no fields -->
            <div
              v-else
              class="flex flex-col items-center justify-center py-20 text-center text-slate-400"
            >
              <i class="pi pi-folder-open text-3xl mb-2" />
              <p class="text-xs font-semibold">Select a section to inspect and edit its draft content.</p>
            </div>
          </section>

          <!-- LIVE VIEWPORT PREVIEW PANEL -->
          <section
            v-show="viewMode === 'preview' || viewMode === 'split'"
            :class="[
              'flex flex-col overflow-y-auto bg-slate-900/95 p-3 sm:p-6 lg:p-8 transition-all items-center',
              viewMode === 'split' ? 'w-full lg:w-1/2 xl:w-7/12' : 'w-full',
            ]"
          >
            <!-- Device Specs Bar -->
            <div class="mb-4 flex items-center justify-between gap-3 w-full max-w-5xl text-xs text-slate-400">
              <div class="flex items-center gap-2">
                <span class="inline-flex h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                <span class="font-mono text-slate-300">Live Simulation: {{ activeBreakpoint.toUpperCase() }}</span>
                <span>({{ breakpointWidthLabel }})</span>
              </div>

              <!-- Quick Device switcher inside preview -->
              <div class="flex items-center gap-1 rounded bg-slate-800/80 p-0.5 border border-slate-700/50">
                <button
                  type="button"
                  class="rounded p-1 text-slate-400 hover:text-white"
                  :class="activeBreakpoint === 'desktop' && 'bg-slate-700 text-white'"
                  title="Desktop (100%)"
                  @click="activeBreakpoint = 'desktop'"
                >
                  <i class="pi pi-desktop text-xs" />
                </button>
                <button
                  type="button"
                  class="rounded p-1 text-slate-400 hover:text-white"
                  :class="activeBreakpoint === 'tablet' && 'bg-slate-700 text-white'"
                  title="Tablet (768px)"
                  @click="activeBreakpoint = 'tablet'"
                >
                  <i class="pi pi-tablet text-xs" />
                </button>
                <button
                  type="button"
                  class="rounded p-1 text-slate-400 hover:text-white"
                  :class="activeBreakpoint === 'mobile' && 'bg-slate-700 text-white'"
                  title="Mobile (375px)"
                  @click="activeBreakpoint = 'mobile'"
                >
                  <i class="pi pi-mobile text-xs" />
                </button>
              </div>
            </div>

            <!-- SIMULATED DEVICE FRAME -->
            <div
              :class="[
                'w-full transition-all duration-300 ease-out origin-top',
                activeBreakpoint === 'mobile' && 'max-w-[375px] rounded-[38px] p-3 border-4 border-slate-800 shadow-2xl bg-slate-950',
                activeBreakpoint === 'tablet' && 'max-w-[768px] rounded-[28px] p-4 border-4 border-slate-800 shadow-2xl bg-slate-950',
                activeBreakpoint === 'desktop' && 'max-w-5xl rounded-xl border border-slate-800 shadow-2xl bg-slate-950 overflow-hidden',
              ]"
            >
              <!-- Mobile Notch Simulator -->
              <div
                v-if="activeBreakpoint === 'mobile'"
                class="mx-auto mb-2 h-4 w-32 rounded-full bg-slate-800"
              />

              <!-- Desktop Browser Bar Simulator -->
              <div
                v-if="activeBreakpoint === 'desktop'"
                class="flex items-center justify-between border-b border-white/10 bg-black/40 px-4 py-2.5 text-xs text-slate-400"
              >
                <div class="flex items-center gap-1.5">
                  <span class="h-2.5 w-2.5 rounded-full bg-rose-500/80" />
                  <span class="h-2.5 w-2.5 rounded-full bg-amber-500/80" />
                  <span class="h-2.5 w-2.5 rounded-full bg-emerald-500/80" />
                </div>
                <div class="rounded-md bg-white/5 px-4 py-1 font-mono text-[11px] text-slate-300 border border-white/10">
                  https://spacefurnio.com/{{ pageSlug === 'home' ? '' : pageSlug }}
                </div>
                <div class="text-[10px] text-slate-500 font-medium uppercase tracking-wider">
                  Draft Preview
                </div>
              </div>

              <!-- PREVIEW CANVAS (SPACEFURNIO DARK LUXURY AESTHETIC) -->
              <div class="min-h-[520px] bg-[#0c0c0e] text-[#f4f4f5] font-sans antialiased selection:bg-[#c5a880] selection:text-black">
                <!-- Global Brand Header Simulation -->
                <header class="border-b border-white/10 px-6 py-4 flex items-center justify-between bg-black/60 backdrop-blur-sm sticky top-0 z-10">
                  <div class="flex items-center gap-3">
                    <span class="font-serif text-lg tracking-[0.2em] font-light text-[#f4f4f5] uppercase">
                      Spacefurnio
                    </span>
                  </div>
                  <nav class="hidden sm:flex items-center gap-5 text-xs uppercase tracking-widest text-slate-400">
                    <span :class="pageSlug === 'home' ? 'text-[#c5a880] font-semibold' : ''">Home</span>
                    <span :class="pageSlug === 'about' ? 'text-[#c5a880] font-semibold' : ''">About</span>
                    <span :class="pageSlug === 'collabs' ? 'text-[#c5a880] font-semibold' : ''">Collabs</span>
                    <span :class="pageSlug === 'portfolio' ? 'text-[#c5a880] font-semibold' : ''">Portfolio</span>
                    <span :class="pageSlug === 'contact' ? 'text-[#c5a880] font-semibold' : ''">Contact</span>
                  </nav>
                  <div class="flex items-center gap-3 text-slate-400 text-xs">
                    <i class="pi pi-search text-xs cursor-pointer hover:text-white" />
                    <i class="pi pi-shopping-bag text-xs cursor-pointer hover:text-white" />
                  </div>
                </header>

                <!-- SECTION RENDERERS -->
                <div class="space-y-1">
                  <div
                    v-for="sec in sections"
                    :key="sec.id"
                    :class="[
                      'relative transition-all cursor-pointer group',
                      activeSectionId === sec.id
                        ? 'ring-2 ring-[#c5a880] bg-[#16161a]'
                        : 'hover:bg-white/[0.02]',
                      !sec.enabled && 'opacity-40 grayscale',
                    ]"
                    @click="selectSection(sec.id)"
                  >
                    <!-- Active Section Overlay Pill in Preview -->
                    <div
                      v-if="activeSectionId === sec.id"
                      class="absolute top-2 right-2 z-20 rounded bg-[#c5a880] px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-black shadow-lg"
                    >
                      Editing in Inspector
                    </div>

                    <!-- Hidden Section Banner -->
                    <div
                      v-if="!sec.enabled"
                      class="absolute top-2 left-2 z-20 rounded bg-red-900/80 border border-red-500/50 px-2 py-0.5 text-[9px] font-semibold uppercase text-red-200"
                    >
                      Hidden on Live Site
                    </div>

                    <!-- RENDERER BY PAGE & SECTION -->

                    <!-- 1. HOME: HERO -->
                    <div
                      v-if="pageSlug === 'home' && sec.sectionKey === 'hero'"
                      class="px-6 py-16 sm:py-24 text-center border-b border-white/5 relative overflow-hidden"
                    >
                      <div class="mx-auto max-w-3xl">
                        <span
                          v-if="sec.draftData.coming_soon_badge"
                          class="inline-block mb-4 rounded-full border border-[#c5a880]/30 bg-[#c5a880]/10 px-3.5 py-1 text-[11px] font-medium tracking-widest uppercase text-[#c5a880]"
                        >
                          {{ sec.draftData.coming_soon_badge }}
                        </span>

                        <h1 class="font-serif text-3xl sm:text-5xl md:text-6xl font-light tracking-tight text-white mb-4">
                          {{ sec.draftData.brand_name || 'Spacefurnio' }}
                        </h1>

                        <p
                          v-if="sec.draftData.tagline"
                          class="text-sm sm:text-base font-light italic text-[#c5a880] tracking-wider mb-8"
                        >
                          {{ sec.draftData.tagline }}
                        </p>

                        <div class="space-y-1 mb-8 text-xs sm:text-sm text-slate-300 font-light">
                          <p v-if="sec.draftData.cta_line_1">{{ sec.draftData.cta_line_1 }}</p>
                          <p v-if="sec.draftData.cta_line_2" class="text-slate-400">{{ sec.draftData.cta_line_2 }}</p>
                        </div>

                        <div v-if="sec.draftData.grab_now_button">
                          <button
                            type="button"
                            class="inline-block rounded-none border border-[#c5a880] bg-[#c5a880] px-6 py-2.5 text-xs font-semibold uppercase tracking-widest text-black hover:bg-white hover:border-white transition-colors"
                          >
                            {{ sec.draftData.grab_now_button }}
                          </button>
                        </div>
                      </div>
                    </div>

                    <!-- 2. HOME: PRODUCTS -->
                    <div
                      v-else-if="pageSlug === 'home' && sec.sectionKey === 'products'"
                      class="px-6 py-12 sm:py-16 border-b border-white/5"
                    >
                      <div class="mx-auto max-w-4xl">
                        <div class="flex items-center justify-between mb-8">
                          <h2 class="font-serif text-xl sm:text-2xl font-light tracking-wide text-white">
                            {{ sec.draftData.section_heading || 'Featured Pieces' }}
                          </h2>
                          <span class="text-xs uppercase tracking-widest text-[#c5a880] cursor-pointer hover:underline">
                            {{ sec.draftData.section_button || 'View All' }}
                          </span>
                        </div>

                        <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
                          <div class="rounded-lg bg-white/5 border border-white/10 p-3 space-y-2">
                            <div class="h-32 rounded bg-neutral-800 flex items-center justify-center text-slate-600 text-xs">
                              [Architectural Credenza]
                            </div>
                            <div class="text-xs font-medium text-white">Walnut Credenza</div>
                            <div class="text-[11px] text-[#c5a880]">₹ 74,500</div>
                          </div>
                          <div class="rounded-lg bg-white/5 border border-white/10 p-3 space-y-2">
                            <div class="h-32 rounded bg-neutral-800 flex items-center justify-center text-slate-600 text-xs">
                              [Boucle Lounge Chair]
                            </div>
                            <div class="text-xs font-medium text-white">Lounge Chair</div>
                            <div class="text-[11px] text-[#c5a880]">₹ 42,000</div>
                          </div>
                          <div class="rounded-lg bg-white/5 border border-white/10 p-3 space-y-2">
                            <div class="h-32 rounded bg-neutral-800 flex items-center justify-center text-slate-600 text-xs">
                              [Monolithic Table]
                            </div>
                            <div class="text-xs font-medium text-white">Marble Coffee Table</div>
                            <div class="text-[11px] text-[#c5a880]">₹ 58,900</div>
                          </div>
                        </div>
                      </div>
                    </div>

                    <!-- 3. HOME: SCROLL TEXT -->
                    <div
                      v-else-if="pageSlug === 'home' && sec.sectionKey === 'scroll'"
                      class="px-4 py-8 bg-[#121216] border-b border-white/5 text-center overflow-hidden"
                    >
                      <div class="space-y-2">
                        <div class="font-serif text-base sm:text-xl font-light tracking-wider text-slate-200">
                          {{ sec.draftData.scroll_text_1 || 'Transforming spaces with bespoke craftsmanship' }}
                        </div>
                        <div class="text-xs uppercase tracking-widest text-[#c5a880]">
                          {{ sec.draftData.scroll_text_2 || 'Where architectural elegance meets timeless living' }}
                        </div>
                      </div>
                    </div>

                    <!-- 4. ABOUT: INTRO -->
                    <div
                      v-else-if="pageSlug === 'about' && sec.sectionKey === 'intro'"
                      class="px-6 py-14 sm:py-20 text-center border-b border-white/5"
                    >
                      <div class="mx-auto max-w-2xl">
                        <h1 class="font-serif text-2xl sm:text-4xl font-light text-white mb-6 leading-tight">
                          {{ sec.draftData.headline || 'About Spacefurnio' }}
                        </h1>
                        <p class="text-xs sm:text-sm text-slate-300 leading-relaxed font-light">
                          {{ sec.draftData.paragraph }}
                        </p>
                      </div>
                    </div>

                    <!-- 5. ABOUT: STORY & PILLARS -->
                    <div
                      v-else-if="pageSlug === 'about' && sec.sectionKey === 'story'"
                      class="px-6 py-12 sm:py-16 border-b border-white/5"
                    >
                      <div class="mx-auto max-w-3xl space-y-10">
                        <blockquote
                          v-if="sec.draftData.quote"
                          class="border-l-2 border-[#c5a880] pl-6 font-serif text-sm sm:text-base italic text-slate-200 leading-relaxed"
                        >
                          "{{ sec.draftData.quote }}"
                        </blockquote>

                        <div
                          v-if="Array.isArray(sec.draftData.pillars) && sec.draftData.pillars.length"
                          class="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4"
                        >
                          <div
                            v-for="(pillar, pIdx) in sec.draftData.pillars"
                            :key="pIdx"
                            class="rounded-lg border border-white/10 bg-white/[0.02] p-4 space-y-2"
                          >
                            <span class="text-xs font-mono text-[#c5a880]">0{{ pIdx + 1 }}.</span>
                            <h3 class="text-xs font-bold uppercase tracking-wider text-white">
                              {{ pillar.title }}
                            </h3>
                            <p class="text-[11px] text-slate-400 leading-normal">
                              {{ pillar.desc }}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>

                    <!-- 6. COLLABS: MAIN -->
                    <div
                      v-else-if="pageSlug === 'collabs' && sec.sectionKey === 'main'"
                      class="px-6 py-14 sm:py-20 text-center border-b border-white/5"
                    >
                      <div class="mx-auto max-w-2xl space-y-6">
                        <h1 class="font-serif text-2xl sm:text-4xl font-light text-white">
                          {{ sec.draftData.headline || 'SF × Collabs' }}
                        </h1>
                        <p v-if="sec.draftData.quote" class="font-serif text-sm sm:text-base italic text-slate-300 leading-relaxed">
                          "{{ sec.draftData.quote }}"
                        </p>
                        <div
                          v-if="sec.draftData.curated_note"
                          class="inline-block rounded-lg border border-[#c5a880]/30 bg-[#c5a880]/5 px-4 py-3 text-xs text-[#c5a880]"
                        >
                          {{ sec.draftData.curated_note }}
                        </div>
                      </div>
                    </div>

                    <!-- 7. PORTFOLIO: MAIN -->
                    <div
                      v-else-if="pageSlug === 'portfolio' && sec.sectionKey === 'main'"
                      class="px-6 py-14 sm:py-20 border-b border-white/5"
                    >
                      <div class="mx-auto max-w-3xl text-center space-y-6">
                        <h1 class="font-serif text-2xl sm:text-4xl font-light text-white">
                          {{ sec.draftData.headline || 'Portfolio' }}
                        </h1>
                        <p class="text-xs sm:text-sm text-slate-300 max-w-xl mx-auto leading-relaxed">
                          {{ sec.draftData.description }}
                        </p>
                        <div v-if="sec.draftData.cta_text">
                          <button
                            type="button"
                            class="inline-block rounded-none border border-[#c5a880] px-6 py-2.5 text-xs font-semibold uppercase tracking-widest text-[#c5a880] hover:bg-[#c5a880] hover:text-black transition-colors"
                          >
                            {{ sec.draftData.cta_text }}
                          </button>
                        </div>
                      </div>
                    </div>

                    <!-- 8. CONTACT: DETAILS -->
                    <div
                      v-else-if="pageSlug === 'contact' && sec.sectionKey === 'details'"
                      class="px-6 py-12 sm:py-16 border-b border-white/5"
                    >
                      <div class="mx-auto max-w-3xl grid grid-cols-1 sm:grid-cols-2 gap-8">
                        <div class="space-y-4 text-xs">
                          <h2 class="font-serif text-lg font-light text-white">Studio Address</h2>
                          <p class="text-slate-300 leading-relaxed">
                            {{ sec.draftData.office_address }}
                          </p>
                          <div class="space-y-1 text-slate-400">
                            <p><span class="text-white font-medium">Phone:</span> {{ sec.draftData.phone }}</p>
                            <p><span class="text-white font-medium">Email:</span> {{ sec.draftData.email }}</p>
                          </div>
                        </div>

                        <div class="space-y-4 text-xs">
                          <h2 class="font-serif text-lg font-light text-white">Operating Hours</h2>
                          <p class="text-slate-300 leading-relaxed">
                            {{ sec.draftData.operating_hours }}
                          </p>
                          <div
                            v-if="sec.draftData.response_time"
                            class="rounded border border-white/10 bg-white/5 p-3 text-[11px] text-[#c5a880]"
                          >
                            {{ sec.draftData.response_time }}
                          </div>
                        </div>
                      </div>
                    </div>

                    <!-- 9. FOOTER: DETAILS / FOOTER_INFO -->
                    <div
                      v-else-if="pageSlug === 'footer' || sec.sectionKey === 'footer_info'"
                      class="px-6 py-12 bg-black text-xs text-slate-400 border-t border-white/10"
                    >
                      <div class="mx-auto max-w-4xl space-y-8">
                        <div class="grid grid-cols-1 sm:grid-cols-2 gap-6">
                          <div>
                            <span class="font-serif text-base tracking-widest font-light text-white uppercase block mb-2">
                              Spacefurnio
                            </span>
                            <p class="text-slate-400 text-[11px] leading-relaxed max-w-sm">
                              {{ sec.draftData.brand_statement }}
                            </p>
                          </div>

                          <div class="space-y-1 text-[11px]">
                            <p v-if="sec.draftData.address">{{ sec.draftData.address }}</p>
                            <p v-if="sec.draftData.phone">{{ sec.draftData.phone }}</p>
                            <p v-if="sec.draftData.email" class="text-[#c5a880]">{{ sec.draftData.email }}</p>
                          </div>
                        </div>

                        <!-- Social Links -->
                        <div
                          v-if="Array.isArray(sec.draftData.social_links) && sec.draftData.social_links.length"
                          class="flex flex-wrap items-center gap-3 pt-4 border-t border-white/5"
                        >
                          <span
                            v-for="(soc, sIdx) in sec.draftData.social_links"
                            :key="sIdx"
                            class="rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-[10px] text-slate-300 uppercase tracking-wider"
                          >
                            {{ soc.name || soc.label }}
                          </span>
                        </div>

                        <div class="pt-4 text-center sm:text-left text-[10px] text-slate-600">
                          {{ sec.draftData.copyright || '© 2026 Spacefurnio – All rights reserved.' }}
                        </div>
                      </div>
                    </div>

                    <!-- 10. GENERIC FALLBACK SECTION RENDERER -->
                    <div
                      v-else
                      class="px-6 py-10 border-b border-white/5"
                    >
                      <div class="mx-auto max-w-3xl space-y-4">
                        <div class="flex items-center justify-between">
                          <h2 class="font-serif text-lg font-light text-white">
                            {{ getSectionTitle(sec) }}
                          </h2>
                          <span class="font-mono text-[10px] text-slate-500">#{{ sec.sectionKey }}</span>
                        </div>

                        <div class="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                          <div
                            v-for="(val, k) in sec.draftData"
                            :key="String(k)"
                            class="rounded border border-white/10 bg-white/[0.02] p-3 space-y-1"
                          >
                            <span class="text-[10px] uppercase font-bold text-[#c5a880] tracking-wider block">
                              {{ formatFieldLabel(String(k)) }}
                            </span>
                            <img
                              v-if="isImageKey(String(k)) && typeof val === 'string' && val"
                              :src="val"
                              alt="Section asset"
                              class="h-20 w-full object-cover rounded mt-1"
                            />
                            <p v-else class="text-slate-300 truncate">
                              {{ typeof val === 'object' ? JSON.stringify(val) : String(val) }}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>
        </div>
      </main>
    </div>

    <!-- INTEGRATED MODALS & DRAWERS -->

    <!-- Image Picker Modal -->
    <AdminCmsImagePicker
      v-model="imagePickerOpen"
      :current-image="activePickerCurrentUrl"
      @select="onImageSelected"
    />

    <!-- Diff Viewer Modal -->
    <AdminCmsDiffViewer
      v-model:visible="diffViewerOpen"
      :title="diffPayload.title"
      :subtitle="diffPayload.subtitle"
      :published-data="diffPayload.published"
      :draft-data="diffPayload.draft"
    />

    <!-- Version Drawer -->
    <AdminCmsVersionDrawer
      v-model:visible="versionDrawerOpen"
      :scope="pageSlug"
      :entity-id="activeSection?.id"
      :title="`${pageTitle} Version History`"
      @restored="onVersionRestored"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, onBeforeUnmount } from 'vue'
import { useToast } from 'primevue/usetoast'
import Toast from 'primevue/toast'
import adminApi from '@/admin/api/adminApi'
import AdminCmsImagePicker from '@/admin/components/cms/AdminCmsImagePicker.vue'
import AdminCmsDiffViewer from '@/admin/components/cms/AdminCmsDiffViewer.vue'
import AdminCmsVersionDrawer from '@/admin/components/cms/AdminCmsVersionDrawer.vue'
import type { CmsVersion } from '@/admin/types/admin'

// ─── Interfaces ─────────────────────────────────────────────────────────────
export interface SectionItem {
  id: string
  pageSlug: string
  sectionKey: string
  sortOrder: number
  enabled: boolean
  draftData: Record<string, unknown>
  publishedData: Record<string, unknown>
  updatedAt?: string
}

export interface FormField {
  key: string
  label: string
  type: 'image' | 'textarea' | 'text' | 'number' | 'boolean' | 'array_objects' | 'array_strings' | 'json'
  value: unknown
}

// ─── Props & Emits ──────────────────────────────────────────────────────────
const props = defineProps<{
  pageSlug: string
  pageTitle: string
}>()

const emit = defineEmits<{
  (e: 'back'): void
  (e: 'updated'): void
}>()

const toast = useToast()

// ─── Core State ─────────────────────────────────────────────────────────────
const loading = ref(false)
const sections = ref<SectionItem[]>([])
const activeSectionId = ref<string>('')
const pageHasUnpublishedChanges = ref(false)
const saveStatus = ref<'saved' | 'saving' | 'unsaved'>('saved')
const reordering = ref(false)

// ─── Viewport & Layout State ────────────────────────────────────────────────
const activeBreakpoint = ref<'desktop' | 'tablet' | 'mobile'>('desktop')
const viewMode = ref<'form' | 'preview' | 'split'>('form')
const mobileSidebarOpen = ref(false)

// ─── Drag and Drop State ────────────────────────────────────────────────────
const dragSourceIndex = ref<number | null>(null)
const dragOverIndex = ref<number | null>(null)

// ─── Integrated Component Dialog States ─────────────────────────────────────
const imagePickerOpen = ref(false)
const activePickerTarget = ref<{ object: Record<string, unknown>; key: string } | null>(null)
const activePickerCurrentUrl = ref<string>('')

const diffViewerOpen = ref(false)
const versionDrawerOpen = ref(false)

// ─── Autosave Timer ─────────────────────────────────────────────────────────
let autosaveTimeout: ReturnType<typeof setTimeout> | null = null

// ─── Computed Getters ───────────────────────────────────────────────────────
const activeSection = computed(() => {
  return sections.value.find((s) => s.id === activeSectionId.value) || sections.value[0] || null
})

const statusLabel = computed(() => {
  if (saveStatus.value === 'saving') return 'Saving...'
  if (saveStatus.value === 'unsaved') return 'Unsaved changes'
  return 'Saved'
})

const breakpointWidthLabel = computed(() => {
  if (activeBreakpoint.value === 'tablet') return '768px'
  if (activeBreakpoint.value === 'mobile') return '375px'
  return '100% / 1440px'
})

const hasAnySectionDraftChanges = computed(() => {
  return sections.value.some((s) => isSectionDirty(s))
})

// ─── Form Fields Extraction ─────────────────────────────────────────────────
const activeFormFields = computed<FormField[]>(() => {
  if (!activeSection.value || !activeSection.value.draftData) return []
  const data = activeSection.value.draftData
  return Object.keys(data).map((key) => {
    const val = data[key]
    return {
      key,
      label: formatFieldLabel(key),
      type: classifyField(key, val),
      value: val,
    }
  })
})

// ─── Diff Payload Construction ──────────────────────────────────────────────
const diffPayload = computed(() => {
  if (activeSection.value) {
    return {
      title: `Diff: ${getSectionTitle(activeSection.value)}`,
      subtitle: `Comparing published vs draft for section "${activeSection.value.sectionKey}"`,
      published: activeSection.value.publishedData || {},
      draft: activeSection.value.draftData || {},
    }
  }
  const publishedCombined: Record<string, unknown> = {}
  const draftCombined: Record<string, unknown> = {}
  for (const s of sections.value) {
    publishedCombined[s.sectionKey] = s.publishedData || {}
    draftCombined[s.sectionKey] = s.draftData || {}
  }
  return {
    title: `Diff: ${props.pageTitle}`,
    subtitle: `Comparing published vs draft for entire page "${props.pageSlug}"`,
    published: publishedCombined,
    draft: draftCombined,
  }
})

// ─── Field Classification Helpers ───────────────────────────────────────────
function classifyField(key: string, val: unknown): FormField['type'] {
  if (typeof val === 'boolean') return 'boolean'
  if (typeof val === 'number') return 'number'
  if (Array.isArray(val)) {
    if (val.length === 0 || (typeof val[0] === 'object' && val[0] !== null)) {
      return 'array_objects'
    }
    return 'array_strings'
  }
  if (typeof val === 'string' || val === null || val === undefined) {
    if (isImageKey(key)) return 'image'
    if (isMultilineKey(key, String(val || ''))) return 'textarea'
    return 'text'
  }
  return 'json'
}

function isImageKey(key: string): boolean {
  return /(image|img|src|banner|photo|logo|_image|avatar|thumbnail)/i.test(key)
}

function isMultilineKey(key: string, val: string): boolean {
  if (/(quote|paragraph|desc|description|address|statement|note|hours|message|details|body)/i.test(key)) {
    return true
  }
  return val.length > 70 || val.includes('\n')
}

function isSubFieldMultiline(key: string, val: unknown): boolean {
  if (typeof val !== 'string') return false
  return isMultilineKey(key, val)
}

function formatFieldLabel(key: string): string {
  return key
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .replace(/[_-]+/g, ' ')
    .split(' ')
    .map((w) => {
      const lower = w.toLowerCase()
      if (['cta', 'url', 'seo', 'id', 'sf', 'voc'].includes(lower)) return lower.toUpperCase()
      return w.charAt(0).toUpperCase() + w.slice(1)
    })
    .join(' ')
}

function getSectionTitle(section: SectionItem): string {
  const key = (section.sectionKey || '').toLowerCase()
  const page = (section.pageSlug || '').toLowerCase()
  if (page === 'home') {
    if (key === 'hero') return 'Hero Section'
    if (key === 'products') return 'Featured Pieces'
    if (key === 'scroll') return 'Scroll Text & Marquee'
  }
  if (page === 'about') {
    if (key === 'intro') return 'Intro Headline & Mission'
    if (key === 'story') return 'Brand Story & Pillars'
  }
  if (page === 'collabs') {
    if (key === 'main') return 'Collabs Narrative & Dialogue'
  }
  if (page === 'portfolio') {
    if (key === 'main') return 'Curated Portfolio Showcase'
  }
  if (page === 'contact') {
    if (key === 'details') return 'Studio Details & Operating Hours'
  }
  if (page === 'footer') {
    if (key === 'footer_info' || key === 'details') return 'Global Brand Info & Socials'
  }
  return formatFieldLabel(section.sectionKey || 'Section')
}

function isSectionDirty(section: SectionItem): boolean {
  if (!section) return false
  return JSON.stringify(section.draftData || {}) !== JSON.stringify(section.publishedData || {})
}

// ─── Data Fetching ──────────────────────────────────────────────────────────
async function fetchPageData(): Promise<void> {
  loading.value = true
  try {
    const res = await adminApi.get<{
      hasUnpublishedChanges?: boolean
      has_unpublished_changes?: boolean
      sections?: Array<Record<string, unknown>>
    }>(`/api/admin/cms/pages/${props.pageSlug}`)
    if (res) {
      pageHasUnpublishedChanges.value = Boolean(res.hasUnpublishedChanges ?? res.has_unpublished_changes)
      const rawSections = res.sections || []
      sections.value = rawSections.map((r: Record<string, unknown>) => ({
        id: String(r.id),
        pageSlug: String(r.pageSlug || r.page_slug || props.pageSlug),
        sectionKey: String(r.sectionKey || r.section_key),
        sortOrder: Number(r.sortOrder ?? r.sort_order ?? 0),
        enabled: r.enabled !== false,
        draftData: JSON.parse(JSON.stringify(r.draftData || r.draft_data || {})),
        publishedData: JSON.parse(JSON.stringify(r.publishedData || r.published_data || {})),
        updatedAt: r.updatedAt ? String(r.updatedAt) : r.updated_at ? String(r.updated_at) : undefined,
      }))
      sections.value.sort((a, b) => a.sortOrder - b.sortOrder)

      if (!activeSectionId.value && sections.value.length > 0) {
        activeSectionId.value = sections.value[0].id
      } else if (activeSectionId.value && !sections.value.some((s) => s.id === activeSectionId.value)) {
        activeSectionId.value = sections.value[0]?.id || ''
      }
    }
  } catch (err: unknown) {
    const error = err as Error
    toast.add({
      severity: 'error',
      summary: 'Failed to load page',
      detail: error?.message || 'Could not fetch CMS page sections.',
      life: 4000,
    })
  } finally {
    loading.value = false
  }
}

// ─── Autosave & Section Persistence ─────────────────────────────────────────
function triggerDraftChange(): void {
  saveStatus.value = 'unsaved'
  if (autosaveTimeout) {
    clearTimeout(autosaveTimeout)
  }
  autosaveTimeout = setTimeout(() => {
    if (activeSection.value) {
      persistSection(activeSection.value, false)
    }
  }, 1200)
}

async function persistSection(section: SectionItem, isManual = false, summary = 'Updated section draft'): Promise<void> {
  if (!section) return
  saveStatus.value = 'saving'
  try {
    await adminApi.put(`/api/admin/cms/pages/${props.pageSlug}/sections/${section.id}`, {
      draftData: section.draftData,
      enabled: section.enabled,
      changeSummary: summary,
    })
    saveStatus.value = 'saved'
    pageHasUnpublishedChanges.value = true
    emit('updated')
    if (isManual) {
      toast.add({
        severity: 'success',
        summary: 'Draft Saved',
        detail: `Changes to "${getSectionTitle(section)}" saved.`,
        life: 2500,
      })
    }
  } catch (err: unknown) {
    const error = err as Error
    saveStatus.value = 'unsaved'
    toast.add({
      severity: 'error',
      summary: 'Save Failed',
      detail: error?.message || 'Failed to save section changes.',
      life: 4000,
    })
  }
}

function handleManualSave(): void {
  if (autosaveTimeout) {
    clearTimeout(autosaveTimeout)
    autosaveTimeout = null
  }
  if (activeSection.value) {
    persistSection(activeSection.value, true)
  }
}

async function toggleSectionVisibility(section: SectionItem): Promise<void> {
  section.enabled = !section.enabled
  if (autosaveTimeout) {
    clearTimeout(autosaveTimeout)
    autosaveTimeout = null
  }
  await persistSection(
    section,
    true,
    section.enabled ? `Enabled section ${section.sectionKey}` : `Disabled section ${section.sectionKey}`,
  )
}

function resetActiveSectionDraft(): void {
  if (!activeSection.value) return
  activeSection.value.draftData = JSON.parse(JSON.stringify(activeSection.value.publishedData || {}))
  handleManualSave()
  toast.add({
    severity: 'info',
    summary: 'Draft Reset',
    detail: 'Restored section draft to published version.',
    life: 2000,
  })
}

// ─── Section Selection & Navigation ─────────────────────────────────────────
function selectSection(id: string): void {
  if (activeSectionId.value !== id) {
    if (autosaveTimeout && activeSection.value) {
      clearTimeout(autosaveTimeout)
      autosaveTimeout = null
      persistSection(activeSection.value, false)
    }
    activeSectionId.value = id
  }
  mobileSidebarOpen.value = false
}

function handleBack(): void {
  if (autosaveTimeout && activeSection.value) {
    clearTimeout(autosaveTimeout)
    persistSection(activeSection.value, false)
  }
  emit('back')
}

// ─── Form Input Handlers ────────────────────────────────────────────────────
function onFieldInput(key: string, value: unknown): void {
  if (!activeSection.value) return
  activeSection.value.draftData[key] = value
  triggerDraftChange()
}

function updateFormField(key: string, value: unknown): void {
  if (!activeSection.value) return
  activeSection.value.draftData[key] = value
  triggerDraftChange()
}

function onSubFieldInput(arrayKey: string, index: number, propKey: string, value: unknown): void {
  if (!activeSection.value) return
  const arr = activeSection.value.draftData[arrayKey]
  if (Array.isArray(arr) && arr[index] && typeof arr[index] === 'object') {
    (arr[index] as Record<string, unknown>)[propKey] = value
    triggerDraftChange()
  }
}

function addArrayObjectItem(arrayKey: string): void {
  if (!activeSection.value) return
  const arr = activeSection.value.draftData[arrayKey]
  if (!Array.isArray(arr)) {
    activeSection.value.draftData[arrayKey] = []
  }
  const currentArray = activeSection.value.draftData[arrayKey] as Array<Record<string, unknown>>
  // Infer schema from existing items or defaults
  let template: Record<string, unknown> = {}
  if (currentArray.length > 0 && typeof currentArray[0] === 'object') {
    for (const k of Object.keys(currentArray[0])) {
      template[k] = ''
    }
  } else if (arrayKey === 'pillars') {
    template = { title: 'New Pillar', desc: '' }
  } else if (arrayKey === 'social_links') {
    template = { name: 'link', url: 'https://', label: 'Follow us' }
  } else {
    template = { title: '', desc: '' }
  }

  currentArray.push(template)
  triggerDraftChange()
}

function removeArrayItem(arrayKey: string, index: number): void {
  if (!activeSection.value) return
  const arr = activeSection.value.draftData[arrayKey]
  if (Array.isArray(arr)) {
    arr.splice(index, 1)
    triggerDraftChange()
  }
}

function moveArrayItem(arrayKey: string, index: number, direction: 'up' | 'down'): void {
  if (!activeSection.value) return
  const arr = activeSection.value.draftData[arrayKey]
  if (!Array.isArray(arr)) return
  const targetIdx = direction === 'up' ? index - 1 : index + 1
  if (targetIdx < 0 || targetIdx >= arr.length) return
  const temp = arr[index]
  arr[index] = arr[targetIdx]
  arr[targetIdx] = temp
  triggerDraftChange()
}

// ─── Image Picker Handlers ──────────────────────────────────────────────────
function openImagePicker(targetObj: Record<string, unknown>, key: string): void {
  activePickerTarget.value = { object: targetObj, key }
  activePickerCurrentUrl.value = String(targetObj[key] || '')
  imagePickerOpen.value = true
}

function onImageSelected(payload: { url: string; alt?: string }): void {
  if (activePickerTarget.value) {
    activePickerTarget.value.object[activePickerTarget.value.key] = payload.url
    triggerDraftChange()
  }
  imagePickerOpen.value = false
}

function onImageError(event: Event): void {
  const el = event.target as HTMLImageElement
  if (el) {
    el.style.display = 'none'
  }
}

// ─── Reordering Sections ────────────────────────────────────────────────────
async function moveSection(index: number, direction: 'up' | 'down'): Promise<void> {
  const targetIndex = direction === 'up' ? index - 1 : index + 1
  if (targetIndex < 0 || targetIndex >= sections.value.length) return

  reordering.value = true
  const temp = sections.value[index]
  sections.value[index] = sections.value[targetIndex]
  sections.value[targetIndex] = temp

  sections.value.forEach((s, idx) => {
    s.sortOrder = idx
  })

  try {
    await adminApi.post(`/api/admin/cms/pages/${props.pageSlug}/sections/reorder`, {
      orders: sections.value.map((s) => ({
        id: s.id,
        sortOrder: s.sortOrder,
      })),
    })
    toast.add({
      severity: 'success',
      summary: 'Order Updated',
      detail: 'Sections order saved successfully.',
      life: 2000,
    })
    emit('updated')
  } catch (err: unknown) {
    const error = err as Error
    toast.add({
      severity: 'error',
      summary: 'Reorder Failed',
      detail: error?.message || 'Could not save new section order.',
      life: 4000,
    })
    await fetchPageData()
  } finally {
    reordering.value = false
  }
}

function onDragStart(index: number, event: DragEvent): void {
  dragSourceIndex.value = index
  if (event.dataTransfer) {
    event.dataTransfer.effectAllowed = 'move'
    event.dataTransfer.setData('text/plain', String(index))
  }
}

function onDragOver(index: number): void {
  dragOverIndex.value = index
}

async function onDrop(targetIndex: number): Promise<void> {
  if (dragSourceIndex.value === null || dragSourceIndex.value === targetIndex) {
    dragSourceIndex.value = null
    dragOverIndex.value = null
    return
  }

  const sourceIndex = dragSourceIndex.value
  dragSourceIndex.value = null
  dragOverIndex.value = null

  const movedItem = sections.value.splice(sourceIndex, 1)[0]
  sections.value.splice(targetIndex, 0, movedItem)

  sections.value.forEach((s, idx) => {
    s.sortOrder = idx
  })

  reordering.value = true
  try {
    await adminApi.post(`/api/admin/cms/pages/${props.pageSlug}/sections/reorder`, {
      orders: sections.value.map((s) => ({
        id: s.id,
        sortOrder: s.sortOrder,
      })),
    })
    toast.add({
      severity: 'success',
      summary: 'Order Saved',
      detail: 'Sections reordered successfully.',
      life: 2000,
    })
    emit('updated')
  } catch (err: unknown) {
    const error = err as Error
    toast.add({
      severity: 'error',
      summary: 'Reorder Failed',
      detail: error?.message || 'Could not save new section order.',
      life: 4000,
    })
    await fetchPageData()
  } finally {
    reordering.value = false
  }
}

// ─── Diff & Version Drawer Handlers ─────────────────────────────────────────
function openDiffViewer(): void {
  diffViewerOpen.value = true
}

function onVersionRestored(version: CmsVersion): void {
  toast.add({
    severity: 'success',
    summary: 'Version Restored',
    detail: `Restored snapshot #${version.version_num ?? version.versionNum ?? version.id}.`,
    life: 3000,
  })
  fetchPageData()
  emit('updated')
}

// ─── Lifecycle ──────────────────────────────────────────────────────────────
watch(
  () => props.pageSlug,
  () => {
    fetchPageData()
  },
)

onMounted(() => {
  fetchPageData()
})

onBeforeUnmount(() => {
  if (autosaveTimeout && activeSection.value) {
    clearTimeout(autosaveTimeout)
    persistSection(activeSection.value, false)
  }
})
</script>

<style scoped>
/* Scoped luxury preview enhancements */
.scrollbar-none {
  scrollbar-width: none;
  -ms-overflow-style: none;
}
.scrollbar-none::-webkit-scrollbar {
  display: none;
}
</style>
