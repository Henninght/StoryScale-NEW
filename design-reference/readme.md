# StoryScale Visual Design Reference

This folder contains exact UI screenshots that MUST be matched when implementing components. Always refer to these images before coding any UI element.

## 📸 Screenshot Organization

### /dashboard
- `dashboard-empty.png` - Empty state with "No saved posts yet"
- `dashboard-with-data.png` - Populated dashboard showing posts table
- `dashboard-metrics.png` - Top section with 3 metric cards

**Key Elements to Match:**
- Left sidebar: 240px width, light gray (#F9FAFB) background
- Metric cards: White background, subtle shadow, icon + title + value
- Data table: Hover states, status pills, character count
- Orange "Tools" dropdown button (top right)

### /wizard
- `step-1-content.png` - Content & Purpose form
- `step-2-audience.png` - Audience & Style selection
- `step-3-research.png` - Research & Enhancement options
- `step-4-summary.png` - Summary & Action with CTA

**Key Elements to Match:**
- Step indicators: Blue (#5B6FED) for active/completed, gray for pending
- Progress bar: Shows percentage completion
- Form spacing: Consistent padding between elements
- Navigation: Previous/Cancel/Save Draft/Next buttons
- Large textarea with placeholder text
- Dropdown selects with full width

### /tools
- `edit-refine-layout.png` - Two-panel layout structure
- `edit-refine-config.png` - Configuration sidebar details

**Key Elements to Match:**
- Fixed sidebar: 380px width
- Tab navigation: "Essentials" and "Required" tabs
- Collapsible sections with badges
- Purple "Enhance Draft" button (#8B5CF6)
- Character counter with status indicator

## 🎨 Critical Design Tokens

### Colors (MUST match exactly)
```scss
$orange-primary: #E85D2F;    // Brand, Tools button
$blue-primary: #5B6FED;      // CTAs, links, active states
$purple-accent: #8B5CF6;     // Enhance button, metric icons
$green-success: #10B981;     // Generate Post, success states
$gray-50: #F9FAFB;          // Backgrounds
$gray-200: #E5E7EB;         // Borders
$gray-600: #6B7280;         // Secondary text
$gray-900: #111827;         // Primary text
```

### Spacing
- Card padding: 24px
- Section spacing: 32px
- Form field spacing: 16px
- Button padding: 12px 24px

### Typography
- Headers: 32px, bold
- Subheaders: 18px, medium
- Body: 16px, regular
- Small text: 14px
- Labels: 12px, uppercase

### Shadows & Borders
- Card shadow: `0 1px 2px 0 rgba(0, 0, 0, 0.05)`
- Border radius: 8px (cards), 6px (inputs), 4px (small elements)
- Border color: #E5E7EB

## 🔍 Component Matching Checklist

Before considering a component complete, verify:

- [ ] Colors match hex values exactly
- [ ] Spacing matches screenshot proportions
- [ ] Interactive states (hover, focus) implemented
- [ ] Text sizes and weights correct
- [ ] Shadows and borders match exactly
- [ ] Responsive behavior maintains proportions

## 📏 Layout Specifications

### Dashboard Layout
```
+------------------+--------------------------------+
|                  |         Header                 |
|    Sidebar       |  +-------------------------+  |
|    (240px)       |  |    Metric Cards (3)     |  |
|                  |  +-------------------------+  |
|  - Dashboard     |                                |
|  - LinkedIn      |  +-------------------------+  |
|    Tools         |  |     Data Table          |  |
|  - Settings      |  +-------------------------+  |
+------------------+--------------------------------+
```

### Wizard Layout
```
+------------------------------------------------+
|              Step Progress Bar                 |
+------------------------------------------------+
|                                                |
|           Form Content Area                    |
|                                                |
+------------------------------------------------+
|  [Previous] [Cancel]    [Save Draft] [Next]    |
+------------------------------------------------+
```

### Edit & Refine Layout
```
+------------------+--------------------------------+
|  Configuration   |                                |
|   (380px)        |        Content Editor          |
|                  |                                |
|  - Tabs          |   +------------------------+   |
|  - Dropdowns     |   |                        |   |
|  - Options       |   |     Textarea           |   |
|                  |   |                        |   |
|  [Enhance]       |   +------------------------+   |
+------------------+--------------------------------+
```

## ⚡ Implementation Priority

1. **Dashboard** - Start with empty state, then populated
2. **Wizard** - Implement step-by-step, test navigation
3. **Edit Tool** - Focus on layout first, then configuration

Always implement in this order to ensure core functionality works before adding complexity.
