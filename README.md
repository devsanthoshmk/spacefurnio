# SpaceFurnio - Modern Furniture E-commerce

A professional Vue 3 application built with Vite, featuring elegant full-screen sections with scroll animations using AOS (Animate On Scroll).

## 🚀 Features

- **Modern Tech Stack**: Vue 3 Composition API + Vite + Tailwind CSS
- **Component Architecture**: Modular, reusable components
- **Scroll Animations**: AOS integration with custom animations
- **Responsive Design**: Mobile-first approach
- **Professional UI**: PrimeVue components with custom styling
- **Performance Optimized**: Lazy loading and efficient animations

## 🛠️ Tech Stack

- **Vue 3** - Progressive JavaScript framework
- **Vite** - Next generation frontend tooling
- **Tailwind CSS** - Utility-first CSS framework
- **PrimeVue** - Rich UI component library
- **AOS** - Animate On Scroll library
- **Poppins Font** - Modern typography

## 📦 Installation

```bash
# Clone the repository
git clone <repository-url>
cd spacefurnio

# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

## 🏗️ Project Structure

```
src/
├── components/
│   ├── Navigation.vue          # Fixed navigation bar
│   ├── BrandingSection.vue     # Hero section with brand
│   ├── NewArrivalsSection.vue  # Product showcase
│   ├── TaglinesSection.vue     # Animated taglines
│   ├── ProjectHighlights.vue   # Portfolio showcase
│   └── FooterSection.vue       # Footer with links
├── composables/
│   ├── useScrollAnimations.js  # Custom scroll animations
│   └── useParallax.js          # Parallax effects
├── App.vue                     # Main app component
├── main.js                     # App initialization
└── style.css                   # Global styles
```

## 🎨 Design Features

### Full-Screen Sections
Each section takes up the entire viewport height with:
- Elegant gradient backgrounds
- Animated particles and floating elements
- Professional typography with Poppins font
- Responsive design for all devices

### Scroll Animations
- **AOS Integration**: Smooth fade, slide, and scale animations
- **Custom Timing**: Staggered animations for visual hierarchy
- **Performance Optimized**: GPU-accelerated transforms

### Interactive Elements
- **Hover Effects**: 3D transforms and color transitions
- **Glass Morphism**: Backdrop blur effects
- **Gradient Animations**: Dynamic color transitions
- **Particle Systems**: Floating background elements

## 🌟 Key Components

### BrandingSection
- Full-screen hero with animated particles
- 3D logo with hover effects
- Gradient text and call-to-action buttons

### NewArrivalsSection
- Dark theme with floating geometric shapes
- Product grid with hover overlays
- Animated borders and glass morphism

### TaglinesSection
- Staggered text animations
- Floating particle background
- Interactive call-to-action

### ProjectHighlights
- Portfolio grid with hover effects
- Animated borders and overlays
- Professional project showcase

## 🎯 Performance Optimizations

- **Vite**: Fast development and optimized builds
- **CSS Transforms**: Hardware acceleration
- **Intersection Observer**: Efficient scroll detection
- **Lazy Loading**: On-demand resource loading
- **Tree Shaking**: Optimized bundle size

## 🎨 Customization

### Colors
The color palette is defined in `tailwind.config.js`:
```javascript
colors: {
  'warm-orange': '#FF8025',
  'charcoal': '#39853',
  'pure-white': '#FFFFFF',
}
```

### Animations
Custom animations are defined in the Tailwind config:
- `animate-float`: Floating elements
- `animate-gradient-x`: Gradient animations
- `animate-particle-float`: Particle movements

### Typography
Using Poppins font family with weights from 300-800 for professional typography hierarchy.

## 🚀 Deployment

```bash
# Build for production
npm run build

# The dist/ folder contains the production build
# Deploy to your preferred hosting service
```

## 📱 Browser Support

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License.

---

Built with ❤️ using Vue 3 and modern web technologies
