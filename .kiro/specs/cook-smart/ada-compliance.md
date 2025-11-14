# Cook Smart - ADA Compliance Checklist

## 🚨 Legal Requirements
**ADA Title III** applies to places of public accommodation, including websites and mobile apps. Non-compliance can result in lawsuits and fines.

## 🎯 WCAG 2.1 AA Compliance Requirements

### 1. Color & Contrast
- [ ] **Text contrast ratio ≥ 4.5:1** for normal text
- [ ] **Text contrast ratio ≥ 3:1** for large text (18pt+ or 14pt+ bold)
- [ ] **Non-text contrast ratio ≥ 3:1** for UI components and graphics
- [ ] **Color not sole indicator** - use icons, text, or patterns alongside color

#### Current Color Audit:
```css
/* ✅ COMPLIANT COMBINATIONS */
--primary-green (#10B981) on white: 4.52:1 ✅
--gray-700 (#374151) on white: 8.87:1 ✅
--gray-600 (#4B5563) on white: 7.21:1 ✅

/* ⚠️ NEEDS REVIEW */
--gray-500 (#6B7280) on white: 4.54:1 ✅ (barely passes)
--gray-400 (#9CA3AF) on white: 2.85:1 ❌ (fails - placeholder only)

/* 🔧 FIXES NEEDED */
--gray-400: Change to #6B7280 for accessible placeholders
```

### 2. Keyboard Navigation
- [ ] **All interactive elements** accessible via keyboard
- [ ] **Logical tab order** through all content
- [ ] **Visible focus indicators** on all focusable elements
- [ ] **Skip links** for main content navigation
- [ ] **No keyboard traps** - users can navigate away from any element

### 3. Screen Reader Support
- [ ] **Semantic HTML** elements (headings, lists, buttons, forms)
- [ ] **Alt text** for all meaningful images
- [ ] **ARIA labels** for complex UI components
- [ ] **Form labels** properly associated with inputs
- [ ] **Error messages** clearly announced
- [ ] **Loading states** announced to screen readers

### 4. Touch & Motor Accessibility
- [ ] **Minimum touch target size: 44x44px** (iOS) / 48x48dp (Android)
- [ ] **Adequate spacing** between touch targets (8px minimum)
- [ ] **No time limits** or generous time limits with extensions
- [ ] **Gesture alternatives** for complex gestures

### 5. Visual & Cognitive Accessibility
- [ ] **Text can be resized to 200%** without horizontal scrolling
- [ ] **Content reflows** properly at different zoom levels
- [ ] **Clear headings** and content structure
- [ ] **Simple, consistent navigation**
- [ ] **Error prevention** and clear error messages

## 🔧 Implementation Requirements

### React Native Accessibility Props
```jsx
// Button accessibility
<TouchableOpacity
  accessible={true}
  accessibilityRole="button"
  accessibilityLabel="Add ingredient to pantry"
  accessibilityHint="Double tap to add this ingredient"
>

// Image accessibility
<Image
  source={recipeImage}
  accessible={true}
  accessibilityLabel="Chicken stir fry with vegetables"
/>

// Form input accessibility
<TextInput
  accessible={true}
  accessibilityLabel="Search ingredients"
  accessibilityHint="Type to search for ingredients in your pantry"
  placeholder="Search ingredients..."
/>
```

### Web Accessibility (Admin Dashboard)
```jsx
// Semantic HTML
<main role="main">
  <h1>Dashboard</h1>
  <nav aria-label="Main navigation">
    <ul>
      <li><a href="/users">Users</a></li>
      <li><a href="/recipes">Recipes</a></li>
    </ul>
  </nav>
</main>

// Form accessibility
<label htmlFor="email">Email Address</label>
<input
  id="email"
  type="email"
  aria-describedby="email-error"
  aria-invalid={hasError}
/>
<div id="email-error" role="alert">
  {errorMessage}
</div>
```

## 🎨 Design System Updates Needed

