/**
 * Home Page Content Configuration
 * Each content key contains:
 *   - text: The content value
 *   - component: Arrow function(s) to dynamically import the component(s) that use this content
 */

const originalContent = {
    hero_brand_name: {
        text: "Spacefurnio",
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
        component: [
            () => import('@/components/home/HeroSection.vue'),
            () => import('@/components/home/Product-section.vue')
        ]
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

import { reactive } from 'vue';

// Create a reactive copy of the content
const content = reactive({ ...originalContent });

/**
 * Syncs the reactive content with pending changes from localStorage.
 * This runs ONLY on admin routes to allow previewing changes.
 */
const syncWithLocalStorage = () => {
    if (typeof window === 'undefined') return;

    // Only apply overrides on admin routes
    const isAdmin = window.location.pathname.startsWith('/admin') || window.location.hash.includes('admin');
    if (!isAdmin) return;

    try {
        const stored = localStorage.getItem('admin_pending_changes');

        // Reset to original first to handle discarded changes/reverts
        Object.keys(originalContent).forEach(key => {
            if (content[key] && originalContent[key]) {
                content[key].text = originalContent[key].text;
            }
        });

        if (stored) {
            const allChanges = JSON.parse(stored);
            // AdminContentsPage saves changes under 'homePage.json' (the file encoding the data)
            // But this file is 'homePage.js'. We map the JSON data to this JS object.
            const changes = allChanges['homePage.json'] || allChanges['homePage.js'];

            if (changes) {
                Object.keys(changes).forEach(key => {
                    // Only update valid keys and ensure we don't break structure
                    if (content[key]) {
                        const changeVal = changes[key];
                        // changeVal from localStorage will have lost the function 'component', 
                        // so we only update 'text'
                        if (changeVal && typeof changeVal === 'object' && changeVal.text) {
                            content[key].text = changeVal.text;
                        } else if (typeof changeVal === 'string') {
                            // Fallback for flat strings if that format exists
                            content[key].text = changeVal;
                        }
                    }
                });
            }
        }
    } catch (e) {
        console.error('Failed to sync content with local storage:', e);
    }
};

// Initialize and listen for updates
if (typeof window !== 'undefined') {
    syncWithLocalStorage();

    // Listen for cross-tab updates
    window.addEventListener('storage', (e) => {
        if (e.key === 'admin_pending_changes') {
            syncWithLocalStorage();
        }
    });

    // Listen for same-tab updates (dispatched by AdminContentsPage)
    window.addEventListener('content:update', syncWithLocalStorage);
}

export default content;
