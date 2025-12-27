<template>
  <div class="min-h-screen bg-white">
    <!-- Hero Section -->
    <section class="min-h-screen flex items-center justify-center px-8 py-20 relative overflow-hidden">
      <!-- Background Elements -->
      <div class="absolute inset-0">
        <div class="absolute top-20 left-10 w-72 h-72 bg-orange-100/30 rounded-full blur-3xl animate-pulse-slow"></div>
        <div class="absolute bottom-20 right-10 w-96 h-96 bg-orange-50/40 rounded-full blur-3xl animate-pulse-slow"></div>
        <div class="absolute top-1/3 right-1/4 w-64 h-64 bg-orange-200/20 rounded-full blur-2xl animate-float"></div>
        <div class="absolute bottom-1/3 left-1/4 w-48 h-48 bg-orange-300/15 rounded-full blur-xl animate-float-reverse"></div>
      </div>

      <!-- Main Content -->
      <div class="max-w-6xl mx-auto text-center z-10 space-y-12 w-full">
        <!-- Brand Name -->
        <div data-aos="fade-up" data-aos-duration="800" class="w-full">
          <!-- <div class="mb-8">
            <img src="/images/Spacefurnio-Logo.png" alt="Spacefurnio Logo" class="h-24 mx-auto mb-6 opacity-90" />
          </div> -->
          <h1 class="text-5xl md:text-7xl lg:text-8xl font-light tracking-tight mb-6 break-words">
            <span
              class="phitagate-font pl-[3px] bg-gradient-to-r from-orange-600 via-orange-500 to-orange-400 bg-clip-text text-transparent inline-block">
              Spacefurnio
            </span>
          </h1>

          <!-- Tagline -->
          <p class="text-2xl md:text-3xl text-gray-500 font-light tracking-wide italic">
            "Creative Meets Living"
          </p>

          <!-- Brief Introduction -->
          <!-- <div class="mt-10 max-w-2xl mx-auto" data-aos="fade-up" data-aos-delay="200">
            <p class="text-lg text-gray-600 leading-relaxed">
              We transform spaces into experiences, blending innovative design with functional excellence to create furniture that inspires and endures.
            </p>
          </div> -->
        </div>

        <!-- CTA Button -->
        <!-- <div class="mt-8" data-aos="fade-up" data-aos-delay="400">
          <button class="px-8 py-3 bg-gradient-to-r from-orange-500 to-orange-600 text-white font-medium rounded-full hover:from-orange-600 hover:to-orange-700 transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl" @click="document.getElementById('our-story')?.scrollIntoView({ behavior: 'smooth' })">
            Discover Our Story
          </button>
        </div> -->
      </div>

      <!-- Scroll Indicator -->
      <div class="absolute bottom-8 left-1/2 transform -translate-x-1/2" data-aos="fade-up" data-aos-delay="600">
        <div class="w-6 h-10 border-2 border-orange-300 rounded-full flex justify-center">
          <div class="w-1 h-3 bg-orange-500 rounded-full mt-2 animate-bounce"></div>
        </div>
      </div>
    </section>

    <!-- Our Story Section -->
    <section class="py-20 px-4 bg-gradient-to-br from-orange-50 to-white relative overflow-hidden">
      <!-- Decorative background elements -->
      <div class="absolute inset-0">
        <div class="absolute top-10 left-1/4 w-32 h-32 bg-orange-200/20 rounded-full blur-xl"></div>
        <div class="absolute bottom-10 right-1/4 w-24 h-24 bg-orange-300/15 rounded-full blur-lg"></div>
      </div>

      <div class="max-w-6xl mx-auto relative z-10">
        <!-- Section Header -->
        <div id="our-story" class="text-center mb-16" data-aos="fade-up">
          <span class="text-orange-500 font-medium text-sm uppercase tracking-wider">Our Journey</span>
          <h2 class="text-4xl md:text-5xl font-light text-gray-900 mt-3 tracking-tight">
            <span class="phitagate-font bg-gradient-to-r from-orange-600 via-orange-500 to-orange-400 bg-clip-text text-transparent">
              Our Story
            </span>
          </h2>
          <div class="w-24 h-1 bg-gradient-to-r from-orange-500 to-orange-400 mx-auto mt-6 rounded-full"></div>
        </div>

        <!-- Story Content -->
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <!-- Left side - Image -->
          <div class="relative" data-aos="fade-right" data-aos-duration="800">
            <div class="relative rounded-2xl overflow-hidden shadow-xl">
              <div class="bg-gradient-to-br from-orange-200 to-orange-300 aspect-video flex items-center justify-center">
                <div class="text-center p-8">
                  <div class="w-24 h-24 bg-white rounded-full mx-auto mb-6 flex items-center justify-center">
                    <div class="w-12 h-12 bg-orange-500 rounded-full"></div>
                  </div>
                  <p class="text-white text-xl font-medium">Spacefurnio Workspace</p>
                </div>
              </div>
            </div>
            <!-- Decorative elements -->
            <div class="absolute -top-4 -right-4 w-24 h-24 bg-orange-500/20 rounded-full blur-lg"></div>
            <div class="absolute -bottom-4 -left-4 w-16 h-16 bg-orange-400/20 rounded-full blur-md"></div>
          </div>

          <!-- Right side - Text content -->
          <div class="space-y-6" data-aos="fade-left" data-aos-duration="800">
            <p class="text-lg text-gray-700 leading-relaxed">
              At Spacefurnio, we are passionate about shaping spaces that reflect purpose, personality, and precision. We offer an integrated approach to architecture, construction, interior design, and custom furniture, making us a one-stop destination for complete spatial solutions.
            </p>
            <p class="text-lg text-gray-700 leading-relaxed">
              From drawing board to delivery, we handle everything!
            </p>
          </div>
        </div>
      </div>
    </section>

    <!-- Mission & Values Section -->
    <section class="py-20 px-4 bg-white">
      <div class="max-w-6xl mx-auto">
        <!-- Section Header -->
        <div class="text-center mb-16" data-aos="fade-up">
          <span class="text-orange-500 font-medium text-sm uppercase tracking-wider">What Drives Us</span>
          <h2 class="text-4xl md:text-5xl font-light text-gray-900 mt-3 tracking-tight">
            <span class="phitagate-font bg-gradient-to-r from-orange-600 via-orange-500 to-orange-400 bg-clip-text text-transparent">
              Mission & Values
            </span>
          </h2>
          <div class="w-24 h-1 bg-gradient-to-r from-orange-500 to-orange-400 mx-auto mt-6 rounded-full"></div>
          <p class="text-lg text-gray-600 mt-6 max-w-2xl mx-auto">
            Our mission and values guide every decision we make and every piece we create.
          </p>
        </div>

        <!-- Mission Statement -->
        <!-- <div class="bg-gradient-to-br from-orange-50 to-white rounded-2xl p-8 mb-16 shadow-sm" data-aos="fade-up" data-aos-delay="100">
          <div class="flex items-start space-x-4">
            <div class="flex-shrink-0 w-12 h-12 bg-orange-500 rounded-full flex items-center justify-center">
              <svg class="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path>
              </svg>
            </div>
            <div>
              <h3 class="text-2xl font-semibold text-gray-900 mb-3">Our Mission</h3>
              <p class="text-lg text-gray-700 leading-relaxed">
                To transform living and working spaces through innovative furniture design that combines aesthetic beauty
                with functional excellence, creating environments that inspire, comfort, and endure.
              </p>
            </div>
          </div>
        </div> -->

         <div class="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <!-- Left side - Image -->
           <div class="space-y-6" data-aos="fade-left" data-aos-duration="800">
            <p class="text-lg text-gray-700 leading-relaxed">
              At Spacefurnio, we believe that great design is where creativity meets living. We exist to transform everyday spaces into thoughtful experiences by fusing imaginative design, precision craftsmanship, and sustainable practices. From architecture and interiors to product design and furniture manufacturing, we bring creative ideas to life so people can live beautifully, functionally, and meaningfully.
            </p>
          </div>

          <!-- Right side - Text content -->
           <div class="relative" data-aos="fade-right" data-aos-duration="800">
            <div class="relative rounded-2xl overflow-hidden shadow-xl">
              <div class="bg-gradient-to-br from-orange-200 to-orange-300 aspect-video flex items-center justify-center">
                <div class="text-center p-8">
                  <div class="w-24 h-24 bg-white rounded-full mx-auto mb-6 flex items-center justify-center">
                    <div class="w-12 h-12 bg-orange-500 rounded-full"></div>
                  </div>
                  <p class="text-white text-xl font-medium">Spacefurnio Workspace</p>
                </div>
              </div>
            </div>
            <!-- Decorative elements -->
            <div class="absolute -top-4 -right-4 w-24 h-24 bg-orange-500/20 rounded-full blur-lg"></div>
            <div class="absolute -bottom-4 -left-4 w-16 h-16 bg-orange-400/20 rounded-full blur-md"></div>
          </div>

        </div>
        <!-- Values Grid -->
        <!-- <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          <div v-for="(value, index) in coreValues" :key="index"
               class="bg-white p-6 rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow duration-300"
               data-aos="fade-up" :data-aos-delay="100 + (index * 100)">
            <div class="flex items-center mb-4">
              <div class="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center mr-4">
                <div class="w-4 h-4 bg-orange-500 rounded-full"></div>
              </div>
              <h3 class="text-lg font-semibold text-gray-900">Value {{ index + 1 }}</h3>
            </div>
            <p class="text-gray-700 leading-relaxed">{{ value }}</p>
          </div>
        </div> -->
      </div>
    </section>

    <!-- Brand Manifesto Section -->
    <section class="py-20 px-4 bg-gradient-to-br from-orange-50 to-white">
      <div class="max-w-4xl mx-auto">
        <!-- Section Header -->
        <div class="text-center mb-16" data-aos="fade-up">
          <span class="text-orange-500 font-medium text-sm uppercase tracking-wider">Our Philosophy</span>
          <h2 class="text-4xl md:text-5xl font-light text-gray-900 mt-3 tracking-tight">
            <span class="phitagate-font bg-gradient-to-r from-orange-600 via-orange-500 to-orange-400 bg-clip-text text-transparent">
              Brand Manifesto
            </span>
          </h2>
          <div class="w-24 h-1 bg-gradient-to-r from-orange-500 to-orange-400 mx-auto mt-6 rounded-full"></div>
        </div>

        <!-- Manifesto Content -->
        <div class="bg-white rounded-2xl p-8 md:p-12 shadow-sm" data-aos="fade-up" data-aos-delay="100">
          <div class="space-y-6 text-center">
            <p class="text-lg text-gray-700 leading-relaxed italic">
              Where lines meet light,<br>
              and function meets soul,<br>
              you'll find us -<br>
              blending vision with reality &<br>
              creativity with living.
            </p>
            <div class="w-16 h-1 bg-orange-300 mx-auto my-6"></div>
            <p class="text-lg text-gray-700 leading-relaxed">
              Every corner crafted.<br>
              Every piece with purpose.<br>
              Because your space deserves<br>
              more than structure,<br>
              it deserves a story.
            </p>
          </div>
        </div>
      </div>
    </section>

    <!-- What We Do Section -->
    <section class="py-20 px-4 bg-white">
      <div class="max-w-6xl mx-auto">
        <!-- Section Header -->
        <div class="text-center mb-16" data-aos="fade-up">
          <span class="text-orange-500 font-medium text-sm uppercase tracking-wider">Our Services</span>
          <h2 class="text-4xl md:text-5xl font-light text-gray-900 mt-3 tracking-tight">
            <span class="phitagate-font bg-gradient-to-r from-orange-600 via-orange-500 to-orange-400 bg-clip-text text-transparent">
              What We Do
            </span>
          </h2>
          <div class="w-24 h-1 bg-gradient-to-r from-orange-500 to-orange-400 mx-auto mt-6 rounded-full"></div>
          <p class="text-lg text-gray-600 mt-6 max-w-2xl mx-auto">
            We offer comprehensive solutions for all your spatial needs.
          </p>
        </div>

        <!-- Services Grid -->
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          <div v-for="(service, index) in services" :key="index"
               class="bg-gradient-to-br from-orange-50 to-white p-6 rounded-xl border border-orange-100 shadow-sm hover:shadow-md transition-shadow duration-300"
               data-aos="fade-up" :data-aos-delay="100 * (index)">
            <div class="flex items-start space-x-4">
              <div class="flex-shrink-0 w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center">
                <div class="w-4 h-4 bg-orange-500 rounded-full"></div>
              </div>
              <p class="text-gray-700 font-medium leading-relaxed">{{ service }}</p>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- Team Section -->
    <section class="py-20 px-6 bg-gradient-to-br from-orange-50 to-white">
      <div class="max-w-6xl mx-auto">
        <!-- Section Header -->
        <div class="text-center mb-16" data-aos="fade-up">
          <span class="text-orange-500 font-medium text-sm uppercase tracking-wider">Meet Our Experts</span>
          <h2 class="text-4xl md:text-5xl font-light text-gray-900 mt-3 tracking-tight">
            <span class="phitagate-font bg-gradient-to-r from-orange-600 via-orange-500 to-orange-400 bg-clip-text text-transparent">
              Our Team
            </span>
          </h2>
          <div class="w-24 h-1 bg-gradient-to-r from-orange-500 to-orange-400 mx-auto mt-6 rounded-full"></div>
          <p class="text-lg text-gray-600 mt-6 max-w-2xl mx-auto">
            The talented individuals behind our innovative designs and exceptional craftsmanship.
          </p>
        </div>

        <!-- Team Cards Grid -->
        <div class="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div v-for="(member) in teamMembers" :key="member.id"
            data-aos="fade-up" :data-aos-delay="100 * (member.id)">
            <div class="team-card-wrapper relative"
                 @mouseenter="handleMouseEnter(member.id)"
                 @mouseleave="handleMouseLeave">
              <!-- Card -->
              <div class="group relative bg-white rounded-xl shadow-sm overflow-hidden transition-all duration-300 hover:shadow-xl">
                <!-- Card Top with Pattern -->
                <div class="h-32 bg-gradient-to-r from-orange-400 to-orange-500 relative overflow-hidden">
                  <div class="absolute inset-0 opacity-10">
                    <div class="absolute top-0 left-0 w-full h-full bg-repeat" style="background-image: url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyMCIgaGVpZ2h0PSIyMCI+CiAgPGNpcmNsZSBjeD0iMiIgY3k9IjIiIHI9IjEiIGZpbGw9IndoaXRlIi8+Cjwvc3ZnPg=='); background-size: 20px 20px;"></div>
                  </div>
                </div>

                <!-- Profile Image -->
                <div class="flex justify-center -mt-12 relative z-10">
                  <div class="w-24 h-24 rounded-full bg-white p-1 shadow-md">
                    <div class="w-full h-full rounded-full bg-gradient-to-br from-orange-200 to-orange-300 flex items-center justify-center">
                      <div class="w-12 h-12 bg-white rounded-full"></div>
                    </div>
                  </div>
                </div>

                <!-- Card Content -->
                <div class="p-6 pt-4 text-center">
                  <h3 class="text-xl font-semibold text-gray-900 mb-1 group-hover:text-orange-600 transition-colors">
                    {{ member.name }}
                  </h3>
                  <p class="text-orange-500 font-medium text-sm uppercase tracking-wider mb-3">
                    {{ member.role }}
                  </p>
                  <p class="text-gray-600 text-sm leading-relaxed">
                    {{ member.description }}
                  </p>

                  <!-- Social Links -->
                  <div class="flex justify-center space-x-3 mt-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    <a href="#" class="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center hover:bg-orange-100 transition-colors">
                      <svg class="w-4 h-4 text-gray-600 hover:text-orange-500" fill="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path d="M12 2C6.477 2 2 6.477 2 12c0 4.42 2.865 8.17 6.839 9.49.5.092.682-.217.682-.482 0-.237-.008-.866-.013-1.7-2.782.603-3.369-1.34-3.369-1.34-.454-1.156-1.11-1.463-1.11-1.463-.908-.62.069-.608.069-.608 1.003.07 1.531 1.03 1.531 1.03.892 1.529 2.341 1.087 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.11-4.555-4.943 0-1.091.39-1.984 1.029-2.683-.103-.253-.446-1.27.098-2.647 0 0 .84-.269 2.75 1.025A9.578 9.578 0 0112 6.836c.85.004 1.705.114 2.504.336 1.909-1.294 2.747-1.025 2.747-1.025.546 1.377.203 2.394.1 2.647.64.699 1.028 1.592 1.028 2.683 0 3.842-2.339 4.687-4.566 4.935.359.309.678.919.678 1.852 0 1.336-.012 2.415-.012 2.743 0 .267.18.578.688.48C19.138 20.167 22 16.418 22 12c0-5.523-4.477-10-10-10z"/>
                      </svg>
                    </a>
                    <a href="#" class="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center hover:bg-orange-100 transition-colors">
                      <svg class="w-4 h-4 text-gray-600 hover:text-orange-500" fill="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"/>
                      </svg>
                    </a>
                  </div>
                </div>
              </div>

              <!-- Detailed Tooltip -->
              <div v-show="hoveredMember === member.id"
                   class="absolute z-50 w-[500px] bg-white rounded-xl shadow-2xl border border-orange-100 overflow-hidden"
                   :class="getTooltipPosition(member.id)"
                   data-aos="fade-up">
                <div class="flex flex-col md:flex-row h-full">
                  <!-- Top/Left side - Profile Visual -->
                  <div class="w-full md:w-1/3 bg-gradient-to-br from-orange-100 to-orange-200 flex flex-col items-center justify-center p-6">
                    <div class="mb-4 text-center">
                      <div class="w-32 h-32 rounded-full bg-white p-2 shadow-lg mx-auto mb-4">
                        <div class="w-full h-full rounded-full bg-gradient-to-br from-orange-300 to-orange-400 flex items-center justify-center">
                          <span class="text-white text-3xl font-bold">{{ getInitials(member.name) }}</span>
                        </div>
                      </div>
                      <h3 class="text-lg font-bold text-gray-900">{{ member.name }}</h3>
                      <p class="text-orange-600 font-medium text-sm uppercase tracking-wider">{{ member.role }}</p>
                    </div>
                  </div>

                  <!-- Right/Bottom side - Content -->
                  <div class="w-full md:w-2/3 p-6 overflow-y-auto max-h-[400px] custom-scrollbar">
                    <div class="prose prose-sm max-w-none">
                      <div class="whitespace-pre-line text-gray-700 leading-relaxed" v-html="formatBio(member.detailedBio)"></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- Call to Action Section -->
    <section class="py-20 px-4 bg-gradient-to-r from-orange-500 to-orange-600">
      <div class="max-w-4xl mx-auto text-center">
        <h2 class="text-3xl md:text-4xl font-light text-white mb-6" data-aos="fade-up">
          Ready to Transform Your Space?
        </h2>
        <p class="text-xl text-orange-100 mb-8 max-w-2xl mx-auto" data-aos="fade-up" data-aos-delay="100">
          Discover our collection and find the perfect pieces that reflect your style and personality.
        </p>
        <div class="flex flex-col sm:flex-row justify-center gap-4" data-aos="fade-up" data-aos-delay="200">
          <button class="px-8 py-3 bg-white text-orange-600 font-medium rounded-lg hover:bg-orange-50 transition-colors duration-300 shadow-md" @click="() => window.location.href = '/shop'">
            Explore Our Collection
          </button>
          <button class="px-8 py-3 bg-transparent border-2 border-white text-white font-medium rounded-lg hover:bg-white/10 transition-colors duration-300" @click="() => window.location.href = '/shop'">
            Contact Our Team
          </button>
        </div>
      </div>
    </section>
  </div>
