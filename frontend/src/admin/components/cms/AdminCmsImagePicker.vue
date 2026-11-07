<template>
  <Teleport to="body">
    <Transition name="picker-fade">
      <div
        v-if="modelValue"
        class="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-2 sm:p-4 md:p-6 backdrop-blur-xs"
        role="dialog"
        aria-modal="true"
        aria-labelledby="image-picker-title"
        @keydown.esc="closeModal"
        @mousedown.self="closeModal"
      >
        <div
          class="flex flex-col w-full max-w-4xl h-[94vh] sm:h-[88vh] rounded-2xl bg-white shadow-2xl border border-slate-200 overflow-hidden"
          role="document"
        >
          <!-- HEADER -->
          <div class="flex items-center justify-between border-b border-slate-200 px-4 sm:px-6 py-3.5 bg-slate-50/70 shrink-0">
            <div class="flex items-center gap-3 min-w-0">
              <div class="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-blue-600 border border-blue-100">
                <i class="pi pi-image text-base" aria-hidden="true" />
              </div>
              <div class="min-w-0">
                <h2 id="image-picker-title" class="text-base sm:text-lg font-semibold text-slate-900 truncate">
                  Select Image
                </h2>
                <p class="text-xs text-slate-500 truncate hidden sm:block">
                  Spacefurnio Media Library, Architectural Presets, and Custom Uploads
                </p>
              </div>
            </div>

            <!-- Current Image Indicator + Close Button -->
            <div class="flex items-center gap-2 sm:gap-3 shrink-0">
              <div
                v-if="currentImage"
                class="hidden sm:flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-xs text-slate-600 shadow-2xs"
                title="Current assigned image"
              >
                <img
                  :src="currentImage"
                  :alt="currentAlt || 'Current image'"
                  class="h-5 w-5 rounded object-cover border border-slate-200"
                  @error="onThumbError"
                />
                <span class="font-medium text-slate-700 truncate max-w-[120px]">Current Asset</span>
              </div>

              <button
                type="button"
                aria-label="Close image picker dialog"
                class="flex h-9 w-9 items-center justify-center rounded-lg text-slate-400 transition hover:bg-slate-200/70 hover:text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[44px] min-w-[44px]"
                @click="closeModal"
              >
                <i class="pi pi-times text-sm" aria-hidden="true" />
              </button>
            </div>
          </div>

          <!-- TAB SEGMENTED BAR -->
          <div class="border-b border-slate-200 px-4 sm:px-6 pt-2.5 pb-2 bg-white shrink-0">
            <div
              class="flex items-center gap-1.5 sm:gap-2 overflow-x-auto scrollbar-none py-0.5"
              role="tablist"
              aria-label="Image picker tabs"
            >
              <button
                id="tab-media-btn"
                type="button"
                role="tab"
                :aria-selected="activeTab === 'media'"
                aria-controls="tab-media-panel"
                :class="[
                  'inline-flex items-center gap-2 rounded-lg px-3.5 py-2 text-xs sm:text-sm font-medium transition-colors shrink-0 min-h-[40px]',
                  activeTab === 'media'
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200 hover:text-slate-900',
                ]"
                @click="activeTab = 'media'"
              >
                <i class="pi pi-images text-xs" aria-hidden="true" />
                <span>Media Library</span>
                <span
                  v-if="libraryTotal > 0"
                  :class="[
                    'rounded-full px-1.5 py-0.5 text-[10px] font-semibold',
                    activeTab === 'media' ? 'bg-blue-700 text-white' : 'bg-slate-200 text-slate-700',
                  ]"
                >
                  {{ libraryTotal }}
                </span>
              </button>

              <button
                id="tab-curated-btn"
                type="button"
                role="tab"
                :aria-selected="activeTab === 'curated'"
                aria-controls="tab-curated-panel"
                :class="[
                  'inline-flex items-center gap-2 rounded-lg px-3.5 py-2 text-xs sm:text-sm font-medium transition-colors shrink-0 min-h-[40px]',
                  activeTab === 'curated'
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200 hover:text-slate-900',
                ]"
                @click="activeTab = 'curated'"
              >
                <i class="pi pi-compass text-xs" aria-hidden="true" />
                <span>Architectural &amp; Design</span>
                <span
                  class="rounded-full px-1.5 py-0.5 text-[10px] font-semibold"
                  :class="activeTab === 'curated' ? 'bg-blue-700 text-white' : 'bg-slate-200 text-slate-700'"
                >
                  {{ CURATED_IMAGES.length }}
                </span>
              </button>

              <button
                id="tab-upload-btn"
                type="button"
                role="tab"
                :aria-selected="activeTab === 'upload'"
                aria-controls="tab-upload-panel"
                :class="[
                  'inline-flex items-center gap-2 rounded-lg px-3.5 py-2 text-xs sm:text-sm font-medium transition-colors shrink-0 min-h-[40px]',
                  activeTab === 'upload'
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200 hover:text-slate-900',
                ]"
                @click="activeTab = 'upload'"
              >
                <i class="pi pi-cloud-upload text-xs" aria-hidden="true" />
                <span>Upload &amp; Direct URL</span>
              </button>
            </div>
          </div>

          <!-- TAB BODY CONTENT (Scrollable Area) -->
          <div class="flex-1 overflow-y-auto p-4 sm:p-6 bg-slate-50/50">
            <!-- ════════════════════════════════════════════════════════════════ -->
            <!-- TAB 1: MEDIA LIBRARY (SPACEFURNIO ASSETS)                       -->
            <!-- ════════════════════════════════════════════════════════════════ -->
            <div
              v-show="activeTab === 'media'"
              id="tab-media-panel"
              role="tabpanel"
              aria-labelledby="tab-media-btn"
              class="space-y-4"
            >
              <!-- Search & Quick Filters Bar -->
              <div class="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white p-3 rounded-xl border border-slate-200 shadow-2xs">
                <div class="relative flex-1">
                  <i class="pi pi-search pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-sm text-slate-400" aria-hidden="true" />
                  <input
                    v-model="librarySearch"
                    type="text"
                    role="searchbox"
                    placeholder="Search catalog media by product name or keyword..."
                    aria-label="Search catalog media"
                    class="w-full rounded-lg border border-slate-200 bg-white py-2 pr-9 pl-9 text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    @input="onLibrarySearchInput"
                  />
                  <button
                    v-if="librarySearch"
                    type="button"
                    aria-label="Clear media search"
                    class="absolute top-1/2 right-2.5 -translate-y-1/2 rounded p-1 text-slate-400 hover:text-slate-600 focus:outline-none"
                    @click="clearLibrarySearch"
                  >
                    <i class="pi pi-times text-xs" aria-hidden="true" />
                  </button>
                </div>

                <div class="flex items-center justify-between sm:justify-end gap-2 shrink-0 text-xs text-slate-500">
                  <span v-if="!libraryLoading">
                    {{ libraryTotal }} asset{{ libraryTotal === 1 ? '' : 's' }}
                  </span>
                  <button
                    type="button"
                    title="Refresh media library"
                    class="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 focus:ring-2 focus:ring-blue-500 focus:outline-none min-h-[36px]"
                    @click="fetchLibraryImages"
                  >
                    <i :class="['pi pi-refresh text-xs', libraryLoading ? 'pi-spin' : '']" aria-hidden="true" />
                    <span class="hidden sm:inline">Refresh</span>
                  </button>
                </div>
              </div>

              <!-- Loading Skeleton -->
              <div
                v-if="libraryLoading"
                class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3"
              >
                <div
                  v-for="n in 12"
                  :key="n"
                  class="flex flex-col rounded-xl border border-slate-200 bg-white p-2 shadow-2xs overflow-hidden"
                >
                  <div class="h-28 w-full animate-pulse rounded-lg bg-slate-100" />
                  <div class="mt-2 space-y-1.5">
                    <div class="h-3 w-3/4 animate-pulse rounded bg-slate-100" />
                    <div class="h-2.5 w-1/2 animate-pulse rounded bg-slate-100" />
                  </div>
                </div>
              </div>

              <!-- Error State -->
              <div
                v-else-if="libraryError"
                class="rounded-xl border border-red-200 bg-white p-8 text-center shadow-2xs"
              >
                <i class="pi pi-exclamation-triangle text-3xl text-red-500" aria-hidden="true" />
                <h3 class="mt-2 text-sm font-semibold text-slate-900">Failed to load media assets</h3>
                <p class="mt-1 text-xs text-slate-500">{{ libraryError }}</p>
                <button
                  type="button"
                  class="mt-4 inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-xs font-medium text-white transition hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  @click="fetchLibraryImages"
                >
                  <i class="pi pi-refresh text-xs" aria-hidden="true" />
                  <span>Try Again</span>
                </button>
              </div>

              <!-- Empty State -->
              <div
                v-else-if="libraryImages.length === 0"
                class="rounded-xl border border-slate-200 bg-white p-10 text-center shadow-2xs"
              >
                <i class="pi pi-images text-4xl text-slate-300" aria-hidden="true" />
                <h3 class="mt-3 text-sm font-semibold text-slate-900">No media assets found</h3>
                <p class="mt-1 text-xs text-slate-500 max-w-sm mx-auto">
                  {{ librarySearch ? 'No images match your search criteria. Try a different query or explore the Architectural tab.' : 'No catalog media assets are available at this time.' }}
                </p>
                <button
                  v-if="librarySearch"
                  type="button"
                  class="mt-4 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50"
                  @click="clearLibrarySearch"
                >
                  Clear search
                </button>
              </div>

              <!-- Media Grid -->
              <div v-else class="space-y-4">
                <div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
                  <button
                    v-for="img in libraryImages"
                    :key="img.id"
                    type="button"
                    :aria-label="`Select image: ${img.product_name || img.alt || 'Catalog asset'}`"
                    :class="[
                      'group relative flex flex-col overflow-hidden rounded-xl border text-left transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-blue-500',
                      selectedUrl === img.src
                        ? 'border-blue-600 ring-2 ring-blue-600 bg-blue-50/20 shadow-md'
                        : 'border-slate-200 bg-white hover:border-slate-300 hover:shadow-xs',
                    ]"
                    @click="chooseImage(img.src, img.alt || img.product_name || '', 'Media Library')"
                  >
                    <!-- Thumbnail Container -->
                    <div class="relative h-28 w-full overflow-hidden bg-slate-100 flex items-center justify-center">
                      <img
                        v-if="!brokenImages.has(img.id)"
                        :src="img.src"
                        :alt="img.alt || img.product_name || 'Catalog product image'"
                        loading="lazy"
                        class="h-full w-full object-cover transition-transform duration-200 group-hover:scale-105"
                        @error="handleImageError(img.id)"
                      />
                      <div v-else class="flex flex-col items-center justify-center p-2 text-center text-slate-400">
                        <i class="pi pi-image text-xl text-slate-300" aria-hidden="true" />
                        <span class="mt-0.5 text-[10px]">Unavailable</span>
                      </div>

                      <!-- Selection Check Badge -->
                      <div
                        v-if="selectedUrl === img.src"
                        class="absolute top-1.5 right-1.5 flex h-6 w-6 items-center justify-center rounded-full bg-blue-600 text-white shadow-md ring-2 ring-white"
                      >
                        <i class="pi pi-check text-[11px] font-bold" aria-hidden="true" />
                      </div>

                      <!-- Select Overlay Badge on Hover -->
                      <div
                        v-else
                        class="absolute inset-0 bg-slate-900/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
                      >
                        <span class="rounded-md bg-white/95 px-2 py-1 text-[11px] font-semibold text-slate-800 shadow-xs">
                          Select
                        </span>
                      </div>

                      <!-- Primary Badge -->
                      <span
                        v-if="img.is_primary"
                        class="absolute bottom-1.5 left-1.5 rounded bg-emerald-600/90 px-1.5 py-0.5 text-[9px] font-semibold text-white tracking-wide uppercase"
                      >
                        Primary
                      </span>
                    </div>

                    <!-- Label Card -->
                    <div class="p-2 min-w-0">
                      <p class="truncate text-xs font-medium text-slate-800" :title="img.product_name || img.alt || 'Catalog asset'">
                        {{ img.product_name || img.alt || `Product #${img.product_id}` }}
                      </p>
                      <p class="mt-0.5 truncate text-[10px] text-slate-400 font-mono" :title="img.src">
                        {{ formatFileName(img.src) }}
                      </p>
                    </div>
                  </button>
                </div>

                <!-- Pagination Bar -->
                <div class="flex flex-wrap items-center justify-between gap-3 border-t border-slate-200 bg-white px-3 py-2.5 rounded-xl shadow-2xs">
                  <span class="text-xs text-slate-600">
                    Showing <span class="font-medium text-slate-800">{{ libraryRangeStart }}–{{ libraryRangeEnd }}</span> of <span class="font-medium text-slate-800">{{ libraryTotal }}</span>
                  </span>

                  <div class="flex items-center gap-1.5">
                    <button
                      type="button"
                      :disabled="libraryPage <= 1"
                      aria-label="Previous page"
                      class="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-700 transition hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed focus:ring-2 focus:ring-blue-500 focus:outline-none"
                      @click="goToLibraryPage(libraryPage - 1)"
                    >
                      <i class="pi pi-chevron-left text-xs" aria-hidden="true" />
                    </button>

                    <span class="px-2 text-xs font-medium text-slate-700">
                      Page {{ libraryPage }} of {{ libraryTotalPages }}
                    </span>

                    <button
                      type="button"
                      :disabled="libraryPage >= libraryTotalPages"
                      aria-label="Next page"
                      class="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-700 transition hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed focus:ring-2 focus:ring-blue-500 focus:outline-none"
                      @click="goToLibraryPage(libraryPage + 1)"
                    >
                      <i class="pi pi-chevron-right text-xs" aria-hidden="true" />
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <!-- ════════════════════════════════════════════════════════════════ -->
            <!-- TAB 2: ARCHITECTURAL & DESIGN SEARCH                           -->
            <!-- ════════════════════════════════════════════════════════════════ -->
            <div
              v-show="activeTab === 'curated'"
              id="tab-curated-panel"
              role="tabpanel"
              aria-labelledby="tab-curated-btn"
              class="space-y-4"
            >
              <!-- Search & Collection Filters Strip -->
              <div class="space-y-3 bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs">
                <!-- Search bar -->
                <div class="relative">
                  <i class="pi pi-search pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-sm text-slate-400" aria-hidden="true" />
                  <input
                    v-model="curatedSearch"
                    type="text"
                    role="searchbox"
                    placeholder="Search architectural imagery (e.g., minimalist hardwood, joinery, marble, bouclé)..."
                    aria-label="Search architectural imagery"
                    class="w-full rounded-lg border border-slate-200 bg-white py-2 pr-9 pl-9 text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                  <button
                    v-if="curatedSearch"
                    type="button"
                    aria-label="Clear architectural search"
                    class="absolute top-1/2 right-2.5 -translate-y-1/2 rounded p-1 text-slate-400 hover:text-slate-600 focus:outline-none"
                    @click="curatedSearch = ''"
                  >
                    <i class="pi pi-times text-xs" aria-hidden="true" />
                  </button>
                </div>

                <!-- Collection Filter Pills -->
                <div class="flex items-center gap-1.5 overflow-x-auto scrollbar-none pb-0.5">
                  <button
                    v-for="collection in CURATED_COLLECTIONS"
                    :key="collection"
                    type="button"
                    :class="[
                      'rounded-full px-3 py-1 text-xs font-medium transition-colors shrink-0 min-h-[30px]',
                      selectedCollection === collection
                        ? 'bg-slate-900 text-white shadow-2xs'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200 hover:text-slate-900',
                    ]"
                    @click="selectedCollection = collection"
                  >
                    {{ collection }}
                  </button>
                </div>
              </div>

              <!-- Curated Grid -->
              <div
                v-if="filteredCuratedImages.length === 0"
                class="rounded-xl border border-slate-200 bg-white p-10 text-center shadow-2xs"
              >
                <i class="pi pi-compass text-4xl text-slate-300" aria-hidden="true" />
                <h3 class="mt-3 text-sm font-semibold text-slate-900">No architectural photos match</h3>
                <p class="mt-1 text-xs text-slate-500">
                  Try clearing your search query or picking another collection pill.
                </p>
                <button
                  type="button"
                  class="mt-4 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50"
                  @click="resetCuratedFilters"
                >
                  Reset filters
                </button>
              </div>

              <div v-else class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3.5">
                <button
                  v-for="item in filteredCuratedImages"
                  :key="item.id"
                  type="button"
                  :aria-label="`Select curated photo: ${item.title}`"
                  :class="[
                    'group relative flex flex-col overflow-hidden rounded-xl border text-left transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-blue-500',
                    selectedUrl === item.url
                      ? 'border-blue-600 ring-2 ring-blue-600 bg-blue-50/20 shadow-md'
                      : 'border-slate-200 bg-white hover:border-slate-300 hover:shadow-xs',
                  ]"
                  @click="chooseCurated(item)"
                >
                  <!-- Image thumbnail -->
                  <div class="relative h-40 w-full overflow-hidden bg-slate-100">
                    <img
                      :src="item.url"
                      :alt="item.alt"
                      loading="lazy"
                      class="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                    />

                    <!-- Resolution badge -->
                    <span class="absolute top-2 left-2 rounded-md bg-slate-900/80 px-1.5 py-0.5 text-[10px] font-medium text-white backdrop-blur-xs">
                      {{ item.resolution }}
                    </span>

                    <!-- Category badge -->
                    <span class="absolute bottom-2 left-2 rounded-md bg-white/90 px-1.5 py-0.5 text-[10px] font-medium text-slate-800 shadow-2xs">
                      {{ item.category }}
                    </span>

                    <!-- Selection check badge -->
                    <div
                      v-if="selectedUrl === item.url"
                      class="absolute top-2 right-2 flex h-6 w-6 items-center justify-center rounded-full bg-blue-600 text-white shadow-md ring-2 ring-white"
                    >
                      <i class="pi pi-check text-[11px] font-bold" aria-hidden="true" />
                    </div>

                    <!-- 1-Click Select overlay -->
                    <div
                      v-else
                      class="absolute inset-0 bg-slate-900/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
                    >
                      <span class="rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white shadow-md">
                        1-Click Select
                      </span>
                    </div>
                  </div>

                  <!-- Details footer -->
                  <div class="p-2.5">
                    <p class="truncate text-xs font-semibold text-slate-800" :title="item.title">
                      {{ item.title }}
                    </p>
                    <p class="mt-0.5 text-[10px] text-slate-500 truncate">
                      Photo by <span class="font-medium text-slate-700">{{ item.photographer }}</span> &middot; {{ item.source }}
                    </p>
                  </div>
                </button>
              </div>
            </div>

            <!-- ════════════════════════════════════════════════════════════════ -->
            <!-- TAB 3: UPLOAD & DIRECT URL                                     -->
            <!-- ════════════════════════════════════════════════════════════════ -->
            <div
              v-show="activeTab === 'upload'"
              id="tab-upload-panel"
              role="tabpanel"
              aria-labelledby="tab-upload-btn"
              class="space-y-6"
            >
              <!-- Section A: Drag & Drop Upload Zone -->
              <div class="space-y-2">
                <div class="flex items-center justify-between">
                  <h3 class="text-xs sm:text-sm font-semibold text-slate-900 uppercase tracking-wider">
                    Local File Upload
                  </h3>
                  <span class="text-[11px] text-slate-500">
                    JPG, PNG, WebP, SVG, AVIF (Up to 10MB)
                  </span>
                </div>

                <!-- Dropzone Box -->
                <div
                  :class="[
                    'relative flex flex-col items-center justify-center rounded-2xl border-2 border-dashed p-6 sm:p-8 text-center transition-all cursor-pointer',
                    isDragging
                      ? 'border-blue-500 bg-blue-50/70 ring-4 ring-blue-100'
                      : 'border-slate-300 bg-white hover:border-slate-400 hover:bg-slate-50/50',
                  ]"
                  @dragover.prevent="isDragging = true"
                  @dragleave.prevent="isDragging = false"
                  @drop.prevent="handleFileDrop"
                  @click="triggerFileInput"
                >
                  <input
                    ref="fileInputRef"
                    type="file"
                    class="hidden"
                    accept="image/jpeg,image/png,image/webp,image/svg+xml,image/avif"
                    @change="handleFileInputChange"
                  />

                  <div class="flex h-12 w-12 items-center justify-center rounded-full bg-blue-50 text-blue-600 mb-3 border border-blue-100">
                    <i class="pi pi-upload text-xl" aria-hidden="true" />
                  </div>

                  <p class="text-sm font-semibold text-slate-800">
                    Drag and drop your image here, or <span class="text-blue-600 hover:underline">browse files</span>
                  </p>
                  <p class="mt-1 text-xs text-slate-500">
                    High-resolution imagery will be inspected for dimensions and ready to apply
                  </p>

                  <!-- Uploaded File Preview Strip -->
                  <div
                    v-if="uploadedFile"
                    class="mt-4 w-full max-w-md rounded-xl border border-emerald-200 bg-emerald-50/60 p-3 text-left shadow-2xs"
                    @click.stop
                  >
                    <div class="flex items-center gap-3">
                      <img
                        :src="uploadedFile.dataUrl"
                        alt="Uploaded preview"
                        class="h-12 w-12 rounded-lg object-cover border border-emerald-200 shrink-0 bg-white"
                      />
                      <div class="min-w-0 flex-1">
                        <p class="text-xs font-semibold text-slate-900 truncate" :title="uploadedFile.name">
                          {{ uploadedFile.name }}
                        </p>
                        <p class="text-[11px] text-slate-600">
                          {{ formatFileSize(uploadedFile.size) }} &middot;
                          <span v-if="uploadedFile.width">{{ uploadedFile.width }} &times; {{ uploadedFile.height }} px</span>
                        </p>
                      </div>
                      <span class="rounded-full bg-emerald-600 px-2 py-0.5 text-[10px] font-semibold text-white">
                        Ready
                      </span>
                    </div>
                  </div>

                  <!-- Upload Error -->
                  <p v-if="uploadError" class="mt-3 text-xs text-red-600 flex items-center gap-1 font-medium">
                    <i class="pi pi-exclamation-circle" aria-hidden="true" />
                    <span>{{ uploadError }}</span>
                  </p>
                </div>
              </div>

              <!-- Section B: Direct Image URL -->
              <div class="space-y-3">
                <div class="flex items-center justify-between">
                  <h3 class="text-xs sm:text-sm font-semibold text-slate-900 uppercase tracking-wider">
                    Direct Image URL
                  </h3>
                  <span class="text-[11px] text-slate-500">Paste any HTTPS image address</span>
                </div>

                <div class="rounded-2xl border border-slate-200 bg-white p-4 sm:p-5 shadow-2xs space-y-4">
                  <div class="flex flex-col sm:flex-row gap-2">
                    <div class="relative flex-1">
                      <input
                        v-model="directUrlInput"
                        type="url"
                        placeholder="https://images.unsplash.com/photo-..."
                        aria-label="Direct image URL"
                        class="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:outline-none min-h-[42px]"
                        @keydown.enter.prevent="testDirectUrl"
                      />
                    </div>
                    <button
                      type="button"
                      :disabled="!directUrlInput.trim() || directUrlLoading"
                      class="inline-flex items-center justify-center gap-2 rounded-lg bg-slate-900 px-4 py-2 text-xs sm:text-sm font-medium text-white transition hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed min-h-[42px]"
                      @click="testDirectUrl"
                    >
                      <i :class="['pi text-xs', directUrlLoading ? 'pi-spin pi-spinner' : 'pi-bolt']" aria-hidden="true" />
                      <span>Test &amp; Preview</span>
                    </button>
                  </div>

                  <!-- URL Error message -->
                  <div
                    v-if="directUrlError"
                    class="rounded-lg border border-red-200 bg-red-50 p-3 text-xs text-red-700 flex items-start gap-2"
                  >
                    <i class="pi pi-exclamation-triangle text-red-500 shrink-0 mt-0.5" aria-hidden="true" />
                    <span>{{ directUrlError }}</span>
                  </div>

                  <!-- URL Preview Box -->
                  <div
                    v-if="directUrlPreview"
                    class="flex flex-col sm:flex-row items-center gap-4 rounded-xl border border-slate-200 bg-slate-50 p-3"
                  >
                    <img
                      :src="directUrlPreview.url"
                      alt="URL preview"
                      class="h-24 w-32 rounded-lg object-cover border border-slate-200 bg-white shrink-0"
                    />
                    <div class="min-w-0 flex-1 space-y-1 text-center sm:text-left">
                      <span class="inline-flex items-center gap-1 rounded bg-emerald-100 px-2 py-0.5 text-[10px] font-semibold text-emerald-800">
                        <i class="pi pi-check-circle text-[9px]" aria-hidden="true" /> Valid Image
                      </span>
                      <p class="truncate font-mono text-xs text-slate-700 max-w-md" :title="directUrlPreview.url">
                        {{ directUrlPreview.url }}
                      </p>
                      <p class="text-[11px] text-slate-500">
                        Dimensions: {{ directUrlPreview.width }} &times; {{ directUrlPreview.height }} px
                      </p>
                    </div>
                    <button
                      type="button"
                      class="rounded-lg bg-blue-600 px-3.5 py-1.5 text-xs font-semibold text-white transition hover:bg-blue-700 shrink-0 min-h-[36px]"
                      @click="chooseDirectUrl"
                    >
                      Use This URL
                    </button>
                  </div>
                </div>
              </div>

              <!-- Section C: Alt Text (Accessibility & SEO) -->
              <div class="space-y-2">
                <label for="picker-alt-text" class="block text-xs sm:text-sm font-semibold text-slate-900 uppercase tracking-wider">
                  Alt Text (Accessibility &amp; SEO)
                </label>
                <div class="rounded-2xl border border-slate-200 bg-white p-4 shadow-2xs space-y-1.5">
                  <input
                    id="picker-alt-text"
                    v-model="selectedAlt"
                    type="text"
                    placeholder="e.g. Modern minimalist solid oak dining table in sunlit pavilion"
                    class="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:outline-none min-h-[42px]"
                  />
                  <p class="text-[11px] text-slate-500">
                    Descriptive alt text improves screen reader accessibility and boosts catalog image SEO.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <!-- FOOTER: SELECTED SUMMARY & ACTIONS -->
          <div class="border-t border-slate-200 bg-white px-4 sm:px-6 py-3.5 shrink-0 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            <!-- Currently Selected Preview Area -->
            <div class="min-w-0 flex items-center gap-3">
              <template v-if="selectedUrl">
                <div class="relative h-11 w-11 rounded-lg border border-slate-200 overflow-hidden bg-slate-100 shrink-0 shadow-2xs">
                  <img
                    :src="selectedUrl"
                    :alt="selectedAlt || 'Selected image'"
                    class="h-full w-full object-cover"
                    @error="onThumbError"
                  />
                </div>
                <div class="min-w-0">
                  <div class="flex items-center gap-1.5">
                    <span class="rounded bg-blue-50 px-1.5 py-0.5 text-[10px] font-semibold text-blue-700 border border-blue-100">
                      {{ selectedSource }}
                    </span>
                    <span v-if="selectedDimensions" class="text-[10px] text-slate-500">
                      {{ selectedDimensions }}
                    </span>
                  </div>
                  <p class="mt-0.5 truncate font-mono text-xs text-slate-700 max-w-[200px] sm:max-w-xs md:max-w-md" :title="selectedUrl">
                    {{ selectedUrl }}
                  </p>
                </div>
              </template>
              <template v-else>
                <div class="flex items-center gap-2 text-xs text-slate-400">
                  <i class="pi pi-info-circle text-sm" aria-hidden="true" />
                  <span>No image selected yet. Click any thumbnail or paste a URL.</span>
                </div>
              </template>
            </div>

            <!-- Modal Action Buttons -->
            <div class="flex items-center justify-end gap-2 shrink-0">
              <button
                type="button"
                class="rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-xs sm:text-sm font-medium text-slate-700 transition hover:bg-slate-50 focus:ring-2 focus:ring-blue-500 focus:outline-none min-h-[42px]"
                @click="closeModal"
              >
                Cancel
              </button>

              <button
                type="button"
                :disabled="!selectedUrl"
                class="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-5 py-2.5 text-xs sm:text-sm font-semibold text-white shadow-xs transition hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed focus:ring-2 focus:ring-blue-500 focus:outline-none min-h-[42px]"
                @click="applySelection"
              >
                <i class="pi pi-check text-xs" aria-hidden="true" />
                <span>Apply Image</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'
