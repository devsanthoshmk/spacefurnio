<template>
  <section class="hero relative w-full overflow-hidden min-h-screen bg-[#f7f3ea] font-['DM_Sans'] text-[#1a1a1a]">
    <!-- Background/Main Wrapper -->
    <div class="hero-wrapper relative w-full min-h-screen flex items-center justify-center p-5">
      
      <!-- Arc + Content Container -->
      <div class="arc-content-container relative max-w-full max-h-[90vh]">
        
        <!-- Arc Pivot for the cards -->
        <div class="arc-pivot absolute left-1/2 top-1/2 w-0 h-0 z-10">
          <div 
            v-for="(image, index) in images" 
            :key="index"
            class="spoke absolute left-0 top-0 origin-top-left"
            :style="{ '--angle': `${calculateAngle(index)}deg` }"
          >
            <a 
              href="#" 
              class="card block overflow-hidden bg-[#e8e4dc] shadow-[0_8px_30px_rgba(0,0,0,0.12)] hover:shadow-[0_12px_40px_rgba(0,0,0,0.2)] hover:scale-105 transition-all duration-300 ease-out"
              v-animateonscroll="{ enterClass: 'animate__fadeInDown', delay: index * 100 }"
            >
              <img 
                :src="image.src" 
                :alt="image.alt"
                class="block w-full h-full object-cover object-[center_20%]"
                loading="lazy"
              >
            </a>
          </div>
        </div>

        <!-- Center Content -->
        <div class="hero-content absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-center w-[90%] max-w-[480px] px-[15px] z-20">
          
          <!-- Rating Section -->
          <div 
            class="rating-section flex flex-col items-center gap-[2px] mb-[clamp(12px,2vw,20px)]"
            v-animateonscroll="{ enterClass: 'animate__fadeInUp' }"
          >
            <div class="stars flex gap-[2px] text-[length:clamp(14px,1.8vw,20px)]">
              <span v-for="n in 4" :key="n" class="star text-[#d4a12a]">★</span>
              <span class="star half relative text-[#ddd8ce]">
                <span class="absolute left-0 top-0 w-[60%] overflow-hidden text-[#d4a12a]">★</span>
                ★
              </span>
            </div>
            <span class="rating-text text-[length:clamp(11px,1.3vw,14px)] font-semibold text-[#c9a83d] mt-[3px]">4.9 ratings</span>
            <span class="trust-text text-[length:clamp(10px,1.2vw,12px)] text-[#a09a8e] tracking-wide">Trusted by 1,000+ designers</span>
          </div>

          <!-- Headline -->
          <div 
            class="headline mb-[clamp(8px,1.5vw,14px)]"
            v-animateonscroll="{ enterClass: 'animate__fadeInUp', delay: 100 }"
          >
            <h1 class="headline-main font-['Playfair_Display',Georgia,serif] text-[length:var(--headline-size)] font-bold leading-[1.1] text-[#1a1a1a] m-0 tracking-[-0.02em]">
              Ready to Power Up
            </h1>
            <span class="headline-italic font-['Playfair_Display',Georgia,serif] text-[length:var(--headline-size)] font-medium italic leading-[1.1] text-[#1a1a1a] block tracking-[-0.01em]">
              Your Team?
            </span>
          </div>

          <!-- Subtext -->
          <p 
            class="subtext text-[length:var(--subtext-size)] leading-[1.65] text-[#706b63] max-w-[420px] mx-auto mb-[clamp(16px,2.8vw,28px)] font-normal"
            v-animateonscroll="{ enterClass: 'animate__fadeInUp', delay: 200 }"
          >
            Join thousands of teams boosting productivity with smarter tools, faster workflows,
            and better collaboration.
          </p>

          <!-- CTA Button -->
          <a 
            href="#" 
            class="cta-button inline-flex items-center gap-[clamp(6px,1vw,12px)] bg-[#1f1f1f] text-white font-['DM_Sans'] text-[length:var(--button-size)] font-medium py-[clamp(9px,1.2vw,14px)] px-[clamp(14px,2vw,22px)] pl-[clamp(16px,2.2vw,24px)] rounded-[50px] border-none cursor-pointer no-underline transition-all duration-250 ease-out hover:bg-[#333] hover:-translate-y-px active:scale-95"
            v-animateonscroll="{ enterClass: 'animate__fadeInUp', delay: 300 }"
          >
            Get started for Free
            <span class="cta-arrow flex items-center justify-center w-[clamp(20px,2.5vw,28px)] h-[clamp(20px,2.5vw,28px)] bg-white/10 rounded-full shrink-0">
              <svg viewBox="0 0 24 24" class="w-[clamp(10px,1.3vw,14px)] h-[clamp(10px,1.3vw,14px)] stroke-current stroke-2 fill-none">
                <path d="M5 12h14M12 5l7 7-7 7" stroke-linecap="round" stroke-linejoin="round" />
              </svg>
            </span>
          </a>

        </div>
      </div>
    </div>
  </section>
