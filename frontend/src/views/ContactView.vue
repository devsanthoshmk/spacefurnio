<script setup>
import { ref, reactive } from 'vue';
import InputText from 'primevue/inputtext';
import Textarea from 'primevue/textarea';
import Button from 'primevue/button';
import FooterComponent from '@/components/Footer-component.vue';

// Form state
const form = reactive({
  title: '',
  email: '',
  subject: '',
  description: ''
});

const isSubmitting = ref(false);
const isSubmitted = ref(false);
const errors = reactive({
  title: '',
  email: '',
  subject: '',
  description: ''
});

// Validation
const validateEmail = (email) => {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(email);
};

const validateForm = () => {
  let isValid = true;
  
  // Reset errors
  Object.keys(errors).forEach(key => errors[key] = '');
  
  if (!form.title.trim()) {
    errors.title = 'Please enter your name';
    isValid = false;
  }
  
  if (!form.email.trim()) {
    errors.email = 'Please enter your email';
    isValid = false;
  } else if (!validateEmail(form.email)) {
    errors.email = 'Please enter a valid email address';
    isValid = false;
  }
  
  if (!form.subject.trim()) {
    errors.subject = 'Please enter a subject';
    isValid = false;
  }
  
  if (!form.description.trim()) {
    errors.description = 'Please enter your message';
    isValid = false;
  } else if (form.description.trim().length < 10) {
    errors.description = 'Message must be at least 10 characters';
    isValid = false;
  }
  
  return isValid;
};

const handleSubmit = async () => {
  if (!validateForm()) return;
  
  isSubmitting.value = true;
  
  // Simulate API call
  await new Promise(resolve => setTimeout(resolve, 1500));
  
  console.log('Form submitted:', form);
  isSubmitting.value = false;
  isSubmitted.value = true;
  
  // Reset form after successful submission
  Object.keys(form).forEach(key => form[key] = '');
};

const resetForm = () => {
  isSubmitted.value = false;
  Object.keys(form).forEach(key => form[key] = '');
  Object.keys(errors).forEach(key => errors[key] = '');
};
</script>

