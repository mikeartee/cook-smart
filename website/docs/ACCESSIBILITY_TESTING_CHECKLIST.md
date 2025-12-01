# Accessibility Testing Checklist

**Last Updated:** November 30, 2025  
**Standard:** WCAG 2.1 Level AA

---

## Automated Testing Tools

### Required Tools

1. **axe DevTools** (Browser Extension)
   - Install: Chrome/Firefox/Edge extension
   - Run on every page
   - Fix all violations before deployment

2. **WAVE** (Web Accessibility Evaluation Tool)
   - URL: https://wave.webaim.org/
   - Test all public pages
   - Document findings

3. **Lighthouse** (Chrome DevTools)
   - Run accessibility audit
   - Target score: 95+
   - Fix all issues

### Testing Commands

```bash
# Install accessibility testing tools
npm install --save-dev @axe-core/cli pa11y

# Run axe tests
npx axe https://cooksmartapp.com

# Run pa11y tests
npx pa11y https://cooksmartapp.com
```

---

## Manual Testing Checklist

### Keyboard Navigation ✅

- [ ] Tab through entire page
- [ ] All interactive elements reachable
- [ ] Focus indicators visible
- [ ] No keyboard traps
- [ ] Skip to content link works
- [ ] Logical tab order
- [ ] Enter/Space activate buttons
- [ ] Escape closes modals

**Test:** Unplug mouse and navigate entire site

### Screen Reader Testing ⚠️

**JAWS (Windows)**
- [ ] Install JAWS
- [ ] Test all pages
- [ ] Verify headings structure
- [ ] Check form labels
- [ ] Test image alt text
- [ ] Verify ARIA labels

**NVDA (Windows - Free)**
- [ ] Install NVDA
- [ ] Test navigation
- [ ] Verify announcements
- [ ] Check landmarks
- [ ] Test forms

**VoiceOver (Mac/iOS)**
- [ ] Enable VoiceOver (Cmd+F5)
- [ ] Test all pages
- [ ] Verify rotor navigation
- [ ] Check gestures (iOS)

**Test Pages:**
1. Homepage
2. Recipe listing
3. Recipe detail
4. Blog posts
5. Contact form
6. Legal pages
7. Admin dashboard

### Color Contrast ✅

- [ ] Text contrast ratio 4.5:1 minimum
- [ ] Large text 3:1 minimum
- [ ] UI components 3:1 minimum
- [ ] Test with color blindness simulator

**Tools:**
- Chrome DevTools (Inspect > Accessibility)
- Contrast Checker: https://webaim.org/resources/contrastchecker/

### Forms ✅

- [ ] All inputs have labels
- [ ] Error messages clear
- [ ] Required fields marked
- [ ] Validation messages accessible
- [ ] Autocomplete attributes
- [ ] Fieldset/legend for groups

### Images ✅

- [ ] All images have alt text
- [ ] Decorative images alt=""
- [ ] Complex images have descriptions
- [ ] Icons have aria-labels

### Headings ✅

- [ ] One H1 per page
- [ ] Logical heading hierarchy
- [ ] No skipped levels
- [ ] Descriptive heading text

### Links ✅

- [ ] Descriptive link text
- [ ] No "click here" links
- [ ] External links indicated
- [ ] Focus visible on links

### Tables

- [ ] Table headers defined
- [ ] Caption or summary
- [ ] Scope attributes
- [ ] No layout tables

### Media

- [ ] Videos have captions
- [ ] Audio has transcripts
- [ ] No autoplay
- [ ] Media controls accessible

---

## Page-by-Page Testing

### Homepage (/)

**Automated:**
- [ ] axe scan: 0 violations
- [ ] WAVE scan: 0 errors
- [ ] Lighthouse: 95+ score

**Manual:**
- [ ] Keyboard navigation
- [ ] Screen reader test
- [ ] Color contrast
- [ ] Focus indicators

### Recipe Pages (/recipes/*)

**Automated:**
- [ ] axe scan: 0 violations
- [ ] WAVE scan: 0 errors
- [ ] Lighthouse: 95+ score

