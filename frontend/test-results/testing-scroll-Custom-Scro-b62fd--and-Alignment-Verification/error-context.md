# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: testing/scroll.spec.js >> Custom Scroll Behavior Tests >> Layout and Alignment Verification
- Location: testing/scroll.spec.js:284:3

# Error details

```
Error: expect(received).toBeLessThanOrEqual(expected)

Expected: <= 5
Received:    768
```

# Page snapshot

```yaml
- generic [active] [ref=e1]:
  - generic [ref=e2]:
    - banner:     
    - main [ref=e3]:
      - generic [ref=e5]:
        - generic [ref=e8]:
          - generic [ref=e9]:
            - navigation [ref=e11]:
              - generic [ref=e12]:
                - generic:
                  - img "spacefurnio logo"
                - list [ref=e13]:
                  - listitem [ref=e14]:
                    - link "Home" [ref=e15] [cursor=pointer]:
                      - /url: /
                  - listitem [ref=e16]:
                    - link "About Us" [ref=e17] [cursor=pointer]:
                      - /url: /about
                  - listitem [ref=e18]:
                    - link "SF x Collabs" [ref=e19] [cursor=pointer]:
                      - /url: /collabs
                  - listitem [ref=e20]:
                    - link "Shop" [ref=e21] [cursor=pointer]:
                      - /url: /shop
                  - listitem [ref=e22]:
                    - link "Portfolio" [ref=e23] [cursor=pointer]:
                      - /url: /portfolio
                  - listitem [ref=e24]:
                    - link "Contact Us" [ref=e25] [cursor=pointer]:
                      - /url: /contact
                - generic [ref=e26]:
                  - generic [ref=e27]:
                    - button "Search" [ref=e28]:
                      - generic [ref=e29]: 
                    - button "User Account" [ref=e30]:
                      - generic [ref=e31]: 
                    - button "Wishlist" [ref=e32]:
                      - generic [ref=e33]: 
                    - button "Cart" [ref=e34]:
                      - generic [ref=e35]: 
                  - text: 
            - generic [ref=e37]:
              - heading "Spacefurnio" [level=1] [ref=e38]
              - paragraph [ref=e39]: "\"Creative Meets Living\""
          - generic [ref=e41]:
            - heading "New Arrivals" [level=2] [ref=e43]
            - generic [ref=e44]:
              - generic [ref=e46]:
                - img "Modern Chair Collection" [ref=e47]
                - generic [ref=e52]:
                  - generic [ref=e53]: 
                  - generic [ref=e54]: Coming Soon
                - generic [ref=e57]: 
              - generic [ref=e59]:
                - img "Elegant Sofa Design" [ref=e60]
                - generic [ref=e65]:
                  - generic [ref=e66]: 
                  - generic [ref=e67]: Coming Soon
                - generic [ref=e70]: 
              - generic [ref=e72]:
                - img "Contemporary Table" [ref=e73]
                - generic [ref=e78]:
                  - generic [ref=e79]: 
                  - generic [ref=e80]: Coming Soon
                - generic [ref=e83]: 
              - generic [ref=e85]:
                - img "Minimalist Furniture" [ref=e86]
                - generic [ref=e91]:
                  - generic [ref=e92]: 
                  - generic [ref=e93]: Coming Soon
                - generic [ref=e96]: 
            - generic [ref=e97]:
              - paragraph [ref=e98]:
                - text: Design this good
                - text: doesn't wait
              - link " Grab it now! " [ref=e100] [cursor=pointer]:
                - /url: /shopping
                - button " Grab it now! " [ref=e101]:
                  - generic [ref=e102]:
                    - generic [ref=e103]: 
                    - generic [ref=e104]: Grab it now!
                    - generic [ref=e105]: 
        - generic [ref=e107]:
          - generic [ref=e110]: Where lines meet light
          - generic [ref=e113]: And functions meet soul
        - generic [ref=e115]:
          - heading "You'll find us" [level=2] [ref=e118]
          - generic [ref=e120]:
            - generic:
              - button "" [disabled] [ref=e121]:
                - generic [ref=e122]: 
              - button "" [ref=e123] [cursor=pointer]:
                - generic [ref=e124]: 
            - generic [ref=e126]:
              - generic [ref=e127]:
                - generic [ref=e128]:
                  - generic:
                    - generic:
                      - generic:
                        - generic:
                          - img "Luxurious Modern Sofa"
                      - generic:
                        - button "Add to Wishlist":
                          - img
                        - button "Quick Add":
                          - img
                    - generic:
                      - generic:
                        - paragraph: Spacefurnio
                        - generic:
                          - img
                          - generic: "5"
                      - heading "Luxurious Modern Sofa" [level=3]:
                        - link "Luxurious Modern Sofa":
                          - /url: .//1
                          - text: Luxurious Modern Sofa
                      - generic:
                        - generic:
                          - paragraph: $899
                - generic:
                  - generic:
                    - generic:
                      - generic: 
                      - generic: Coming Soon
                - generic [ref=e130]: 
              - generic [ref=e131]:
                - generic [ref=e132]:
                  - generic:
                    - generic:
                      - generic:
                        - generic:
                          - img "Minimalist Dining Chair"
                      - generic:
                        - button "Add to Wishlist":
                          - img
                        - button "Quick Add":
                          - img
                    - generic:
                      - generic:
                        - paragraph: Spacefurnio
                        - generic:
                          - img
                          - generic: "5"
                      - heading "Minimalist Dining Chair" [level=3]:
                        - link "Minimalist Dining Chair":
                          - /url: .//2
                          - text: Minimalist Dining Chair
                      - generic:
                        - generic:
                          - paragraph: $249
                - generic:
                  - generic:
                    - generic:
                      - generic: 
                      - generic: Coming Soon
                - generic [ref=e134]: 
              - generic [ref=e135]:
                - generic [ref=e136]:
                  - generic:
                    - generic:
                      - generic:
                        - generic:
                          - img "Scandinavian Coffee Table"
                      - generic:
                        - button "Add to Wishlist":
                          - img
                        - button "Quick Add":
                          - img
                    - generic:
                      - generic:
                        - paragraph: Spacefurnio
                        - generic:
                          - img
                          - generic: "5"
                      - heading "Scandinavian Coffee Table" [level=3]:
                        - link "Scandinavian Coffee Table":
                          - /url: .//3
                          - text: Scandinavian Coffee Table
                      - generic:
                        - generic:
                          - paragraph: $449
                - generic:
                  - generic:
                    - generic:
                      - generic: 
                      - generic: Coming Soon
                - generic [ref=e138]: 
              - generic [ref=e139]:
                - generic [ref=e140]:
                  - generic:
                    - generic:
                      - generic:
                        - generic:
                          - img "Designer Floor Lamp"
                      - generic:
                        - button "Add to Wishlist":
                          - img
                        - button "Quick Add":
                          - img
                    - generic:
                      - generic:
                        - paragraph: Spacefurnio
                        - generic:
                          - img
                          - generic: "5"
                      - heading "Designer Floor Lamp" [level=3]:
                        - link "Designer Floor Lamp":
                          - /url: .//4
                          - text: Designer Floor Lamp
                      - generic:
                        - generic:
                          - paragraph: $199
                - generic:
                  - generic:
                    - generic:
                      - generic: 
                      - generic: Coming Soon
                - generic [ref=e142]: 
        - generic [ref=e150]:
          - navigation "Footer Navigation" [ref=e152]:
            - heading "Navigation" [level=3] [ref=e153]
            - list [ref=e154]:
              - listitem [ref=e155]:
                - link "Home" [ref=e156] [cursor=pointer]:
                  - /url: /
              - listitem [ref=e157]:
                - link "About Us" [ref=e158] [cursor=pointer]:
                  - /url: /about
              - listitem [ref=e159]:
                - link "SF x Collabs" [ref=e160] [cursor=pointer]:
                  - /url: /collabs
              - listitem [ref=e161]:
                - link "Shopping" [ref=e162] [cursor=pointer]:
                  - /url: /shopping
              - listitem [ref=e163]:
                - link "Portfolio" [ref=e164] [cursor=pointer]:
                  - /url: /portfolio
              - listitem [ref=e165]:
                - link "Ongoing Projects" [ref=e166] [cursor=pointer]:
                  - /url: /projects
          - generic [ref=e167]:
            - heading "Contact" [level=3] [ref=e168]
            - generic [ref=e169]:
              - generic [ref=e171]:
                - text: 90/1, North Beach Road Tuticorin,
                - text: Chennai – 628001.
              - link "+91 9751112025" [ref=e173] [cursor=pointer]:
                - /url: tel:+919751112025
              - link "info.spacefurnio@gmail.com" [ref=e175] [cursor=pointer]:
                - /url: mailto:info.spacefurnio@gmail.com
          - generic [ref=e176]:
            - heading "Follow Us" [level=3] [ref=e177]
            - generic [ref=e178]:
              - button "Follow us on Facebook" [ref=e179] [cursor=pointer]:
                - generic [ref=e180]: 
              - button "Follow us on Twitter" [ref=e181] [cursor=pointer]:
                - generic [ref=e182]: 
              - button "Follow us on Instagram" [ref=e183] [cursor=pointer]:
                - generic [ref=e184]: 
              - button "Follow us on LinkedIn" [ref=e185] [cursor=pointer]:
                - generic [ref=e186]: 
          - generic [ref=e187]:
            - heading "Legal" [level=3] [ref=e188]
            - paragraph [ref=e190]: © 2026 spacefurnio – All rights reserved.
    - contentinfo:    
  - generic [ref=e191]:
    - generic "Toggle devtools panel" [ref=e192] [cursor=pointer]:
      - img [ref=e193]
    - generic "Toggle Component Inspector" [ref=e198] [cursor=pointer]:
      - img [ref=e199]
```

# Test source

```ts
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
  272 |     await expect(sections.nth(2)).toHaveClass(/active/);
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
> 307 |       expect(Math.abs(sectionBox.y)).toBeLessThanOrEqual(5);
      |                                      ^ Error: expect(received).toBeLessThanOrEqual(expected)
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