</template>

<script setup>
import { ref, onMounted, watch } from 'vue'
import AOS from 'aos'
import 'aos/dist/aos.css'

// Team members data
const teamMembers = ref([
  {
    id: 1,
    name: "Ar. Thaini Jentra",
    nickname: "Jeni",
    role: "Managing Partner & Founder",
    description: "Architect with 3 years of experience in design",
    detailedBio: `Hello, I'm Jeni

I'm an architect with 3 years of experience in this field, and I genuinely enjoy the hands-on side of design, especially bringing ideas to life through thoughtful execution. I'm a naturally curious person, always exploring new tools, materials, and ways to improve what I do. I love turning creative concepts into practical, buildable solutions that are both smart and meaningful.

Architectural Perspective:
For me, architecture is all about creating smart, simple spaces that work well and feel good to live in. I'm drawn to designs that are minimalist, budget-friendly, and kind to the environment. I believe that with the right ideas and materials, we can build spaces that are both beautiful and practical, without overcomplicating things. Sometimes, the simplest designs speak the loudest—when they're made with care and purpose.`
  },
  {
    id: 2,
    name: "J. Jeffrina",
    nickname: "Jeffy",
    role: "Co-Founder & Financial Manager",
    description: "MBA graduate with a passion for business growth",
    detailedBio: `Hello, I'm Jeffy

I'm an MBA graduate with a passion for driving business growth through strategic financial planning. As the Co-Founder of our startup, I oversee financial operations, manage investments, and ensure we're on a path to sustainable success. My journey combines academic excellence with hands-on experience, allowing me to turn numbers into actionable insights that shape our future.

Architectural Perspective:
I don't come from an architecture background, but I've always been fascinated by the way spaces make us feel. To me, architecture isn't just about buildings or blueprints—it's about stories. Every wall, every window, every curve has a purpose, even if you don't see it at first. I approach it with the eyes of an outsider, which I think is my strength. Technical rules do not bind me; I see the beauty, the emotion, and the human experience behind the structures. It's like listening to a song in a language you don't speak—you may not know every word, but you feel its meaning.`
  }
])