### Color Fixes
```css
/* Update placeholder text color */
--gray-400: #6B7280;  /* Changed from #9CA3AF for 4.5:1 contrast */

/* Add high contrast mode support */
@media (prefers-contrast: high) {
  --primary-green: #059669;  /* Darker for higher contrast */
  --gray-500: #374151;       /* Darker secondary text */
}
```

### Focus States
```css
.btn-primary:focus {
  outline: 3px solid #059669;
  outline-offset: 2px;
}

.input:focus {
  border-color: var(--primary-green);
  box-shadow: 0 0 0 3px rgba(16, 185, 129, 0.3);
  outline: none;
}
```

### Touch Targets
```css
/* Ensure minimum 44px touch targets */
.btn-icon {
  min-width: 44px;
  min-height: 44px;
}

.nav-item {
  min-height: 44px;
  padding: 12px 16px;
}
```

## 📱 Screen Reader Announcements

### Recipe Cards
```jsx
<View
  accessible={true}
  accessibilityRole="button"
  accessibilityLabel={`${recipe.title}, ${recipe.cookTime} minutes, ${recipe.servings} servings, ${ingredientMatch} ingredients match`}
>
```

### Loading States
```jsx
<View
  accessible={true}
  accessibilityLabel="Loading recipes"
  accessibilityLiveRegion="polite"
>
```

### Error States
```jsx
<Text
  accessible={true}
  accessibilityRole="alert"
  accessibilityLiveRegion="assertive"
>
  Error: Unable to load recipes. Please try again.
</Text>
```

## 🧪 Testing Requirements

### Automated Testing
- [ ] **axe-core** integration for automated accessibility testing
- [ ] **Color contrast** validation in CI/CD
- [ ] **Keyboard navigation** automated tests

### Manual Testing
- [ ] **Screen reader testing** (VoiceOver on iOS, TalkBack on Android)
- [ ] **Keyboard-only navigation** testing
- [ ] **High contrast mode** testing
- [ ] **200% zoom** testing
- [ ] **Voice control** testing (iOS/Android)

### Testing Tools
```bash
# Install accessibility testing tools
npm install --save-dev @axe-core/react-native
npm install --save-dev jest-axe
```

## 📋 Phase-by-Phase Implementation

### Phase 1: Foundation
- [ ] Set up accessibility linting rules
- [ ] Configure color contrast validation
- [ ] Implement focus management system

### Phase 2: Authentication
- [ ] Accessible form validation
- [ ] Screen reader announcements for auth states
- [ ] Keyboard navigation for login/signup

### Phase 3: Core Features
- [ ] Recipe card accessibility
- [ ] Pantry management accessibility
- [ ] Barcode scanner accessibility alternatives

### Phase 4: Advanced Features
- [ ] Complex UI component accessibility
- [ ] Dynamic content announcements
- [ ] Advanced navigation patterns

## 🚨 Critical Issues to Address

### High Priority Fixes:
1. **Placeholder text color** - Update --gray-400 to pass contrast
2. **Touch target sizes** - Ensure all buttons meet 44px minimum
3. **Focus indicators** - Add visible focus states to all interactive elements
4. **Alt text strategy** - Plan for recipe images and icons

### Medium Priority:
1. **Screen reader testing** - Set up testing workflow
2. **Keyboard navigation** - Implement skip links and logical tab order
3. **Error handling** - Ensure all errors are announced properly

### Documentation Updates:
1. **Accessibility guidelines** for developers
2. **Testing procedures** for QA
3. **Content guidelines** for alt text and labels

## 💰 Cost Implications
- **Accessibility testing tools**: Most are free (axe-core, WAVE)
- **Manual testing**: Internal team effort
- **Compliance audit**: $2,000-5,000 (optional, post-launch)

## 📚 Resources
- [WCAG 2.1 Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)
- [React Native Accessibility](https://reactnative.dev/docs/accessibility)
- [WebAIM Color Contrast Checker](https://webaim.org/resources/contrastchecker/)

**Next Step**: Update design system colors and implement accessibility props from Phase 1 onwards.