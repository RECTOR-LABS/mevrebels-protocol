# MEVrebels Dashboard - Manual Testing Guide

**Version:** 1.0
**Date:** October 31, 2025
**Status:** Ready for Manual Testing

---

## Quick Start

```bash
cd dashboard
npm run dev
```

Visit: **http://localhost:3000**

---

## Testing Checklist Overview

- [ ] Homepage (/) - Marketing Page
- [ ] Pitch Deck (/pitch-deck) - Investor Presentation
- [ ] API Documentation (/api-docs)
- [ ] Strategies (/strategies) - Marketplace
- [ ] Strategy Creation (/strategies/create)
- [ ] Governance (/governance) - DAO Voting
- [ ] Analytics (/analytics) - Protocol Metrics
- [ ] Responsive Design (All Pages)
- [ ] Cross-Browser Compatibility
- [ ] Performance Check

---

## 1. Homepage (/) - Marketing Page

### Actions to Perform

1. Load the page
2. Scroll slowly from top to bottom
3. Click "BROWSE STRATEGIES" button
4. Go back, click "VIEW PITCH DECK" button
5. Scroll down past 300px
6. Resize browser to mobile width (375px)

### Expected Results

✅ **Hero Section:**
- Title and subtitle animate in (fade + slide up)
- Gradient background renders correctly
- CTA buttons visible and styled

✅ **Problem Section:**
- 4 problem cards display:
  - "Centralized MEV Oligopoly"
  - "No Access for Regular Traders"
  - "Validator Required for MEV"
  - "Zero Strategy Transparency"
- Cards fade in when scrolled into view

✅ **Solution Section:**
- 6 feature cards with icons
- Hover effects work (subtle scale)

✅ **How It Works:**
- 4-step process displayed with numbered steps
- Step-by-step flow clear and readable

✅ **Comparison Table:**
- Table renders with 3 columns:
  - MEVrebels (green checkmarks ✓)
  - Centralized Bots (red X ✗)
  - Validators (red X ✗)
- Features compared: Capital Required, Access, Validator Needed, Strategy Transparency, etc.

✅ **Traction Section:**
- Metrics display:
  - "$2.8B MEV Market on Solana"
  - "83% Test Coverage"
  - "23-Day Development"
  - "15,000+ Lines of Code"

✅ **Navigation:**
- "BROWSE STRATEGIES" → redirects to `/strategies`
- "VIEW PITCH DECK" → redirects to `/pitch-deck`

✅ **Floating Action Button:**
- Appears in bottom-right after scrolling 300px
- Shows 📊 icon
- Hover effect: expands with text "VIEW PITCH DECK"
- Clicking → goes to `/pitch-deck`

✅ **Responsive (Mobile 375px):**
- All sections stack vertically
- Text remains readable (no overflow)
- Buttons full-width or centered
- Comparison table scrolls horizontally if needed

### ❌ FAIL If:
- Animations don't play
- Buttons don't navigate correctly
- Layout breaks on mobile
- Floating button doesn't appear after scroll

---

## 2. Pitch Deck (/pitch-deck) - Investor Presentation

### Actions to Perform

1. Load the page
2. Scroll through all 7 sections slowly
3. Hover over stat cards in "Traction" section
4. Check video section (should show placeholder)
5. Hover over technology highlight cards
6. Click "EXPLORE STRATEGIES" CTA button at bottom
7. Check if floating action button appears (should NOT appear)

### Expected Results

✅ **7 Sections Present:**

**1. Hero Section:**
- Title: "Reclaim MEV. Power to the People."
- Subtitle about democratizing MEV
- Animated entrance (fade in + scale)

**2. Problem Section:**
- 4 problem cards:
  - "$2.8B Annual MEV on Solana"
  - "Centralized Control"
  - "High Barriers to Entry"
  - "No Transparency"
- Cards animate on scroll

