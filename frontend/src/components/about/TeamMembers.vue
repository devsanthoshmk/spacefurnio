<template>
  <section id="founder-section" class="antialiased" aria-label="Meet the Team">

    <div
      v-for="(person, index) in team"
      :key="person.id"
      class="scroll-section team-member-section !min-h-[100dvh]"
      :class="index % 2 !== 0 ? 'bg-[#fff4ec]' : 'bg-[#f4f2ed]'"
    >
    <div class="h-[9vh] block"></div>
      <div class="team-member-container">

        <!-- Main Content Wrapper with Flexbox -->
        <!-- Added 'reversed' class logic for alternating desktop layout -->
        <div class="team-content-wrapper" :class="{ 'reversed': index % 2 !== 0 }">

          <!-- Photo Frame Column with Diagonal Cut -->
          <div class="photo-frame-wrapper">
            <div class="photo-frame">
              <!-- Hello Text positioned above the clipped container -->
              <h2 class="hello-text cinzel-font" aria-hidden="true">
                HELLO,
              </h2>

              <!-- Photo container with diagonal clip -->
              <div class="photo-container">
                <img
                  :src="person.image || defaultImage(person.id)"
                  :alt="person.name"
                  class="team-photo"
                  loading="lazy"
                />
              </div>

              <!-- Name block at bottom right -->
              <div class="name-block">
                <h1 class="name-title cinzel-font">
                  <span class="text-black">I'M</span> <span class="name-highlight">{{ person.nickname.toUpperCase() || firstName(person.name) }}</span>
                </h1>
                <div class="role-text">
                  <span>{{ person.name }}</span>
                  <span v-for="(rolePart, i) in splitRole(person.role)" :key="i">
                    {{ rolePart }}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <!-- Content Column -->
          <div class="content-column">
            <div class="content-inner">
              <div class="bio-text">
                <p>{{ person.detailedBio }}</p>
              </div>

              <div v-if="person.Architectural_Perspective" class="perspective-section">
                <h4 class="perspective-title">Architectural Perspective:</h4>
                <p class="perspective-quote">
                  "{{ person.Architectural_Perspective }}"
                </p>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>

  </section>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'

const teamMembers = [
  {
    id: 1,
    name: "Ar. Thaini Jentra",
    nickname: "Jeni",
    role: "Founder & Managing Partner",
    description: "Architect with 3 years of experience in this field",
    detailedBio: `I'm an architect with 3 years of experience in this field, and I genuinely enjoy the hands-on side of design, especially bringing ideas to life through thoughtful execution. I'm a naturally curious person, always exploring new tools, materials, and ways to improve what I do. I love turning creative concepts into practical, buildable solutions that are both smart and meaningful.`,
    Architectural_Perspective: `For me, architecture is all about creating smart, simple spaces that work well and feel good to live in. I'm drawn to designs that are minimalist, budget-friendly, and kind to the environment. I believe that with the right ideas and materials, we can build spaces that are both beautiful and practical, without overcomplicating things. Sometimes, the simplest designs speak the loudest—when they're made with care and purpose.`,
    image: "/images/aboutus/team-main/jentra.png"
  },
  {
    id: 2,
    name: "Peter Cintra R",
    nickname: "Cintra",
    role: "Co-Founder & HR Executive",
    description: "CA Finalist with a passion for supporting growing businesses through strategic guidance",
    detailedBio: `I'm a CA Finalist with a passion for supporting growing businesses through strategic guidance by bringing a blend of analytical thinking and real-world experience. My journey blends people, purpose, and strategy. At Spacefurnio, I wear many hats — from keeping the team motivated and connected, to shaping how the world sees us. As the HR head, I'm all about creating a positive, driven work culture and helping bring our brand's voice to life.`,
    Architectural_Perspective: `As an outsider in the field of architecture, I see architecture as the art of creating meaningful spaces within real-world limits. It's not just about aesthetics — it's about smart, sustainable choices that balance beauty, function, and budget. Great architecture, to me, is where creativity meets constraint, and still manages to feel effortless.`,
    image: "/images/aboutus/team-main/cintra.png"
  },
  {
    id: 3,
    name: "Ar. Srimonisha",
    nickname: "Monisha",
    role: "Co-Founder & Design Lead",
    description: "Architect and the Design Lead at Spacefurnio, shaping products with a balance of function and aesthetics",
    detailedBio: `I'm an architect and the Design Lead at Spacefurnio, where I shape every product with a balance of function and aesthetics. My journey began with sketches in the margins of my notebooks and has grown into creating purposeful spaces that fulfill both design intent and functional needs. From the first line I draw, my focus is clear — to capture every requirement with precision and embed it into our work, ensuring the foundation of every project is laid right from the very beginning.`,
    Architectural_Perspective: `To me, architecture is more than design — it is the art of translating dreams into spaces that tell stories and serve a purpose. It begins with listening — to people, to place, and to intent. I see it as a soulful practice where emotion, function, and aesthetics come together in harmony. True architecture is not just admired; it is felt, lived in, and cherished — evolving with the lives it touches.`,
    image: "/images/aboutus/team-main/monisha.png"
  },
  {
    id: 4,
    name: "J. Jeffrina",
    nickname: "Jeffy",
    role: "Co-Founder & Financial Manager",
    description: "MBA graduate with a passion for driving business growth through strategic financial planning",
    detailedBio: `I'm an MBA graduate with a passion for driving business growth through strategic financial planning. As the Co-Founder of our startup, I oversee financial operations, manage investments, and ensure we're on a path to sustainable success. My journey combines academic excellence with hands-on experience, allowing me to turn numbers into actionable insights that shape our future.`,
    Architectural_Perspective: `I don't come from an architecture background, but I've always been fascinated by the way spaces make us feel. To me, architecture isn't just about buildings or blueprints—it's about stories. Every wall, every window, every curve has a purpose, even if you don't see it at first. I approach it with the eyes of an outsider, which I think is my strength. Technical rules do not bind me; I see the beauty, the emotion, and the human experience behind the structures. It's like listening to a song in a language you don't speak—you may not know every word, but you feel its meaning.`,
    image: "/images/aboutus/team-main/jenita.png"
  }
]

