# Cook Smart - Modern Design System

## 🎨 Design Philosophy
**Modern, Clean, Intuitive** - Following 2024 design trends with familiar patterns users expect from popular apps like Instagram, Spotify, and modern food apps.

## 🎯 Core Design Principles
- **Mobile-First**: Designed for mobile, scales to desktop
- **Familiar Patterns**: Use UI patterns from popular apps
- **Accessibility**: WCAG 2.1 AA compliant
- **Performance**: Smooth animations, fast loading
- **Consistency**: Unified experience across all screens

## 🎨 Color Palette

### Primary Colors
```css
--primary-green: #10B981;      /* Modern green (like WhatsApp) */
--primary-dark: #059669;       /* Darker green for hover states */
--primary-light: #D1FAE5;      /* Light green for backgrounds */
```

### Secondary Colors
```css
--secondary-orange: #F59E0B;   /* Accent color (like food apps) */
--secondary-red: #EF4444;      /* Error/delete actions */
--secondary-blue: #3B82F6;     /* Info/links */
```

### Neutral Colors
```css
--gray-50: #F9FAFB;           /* Light backgrounds */
--gray-100: #F3F4F6;          /* Card backgrounds */
--gray-200: #E5E7EB;          /* Borders */
--gray-300: #D1D5DB;          /* Disabled states */
--gray-400: #6B7280;          /* Placeholder text - Updated for 4.5:1 contrast */
--gray-500: #6B7280;          /* Secondary text */
--gray-600: #4B5563;          /* Primary text */
--gray-700: #374151;          /* Headings */
--gray-800: #1F2937;          /* Dark text */
--gray-900: #111827;          /* Darkest text */
--white: #FFFFFF;
--black: #000000;
```

### Status Colors
```css
--success: #10B981;           /* Success states */
--warning: #F59E0B;           /* Warning states */
--error: #EF4444;             /* Error states */
--info: #3B82F6;              /* Info states */
```

## 📱 Typography

### Font Stack
```css
font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
```

### Font Sizes & Weights
```css
--text-xs: 12px;              /* Captions, labels */
--text-sm: 14px;              /* Body text, buttons */
--text-base: 16px;            /* Default body */
--text-lg: 18px;              /* Large body */
--text-xl: 20px;              /* Small headings */
--text-2xl: 24px;             /* Medium headings */
--text-3xl: 30px;             /* Large headings */
--text-4xl: 36px;             /* Hero text */

--font-light: 300;
--font-normal: 400;
--font-medium: 500;
--font-semibold: 600;
--font-bold: 700;
```

## 🔲 Component Specifications

### Buttons
```css
/* Primary Button (like Instagram/WhatsApp) */
.btn-primary {
  background: var(--primary-green);
  color: white;
  border-radius: 12px;
  padding: 12px 24px;
  font-weight: 600;
  font-size: 16px;
  border: none;
  box-shadow: 0 2px 8px rgba(16, 185, 129, 0.2);
  transition: all 0.2s ease;
}

/* Secondary Button */
.btn-secondary {
  background: var(--gray-100);
  color: var(--gray-700);
  border-radius: 12px;
  padding: 12px 24px;
  font-weight: 500;
  border: 1px solid var(--gray-200);
}

/* Icon Button (like modern apps) */
.btn-icon {
  min-width: 44px;  /* ADA compliant touch target */
  min-height: 44px; /* ADA compliant touch target */
  border-radius: 22px;
  background: var(--gray-100);
  border: none;
  display: flex;
  align-items: center;
  justify-content: center;
}

/* Focus states for accessibility */
.btn-primary:focus {
  outline: 3px solid var(--primary-dark);
  outline-offset: 2px;
}

.btn-secondary:focus {
  outline: 3px solid var(--gray-500);
  outline-offset: 2px;
}
```

### Cards
```css
.card {
  background: white;
  border-radius: 16px;
  padding: 20px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
  border: 1px solid var(--gray-100);
}

.card-recipe {
  background: white;
  border-radius: 16px;
  overflow: hidden;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);
  transition: transform 0.2s ease;
}
```

### Input Fields
```css
.input {
  background: var(--gray-50);
  border: 2px solid var(--gray-200);
  border-radius: 12px;
  padding: 14px 16px;
  font-size: 16px;
  transition: border-color 0.2s ease;
}

.input:focus {
  border-color: var(--primary-green);
  background: white;
  outline: none;
  box-shadow: 0 0 0 3px rgba(16, 185, 129, 0.3); /* Increased opacity for visibility */
}
```

## 📱 Main App Layout Patterns

### Bottom Navigation (like Instagram/TikTok)
```
┌─────────────────────────────────┐
│           Content               │
│                                 │
│                                 │
└─────────────────────────────────┘
┌─────────────────────────────────┐
│ 🏠 Home  📦 Pantry  🔍 Recipes  │
│ 📋 Lists  👤 Profile            │
└─────────────────────────────────┘
```

