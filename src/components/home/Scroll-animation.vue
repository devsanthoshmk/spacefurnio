<template>
  <section ref="productsSection" class="products-section">
    <div id="text-1" class="floating-text entering">Where lines meet light</div>
    <div id="text-2" class="floating-text entering">and functions meet soul</div>
    <div id="text-3" class="floating-text entering" :class="{ hidden: isHidden }">you'll find us</div>

    <div ref="productsGrid" id="products-grid" class="products-grid rounded-xl">
      <div class="bg-layer current" id="bg-layer-1"></div>
      <div class="bg-layer next"    id="bg-layer-2"></div>
      <div class="fade-overlay"     id="fade-overlay"></div>
    </div>
  </section>
</template>

<script setup>
import { ref, onMounted,onUnmounted } from 'vue'
import ScrollAnimationController from '@/utils/ScrollAnimationController.js'

const productsSection = ref(null);
const productsGrid = ref(null);
const isHidden = ref(false);

const checkVisibility = () => {
  if (productsGrid.value) {
    const top = productsGrid.value.getBoundingClientRect().top;
    isHidden.value = top < -150;
    console.log('Section visibility:', isHidden.value, top);
  }
};

onMounted(() => {
  window.addEventListener('scroll', checkVisibility);
  checkVisibility(); // Check initially
});

onUnmounted(() => {
  window.removeEventListener('scroll', checkVisibility);
});


onMounted(() => {
  // instantiate with the <section> DOM node
  new ScrollAnimationController(productsSection.value)
  // If your class auto‑binds scroll in its constructor, you're done.
  // Otherwise you could do:
  // window.addEventListener('scroll', controller.handleScroll)
})

</script>


    <style scoped>
        /* Products Section Styles */
        .products-section {
            position: relative;
            min-height: 400vh;
            background: linear-gradient(135deg, #fffdf6 0%, #f8f6f0 100%);
        }

        .products-grid {
            position: sticky;
            top: 0;
            height: 100vh;
            margin: 0 auto;
            background-size: cover;
            background-position: center;
            background-repeat: no-repeat;
            overflow: hidden;
        }

        /* Dual layer system for smooth transitions */
        .bg-layer {
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background-size: cover;
            background-position: center;
            background-repeat: no-repeat;
            transition: all 1.5s cubic-bezier(0.25, 0.46, 0.45, 0.94);
        }

        .bg-layer.current {
            opacity: 1;
            filter: blur(0px);
            transform: scale(1);
        }

        .bg-layer.blurred {
            filter: blur(15px) brightness(0.7);
            transform: scale(1.05);
        }

        .bg-layer.next {
            opacity: 0;
            filter: blur(0px);
            transform: scale(1.1);
        }

        .bg-layer.transitioning-in {
            opacity: 1;
            transform: scale(1);
            filter: blur(0px);
        }

        .floating-text {
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            z-index: 100;
            font-family: 'Playfair Display', serif;
            font-size: clamp(2.5rem, 8vw, 6rem);
            font-weight: 700;
            color: #fff;
            text-align: center;
            opacity: 0;
            transition: all 1.8s cubic-bezier(0.25, 0.46, 0.45, 0.94);
            pointer-events: none;
            text-shadow: 0 8px 32px rgba(0, 0, 0, 0.6);
            letter-spacing: -0.02em;
            line-height: 1.1;
        }

        .floating-text.appear {
            opacity: 1;
            transform: translate(-50%, -50%) translateY(0) scale(1);
            filter: blur(0px);
        }

        .floating-text.entering {
            opacity: 0;
            transform: translate(-50%, -50%) translateY(60px) scale(0.8);
            filter: blur(3px);
        }

        .floating-text.leaving {
            opacity: 0;
            transform: translate(-50%, -50%) translateY(-60px) scale(1.1);
            filter: blur(5px);
        }

        /* Elegant fade overlay for transitions */
        .fade-overlay {
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: linear-gradient(45deg, rgba(44, 62, 80, 0.1) 0%, rgba(230, 126, 34, 0.1) 100%);
            opacity: 0;
            transition: opacity 1.2s ease;
            z-index: 5;
        }

        .fade-overlay.active {
            opacity: 1;
        }

        /* Breathing animation for text */
        @keyframes breathe {

            0%,
            100% {
                transform: translate(-50%, -50%) scale(1);
            }

            50% {
                transform: translate(-50%, -50%) scale(1.02);
            }
        }

        .floating-text.breathing {
            animation: breathe 4s ease-in-out infinite;
        }

        /* Mobile responsiveness */
        @media (max-width: 768px) {
            .floating-text {
                font-size: clamp(2rem, 10vw, 4rem);
                padding: 0 1rem;
            }

            .products-section {
                min-height: 400vh;
            }
        }

        /* Performance optimizations */
        .products-grid {
            will-change: transform;
            backface-visibility: hidden;
            -webkit-backface-visibility: hidden;
        }

        .bg-layer {
            will-change: opacity, filter, transform;
            backface-visibility: hidden;
            -webkit-backface-visibility: hidden;
        }

        .floating-text {
            will-change: opacity, transform, filter;
            backface-visibility: hidden;
            -webkit-backface-visibility: hidden;
        }
    </style>