**Manual:**
- [ ] Recipe disclaimer readable
- [ ] Ingredient checkboxes accessible
- [ ] Instructions navigable
- [ ] Images have alt text

### Legal Pages (/legal/*)

**Automated:**
- [ ] axe scan: 0 violations
- [ ] WAVE scan: 0 errors
- [ ] Lighthouse: 95+ score

**Manual:**
- [ ] Long content navigable
- [ ] Headings structure clear
- [ ] Links descriptive
- [ ] Tables accessible

### Forms (Contact, Newsletter, Data Request)

**Automated:**
- [ ] axe scan: 0 violations
- [ ] WAVE scan: 0 errors

**Manual:**
- [ ] All labels present
- [ ] Error handling accessible
- [ ] Required fields clear
- [ ] Submit button accessible

---

## Browser Testing

### Desktop Browsers

- [ ] Chrome (latest)
- [ ] Firefox (latest)
- [ ] Safari (latest)
- [ ] Edge (latest)

### Mobile Browsers

- [ ] Safari iOS
- [ ] Chrome Android
- [ ] Samsung Internet

### Screen Readers

- [ ] JAWS + Chrome (Windows)
- [ ] NVDA + Firefox (Windows)
- [ ] VoiceOver + Safari (Mac)
- [ ] VoiceOver + Safari (iOS)
- [ ] TalkBack + Chrome (Android)

---

## Assistive Technology Testing

### Magnification

- [ ] Test at 200% zoom
- [ ] Test at 400% zoom
- [ ] No horizontal scrolling
- [ ] Content reflows properly

### High Contrast Mode

- [ ] Windows High Contrast
- [ ] macOS Increase Contrast
- [ ] All content visible
- [ ] Focus indicators visible

### Voice Control

- [ ] Dragon NaturallySpeaking
- [ ] Voice Control (Mac/iOS)
- [ ] All commands work
- [ ] Labels match visual text

---

## WCAG 2.1 AA Compliance

### Perceivable

**1.1 Text Alternatives**
- [ ] 1.1.1 Non-text Content (A)

**1.2 Time-based Media**
- [ ] 1.2.1 Audio-only and Video-only (A)
- [ ] 1.2.2 Captions (A)
- [ ] 1.2.3 Audio Description (A)
- [ ] 1.2.4 Captions (Live) (AA)
- [ ] 1.2.5 Audio Description (AA)

**1.3 Adaptable**
- [ ] 1.3.1 Info and Relationships (A)
- [ ] 1.3.2 Meaningful Sequence (A)
- [ ] 1.3.3 Sensory Characteristics (A)
- [ ] 1.3.4 Orientation (AA)
- [ ] 1.3.5 Identify Input Purpose (AA)

**1.4 Distinguishable**
- [ ] 1.4.1 Use of Color (A)
- [ ] 1.4.2 Audio Control (A)
- [ ] 1.4.3 Contrast (Minimum) (AA)
- [ ] 1.4.4 Resize Text (AA)
- [ ] 1.4.5 Images of Text (AA)
- [ ] 1.4.10 Reflow (AA)
- [ ] 1.4.11 Non-text Contrast (AA)
- [ ] 1.4.12 Text Spacing (AA)
- [ ] 1.4.13 Content on Hover (AA)

### Operable

**2.1 Keyboard Accessible**
- [ ] 2.1.1 Keyboard (A)
- [ ] 2.1.2 No Keyboard Trap (A)
- [ ] 2.1.4 Character Key Shortcuts (A)

**2.2 Enough Time**
- [ ] 2.2.1 Timing Adjustable (A)
- [ ] 2.2.2 Pause, Stop, Hide (A)

**2.3 Seizures**
- [ ] 2.3.1 Three Flashes (A)

**2.4 Navigable**
- [ ] 2.4.1 Bypass Blocks (A)
- [ ] 2.4.2 Page Titled (A)
- [ ] 2.4.3 Focus Order (A)
- [ ] 2.4.4 Link Purpose (A)
- [ ] 2.4.5 Multiple Ways (AA)
- [ ] 2.4.6 Headings and Labels (AA)
- [ ] 2.4.7 Focus Visible (AA)