**3. Solution Section:**
- 6 feature cards:
  - "Decentralized Strategy Marketplace"
  - "Flash Loan Arbitrage"
  - "DAO Governance"
  - "Community-Created Strategies"
  - "Profit Sharing"
  - "No Validator Required"
- Icons and descriptions visible

**4. Traction Section:**
- Stat cards display:
  - "$2.8B Market Opportunity"
  - "45/54 Tests Passing (83%)"
  - "15,000+ Lines of Code"
  - "23-Day Development Sprint"
  - "4 Solana Programs Deployed"
  - "7 Dashboard Pages"
- Hover on stat cards → slight scale effect
- Achievement cards with animations

**5. Demo Video Section:**
- Title: "See MEVrebels in Action"
- Video player with 16:9 aspect ratio
- Shows placeholder message: "YouTube video will appear here"
- Border styling (rebellious red border)
- Links to YouTube and GitHub below video

**6. Technology Section:**
- Tech stack highlights:
  - "Solana Programs (Rust + Anchor)"
  - "Backend Services (Node.js, Python, Rust)"
  - "Next.js Dashboard"
  - "PostgreSQL + Redis"
  - "Docker + CI/CD"
- Each card has icon and description

**7. Vision & Roadmap Section:**
- Roadmap milestones (Q1-Q4)
- Final CTA: "EXPLORE STRATEGIES" button

✅ **Animations:**
- Smooth scroll animations throughout
- Parallax effects on backgrounds
- Cards animate into view (fade + slide)

✅ **Navigation:**
- "EXPLORE STRATEGIES" button → redirects to `/strategies`

✅ **Floating Action Button:**
- **DOES NOT appear** (hidden on pitch deck page)

### ❌ FAIL If:
- Less than 7 sections visible
- Video section missing
- Animations don't play smoothly
- Floating button appears (should be hidden)
- Hover effects on stat cards don't work

---

## 3. API Documentation (/api-docs)

### Actions to Perform

1. Load the page
2. Click each sidebar link:
   - Overview
   - Authentication
   - Strategies
   - Executions
   - Proposals
   - Analytics
3. Click "Copy" button on any code block
4. Switch tabs in code examples (cURL, JavaScript, Python)
5. Scroll down to see all endpoints

### Expected Results

✅ **Sidebar Navigation:**
- 6 sections listed in sidebar
- Clicking sidebar link → smooth scroll to that section
- Active section highlighted in sidebar

✅ **Code Blocks:**
- Syntax highlighting (colors for keywords, strings, functions, etc.)
- "Copy" button visible on every code block
- Clicking "Copy" → button text changes to "Copied!" for 2 seconds
- Code remains in code block (not broken layout)

✅ **Tab Switching:**
- Code examples have tabs: cURL, JavaScript, Python
- Clicking tab → switches code example
- Different code for each language
- Active tab highlighted

✅ **API Documentation Content:**
- Base URL displayed: `https://api.mevrebels.rectorspace.com`
- Endpoints documented:
  - GET `/strategies` - List all strategies
  - POST `/strategies` - Create strategy
  - GET `/executions` - List executions
  - GET `/proposals` - List DAO proposals
  - POST `/proposals/:id/vote` - Vote on proposal
  - GET `/analytics` - Get protocol analytics
- Request/response examples for each endpoint
- Authentication section explains API key usage

### ❌ FAIL If:
- Sidebar doesn't navigate
- Copy button doesn't work
- Tabs don't switch code examples
- Syntax highlighting missing
- Code blocks broken or overflow

---

## 4. Strategies (/strategies) - Marketplace

### Actions to Perform

1. Load the page (wait for loading spinner)
2. Check if strategies load from API
3. Use filter dropdown (select "Raydium")
4. Use sort dropdown (select "Highest APY")
5. Type in search box ("arb")
6. Click "CREATE STRATEGY" button
7. Open browser DevTools → Network tab, refresh page

### Expected Results

