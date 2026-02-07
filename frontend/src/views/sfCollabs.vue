<script setup>
import CollabsSection from "@/components/collabs/CollabsSection.vue";
import { scroller } from '../utills/customScroll';
import { ref, onMounted, onBeforeUnmount, inject } from 'vue';
import FooterComponent from '@/components/Footer-component.vue'

const { showFoo } = inject('navShowUtils');

const wrapper = ref(null)

onMounted(() => {
  const cleanup = scroller(wrapper, 'scroll-section')
  onBeforeUnmount(cleanup)
  showFoo.value = false;
  onBeforeUnmount(() => {
    showFoo.value = true;
  });
})
</script>

<template>
  <div id="scroll-container" class="overflow-clip">
    <div id="scroll-wrapper" ref="wrapper">
        <div class="scroll-section bg-background-light text-primary font-body antialiased transition-colors duration-500">
          <!-- Header -->
          <header class="relative w-full min-h-screen flex flex-col justify-center items-center overflow-hidden py-20">
              <div class="absolute inset-0 z-0">
                  <img alt="Abstract architectural shadows" class="w-full h-full object-cover opacity-90 grayscale" src="https://lh3.googleusercontent.com/aida-public/AB6AXuAhgKO0hSTWG8ItXCNibW_OwnRd-hVLNDjVdtYABLzMFnJkmxfTo7lezGgAKHJ2oByOqbt0Bdw95Lrr3sTj3iHl_amf-PmUOcLb3AL6c1isxbGZQVied6Oj22vBxQCc2dMH2kfcZFz43VOGgJTNV_jmcUI7_I3OiG5d1AyLmsopkxfYQ0WQ6YNr_kdf9JmCknkr6oSYw0pJtsag5DTR7rgUjVR5VJALqahF4ingfIhsUOQVUp0IvC64M0l7IppyjdZ5bg5MUF28tf0"/>
                  <div class="absolute inset-0 bg-gradient-to-b from-transparent via-background-light/30 to-background-light"></div>
              </div>
              <div class="relative z-10 text-center flex flex-col items-center max-w-5xl px-6 sm:px-8 animate-fadeIn">
                  <!-- Logo -->
                  <div class="-mb-8 md:-mb-10 xl:-mb-10 w-25 sm:w-28 md:w-26 lg:w-34 transition-all duration-700 hover:scale-105">
                      <img alt="Spacefurnio Monogram" class="w-full h-auto drop-shadow-2xl" src="/images/Spacefurnio-Logo.png"/>
                  </div>

                  <!-- Main Title -->
                  <h1 class="font-display mb-0 sm:mb-1 tracking-tight text-gray-900 flex flex-col items-center gap-0">
                      <span class="phitagate-font bg-clip-text text-8xl xl:text-9xl leading-tight ps-1 text-black font-medium">
                          Spacefurnio
                      </span>
                      <span class="font-bold phitagate-font text-7xl text-gray-700 -mt-4 md:-mt-6 xl:-mt-7">
                          ×
                      </span>
                      <span class="italic text-6xl xl:text-7xl font-light tracking-wide mt-1 md:mt-1 xl:mt-2">
                          Collabs
                      </span>
                  </h1>

                  <!-- Divider -->
                  <div class="w-16 sm:w-20 md:w-24 h-[2px] bg-gradient-to-r from-transparent via-gray-800 to-transparent my-4 sm:my-5"></div>
              </div>

              <!-- Scroll Indicator -->
              <div class="absolute bottom-6 sm:bottom-10 animate-bounce">
                  <span class="material-icons text-2xl sm:text-3xl text-gray-500 opacity-60 hover:opacity-100 transition-opacity cursor-pointer">
                      keyboard_arrow_down
                  </span>
              </div>
          </header>

          <!-- Quote Section -->
          <div class="py-24 md:py-32 px-6 bg-background-light relative z-10">
              <div class="max-w-3xl mx-auto text-center" v-animateonscroll="{ enterClass: 'animate__fadeInUp' }">
                  <p class="font-display text-2xl md:text-4xl leading-relaxed text-gray-800">
                      "We believe that true elegance is found in the dialogue between distinct voices. Our collaborations series invites the world's most visionary brands to reimagine the Spacefurnio aesthetic."
                  </p>
              </div>
          </div>
        </div>

            <div class="scroll-section">
              <CollabsSection />
            </div>

            <!-- Footer Quote -->
            <div class="scroll-section py-32 px-6 bg-primary text-white flex items-center justify-center">
                <div class="max-w-4xl text-center border-y border-white/20 py-16">
                    <span class="material-icons text-4xl mb-6 text-white/50">format_quote</span>
                    <p class="font-display text-3xl md:text-5xl italic leading-relaxed mb-8">
                        Design is not just what it looks like and feels like. Design is how it works together.
                    </p>
                    <div class="flex items-center justify-center gap-3">
                        <div class="h-[1px] w-12 bg-white/50"></div>
                        <span class="uppercase tracking-widest text-sm text-white/70">The SF Studio</span>
                        <div class="h-[1px] w-12 bg-white/50"></div>
                    </div>
                </div>
            </div>

        <div class="scroll-section">
          <FooterComponent />
        </div>

    </div>
  </div>
</template>