</template>

<script setup>
import { computed } from 'vue';

// Image data as requested
const images = [
  { src: 'https://picsum.photos/seed/curly-woman-teal/400/520', alt: 'Team member 1' },
  { src: 'https://picsum.photos/seed/asian-coat-woman/400/520', alt: 'Team member 2' },
  { src: 'https://picsum.photos/seed/yellow-jacket-woman/400/520', alt: 'Team member 3' },
  { src: 'https://picsum.photos/seed/purple-shirt-man/400/520', alt: 'Team member 4' },
  { src: 'https://picsum.photos/seed/pointing-woman-gray/400/520', alt: 'Team member 5' },
  { src: 'https://picsum.photos/seed/smiling-woman-blue/400/520', alt: 'Team member 6' },
  { src: 'https://picsum.photos/seed/casual-pink-man/400/520', alt: 'Team member 7' }
];

const count = images.length;
const step = 180 / (count - 1);

const calculateAngle = (index) => {
  return step * index;
};
</script>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600&family=Playfair+Display:ital,wght@0,500;0,600;1,500&display=swap');

:root {
  /* Base Defaults */
  --radius: min(38vw, 420px);
  --card-width: clamp(65px, 10vw, 120px);
  --card-height: clamp(85px, 13vw, 155px);
  --card-radius: clamp(12px, 2vw, 22px);
  
  /* Typography Variables - refined for better visual hierarchy */
  --headline-size: clamp(28px, 6vw, 52px);
  --subtext-size: clamp(12px, 1.5vw, 16px);
  --button-size: clamp(12px, 1.4vw, 15px);
}

.hero {
  /* Ensure variables penetrate */
  font-family: 'DM Sans', system-ui, -apple-system, sans-serif;
}

/* Arc Layout System */
.arc-content-container {
  width: calc(var(--radius) * 2 + var(--card-width));
  height: calc(var(--radius) * 2);
}

.arc-pivot {
  transform: translateY(clamp(15px, 3vw, 40px));
}

.spoke {
  transform: rotate(calc(var(--angle) - 90deg));
}

.card {
  width: var(--card-width);
  height: var(--card-height);
  border-radius: var(--card-radius);
  /* The core positioning logic */
  transform: translateX(-50%) translateY(calc(-1 * var(--radius)));
}

/* Hover effect needs to be specific enough or use Tailwind group-hover, 
   but since transform is complex, standard CSS is safer here */
.card:hover {
  transform: translateX(-50%) translateY(calc(-1 * var(--radius))) scale(1.04);
}

.hero-content {
  margin-top: clamp(40px, 7vw, 80px);
}

/* Responsive Media Queries - mirroring the HTML logic */
/* Extra Large Screens (1440px+) */
@media (min-width: 1440px) {
  .hero {
    --radius: 420px;
    --card-width: 125px;
    --card-height: 160px;
    --card-radius: 22px;
    --headline-size: 52px;
    --subtext-size: 16px;
    --button-size: 15px;
  }
  .hero-content { max-width: 560px; }
}

/* Large Screens (1200px - 1439px) */
@media (max-width: 1439px) and (min-width: 1200px) {
  .hero {
    --radius: 380px;
    --card-width: 115px;
    --card-height: 150px;
    --card-radius: 20px;
    --headline-size: 46px;
    --subtext-size: 15px;
    --button-size: 14px;
  }
}

