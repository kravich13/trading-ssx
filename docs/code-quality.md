# Code Quality Guidelines

## General Principles

### 1. User Preferences
- **No comments in code** unless explicitly requested
- **English-only comments** when needed
- **Fix TypeScript errors first** before any refactoring

### 2. Code Organization

#### Component and Function Decomposition
Break down large components and functions into smaller, reusable pieces. Build complex functionality from small, focused parts:

```typescript
// ✅ CORRECT - Small, focused components
const SearchInput = ({ value, onChange, onFocus }) => (
  <input 
    type="text" 
    value={value} 
    onChange={onChange} 
    onFocus={onFocus}
    placeholder="Search..."
  />
);

const SearchResults = ({ results, onSelect }) => (
  <div className={styles.results}>
    {results.map(result => (
      <SearchResultItem 
        key={result.id} 
        result={result} 
        onSelect={onSelect} 
      />
    ))}
  </div>
);

const SearchBar = () => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  
  return (
    <div className={styles.searchBar}>
      <SearchInput 
        value={query} 
        onChange={setQuery} 
        onFocus={handleFocus} 
      />
      <SearchResults 
        results={results} 
        onSelect={handleSelect} 
      />
    </div>
  );
};

// ❌ WRONG - Monolithic component with too many responsibilities
const SearchBar = () => {
  // 50+ lines of state management
  // 100+ lines of event handlers
  // 200+ lines of JSX with complex nested structure
  // Multiple different concerns mixed together
};
```

#### Function Decomposition
```typescript
// ✅ CORRECT - Small, pure functions
const calculateDistance = (point1: ICoordinate, point2: ICoordinate): number => {
  const dx = point1.lat - point2.lat;
  const dy = point1.lon - point2.lon;
  return Math.sqrt(dx * dx + dy * dy);
};

const findClosestSlope = (slopes: ISlopeEntry[], targetPoint: ICoordinate): ISlopeEntry | null => {
  if (!slopes.length) return null;
  
  return slopes.reduce((closest, current) => {
    const currentDistance = calculateDistance(current.center, targetPoint);
    const closestDistance = calculateDistance(closest.center, targetPoint);
    return currentDistance < closestDistance ? current : closest;
  });
};

const processUserInteraction = (event: MapEvent, slopes: ISlopeEntry[]): void => {
  const targetPoint = extractCoordinates(event);
  const closestSlope = findClosestSlope(slopes, targetPoint);
  
  if (closestSlope) {
    highlightSlope(closestSlope);
    showSlopeDetails(closestSlope);
  }
};

// ❌ WRONG - Large function doing everything
const handleMapClick = (event: MapEvent, slopes: ISlopeEntry[]): void => {
  // 100+ lines of mixed logic:
  // - coordinate extraction
  // - distance calculations
  // - slope filtering
  // - UI updates
  // - state management
  // - error handling
};
```

#### Function Parameters
**Functions with 3+ parameters must use object parameters for better readability:**

**CRITICAL RULE: Always extract inline interfaces to named interfaces**

```typescript
// ✅ CORRECT - Named interface for object parameters
interface IHandleSearchResultSelectParams {
  mapState: mapboxgl.Map;
  slope: ISlopeEntry;
  coordinates: [number, number];
  resortsAndSlopesMarkersRef: MutableRefObject<Map<string, IResortsAndSlopesMarkerState>>;
  setCenteredSlope: (slope: ISlopeEntry | null) => void;
  setClickedSlope: (slope: ISlopeEntry | null) => void;
  clearHoverSlope?: () => void;
}

const handleSearchResultSelect = ({
  mapState,
  slope,
  coordinates,
  resortsAndSlopesMarkersRef,
  setCenteredSlope,
  setClickedSlope,
  clearHoverSlope,
}: IHandleSearchResultSelectParams) => {
  // Function implementation
};

// ❌ WRONG - Inline interface definition
const handleSearchResultSelect = ({
  mapState,
  slope,
  coordinates,
}: {
  mapState: mapboxgl.Map;
  slope: ISlopeEntry;
  coordinates: [number, number];
}) => {
  // Function implementation
};

// ❌ WRONG - Too many individual parameters
const handleSearchResultSelect = (
  mapState: mapboxgl.Map,
  slope: ISlopeEntry,
  coordinates: [number, number],
  resortsAndSlopesMarkersRef: MutableRefObject<Map<string, IResortsAndSlopesMarkerState>>,
  setCenteredSlope: (slope: ISlopeEntry | null) => void,
  setClickedSlope: (slope: ISlopeEntry | null) => void,
  clearHoverSlope?: () => void
) => {
  // Function implementation
};
```

