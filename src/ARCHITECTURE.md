# OneAdmin Design System v2.0 - Architecture Guide

## Overview

This document describes the hierarchical architecture of the redesigned OneAdmin application.

## Directory Structure

```
src/
├── design-system/           # Core Design System
│   ├── tokens/            # Design Tokens (Single Source of Truth)
│   │   ├── index.ts       # Color, Typography, Spacing, Shadows
│   │   └── theme.ts       # Theme exports
│   ├── primitives/         # Atomic Components
│   │   ├── Pressable.tsx  # Enhanced Pressable
│   │   ├── Text.tsx       # Typography component
│   │   ├── Input.tsx      # Form input
│   │   ├── Button.tsx    # Action buttons
│   │   ├── Card.tsx      # Container component
│   │   └── Badge.tsx     # Status indicators
│   ├── components/        # Composite Components
│   │   ├── BottomSheet.tsx
│   │   └── Modal.tsx
│   ├── all.ts             # Complete exports
│   └── index.ts           # Public API
│
├── layout/                 # Layout Components
│   ├── screen/            # Screen container
│   ├── header/            # Header with hierarchy
│   └── section/           # Content sections
│
├── navigation/            # Navigation System
│   ├── tabs/              # Bottom tab navigator
│   │   ├── MainTabs.tsx
│   │   └── types.ts
│   ├── stack/             # Stack navigators (future)
│   └── index.ts           # Navigation exports
│
├── feature-*/             # Feature Modules
│   ├── feature-auth/
│   ├── feature-dashboard/
│   ├── feature-users/
│   ├── feature-routes/
│   ├── feature-tickets/
│   ├── feature-admins/
│   ├── feature-notifications/
│   ├── feature-logs/
│   ├── feature-devices/
│   ├── feature-profile/
│   └── feature-settings/
│
├── services/              # API & Business Logic
│   ├── api/
│   └── firebase.ts
│
└── utils/                 # Utilities
    └── helpers/
```

## Hierarchy Levels

### 1. Design Tokens (Layer 0)
**Purpose**: Single source of truth for all visual decisions

```typescript
// Usage
import { Colors, Typography, Spacing, BorderRadius, Shadows } from '../design-system';

// Instead of hardcoded values
// Before: color: '#0B1220'
// After:  color: Colors.primary.DEFAULT
```

### 2. Primitives (Layer 1)
**Purpose**: Atomic UI components with design system defaults

```typescript
// Usage
import { Text, Button, Input, Card, Badge } from '../design-system';

<Text variant="lg" weight="extrabold" color="text.primary">Title</Text>
<Button title="Submit" onPress={handleSubmit} variant="filled" />
<Input label="Email" error="Invalid email" placeholder="Enter email" />
<Card variant="elevated" tone="success"><Content /></Card>
<Badge label="ACTIVE" variant="success" />
```

### 3. Components (Layer 2)
**Purpose**: Reusable UI patterns built on primitives

```typescript
// Usage
import { BottomSheet, Modal, ConfirmationModal } from '../design-system';

<BottomSheet visible={show} onClose={() => setShow(false)} title="Title">
  <Content />
</BottomSheet>

<ConfirmationModal
  visible={show}
  onClose={() => setShow(false)}
  onConfirm={handleConfirm}
  title="Delete Item?"
  message="This action cannot be undone."
/>
```

### 4. Layout Components (Layer 3)
**Purpose**: Screen-level structure components

```typescript
// Usage
import { Screen, Header, Section, SectionCard } from '../layout';

<Screen scrollable statusBarStyle="dark-content">
  <Header title="Dashboard" subtitle="Overview" />
  <Section title="Stats" action={<Button />}>
    <Content />
  </Section>
  <SectionCard title="Summary">
    <Card content />
  </SectionCard>
</Screen>
```

## Navigation Hierarchy

```
Root Stack
├── Auth Stack
│   ├── Login Screen
│   └── Register Screen
│
└── Main Tab Navigator
    ├── Dashboard (Home)
    ├── Routes (MANAGE_ROUTES)
    ├── Users (MANAGE_USERS)
    ├── Tickets (MANAGE_TICKETS)
    ├── Devices (MANAGE_USERS)
    ├── Logs (MANAGE_LOGS)
    ├── Cleanup (MANAGE_USERS)
    ├── Admins (MANAGE_ADMINS)
    ├── Alerts (All)
    └── Profile (Hidden tab)
```

## Migration Guide

### Old → New Component Mapping

| Old Component | New Component | Notes |
|---------------|---------------|-------|
| `AdminHeader` | `layout/Header` | Use `variant="primary"` for gradient |
| `AdminScreen` | `layout/Screen` | Use `scrollable={false}` for no scroll |
| `SectionHeader` | `layout/Section` | Use `SectionCard` for card variant |
| `AdminBottomSheet` | `BottomSheet` | Improved gesture handling |
| `ConfirmationModal` | `design-system/Modal` | Use `tone` prop |
| `Card` | `primitives/Card` | Use `variant` prop |
| `StatusBadge` | `primitives/Badge` | Use `variant` prop |

### Token Migration

| Old | New |
|-----|-----|
| `COLORS.primary` | `Colors.primary.DEFAULT` |
| `COLORS.accent` | `Colors.accent.DEFAULT` |
| `COLORS.surface` | `Colors.surface.DEFAULT` |
| `RADIUS.md` | `BorderRadius.md` |
| `SHADOWS.card` | `Shadows.base` |
| `SPACING.lg` | `Spacing.lg` |

## Best Practices

1. **Always use design tokens** for colors, spacing, and typography
2. **Prefer primitives** over custom styles
3. **Use proper hierarchy**: Screen → Header → Section → Content
4. **Extract repeated patterns** to reusable components
5. **Maintain consistent spacing** using the spacing scale
6. **Use TypeScript** for all components with proper prop types
7. **Test accessibility** - use proper accessibility props

## Benefits

- **Consistency**: All UI elements use the same design language
- **Maintainability**: Change tokens in one place, update everywhere
- **Scalability**: New features can use existing components
- **Accessibility**: Built-in accessibility support
- **Developer Experience**: Clear patterns and documentation
- **Premium Feel**: Smooth animations and interactions

---

*Generated for OneAdmin v2.0 refactoring*