<template>
  <div class="min-h-screen bg-gradient-to-b from-[#fff4ec] via-[#fef7f1] to-[#f5f1ed]">
    <!-- Hero Section -->
    <section class="relative pt-32 pb-16 overflow-hidden">
      <!-- Decorative Elements -->
      <div class="absolute top-0 right-0 w-96 h-96 bg-orange-100/40 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
      <div class="absolute bottom-0 left-0 w-80 h-80 bg-orange-200/30 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2"></div>
      
      <div class="max-w-7xl mx-auto px-6 relative z-10">
        <div class="text-center" data-aos="fade-up" data-aos-duration="800">
          <h1 class="phitagate-font text-5xl md:text-7xl font-bold text-[#5A4A42] mb-4">
            Get in Touch
          </h1>
          <div class="w-24 h-1 bg-gradient-to-r from-orange-400 to-orange-600 mx-auto rounded-full mb-6"></div>
          <p class="text-lg md:text-xl text-gray-600 max-w-2xl mx-auto font-light">
            We'd love to hear from you. Whether you have a question about our services, 
            need design consultation, or want to start a project with us.
          </p>
        </div>
      </div>
    </section>

    <!-- Main Content -->
    <section class="pb-20 px-6">
      <div class="max-w-7xl mx-auto">
        <div class="grid lg:grid-cols-2 gap-12 lg:gap-20">
          
          <!-- Contact Info Side -->
          <div class="order-2 lg:order-1" data-aos="fade-right" data-aos-duration="800" data-aos-delay="200">
            <div class="bg-black rounded-3xl p-8 md:p-12 text-white h-full relative overflow-hidden">
              <!-- Decorative Pattern -->
              <div class="absolute top-0 right-0 w-64 h-64 opacity-5">
                <svg viewBox="0 0 200 200" fill="currentColor">
                  <circle cx="100" cy="100" r="80" stroke="white" stroke-width="0.5" fill="none" />
                  <circle cx="100" cy="100" r="60" stroke="white" stroke-width="0.5" fill="none" />
                  <circle cx="100" cy="100" r="40" stroke="white" stroke-width="0.5" fill="none" />
                </svg>
              </div>
              
              <h2 class="font-serif text-3xl md:text-4xl font-bold mb-8">
                Contact Information
              </h2>
              
              <div class="space-y-8">
                <!-- Address -->
                <div class="flex items-start gap-4 group">
                  <div class="w-12 h-12 rounded-xl bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform duration-300">
                    <i class="pi pi-map-marker text-xl"></i>
                  </div>
                  <div>
                    <h3 class="font-semibold text-lg mb-1">Our Office</h3>
                    <p class="text-gray-300 leading-relaxed">
                      90/1, North Beach Road<br />
                      Tuticorin, Chennai – 628001
                    </p>
                  </div>
                </div>
                
                <!-- Phone -->
                <div class="flex items-start gap-4 group">
                  <div class="w-12 h-12 rounded-xl bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform duration-300">
                    <i class="pi pi-phone text-xl"></i>
                  </div>
                  <div>
                    <h3 class="font-semibold text-lg mb-1">Call Us</h3>
                    <a href="tel:+919751112025" class="text-gray-300 hover:text-orange-400 transition-colors duration-300">
                      +91 97511 12025
                    </a>
                  </div>
                </div>
                
                <!-- Email -->
                <div class="flex items-start gap-4 group">
                  <div class="w-12 h-12 rounded-xl bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform duration-300">
                    <i class="pi pi-envelope text-xl"></i>
                  </div>
                  <div>
                    <h3 class="font-semibold text-lg mb-1">Email Us</h3>
                    <a href="mailto:info.spacefurnio@gmail.com" class="text-gray-300 hover:text-orange-400 transition-colors duration-300 break-all">
                      info.spacefurnio@gmail.com
                    </a>
                  </div>
                </div>
                
                <!-- Working Hours -->
                <div class="flex items-start gap-4 group">
                  <div class="w-12 h-12 rounded-xl bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform duration-300">
                    <i class="pi pi-clock text-xl"></i>
                  </div>
                  <div>
                    <h3 class="font-semibold text-lg mb-1">Working Hours</h3>
                    <p class="text-gray-300">
                      Mon - Sat: 9:00 AM - 6:00 PM<br />
                      Sunday: Closed
                    </p>
                  </div>
                </div>
              </div>
              
              <!-- Social Links -->
              <div class="mt-12 pt-8 border-t border-gray-700">
                <h3 class="font-semibold text-lg mb-4">Follow Us</h3>
                <div class="flex gap-3">
                  <a href="#" class="w-10 h-10 rounded-full border border-gray-600 flex items-center justify-center hover:bg-gradient-to-br hover:from-orange-400 hover:to-orange-600 hover:border-transparent transition-all duration-300">
                    <i class="pi pi-facebook"></i>
                  </a>
                  <a href="#" class="w-10 h-10 rounded-full border border-gray-600 flex items-center justify-center hover:bg-gradient-to-br hover:from-orange-400 hover:to-orange-600 hover:border-transparent transition-all duration-300">
                    <i class="pi pi-instagram"></i>
                  </a>
                  <a href="#" class="w-10 h-10 rounded-full border border-gray-600 flex items-center justify-center hover:bg-gradient-to-br hover:from-orange-400 hover:to-orange-600 hover:border-transparent transition-all duration-300">
                    <i class="pi pi-linkedin"></i>
                  </a>
                  <a href="#" class="w-10 h-10 rounded-full border border-gray-600 flex items-center justify-center hover:bg-gradient-to-br hover:from-orange-400 hover:to-orange-600 hover:border-transparent transition-all duration-300">
                    <i class="pi pi-twitter"></i>
                  </a>
                </div>
              </div>
            </div>
          </div>
          
          <!-- Form Side -->
          <div class="order-1 lg:order-2" data-aos="fade-left" data-aos-duration="800" data-aos-delay="400">
            <div class="bg-white rounded-3xl shadow-2xl shadow-orange-100/50 p-8 md:p-12">
              
              <!-- Success State -->
              <div v-if="isSubmitted" class="text-center py-12">
                <div class="w-20 h-20 mx-auto mb-6 rounded-full bg-gradient-to-br from-green-400 to-green-600 flex items-center justify-center animate-bounce-once">
                  <i class="pi pi-check text-4xl text-white"></i>
                </div>
                <h3 class="font-serif text-2xl md:text-3xl font-bold text-[#5A4A42] mb-4">
                  Message Sent!
                </h3>
                <p class="text-gray-600 mb-8">
                  Thank you for reaching out. We'll get back to you within 24 hours.
                </p>
                <Button 
                  label="Send Another Message" 
                  icon="pi pi-arrow-left"
                  class="bg-gradient-to-r from-orange-400 to-orange-600 border-none text-white px-8 py-3 rounded-full font-medium shadow-lg hover:shadow-xl transform hover:-translate-y-1 transition-all duration-300"
                  @click="resetForm"
                />
              </div>
              
              <!-- Form -->
              <form v-else @submit.prevent="handleSubmit" class="space-y-6">
                <div class="mb-8">
                  <h2 class="font-serif text-3xl md:text-4xl font-bold text-[#5A4A42] mb-2">
                    Send us a Message
                  </h2>
                  <p class="text-gray-500">
                    Fill out the form below and we'll respond shortly.
                  </p>
                </div>
                
                <!-- Name/Title Field -->
                <div class="form-group">
                  <label for="title" class="block text-sm font-semibold text-gray-700 mb-2">
                    Your Name <span class="text-orange-500">*</span>
                  </label>
                  <div class="relative">
                    <span class="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
                      <i class="pi pi-user"></i>
                    </span>
                    <InputText 
                      id="title"
                      v-model="form.title"
                      placeholder="Enter your full name"
                      class="w-full pr-4 py-3 rounded-xl border-2 border-gray-200 focus:border-orange-400 transition-colors duration-300"
                      :class="{ 'border-red-400': errors.title }"
                      :style="{ paddingLeft: '3rem' }"
                    />
                  </div>
                  <small v-if="errors.title" class="text-red-500 mt-1 block">{{ errors.title }}</small>
                </div>
                
                <!-- Email Field -->
                <div class="form-group">
                  <label for="email" class="block text-sm font-semibold text-gray-700 mb-2">
                    Email Address <span class="text-orange-500">*</span>
                  </label>
                  <div class="relative">
                    <span class="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
                      <i class="pi pi-envelope"></i>
                    </span>
                    <InputText 
                      id="email"
                      v-model="form.email"
                      type="email"
                      placeholder="Enter your email address"
                      class="w-full pr-4 py-3 rounded-xl border-2 border-gray-200 focus:border-orange-400 transition-colors duration-300"
                      :class="{ 'border-red-400': errors.email }"
                      :style="{ paddingLeft: '3rem' }"
                    />
                  </div>
                  <small v-if="errors.email" class="text-red-500 mt-1 block">{{ errors.email }}</small>
                </div>
                
                <!-- Subject Field -->
                <div class="form-group">
                  <label for="subject" class="block text-sm font-semibold text-gray-700 mb-2">
                    Subject <span class="text-orange-500">*</span>
                  </label>
                  <div class="relative">
                    <span class="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
                      <i class="pi pi-tag"></i>
                    </span>
                    <InputText 
                      id="subject"
                      v-model="form.subject"
                      placeholder="What is this regarding?"
                      class="w-full pr-4 py-3 rounded-xl border-2 border-gray-200 focus:border-orange-400 transition-colors duration-300"
                      :class="{ 'border-red-400': errors.subject }"
                      :style="{ paddingLeft: '3rem' }"
                    />
                  </div>
                  <small v-if="errors.subject" class="text-red-500 mt-1 block">{{ errors.subject }}</small>
                </div>
                
                <!-- Description/Message Field -->
                <div class="form-group">
                  <label for="description" class="block text-sm font-semibold text-gray-700 mb-2">
                    Your Message <span class="text-orange-500">*</span>
                  </label>
                  <Textarea 
                    id="description"
                    v-model="form.description"
                    rows="5"
                    placeholder="Tell us about your project or inquiry..."
                    class="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-orange-400 transition-colors duration-300 resize-none"
                    :class="{ 'border-red-400': errors.description }"
                  />
                  <small v-if="errors.description" class="text-red-500 mt-1 block">{{ errors.description }}</small>
                </div>
                
                <!-- Submit Button -->
                <div class="pt-4">
                  <Button 
                    type="submit"
                    :label="isSubmitting ? 'Sending...' : 'Send Message'"
                    :icon="isSubmitting ? 'pi pi-spin pi-spinner' : 'pi pi-send'"
                    :disabled="isSubmitting"
                    class="w-full bg-gradient-to-r from-orange-400 to-orange-600 border-none text-white px-8 py-4 rounded-xl font-semibold text-lg shadow-lg hover:shadow-xl transform hover:-translate-y-1 transition-all duration-300 disabled:opacity-70 disabled:cursor-not-allowed disabled:transform-none"
                  />
                </div>
              </form>
            </div>
          </div>
          
        </div>
      </div>
    </section>
    
    <!-- Map Section (Optional Enhancement) -->
    <section class="pb-20 px-6" data-aos="fade-up" data-aos-duration="800">
      <div class="max-w-7xl mx-auto">
        <div class="bg-white rounded-3xl shadow-xl overflow-hidden">
          <div class="aspect-[21/9] bg-gray-100 relative">
            <iframe 
              src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3943.686447361!2d78.1275!3d8.7642!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x0!2zOMKwNDUnNTEuMSJOIDc4wrAwNyczMy4wIkU!5e0!3m2!1sen!2sin!4v1234567890"
              class="w-full h-full border-0"
              allowfullscreen=""
              loading="lazy"
              referrerpolicy="no-referrer-when-downgrade"
            ></iframe>
            <!-- Map Overlay -->
            <div class="absolute bottom-6 left-6 bg-white rounded-2xl shadow-lg px-6 py-4 max-w-sm">
              <div class="flex items-center gap-3">
                <div class="w-10 h-10 rounded-full bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center">
                  <i class="pi pi-map-marker text-white"></i>
                </div>
                <div>
                  <p class="font-semibold text-gray-800">Spacefurnio Office</p>
                  <p class="text-sm text-gray-500">Tuticorin, Tamil Nadu</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
    
    <!-- Footer -->
    <FooterComponent />
  </div>