✅ **Loading State:**
- Shows loading spinner initially
- Text: "Loading strategies..." or similar

✅ **Data Loading:**
- Strategies load from: `https://api.mevrebels.rectorspace.com/strategies`
- Strategy cards display with:
  - Strategy name
  - Creator address (truncated)
  - DEX pairs (e.g., "Raydium → Orca")
  - APY percentage
  - Success rate percentage
  - Total profit in SOL

✅ **Filtering:**
- Filter dropdown has options: All, Raydium, Orca, Meteora
- Selecting "Raydium" → shows only strategies with Raydium DEX
- Filter updates card count

✅ **Sorting:**
- Sort dropdown options:
  - Highest APY
  - Highest Success Rate
  - Most Recent
  - Highest Profit
- Selecting "Highest APY" → reorders cards with highest APY at top

✅ **Search:**
- Typing "arb" in search box → filters strategies with "arb" in name/description
- Search is case-insensitive
- Updates results in real-time

✅ **Navigation:**
- "CREATE STRATEGY" button → redirects to `/strategies/create`

✅ **Network (DevTools):**
- API call to `/strategies` shows status 200 (success)
- Response contains array of strategy objects

✅ **Error Handling:**
- If API fails → shows error message
- Error message user-friendly (not raw error)

### ❌ FAIL If:
- Strategies don't load
- Loading state doesn't show
- Filters don't work
- Sort doesn't reorder
- Search doesn't filter
- No error handling for API failure
- "CREATE STRATEGY" button doesn't navigate

---

## 5. Strategy Creation (/strategies/create)

### Actions to Perform

1. Load the page
2. Try submitting empty form (click "Preview Strategy")
3. Fill out form:
   - **Name:** "Test Arbitrage Strategy"
   - **Description:** "This is a test strategy for arbitrage"
   - **DEX Pairs:** Check "Raydium/Orca"
   - **Min Profit:** 10
   - **Max Slippage:** 1
4. Click "Preview Strategy"
5. Click "Submit Strategy"

### Expected Results

✅ **Form Validation (Empty Form):**
- Clicking "Preview Strategy" with empty form → shows validation errors
- Error messages appear below fields in red text:
  - "Strategy name is required"
  - "Description is required"
  - "Select at least one DEX pair"
  - "Min profit must be greater than 0"
  - "Max slippage must be between 0 and 100"

✅ **Form Validation (Filled Form):**
- After filling all fields → validation errors disappear
- Form fields accept input correctly
- DEX pair checkboxes toggle on/off

✅ **Preview:**
- "Preview Strategy" button → displays preview card
- Preview shows:
  - Strategy name: "Test Arbitrage Strategy"
  - Description: "This is a test strategy for arbitrage"
  - DEX pairs: "Raydium/Orca"
  - Min profit: "10 SOL"
  - Max slippage: "1%"
- Preview styled like strategy card from marketplace

✅ **Submission:**
- "Submit Strategy" button → triggers submission
- Shows success toast notification
- Toast message: "Strategy submitted successfully!" or similar
- Toast auto-dismisses after 3 seconds

✅ **Form Reset (Optional):**
- After submission, form may reset or stay filled
- No console errors during submission

### ❌ FAIL If:
- Validation doesn't work
- Empty form submits
- Preview doesn't show
- Submission doesn't show toast
- Console errors during submission
- Form fields don't accept input

---

## 6. Governance (/governance) - DAO Voting

### Actions to Perform

1. Load the page (wait for loading)
2. Check "Active" tab
3. Click "Closed" tab
4. Click "Vote" button on any proposal (without wallet connected)
5. Check vote progress bars
6. Open DevTools → Network tab, refresh page

### Expected Results

✅ **Loading State:**
- Shows loading spinner initially
- Text: "Loading proposals..." or similar