import { adminApi } from '@/admin/api/adminApi'
import type { ImageRecord, ImageListResponse } from '@/admin/types/admin'

// ─── Component Props & Emits ─────────────────────────────────────────────────
const props = withDefaults(
  defineProps<{
    modelValue: boolean
    currentImage?: string
    currentAlt?: string
  }>(),
  {
    currentImage: undefined,
    currentAlt: undefined,
  },
)

const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void
  (e: 'select', payload: { url: string; alt?: string }): void
}>()

// ─── Active Tab ──────────────────────────────────────────────────────────────
type PickerTab = 'media' | 'curated' | 'upload'
const activeTab = ref<PickerTab>('media')

// ─── Current Selection State ─────────────────────────────────────────────────
const selectedUrl = ref<string>('')
const selectedAlt = ref<string>('')
const selectedSource = ref<string>('Selected')
const selectedDimensions = ref<string>('')

// ─── Curated Architectural & Design Catalog ──────────────────────────────────
export interface CuratedImage {
  id: string
  url: string
  title: string
  alt: string
  category: string
  resolution: string
  photographer: string
  source: string
  tags: string[]
}

const CURATED_COLLECTIONS = [
  'All',
  'Minimalist Hardwood',
  'Architectural Living',
  'Bespoke Joinery',
  'Modern Accent Chairs',
  'Luxury Dining',
  'Contemporary Sofa',
  'Interior Studio',
] as const