// State for tooltip
const hoveredMember = ref(null)
const tooltipTimeout = ref(null)

// Handle mouse enter with immediate show
const handleMouseEnter = (memberId) => {
  if (tooltipTimeout.value) {
    clearTimeout(tooltipTimeout.value)
    tooltipTimeout.value = null
  }
  hoveredMember.value = memberId
}

// Handle mouse leave with delay
const handleMouseLeave = () => {
  tooltipTimeout.value = setTimeout(() => {
    hoveredMember.value = null
  }, 300) // 300ms delay before hiding
}

watch(hoveredMember, (newVal) => {
  console.log("hoveredMember changed:", newVal);
});

// Format bio text for better display
const formatBio = (bio) => {
  return bio.replace(/\n\n/g, '</p><p class="mt-4">')
            .replace(/\n/g, '<br>')
            .replace(/^(.+)$/gm, '<p>$1</p>')
            .replace(/<p>Architectural Perspective:<\/p>/g, '<h4 class="font-semibold text-orange-600 mt-6 mb-2">Architectural Perspective:</h4>')
}

// Get initials from name
const getInitials = (name) => {
  return name.split(' ').map(word => word.charAt(0)).join('').substring(0, 2)
}

// Get tooltip position based on member ID
const getTooltipPosition = (id) => {
  // Position tooltips in different locations to avoid screen edge issues
  switch(id) {
    case 1:
      return 'left-full top-0 ml-4' // Right side
    case 2:
      return 'right-full top-0 mr-4' // Left side
    default:
      return 'left-full top-0 ml-4' // Default right side
  }
}

