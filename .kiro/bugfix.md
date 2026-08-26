# Bugfix Specification: Aether Particle Effect Not Visible

## Introduction

### Problem Statement
Efek partikel Aether interaktif tidak terlihat di hero section landing page utama (pps/web/app/page.tsx), meskipun implementasi canvas dan particle system ada di kode. Efek ini sebelumnya ada dan berfungsi di versi GitHub sebelumnya.

### Impact Assessment
- **User Impact:** HIGH - Kehilangan elemen visual interaktif penting yang membedakan landing page
- **Visual Appeal:** Landing page terlihat flat tanpa efek partikel yang menarik
- **Brand Identity:** Aether effect adalah signature visual element yang hilang
- **Technical Debt:** Implementation exists but non-functional

### Affected Components
- pps/web/app/page.tsx - Hero section (lines 890-1002, 1767-1778)
- Canvas particle system dengan mouse interaction
- Hero section background layering

---

## Bug Analysis

### Current Behavior (Defect)

**Observable Symptoms:**
1. Canvas element ada di DOM tetapi tidak menampilkan partikel visual
2. Hero section hanya menampilkan:
   - Radial gradient blur background (rgba biru/ungu/amber)
   - Bottom fade gradient
   - Konten teks dan CTA buttons
3. Tidak ada partikel berwarna yang bergerak
4. Mouse interaction tidak menghasilkan efek repulsion pada partikel
5. Tidak ada garis koneksi antar partikel yang terlihat

**Technical Evidence:**
- Canvas element present in DOM: <canvas ref={aetherCanvasRef} style={{...}}>
- Canvas styling: position: absolute, top: 0, left: 0, width: 100%, height: 100%, zIndex: 0, opacity: 0.9
- useEffect hook executes particle initialization
- Animation loop with requestAnimationFrame implemented

