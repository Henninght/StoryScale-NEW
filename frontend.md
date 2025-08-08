# Frontend Development Guide

## 🚨 Development Workflow
Follow the main Research → Plan → Implement workflow from root claude.md

## 🎯 Quick Reference

### Component Generation
```bash
# Generate new component with proper structure
npm run gen:component [ComponentName]

# Component template structure:
# /src/components/[feature]/[ComponentName].tsx
# /src/components/[feature]/[ComponentName].test.tsx
# /src/components/[feature]/[ComponentName].stories.tsx (if using Storybook)
```

### CSS Architecture
```scss
// Use Tailwind utility classes following design system
// Custom CSS only when necessary in component files

// Color variables from DESIGN.md
$orange-primary: #E85D2F;
$blue-primary: #5B6FED;
$purple-accent: #8B5CF6;
$green-success: #10B981;
```

## 🧩 Component Patterns

### Base Component Structure
```typescript
interface ComponentProps {
  // Always define explicit props
  className?: string; // Allow style overrides
  children?: React.ReactNode;
  // ... specific props
}

export function Component({ className, ...props }: ComponentProps) {
  return (
    <div className={cn("base-styles", className)}>
      {/* Component content */}
    </div>
  );
}
```

### Form Components
```typescript
// Always include these states
interface FormFieldProps {
  label: string;
  error?: string;
  required?: boolean;
  disabled?: boolean;
  helpText?: string;
}

// Validation pattern
const validateField = (value: string): string | undefined => {
  if (required && !value) return "This field is required";
  // Additional validation
  return undefined;
};
```

### Loading States
```typescript
// Skeleton pattern for cards
<div className="animate-pulse">
  <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
  <div className="h-4 bg-gray-200 rounded w-1/2"></div>
</div>

// Spinner pattern for actions
<div className="flex items-center justify-center p-4">
  <Loader className="animate-spin h-5 w-5 text-blue-primary" />
</div>
```

### Error Handling
```typescript
// Error boundary wrapper
<ErrorBoundary fallback={<ErrorFallback />}>
  <Component />
</ErrorBoundary>

// Inline error display
{error && (
  <p className="text-sm text-red-500 mt-1">{error}</p>
)}
```

## 📱 Responsive Guidelines

### Breakpoint System
```typescript
// Tailwind breakpoints
sm: '640px'   // Mobile landscape
md: '768px'   // Tablet
lg: '1024px'  // Desktop
xl: '1280px'  // Wide desktop

// Usage
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
```

### Mobile-First Approach
```scss
// Default: Mobile styles
// md: Tablet overrides
// lg: Desktop overrides

// Example
.component {
  padding: 16px;    // Mobile
  
  @media (min-width: 768px) {
    padding: 24px;  // Tablet+
  }
}
```

## 🎨 Styling Guidelines

### Use Design System Colors
```typescript
// Status colors
const statusColors = {
  draft: 'bg-yellow-100 text-yellow-800',
  published: 'bg-blue-100 text-blue-800',
  error: 'bg-red-100 text-red-800',
  success: 'bg-green-100 text-green-800'
};
```

### Consistent Spacing
```typescript
// Use spacing scale
const spacing = {
  xs: '4px',   // space-1
  sm: '8px',   // space-2
  md: '16px',  // space-4
  lg: '24px',  // space-6
  xl: '32px'   // space-8
};
```

### Interactive States
```scss
// All interactive elements need:
.interactive {
  cursor: pointer;
  transition: all 0.2s ease;
  
  &:hover {
    // Visual feedback
  }
  
  &:focus {
    outline: 2px solid $blue-primary;
    outline-offset: 2px;
  }
  
  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
}
```

## 🔧 Development Patterns

### State Management
```typescript
// Local state for UI
const [isOpen, setIsOpen] = useState(false);

// Form state
const [formData, setFormData] = useState<FormData>({
  title: '',
  content: ''
});

// Loading states
const [isLoading, setIsLoading] = useState(false);
const [error, setError] = useState<string | null>(null);
```

### Data Fetching Pattern
```typescript
// With error handling
async function fetchData() {
  setIsLoading(true);
  setError(null);
  
  try {
    const data = await api.getData();
    setData(data);
  } catch (err) {
    setError(err.message);
  } finally {
    setIsLoading(false);
  }
}
```

