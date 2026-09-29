<template>
  <section
    class="hero relative w-full overflow-hidden min-h-screen bg-[#f7f3ea] font-['DM_Sans'] text-[#1a1a1a]"
  >
    <!-- Background/Main Wrapper -->
    <div
      class="hero-wrapper relative w-full min-h-screen flex items-center justify-center px-4 py-8 sm:p-6 lg:p-8"
    >
      <!-- Arc + Content Container -->
      <div class="arc-content-container relative max-w-full">
        <!-- Arc Pivot for the cards -->
        <div class="arc-pivot absolute left-1/2 w-0 h-0 z-10">
          <div
            v-for="(image, index) in images"
            :key="index"
            class="spoke absolute left-0 top-0 origin-top-left"
            :style="{ '--angle': `${calculateAngle(index)}deg` }"
          >
            <a
              href="#"
              class="card block overflow-hidden bg-[#e8e4dc] shadow-[0_10px_35px_rgba(0,0,0,0.12)] hover:shadow-[0_16px_45px_rgba(0,0,0,0.22)] hover:scale-105 transition-all duration-300 ease-out"
              v-animateonscroll="{ enterClass: 'animate__fadeInDown', delay: index * 100 }"
            >
              <img
                :src="image.src"
                :alt="image.alt"
                class="block w-full h-full object-cover object-[center_20%]"
                loading="lazy"
              />
            </a>
          </div>
        </div>

        <!-- Center Content -->
        <div class="hero-content absolute left-1/2 -translate-x-1/2 text-center w-[90%] px-4 z-20">
          <!-- Rating Section -->
          <div
            class="rating-section flex flex-col items-center gap-1 mb-[clamp(12px,2vw,22px)]"
            v-animateonscroll="{ enterClass: 'animate__fadeInUp' }"
          >
            <div class="stars flex gap-1 text-[length:clamp(15px,2vw,22px)]">
              <span v-for="n in 4" :key="n" class="star text-[#d4a12a]">★</span>
              <span class="star half relative text-[#ddd8ce]">
                <span class="absolute left-0 top-0 w-[60%] overflow-hidden text-[#d4a12a]">★</span>
                ★
              </span>
            </div>
            <span
              class="rating-text text-[length:clamp(12px,1.4vw,15px)] font-semibold text-[#c9a83d] mt-1"
              >4.9 ratings</span
            >
            <span
              class="trust-text text-[length:clamp(11px,1.2vw,13px)] text-[#a09a8e] tracking-wide"
              >Trusted by 1,000+ designers</span
            >
          </div>

          <!-- Headline -->
          <div
            class="headline mb-[clamp(10px,1.6vw,16px)]"
            v-animateonscroll="{ enterClass: 'animate__fadeInUp', delay: 100 }"
          >
            <h1
              class="headline-main font-['Playfair_Display',Georgia,serif] text-[length:var(--headline-size)] font-bold leading-[1.1] text-[#1a1a1a] m-0 tracking-[-0.02em]"
            >
              Ready to Power Up
            </h1>
            <span
              class="headline-italic font-['Playfair_Display',Georgia,serif] text-[length:var(--headline-size)] font-medium italic leading-[1.1] text-[#1a1a1a] block tracking-[-0.01em]"
            >
              Your Team?
            </span>
          </div>

          <!-- Subtext -->
          <p
            class="subtext text-[length:var(--subtext-size)] leading-[1.65] text-[#706b63] max-w-[460px] mx-auto mb-[clamp(18px,3vw,32px)] font-normal"
            v-animateonscroll="{ enterClass: 'animate__fadeInUp', delay: 200 }"
          >
            Join thousands of teams boosting productivity with smarter tools, faster workflows, and
            better collaboration.
          </p>

          <!-- CTA Button -->
          <a
            href="#"
            class="cta-button inline-flex items-center gap-[clamp(8px,1.2vw,14px)] bg-[#1f1f1f] text-white font-['DM_Sans'] text-[length:var(--button-size)] font-medium py-[clamp(10px,1.4vw,16px)] px-[clamp(18px,2.2vw,26px)] pl-[clamp(20px,2.4vw,28px)] rounded-[50px] border-none cursor-pointer no-underline transition-all duration-250 ease-out hover:bg-[#333] hover:-translate-y-px active:scale-95 shadow-md hover:shadow-lg"
            v-animateonscroll="{ enterClass: 'animate__fadeInUp', delay: 300 }"
          >
            Get started for Free
            <span
              class="cta-arrow flex items-center justify-center w-[clamp(22px,2.6vw,30px)] h-[clamp(22px,2.6vw,30px)] bg-white/10 rounded-full shrink-0"
            >
              <svg
                viewBox="0 0 24 24"
                class="w-[clamp(11px,1.4vw,15px)] h-[clamp(11px,1.4vw,15px)] stroke-current stroke-2 fill-none"
              >
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
// Image data
const images = [
  { src: 'https://picsum.photos/seed/curly-woman-teal/400/520', alt: 'Team member 1' },
  { src: 'https://picsum.photos/seed/asian-coat-woman/400/520', alt: 'Team member 2' },
  { src: 'https://picsum.photos/seed/yellow-jacket-woman/400/520', alt: 'Team member 3' },
  { src: 'https://picsum.photos/seed/purple-shirt-man/400/520', alt: 'Team member 4' },
  { src: 'https://picsum.photos/seed/pointing-woman-gray/400/520', alt: 'Team member 5' },
  { src: 'https://picsum.photos/seed/smiling-woman-blue/400/520', alt: 'Team member 6' },
  { src: 'https://picsum.photos/seed/casual-pink-man/400/520', alt: 'Team member 7' },
]