</template>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;600;700&display=swap');

@font-face {
  font-family: 'Phitagate';
  src: url('/fonts/Phitagate.otf') format('opentype');
}

.phitagate-font {
  font-family: 'Phitagate', serif;
}

.font-serif {
  font-family: 'Playfair Display', serif;
}

/* Input focus styles */
:deep(.p-inputtext:enabled:focus),
:deep(.p-textarea:enabled:focus) {
  box-shadow: 0 0 0 3px rgba(251, 146, 60, 0.2);
  border-color: #fb923c !important;
}

:deep(.p-inputtext),
:deep(.p-textarea) {
  font-family: inherit;
}

/* Button hover animation */
:deep(.p-button) {
  position: relative;
  overflow: hidden;
}

:deep(.p-button)::before {
  content: '';
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.2), transparent);
  transition: left 0.5s;
}

:deep(.p-button:hover)::before {
  left: 100%;
}

/* Custom bounce animation for success icon */
@keyframes bounceOnce {
  0%, 100% {
    transform: scale(1);
  }
  50% {
    transform: scale(1.1);
  }
}

.animate-bounce-once {
  animation: bounceOnce 0.5s ease-out;
}

/* Smooth gradient text */
.gradient-text {
  background: linear-gradient(135deg, #f97316, #ea580c);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

/* Form group focus-within styling */
.form-group:focus-within label {
  color: #ea580c;
}

/* Responsive adjustments */
@media (max-width: 1024px) {
  .grid {
    gap: 2rem;
  }
}

@media (max-width: 640px) {
  :deep(.p-inputtext),
  :deep(.p-textarea) {
    font-size: 16px; /* Prevents zoom on iOS */
  }
}
</style>