### Header Patterns
```
┌─────────────────────────────────┐
│ ← Cook Smart        🔔 ⚙️      │ <- Back + Title + Actions
└─────────────────────────────────┘

┌─────────────────────────────────┐
│ Good morning, John! ☀️          │ <- Personalized greeting
│ What's cooking today?           │
└─────────────────────────────────┘
```

### Recipe Cards (like Pinterest/Food Network)
```
┌─────────────────────────────────┐
│        Recipe Image             │
│                            ❤️   │ <- Favorite button
├─────────────────────────────────┤
│ Recipe Title                    │
│ ⏱️ 30 min  👥 4 servings       │
│ 🟢🟢🟡 Ingredients Match        │ <- Visual indicator
└─────────────────────────────────┘
```

## 🖥️ Admin Dashboard Layout

### Sidebar Navigation (like Stripe/Notion)
```
┌──────┬──────────────────────────┐
│ 📊   │                          │
│ Dashboard                       │
│      │                          │
│ 👥   │        Main Content      │
│ Users│                          │
│      │                          │
│ 🍽️   │                          │
│ Recipes                         │
│      │                          │
│ ⚙️   │                          │
│ Settings                        │
└──────┴──────────────────────────┘
```

### Dashboard Cards (like modern admin panels)
```
┌─────────────────────────────────┐
│ Total Users          📈         │
│ 1,247               +12%        │
└─────────────────────────────────┘

┌─────────────────────────────────┐
│ Active Recipes       🍽️         │
│ 3,456               +5%         │
└─────────────────────────────────┘
```

## 🎭 Animation & Interactions

### Micro-interactions
- **Button Press**: Scale down to 0.95 for 100ms
- **Card Hover**: Lift with shadow increase
- **Loading**: Skeleton screens (like Facebook/LinkedIn)
- **Page Transitions**: Slide animations (like mobile apps)

### Loading States
```css
.skeleton {
  background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
  background-size: 200% 100%;
  animation: loading 1.5s infinite;
}
```

## 📱 Screen-Specific Layouts

### Home Screen (like food delivery apps)
```
┌─────────────────────────────────┐
│ Good evening, John! 🌙          │
│ Ready to cook something?        │
├─────────────────────────────────┤
│ 🔍 Search recipes...            │
├─────────────────────────────────┤
│ Quick Actions                   │
│ [📷 Scan] [🥗 Pantry] [❤️ Faves]│
├─────────────────────────────────┤
│ Suggested for You               │
│ [Recipe Card] [Recipe Card]     │
└─────────────────────────────────┘
```

### Recipe Detail (like cooking apps)
```
┌─────────────────────────────────┐
│ ← Recipe Name              ❤️ ⋯ │
├─────────────────────────────────┤
│        Hero Image               │
├─────────────────────────────────┤
│ ⏱️ 30 min  👥 4  🔥 Easy       │
├─────────────────────────────────┤
│ Ingredients    Instructions     │ <- Tabs
│ • 2 cups flour                  │
│ • 1 egg                         │
└─────────────────────────────────┘
```

### Pantry Management (like inventory apps)
```
┌─────────────────────────────────┐
│ My Pantry              + Add    │
├─────────────────────────────────┤
│ 🔍 Search ingredients...        │
├─────────────────────────────────┤
│ Categories                      │
│ [🥩 Proteins] [🥕 Vegetables]   │
├─────────────────────────────────┤
│ Your Ingredients                │
│ 🥩 Chicken breast    2 lbs      │
│ 🥕 Carrots          1 bag       │
└─────────────────────────────────┘
```

## 🎨 Visual Hierarchy

### Information Architecture
1. **Primary Actions**: Large, prominent buttons
2. **Secondary Actions**: Smaller, less prominent
3. **Content**: Clear typography hierarchy
4. **Navigation**: Always accessible, familiar patterns

### Spacing System (8px grid)
```css
--space-1: 4px;
--space-2: 8px;
--space-3: 12px;
--space-4: 16px;
--space-5: 20px;
--space-6: 24px;
--space-8: 32px;
--space-10: 40px;
--space-12: 48px;
--space-16: 64px;
--space-20: 80px;
```

## 📱 Responsive Breakpoints
```css
--mobile: 320px;
--tablet: 768px;
--desktop: 1024px;
--large: 1280px;
```

## 🔧 Implementation Notes

### React Native Components to Use
- **Navigation**: React Navigation 6 with bottom tabs
- **UI Library**: React Native Elements or NativeBase
- **Icons**: React Native Vector Icons (Feather/Ionicons)
- **Animations**: React Native Reanimated 3

### Admin Dashboard (Web)
- **Framework**: React with Tailwind CSS
- **Components**: Headless UI or Radix UI
- **Charts**: Recharts or Chart.js
- **Icons**: Heroicons or Lucide React

This design system ensures both the main app and admin dashboard will look modern, professional, and familiar to users while maintaining consistency across all platforms.