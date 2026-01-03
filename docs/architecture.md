# Architecture Patterns

## Project Structure

### Feature-Driven Architecture
```
src/
├── app/                    # Next.js App Router
├── entities/              # Business entities (investor, trade, etc.)
├── features/              # Feature modules (investors-management, etc.)
├── shared/                # Shared utilities
```

### Entity Structure Pattern
```
entities/investor/
├── api/                   # Server actions
├── components/            # React components (if shared within entity)
├── types/                 # TypeScript definitions
├── lib/                   # Internal logic
└── index.ts              # Public exports
```

## Service Layer Pattern

### When to Use Services
- Complex business logic (like profit calculations)
- Stateful operations with multiple methods
- Performance-critical operations
- When logic spans multiple components

### Service Class Structure
```typescript
export class EntityService {
  // Private state
  private state: SomeState;
  private animationFrameId: number | null = null;
  
  // Constructor with dependencies
  constructor(dependencies: Dependencies) {
    this.setupDependencies(dependencies);
  }
  
  // Public interface
  public handleEvent = (event: Event): void => {
    // Public methods use arrow functions for binding
  };
  
  // Private implementation
  private executeLogic = (): void => {
    // Private methods also use arrow functions
  };
  
  // Cleanup
  public cleanup(): void {
    this.clearResources();
  }
}
```

### Hook Integration
```typescript
export const useEntityEvents = (dependencies: Dependencies) => {
  const serviceRef = useRef<EntityService | null>(null);
  
  useEffect(() => {
    serviceRef.current = new EntityService(dependencies);
    
    return () => {
      serviceRef.current?.cleanup();
      serviceRef.current = null;
    };
  }, [dependencies]);
  
  const handleEvent = useCallback((event: Event) => {
    serviceRef.current?.handleEvent(event);
  }, []);
  
  return { handleEvent };
};
```

## Performance Architecture

### Animation Frame Pattern
- Use `requestAnimationFrame` for UI updates
- Avoid setTimeout/setInterval for frequent operations
- Implement proper cancellation

### Memory Management
- Always cleanup in useEffect return
- Clear animation frames and timeouts
- Remove event listeners

### State Management
- Use refs for values that don't trigger re-renders
- Service classes for complex state
- Context for global state

## Styling Architecture

### Centralized Color System
**CRITICAL RULE: ALL colors must be defined ONLY in `Colors.module.scss`**

```scss
// Colors.module.scss - SINGLE SOURCE OF TRUTH for all colors
$slope-line-color: #4285f4;
$slope-text-color: #ffffff;
$white: #fff;
$light-gray: #ddd;
$error-color: #e63946;

:export {
  slopeLineColor: $slope-line-color;
  slopeTextColor: $slope-text-color;
  white: $white;
  lightGray: $light-gray;
  errorColor: $error-color;
}
```

### Component Styles
```scss
// Component.module.scss
@import 'shared/styles/Colors.module.scss';

.component {
  color: $slope-text-color;
  background-color: $white;
  border-color: $light-gray;
}
```

### TypeScript Color Usage
```typescript
import colors from '@/shared/styles/Colors.module.scss';

// CORRECT: Import from centralized source
const chartConfig = {
  lineColor: colors.primaryLineColor,
  textColor: colors.primaryTextColor
};

// WRONG: Never hardcode colors
const badConfig = {
  lineColor: '#4285f4',  // ❌ NEVER DO THIS
  textColor: '#ffffff'   // ❌ NEVER DO THIS
};
```

## Import/Export Patterns

### Barrel Exports
```typescript
// entities/investor/index.ts
export * from './ui';
export * from './api';
export { DEFAULT_RISK } from './consts';
```

### Utility Organization
```typescript
// utils/index.ts
export { specificUtility } from './specific-utils';
export { anotherUtility } from './other-utils';

// Don't export everything - be selective
```

## Error Handling Patterns

### Service Error Handling
```typescript
private executeLogic = (): void => {
  try {
    // Complex logic
  } catch (error) {
    console.warn('Operation failed', { context, error });
    // Graceful degradation
  }
};
```

### Component Error Boundaries
- Use React Error Boundaries for component-level errors
- Implement fallback UI for critical failures

## Testing Architecture

### Service Testing
- Test service classes independently
- Mock external dependencies
- Test cleanup methods

### Component Testing
- Test component behavior, not implementation
- Mock service dependencies
- Test error states

## Migration Patterns

### Refactoring to Services
1. Identify complex logic in hooks/components
2. Extract to service class
3. Update hook to use service
4. Remove unused utilities
5. Update imports/exports

### Performance Migrations
1. Identify performance bottlenecks
2. Replace setTimeout with requestAnimationFrame
3. Add proper cleanup
4. Test performance improvements
