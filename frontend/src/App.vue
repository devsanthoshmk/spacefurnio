

<template>
  <header>
    <NavComponent v-show="showNav"/>
  </header>

  <main>
    <RouterView />
  </main>

  <footer>
    <FooterComponent/>
  </footer>

</template>


<script setup>
  import { RouterView } from 'vue-router'
  import { ref } from 'vue'
  import NavComponent from './components/Nav-component.vue'
  import FooterComponent from './components/Footer-component.vue'
  import { provide } from 'vue'

  const showNav = ref(true)

  provide('navShowUtils', {showNav})

</script>
