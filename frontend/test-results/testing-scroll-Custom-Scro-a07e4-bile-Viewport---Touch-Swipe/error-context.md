# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: testing/scroll.spec.js >> Custom Scroll Behavior Tests >> Mobile Viewport - Touch Swipe
- Location: testing/scroll.spec.js:164:3

# Error details

```
Error: expect(locator).toHaveClass(expected) failed

Locator: locator('#scroll-wrapper > .scroll-section').nth(2)
Expected pattern: /active/
Received string:  "scroll-section"
Timeout: 5000ms

Call log:
  - Expect "toHaveClass" with timeout 5000ms
  - waiting for locator('#scroll-wrapper > .scroll-section').nth(2)
    14 × locator resolved to <section class="scroll-section">…</section>
       - unexpected value "scroll-section"

```

```yaml
- heading "You'll find us" [level=2]
- button "" [disabled]
- button ""
- img "Luxurious Modern Sofa"
- button "Add to Wishlist":
  - img
- button "Quick Add":
  - img
- paragraph: Spacefurnio
- img
- text: "5"
- heading "Luxurious Modern Sofa" [level=3]:
  - link "Luxurious Modern Sofa":
    - /url: .//1
- paragraph: $899
- text:  Coming Soon 
- img "Minimalist Dining Chair"
- button "Add to Wishlist":
  - img
- button "Quick Add":
  - img
- paragraph: Spacefurnio
- img
- text: "5"
- heading "Minimalist Dining Chair" [level=3]:
  - link "Minimalist Dining Chair":
    - /url: .//2
- paragraph: $249
- text:  Coming Soon 
- img "Scandinavian Coffee Table"
- button "Add to Wishlist":
  - img
- button "Quick Add":
  - img
- paragraph: Spacefurnio
- img
- text: "5"
- heading "Scandinavian Coffee Table" [level=3]:
  - link "Scandinavian Coffee Table":
    - /url: .//3
- paragraph: $449
- text:  Coming Soon 
- img "Designer Floor Lamp"
- button "Add to Wishlist":
  - img
- button "Quick Add":
  - img
- paragraph: Spacefurnio
- img
- text: "5"
- heading "Designer Floor Lamp" [level=3]:
  - link "Designer Floor Lamp":
    - /url: .//4
- paragraph: $199
- text:  Coming Soon 
```

# Test source

