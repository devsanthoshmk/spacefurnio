<script setup>
import { RouterView } from 'vue-router';
import { ref, onMounted, onUnmounted } from 'vue';
import NavComponent from './components/Nav-component.vue';
import FooterComponent from './components/Footer-component.vue';


const showNav = ref(false);

const handleScroll = () => {
  const scrollY = window.scrollY;
  const screenHeight = window.innerHeight;
  showNav.value = scrollY >= screenHeight * 0.2; // 20% of viewport height
};

onMounted(() => {
  window.addEventListener('scroll', handleScroll);
  handleScroll(); // Run once to check on load
});

onUnmounted(() => {
  window.removeEventListener('scroll', handleScroll);
});

</script>


<template>
  <header>
    <NavComponent v-if="showNav" />
  </header>

  <main>
    <RouterView />
  </main>

  <footer>
    <FooterComponent />
  </footer>

</template>

