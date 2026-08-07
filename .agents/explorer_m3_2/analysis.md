# Feature F10 Technical Analysis: Hero Text Staggered Entrance

## Executive Summary
This analysis addresses **Feature F10: Hero Text Staggered Entrance**, part of Milestone 3 of the Creator Cash Flow (CCF) redesign project. Currently, the landing page applies an un-staggered `fadeSlideUp` animation globally across `h1` and `p` elements without `animation-delay` modifiers. This analysis provides exact CSS keyframe definitions, timing functions, utility classes, HTML element mappings, and edge case strategies to achieve a smooth staggered entrance (0ms badge -> 100ms title -> 200ms description -> 300ms CTAs -> 400ms product mockup).

---

## 1. Audit of Current Hero Section Implementation

### 1.1 Existing CSS Animations in `style.css`
Lines 99–116 in `style.css`:
```css
@keyframes fadeSlideUp {
    from {
        opacity: 0;
        transform: translateY(12px);
    }
    to {
        opacity: 1;
        transform: translateY(0);
    }
}

/* Hero text fade + slide up */
.marketing-page-wrapper h1, 
.marketing-page-wrapper p, 
.onboarding-wrapper h1, 
.dashboard-balance-header h1 {
    animation: fadeSlideUp 0.8s cubic-bezier(0.16, 1, 0.3, 1) forwards;
}
```

### 1.2 Identified Gaps & Deficiencies
1. **Zero Staggering**: `h1` and `p` start their animations simultaneously at 0ms delay.
2. **Missing CTA & Badge Stagger**: CTA buttons container (`div.flex`) and top announcement badges are omitted from entrance animations.
3. **Risk of FOUC / Flash on Delayed Elements**: When `animation-delay` is added, elements without an initial `opacity: 0` or `animation-fill-mode: backwards/both` will render at full opacity before keyframe trigger.
4. **Coarse CSS Selectors**: Targeting broad HTML tags (`h1`, `p`) creates unexpected animation side-effects across non-hero elements.
5. **Animation Conflict with Floating Badges**: Floating badges (`.animate-float`) use infinite floating keyframes (`floatBadge`), which would clash if entrance keyframe shorthand is combined directly on the same element.

---

## 2. Precise CSS Keyframe & Timing Specifications

### 2.1 Refined Keyframe Definition (`fadeSlideUp`)
```css
/* ==========================================================================
   FEATURE F10: HERO TEXT STAGGERED ENTRANCE KEYFRAMES & UTILITIES
   ========================================================================== */

@keyframes fadeSlideUp {
    0% {
        opacity: 0;
        transform: translateY(18px);
    }
    100% {
        opacity: 1;
        transform: translateY(0);
    }
}
```

### 2.2 Base Staggered Item Class
```css
.hero-stagger-item {
    opacity: 0; /* Prevents initial flash prior to delay trigger */
    will-change: opacity, transform;
    animation: fadeSlideUp 0.8s cubic-bezier(0.16, 1, 0.3, 1) forwards;
}
```

### 2.3 Stagger Delay Utility Classes
```css
/* Delay Modifiers for Staggering */
.delay-0, .hero-delay-0       { animation-delay: 0ms; }
.delay-100, .hero-delay-100   { animation-delay: 100ms; }
.delay-200, .hero-delay-200   { animation-delay: 200ms; }
.delay-300, .hero-delay-300   { animation-delay: 300ms; }
.delay-400, .hero-delay-400   { animation-delay: 400ms; }
```

### 2.4 Reduced Motion Accessibility Guard
```css
@media (prefers-reduced-motion: reduce) {
    .hero-stagger-item {
        animation: none !important;
        opacity: 1 !important;
        transform: none !important;
    }
}
```

---

## 3. HTML Class Assignments & Stagger Sequence

### 3.1 Hero Stagger Mapping Table

| Step | Delay | Target Selector / Element | Visual Role | Proposed CSS Classes |
|------|-------|--------------------------|-------------|----------------------|
| **0** | `0ms` | Top Badge / Announcement Pill | Hero Badge | `hero-stagger-item delay-0` |
| **1** | `100ms` | Hero Heading (`h1`) | Hero Title | `hero-stagger-item delay-100` |
| **2** | `200ms` | Hero Description (`p`) | Hero Subtitle | `hero-stagger-item delay-200` |
| **3** | `300ms` | Callouts Container (`div.flex`) | CTA Buttons | `hero-stagger-item delay-300` |
| **4** | `400ms` | Product Mockup (`#hero-mockup-section`) | Hero Arc Frame | `hero-stagger-item delay-400` |

### 3.2 Proposed `index.html` Markup Changes

```html
<!-- Hero Section -->
<section class="mb-3xl text-center relative z-10 max-w-3xl mx-auto">
    <!-- Step 0: Badge (0ms) -->
    <div class="hero-stagger-item delay-0 inline-flex items-center gap-xs px-3.5 py-1.5 rounded-full bg-white/[0.04] border border-white/[0.1] text-xs font-semibold text-accent-emerald mb-md backdrop-blur-md">
        <span class="w-2 h-2 rounded-full bg-accent-emerald animate-pulse"></span>
        <span>Next-Gen Creator OS 2.0</span>
    </div>

    <!-- Step 1: Title (100ms) -->
    <h1 class="hero-stagger-item delay-100 font-display font-extrabold text-4xl sm:text-5xl lg:text-6xl text-white leading-tight mb-md">
        Financial Intelligence<br>for Modern Creators
    </h1>

    <!-- Step 2: Subtitle (200ms) -->
    <p class="hero-stagger-item delay-200 font-body-md text-text-secondary mb-xl max-w-lg mx-auto">
        Track earnings. Understand growth. Build a sustainable creator business.
    </p>

    <!-- Step 3: Callout CTAs (300ms) -->
    <div class="hero-stagger-item delay-300 flex flex-col sm:flex-row gap-md justify-center">
        <button class="bg-white text-black font-bold font-label-lg py-md px-xl rounded-xl shadow-lg active:scale-95 transition-transform" onclick="switchView('onboarding')">
            Start Free
        </button>
        <button class="flex items-center justify-center gap-xs font-label-lg text-white py-md px-xl rounded-xl border border-white/[0.08] bg-surface hover:bg-white/[0.03] active:scale-95 transition-transform" onclick="enterDemoMode()">
            Watch Demo <span class="material-symbols-outlined">arrow_forward</span>
        </button>
    </div>
</section>

<!-- Step 4: Hero Product Mockup Section (400ms) -->
<section class="hero-stagger-item delay-400 mb-3xl max-w-4xl mx-auto px-xs sm:px-md relative z-10" id="hero-mockup-section">
    ...
```

---

## 4. Verification & Testing Method

1. **Visual Sweep Verification**: Load `index.html` in browser and verify that elements enter in 100ms increments (Badge -> Title -> Subtitle -> CTAs -> Mockup) without visual flashes.
2. **Reduced Motion Check**: Toggle OS / browser prefers-reduced-motion to confirm animations gracefully degrade.
3. **Console Verification**: Ensure no JS runtime errors are triggered during initial layout rendering.