const CURATED_IMAGES: CuratedImage[] = [
  // Minimalist Hardwood
  {
    id: 'arch-1',
    url: 'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?auto=format&fit=crop&w=1600&q=80',
    title: 'Solid Oak Minimalist Dining Table',
    alt: 'Handcrafted solid oak dining table in minimalist interior',
    category: 'Minimalist Hardwood',
    resolution: '4K (2560×1600)',
    photographer: 'Kam-Idris',
    source: 'Unsplash',
    tags: ['table', 'oak', 'hardwood', 'minimalist', 'dining'],
  },
  {
    id: 'arch-2',
    url: 'https://images.unsplash.com/photo-1538688525198-9b88f6f53126?auto=format&fit=crop&w=1600&q=80',
    title: 'Natural Walnut Low Credenza',
    alt: 'Natural walnut low credenza with artisanal ceramics',
    category: 'Minimalist Hardwood',
    resolution: 'Hi-Res (2000×1500)',
    photographer: 'Spacejoy',
    source: 'Unsplash',
    tags: ['credenza', 'walnut', 'storage', 'cabinet', 'japandi'],
  },
  {
    id: 'arch-3',
    url: 'https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?auto=format&fit=crop&w=1600&q=80',
    title: 'Solid Walnut Low Platform Bed',
    alt: 'Architectural solid walnut low platform bed with linen bedding',
    category: 'Minimalist Hardwood',
    resolution: 'Hi-Res (2400×1600)',
    photographer: 'Francesca Tosolini',
    source: 'Unsplash',
    tags: ['bed', 'bedroom', 'platform', 'walnut', 'wood'],
  },
  {
    id: 'arch-4',
    url: 'https://images.unsplash.com/photo-1549497538-303791108f95?auto=format&fit=crop&w=1600&q=80',
    title: 'Scandinavian Ash Wood Coffee Table',
    alt: 'Sculptural ash wood coffee table in sunlit living room',
    category: 'Minimalist Hardwood',
    resolution: 'Hi-Res (2200×1467)',
    photographer: 'Philip Wang',
    source: 'Unsplash',
    tags: ['coffee table', 'ash', 'scandinavian', 'hardwood'],
  },

  // Architectural Living
  {
    id: 'arch-5',
    url: 'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=1600&q=80',
    title: 'Double-Height Concrete & Timber Pavilion',
    alt: 'Double-height concrete and timber architectural living pavilion',
    category: 'Architectural Living',
    resolution: '4K (2560×1707)',
    photographer: 'R Architecture',
    source: 'Unsplash',
    tags: ['living room', 'concrete', 'timber', 'architecture', 'brutalist'],
  },
  {
    id: 'arch-6',
    url: 'https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?auto=format&fit=crop&w=1600&q=80',
    title: 'Floor-to-Ceiling Glass Mid-Century Lounge',
    alt: 'Architectural mid-century lounge with expansive glass walls',
    category: 'Architectural Living',
    resolution: '4K (2560×1600)',
    photographer: 'R Architecture',
    source: 'Unsplash',
    tags: ['glass', 'mid-century', 'lounge', 'lighting', 'open-plan'],
  },
  {
    id: 'arch-7',
    url: 'https://images.unsplash.com/photo-1598928506311-c55efa66a84d?auto=format&fit=crop&w=1600&q=80',
    title: 'Monolithic Limestone Fireplace & Lounge',
    alt: 'Monolithic limestone fireplace and curated sculptural seating',
    category: 'Architectural Living',
    resolution: 'Hi-Res (2400×1600)',
    photographer: 'Huy Nguyen',
    source: 'Unsplash',
    tags: ['fireplace', 'limestone', 'stone', 'living', 'minimalist'],
  },
  {
    id: 'arch-8',
    url: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1600&q=80',
    title: 'Sunken Architectural Conversation Pit',
    alt: 'Sunken conversation pit with upholstered continuous bench',
    category: 'Architectural Living',
    resolution: '4K (2560×1440)',
    photographer: 'Sidekix Media',
    source: 'Unsplash',
    tags: ['conversation pit', 'sunken', 'modern', 'architectural'],
  },

  // Bespoke Joinery
  {
    id: 'arch-9',
    url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=1600&q=80',
    title: 'Floor-to-Ceiling Fluted Oak Bookshelf',
    alt: 'Custom floor-to-ceiling fluted oak architectural bookcase',
    category: 'Bespoke Joinery',
    resolution: 'Hi-Res (2048×1365)',
    photographer: 'Mitchell Luo',
    source: 'Unsplash',
    tags: ['joinery', 'bookshelf', 'oak', 'library', 'bespoke'],
  },
  {
    id: 'arch-10',
    url: 'https://images.unsplash.com/photo-1618221469555-7f3ad97540d6?auto=format&fit=crop&w=1600&q=80',
    title: 'Architectural Walnut Slatted Room Divider',
    alt: 'Walnut slatted acoustic partition and integrated credenza',
    category: 'Bespoke Joinery',
    resolution: '4K (2560×1600)',
    photographer: 'Spacejoy',
    source: 'Unsplash',
    tags: ['partition', 'slatted', 'walnut', 'divider', 'joinery'],
  },
  {
    id: 'arch-11',
    url: 'https://images.unsplash.com/photo-1600566753376-12c8ab7fb75b?auto=format&fit=crop&w=1600&q=80',
    title: 'Custom Curved Floating Shelving Unit',
    alt: 'Parametric curved floating wall unit in warm white oak',
    category: 'Bespoke Joinery',
    resolution: 'Hi-Res (2400×1600)',
    photographer: 'Jean-Philippe Delberghe',
    source: 'Unsplash',
    tags: ['shelving', 'floating', 'curved', 'parametric', 'oak'],
  },
  {
    id: 'arch-12',
    url: 'https://images.unsplash.com/photo-1595428774223-ef52624120d2?auto=format&fit=crop&w=1600&q=80',
    title: 'Handcrafted Solid Teak Sideboard',
    alt: 'Handcrafted solid teak sideboard with brass joint details',
    category: 'Bespoke Joinery',
    resolution: 'Hi-Res (2200×1467)',
    photographer: 'Kara Eads',
    source: 'Unsplash',
    tags: ['sideboard', 'teak', 'credenza', 'brass', 'joinery'],
  },

  // Modern Accent Chairs
  {
    id: 'arch-13',
    url: 'https://images.unsplash.com/photo-1567538096630-e0c55bd6374c?auto=format&fit=crop&w=1600&q=80',
    title: 'Emerald Velvet Lounge Armchair',
    alt: 'Emerald green velvet lounge armchair with black steel frame',
    category: 'Modern Accent Chairs',
    resolution: '4K (2560×1600)',
    photographer: 'Martin Péchy',
    source: 'Unsplash',
    tags: ['chair', 'armchair', 'velvet', 'emerald', 'accent'],
  },
  {
    id: 'arch-14',
    url: 'https://images.unsplash.com/photo-1506439773649-6e0eb8cfb237?auto=format&fit=crop&w=1600&q=80',
    title: 'Sculptural Minimalist Accent Chair',
    alt: 'Sculptural matte charcoal minimalist lounge chair',
    category: 'Modern Accent Chairs',
    resolution: 'Hi-Res (2000×1500)',
    photographer: 'Dan Gold',
    source: 'Unsplash',
    tags: ['chair', 'sculptural', 'minimalist', 'black', 'accent'],
  },
  {
    id: 'arch-15',
    url: 'https://images.unsplash.com/photo-1580481077198-c847ad43617f?auto=format&fit=crop&w=1600&q=80',
    title: 'Warm Cognac Leather Reading Chair',
    alt: 'Warm cognac full-grain leather club chair with brass feet',
    category: 'Modern Accent Chairs',
    resolution: 'Hi-Res (2400×1600)',
    photographer: 'Collov Home Design',
    source: 'Unsplash',
    tags: ['leather', 'cognac', 'club chair', 'armchair', 'luxury'],
  },
  {
    id: 'arch-16',
    url: 'https://plus.unsplash.com/premium_photo-1681400063959-81efdde1814c?auto=format&fit=crop&w=1600&q=80',
    title: 'Curved Bouclé Swivel Club Chair',
    alt: 'Textured bouclé curved swivel armchair in warm neutral tone',
    category: 'Modern Accent Chairs',
    resolution: 'Hi-Res (2400×1600)',
    photographer: 'Spacefurnio Studio',
    source: 'Unsplash',
    tags: ['boucle', 'swivel', 'club chair', 'white', 'curved'],
  },

  // Luxury Dining
  {
    id: 'arch-17',
    url: 'https://images.unsplash.com/photo-1617806118233-18e1de247200?auto=format&fit=crop&w=1600&q=80',
    title: 'Calacatta Marble Oval Dining Table',
    alt: 'Calacatta gold marble oval dining table with fluted pedestal',
    category: 'Luxury Dining',
    resolution: '4K (2560×1600)',
    photographer: 'Jason Leung',
    source: 'Unsplash',
    tags: ['marble', 'dining', 'table', 'calacatta', 'luxury'],
  },
  {
    id: 'arch-18',
    url: 'https://images.unsplash.com/photo-1530018607912-eff2daa1bac4?auto=format&fit=crop&w=1600&q=80',
    title: 'Smoked Oak Banquet Table',
    alt: 'Smoked oak banquet dining table with architectural leather seating',
    category: 'Luxury Dining',
    resolution: 'Hi-Res (2400×1600)',
    photographer: 'Roberto Nickson',
    source: 'Unsplash',
    tags: ['dining', 'banquet', 'smoked oak', 'leather', 'entertaining'],
  },
  {
    id: 'arch-19',
    url: 'https://images.unsplash.com/photo-1616486338812-3dadae4b4ace?auto=format&fit=crop&w=1600&q=80',
    title: 'Contemporary Minimalist Dining Pavilion',
    alt: 'Contemporary dining pavilion with natural stone floor and pendant light',
    category: 'Luxury Dining',
    resolution: '4K (2560×1600)',
    photographer: 'Spacejoy',
    source: 'Unsplash',
    tags: ['dining', 'pavilion', 'pendant', 'minimalist', 'chairs'],
  },
  {
    id: 'arch-20',
    url: 'https://images.unsplash.com/photo-1577140917170-285929fb55b7?auto=format&fit=crop&w=1600&q=80',
    title: 'Bespoke Walnut Dining Setting',
    alt: 'Bespoke walnut dining suite with sculptural chandelier',
    category: 'Luxury Dining',
    resolution: 'Hi-Res (2200×1467)',
    photographer: 'Douglas Sheppard',
    source: 'Unsplash',
    tags: ['walnut', 'dining', 'chandelier', 'bespoke', 'wood'],
  },

  // Contemporary Sofa
  {
    id: 'arch-21',
    url: 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?auto=format&fit=crop&w=1600&q=80',
    title: 'Low-Profile Emerald Velvet Sectional',
    alt: 'Low-profile emerald green velvet modular sectional sofa',
    category: 'Contemporary Sofa',
    resolution: '4K (2560×1707)',
    photographer: 'Sven Brandsma',
    source: 'Unsplash',
    tags: ['sofa', 'sectional', 'velvet', 'emerald', 'living'],
  },
  {
    id: 'arch-22',
    url: 'https://images.unsplash.com/photo-1604580040660-f0a7f9abaea6?auto=format&fit=crop&w=1600&q=80',
    title: 'Curved Bouclé Silhouette Modular Sofa',
    alt: 'Curved organic bouclé 3-piece modular sofa in bright living space',
    category: 'Contemporary Sofa',
    resolution: 'Hi-Res (2400×1600)',
    photographer: 'Martin Péchy',
    source: 'Unsplash',
    tags: ['sofa', 'curved', 'boucle', 'modular', 'contemporary'],
  },
  {
    id: 'arch-23',
    url: 'https://images.unsplash.com/photo-1493663284031-b7e3aefcae8e?auto=format&fit=crop&w=1600&q=80',
    title: 'Oatmeal Linen Minimalist 3-Seater Sofa',
    alt: 'Oatmeal linen minimalist 3-seater sofa in serene interior',
    category: 'Contemporary Sofa',
    resolution: 'Hi-Res (2400×1600)',
    photographer: 'Visual Stories',
    source: 'Unsplash',
    tags: ['sofa', 'linen', 'minimalist', 'neutral', 'couch'],
  },
  {
    id: 'arch-24',
    url: 'https://images.unsplash.com/photo-1512212621149-107ffe572d2f?auto=format&fit=crop&w=1600&q=80',
    title: 'Modular Charcoal Deep Seating Lounge',
    alt: 'Deep seating modular lounge with textured cushions',
    category: 'Contemporary Sofa',
    resolution: '4K (2560×1600)',
    photographer: 'Spacejoy',
    source: 'Unsplash',
    tags: ['charcoal', 'deep seating', 'lounge', 'modular', 'sofa'],
  },

  // Interior Studio
  {
    id: 'arch-25',
    url: 'https://images.unsplash.com/photo-1513519245088-0e12902e5a38?auto=format&fit=crop&w=1600&q=80',
    title: 'Architectural Material Palette Board',
    alt: 'Tactile architectural interior design materials and wood samples',
    category: 'Interior Studio',
    resolution: 'Hi-Res (2048×1365)',
    photographer: 'Kelly Sikkema',
    source: 'Unsplash',
    tags: ['materials', 'samples', 'swatch', 'architectural', 'studio'],
  },
  {
    id: 'arch-26',
    url: 'https://images.unsplash.com/photo-1578662996442-48f60103fc96?auto=format&fit=crop&w=1600&q=80',
    title: 'Wabi-Sabi Plaster Wall & Ceramic Artifacts',
    alt: 'Handmade ceramic vessels on raw plaster plinth in soft light',
    category: 'Interior Studio',
    resolution: 'Hi-Res (2400×1600)',
    photographer: 'Julie Aagaard',
    source: 'Unsplash',
    tags: ['ceramics', 'vases', 'wabi-sabi', 'plaster', 'sculpture'],
  },
  {
    id: 'arch-27',
    url: 'https://images.unsplash.com/photo-1600585154526-990dced4db0d?auto=format&fit=crop&w=1600&q=80',
    title: 'Brutalist Travertine Pedestal Showcase',
    alt: 'Brutalist travertine column with botanical branch in gallery',
    category: 'Interior Studio',
    resolution: '4K (2560×1600)',
    photographer: 'Mike Marquez',
    source: 'Unsplash',
    tags: ['travertine', 'pedestal', 'botanical', 'brutalist', 'gallery'],
  },
  {
    id: 'arch-28',
    url: 'https://images.unsplash.com/photo-1556228453-efd6c1ff04f6?auto=format&fit=crop&w=1600&q=80',
    title: 'Morning Sunlight on Textured Interior',
    alt: 'Warm morning light casting shadows across textured plaster interior',
    category: 'Interior Studio',
    resolution: 'Hi-Res (2200×1467)',
    photographer: 'Med Badr Chemmaoui',
    source: 'Unsplash',
    tags: ['sunlight', 'shadows', 'texture', 'minimalist', 'interior'],
  },
]

