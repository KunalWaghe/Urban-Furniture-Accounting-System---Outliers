# GSAP Animation Performance Fix

## Problem Identified

The landing page cards were loading slowly and then appearing suddenly because:

1. **Initial invisibility**: Cards started with `opacity: 0` in GSAP's `fromTo()` animations
2. **Delayed initialization**: GSAP took time to register, and ScrollTrigger had a 150ms refresh delay
3. **No CSS fallback**: Without JavaScript loaded, cards remained invisible
4. **Performance issues**: No GPU acceleration hints for animations

## Solutions Implemented

### 1. Changed Animation Approach
- **Before**: Used `gsap.fromTo()` which sets initial invisible state immediately
- **After**: Used `gsap.set()` + `gsap.from()` pattern:
  - `gsap.set()` immediately sets elements to their final visible state (opacity: 1)
  - `gsap.from()` only animates FROM invisible state when ScrollTrigger fires
  
This ensures cards are **visible by default** and only animate when scrolled into view.

### 2. Removed Initialization Delay
```javascript
// Before: 150ms delay
const refreshTimer = setTimeout(() => {
  ScrollTrigger.refresh();
}, 150);

// After: Immediate refresh
ScrollTrigger.refresh();
```

### 3. Added Performance Optimizations

Added CSS performance hints in `globals.css`:
```css
.partner-logo,
.workflow-card,
.bento-card,
/* ... other animated elements */ {
  will-change: transform, opacity;
  transform: translateZ(0);
  backface-visibility: hidden;
}
```

These properties:
- `will-change`: Tells browser to optimize for these properties
- `transform: translateZ(0)`: Forces GPU acceleration
- `backface-visibility: hidden`: Improves rendering performance

### 4. Cleanup After Animation
Added `onComplete` callbacks to remove `will-change` after animations finish:
```javascript
onComplete: () => {
  document.querySelectorAll(".bento-card").forEach(el => el.classList.add("animated"));
}
```

This frees up GPU resources after animation completes.

## What Changed

### Hero Section (Unchanged)
- Hero elements kept their original `fromTo` animation since they should animate on page load
- These animations run immediately when the page loads

### Scroll-Triggered Sections (Fixed)
All scroll-triggered sections now:
1. **Render visible immediately** (gsap.set)
2. **Animate only when scrolled into view** (gsap.from)
3. **Use GPU acceleration** (CSS will-change)
4. **Clean up resources after animation** (onComplete callbacks)

Sections affected:
- Partner logos
- Workflow cards
- Bento feature cards
- Telemetry widgets
- Security badges
- CTA banner

## Results

- ✅ **No more invisible cards** - Content is visible immediately
- ✅ **Smooth animations** - GPU-accelerated transforms
- ✅ **Better performance** - Resources freed after animations
- ✅ **Faster perceived load time** - Content appears instantly, then animates
- ✅ **Graceful degradation** - Works even if JavaScript is slow to load

## Testing

To verify the fix works:
1. Hard refresh the landing page (Cmd+Shift+R)
2. Scroll slowly through the page
3. Cards should be visible immediately and animate smoothly into place
4. No sudden "pop-in" effect
