# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: testing/scroll.spec.js >> Custom Scroll Behavior Tests >> Rapid Repeated Scrolling and Direction Changes
- Location: testing/scroll.spec.js:134:3

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
  59  |       // Simulate mouse wheel down
  60  |       await page.mouse.wheel(0, 300);
  61  |       
  62  |       // Wait for throttle (400ms) + animation to settle
  63  |       await page.waitForTimeout(600);
  64  |       
  65  |       // Verify active state
  66  |       await expect(sections.nth(i)).toHaveClass(/active/);
  67  |       
  68  |       // Capture screenshot
  69  |       await page.screenshot({ path: path.join(SCREENSHOT_DIR, `desktop_wheel_down_section_${i}.png`) });
  70  |     }
  71  | 
  72  |     // 2. Mouse wheel scroll up step-by-step
  73  |     for (let i = count - 2; i >= 0; i--) {
  74  |       console.log(`[Mouse Wheel] Scrolling up to section ${i}`);
  75  |       await page.mouse.wheel(0, -300);
  76  |       await page.waitForTimeout(600);
  77  |       await expect(sections.nth(i)).toHaveClass(/active/);
  78  |       await page.screenshot({ path: path.join(SCREENSHOT_DIR, `desktop_wheel_up_section_${i}.png`) });
  79  |     }
  80  |   });
  81  | 
  82  |   // Test 2: Keyboard Scrolling (Arrow Up/Down, Page Up/Down, Home/End, Space)
  83  |   test('Keyboard Navigation', async ({ page }) => {
  84  |     await page.setViewportSize({ width: 1280, height: 800 });
  85  |     const sections = page.locator('#scroll-wrapper > .scroll-section');
  86  | 
  87  |     // Make sure we focus the page body or wrapper
  88  |     await page.focus('#scroll-wrapper');
  89  | 
  90  |     // ArrowDown
  91  |     console.log('[Keyboard] Pressing ArrowDown');
  92  |     await page.keyboard.press('ArrowDown');
  93  |     await page.waitForTimeout(600);
  94  |     await expect(sections.nth(1)).toHaveClass(/active/);
  95  |     await page.screenshot({ path: path.join(SCREENSHOT_DIR, `keyboard_arrow_down.png`) });
  96  | 
  97  |     // PageDown
  98  |     console.log('[Keyboard] Pressing PageDown');
  99  |     await page.keyboard.press('PageDown');
  100 |     await page.waitForTimeout(600);
  101 |     await expect(sections.nth(2)).toHaveClass(/active/);
  102 |     await page.screenshot({ path: path.join(SCREENSHOT_DIR, `keyboard_page_down.png`) });
  103 | 
  104 |     // End
  105 |     console.log('[Keyboard] Pressing End');
  106 |     await page.keyboard.press('End');
  107 |     await page.waitForTimeout(600);
  108 |     await expect(sections.nth(3)).toHaveClass(/active/);
  109 |     await page.screenshot({ path: path.join(SCREENSHOT_DIR, `keyboard_end.png`) });
  110 | 
  111 |     // ArrowUp
  112 |     console.log('[Keyboard] Pressing ArrowUp');
  113 |     await page.keyboard.press('ArrowUp');
  114 |     await page.waitForTimeout(600);
  115 |     await expect(sections.nth(2)).toHaveClass(/active/);
  116 |     await page.screenshot({ path: path.join(SCREENSHOT_DIR, `keyboard_arrow_up.png`) });
  117 | 
  118 |     // PageUp
  119 |     console.log('[Keyboard] Pressing PageUp');
  120 |     await page.keyboard.press('PageUp');
  121 |     await page.waitForTimeout(600);
  122 |     await expect(sections.nth(1)).toHaveClass(/active/);
  123 |     await page.screenshot({ path: path.join(SCREENSHOT_DIR, `keyboard_page_up.png`) });
  124 | 
  125 |     // Home
  126 |     console.log('[Keyboard] Pressing Home');
  127 |     await page.keyboard.press('Home');
  128 |     await page.waitForTimeout(600);
  129 |     await expect(sections.nth(0)).toHaveClass(/active/);
  130 |     await page.screenshot({ path: path.join(SCREENSHOT_DIR, `keyboard_home.png`) });
  131 |   });
  132 | 
  133 |   // Test 3: Rapid Scroll Inputs / Direction Changes
  134 |   test('Rapid Repeated Scrolling and Direction Changes', async ({ page }) => {
  135 |     await page.setViewportSize({ width: 1280, height: 800 });
  136 |     const sections = page.locator('#scroll-wrapper > .scroll-section');
  137 | 
  138 |     console.log('[Rapid] Sending multiple wheel events quickly');
  139 |     // Scroll down 3 times rapidly (throttle should ignore the 2nd and 3rd)
  140 |     await page.mouse.wheel(0, 300);
  141 |     await page.waitForTimeout(50);
  142 |     await page.mouse.wheel(0, 300);
  143 |     await page.waitForTimeout(50);
  144 |     await page.mouse.wheel(0, 300);
  145 | 
  146 |     // Wait and check if we are on section 1 (meaning the other events were successfully throttled)
  147 |     await page.waitForTimeout(800);
  148 |     await expect(sections.nth(1)).toHaveClass(/active/);
  149 |     await page.screenshot({ path: path.join(SCREENSHOT_DIR, `rapid_throttle_success.png`) });
  150 | 
  151 |     // Rapid direction change
  152 |     console.log('[Rapid] Direction change: scroll down then immediately up');
  153 |     await page.mouse.wheel(0, 300); // Trigger section 2
  154 |     await page.waitForTimeout(50);
  155 |     await page.mouse.wheel(0, -300); // Trigger scroll up immediately (should be ignored by throttle)
  156 |     
  157 |     await page.waitForTimeout(800);
  158 |     // Should be on section 2, not section 1
> 159 |     await expect(sections.nth(2)).toHaveClass(/active/);
      |                                   ^ Error: expect(locator).toHaveClass(expected) failed
  160 |     await page.screenshot({ path: path.join(SCREENSHOT_DIR, `rapid_direction_change.png`) });
  161 |   });
  162 | 
  163 |   // Test 4: Mobile Touch Swipe Gestures
  164 |   test('Mobile Viewport - Touch Swipe', async ({ page }) => {
  165 |     // Emulate a mobile device size
  166 |     await page.setViewportSize({ width: 390, height: 844 });
  167 |     const sections = page.locator('#scroll-wrapper > .scroll-section');
  168 | 
  169 |     // Function to perform swipe down (moves content up -> page moves down)
  170 |     const swipeDown = async () => {
  171 |       await page.evaluate(() => {
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
```