const curatedSearch = ref('')
const selectedCollection = ref<string>('All')

const filteredCuratedImages = computed(() => {
  const query = curatedSearch.value.trim().toLowerCase()
  const collection = selectedCollection.value

  return CURATED_IMAGES.filter((img) => {
    const matchesCollection = collection === 'All' || img.category === collection
    if (!matchesCollection) return false

    if (!query) return true

    const inTitle = img.title.toLowerCase().includes(query)
    const inAlt = img.alt.toLowerCase().includes(query)
    const inCategory = img.category.toLowerCase().includes(query)
    const inPhotographer = img.photographer.toLowerCase().includes(query)
    const inTags = img.tags.some((t) => t.toLowerCase().includes(query))

    return inTitle || inAlt || inCategory || inPhotographer || inTags
  })
})

function resetCuratedFilters(): void {
  curatedSearch.value = ''
  selectedCollection.value = 'All'
}

function chooseCurated(item: CuratedImage): void {
  selectedUrl.value = item.url
  selectedAlt.value = item.alt || item.title
  selectedSource.value = 'Architectural Catalog'
  selectedDimensions.value = item.resolution
}

// ─── Tab 1: Media Library (API Fetch) ────────────────────────────────────────
const libraryImages = ref<ImageRecord[]>([])
const libraryLoading = ref(false)
const libraryError = ref<string | null>(null)
const libraryPage = ref(1)
const libraryLimit = ref(24)
const libraryTotal = ref(0)
const librarySearch = ref('')
const brokenImages = ref<Set<number>>(new Set())