// Services data
const services = ref([
  "Architecture & Planning",
  "Construction & Project Execution",
  "Interior Design & Styling",
  "Custom Furniture Design & Manufacturing",
  "Turnkey Décor Solutions"
])

onMounted(() => {
  AOS.init({
    duration: 800,
    easing: 'ease-out-cubic',
    once: true,
    offset: 100,
    disable: 'phone'
  })
})
</script>

<style scoped>
/* Import Google Fonts */
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap');

/* Font Face Definition */
@font-face {
  font-family: 'Phitagate';
  src: url('/fonts/Phitagate.otf') format('opentype');
  font-display: swap;
}

.phitagate-font {
  font-family: 'Phitagate', serif;
  font-feature-settings: 'kern' 1, 'liga' 1;
}

/* Base Typography */
* {
  font-family: 'Inter', sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

/* Custom Scrollbar Styling */
::-webkit-scrollbar {
  width: 6px;
}

::-webkit-scrollbar-track {
  background: #f1f1f1;
}

::-webkit-scrollbar-thumb {
  background: #ea580c;
  border-radius: 3px;
}

::-webkit-scrollbar-thumb:hover {
  background: #f97316;
}

/* Smooth Transitions */
* {
  transition-property: transform, opacity, background-color, border-color, color, box-shadow;
  transition-duration: 300ms;
  transition-timing-function: ease-out;
}

/* Custom Animations */
@keyframes pulse-slow {
  0%, 100% {
    opacity: 0.4;
    transform: scale(1);
  }
  50% {
    opacity: 0.6;
    transform: scale(1.05);
  }
}

@keyframes float {
  0%, 100% {
    transform: translateY(0) translateX(0);
  }
  25% {
    transform: translateY(-10px) translateX(5px);
  }
  50% {
    transform: translateY(0) translateX(10px);
  }
  75% {
    transform: translateY(10px) translateX(5px);
  }
}

@keyframes float-reverse {
  0%, 100% {
    transform: translateY(0) translateX(0);
  }
  25% {
    transform: translateY(10px) translateX(-5px);
  }
  50% {
    transform: translateY(0) translateX(-10px);
  }
  75% {
    transform: translateY(-10px) translateX(-5px);
  }
}

/* Animation Classes */
.animate-pulse-slow {
  animation: pulse-slow 8s ease-in-out infinite;
}

.animate-float {
  animation: float 12s ease-in-out infinite;
}

.animate-float-reverse {
  animation: float-reverse 14s ease-in-out infinite;
}

/* Interactive Elements Styling */
button {
  transition: all 0.3s cubic-bezier(0.23, 1, 0.320, 1);
}

button:focus {
  outline: 2px solid #f97316;
  outline-offset: 2px;
}

/* Card Hover Effects */
.group {
  transition: transform 0.3s ease, box-shadow 0.3s ease;
}

.group:hover {
  transform: translateY(-5px);
  box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
}

.group:hover .flex-shrink-0 {
  transform: scale(1.25);
}

/* Tooltip Styles */
@media (min-width: 1024px) {
  .team-card-wrapper .absolute.z-50 {
    opacity: 0;
    visibility: hidden;
    transition: opacity 0.3s ease, visibility 0.3s ease;
    pointer-events: none;
  }

  .team-card-wrapper:hover .absolute.z-50 {
    opacity: 1;
    visibility: visible;
    pointer-events: auto;
  }
}

/* Mobile Tooltip Adjustments */
@media (max-width: 1023px) {
  .team-card-wrapper .absolute.z-50 {
    display: none !important;
  }
}

/* Custom scrollbar for tooltip content */
.custom-scrollbar::-webkit-scrollbar {
  width: 6px;
}

.custom-scrollbar::-webkit-scrollbar-track {
  background: #f1f1f1;
  border-radius: 3px;
}

.custom-scrollbar::-webkit-scrollbar-thumb {
  background: #ea580c;
  border-radius: 3px;
}

.custom-scrollbar::-webkit-scrollbar-thumb:hover {
  background: #f97316;
}

/* Ensure tooltip stays within viewport and is accessible */
@media (min-width: 1024px) {
  /* For right-side tooltips */
  .team-card-wrapper .absolute.z-50.left-full {
    left: 100%;
    right: auto;
  }

  /* For left-side tooltips */
  .team-card-wrapper .absolute.z-50.right-full {
    right: 100%;
    left: auto;
  }

  /* Add a slight delay before hiding to allow mouse movement to tooltip */
  .team-card-wrapper {
    transition: none;
  }

  .team-card-wrapper:hover {
    transition: none;
  }

  /* Make tooltip content easier to interact with */
  .team-card-wrapper .absolute.z-50 .prose {
    font-size: 0.95rem;
    line-height: 1.6;
  }

  .team-card-wrapper .absolute.z-50 .prose p {
    margin-bottom: 0.75rem;
  }

  .team-card-wrapper .absolute.z-50 .prose h4 {
    margin-top: 1.25rem;
    margin-bottom: 0.5rem;
  }
}

/* Tooltip content styling */
.prose h4 {
  margin-top: 1.5rem;
  margin-bottom: 0.75rem;
  font-weight: 600;
  color: #ea580c;
}

.prose p {
  margin-bottom: 1rem;
  line-height: 1.6;
}

/* Responsive Adjustments */
@media (max-width: 768px) {
  .animate-float, .animate-float-reverse {
    animation-duration: 20s;
  }
}
</style>
