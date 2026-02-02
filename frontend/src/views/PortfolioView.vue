<template>
  <div class="bg-space-bg-light dark:bg-space-bg-dark text-space-text-light dark:text-space-text-dark font-space-display transition-colors duration-300 min-h-screen">

    <!-- Hero Section -->
    <HeroSection />

    <main class="w-full px-6 md:px-12 py-16 md:py-24" id="portfolio">
      <div class="text-center mb-16 md:mb-24">
        <h2 class="text-lg md:text-xl tracking-[0.25em] uppercase font-light text-space-text-light dark:text-space-text-dark">
          The Collection
        </h2>
      </div>
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8 max-w-[1600px] mx-auto">

        <!-- Item 1 -->
        <div class="group relative aspect-square overflow-hidden cursor-pointer bg-space-surface-light dark:bg-space-surface-dark">
          <img alt="Minimalist wooden chair" class="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" src="https://lh3.googleusercontent.com/aida-public/AB6AXuAFwc4XVWbJtl3mIjYoRTni6iwm3j6nVWC-wWRRaAr_GcSVoGXS5VySGQci5FJTesrCxyzQFVRuBNvTxfA4LGaHab-DlLlfjY8rCIk5zhM1mym16l5kxTuaKqGC9jtZKmo5I4Msx6dPfj_1haeQkVTRrnAmCxmCHawHjvlJShRV5zNhKGmHpYRejyXxQFCw2nrkVyP5ofy1-Ibf_HzYpZ5E4gB13dvZnpoilQj3yFDKVSBU2X0rUaiaJsuIUmOqSDAU8aEstKDiWtxl"/>
          <div class="absolute inset-0 bg-white/90 dark:bg-black/80 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-center items-center text-center p-6">
            <h3 class="text-xl font-space-serif italic text-space-text-light dark:text-space-text-dark mb-2 translate-y-4 group-hover:translate-y-0 transition-transform duration-300">The Norden Chair</h3>
            <p class="text-xs tracking-widest uppercase text-space-primary mb-4 translate-y-4 group-hover:translate-y-0 transition-transform duration-300 delay-75">Oak &amp; Weave</p>
            <p class="text-sm mb-6 translate-y-4 group-hover:translate-y-0 transition-transform duration-300 delay-100">$350.00</p>
            <button class="border border-space-text-light dark:border-space-text-dark px-6 py-2 text-xs tracking-widest uppercase hover:bg-space-primary hover:border-space-primary hover:text-white transition-colors translate-y-4 group-hover:translate-y-0 duration-300 delay-150">
              View Details
            </button>
          </div>
        </div>

        <!-- Item 2 -->
        <div class="group relative aspect-square overflow-hidden cursor-pointer bg-space-surface-light dark:bg-space-surface-dark">
          <img alt="Modern grey sofa" class="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" src="https://lh3.googleusercontent.com/aida-public/AB6AXuBjJGZ_ua-pP28siJepHa_msu8SzxdS0BDQfw0xFQHCvVOThbg2r3clY4v8p0bFsDU5Ztqw1Ce9ZC6SVia2TTL1511ZxjJMBBBUNK27KPebEpKhfIseoeOzBSXOzKrztPQItC5GwUqzFPzdVdZyATMthDA3y4vZNbFnvaEh8aXrcIJELkJPbcT4sNi-AKQU8zhyddg1XVVIn8-WQErHNmketCV6wOjt7vQCQDD0SjMenbGR6BKqPwFRZCJjo9p22pgadlinx6dmqT16"/>
          <div class="absolute inset-0 bg-white/90 dark:bg-black/80 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-center items-center text-center p-6">
            <h3 class="text-xl font-space-serif italic text-space-text-light dark:text-space-text-dark mb-2 translate-y-4 group-hover:translate-y-0 transition-transform duration-300">Cloud Sectional</h3>
            <p class="text-xs tracking-widest uppercase text-space-primary mb-4 translate-y-4 group-hover:translate-y-0 transition-transform duration-300 delay-75">Living Room</p>
            <p class="text-sm mb-6 translate-y-4 group-hover:translate-y-0 transition-transform duration-300 delay-100">$2,400.00</p>
            <button class="border border-space-text-light dark:border-space-text-dark px-6 py-2 text-xs tracking-widest uppercase hover:bg-space-primary hover:border-space-primary hover:text-white transition-colors translate-y-4 group-hover:translate-y-0 duration-300 delay-150">
              View Details
            </button>
          </div>
        </div>

        <!-- Item 3 -->
        <div class="group relative aspect-square overflow-hidden cursor-pointer bg-space-surface-light dark:bg-space-surface-dark">
          <img alt="Architectural lamp design" class="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" src="https://lh3.googleusercontent.com/aida-public/AB6AXuC3iG7pQq4C12hX4UYWd0baGjdXS3JJO9VLSZZ45oDdWhEk_sbgQsSCiT-42N5rNKuVaAjHDKfB1eS1PQcYpneefRwlyoDc9YSJcVLsPNSjKEy19Qj4XiCfyF9cFnaKnICdsX6oTIkgtWdz4n3CC2EfO2L1LGGVTastH_I7W5jR-NLOA7ydpKyNl9Lu-_HM94VbhjtINPqS1xvv1GRqJPbTst7p_vHt5eBKMNbQbBGswrAtJy9U-6te3Ruf6JlVn7iDP4_yhvkyJZp2"/>
          <div class="absolute inset-0 bg-white/90 dark:bg-black/80 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-center items-center text-center p-6">
            <h3 class="text-xl font-space-serif italic text-space-text-light dark:text-space-text-dark mb-2 translate-y-4 group-hover:translate-y-0 transition-transform duration-300">Arc Lumen</h3>
            <p class="text-xs tracking-widest uppercase text-space-primary mb-4 translate-y-4 group-hover:translate-y-0 transition-transform duration-300 delay-75">Lighting</p>
            <p class="text-sm mb-6 translate-y-4 group-hover:translate-y-0 transition-transform duration-300 delay-100">$185.00</p>
            <button class="border border-space-text-light dark:border-space-text-dark px-6 py-2 text-xs tracking-widest uppercase hover:bg-space-primary hover:border-space-primary hover:text-white transition-colors translate-y-4 group-hover:translate-y-0 duration-300 delay-150">
              View Details
            </button>
          </div>
        </div>

        <!-- Item 4 -->
        <div class="group relative aspect-square overflow-hidden cursor-pointer bg-space-surface-light dark:bg-space-surface-dark">
          <img alt="Minimalist wooden table" class="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" src="https://lh3.googleusercontent.com/aida-public/AB6AXuAS9Aq2hlRGT1VSNcjlP65gD00pDzUBjPZLu2YTxt6AttLVZ9Z8o_z3E9v2n9pckReyKCWOSQ1bjHPLpHte2hoH13DbHyE82Cc1NiIOCNv0psZa9JeA6iQ7bxG5JqSJhEhXf-FQ6k9ty_j5Laptrmnue-Yj0T5E9Hn8UeSp33QczLknRlzxQyxppK9qtBr7x4D6TiDcY03GGyuA6eI0LaoPbmY_yw8JBBxM1nH94tc12MhxW84wXl7NFZ_zsl_kr58J0vn2uXuhTjf_"/>
          <div class="absolute inset-0 bg-white/90 dark:bg-black/80 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-center items-center text-center p-6">
            <h3 class="text-xl font-space-serif italic text-space-text-light dark:text-space-text-dark mb-2 translate-y-4 group-hover:translate-y-0 transition-transform duration-300">Kyoto Low Table</h3>
            <p class="text-xs tracking-widest uppercase text-space-primary mb-4 translate-y-4 group-hover:translate-y-0 transition-transform duration-300 delay-75">Tables</p>
            <p class="text-sm mb-6 translate-y-4 group-hover:translate-y-0 transition-transform duration-300 delay-100">$420.00</p>
            <button class="border border-space-text-light dark:border-space-text-dark px-6 py-2 text-xs tracking-widest uppercase hover:bg-space-primary hover:border-space-primary hover:text-white transition-colors translate-y-4 group-hover:translate-y-0 duration-300 delay-150">
              View Details
            </button>
          </div>
        </div>

        <!-- Item 5 -->
        <div class="group relative aspect-square overflow-hidden cursor-pointer bg-space-surface-light dark:bg-space-surface-dark">
          <img alt="Outdoor lounge chair" class="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" src="https://lh3.googleusercontent.com/aida-public/AB6AXuDMdlMNnsIIU4hHkZ8Zvq5QgqcpjIGR0vJpwV_Uzqo8mV53TvN8VvqgjRscLozO4HXfUCaf6ge_pfgm_d-6f3OQqJ1TI-qhPdxVQIvdDUB_YO3-Ndvxjcc7pQWt7wbJd46HsS-0vxZyiZqo5YXFztQ01oX6qVJoebQ-xsxC9bkzcNVAn-jC39fG0iEwEiqGKJzeb20PFduidgtqT1gPPwAnliie6RWqKcl1RD3CxEgr4PfZMv0w72z3e0SbqS9sA5NAAYkT8BNFHTLq"/>
          <div class="absolute inset-0 bg-white/90 dark:bg-black/80 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-center items-center text-center p-6">
            <h3 class="text-xl font-space-serif italic text-space-text-light dark:text-space-text-dark mb-2 translate-y-4 group-hover:translate-y-0 transition-transform duration-300">Terrace Lounger</h3>
            <p class="text-xs tracking-widest uppercase text-space-primary mb-4 translate-y-4 group-hover:translate-y-0 transition-transform duration-300 delay-75">Outdoor</p>
            <p class="text-sm mb-6 translate-y-4 group-hover:translate-y-0 transition-transform duration-300 delay-100">$550.00</p>
            <button class="border border-space-text-light dark:border-space-text-dark px-6 py-2 text-xs tracking-widest uppercase hover:bg-space-primary hover:border-space-primary hover:text-white transition-colors translate-y-4 group-hover:translate-y-0 duration-300 delay-150">
              View Details
            </button>
          </div>
        </div>

        <!-- Item 6 -->
        <div class="group relative aspect-square overflow-hidden cursor-pointer bg-space-surface-light dark:bg-space-surface-dark">
          <img alt="Green velvet sofa" class="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" src="https://lh3.googleusercontent.com/aida-public/AB6AXuCD89VjYQA6hTYP_6IQSdexnfmjjHoOrITK90UfpkHzXc_K9gyns1nc1znE83e9PULJKj5RqIahDa0RaqbRdo7t8H58wRES3Gs7FxrRmoPADJFP_qJ1hAj49GzV8Ojxsg7exV_n1inc7nzWZUSJLSqBS2tH_N9yq6rIJceTFWCcgS2nOUzN4yQcoCKfICg6rQ0HBWXMvbxG8XO9xg2UjqirRbgw-zVBQrCUq34eEwTIV5NepJJOA5nMenhZFQHGw9gKJ28av44v1oyy"/>
          <div class="absolute inset-0 bg-white/90 dark:bg-black/80 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-center items-center text-center p-6">
            <h3 class="text-xl font-space-serif italic text-space-text-light dark:text-space-text-dark mb-2 translate-y-4 group-hover:translate-y-0 transition-transform duration-300">Emerald Settee</h3>
            <p class="text-xs tracking-widest uppercase text-space-primary mb-4 translate-y-4 group-hover:translate-y-0 transition-transform duration-300 delay-75">Living Room</p>
            <p class="text-sm mb-6 translate-y-4 group-hover:translate-y-0 transition-transform duration-300 delay-100">$1,890.00</p>
            <button class="border border-space-text-light dark:border-space-text-dark px-6 py-2 text-xs tracking-widest uppercase hover:bg-space-primary hover:border-space-primary hover:text-white transition-colors translate-y-4 group-hover:translate-y-0 duration-300 delay-150">
              View Details
            </button>
          </div>
        </div>

        <!-- Item 7 -->
        <div class="group relative aspect-square overflow-hidden cursor-pointer bg-space-surface-light dark:bg-space-surface-dark">
          <img alt="Minimalist bed frame" class="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" src="https://lh3.googleusercontent.com/aida-public/AB6AXuA8zz4yxfDYH0iGYvEYfzRSH6LkOsHqAzWMhdcwTvjhXzohId7Lqv2s9ySJowbXjuci4cETCkTb7HmAAwJUGl0vScjbpetWbAA9KcrsTPg6zXNlm2WuLTbA4IBviAoaJvnb0FiUp4RUvY37_NKIjvxw7pvDCPurA59QT9rjECRhM-DNU8Qj68mo8Vte1VfxCTEwDlsayzv14_aIEnJrjhzu1ZBGjA74pfo45Y6T-YLMxxye5e1umYk_mxtC8Pl2t_hvSSpYOJc5GTW0"/>
          <div class="absolute inset-0 bg-white/90 dark:bg-black/80 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-center items-center text-center p-6">
            <h3 class="text-xl font-space-serif italic text-space-text-light dark:text-space-text-dark mb-2 translate-y-4 group-hover:translate-y-0 transition-transform duration-300">Hiven Bed</h3>
            <p class="text-xs tracking-widest uppercase text-space-primary mb-4 translate-y-4 group-hover:translate-y-0 transition-transform duration-300 delay-75">Bedroom</p>
            <p class="text-sm mb-6 translate-y-4 group-hover:translate-y-0 transition-transform duration-300 delay-100">$950.00</p>
            <button class="border border-space-text-light dark:border-space-text-dark px-6 py-2 text-xs tracking-widest uppercase hover:bg-space-primary hover:border-space-primary hover:text-white transition-colors translate-y-4 group-hover:translate-y-0 duration-300 delay-150">
              View Details
            </button>
          </div>
        </div>

        <!-- Item 8 -->
        <div class="group relative aspect-square overflow-hidden cursor-pointer bg-space-surface-light dark:bg-space-surface-dark">
          <img alt="Modern shelving unit" class="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" src="https://lh3.googleusercontent.com/aida-public/AB6AXuC-0xZW_3vH44fwdigch9FuovUSbAQ8Sgh1uUuZBkPTGIvlOY9uOvl6HwKKUIUDZVXETnTFVpbzAl3SD0IA0AMu59nFlSSiOL2RK3jMpN7nwI5MivOivM7Zr4uXRExsOhEfYCyPZwbEyCFCZiOZpqD4q6Qwhjx2DtIVX6-DM744SozcXrYnrMYNTlwXWtGRZNu-byrHcjGjvNPQNonF22ahwnc-TdjQ0SjDcnTv0Fu5bTnMyJzPNkltRndgkAVo_BLqbgMHhpxtnbTn"/>
          <div class="absolute inset-0 bg-white/90 dark:bg-black/80 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-center items-center text-center p-6">
            <h3 class="text-xl font-space-serif italic text-space-text-light dark:text-space-text-dark mb-2 translate-y-4 group-hover:translate-y-0 transition-transform duration-300">Axis Shelf</h3>
            <p class="text-xs tracking-widest uppercase text-space-primary mb-4 translate-y-4 group-hover:translate-y-0 transition-transform duration-300 delay-75">Storage</p>
            <p class="text-sm mb-6 translate-y-4 group-hover:translate-y-0 transition-transform duration-300 delay-100">$600.00</p>
            <button class="border border-space-text-light dark:border-space-text-dark px-6 py-2 text-xs tracking-widest uppercase hover:bg-space-primary hover:border-space-primary hover:text-white transition-colors translate-y-4 group-hover:translate-y-0 duration-300 delay-150">
              View Details
            </button>
          </div>
        </div>

        <!-- Item 9 -->
        <div class="group relative aspect-square overflow-hidden cursor-pointer bg-space-surface-light dark:bg-space-surface-dark">
          <img alt="Abstract art decor" class="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" src="https://lh3.googleusercontent.com/aida-public/AB6AXuC04TpAlNU54N_LQ449VtJ19XODTSHMFyvzT_8JloZIh7bvgmKPZsN7Otb9fPZNzeCBQGLkb9uwnfQ4d85-17XkT2Kr68tNPLSZfu-wpVGuBDRHksLLS55O04-TpVhP6gMUaCLxmDKXX_KuX4b0Lb08oB5V4MWOL8UpCnTpYVgE8WggHqlCW45iexnsXhqnsID1PN8vnN7Aszve_-khsWd5biCH5jqZlKc5njHRutV30XMi16uA0nAoeSicAQoNIwG-o-RFvAl5a_Dz"/>
          <div class="absolute inset-0 bg-white/90 dark:bg-black/80 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-center items-center text-center p-6">
            <h3 class="text-xl font-space-serif italic text-space-text-light dark:text-space-text-dark mb-2 translate-y-4 group-hover:translate-y-0 transition-transform duration-300">Ceramic Series 01</h3>
            <p class="text-xs tracking-widest uppercase text-space-primary mb-4 translate-y-4 group-hover:translate-y-0 transition-transform duration-300 delay-75">Decor</p>
            <p class="text-sm mb-6 translate-y-4 group-hover:translate-y-0 transition-transform duration-300 delay-100">$120.00</p>
            <button class="border border-space-text-light dark:border-space-text-dark px-6 py-2 text-xs tracking-widest uppercase hover:bg-space-primary hover:border-space-primary hover:text-white transition-colors translate-y-4 group-hover:translate-y-0 duration-300 delay-150">
              View Details
            </button>
          </div>
        </div>

      </div>
    </main>

    <section class="w-full px-6 md:px-12 py-12 mb-8 md:mb-16">
      <div class="max-w-[1600px] mx-auto border-t border-b border-gray-300 dark:border-gray-700 py-12 md:py-20 flex flex-col md:flex-row items-start md:items-center justify-between gap-8">
        <div class="max-w-2xl">
          <h2 class="text-2xl md:text-4xl font-space-serif italic text-space-text-light dark:text-space-text-dark mb-4">
            Discover Our Latest Collection
          </h2>
          <p class="text-sm md:text-base text-gray-600 dark:text-gray-400 font-light leading-relaxed max-w-lg">
            Explore a curated selection of minimalist designs that bring harmony and functionality to your living spaces.
          </p>
        </div>
        <div class="flex-shrink-0">
          <a class="inline-block border border-space-text-light dark:border-space-text-dark px-10 py-4 text-xs tracking-[0.2em] uppercase font-medium hover:bg-space-primary hover:border-space-primary hover:text-white transition-all duration-300" href="#">
            Shop Now
          </a>
        </div>
      </div>
    </section>

  </div>
</template>

<script setup>
import HeroSection from '@/components/portfolio/HeroSection.vue'

// const toggleDarkMode = () => {
//   document.documentElement.classList.toggle('dark');
// };
</script>

<style scoped>
.no-scrollbar::-webkit-scrollbar {
    display: none;
}
.no-scrollbar {
    -ms-overflow-style: none;
    scrollbar-width: none;
}
.fade-in-up {
    animation: fadeInUp 0.5s ease-out forwards;
}
@keyframes fadeInUp {
    from { opacity: 0; transform: translateY(20px); }
    to { opacity: 1; transform: translateY(0); }
}
</style>