### Accessibility Checklist
```typescript
// ✅ Semantic HTML
// ✅ ARIA labels where needed
// ✅ Keyboard navigation
// ✅ Focus management
// ✅ Color contrast (4.5:1 minimum)
// ✅ Error announcements
// ✅ Loading state announcements
```

## 🧪 Testing Approach

### Component Testing
```typescript
// Test user interactions
it('should handle form submission', async () => {
  render(<Component />);
  
  // Fill form
  await userEvent.type(screen.getByLabelText('Title'), 'Test');
  
  // Submit
  await userEvent.click(screen.getByText('Submit'));
  
  // Verify outcome
  expect(screen.getByText('Success')).toBeInTheDocument();
});
```

### Visual Testing
```typescript
// Screenshot tests for:
// - Different viewport sizes
// - Light/dark modes (if applicable)
// - Interactive states
// - Error states
```

## 🚀 Performance Guidelines

### Image Optimization
```typescript
// Use Next.js Image component
import Image from 'next/image';

<Image
  src={url}
  alt={description}
  width={800}
  height={600}
  loading="lazy"
  placeholder="blur"
/>
```

### Code Splitting
```typescript
// Dynamic imports for heavy components
const HeavyComponent = dynamic(
  () => import('./HeavyComponent'),
  { 
    loading: () => <Skeleton />,
    ssr: false 
  }
);
```

### Bundle Size Monitoring
```bash
# Check bundle size
npm run analyze

# Target metrics:
# - First Load JS: <200kb
# - Individual pages: <100kb
# - Lazy load anything >50kb
```

## 📋 Pre-Implementation Checklist

Before building any new component:

1. **Research Phase**
   - [ ] Check existing components for reuse
   - [ ] Review design system in DESIGN.md
   - [ ] Verify responsive requirements
   - [ ] Check accessibility requirements

2. **Planning Phase**
   - [ ] Define component props interface
   - [ ] Plan state management approach
   - [ ] Document loading/error states
   - [ ] Plan test scenarios

3. **Implementation Phase**
   - [ ] Follow component structure pattern
   - [ ] Add proper TypeScript types
   - [ ] Include all interactive states
   - [ ] Test on mobile viewport
   - [ ] Add accessibility attributes
   - [ ] Write component tests

## 🔍 Debugging Tips

```bash
# CSS debugging
# Add to any element to debug layout
style="border: 1px solid red;"

# Check Tailwind config
npx tailwindcss init -p

# Component hierarchy
React Developer Tools > Components

# Performance profiling
React Developer Tools > Profiler
```

## 🎯 StoryScale-Specific Components

### Wizard Component Pattern
```typescript
// Based on 4-step LinkedIn wizard
interface WizardProps {
  steps: WizardStep[];
  onComplete: (data: WizardData) => void;
  onSaveDraft: (data: Partial<WizardData>) => void;
}

// Step indicator from screenshots
<div className="flex items-center justify-center mb-12">
  {steps.map((step, index) => (
    <>
      <StepIndicator 
        number={index + 1}
        status={getStepStatus(index)}
        label={step.label}
      />
      {index < steps.length - 1 && (
        <StepConnector completed={index < currentStep} />
      )}
    </>
  ))}
</div>
```

### Dashboard Cards
```typescript
// Metric card from dashboard screenshots
<div className="bg-white rounded-lg p-6 shadow-sm">
  <div className="flex items-start justify-between">
    <div className="flex items-center gap-3">
      <div className="p-2 bg-purple-100 rounded-lg">
        <Icon className="w-5 h-5 text-purple-600" />
      </div>
      <div>
        <h3 className="font-semibold text-gray-900">{title}</h3>
        <p className="text-sm text-gray-600">{subtitle}</p>
      </div>
    </div>
    <span className="text-2xl font-bold">{value}</span>
  </div>
  {breakdown && <BreakdownList items={breakdown} />}
</div>
```

### Data Table Pattern
```typescript
// From dashboard content table
<table className="w-full">
  <thead>
    <tr className="border-b border-gray-200">
      <th className="text-left text-xs font-medium text-gray-600 uppercase tracking-wider p-3">
        Title
      </th>
      {/* Other columns */}
    </tr>
  </thead>
  <tbody>
    {data.map(item => (
      <tr className="border-b border-gray-100 hover:bg-gray-50">
        <td className="p-4">
          <div className="font-medium text-gray-900">
            {item.emoji} {item.title}
          </div>
          <div className="text-xs text-gray-500">
            {item.characterCount} characters
          </div>
        </td>
        {/* Other cells */}
      </tr>
    ))}
  </tbody>
</table>
```