const team = ref(teamMembers)

function defaultImage(id) {
  return `https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&w=1000&q=80&ixlib=rb-4.0.3&sig=${id}`
}

function firstName(full) {
  return full?.split(' ')[0] ?? full
}

function splitRole(roleString) {
  if (!roleString) return []
  return roleString.split(/\s+&\s+|\s+,\s+/).map(s => s.trim())
}


</script>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Cinzel:wght@400..900&display=swap');

/* ===== BASE STYLES ===== */
.cinzel-font {
  font-family: "Cinzel", serif;
  font-optical-sizing: auto;
  font-weight: 400;
}

/* ===== SECTION STYLES ===== */
.team-member-section {
  /* Account for navbar - using min-height with calc for proper spacing */
  min-height: calc(100dvh - 4rem); /* 4rem for navbar height */
  display: flex;
  align-items: center;
  justify-content: center;
  padding: clamp(2rem, 5vw, 4rem) clamp(1rem, 3vw, 2rem);
  box-sizing: border-box;
  position: relative;
  z-index: 1;
  flex-direction: column;
}

.team-member-container {
  width: 100%;
  max-width: 1400px;
  display: flex;
  flex-direction: column;
  position: relative;
  overflow: visible;
}

/* ===== CONTENT WRAPPER (Flexbox Layout) ===== */
.team-content-wrapper {
  display: flex;
  flex-direction: column;
  align-items: center;
  flex: 1;
  gap: clamp(2rem, 4vw, 4rem);
}

/* ===== PHOTO FRAME WRAPPER ===== */
.photo-frame-wrapper {
  display: flex;
  justify-content: center;
  align-items: center;
  flex-shrink: 0;
}

/* ===== PHOTO FRAME (Card Style with Diagonal Cut) ===== */
.photo-frame {
  display: flex;
  flex-direction: column;
  background: #fff;
  border: 1px solid #e8e8e8;
  box-shadow:
    0 4px 20px rgba(0, 0, 0, 0.06),
    0 8px 40px rgba(0, 0, 0, 0.03);
  padding-inline: clamp(0.75rem, 2vw, 1.5rem);
  padding-bottom: 0.5vw;
  /* Responsive width based on viewport */
  width: clamp(340px, 29vw, 520px);
  /* Height calculated to fit viewport minus navbar and padding */
  height: clamp(380px, calc(70vh - 6rem), 550px);
  position: relative;
  gap: 0;
}

/* Hello Text - positioned at top */
.hello-text {
  transform: translateY(55%);
  color: #000;
  font-size: clamp(1.25rem, calc(1rem + 1.5vw), 2.25rem);
  line-height: 1;
  margin: 0;
  z-index: 10;
  user-select: none;
  letter-spacing: 0.02em;
}

/* Photo Container with Diagonal Clip */
.photo-container {
  flex: 1;
  min-height: 0;
  overflow: hidden;
  position: relative;
  background: #f5f5f5;
}