let searchDebounceTimer: ReturnType<typeof setTimeout> | null = null

const libraryTotalPages = computed(() => {
  return Math.max(1, Math.ceil(libraryTotal.value / libraryLimit.value))
})

const libraryRangeStart = computed(() => {
  if (libraryTotal.value === 0) return 0
  return (libraryPage.value - 1) * libraryLimit.value + 1
})

const libraryRangeEnd = computed(() => {
  return Math.min(libraryPage.value * libraryLimit.value, libraryTotal.value)
})

async function fetchLibraryImages(): Promise<void> {
  libraryLoading.value = true
  libraryError.value = null

  try {
    const params: Record<string, string | number | boolean> = {
      page: libraryPage.value,
      limit: libraryLimit.value,
    }

    if (librarySearch.value.trim()) {
      params.search = librarySearch.value.trim()
    }

    const data = await adminApi.get<ImageListResponse | ImageRecord[]>('/api/admin/images', params)

    if (Array.isArray(data)) {
      libraryImages.value = data
      libraryTotal.value = data.length
    } else {
      libraryImages.value = data.images || []
      libraryTotal.value = data.pagination?.total || (data.images ? data.images.length : 0)
    }
  } catch (err: unknown) {
    const errorObj = err as Error
    libraryError.value = errorObj.message || 'Failed to load media assets'
  } finally {
    libraryLoading.value = false
  }
}

