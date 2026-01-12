/**
 * Home Page Content Configuration
 * Each content key contains:
 *   - text: The content value
 *   - component: Arrow function(s) to dynamically import the component(s) that use this content
 */

export default {
    hero_brand_name: {
        text: "Spacefurnio edited",
        component: () => import('@/components/home/HeroSection.vue')
    },
    hero_tagline: {
        text: "\"Creative Meets Living\"",
        component: () => import('@/components/home/HeroSection.vue')
    },
    new_arrivals_heading: {
        text: "New Arrivals",
        component: () => import('@/components/home/HeroSection.vue')
    },
    coming_soon: {
        text: "Coming Soon",
        component: [() => import('@/components/home/HeroSection.vue'), () => import('@/components/home/Product-section.vue')]
    },
    cta_line_1: {
        text: "Design this good",
        component: () => import('@/components/home/HeroSection.vue')
    },
    cta_line_2: {
        text: "doesn't wait",
        component: () => import('@/components/home/HeroSection.vue')
    },
    grab_now_button: {
        text: "Grab it now!",
        component: () => import('@/components/home/HeroSection.vue')
    },
    new_arrival_alt_1: {
        text: "Modern Chair Collection",
        component: () => import('@/components/home/HeroSection.vue')
    },
    new_arrival_alt_2: {
        text: "Elegant Sofa Design",
        component: () => import('@/components/home/HeroSection.vue')
    },
    new_arrival_alt_3: {
        text: "Contemporary Table",
        component: () => import('@/components/home/HeroSection.vue')
    },
    new_arrival_alt_4: {
        text: "Minimalist Furniture",
        component: () => import('@/components/home/HeroSection.vue')
    },
    product_section_heading: {
        text: "You'll find us",
        component: () => import('@/components/home/Product-section.vue')
    },
    scroll_text_1: {
        text: "Where lines meet light",
        component: () => import('@/components/home/Scroll-animation.vue')
    },
    scroll_text_2: {
        text: "And functions meet soul",
        component: () => import('@/components/home/Scroll-animation.vue')
    }
};