**Benefits of Named Interfaces:**
- **Reusability** - Interface can be used in multiple places
- **Better documentation** - Clear naming explains the purpose
- **Easier refactoring** - Changes in one place affect all usages
- **Type safety** - Consistent typing across the codebase

**Benefits of Decomposition:**
- **Easier testing** - Small functions are simple to unit test
- **Better reusability** - Components can be used in different contexts
- **Improved readability** - Clear separation of concerns
- **Simplified debugging** - Easier to isolate issues
- **Enhanced maintainability** - Changes affect smaller code areas

#### Code Formatting and Readability
Always add an empty line before each code block for better readability:

```typescript
// ✅ CORRECT - empty line before each logical block
const Component = () => {
  const [state, setState] = useState(false);

  const handleClick = useCallback(() => {
    setState(prev => !prev);
  }, []);

  useEffect(() => {
    console.log('State changed');
  }, [state]);

  return <button onClick={handleClick}>Toggle</button>;
};

// ❌ WRONG - no spacing, code blocks merge together
const Component = () => {
  const [state, setState] = useState(false);
  const handleClick = useCallback(() => {
    setState(prev => !prev);
  }, []);
  useEffect(() => {
    console.log('State changed');
  }, [state]);
  return <button onClick={handleClick}>Toggle</button>;
};
```

#### Service Layer Pattern
- Extract complex business logic into service classes
- Use private/public methods appropriately
- Example: `TradeService` for trading operations

```typescript
export class TradeService {
  private db: Database;
  private investors: IInvestorEntry[];
  
  public handleTrade = (trade: ITradeEntry): void => {
    // Public interface
  };
  
  private executeCalculation = (amount: number): void => {
    // Private implementation
  };
}
```

#### Performance Optimizations
- Use `requestAnimationFrame` instead of throttle/debounce for UI updates
- Implement proper cleanup in useEffect hooks
- Clear timeouts and animation frames in component unmount

```typescript
useEffect(() => {
  return () => {
    if (animationFrameId !== null) {
      cancelAnimationFrame(animationFrameId);
    }
  };
}, []);
```

### 3. Styling and Colors

#### Centralized Color Management
- **ALL colors must be stored ONLY in `Colors.module.scss`**
- No hardcoded colors anywhere in the codebase
- Use SCSS variables for reusability
- Export colors for TypeScript usage

```scss
$slope-line-color: #4285f4;
$slope-text-color: #ffffff;
$white: #fff;
$light-gray: #ddd;

:export {
  slopeLineColor: $slope-line-color;
  slopeTextColor: $slope-text-color;
  white: $white;
  lightGray: $light-gray;
}
```

#### Import Colors in Components
```typescript
import colors from '@/shared/styles/Colors.module.scss';

// Use colors from the centralized source
const styles = {
  backgroundColor: colors.white,
  borderColor: colors.lightGray,
  color: colors.primaryTextColor
};
```

#### ❌ Never Do This
```typescript
// Don't hardcode colors anywhere
const styles = {
  color: '#ffffff',        // BAD
  backgroundColor: '#fff', // BAD
  borderColor: '#ddd'      // BAD
};
```

#### Spacing Properties (Margin/Padding)
**CRITICAL RULE: Always use logical properties for margin and padding**

