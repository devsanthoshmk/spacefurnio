<script setup>
import { onMounted } from 'vue';

onMounted(() => {
    const observerOptions = {
        root: null,
        rootMargin: '0px',
        threshold: 0.1
    };
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('reveal-visible');
            }
        });
    }, observerOptions);
    const elements = document.querySelectorAll('.reveal-on-scroll');
    elements.forEach(el => observer.observe(el));
});
</script>

<template>
    <div class="bg-background-light text-primary font-body antialiased transition-colors duration-500">

        <!-- Header -->
        <header class="relative w-full min-h-screen flex flex-col justify-center items-center overflow-hidden py-20">
            <div class="absolute inset-0 z-0">
                <img alt="Abstract architectural shadows" class="w-full h-full object-cover opacity-90 grayscale" src="https://lh3.googleusercontent.com/aida-public/AB6AXuAhgKO0hSTWG8ItXCNibW_OwnRd-hVLNDjVdtYABLzMFnJkmxfTo7lezGgAKHJ2oByOqbt0Bdw95Lrr3sTj3iHl_amf-PmUOcLb3AL6c1isxbGZQVied6Oj22vBxQCc2dMH2kfcZFz43VOGgJTNV_jmcUI7_I3OiG5d1AyLmsopkxfYQ0WQ6YNr_kdf9JmCknkr6oSYw0pJtsag5DTR7rgUjVR5VJALqahF4ingfIhsUOQVUp0IvC64M0l7IppyjdZ5bg5MUF28tf0"/>
                <div class="absolute inset-0 bg-gradient-to-b from-transparent via-background-light/30 to-background-light"></div>
            </div>
            <div class="relative z-10 text-center flex flex-col items-center max-w-5xl px-6 sm:px-8 animate-fadeIn">
                <!-- Logo -->
                <div class="mb-1 sm:mb-2 w-25 sm:w-28 md:w-26 lg:w-34 transition-all duration-700 hover:scale-105">
                    <img alt="Spacefurnio Monogram" class="w-full h-auto drop-shadow-2xl" src="/images/Spacefurnio-Logo.png"/>
                </div>

                <!-- Main Title -->
                <h1 class="font-display mb-0 sm:mb-1 tracking-tight text-gray-900 flex flex-col items-center gap-0">
                    <span class="phitagate-font font-bold bg-gradient-to-r from-orange-500 to-orange-600 bg-clip-text text-transparent text-8xl xl:text-9xl leading-tight ps-1">
                        Spacefurnio
                    </span>
                    <span class="font-bold phitagate-font text-7xl text-gray-700 -my-9">
                        ×
                    </span>
                    <span class="italic text-6xl xl:text-7xl font-light tracking-wide mt-9">
                        Collabs
                    </span>
                </h1>

                <!-- Divider -->
                <div class="w-16 sm:w-20 md:w-24 h-[2px] bg-gradient-to-r from-transparent via-gray-800 to-transparent my-4 sm:my-5"></div>

                <!-- Tagline -->
                <p class="text-sm sm:text-base md:text-lg lg:text-xl font-light tracking-[0.2em] sm:tracking-[0.3em] uppercase text-gray-600">
                    Creative Meets Living
                </p>
            </div>

            <!-- Scroll Indicator -->
            <div class="absolute bottom-6 sm:bottom-10 animate-bounce">
                <span class="material-icons text-2xl sm:text-3xl text-gray-500 opacity-60 hover:opacity-100 transition-opacity cursor-pointer">
                    keyboard_arrow_down
                </span>
            </div>
        </header>

        <!-- Quote Section -->
        <section class="py-24 md:py-32 px-6 bg-background-light relative z-10">
            <div class="max-w-3xl mx-auto text-center reveal-on-scroll">
                <p class="font-display text-2xl md:text-4xl leading-relaxed text-gray-800">
                    "We believe that true elegance is found in the dialogue between distinct voices. Our collaborations series invites the world's most visionary brands to reimagine the Spacefurnio aesthetic."
                </p>
            </div>
        </section>

        <!-- Collection 01 -->
        <section class="relative min-h-screen flex items-center justify-center overflow-hidden group">
            <div class="absolute inset-0 transition-transform duration-[2s] ease-out group-hover:scale-105">
                <img alt="Modern minimalist office space" class="w-full h-full object-cover" src="https://lh3.googleusercontent.com/aida-public/AB6AXuDW349msWLex7TvrKX5RpfUIkDUKU3CafodR3HicQz0sUhISN9-PJ9nbDuv15tXnGjOibqREfgsADj63mkHxiLQ-sOVM2Z2ebXCE3CWYkQswjHCg3Cm5iUBif9Jni3Gk4wTEmd2dN_LTIy_HNKkXZyYr7_u52AHj-m7TxqadKJKRZMKXQ0To7_TLBjetXDST0No5D1L846kxL07AA3jrDYRwnNVu3l0WBSfkuxhfB6w16UgAdtobxdyihdP_5s876ENnihSFP3qV54"/>
                <div class="absolute inset-0 bg-white/70 transition-colors duration-500 backdrop-blur-[2px]"></div>
            </div>
            <div class="relative z-10 w-full max-w-6xl mx-auto px-6 grid md:grid-cols-2 gap-12 items-center">
                <div class="relative h-[50vh] md:h-[70vh] w-full overflow-hidden shadow-2xl reveal-on-scroll">
                    <img alt="Detailed texture of fabric" class="w-full h-full object-cover hover:scale-110 transition-transform duration-1000" src="https://lh3.googleusercontent.com/aida-public/AB6AXuDP2WO1VE9rdNv98iQv0vRE6NJElFdSV3y9iAfHZid11kzTqrnJwWZrLP2nKhN66iloEuHsX1EkWuD2CSc1Ayy4-YN-zfjM8hywlnWqGeZ5ni10FsE_Ae4fyYLswLo-cG0N7TSdDr4jCr5bR-dNLCScN1cwV4QJToDAHkgsPT7fA9WhlGOIqdj9hrDX6Q5WqmujUlIL-nmtEtXBrT-nYB8lGsFsdknU7vDII14jgJVjLIm9RQmNr-F2KL42OCavlI0Gk9QaJ3_N6LU"/>
                    <div class="absolute top-6 left-6 flex items-center gap-4 bg-white/90 p-4 backdrop-blur-md">
                        <img alt="Spacefurnio Logo" class="h-8 w-auto" src="https://lh3.googleusercontent.com/aida-public/AB6AXuDbMb-XsDP8UOEDLQrZ77m-mWhcwh9NYdEJThvNCqdDdFE3WGqsl2ZdUBlqEgs0exNp06vWEyHUCSYuZ-tV36OnNgXnaEqYRp8ZL81N4XgG8m_jg6WpkyZRTToJzDu8Ez-KOV1IWz5xWlC4TFzIwKLRWDBUMWaZ1I6RCSsZqARtn72iSlm9ttcuerMjBuY_bH0Za8KfuITlrqASFk0ogpPiOsXvaEasj7mqTd6tfP8wpf6-5r8qAvd4vZ2_Vfur51BUzN2z6o-RkeI"/>
                        <span class="text-xl font-thin mx-2">×</span>
                        <span class="font-display font-bold text-lg tracking-widest uppercase">LUMINA</span>
                    </div>
                </div>
                <div class="text-left md:pl-10 reveal-on-scroll" style="transition-delay: 200ms;">
                    <span class="text-xs font-bold tracking-[0.3em] uppercase text-gray-500 mb-4 block">
                        Collection 01
                    </span>
                    <h2 class="text-5xl md:text-7xl font-display mb-8 text-gray-900 leading-tight">
                        Light &amp;<br/> <span class="italic text-gray-500">Structure</span>
                    </h2>
                    <p class="text-lg text-gray-600 mb-10 font-light leading-relaxed max-w-md">
                        Spacefurnio and Lumina are collaborating to redefine how light interacts with solid oak surfaces. A study in contrast and clarity.
                    </p>
                    <a class="inline-flex items-center gap-3 group/btn" href="#">
                        <span class="font-bold tracking-widest text-sm uppercase border-b border-black pb-1 group-hover/btn:border-transparent transition-colors">
                            Explore Chapter
                        </span>
                        <span class="material-icons text-sm transform group-hover/btn:translate-x-2 transition-transform">east</span>
                    </a>
                </div>
            </div>
        </section>

        <!-- Collection 02 -->
        <section class="relative min-h-screen flex items-center justify-center overflow-hidden group bg-stone-100">
            <div class="absolute inset-0 opacity-10 pattern-dots"></div>
            <div class="relative z-10 w-full max-w-6xl mx-auto px-6 grid md:grid-cols-2 gap-12 items-center">
                <div class="text-left md:pr-10 md:order-1 order-2 reveal-on-scroll">
                    <span class="text-xs font-bold tracking-[0.3em] uppercase text-gray-500 mb-4 block">
                        Collection 02
                    </span>
                    <h2 class="text-5xl md:text-7xl font-display mb-8 text-gray-900 leading-tight">
                        Earth &amp;<br/> <span class="italic text-gray-500">Form</span>
                    </h2>
                    <p class="text-lg text-gray-600 mb-10 font-light leading-relaxed max-w-md">
                        Spacefurnio and TERRA are collaborating on a limited series of ceramic-inlaid coffee tables. Hand-thrown pottery meets precision joinery.
                    </p>
                    <a class="inline-flex items-center gap-3 group/btn" href="#">
                        <span class="font-bold tracking-widest text-sm uppercase border-b border-black pb-1 group-hover/btn:border-transparent transition-colors">
                            Explore Chapter
                        </span>
                        <span class="material-icons text-sm transform group-hover/btn:translate-x-2 transition-transform">east</span>
                    </a>
                </div>
                <div class="relative h-[50vh] md:h-[70vh] w-full overflow-hidden shadow-2xl md:order-2 order-1 reveal-on-scroll" style="transition-delay: 200ms;">
                    <img alt="Ceramic vase in modern room" class="w-full h-full object-cover hover:scale-110 transition-transform duration-1000" src="https://lh3.googleusercontent.com/aida-public/AB6AXuDhjZZoGIa0_bzfwIA76hYLKBo6UlNiGngyYbvQDImSqtDO7oGMKsnqtagpy9BJBuPBX_4a2RYnXYxJYZjFFT56aLgP2913h-wwfHxNeU_4JCWcFladcwt337TssFv6Jsy7nUbBEev64IlBF5hndblN0mjDaNhcen-w6DbO7ElVa0H_qDkTDBZylJMQbiUFAdpatbQSwzJ2LYuH8VWpfE6m-wW32Xh9JvDZ98xC2JYsXa6iOu4t_kuXb22opp3-PYpLLv39Pq6mDfg"/>
                    <div class="absolute bottom-6 right-6 flex items-center gap-4 bg-white/90 p-4 backdrop-blur-md">
                        <span class="font-display font-bold text-lg tracking-widest uppercase">TERRA</span>
                        <span class="text-xl font-thin mx-2">×</span>
                        <img alt="Spacefurnio Logo" class="h-8 w-auto" src="https://lh3.googleusercontent.com/aida-public/AB6AXuDnuPNjmglgeEFO_Inbx362-U1s6S9W0g-VYMksrLqKuMfvb9JIu63w5Hd0zfBwZonyEWVQRMXom_toEOn027cqcod9IORpelSGOWvWnL8Dxo2vbCoRs9Psk8HwyyP2ZYpAtauljr70aFWFuVST3dhBqg3dmU8T_gjzQTR7ziEYkuQA7lyKO90ZoKcPw0XobzUCBZPrV0XnOUWgdclmLsW8bcPiEh50Tc_VegAygbTAsiNxytT-N0USJKzPDc6y28WyFWc0mh0SFOY"/>
                    </div>
                </div>
            </div>
        </section>

        <!-- Collection 03 -->
        <section class="relative min-h-screen flex items-center justify-center overflow-hidden group">
            <div class="absolute inset-0 transition-transform duration-[2s] ease-out group-hover:scale-105">
                <img alt="Dark moody interior" class="w-full h-full object-cover" src="https://lh3.googleusercontent.com/aida-public/AB6AXuBSMVSphk9w33tvcC8gNlodZ6qdNZ-thkNPRnRiuYBE72i3sX_D8KyOWYmxLjBY9Wk2C3XyOOz_U5WveistX12I9F1kjB-3T38uqCI6u2iibJvwLixWv79dzTw_IkjHLDgjWGoYeZJ1JRGQ9pxVxCqn0_WrJhXJZRfQVAj-3riEv3xUJd0HxJVYvdDTn7E2mMPV4Y2nLeEOgfhFr5gh38YaK_Q4eoZkRAQlWJ1Cc98Iq8aWLzaNOn3CFWPuAnyTCNN6f8nsdG3mdrM"/>
                <div class="absolute inset-0 bg-black/40 transition-colors duration-500 backdrop-blur-[1px]"></div>
            </div>
            <div class="relative z-10 w-full max-w-5xl mx-auto px-6 text-center text-white">
                <div class="mb-12 flex justify-center items-center gap-6 opacity-80 hover:opacity-100 transition-opacity">
                    <img alt="Spacefurnio Logo" class="h-16 w-auto invert drop-shadow-lg" src="https://lh3.googleusercontent.com/aida-public/AB6AXuABY8y5u9-WtLA-h9hc6BTtfpeU-SR4gb34olK9rroP990x2dzQqCqLoOLtFt0EJcJ25FvdYsuOUVWKVuLVrzaxJ_sJ6KGc49J2UeFokopde6MZcgMergK_l2Xqah9UM_r8Ov5Cb_9Y5oRsoeuRcQUn_hLIQxsY6NfJwFNBX5xC17JEFVBveEOPHrZq7okPhtQAAT1AWjcKCb5_KFRc6H5DnIxvMWBabCX4TaAaQqgnGPGSTLY8MwCLniMQL58tCPM-CcsL0f5pxi0"/>
                    <span class="text-4xl font-thin">×</span>
                    <span class="font-display font-bold text-3xl tracking-widest uppercase drop-shadow-lg">VELVET&amp;CO</span>
                </div>
                <h2 class="text-6xl md:text-8xl font-display mb-8 leading-none reveal-on-scroll">
                    Soft<br/><span class="italic text-gray-300">Resilience</span>
                </h2>
                <p class="text-xl md:text-2xl font-light text-gray-200 mb-12 max-w-2xl mx-auto reveal-on-scroll" style="transition-delay: 100ms;">
                    Spacefurnio and Velvet &amp; Co are collaborating to bring tactile warmth to industrial steel frames.
                </p>
                <button class="bg-white text-black px-10 py-4 uppercase tracking-widest text-sm font-bold hover:bg-transparent hover:text-white border border-transparent hover:border-white transition-all duration-300 reveal-on-scroll" style="transition-delay: 200ms;">
                    Know More
                </button>
            </div>
        </section>

        <!-- Footer Quote -->
        <section class="py-32 px-6 bg-primary text-white flex items-center justify-center">
            <div class="max-w-4xl text-center border-y border-white/20 py-16">
                <span class="material-icons text-4xl mb-6 text-white/50">format_quote</span>
                <p class="font-display text-3xl md:text-5xl italic leading-relaxed mb-8">
                    Design is not just what it looks like and feels like. Design is how it works together.
                </p>
                <div class="flex items-center justify-center gap-3">
                    <div class="h-[1px] w-12 bg-white/50"></div>
                    <span class="uppercase tracking-widest text-sm text-white/70">The SF Studio</span>
                    <div class="h-[1px] w-12 bg-white/50"></div>
                </div>
            </div>
        </section>


    </div>
</template>

<style scoped>
.text-vertical {
    writing-mode: vertical-rl;
    text-orientation: mixed;
}
.reveal-on-scroll {
    opacity: 0;
    transform: translateY(20px);
    transition: all 1s ease-out;
}
.reveal-visible {
    opacity: 1;
    transform: translateY(0);
}
::-webkit-scrollbar {
    width: 8px;
}
::-webkit-scrollbar-track {
    background: transparent;
}
::-webkit-scrollbar-thumb {
    background: #888;
}
::-webkit-scrollbar-thumb:hover {
    background: #555;
}
</style>