function onLibrarySearchInput(): void {
  if (searchDebounceTimer) {
    clearTimeout(searchDebounceTimer)
  }
  searchDebounceTimer = setTimeout(() => {
    libraryPage.value = 1
    fetchLibraryImages()
  }, 300)
}

function clearLibrarySearch(): void {
  librarySearch.value = ''
  libraryPage.value = 1
  fetchLibraryImages()
}

function goToLibraryPage(page: number): void {
  if (page < 1 || page > libraryTotalPages.value) return
  libraryPage.value = page
  fetchLibraryImages()
}

function handleImageError(id: number): void {
  brokenImages.value.add(id)
}

function chooseImage(url: string, alt: string, source: string): void {
  selectedUrl.value = url
  if (!selectedAlt.value || selectedAlt.value === props.currentAlt) {
    selectedAlt.value = alt
  }
  selectedSource.value = source
  inspectImageDimensions(url)
}

// ─── Tab 3: Upload & Direct URL ──────────────────────────────────────────────
const isDragging = ref(false)
const fileInputRef = ref<HTMLInputElement | null>(null)
const uploadError = ref<string | null>(null)

interface UploadedFileRecord {
  name: string
  size: number
  type: string
  dataUrl: string
  width?: number
  height?: number
}

const uploadedFile = ref<UploadedFileRecord | null>(null)