/* Team Photo */
.team-photo {
  width: 100%;
  height: 100%;
  object-fit: cover;
  object-position: center top;
  display: block;
}

/* Name Block at bottom right */
.name-block {
  padding-top:1vw;
  text-align: right;
  margin-top: auto;
}

.name-title {
  font-size: clamp(1.1rem, calc(0.8rem + 1.2vw), 2rem);
  line-height: 1.1;
  margin-bottom: clamp(0.35rem, 0.8vw, 0.5rem);
  white-space: nowrap;
  font-weight: 450;
}

.name-highlight {
  color: #000;
}

.role-text {
  font-size: clamp(0.7rem, calc(0.55rem + 0.5vw), 0.95rem);
  font-weight: 700;
  letter-spacing: 0.15em;
  color: #000;
  text-transform: uppercase;
  display: flex;
  flex-direction: column;
  gap: 0.1rem;
  align-items: flex-end;
  line-height: 1.4;
}

/* ===== CONTENT COLUMN ===== */
.content-column {
  display: flex;
  flex-direction: column;
  justify-content: center;
  width: 100%;
  max-width: 600px;
}

.content-inner {
  display: flex;
  flex-direction: column;
  gap: clamp(1rem, 2vw, 1.5rem);
}

.bio-text {
  font-size: clamp(0.85rem, calc(0.75rem + 0.3vw), 1.05rem);
  line-height: 1.75;
  color: #1a1a1a;
  font-weight: 300;
}

.bio-text p {
  margin: 0;
  white-space: pre-line;
}

/* ===== PERSPECTIVE SECTION ===== */
.perspective-section {
  padding-top: clamp(0.5rem, 1vw, 0.75rem);
}

.perspective-title {
  font-size: clamp(0.85rem, calc(0.75rem + 0.3vw), 1.05rem);
  font-weight: 700;
  font-family: serif;
  letter-spacing: 0.05em;
  color: #000;
  margin-bottom: clamp(0.5rem, 1vw, 0.75rem);
}

.perspective-quote {
  font-size: clamp(0.78rem, calc(0.7rem + 0.25vw), 0.95rem);
  color: #1a1a1a;
  font-style: italic;
  font-weight: 300;
  line-height: 1.65;
  padding-left: clamp(0.75rem, 1.5vw, 1.25rem);
  border-left: 2px solid #f59e0b;
  margin: 0;
}

/* ===== SMALL TABLETS (600px and above) ===== */
@media (min-width: 600px) {
  .photo-frame {
    width: clamp(280px, 37vw, 430px);
    height: clamp(420px, calc(68vh - 5rem), 580px);
  }
}

/* ===== TABLET & DESKTOP (768px and above) ===== */
@media (min-width: 768px) {
  .team-member-section {
    min-height: calc(100dvh - 4rem);
    padding: clamp(2rem, 4vw, 4rem);
  }

  .team-content-wrapper {
    flex-direction: row;
    align-items: center;
    justify-content: center;
    gap: clamp(3rem, 5vw, 5rem);
  }

  .team-content-wrapper.reversed {
    flex-direction: row-reverse;
  }

  .photo-frame {
    width: clamp(280px, 30vw, 380px);
    height: clamp(400px, calc(72vh - 5rem), 520px);
    padding-inline: clamp(1rem, 1.5vw, 1.5rem);
  }

  .hello-text {
    font-size: clamp(1.4rem, calc(0.8rem + 1.8vw), 2rem);
  }

  .name-title {
    font-size: clamp(1.2rem, calc(0.7rem + 1.5vw), 1.8rem);
  }

  .role-text {
    font-size: clamp(0.65rem, calc(0.5rem + 0.45vw), 0.85rem);
  }

  .content-column {
    flex: 1;
    max-width: 50%;
    overflow-y: visible;
  }

  .bio-text {
    font-size: clamp(0.9rem, calc(0.8rem + 0.2vw), 1.1rem);
  }

  .perspective-title {
    font-size: clamp(0.9rem, calc(0.8rem + 0.2vw), 1.1rem);
  }

  .perspective-quote {
    font-size: clamp(0.85rem, calc(0.75rem + 0.15vw), 1rem);
  }
}