### Status Pills
```typescript
// Purpose/status pills from screenshots
const purposeStyles = {
  'thought-leadership': 'bg-purple-100 text-purple-700',
  'question': 'bg-pink-100 text-pink-700',
  'value': 'bg-blue-100 text-blue-700',
  'authority': 'bg-orange-100 text-orange-700'
};

<span className={cn(
  "inline-flex px-3 py-1 rounded-full text-xs font-medium",
  purposeStyles[purpose]
)}>
  {purpose}
</span>
```

## 🎨 From Design Screenshots

### Color Application
```scss
// Navigation (left sidebar)
.sidebar {
  background: #F9FAFB; // Light gray background
  
  .nav-item {
    &.active {
      background: rgba(91, 111, 237, 0.1); // Light blue
      color: #5B6FED; // Blue primary
    }
  }
}

// Primary actions
.btn-primary {
  background: #5B6FED; // Blue for "Next", "Create"
}

.btn-brand {
  background: #E85D2F; // Orange for "Tools" dropdown
}

.btn-success {
  background: #10B981; // Green for "Generate Post"
}
```

### Form Patterns from Wizard
```typescript
// Large textarea (Step 1)
<textarea
  className="w-full min-h-[200px] p-4 border border-gray-300 rounded-lg 
             focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
  placeholder="What do you want to share? Be specific about your message, story, or insights..."
/>

// Dropdown pattern
<select className="w-full p-3 border border-gray-300 rounded-lg">
  <option>Select an option...</option>
  {options.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
</select>

// Radio grid (Step 2)
<div className="grid grid-cols-2 gap-3">
  {options.map(option => (
    <label className={cn(
      "p-3 border rounded-lg cursor-pointer transition-all",
      selected === option ? "border-blue-500 bg-blue-50" : "border-gray-300"
    )}>
      <input type="radio" className="sr-only" />
      {option}
    </label>
  ))}
</div>
```

## 🔄 Common UI Flows

### Wizard Navigation
```typescript
// Bottom navigation pattern from screenshots
<div className="flex justify-between items-center mt-12 pt-6 border-t">
  <div className="flex gap-3">
    {currentStep > 0 && (
      <button className="flex items-center gap-2 text-gray-700">
        <ChevronLeft /> Previous
      </button>
    )}
    <button className="text-gray-600">Cancel</button>
  </div>
  
  <div className="flex gap-3">
    <button className="px-4 py-2 border border-gray-300 rounded-lg">
      Save Draft
    </button>
    <button className="px-6 py-2 bg-blue-600 text-white rounded-lg">
      {isLastStep ? 'Generate Post' : 'Next'}
    </button>
  </div>
</div>
```

### Empty States
```typescript
// From dashboard empty state
<div className="text-center py-12">
  <DocumentIcon className="w-16 h-16 text-gray-300 mx-auto mb-4" />
  <h3 className="text-lg font-medium text-gray-900 mb-2">
    No saved posts yet
  </h3>
  <p className="text-gray-600 mb-6">
    Create your first LinkedIn post to see it here
  </p>
  <button className="px-6 py-3 bg-blue-600 text-white rounded-lg">
    Create First Post
  </button>
</div>
```

## 📦 Ready-to-Use Snippets

### Modal Template
```typescript
<Dialog open={isOpen} onOpenChange={setIsOpen}>
  <DialogContent className="sm:max-w-[425px]">
    <DialogHeader>
      <DialogTitle>Edit Profile</DialogTitle>
      <DialogDescription>
        Make changes to your profile here.
      </DialogDescription>
    </DialogHeader>
    <div className="grid gap-4 py-4">
      {/* Form content */}
    </div>
    <DialogFooter>
      <Button variant="outline" onClick={() => setIsOpen(false)}>
        Cancel
      </Button>
      <Button onClick={handleSave}>Save changes</Button>
    </DialogFooter>
  </DialogContent>
</Dialog>
```

### Toast Notifications
```typescript
// Success toast
toast.success("Post created successfully!");

// Error toast
toast.error("Failed to generate content. Please try again.");

// Loading toast
const toastId = toast.loading("Generating your content...");
// Later...
toast.success("Content ready!", { id: toastId });
```

This frontend guide is now complete with all patterns, components, and guidelines extracted from your screenshots and requirements!