const count = images.length
const step = 180 / (count - 1)

const calculateAngle = (index) => {
  return step * index
}
</script>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600&family=Playfair+Display:ital,wght@0,500;0,600;1,500&display=swap');

:root,
.hero {
  /* Base Sizing (Slightly bigger default scale) */
  --radius: min(42vw, 470px);
  --card-width: clamp(75px, 11vw, 138px);
  --card-height: clamp(98px, 14.5vw, 178px);
  --card-radius: clamp(14px, 2.2vw, 24px);
  --content-bottom: clamp(140px, 18vw, 195px);

  /* Typography Variables */
  --headline-size: clamp(30px, 6.5vw, 56px);
  --subtext-size: clamp(13px, 1.6vw, 17px);
  --button-size: clamp(13px, 1.5vw, 16px);
  font-family:
    'DM Sans',
    system-ui,
    -apple-system,
    sans-serif;
}

/* Arc Layout System */
.arc-content-container {
  width: calc(var(--radius) * 2 + var(--card-width));
  height: calc(var(--radius) + var(--content-bottom));
}

.arc-pivot {
  top: var(--radius);
}

.spoke {
  transform: rotate(calc(var(--angle) - 90deg));
}

.card {
  width: var(--card-width);
  height: var(--card-height);
  border-radius: var(--card-radius);
  /* The core positioning logic: top of card starts at -radius */
  transform: translateX(-50%) translateY(calc(-1 * var(--radius)));
}

.card:hover {
  transform: translateX(-50%) translateY(calc(-1 * var(--radius))) scale(1.05);
}

.hero-content {
  top: var(--radius);
  transform: translate(-50%, -38%);
  max-width: 580px;
}

/* Responsive Media Queries - Proportionally tuned & slightly bigger */
/* Extra Large Screens (1440px+) */
@media (min-width: 1440px) {
  .hero {
    --radius: 470px;
    --card-width: 138px;
    --card-height: 178px;
    --card-radius: 24px;
    --headline-size: 56px;
    --subtext-size: 17px;
    --button-size: 16px;
    --content-bottom: 195px;
  }
  .hero-content {
    max-width: 600px;
  }
}