/* ===== LARGE DESKTOP (1024px and above) ===== */
@media (min-width: 1024px) {
  .team-member-section {
    min-height: calc(100dvh - 4rem);
    padding: clamp(2.5rem, 4vw, 4rem);
  }

  .team-member-container {
    height: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .team-content-wrapper {
    gap: clamp(4rem, 6vw, 6rem);
  }

  .photo-frame {
    width: clamp(300px, 27vw, 410px);
    height: clamp(440px, calc(75vh - 5rem), 560px);
    padding-inline: clamp(1.25rem, 1.5vw, 1.75rem);
  }

  .hello-text {
    font-size: clamp(1.5rem, calc(0.8rem + 1.8vw), 2.25rem);
  }

  .name-title {
    font-size: clamp(1.3rem, calc(0.7rem + 1.4vw), 1.9rem);
  }

  .role-text {
    font-size: clamp(0.7rem, calc(0.45rem + 0.45vw), 0.9rem);
  }

  .content-inner {
    gap: clamp(1.5rem, 2vw, 2rem);
  }
}

/* ===== EXTRA LARGE DESKTOP (1280px and above) ===== */
@media (min-width: 1280px) {
  .photo-frame {
    width: clamp(320px, 25vw, 430px);
    height: clamp(480px, calc(78vh - 5rem), 600px);
  }

  .team-content-wrapper {
    gap: clamp(4.5rem, 6vw, 7rem);
  }
}

/* ===== EXTRA LARGE DESKTOP (1440px and above) ===== */
@media (min-width: 1440px) {
  .team-content-wrapper {
    gap: clamp(5rem, 6vw, 7rem);
    height: 100%;
    align-items: center;
  }

  .photo-frame {
    width: clamp(340px, 23vw, 450px);
    height: clamp(500px, calc(80vh - 5rem), 620px);
    padding-inline: clamp(1.5rem, 1.75vw, 2rem);
  }

  .hello-text {
    font-size: clamp(1.75rem, 2vw, 2.5rem);
  }

  .name-title {
    font-size: clamp(1.5rem, 1.8vw, 2.2rem);
    margin-bottom: 0.5rem;
  }

  .role-text {
    font-size: clamp(0.75rem, 0.65vw, 1rem);
    gap: 0.15rem;
  }

  .bio-text {
    font-size: 1.1rem;
  }

  .perspective-title {
    font-size: 1.1rem;
  }

  .perspective-quote {
    font-size: 1rem;
  }
}

/* ===== ULTRA WIDE (1920px and above) ===== */
@media (min-width: 1920px) {
  .team-member-section {
    min-height: calc(100dvh - 5rem);
    padding: clamp(3rem, 4vw, 5rem);
  }

  .photo-frame {
    width: clamp(360px, 21vw, 480px);
    height: clamp(520px, calc(80vh - 6rem), 660px);
  }

  .team-content-wrapper {
    gap: clamp(5rem, 5vw, 8rem);
  }
}

/* ===== ULTRA WIDE (2560px and above) ===== */
@media (min-width: 2560px) {
  .team-member-section {
    min-height: calc(100dvh - 6rem);
    padding: 4rem;
  }

  .team-content-wrapper {
    gap: 6rem;
  }

  .photo-frame {
    width: clamp(400px, 19vw, 530px);
    height: clamp(560px, calc(80vh - 7rem), 720px);
    padding-inline: 2rem;
  }

  .hello-text {
    font-size: 2.75rem;
  }

  .name-title {
    font-size: 2.5rem;
    margin-bottom: 0.75rem;
  }

  .role-text {
    font-size: 1.1rem;
  }

  .bio-text {
    font-size: 1.25rem;
  }

  .perspective-title {
    font-size: 1.25rem;
  }

  .perspective-quote {
    font-size: 1.125rem;
    padding-left: 2rem;
  }

  .content-inner {
    gap: 2.5rem;
  }
}

/* ===== MOBILE LANDSCAPE / SHORT VIEWPORTS ===== */
@media (max-height: 600px) and (min-width: 640px) {
  .team-member-section {
    min-height: auto;
    padding: 2rem;
  }

  .photo-frame {
    height: clamp(280px, 60vh, 400px);
    width: clamp(200px, 25vw, 310px);
  }

  .hello-text {
    font-size: 1.25rem;
  }

  .name-title {
    font-size: 1.1rem;
  }

  .role-text {
    font-size: 0.6rem;
  }
}

/* ===== VERY SMALL SCREENS (below 360px) ===== */
@media (max-width: 359px) {
  .photo-frame {
    width: 90vw;
    max-width: 280px;
    height: clamp(320px, 55vh, 420px);
    padding-inline: 0.6rem;
  }

  .hello-text {
    font-size: 1.1rem;
  }

  .name-title {
    font-size: 1rem;
  }

  .role-text {
    font-size: 0.6rem;
  }
}

</style>