```scss
// ✅ CORRECT - Use logical properties
.component {
  padding-inline: 20px;     // horizontal padding (left/right)
  padding-block: 10px;      // vertical padding (top/bottom)
  margin-inline: 16px;      // horizontal margin (left/right)
  margin-block: 8px;        // vertical margin (top/bottom)
  
  // For individual sides when needed
  padding-inline-start: 12px;  // left in LTR, right in RTL
  padding-inline-end: 12px;    // right in LTR, left in RTL
  padding-block-start: 8px;    // top
  padding-block-end: 8px;      // bottom
}

// ✅ CORRECT - When you need all sides the same
.uniform-spacing {
  padding: 16px;           // OK when all sides are equal
  margin: 8px;             // OK when all sides are equal
}
```

#### ❌ Never Use Shorthand for Different Values
```scss
// ❌ WRONG - Never use shorthand with different values
.bad-component {
  padding: 10px 20px;           // BAD - unclear which is which
  margin: 8px 16px 12px;        // BAD - confusing order
  padding: 10px 20px 15px 25px; // BAD - impossible to understand
}
```

**Why Logical Properties?**
- **RTL Support**: Automatically adapts for right-to-left languages
- **Clarity**: Explicit about horizontal vs vertical spacing
- **Maintainability**: Easier to understand and modify
- **Future-proof**: Modern CSS standard

### 4. Package Management

#### Package Version Control
- **NEVER use `^` or `~` prefixes in package.json**
- Always pin exact versions for all dependencies
- This ensures consistent builds across environments

```json
// ❌ WRONG - allows automatic updates
{
  "dependencies": {
    "react": "^18.2.0",
    "next": "~14.2.3"
  }
}

// ✅ CORRECT - exact versions only
{
  "dependencies": {
    "react": "18.2.0",
    "next": "14.2.3"
  }
}
```

#### Why Exact Versions?
- Prevents unexpected breaking changes
- Ensures reproducible builds
- Avoids version conflicts between team members
- Maintains stability in production

### 5. Import Management

#### Remove Unused Imports
- Regularly clean up unused imports
- Remove unused utility functions after refactoring
- Use grep to check usage before removing exports

```bash
# Check if function is still used
grep -r "functionName" src/
```

### 6. TypeScript Best Practices

#### Strict Type Safety
- Fix TypeScript errors before proceeding with features
- Use proper typing for service classes
- Avoid `any` types

#### React Development
For React-specific guidelines including component structure, hooks, dependency arrays, and performance optimizations, see [React Development Guidelines](./react.md).


### 7. Performance Patterns


#### Animation Frame Usage
```typescript
private animationFrameId: number | null = null;

if (this.animationFrameId === null) {
  this.animationFrameId = requestAnimationFrame(() => {
    this.executeLogic();
    this.animationFrameId = null;
  });
}
```

#### Proper Cleanup
```typescript
private clearAnimationFrame(): void {
  if (this.animationFrameId !== null) {
    cancelAnimationFrame(this.animationFrameId);
    this.animationFrameId = null;
  }
}
```

## Code Review Checklist

- [ ] No unused imports or variables
- [ ] TypeScript errors resolved
- [ ] Proper cleanup in useEffect
- [ ] Service classes for complex logic
- [ ] **Functions with 3+ parameters use object parameters**
- [ ] **ALL colors moved to Colors.module.scss**
- [ ] No hardcoded colors in components/styles
- [ ] **Use logical properties for margin/padding (padding-inline/block)**
- [ ] **Package versions pinned (no ^ or ~ prefixes)**
- [ ] Performance optimizations applied
- [ ] No comments unless requested
- [ ] English-only if comments needed

## Anti-Patterns to Avoid

1. **Large useEffect hooks** - Extract logic to services
2. **Hardcoded colors ANYWHERE** - ALL colors must be in Colors.module.scss
3. **Missing cleanup** - Always clean up timeouts/animations
4. **Unused code** - Remove after refactoring
5. **setTimeout for UI updates** - Use requestAnimationFrame instead
6. **Color constants in JS/TS files** - Colors belong only in SCSS
7. **Version prefixes in package.json** - Never use ^ or ~ prefixes
8. **Functions with 3+ individual parameters** - Use object parameters instead
9. **Shorthand margin/padding with different values** - Use logical properties (padding-inline/block) instead

