<script setup>
import { ref } from 'vue';
import CTA from '@/components/contactUs/CTA.vue';

const form = ref({
  firstName: '',
  lastName: '',
  email: '',
  message: '',
  agree: false
});

const contactMethods = [
  { label: 'Email', value: 'bray@ubix.com', desc: 'Contact us by email, and we will respond shortly.', link: 'mailto:bray@ubix.com' },
  { label: 'Phone', value: '+1 (222) 333-4444', desc: 'Call us on weekdays from 9 AM to 5 PM.', link: 'tel:+12223334444' },
  { label: 'Mobile', value: '+2 (222) 333-4444', desc: 'Call us on weekdays from 9 AM to 5 PM.', link: 'tel:+22223334444' },
  { label: 'Office', value: '87266 Green Station, Fada, Oregon 26730, Canada', desc: 'Visit us at our headquarters.', link: null }
];

const teamImages = Array.from({ length: 7 }, (_, i) => ({
  id: i,
  src: `https://placehold.co/300x400/png?text=User+${i + 1}`,
  rot: (i - 3) * 12 // Distributed angles centered at 0
}));

const submitForm = () => {
  console.log('Submitting', form.value);
};
</script>

<template>
  <div class="min-h-screen bg-[#F3F0EA] font-sans text-gray-900 overflow-x-hidden pt-[110px]">
    <!-- Top Section: Contact & Form -->
    <div class="max-w-7xl w-full mx-auto px-6 sm:px-8 lg:px-12 xl:px-16 py-8 md:py-12 min-h-[calc(100dvh-110px)] flex items-center justify-center">
      <div class="grid lg:grid-cols-2 gap-12 lg:gap-20 xl:gap-28 items-center w-full">

        <!-- Left: Info -->
        <div class="space-y-10 md:space-y-14 lg:space-y-16">
          <div>
            <h1 class="font-display text-4xl sm:text-5xl md:text-6xl lg:text-[64px] xl:text-[72px] font-bold mb-4 md:mb-6 tracking-tight leading-tight">Contact us</h1>
            <p class="text-gray-500 max-w-md lg:max-w-lg text-base md:text-lg lg:text-xl leading-relaxed">
              We'd love to hear from you. Please fill out this form, and we'll reply soon.
            </p>
          </div>

          <div class="grid grid-cols-2 gap-y-10 md:gap-y-12 lg:gap-y-14 gap-x-8 md:gap-x-12 lg:gap-x-16">
            <div v-for="(method, idx) in contactMethods" :key="idx">
              <h3 class="font-semibold text-lg md:text-xl lg:text-2xl mb-2 md:mb-3">{{ method.label }}</h3>
              <p class="text-gray-500 text-sm md:text-base lg:text-lg mb-3 md:mb-4 leading-relaxed max-w-[220px] lg:max-w-[260px]">{{ method.desc }}</p>
              <template v-if="method.link">
                <a :href="method.link" class="font-semibold text-base md:text-lg lg:text-xl border-b-2 border-black pb-0.5 hover:text-gray-600 transition-colors">
                  {{ method.value }}
                </a>
              </template>
              <template v-else>
                <p class="font-semibold text-base md:text-lg lg:text-xl max-w-[220px] lg:max-w-[280px] leading-snug">{{ method.value }}</p>
              </template>
            </div>
          </div>
        </div>

        <!-- Right: Form -->
        <div class="bg-[#FDFBF7] p-8 sm:p-10 md:p-12 lg:p-14 rounded-3xl md:rounded-[2rem] shadow-md">
          <h2 class="font-display text-2xl md:text-3xl lg:text-4xl font-bold mb-6 md:mb-8 lg:mb-10">Write us a message</h2>
          <form @submit.prevent="submitForm" class="space-y-5 md:space-y-6 lg:space-y-7">

            <div class="grid grid-cols-2 gap-4 md:gap-5 lg:gap-6">
              <div class="space-y-2 md:space-y-2.5">
                <label class="text-sm md:text-base lg:text-lg font-medium text-gray-700">First name *</label>
                <input
                  v-model="form.firstName"
                  type="text"
                  placeholder="Jane"
                  class="w-full bg-[#EAE8E4] rounded-xl px-4 md:px-5 py-3 md:py-4 text-base md:text-lg outline-none focus:ring-2 focus:ring-gray-400 transition-all placeholder-gray-500"
                />
              </div>
              <div class="space-y-2 md:space-y-2.5">
                <label class="text-sm md:text-base lg:text-lg font-medium text-gray-700">Last name *</label>
                <input
                  v-model="form.lastName"
                  type="text"
                  placeholder="Smith"
                  class="w-full bg-[#EAE8E4] rounded-xl px-4 md:px-5 py-3 md:py-4 text-base md:text-lg outline-none focus:ring-2 focus:ring-gray-400 transition-all placeholder-gray-500"
                />
              </div>
            </div>

            <div class="space-y-2 md:space-y-2.5">
              <label class="text-sm md:text-base lg:text-lg font-medium text-gray-700">Email *</label>
              <input
                v-model="form.email"
                type="email"
                placeholder="jane@email.com"
                class="w-full bg-[#EAE8E4] rounded-xl px-4 md:px-5 py-3 md:py-4 text-base md:text-lg outline-none focus:ring-2 focus:ring-gray-400 transition-all placeholder-gray-500"
              />
            </div>

            <div class="space-y-2 md:space-y-2.5">
              <label class="text-sm md:text-base lg:text-lg font-medium text-gray-700">Message *</label>
              <textarea
                v-model="form.message"
                rows="5"
                placeholder="Leave us a message..."
                class="w-full bg-[#EAE8E4] rounded-xl px-4 md:px-5 py-3 md:py-4 text-base md:text-lg outline-none focus:ring-2 focus:ring-gray-400 transition-all placeholder-gray-500 resize-none"
              ></textarea>
            </div>

            <div class="flex items-center gap-3 pt-2">
              <input
                v-model="form.agree"
                type="checkbox"
                id="agree"
                class="w-5 h-5 rounded border-gray-400 text-black focus:ring-black accent-black"
              />
              <label for="agree" class="text-sm md:text-base lg:text-lg text-gray-600 select-none">I agree the Privacy Policy</label>
            </div>

            <button
              type="submit"
              class="w-full bg-black text-white font-medium text-base md:text-lg lg:text-xl py-4 md:py-5 rounded-full mt-4 hover:bg-gray-800 transition-colors shadow-lg hover:shadow-xl"
            >
              Send
            </button>

          </form>
        </div>
      </div>
    </div>

    <!-- Bottom Section: Team Arc -->
    <div class="pt-[50px]">
      <CTA/>
    </div>
  </div>
</template>

<style scoped>
/* Optional: specific tweaks */
.font-display {
  font-family: 'Playfair Display', serif;
}
</style>