const ACCEPTED_MIME_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/svg+xml',
  'image/avif',
]

function triggerFileInput(): void {
  fileInputRef.value?.click()
}

function handleFileInputChange(e: Event): void {
  const target = e.target as HTMLInputElement
  if (target.files && target.files.length > 0) {
    processFile(target.files[0])
  }
}

function handleFileDrop(e: DragEvent): void {
  isDragging.value = false
  if (e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files.length > 0) {
    processFile(e.dataTransfer.files[0])
  }
}

function processFile(file: File): void {
  uploadError.value = null

  if (!ACCEPTED_MIME_TYPES.includes(file.type)) {
    uploadError.value = `Unsupported file format (${file.type || 'unknown'}). Please upload a JPEG, PNG, WebP, SVG, or AVIF image.`
    return
  }

  // 10MB limit
  const MAX_SIZE = 10 * 1024 * 1024
  if (file.size > MAX_SIZE) {
    uploadError.value = `File size (${formatFileSize(file.size)}) exceeds the maximum allowed limit of 10MB.`
    return
  }

  const reader = new FileReader()
  reader.onload = (event) => {
    const dataUrl = event.target?.result as string
    if (!dataUrl) return

    const img = new Image()
    img.onload = () => {
      uploadedFile.value = {
        name: file.name,
        size: file.size,
        type: file.type,
        dataUrl,
        width: img.naturalWidth,
        height: img.naturalHeight,
      }

      selectedUrl.value = dataUrl
      if (!selectedAlt.value) {
        // Strip extension and format
        selectedAlt.value = file.name.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' ')
      }
      selectedSource.value = 'Local Upload'
      selectedDimensions.value = `${img.naturalWidth} × ${img.naturalHeight} px`
    }
    img.onerror = () => {
      uploadError.value = 'Unable to decode image file.'
    }
    img.src = dataUrl
  }

  reader.onerror = () => {
    uploadError.value = 'Failed to read file from disk.'
  }

  reader.readAsDataURL(file)
}