/* Large Screens (1200px - 1439px) */
@media (max-width: 1439px) and (min-width: 1200px) {
  .hero {
    --radius: 425px;
    --card-width: 126px;
    --card-height: 164px;
    --card-radius: 22px;
    --headline-size: 48px;
    --subtext-size: 16px;
    --button-size: 15px;
    --content-bottom: 185px;
  }
  .hero-content {
    max-width: 540px;
  }
}

/* Medium-Large Screens (1024px - 1199px) */
@media (max-width: 1199px) and (min-width: 1024px) {
  .hero {
    --radius: 380px;
    --card-width: 114px;
    --card-height: 148px;
    --card-radius: 20px;
    --headline-size: 42px;
    --subtext-size: 15px;
    --button-size: 14px;
    --content-bottom: 175px;
  }
  .hero-content {
    max-width: 500px;
  }
}

/* Medium-Large Tablets (900px - 1023px) */
@media (max-width: 1023px) and (min-width: 900px) {
  .hero {
    --radius: 320px;
    --card-width: 96px;
    --card-height: 126px;
    --card-radius: 17px;
    --headline-size: 36px;
    --subtext-size: 14px;
    --button-size: 14px;
    --content-bottom: 165px;
  }
  .hero-content {
    max-width: 440px;
  }
}

/* Medium Screens / Tablets (768px - 899px) */
@media (max-width: 899px) and (min-width: 768px) {
  .hero {
    --radius: 275px;
    --card-width: 82px;
    --card-height: 108px;
    --card-radius: 15px;
    --headline-size: 34px;
    --subtext-size: 13.5px;
    --button-size: 13px;
    --content-bottom: 155px;
  }
  .hero-content {
    max-width: 400px;
  }
}

/* Small Tablets / Large Phones (600px - 767px) */
@media (max-width: 767px) and (min-width: 600px) {
  .hero {
    --radius: 230px;
    --card-width: 70px;
    --card-height: 92px;
    --card-radius: 13px;
    --headline-size: 30px;
    --subtext-size: 13px;
    --button-size: 13px;
    --content-bottom: 145px;
  }
  .hero-content {
    max-width: 360px;
  }
}

/* Phones (480px - 599px) */
@media (max-width: 599px) and (min-width: 480px) {
  .hero {
    --radius: 185px;
    --card-width: 58px;
    --card-height: 76px;
    --card-radius: 12px;
    --headline-size: 27px;
    --subtext-size: 12px;
    --button-size: 12px;
    --content-bottom: 138px;
  }
  .hero-content {
    max-width: 340px;
  }
}

/* Small Phones (360px - 479px) */
@media (max-width: 479px) and (min-width: 360px) {
  .hero {
    --radius: 150px;
    --card-width: 46px;
    --card-height: 62px;
    --card-radius: 10px;
    --headline-size: 25px;
    --subtext-size: 11.5px;
    --button-size: 11.5px;
    --content-bottom: 130px;
  }
  .hero-content {
    max-width: 310px;
    padding-left: 8px;
    padding-right: 8px;
  }
}

/* Extra Small Phones (< 360px) */
@media (max-width: 359px) {
  .hero {
    --radius: 125px;
    --card-width: 40px;
    --card-height: 52px;
    --card-radius: 8px;
    --headline-size: 22px;
    --subtext-size: 11px;
    --button-size: 11px;
    --content-bottom: 120px;
  }
  .hero-content {
    max-width: 280px;
    padding-left: 6px;
    padding-right: 6px;
  }
  .cta-button {
    padding: 8px 14px;
  }
}

/* Landscape Mode on Mobile */
@media (max-height: 550px) and (orientation: landscape) {
  .hero {
    --radius: min(36vh, 200px);
    --card-width: min(13vh, 70px);
    --card-height: min(17vh, 92px);
    --content-bottom: min(24vh, 130px);
  }
  .hero-content {
    transform: translate(-50%, -40%);
  }
  .rating-section {
    margin-bottom: 6px;
  }
  .headline {
    margin-bottom: 4px;
  }
  .subtext {
    margin-bottom: 8px;
  }
}
</style>