✅ **Data Loading:**
- Proposals load from: `https://api.mevrebels.rectorspace.com/proposals`
- Proposal cards display with:
  - Title
  - Description
  - Proposer address (truncated)
  - Vote counts (YES, NO, ABSTAIN)
  - Quorum progress bar
  - Status (Active/Closed/Executed)

✅ **Tabs:**
- **Active Tab (Default):**
  - Shows proposals with status "active"
  - Vote buttons enabled
- **Closed Tab:**
  - Shows proposals with status "closed" or "executed"
  - Vote buttons disabled or hidden
  - Shows result: "PASSED" or "REJECTED"

✅ **Vote Progress Bars:**
- Three bars: YES (green), NO (red), ABSTAIN (gray)
- Bars show percentage distribution
- Percentages add up to ~100%
- Visual representation accurate (longer bar = more votes)

✅ **Quorum Bar:**
- Shows progress toward quorum threshold
- Text: "X% of quorum reached" or "Quorum: X/Y votes"
- Color: green if quorum met, amber if close, red if far

✅ **Voting (Without Wallet):**
- Clicking "Vote" button → shows toast notification
- Toast message: "Please connect wallet to vote" or similar
- No actual vote submitted

✅ **Network (DevTools):**
- API call to `/proposals` shows status 200
- Response contains array of proposal objects

### ❌ FAIL If:
- Proposals don't load
- Tabs don't switch
- Vote bars incorrect or broken
- Quorum bar doesn't display
- No wallet warning when voting
- Closed proposals show vote buttons
- Vote bars don't match vote counts

---

## 7. Analytics (/analytics) - Protocol Metrics

### Actions to Perform

1. Load the page (wait for loading)
2. Scroll through all sections
3. Check metrics cards (TVL, Strategies, Executions, Profit)
4. Check leaderboard table
5. Check charts (DEX distribution, user earnings)
6. Open DevTools → Network tab, check API calls

### Expected Results

✅ **Loading State:**
- Shows loading spinner initially
- Text: "Loading analytics..." or similar

✅ **Data Loading:**
- Data loads from: `https://api.mevrebels.rectorspace.com/analytics`

✅ **Metrics Cards:**
- 4 metric cards display:
  1. **Total Value Locked (TVL):** Shows SOL amount (e.g., "12,450 SOL")
  2. **Active Strategies:** Count (e.g., "47 strategies")
  3. **Total Executions:** Count (e.g., "1,234 executions")
  4. **Total Profit Distributed:** SOL amount (e.g., "567 SOL")
- Cards have icons and styled borders
- Numbers formatted correctly (commas for thousands)