/* Medium-Large Screens (1024px - 1199px) */
@media (max-width: 1199px) and (min-width: 1024px) {
  .hero {
    --radius: 340px;
    --card-width: 105px;
    --card-height: 138px;
    --card-radius: 18px;
    --headline-size: 40px;
    --subtext-size: 14px;
    --button-size: 14px;
  }
}

/* Medium-Large Tablets (900px - 1023px) */
@media (max-width: 1023px) and (min-width: 900px) {
  .hero {
    --radius: 180px;
    --card-width: 65px;
    --card-height: 85px;
    --card-radius: 13px;
    --headline-size: 34px;
    --subtext-size: 13px;
    --button-size: 13px;
  }
  .arc-pivot { transform: translateY(-20px); }
  .hero-content { margin-top: 120px; max-width: 400px; }
  .subtext { max-width: 340px; }
}

/* Medium Screens / Tablets (768px - 899px) */
@media (max-width: 899px) and (min-width: 768px) {
  .hero {
    --radius: 165px;
    --card-width: 60px;
    --card-height: 78px;
    --card-radius: 12px;
    --headline-size: 32px;
    --subtext-size: 13px;
    --button-size: 13px;
  }
  .arc-pivot { transform: translateY(-25px); }
  .hero-content { margin-top: 110px; max-width: 380px; }
  .subtext { max-width: 320px; }
}

/* Small Tablets / Large Phones (600px - 767px) */
@media (max-width: 767px) and (min-width: 600px) {
  .hero {
    --radius: 155px;
    --card-width: 56px;
    --card-height: 73px;
    --card-radius: 11px;
    --headline-size: 30px;
    --subtext-size: 12px;
    --button-size: 12px;
  }
  .arc-pivot { transform: translateY(-30px); }
  .hero-content { margin-top: 100px; max-width: 360px; }
  .subtext { max-width: 300px; }
}

/* Phones (480px - 599px) */
@media (max-width: 599px) and (min-width: 480px) {
  .hero {
    --radius: 140px;
    --card-width: 50px;
    --card-height: 65px;
    --card-radius: 10px;
    --headline-size: 28px;
    --subtext-size: 12px;
    --button-size: 12px;
  }
  .arc-pivot { transform: translateY(-35px); }
  .hero-content { margin-top: 90px; width: 95%; max-width: 340px; }
  .subtext { max-width: 280px; }
}

/* Small Phones (360px - 479px) */
@media (max-width: 479px) and (min-width: 360px) {
  .hero {
    --radius: 120px;
    --card-width: 44px;
    --card-height: 58px;
    --card-radius: 9px;
    --headline-size: 26px;
    --subtext-size: 11px;
    --button-size: 11px;
  }
  .arc-pivot { transform: translateY(-40px); }
  .hero-wrapper { padding: 15px 10px; }
  .hero-content { margin-top: 80px; width: 100%; padding: 0 10px; max-width: 320px; }
  .subtext { max-width: 260px; }
}

/* Extra Small Phones (< 360px) */
@media (max-width: 359px) {
  .hero {
    --radius: 100px;
    --card-width: 38px;
    --card-height: 50px;
    --card-radius: 8px;
    --headline-size: 24px;
    --subtext-size: 11px;
    --button-size: 11px;
  }
  .arc-pivot { transform: translateY(-45px); }
  .hero-wrapper { padding: 10px 8px; }
  .hero-content { margin-top: 70px; width: 100%; padding: 0 8px; max-width: 300px; }
  .subtext { max-width: 250px; }
  .cta-button { padding: 8px 12px 8px 14px; }
}

/* Landscape Mode on Mobile */
@media (max-height: 500px) and (orientation: landscape) {
  .hero {
    --radius: min(35vh, 180px);
    --card-width: min(12vh, 65px);
    --card-height: min(16vh, 85px);
  }
  .hero-wrapper { padding: 10px; }
  .hero-content { margin-top: 20px; }
  .rating-section { margin-bottom: 8px; }
  .headline { margin-bottom: 6px; }
  .subtext { margin-bottom: 10px; }
}

/* Very Tall Screens */
@media (min-height: 900px) and (min-width: 768px) {
  .hero-content {
    margin-top: clamp(50px, 8vh, 90px);
  }
}
</style>