**Reproduction Steps:**
1. Buka landing page utama (http://localhost:3000/)
2. Scroll ke hero section (bagian paling atas)
3. Amati background - tidak ada partikel bergerak
4. Gerakkan mouse di area hero - tidak ada interaksi visual

**Browser Console Observations:**
- (To be verified) No JavaScript errors related to canvas
- (To be verified) Canvas dimensions might be 0x0
- (To be verified) Particle array might be empty

---

### Expected Behavior (Correct)

**Visual Appearance:**
1. **Animated Particles:**
   - Partikel berwarna bergerak smooth di background hero
   - Colors: Monday.com palette (biru #0073EA, ungu #784BD1, amber #FDAB3D, emerald #00C875, coral #E2445C)
   - Size: 1.2px - 3.7px diameter
   - Opacity: ~0.85 per particle
   - Movement: Slow drift (velocity -0.25 to +0.25 pixels/frame)

2. **Connection Lines:**
   - Garis tipis menghubungkan partikel yang berdekatan
   - Opacity based on distance (fade with distance)
   - Color: Light purple gba(120, 75, 209, 0.4) normal
   - Color: Blue gba(0, 115, 234, 0.9) saat dekat mouse (within 200px radius)

3. **Mouse Interaction:**
   - Mouse cursor memiliki radius influence 200px
   - Partikel dalam radius ter-repel dengan smooth force calculation
   - Force direction: away from mouse cursor
   - Force magnitude: proportional to distance (stronger when closer)

4. **Canvas Integration:**
   - Canvas renders behind content (zIndex: 0)
   - Canvas opacity: 0.9 (slightly transparent)
   - Canvas full-width and full-height of hero section (~650px height minimum)
   - Particles re-initialize on window resize

**Reference Implementation:**
- Lihat pps/web/components/ui/aether-flow-hero.tsx (working demo component)
- Lihat demo page: /demo/aether-flow (jika efek bekerja di sana)

---

### Unchanged Behavior (Regression Prevention)

**Must Remain Functional:**
1. **Hero Content Layering:**
   - Announcement badge tetap readable
   - Judul "A platform built for a new way of working with AI" tetap prominent
   - Subtitle tetap readable
   - CTA buttons ("Get Started Free", "Explore Live Board") tetap clickable
   - Benefit pills di bawah CTA tetap visible

2. **Hero Background Elements:**
   - Radial gradient blur ambient glow tetap ada (as designed)
   - Bottom fade gradient transition ke beige canvas tetap smooth

3. **Responsive Behavior:**
   - Hero section tetap responsive di mobile/tablet
   - Canvas particles adjust density based on screen size
   - Performance tetap smooth (60fps target)

4. **Other Page Sections:**
   - Marquee section tidak terpengaruh
   - Board section tidak terpengaruh
   - Bento features section tidak terpengaruh

5. **Memory Management:**
   - useEffect cleanup properly cancels animation frame
   - Event listeners properly removed on unmount
   - No memory leaks during page navigation

---

## Root Cause Hypotheses

### Hypothesis 1: Canvas Dimensions Not Set (MOST LIKELY)
**Probability:** 85%

**Reasoning:**
- Canvas element menggunakan \width: '100%', height: '100%'\ di inline style
- Tetapi HTML canvas element requires explicit \canvas.width\ and \canvas.height\ properties
- CSS width/height ≠ Canvas internal drawing buffer dimensions
- If \canvas.width\ and \canvas.height\ are default (300x150 or 0x0), particles won't render correctly

**Evidence:**
- \esizeCanvas()\ function sets \canvas.width = window.innerWidth\ and \canvas.height = window.innerHeight\
- However, parent container might not be mounted when useEffect runs
- \window.innerWidth\ might be correct, but hero section height is NOT full viewport
- Hero section has explicit \minHeight: '100vh'\ but rendered height might differ

**Diagnostic Test:**
`	ypescript
console.log({
  canvasWidth: canvas.width,
  canvasHeight: canvas.height,
  cssWidth: canvas.style.width,
  cssHeight: canvas.style.height,
  parentHeight: canvas.parentElement?.offsetHeight
});
`

**Expected Bug Signature:**
- \canvas.width\ and \canvas.height\ are 0 or very small
- \particles.length\ is 0 or very few particles created

---

### Hypothesis 2: Z-Index Stacking Context Occlusion
**Probability:** 10%

**Reasoning:**
- Canvas has \zIndex: 0\
- Gradient overlay div has no explicit z-index (defaults to auto/0)
- Bottom fade gradient also has no z-index
- If gradients are rendered after canvas in DOM order, they might cover it

**Evidence:**
- Canvas is rendered AFTER gradient overlays in JSX order
- Gradients have \pointerEvents: 'none'\ but that doesn't affect visual layering

**Diagnostic Test:**
- Inspect z-index stacking in DevTools
- Temporarily set canvas \zIndex: 10\ to test

**Expected Bug Signature:**
- Canvas is rendered but visually covered by gradients

---

### Hypothesis 3: Animation Loop Not Starting
**Probability:** 5%

**Reasoning:**
- \equestAnimationFrame\ might not be firing
- \nimate()\ function might exit early due to context check

**Evidence:**
- \if (!ctx) return;\ guard in animate function

**Diagnostic Test:**
`	ypescript
let frameCount = 0;
const animate = () => {
  frameCount++;
  if (frameCount % 60 === 0) console.log('Frame:', frameCount);
  // ... rest
};
`

**Expected Bug Signature:**
- No console logs → animation not running

---

## Tasks

### Task 1: Write Bug Condition Exploration Property Test

**Objective:** Create diagnostic test to identify exact failure point in canvas/particle rendering pipeline

**Test Scenarios:**
1. ✓ Canvas element exists in DOM
2. ✓ Canvas has valid 2D rendering context
3. ✓ Canvas dimensions are greater than 0
4. ✓ Particle array is populated with expected count
5. ✓ Animation frame loop is executing
6. ✓ Particles are being drawn (fillRect calls succeed)

**Implementation:**
`	ypescript
// apps/web/app/__tests__/aether-canvas-diagnostic.test.tsx
import { render } from '@testing-library/react';

describe('Aether Canvas Bug Exploration', () => {
  it('should have non-zero canvas dimensions', () => {
    const { container } = render(<MondayWarmBeigeLandingPage />);
    const canvas = container.querySelector('canvas');
    
    expect(canvas).toBeTruthy();
    expect(canvas.width).toBeGreaterThan(0);
    expect(canvas.height).toBeGreaterThan(0);
  });
  
  it('should initialize particles array', async () => {
    // Test particle initialization logic
  });
});
`

**Success Criteria:**
- Test fails on current code (confirming bug)
- Test identifies exact failure point (which assertion fails)

---

### Task 2: Implement Canvas Dimension Fix

**Objective:** Ensure canvas internal dimensions match rendered size

**Changes to pps/web/app/page.tsx:**

`	ypescript
// Replace resizeCanvas function (around line 920)
const resizeCanvas = () => {
  if (!canvas) return;
  
  // CRITICAL FIX: Get parent container dimensions, not window
  const parentElement = canvas.parentElement;
  if (!parentElement) {
    console.warn('Canvas parent not found, retrying...');
    setTimeout(resizeCanvas, 50);
    return;
  }
  
  const rect = parentElement.getBoundingClientRect();
  const width = rect.width || window.innerWidth;
  const height = rect.height || 650; // Hero section typical height
  
  // Safety check for zero dimensions
  if (width === 0 || height === 0) {
    console.warn('Zero dimensions detected, deferring initialization');
    setTimeout(resizeCanvas, 100);
    return;
  }
  
  // Set canvas internal drawing buffer size
  canvas.width = width;
  canvas.height = height;
  
  console.log('Canvas resized:', { width, height, particleCount: Math.floor((height * width) / 10000) });
  
  init();
};

// Add slight delay to ensure parent is mounted
setTimeout(resizeCanvas, 0);
window.addEventListener('resize', resizeCanvas);
`

**Success Criteria:**
- Canvas width and height are > 0 in console log
- Particles array is populated
- Visual particles appear on page

---

### Task 3: Verify Z-Index Layering

**Objective:** Ensure canvas is not occluded by gradient overlays

**Changes:**
`	ypescript
// Update canvas style (line 1770)
<canvas
  ref={aetherCanvasRef}
  style={{
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    pointerEvents: 'none',
    zIndex: 1, // CHANGED: From 0 to 1
    opacity: 0.9,
  }}
/>

// Update gradient overlay z-index (line ~1759)
<div
  style={{
    position: 'absolute',
    top: '20px',
    left: '50%',
    transform: 'translateX(-50%)',
    width: '85%',
    maxWidth: '1000px',
    height: '420px',
    background: 'radial-gradient(...)',
    filter: 'blur(50px)',
    pointerEvents: 'none',
    zIndex: 0, // EXPLICIT: Ensure gradient is behind canvas
  }}
/>
`

**Success Criteria:**
- Canvas renders above gradient blur
- Canvas remains behind text content (content has zIndex: 10)

---

### Task 4: Add Animation Frame Monitoring

**Objective:** Confirm animation loop is executing

**Changes:**
`	ypescript
// Add frame counter (around line 905)
let frameCount = 0;

const animate = () => {
  if (!ctx) return;
  animationFrameId = requestAnimationFrame(animate);
  
  frameCount++;
  if (frameCount === 1) {
    console.log('✓ Animation started');
  }
  if (frameCount % 300 === 0) {
    console.log('✓ Animation running:', { 
      frames: frameCount, 
      particles: particles.length,
      fps: '~60'
    });
  }
  
  // ... rest of animate logic
};
`

**Success Criteria:**
- Console shows "✓ Animation started"
- Periodic frame count logs appear

---

### Task 5: Integration Testing & Visual Verification

**Objective:** Confirm bug is fully resolved across browsers

**Test Checklist:**
- [ ] Partikel visible di Chrome Desktop
- [ ] Partikel visible di Firefox Desktop
- [ ] Partikel visible di Edge Desktop
- [ ] Mouse repulsion effect works
- [ ] Connection lines appear between nearby particles
- [ ] Window resize re-initializes particles correctly
- [ ] No console errors
- [ ] Hero content remains clickable
- [ ] Performance: Smooth 60fps animation (check DevTools Performance tab)

**Acceptance Criteria:**
- All checklist items pass
- No regressions in other page sections

---

## Implementation Notes

### Development Environment
- Framework: Next.js 14+ (React 18+)
- Styling: Inline styles + CSS-in-JS
- Browser Target: Chrome 90+, Firefox 88+, Safari 14+, Edge 90+

### Performance Considerations
- Target: 60fps animation
- Particle count: ~(width * height) / 10000 particles
- Example: 1920x650 = ~125 particles (reasonable for smooth performance)
- Connection line calculations: O(n²) but limited by distance threshold

### Debugging Tools
- React DevTools: Check component mounting
- Browser DevTools > Elements: Inspect canvas element and computed styles
- Browser DevTools > Console: Monitor initialization logs
- Browser DevTools > Performance: Profile animation frame timing