✅ **Leaderboard:**
- Table shows top strategies
- Columns:
  - Rank (#1, #2, #3, etc.)
  - Strategy Name
  - Creator (address truncated)
  - APY (percentage)
  - Total Profit (SOL)
- Sorted by profit or APY (descending)
- At least 5-10 rows displayed

✅ **Charts:**
- **DEX Distribution Chart:**
  - Pie chart or bar chart
  - Shows distribution: Raydium, Orca, Meteora
  - Percentages or counts visible
  - Legend displayed
- **User Earnings:**
  - If wallet connected: shows user's specific earnings
  - If no wallet: shows aggregate data or placeholder

✅ **Network (DevTools):**
- API call to `/analytics` shows status 200
- Response contains metrics object with all data

✅ **Error Handling:**
- If API fails → shows error message
- Error message user-friendly

### ❌ FAIL If:
- Metrics don't load
- Cards show "0" or "NaN"
- Leaderboard empty
- Charts missing or broken
- No error handling for API failure
- Layout broken or overlapping

---

## 8. Responsive Design (All Pages)

### Actions to Perform

1. Open DevTools (F12 or Cmd+Opt+I)
2. Toggle device toolbar (Ctrl+Shift+M or Cmd+Shift+M)
3. Test these widths:
   - **375px** (iPhone SE - Mobile)
   - **768px** (iPad - Tablet)
   - **1024px** (Desktop)
   - **1920px** (Large Desktop)

### Expected Results

✅ **Mobile (375px):**
- Navigation collapses to hamburger menu (if applicable)
- All sections stack vertically
- Cards display one per row
- Buttons full-width or centered
- Text remains readable (no overflow)
- Tables scroll horizontally if needed
- Images resize proportionally
- No horizontal page scroll

✅ **Tablet (768px):**
- 2-column layouts for cards
- Sidebar visible (if applicable) or collapsible
- Comfortable spacing between elements
- Buttons appropriately sized
- Charts readable

✅ **Desktop (1024px+):**
- 3-4 column layouts for cards
- Full navigation visible
- Optimal use of space
- Comparison tables fully visible
- Charts full-width

✅ **Large Desktop (1920px):**
- Content centered or max-width applied
- No excessive white space
- Text not too wide (readability maintained)

### ❌ FAIL If:
- Layout breaks at any breakpoint
- Text overlaps or overflows
- Buttons inaccessible or cut off
- Horizontal scroll on full page
- Cards overlap or squished
- Navigation unusable

---

## 9. Cross-Browser Compatibility

### Browsers to Test

- **Chrome/Edge** (Chromium-based)
- **Firefox**
- **Safari** (if on Mac)

### Expected Results

✅ **All Browsers:**
- Pages load without errors
- Animations work smoothly
- All interactive elements functional
- API calls succeed
- Layout consistent across browsers
- Framer-motion animations render correctly
- No console errors

✅ **Safari-Specific:**
- Webkit-based animations work
- Flexbox/Grid layouts correct
- Font rendering acceptable

### ❌ FAIL If:
- Animations broken in specific browser
- Layout different between browsers
- API calls fail in one browser
- Console errors unique to one browser
- Performance significantly worse in one browser

---

## 10. Performance Check (Optional but Recommended)

### Actions to Perform

1. Open DevTools (F12)
2. Go to **Lighthouse** tab
3. Select:
   - ✅ Performance
   - ✅ SEO
   - ✅ Accessibility
   - ✅ Best Practices
4. Click "Generate report"
5. Review scores and recommendations

### Expected Results

✅ **Performance Score:** >80
- First Contentful Paint (FCP): <2s
- Largest Contentful Paint (LCP): <3s
- Time to Interactive (TTI): <4s

✅ **SEO Score:** >90
- Meta tags present
- Heading hierarchy correct
- Images have alt text
- Links descriptive

✅ **Accessibility Score:** >80
- Color contrast sufficient
- ARIA labels present
- Keyboard navigation works
- Screen reader compatible

✅ **Best Practices Score:** >80
- HTTPS used (in production)
- No console errors
- Images optimized
- JavaScript errors: 0

✅ **Console:**
- No critical errors
- Warnings acceptable (if minor)

### ❌ FAIL If:
- Performance score <60
- SEO score <80
- Multiple console errors
- Accessibility issues (contrast, ARIA)

---

## Common Issues & Troubleshooting

### Issue 1: API Calls Failing
**Symptoms:** Strategies/proposals/analytics don't load
**Check:**
1. Is backend API running? (`https://api.mevrebels.rectorspace.com/health`)
2. Check Network tab in DevTools for status codes
3. CORS errors in console?

**Fix:**
- If API down: Contact backend team
- If CORS error: Check API CORS configuration

---

### Issue 2: Animations Not Playing
**Symptoms:** Pages load but no fade-in/slide effects
**Check:**
1. Console for framer-motion errors
2. JavaScript enabled?
3. Browser supports CSS animations?

**Fix:**
- Hard refresh (Ctrl+Shift+R or Cmd+Shift+R)
- Check if JavaScript disabled
- Update browser to latest version

---

### Issue 3: Floating Button Doesn't Appear
**Symptoms:** No floating button after scrolling
**Check:**
1. Are you on pitch deck page? (it's hidden there)
2. Have you scrolled past 300px?
3. Console errors?

**Fix:**
- Scroll more (at least 400px down)
- Check if on `/pitch-deck` (should not appear)
- Check console for JavaScript errors

---

### Issue 4: Video Not Playing
**Symptoms:** Video section shows blank or placeholder
**Expected:** This is normal! Video placeholder is intentional.

**Action Required:**
- After recording demo video, update YouTube URL in:
  - File: `/dashboard/src/app/pitch-deck/page.tsx`
  - Line: ~508
  - Replace: `YOUR_VIDEO_ID` with actual YouTube video ID

---

### Issue 5: Wallet Connection Issues
**Symptoms:** Wallet doesn't connect
**Check:**
1. Is wallet extension installed?
2. Is wallet unlocked?
3. Network set to devnet?

**Fix:**
- Install Phantom/Solflare
- Unlock wallet
- Switch network to devnet in wallet settings

---

## Reporting Issues

### Issue Template

When reporting an issue, include:

1. **Page/URL:** Which page has the issue?
2. **Browser:** Chrome/Firefox/Safari?
3. **Device:** Desktop/Mobile/Tablet?
4. **Screen Size:** 375px, 768px, 1024px, etc.?
5. **Steps to Reproduce:**
   - Step 1: ...
   - Step 2: ...
   - Step 3: ...
6. **Expected Behavior:** What should happen?
7. **Actual Behavior:** What actually happened?
8. **Screenshot:** (if applicable)
9. **Console Errors:** (if any)

### Issue Priority

**Critical (Must Fix Before Submission):**
- ❌ Page crashes or won't load
- ❌ API calls completely fail
- ❌ Buttons don't work
- ❌ Forms don't validate or submit
- ❌ Layout completely broken on mobile

**High (Should Fix):**
- ⚠️ Animations don't play smoothly
- ⚠️ Some responsive breakpoints awkward
- ⚠️ Performance score <70
- ⚠️ Accessibility issues

**Medium (Nice to Fix):**
- ✓ Small alignment issues
- ✓ Hover effects could be smoother
- ✓ Minor visual inconsistencies

**Low (Optional):**
- ✓ Typos or minor copy changes
- ✓ Optimization opportunities
- ✓ Code refactoring (no visual impact)

---

## Testing Sign-off

### Tester Information
- **Tester Name:** ___________________
- **Date:** ___________________
- **Environment:** Development / Staging / Production
- **Browser:** ___________________
- **OS:** ___________________

### Overall Assessment

- [ ] All pages load successfully
- [ ] All interactive elements functional
- [ ] API integration working
- [ ] Responsive design acceptable
- [ ] Performance acceptable
- [ ] No critical bugs found

### Issues Found
| # | Page | Issue | Priority | Status |
|---|------|-------|----------|--------|
| 1 |      |       |          |        |
| 2 |      |       |          |        |
| 3 |      |       |          |        |

### Recommendation
- [ ] ✅ **APPROVED** - Ready for submission
- [ ] ⚠️ **APPROVED WITH MINOR ISSUES** - Submit with known issues
- [ ] ❌ **NOT APPROVED** - Critical issues must be fixed

**Comments:**
_____________________________________________
_____________________________________________
_____________________________________________

---

## Final Checklist Before Submission

- [ ] All 7 pages tested and functional
- [ ] API integration verified
- [ ] Responsive design checked (375px, 768px, 1024px)
- [ ] Cross-browser testing complete (Chrome, Firefox, Safari)
- [ ] Performance score >80 (Lighthouse)
- [ ] No console errors
- [ ] Demo video recorded and uploaded
- [ ] YouTube URL updated in pitch deck page
- [ ] Documentation updated (STATUS-UPDATE.md)
- [ ] All critical bugs fixed
- [ ] Testing sign-off completed

---

**Status:** Ready for manual testing by RECTOR
**Next Steps:** Record demo video, update YouTube URL, final submission

Alhamdulillah! May this testing go smoothly. 🚀
