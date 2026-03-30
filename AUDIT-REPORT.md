# 🔍 Codebase Audit Report — Shree Ganpati Agency Label Print System

**Audit Date:** 30 March 2026  
**Version Audited:** v3.0.0  
**Audited By:** Copilot AI (Full automated scan of all components, APIs, config)

---

## Table of Contents

- [Critical Bugs](#-critical-bugs)
- [High Severity Issues](#-high-severity-issues)
- [Medium Issues](#-medium-issues)
- [Mobile / Responsive Issues](#-mobile--responsive-issues)
- [Security Issues](#-security-issues)
- [Performance Issues](#-performance-issues)
- [Feature Suggestions](#-feature-suggestions--jo-hona-chahiye)
- [Priority Roadmap](#-priority-roadmap)

---

## 🔴 Critical Bugs

These bugs can cause crashes, data loss, or wrong behavior. **Fix immediately.**

### 1. Page Delete Race Condition
- **File:** `src/components/Dashboard.jsx` — Line ~400
- **Problem:** `removePage()` uses `pages.length` (old/stale state) instead of the updated state after `setPages()`. If user deletes pages rapidly, `currentPage` calculation goes wrong.
- **Impact:** User ends up editing the wrong page silently. Data gets overwritten.
- **Fix:** Move `currentPage` update inside `setPages()` callback so it uses `prev.length` (updated state):
  ```js
  setPages(prev => {
    const updated = prev.filter((_, i) => i !== idx);
    // Update currentPage based on NEW array length
    if (currentPage >= updated.length) setCurrentPage(Math.max(0, updated.length - 1));
    else if (currentPage > idx) setCurrentPage(currentPage - 1);
    return updated;
  });
  ```

### 2. setLabels Updates Wrong Page
- **File:** `src/components/Dashboard.jsx` — Line ~384
- **Problem:** `setLabels()` uses `Math.min(currentPage, prev.length - 1)` to pick the page index. After deleting the last page, `currentPage` might still be the old value, causing edits to silently go to a different page.
- **Impact:** User types in label editor but changes apply to wrong page.
- **Fix:** Add guard: `if (currentPage >= prev.length) return prev;` or ensure `currentPage` is always updated before `setLabels` runs.

### 3. activeIndex Out of Bounds
- **File:** `src/components/LabelEditor.jsx` — Line ~397
- **Problem:** `activeIndex` starts at 0 but is never clamped when a template with fewer labels loads, or when labels array changes externally.
- **Impact:** Accessing `labels[activeIndex]` returns `undefined` → crash or blank editor.
- **Fix:** Add a `useEffect` to clamp:
  ```js
  useEffect(() => {
    if (activeIndex >= labels.length) setActiveIndex(0);
  }, [labels.length]);
  ```

### 4. Empty Labels Crash PDF Generation
- **File:** `src/components/LabelPreview.jsx` — Line ~113
- **Problem:** `safeLabels` fallback is `{}` (empty object). Later code calls `.trim()` on fields like `logoUrl`, `product`, etc. which are `undefined` on empty objects.
- **Impact:** PDF generation throws runtime error for sheets with some empty labels.
- **Fix:** Use a proper default label object:
  ```js
  const safeLabels = Array.from({ length: 12 }, (_, i) => ({
    product: '', code: '', price: '', manufacturer: '',
    logoUrl: '', description: '', productUrl: '',
    ...(pageLabels[i] || {})
  }));
  ```

### 5. Product DB Cache Never Clears / No Error Recovery
- **File:** `src/components/LabelEditor.jsx` — Lines 15–31
- **Problem:** Module-level `_productDB` is cached forever. If the initial `fetch('/jaquar-products.json')` fails, `_productDB` is set to `[]` permanently — search never works again until full page refresh.
- **Impact:** One network hiccup = Jaquar search permanently broken for the session.
- **Fix:** On fetch error, set `_productDB = null` (not `[]`) so next call retries. Add a TTL (e.g., 24 hours) so updated product data is eventually loaded.
  ```js
  .catch(() => {
    _productDB = null;       // Allow retry
    _productDBPromise = null; // Clear promise so next call retries
    return [];
  });
  ```

### 6. CSV Export Field Mismatch
- **File:** `src/components/Dashboard.jsx` — Line ~514
- **Problem:** CSV header says `logo` but the actual label object field is `logoUrl`. Similarly, `productUrl` may not match import columns.
- **Impact:** Exported CSV has empty `logo` column. Re-importing this CSV loses logo URLs.
- **Fix:** Match header names to actual field names:
  ```js
  const header = 'manufacturer,logoUrl,code,product,description,price,productUrl';
  const rows = allLabels.map(l =>
    [l.manufacturer, l.logoUrl, l.code, l.product, l.description, l.price, l.productUrl]
  ```

### 7. Particle Canvas Memory Leak
- **File:** `src/components/Landing.jsx` — Lines ~140–180
- **Problem:** On window resize, canvas width/height are reset (clears canvas context). Particles array doesn't check new bounds. `requestAnimationFrame` runs continuously even when Landing page is off-screen.
- **Impact:** Gradual memory/CPU increase. Particle positions go out of bounds on resize.
- **Fix:** Add bounds check in draw loop. Consider using `IntersectionObserver` to pause animation when off-screen.

### 8. useEffect Dependency Issue — Keyboard Handler
- **File:** `src/components/Dashboard.jsx` — Line ~453
- **Problem:** Keyboard event handler (`Ctrl+P`, `Ctrl+S`) depends on `[pages, copies, currentTemplateName]`. Every time any of these change, the old listener is removed and a new one added — very frequent (every keystroke in editor).
- **Impact:** Performance degradation. Potential stale closure bugs.
- **Fix:** Use `useRef` pattern to avoid dependency churn:
  ```js
  const stateRef = useRef({ pages, copies, currentTemplateName });
  useEffect(() => { stateRef.current = { pages, copies, currentTemplateName }; });
  useEffect(() => {
    const handler = (e) => {
      const { pages, copies, currentTemplateName } = stateRef.current;
      // ... use fresh values
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []); // Empty deps — handler never recreated
  ```

---

## 🟠 High Severity Issues

These won't crash the app but cause incorrect behavior or security risks.

### 9. CORS Defaults to Wildcard `*`
- **File:** `api/jaquar-product.js` (Line ~10), `api/auth/login.js` (Line ~4), all API files
- **Problem:** `ALLOWED_ORIGIN = process.env.FRONTEND_URL || '*'` — if `FRONTEND_URL` env var is not set in Vercel, ANY website can call your auth APIs.
- **Impact:** Cross-origin attacks. Someone can build a fake site that calls your login API.
- **Fix:** Remove `'*'` fallback. Require explicit origin:
  ```js
  const ALLOWED_ORIGIN = process.env.FRONTEND_URL;
  if (!ALLOWED_ORIGIN) { res.status(500).json({ error: 'Server misconfigured' }); return; }
  ```

### 10. JWT Token Stored in localStorage
- **File:** `src/contexts/AuthContext.jsx` — Lines 8, 32, 39
- **Problem:** JWT stored in `localStorage` which is accessible to any JavaScript on the page. A single XSS vulnerability = full account takeover.
- **Impact:** If any third-party script or XSS exists, attacker can steal the token.
- **Fix (short-term):** Move to `sessionStorage` (clears on tab close). **(long-term):** Use httpOnly cookies (requires backend changes).

### 11. No Security Headers
- **File:** `vercel.json`
- **Problem:** Missing critical HTTP security headers that all modern web apps should have.
- **Impact:** Vulnerable to clickjacking, MIME sniffing, XSS.
- **Fix:** Add to `vercel.json`:
  ```json
  {
    "headers": [
      {
        "source": "/(.*)",
        "headers": [
          { "key": "X-Frame-Options", "value": "DENY" },
          { "key": "X-Content-Type-Options", "value": "nosniff" },
          { "key": "X-XSS-Protection", "value": "1; mode=block" },
          { "key": "Referrer-Policy", "value": "strict-origin-when-cross-origin" },
          { "key": "Permissions-Policy", "value": "camera=(), microphone=(), geolocation=()" }
        ]
      }
    ]
  }
  ```

### 12. React.memo Comparison Ineffective on LabelSheet
- **File:** `src/components/LabelSheet.jsx` — Line ~33
- **Problem:** `memo(LabelCell)` uses default shallow comparison. But `label` is an object — its reference changes every render even if content is the same. So memo never prevents re-renders.
- **Impact:** All 12 label cells re-render on every parent update (typing, search, etc.).
- **Fix:** Add custom comparator:
  ```js
  const LabelCell = memo(function LabelCell({ label, fontScale }) { ... },
    (prev, next) =>
      prev.label.code === next.label.code &&
      prev.label.product === next.label.product &&
      prev.label.description === next.label.description &&
      prev.label.price === next.label.price &&
      prev.label.logoUrl === next.label.logoUrl &&
      prev.label.manufacturer === next.label.manufacturer &&
      prev.fontScale === next.fontScale
  );
  ```

### 13. Debounce Race Condition in Jaquar Search
- **File:** `src/components/LabelEditor.jsx` — Lines ~174–187
- **Problem:** If `productDB` is null (first load), the effect calls `loadProductDB()` asynchronously. If the user keeps typing, multiple `loadProductDB()` promises can fire, and `setSearchResults` can be called with stale query results.
- **Impact:** Search results flash or show wrong results for a moment.
- **Fix:** Add a cleanup flag:
  ```js
  useEffect(() => {
    let cancelled = false;
    // ... async work ...
    loadProductDB().then(db => {
      if (cancelled) return;
      // ... set results
    });
    return () => { cancelled = true; };
  }, [debouncedQuery, productDB]);
  ```

---

## 🟡 Medium Issues

### 14. No Error Boundary
- **File:** `src/App.jsx`
- **Problem:** No React Error Boundary wrapping the app. Any unhandled error in any component = white screen with no recovery.
- **Fix:** Add `<ErrorBoundary>` wrapper with a friendly "Something went wrong" UI and a "Reload" button.

### 15. JWT Token Never Refreshed
- **File:** `src/contexts/AuthContext.jsx` — Line ~17
- **Problem:** Token has 7-day expiry but no refresh mechanism. User gets silently logged out after 7 days with no warning.
- **Fix:** Add token refresh logic — check expiry on API calls, redirect to login if expired, or implement refresh tokens.

### 16. SearchMockup Timer Leak
- **File:** `src/components/Landing.jsx` — SearchMockup component
- **Problem:** `setTimeout` and `setInterval` inside the animated search mockup may not be fully cleaned up if component unmounts mid-animation.
- **Fix:** Track all timer IDs and clear them in cleanup:
  ```js
  useEffect(() => {
    const timers = [];
    timers.push(setTimeout(...));
    return () => timers.forEach(clearTimeout);
  }, []);
  ```

### 17. PDF Generation Has No Timeout
- **File:** `src/components/LabelPreview.jsx` — Line ~74
- **Problem:** PDF generation with many pages + copies has no timeout or progress indication. For 10+ pages × 5 copies, it could take 30+ seconds with no feedback.
- **Fix:** Add a progress callback and/or AbortController with 60-second timeout.

### 18. No localStorage Quota Recovery
- **File:** `src/components/Dashboard.jsx` — Line ~427
- **Problem:** `localStorage.setItem()` can throw `QuotaExceededError` when storage is full. Current code doesn't catch this, causing silent failures.
- **Fix:** Wrap in try/catch with user notification:
  ```js
  try { localStorage.setItem(key, value); }
  catch (e) { toast.error('Storage full! Please clear old drafts.'); }
  ```

### 19. Old Template Format Migration Incomplete
- **File:** `src/components/Dashboard.jsx` — Line ~370
- **Problem:** Old flat-array templates are converted to `[array]` but no validation that inner items are valid label objects.
- **Fix:** Add schema validation on import.

### 20. JSON Import No Structure Validation
- **File:** `src/components/Dashboard.jsx` — Lines ~543–563
- **Problem:** Imported JSON is parsed but not validated. A malformed file could set garbage data as labels.
- **Fix:** Validate structure before applying:
  ```js
  const isValidPage = page => Array.isArray(page) && page.every(l => typeof l === 'object' && l !== null);
  ```

---

## 📱 Mobile / Responsive Issues

### 21. Dashboard Layout Breaks on Mobile 🔴
- **File:** `src/components/Dashboard.jsx` — Line ~738
- **Problem:** Hard-coded `width: '42%'` for editor and `flex: 1` for preview. On a 390px phone screen, editor gets 164px — completely unusable.
- **Fix:** Add media query or responsive check:
  ```css
  @media (max-width: 768px) {
    /* Stack vertically, show tabs to switch between editor and preview */
  }
  ```

### 22. Landing Page Has No Mobile Menu
- **File:** `src/components/Landing.jsx` — Nav section
- **Problem:** Navigation links are horizontal-only. No hamburger menu for mobile. Links overflow or get too cramped.
- **Fix:** Add a hamburger button that toggles a mobile nav drawer.

### 23. Touch Targets Too Small
- **File:** Multiple components
- **Problem:** Many buttons have `padding: '7px 10px'` resulting in ~24px tap targets. WCAG recommends minimum 44×44px for touch devices.
- **Files affected:**
  - LabelEditor.jsx — card buttons, dropdown items
  - Dashboard.jsx — toolbar buttons
  - LabelPreview.jsx — settings inputs
- **Fix:** Increase padding on mobile:
  ```css
  @media (max-width: 768px) {
    button, .clickable { min-height: 44px; min-width: 44px; }
  }
  ```

### 24. A4 Preview Not Responsive
- **File:** `src/components/LabelPreview.jsx` — Lines ~57–67
- **Problem:** A4 sheet (794×1123px) is scaled to fit container, but on mobile the container itself may be too narrow for the preview to be legible.
- **Fix:** On mobile, show a "tap to preview full-screen" modal instead of inline preview.

### 25. Modal Padding Too Large on Mobile
- **File:** `src/components/Dashboard.jsx` — Modals
- **Problem:** `padding: 28` is excessive on small screens, wastes screen space.
- **Fix:** Use `padding: window.innerWidth < 640 ? 16 : 28` or CSS media query.

---

## 🔐 Security Issues

### 26. CORS Wildcard Fallback
- **Severity:** 🔴 Critical
- **Files:** All files in `api/` directory
- **Details:** See issue #9 above.

### 27. JWT in localStorage
- **Severity:** 🔴 Critical
- **File:** `src/contexts/AuthContext.jsx`
- **Details:** See issue #10 above.

### 28. Missing Security Headers
- **Severity:** 🔴 Critical
- **File:** `vercel.json`
- **Details:** See issue #11 above. No protection against clickjacking, MIME sniffing, etc.

### 29. No CSRF Token Validation
- **Severity:** 🟠 High
- **Files:** `api/templates/index.js`, `api/auth/login.js`
- **Problem:** POST/PUT/DELETE endpoints don't validate CSRF tokens. Any website can submit forms to your API.
- **Fix:** Implement CSRF tokens or use `SameSite=Strict` cookies for auth.

### 30. Product URL Not Sanitized in PDF
- **Severity:** 🟡 Medium
- **File:** `src/components/LabelPreview.jsx` — Line ~220
- **Problem:** `product.url` is concatenated directly into URL string for PDF QR code. Special characters could break the URL.
- **Fix:**
  ```js
  let jaquarUrl = '';
  if (product.url) {
    try { jaquarUrl = new URL(product.url, 'https://www.jaquar.com').toString(); }
    catch { jaquarUrl = ''; }
  }
  ```

---

## ⚡ Performance Issues

### 31. No useCallback/useMemo in Dashboard
- **Severity:** 🟠 High
- **File:** `src/components/Dashboard.jsx`
- **Problem:** Functions like `addLabel`, `removeLabel`, `duplicatePage`, `setLabels` are recreated every render. Since they're passed to child components (LabelEditor, LabelPreview), those children re-render unnecessarily.
- **Impact:** Typing in any input field causes full re-render of preview + all 12 label cards.
- **Fix:** Wrap handler functions in `useCallback`:
  ```js
  const setLabels = useCallback((newLabelsOrFn) => { ... }, [currentPage]);
  ```

### 32. jaquar-products.json Loaded at Module Level
- **Severity:** 🟠 High
- **File:** `src/components/LabelEditor.jsx` — Lines 20–31
- **Problem:** 1.2 MB JSON file is fetched at module initialization — before the user even navigates to the editor. This blocks/delays initial page load.
- **Fix:** Lazy-load only when LabelEditor mounts or when first search is triggered.

### 33. O(n²) Particle Calculations Every Frame
- **Severity:** 🟡 Medium
- **File:** `src/components/Landing.jsx` — Lines ~166
- **Problem:** `pts.forEach((a, i) => pts.slice(i + 1).forEach(b => { ... }))` — with 70 particles, that's ~2,415 distance calculations × 60fps = 144,900 calculations/second.
- **Fix:** Reduce particle count to 40, or use spatial hashing, or only check nearby particles.

### 34. No Route-Based Code Splitting
- **Severity:** 🟡 Medium
- **File:** `src/App.jsx`
- **Problem:** If not using `React.lazy()` for route components, all pages load upfront even if user only visits the landing page.
- **Fix:**
  ```js
  const Landing = React.lazy(() => import('./components/Landing'));
  const Dashboard = React.lazy(() => import('./components/Dashboard'));
  ```

### 35. Unused Dependencies in package.json
- **Severity:** 🟢 Low
- **File:** `package.json`
- **Problem:** `bcryptjs`, `jsonwebtoken`, `dotenv` are server-side only packages but listed in `dependencies`. They get included in bundle analysis (though tree-shaking should remove them).
- **Fix:** Move to `devDependencies` or keep only in API context.

---

## 🎯 Feature Suggestions — Jo Hona Chahiye

| # | Feature | Description | Priority |
|---|---------|-------------|----------|
| 1 | **Error Boundary** | Wrap app in React Error Boundary — show friendly error page instead of white screen on crash | 🔴 High |
| 2 | **Mobile Responsive Layout** | Dashboard should use tabs (Editor / Preview) on mobile instead of side-by-side split | 🔴 High |
| 3 | **Dark / Light Theme Toggle** | Add theme switcher — store preference in localStorage | 🟡 Medium |
| 4 | **Undo / Redo (Ctrl+Z/Y)** | Track label edit history, allow undoing mistakes | 🟡 Medium |
| 5 | **Keyboard Shortcuts Guide** | A `?` hotkey that opens a modal showing all available keyboard shortcuts | 🟡 Medium |
| 6 | **Batch Label Fill** | "Apply to All" button — fill all 12 labels with same data in one click | 🟡 Medium |
| 7 | **Label Templates Gallery** | Pre-made label designs/layouts that users can pick from | 🟡 Medium |
| 8 | **Export to PNG / SVG** | Currently only PDF export. Add PNG and SVG options for different use cases | 🟢 Low |
| 9 | **Auto-Save Every 30s** | Automatically save draft to localStorage every 30 seconds to prevent data loss | 🟠 High |
| 10 | **Drag & Drop Labels** | Allow reordering labels by dragging them to different positions on the sheet | 🟢 Low |
| 11 | **PWA Support (Offline Mode)** | Add service worker + manifest — app installs as native app, works offline | 🟡 Medium |
| 12 | **Web Vitals Monitoring** | Track Core Web Vitals (LCP, FID, CLS) in production for performance insights | 🟢 Low |
| 13 | **Sentry Error Tracking** | Catch and report production errors automatically with stack traces | 🟡 Medium |
| 14 | **SEO Structured Data** | Add JSON-LD schema markup to landing page for better Google indexing | 🟢 Low |
| 15 | **.env.example File** | Document all required environment variables (Supabase URL, keys, frontend URL) | 🟠 High |

---

## 📊 Priority Roadmap

### Phase 1 — Critical Fixes (Do First)
1. Fix page delete race condition (#1)
2. Fix setLabels wrong page update (#2)
3. Fix empty labels crash PDF (#4)
4. Fix CSV export field mismatch (#6)
5. Fix activeIndex bounds (#3)
6. Fix product DB cache error recovery (#5)
7. Add security headers to vercel.json (#11)
8. Fix CORS wildcard fallback (#9)

### Phase 2 — Stability & Security
9. Add Error Boundary (#14)
10. Fix useEffect keyboard handler (#8)
11. Fix React.memo comparison (#12)
12. Add localStorage quota handling (#18)
13. Fix debounce race condition (#13)
14. Move JWT to sessionStorage (#10)
15. Add JSON import validation (#20)

### Phase 3 — Mobile & UX
16. Mobile responsive dashboard (#21)
17. Landing page hamburger menu (#22)
18. Increase touch targets (#23)
19. Auto-save feature (#suggestion 9)
20. .env.example file (#suggestion 15)

### Phase 4 — Performance
21. Add useCallback/useMemo to Dashboard (#31)
22. Lazy-load jaquar-products.json (#32)
23. Optimize particle canvas (#33)
24. Route-based code splitting (#34)
25. Fix particle canvas memory leak (#7)

### Phase 5 — Nice-to-Have Features
26. Dark/Light theme toggle
27. Undo/Redo support
28. Keyboard shortcuts guide
29. Batch label fill
30. PWA support

---

## 📈 Stats

| Category | Count |
|----------|-------|
| 🔴 Critical Bugs | 8 |
| 🟠 High Severity | 5 |
| 🟡 Medium Issues | 7 |
| 📱 Mobile Issues | 5 |
| 🔐 Security Issues | 5 |
| ⚡ Performance Issues | 5 |
| 🎯 Feature Suggestions | 15 |
| **Total** | **50 items** |

---

*This report was generated by automated code analysis. Manual testing may reveal additional issues.*