// ─── Direct URL Section ──────────────────────────────────────────────────────
const directUrlInput = ref('')
const directUrlLoading = ref(false)
const directUrlError = ref<string | null>(null)
const directUrlPreview = ref<{ url: string; width: number; height: number } | null>(null)

function testDirectUrl(): void {
  const url = directUrlInput.value.trim()
  if (!url) return

  directUrlError.value = null
  directUrlLoading.value = true

  if (!url.startsWith('http://') && !url.startsWith('https://')) {
    directUrlLoading.value = false
    directUrlError.value = 'URL must begin with http:// or https://'
    return
  }

  const testImg = new Image()
  testImg.onload = () => {
    directUrlLoading.value = false
    directUrlPreview.value = {
      url,
      width: testImg.naturalWidth,
      height: testImg.naturalHeight,
    }
    // Auto-select once verified
    chooseDirectUrl()
  }

  testImg.onerror = () => {
    directUrlLoading.value = false
    directUrlError.value = 'Unable to load image from URL. Verify the link is publicly accessible and CORS-compliant.'
  }

  testImg.src = url
}

function chooseDirectUrl(): void {
  if (!directUrlPreview.value) return
  selectedUrl.value = directUrlPreview.value.url
  selectedSource.value = 'Direct URL'
  selectedDimensions.value = `${directUrlPreview.value.width} × ${directUrlPreview.value.height} px`
  if (!selectedAlt.value) {
    selectedAlt.value = formatFileName(directUrlPreview.value.url)
  }
}

// ─── Utilities ───────────────────────────────────────────────────────────────
function inspectImageDimensions(url: string): void {
  selectedDimensions.value = ''
  if (!url) return

  const img = new Image()
  img.onload = () => {
    if (img.naturalWidth && img.naturalHeight) {
      selectedDimensions.value = `${img.naturalWidth} × ${img.naturalHeight} px`
    }
  }
  img.src = url
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

function formatFileName(url: string): string {
  try {
    const parts = url.split('/')
    const lastPart = parts[parts.length - 1].split('?')[0]
    return lastPart || url
  } catch {
    return url
  }
}

function onThumbError(event: Event): void {
  const target = event.target as HTMLImageElement
  if (target) {
    target.style.opacity = '0.3'
  }
}

// ─── Dialog Actions ──────────────────────────────────────────────────────────
function closeModal(): void {
  emit('update:modelValue', false)
}

function applySelection(): void {
  if (!selectedUrl.value) return

  emit('select', {
    url: selectedUrl.value,
    alt: selectedAlt.value.trim() || undefined,
  })

  closeModal()
}

// ─── Lifecycle & Watchers ────────────────────────────────────────────────────
watch(
  () => props.modelValue,
  (isOpen) => {
    if (isOpen) {
      if (props.currentImage) {
        selectedUrl.value = props.currentImage
        selectedAlt.value = props.currentAlt || ''
        selectedSource.value = 'Current Image'
        inspectImageDimensions(props.currentImage)
      } else {
        selectedUrl.value = ''
        selectedAlt.value = ''
        selectedSource.value = ''
        selectedDimensions.value = ''
      }

      // Pre-fetch library images if empty
      if (libraryImages.value.length === 0 && !libraryLoading.value) {
        fetchLibraryImages()
      }
    }
  },
  { immediate: true },
)

onMounted(() => {
  if (props.modelValue && libraryImages.value.length === 0) {
    fetchLibraryImages()
  }
})
</script>

<style scoped>
.picker-fade-enter-active,
.picker-fade-leave-active {
  transition: opacity 200ms ease, transform 200ms ease;
}

.picker-fade-enter-from,
.picker-fade-leave-to {
  opacity: 0;
  transform: scale(0.98);
}
</style>