**2.5 Input Modalities**
- [ ] 2.5.1 Pointer Gestures (A)
- [ ] 2.5.2 Pointer Cancellation (A)
- [ ] 2.5.3 Label in Name (A)
- [ ] 2.5.4 Motion Actuation (A)

### Understandable

**3.1 Readable**
- [ ] 3.1.1 Language of Page (A)
- [ ] 3.1.2 Language of Parts (AA)

**3.2 Predictable**
- [ ] 3.2.1 On Focus (A)
- [ ] 3.2.2 On Input (A)
- [ ] 3.2.3 Consistent Navigation (AA)
- [ ] 3.2.4 Consistent Identification (AA)

**3.3 Input Assistance**
- [ ] 3.3.1 Error Identification (A)
- [ ] 3.3.2 Labels or Instructions (A)
- [ ] 3.3.3 Error Suggestion (AA)
- [ ] 3.3.4 Error Prevention (AA)

### Robust

**4.1 Compatible**
- [ ] 4.1.1 Parsing (A)
- [ ] 4.1.2 Name, Role, Value (A)
- [ ] 4.1.3 Status Messages (AA)

---

## Common Issues to Check

### Critical Issues

- [ ] Missing alt text on images
- [ ] Form inputs without labels
- [ ] Insufficient color contrast
- [ ] Keyboard traps
- [ ] Missing page titles
- [ ] Broken ARIA implementation

### High Priority

- [ ] Skipped heading levels
- [ ] Non-descriptive link text
- [ ] Missing focus indicators
- [ ] Unlabeled buttons
- [ ] Missing landmarks
- [ ] Inaccessible modals

### Medium Priority

- [ ] Missing skip links
- [ ] Redundant alt text
- [ ] Empty headings
- [ ] Duplicate IDs
- [ ] Missing language attribute
- [ ] Inconsistent navigation

---

## Testing Schedule

### Before Launch

- [ ] Run all automated tests
- [ ] Complete manual keyboard testing
- [ ] Test with one screen reader
- [ ] Fix all critical issues

### Within 30 Days

- [ ] Complete screen reader testing (all 3)
- [ ] User testing with disabilities
- [ ] Third-party audit
- [ ] Fix all high priority issues

### Quarterly

- [ ] Re-run automated tests
- [ ] Spot check manual tests
- [ ] Test new features
- [ ] Update documentation

### Annually

- [ ] Full accessibility audit
- [ ] Update to latest WCAG
- [ ] User testing
- [ ] Staff training

---

## Documentation

### Test Results

Document all findings in:
```
/docs/accessibility-test-results-YYYY-MM-DD.md
```

Include:
- Date of testing
- Tools used
- Pages tested
- Issues found
- Severity ratings
- Remediation plan
- Retest results

### Issue Tracking

Use this format:
```markdown
## Issue: [Description]
- **Severity:** Critical/High/Medium/Low
- **WCAG:** [Criterion number]
- **Page:** [URL]
- **Tool:** [How discovered]
- **Impact:** [User impact]
- **Fix:** [Remediation steps]
- **Status:** Open/In Progress/Fixed/Verified
```

---

## Resources

### Testing Tools

- axe DevTools: https://www.deque.com/axe/devtools/
- WAVE: https://wave.webaim.org/
- Lighthouse: Built into Chrome DevTools
- pa11y: https://pa11y.org/
- Contrast Checker: https://webaim.org/resources/contrastchecker/

### Screen Readers

- JAWS: https://www.freedomscientific.com/products/software/jaws/
- NVDA: https://www.nvaccess.org/ (Free)
- VoiceOver: Built into Mac/iOS
- TalkBack: Built into Android

### Learning Resources

- WebAIM: https://webaim.org/
- W3C WCAG: https://www.w3.org/WAI/WCAG21/quickref/
- A11y Project: https://www.a11yproject.com/
- Deque University: https://dequeuniversity.com/

---

## Contact

**Accessibility Team**
- Email: accessibility@cooksmartapp.com
- Report Issues: https://cooksmartapp.com/legal/accessibility

---

**Last Updated:** November 30, 2025  
**Next Review:** February 28, 2026  
**Standard:** WCAG 2.1 Level AA
