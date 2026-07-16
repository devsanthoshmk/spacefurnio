import { test, expect } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';

const SCREENSHOT_DIR = '/home/santhoshmk/.gemini/antigravity/brain/80209971-9a44-4e03-8839-391ff4c8de49/screenshots';

// Ensure screenshot directory exists
if (!fs.existsSync(SCREENSHOT_DIR)) {
  fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });
}

test.describe('Custom Scroll Behavior Tests', () => {
  let consoleErrors = [];
  let pageErrors = [];

  test.beforeEach(async ({ page }) => {
    consoleErrors = [];
    pageErrors = [];

    // Capture console messages
    page.on('console', msg => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });

    // Capture page errors
    page.on('pageerror', err => {
      pageErrors.push(err.message);
    });

    // Navigate to homepage
    await page.goto('http://localhost:5173/');
    // Wait for the app to be mounted
    await page.waitForSelector('#scroll-wrapper');
  });

  test.afterEach(async ({ page }, testInfo) => {
    // Assert no console or page errors
    expect(consoleErrors).toEqual([]);
    expect(pageErrors).toEqual([]);
  });

  // Test 1: Desktop Mouse Wheel Scrolling (Step-by-step and rapid)
  test('Desktop Mouse Wheel - Scroll Down and Up', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });

    const wrapper = page.locator('#scroll-wrapper');
    const sections = page.locator('#scroll-wrapper > .scroll-section');
    const count = await sections.count();
    expect(count).toBe(4);

    // Initial state: first section active
    await expect(sections.nth(0)).toHaveClass(/active/);

    // 1. Mouse wheel scroll down step-by-step
    for (let i = 1; i < count; i++) {
      console.log(`[Mouse Wheel] Scrolling down to section ${i}`);
      // Simulate mouse wheel down
      await page.mouse.wheel(0, 300);
      
      // Wait for throttle (400ms) + animation to settle
      await page.waitForTimeout(600);
      
      // Verify active state
      await expect(sections.nth(i)).toHaveClass(/active/);
      
      // Capture screenshot
      await page.screenshot({ path: path.join(SCREENSHOT_DIR, `desktop_wheel_down_section_${i}.png`) });
    }

    // 2. Mouse wheel scroll up step-by-step
    for (let i = count - 2; i >= 0; i--) {
      console.log(`[Mouse Wheel] Scrolling up to section ${i}`);
      await page.mouse.wheel(0, -300);
      await page.waitForTimeout(600);
      await expect(sections.nth(i)).toHaveClass(/active/);
      await page.screenshot({ path: path.join(SCREENSHOT_DIR, `desktop_wheel_up_section_${i}.png`) });
    }
  });

  // Test 2: Keyboard Scrolling (Arrow Up/Down, Page Up/Down, Home/End, Space)
  test('Keyboard Navigation', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    const sections = page.locator('#scroll-wrapper > .scroll-section');

    // Make sure we focus the page body or wrapper
    await page.focus('#scroll-wrapper');

    // ArrowDown
    console.log('[Keyboard] Pressing ArrowDown');
    await page.keyboard.press('ArrowDown');
    await page.waitForTimeout(600);
    await expect(sections.nth(1)).toHaveClass(/active/);
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, `keyboard_arrow_down.png`) });

    // PageDown
    console.log('[Keyboard] Pressing PageDown');
    await page.keyboard.press('PageDown');
    await page.waitForTimeout(600);
    await expect(sections.nth(2)).toHaveClass(/active/);
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, `keyboard_page_down.png`) });

    // End
    console.log('[Keyboard] Pressing End');
    await page.keyboard.press('End');
    await page.waitForTimeout(600);
    await expect(sections.nth(3)).toHaveClass(/active/);
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, `keyboard_end.png`) });

    // ArrowUp
    console.log('[Keyboard] Pressing ArrowUp');
    await page.keyboard.press('ArrowUp');
    await page.waitForTimeout(600);
    await expect(sections.nth(2)).toHaveClass(/active/);
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, `keyboard_arrow_up.png`) });

    // PageUp
    console.log('[Keyboard] Pressing PageUp');
    await page.keyboard.press('PageUp');
    await page.waitForTimeout(600);
    await expect(sections.nth(1)).toHaveClass(/active/);
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, `keyboard_page_up.png`) });

    // Home
    console.log('[Keyboard] Pressing Home');
    await page.keyboard.press('Home');
    await page.waitForTimeout(600);
    await expect(sections.nth(0)).toHaveClass(/active/);
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, `keyboard_home.png`) });
  });

  // Test 3: Rapid Scroll Inputs / Direction Changes
  test('Rapid Repeated Scrolling and Direction Changes', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    const sections = page.locator('#scroll-wrapper > .scroll-section');

    console.log('[Rapid] Sending multiple wheel events quickly');
    // Scroll down 3 times rapidly (throttle should ignore the 2nd and 3rd)
    await page.mouse.wheel(0, 300);
    await page.waitForTimeout(50);
    await page.mouse.wheel(0, 300);
    await page.waitForTimeout(50);
    await page.mouse.wheel(0, 300);

    // Wait and check if we are on section 1 (meaning the other events were successfully throttled)
    await page.waitForTimeout(800);
    await expect(sections.nth(1)).toHaveClass(/active/);
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, `rapid_throttle_success.png`) });

    // Rapid direction change
    console.log('[Rapid] Direction change: scroll down then immediately up');
    await page.mouse.wheel(0, 300); // Trigger section 2
    await page.waitForTimeout(50);
    await page.mouse.wheel(0, -300); // Trigger scroll up immediately (should be ignored by throttle)
    
    await page.waitForTimeout(800);
    // Should be on section 2, not section 1
    await expect(sections.nth(2)).toHaveClass(/active/);
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, `rapid_direction_change.png`) });
  });

  // Test 4: Mobile Touch Swipe Gestures
  test('Mobile Viewport - Touch Swipe', async ({ page }) => {
    // Emulate a mobile device size
    await page.setViewportSize({ width: 390, height: 844 });
    const sections = page.locator('#scroll-wrapper > .scroll-section');

    // Function to perform swipe down (moves content up -> page moves down)
    const swipeDown = async () => {
      await page.evaluate(() => {
        const wrapper = document.getElementById('scroll-wrapper');
        const touchObj = new Touch({
          identifier: 1,
          target: wrapper,
          clientX: 200,
          clientY: 500,
          screenX: 200,
          screenY: 500,
          pageX: 200,
          pageY: 500
        });
        // Dispatch touchstart
        const start = new TouchEvent('touchstart', {
          bubbles: true,
          cancelable: true,
          touches: [touchObj],
          targetTouches: [touchObj],
          changedTouches: [touchObj]
        });
        wrapper.dispatchEvent(start);

        const moveTouchObj = new Touch({
          identifier: 1,
          target: wrapper,
          clientX: 200,
          clientY: 350,
          screenX: 200,
          screenY: 350,
          pageX: 200,
          pageY: 350
        });
        // Dispatch touchmove (drag up by 150px)
        const move = new TouchEvent('touchmove', {
          bubbles: true,
          cancelable: true,
          touches: [moveTouchObj],
          targetTouches: [moveTouchObj],
          changedTouches: [moveTouchObj]
        });
        wrapper.dispatchEvent(move);
      });
    };

    // Function to perform swipe up (moves content down -> page moves up)
    const swipeUp = async () => {
      await page.evaluate(() => {
        const wrapper = document.getElementById('scroll-wrapper');
        const touchObj = new Touch({
          identifier: 1,
          target: wrapper,
          clientX: 200,
          clientY: 200,
          screenX: 200,
          screenY: 200,
          pageX: 200,
          pageY: 200
        });
        // Dispatch touchstart
        const start = new TouchEvent('touchstart', {
          bubbles: true,
          cancelable: true,
          touches: [touchObj],
          targetTouches: [touchObj],
          changedTouches: [touchObj]
        });
        wrapper.dispatchEvent(start);

        const moveTouchObj = new Touch({
          identifier: 1,
          target: wrapper,
          clientX: 200,
          clientY: 350,
          screenX: 200,
          screenY: 350,
          pageX: 200,
          pageY: 350
        });
        // Dispatch touchmove (drag down by 150px)
        const move = new TouchEvent('touchmove', {
          bubbles: true,
          cancelable: true,
          touches: [moveTouchObj],
          targetTouches: [moveTouchObj],
          changedTouches: [moveTouchObj]
        });
        wrapper.dispatchEvent(move);
      });
    };

    // Swipe down to section 1
    console.log('[Mobile Touch] Swiping down');
    await swipeDown();
    await page.waitForTimeout(600);
    await expect(sections.nth(1)).toHaveClass(/active/);
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, `mobile_swipe_down_1.png`) });

    // Swipe down to section 2
    console.log('[Mobile Touch] Swiping down again');
    await swipeDown();
    await page.waitForTimeout(600);
    await expect(sections.nth(2)).toHaveClass(/active/);
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, `mobile_swipe_down_2.png`) });

    // Swipe up to section 1
    console.log('[Mobile Touch] Swiping up');
    await swipeUp();
    await page.waitForTimeout(600);
    await expect(sections.nth(1)).toHaveClass(/active/);
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, `mobile_swipe_up.png`) });
  });

  // Test 5: Check layout alignment, overlaps, layout shifts
  test('Layout and Alignment Verification', async ({ page }) => {
    await page.setViewportSize({ width: 1024, height: 768 }); // A different size
    const wrapper = page.locator('#scroll-wrapper');
    const sections = page.locator('#scroll-wrapper > .scroll-section');
    const count = await sections.count();

    for (let i = 0; i < count; i++) {
      // Let's scroll step-by-step
      if (i > 0) {
        await page.mouse.wheel(0, 300);
        await page.waitForTimeout(600);
      }

      // Check offset
      const transform = await wrapper.evaluate(el => el.style.transform);
      console.log(`[Layout] Section ${i} transform: ${transform}`);
      
      // Get bounding boxes to ensure no overlap and correct scroll snapping
      const currentSection = sections.nth(i);
      const sectionBox = await currentSection.boundingBox();
      
      // Expect section to be snapped perfectly to viewport top (Y coordinate relative to viewport)
      // Since it's viewport relative, the active section should be at Y = 0 (or close to it)
      expect(Math.abs(sectionBox.y)).toBeLessThanOrEqual(5);

      // Verify sizes are aligned
      expect(sectionBox.width).toBe(1024);
      expect(sectionBox.height).toBeGreaterThanOrEqual(768); // can be taller for sections with overflow

      await page.screenshot({ path: path.join(SCREENSHOT_DIR, `layout_alignment_section_${i}.png`) });
    }
  });
});