```ts
  172 |         const wrapper = document.getElementById('scroll-wrapper');
  173 |         const touchObj = new Touch({
  174 |           identifier: 1,
  175 |           target: wrapper,
  176 |           clientX: 200,
  177 |           clientY: 500,
  178 |           screenX: 200,
  179 |           screenY: 500,
  180 |           pageX: 200,
  181 |           pageY: 500
  182 |         });
  183 |         // Dispatch touchstart
  184 |         const start = new TouchEvent('touchstart', {
  185 |           bubbles: true,
  186 |           cancelable: true,
  187 |           touches: [touchObj],
  188 |           targetTouches: [touchObj],
  189 |           changedTouches: [touchObj]
  190 |         });
  191 |         wrapper.dispatchEvent(start);
  192 | 
  193 |         const moveTouchObj = new Touch({
  194 |           identifier: 1,
  195 |           target: wrapper,
  196 |           clientX: 200,
  197 |           clientY: 350,
  198 |           screenX: 200,
  199 |           screenY: 350,
  200 |           pageX: 200,
  201 |           pageY: 350
  202 |         });
  203 |         // Dispatch touchmove (drag up by 150px)
  204 |         const move = new TouchEvent('touchmove', {
  205 |           bubbles: true,
  206 |           cancelable: true,
  207 |           touches: [moveTouchObj],
  208 |           targetTouches: [moveTouchObj],
  209 |           changedTouches: [moveTouchObj]
  210 |         });
  211 |         wrapper.dispatchEvent(move);
  212 |       });
  213 |     };
  214 | 
  215 |     // Function to perform swipe up (moves content down -> page moves up)
  216 |     const swipeUp = async () => {
  217 |       await page.evaluate(() => {
  218 |         const wrapper = document.getElementById('scroll-wrapper');
  219 |         const touchObj = new Touch({
  220 |           identifier: 1,
  221 |           target: wrapper,
  222 |           clientX: 200,
  223 |           clientY: 200,
  224 |           screenX: 200,
  225 |           screenY: 200,
  226 |           pageX: 200,
  227 |           pageY: 200
  228 |         });
  229 |         // Dispatch touchstart
  230 |         const start = new TouchEvent('touchstart', {
  231 |           bubbles: true,
  232 |           cancelable: true,
  233 |           touches: [touchObj],
  234 |           targetTouches: [touchObj],
  235 |           changedTouches: [touchObj]
  236 |         });
  237 |         wrapper.dispatchEvent(start);
  238 | 
  239 |         const moveTouchObj = new Touch({
  240 |           identifier: 1,
  241 |           target: wrapper,
  242 |           clientX: 200,
  243 |           clientY: 350,
  244 |           screenX: 200,
  245 |           screenY: 350,
  246 |           pageX: 200,
  247 |           pageY: 350
  248 |         });
  249 |         // Dispatch touchmove (drag down by 150px)
  250 |         const move = new TouchEvent('touchmove', {
  251 |           bubbles: true,
  252 |           cancelable: true,
  253 |           touches: [moveTouchObj],
  254 |           targetTouches: [moveTouchObj],
  255 |           changedTouches: [moveTouchObj]
  256 |         });
  257 |         wrapper.dispatchEvent(move);
  258 |       });
  259 |     };
  260 | 
  261 |     // Swipe down to section 1
  262 |     console.log('[Mobile Touch] Swiping down');
  263 |     await swipeDown();
  264 |     await page.waitForTimeout(600);
  265 |     await expect(sections.nth(1)).toHaveClass(/active/);
  266 |     await page.screenshot({ path: path.join(SCREENSHOT_DIR, `mobile_swipe_down_1.png`) });
  267 | 
  268 |     // Swipe down to section 2
  269 |     console.log('[Mobile Touch] Swiping down again');
  270 |     await swipeDown();
  271 |     await page.waitForTimeout(600);
> 272 |     await expect(sections.nth(2)).toHaveClass(/active/);
      |                                   ^ Error: expect(locator).toHaveClass(expected) failed
  273 |     await page.screenshot({ path: path.join(SCREENSHOT_DIR, `mobile_swipe_down_2.png`) });
  274 | 
  275 |     // Swipe up to section 1
  276 |     console.log('[Mobile Touch] Swiping up');
  277 |     await swipeUp();
  278 |     await page.waitForTimeout(600);
  279 |     await expect(sections.nth(1)).toHaveClass(/active/);
  280 |     await page.screenshot({ path: path.join(SCREENSHOT_DIR, `mobile_swipe_up.png`) });
  281 |   });
  282 | 
  283 |   // Test 5: Check layout alignment, overlaps, layout shifts
  284 |   test('Layout and Alignment Verification', async ({ page }) => {
  285 |     await page.setViewportSize({ width: 1024, height: 768 }); // A different size
  286 |     const wrapper = page.locator('#scroll-wrapper');
  287 |     const sections = page.locator('#scroll-wrapper > .scroll-section');
  288 |     const count = await sections.count();
  289 | 
  290 |     for (let i = 0; i < count; i++) {
  291 |       // Let's scroll step-by-step
  292 |       if (i > 0) {
  293 |         await page.mouse.wheel(0, 300);
  294 |         await page.waitForTimeout(600);
  295 |       }
  296 | 
  297 |       // Check offset
  298 |       const transform = await wrapper.evaluate(el => el.style.transform);
  299 |       console.log(`[Layout] Section ${i} transform: ${transform}`);
  300 |       
  301 |       // Get bounding boxes to ensure no overlap and correct scroll snapping
  302 |       const currentSection = sections.nth(i);
  303 |       const sectionBox = await currentSection.boundingBox();
  304 |       
  305 |       // Expect section to be snapped perfectly to viewport top (Y coordinate relative to viewport)
  306 |       // Since it's viewport relative, the active section should be at Y = 0 (or close to it)
  307 |       expect(Math.abs(sectionBox.y)).toBeLessThanOrEqual(5);
  308 | 
  309 |       // Verify sizes are aligned
  310 |       expect(sectionBox.width).toBe(1024);
  311 |       expect(sectionBox.height).toBeGreaterThanOrEqual(768); // can be taller for sections with overflow
  312 | 
  313 |       await page.screenshot({ path: path.join(SCREENSHOT_DIR, `layout_alignment_section_${i}.png`) });
  314 |     }
  315 |   });
  316 | });
  317 | 
```