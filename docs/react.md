# React Development Guidelines

## Component Structure Order

Components must follow this exact order for consistency and readability:

1. **Props destructuring** - `const {} = props` (if used) - always at the very top
2. **Refs** - all `useRef` hooks (directly after props or first if no props destructuring)
3. **Queries and external data** - `useQuery`, `useContext`, and other data-fetching hooks
4. **State** - all `useState` hooks
5. **Memoized values** - all `useMemo` hooks
6. **Effects** - `useEffect` and `useLayoutEffect` hooks
7. **Callbacks** - all `useCallback` hooks (exception: if callback is used in useEffect dependencies, it must be placed before the effect)

```typescript
// ✅ CORRECT component structure
const Component = (props: IComponentProps) => {
  const { isVisible, data, onSubmit } = props;
  
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  
  const { data: queryData } = useQuery('key', fetchData);
  const contextValue = useContext(MyContext);
  
  const [isExpanded, setIsExpanded] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  
  const filteredData = useMemo(() => {
    return data.filter(item => item.name.includes(searchQuery));
  }, [data, searchQuery]);
  
  useEffect(() => {
    if (isVisible) {
      containerRef.current?.focus();
    }
  }, [isVisible]);
  
  const handleSearch = useCallback((query: string) => {
    setSearchQuery(query);
  }, []);
  
  return <div ref={containerRef}>...</div>;
};

// ❌ WRONG - mixed order
const Component = (props: IComponentProps) => {
  const [isExpanded, setIsExpanded] = useState(false); // State before refs
  const containerRef = useRef<HTMLDivElement>(null);   // Ref after state
  const { isVisible } = props;                         // Props not at top
  
  const handleSearch = useCallback(() => {}, []);      // Callback before effect
  
  useEffect(() => {
    handleSearch(); // This creates dependency issues
  }, [handleSearch]);
  
  return <div>...</div>;
};
```

**Important Notes:**
- No empty lines between refs (they are in the same scope)
- Exception for useCallback: if a callback is used in useEffect dependencies, place it before the effect
- This order ensures proper dependency management and code readability

## Hook Best Practices

### Dependency Arrays
- Include all dependencies in useCallback/useEffect
- Fix ESLint warnings about missing dependencies
- **NEVER add refs to dependency arrays** - refs are stable and don't need to be tracked
- **NEVER add setState functions to dependency arrays** - setState functions from useState are stable and don't change

```typescript
// ❌ WRONG - Never add refs or setState to dependencies
const serviceRef = useRef<Service | null>(null);
const [data, setData] = useState<string>('');

const callback = useCallback(() => {
  serviceRef.current?.doSomething();
  setData('new value');
}, [serviceRef, setData]); // BAD: ref and setState should not be in dependencies

const memoValue = useMemo(() => {
  return serviceRef.current?.getValue();
}, [serviceRef]); // BAD: ref in dependencies

// ✅ CORRECT - Refs and setState are stable, exclude from dependencies
const callback = useCallback(() => {
  serviceRef.current?.doSomething();
  setData('new value');
}, []); // GOOD: no ref or setState in dependencies

const memoValue = useMemo(() => {
  return serviceRef.current?.getValue();
}, [otherDependency]); // GOOD: only actual dependencies
```

#### Why Refs and setState Should Not Be Dependencies
- **Refs** are **mutable objects** that maintain the same reference across renders
- **setState functions** from `useState` are guaranteed to be stable by React
- Adding refs or setState to dependencies causes unnecessary re-renders
- React guarantees both ref and setState stability across renders
- ESLint may warn, but refs and setState should be ignored in dependency arrays
- **No need to add eslint-disable comments** for ref or setState dependency warnings - these warnings should simply be ignored

#### Stable useCallback Functions
- **useCallback functions with empty dependencies `[]`** are stable and don't change between renders
- These stable callbacks should NOT be added to dependency arrays of other hooks
- Only add useCallback functions to dependencies if they have their own dependencies

```typescript
// ✅ CORRECT - Stable callbacks not in dependencies
const stableCallback = useCallback(() => {
  doSomething();
}, []); // Empty deps = stable function

const anotherCallback = useCallback(() => {
  stableCallback(); // Using stable callback
}, []); // Don't add stableCallback to deps - it's stable

useEffect(() => {
  stableCallback(); // Using stable callback
}, []); // Don't add stableCallback to deps - it's stable

// ❌ WRONG - Adding stable callbacks to dependencies
useEffect(() => {
  stableCallback();
}, [stableCallback]); // BAD: stable callback in dependencies

// ✅ CORRECT - Only add callbacks with dependencies
const callbackWithDeps = useCallback(() => {
  doSomething(data);
}, [data]); // Has dependencies = not stable

useEffect(() => {
  callbackWithDeps();
}, [callbackWithDeps]); // GOOD: callback has dependencies, so include it
```

### Custom Hook Types
```typescript
interface UseEventsReturn {
  handleUpdate: (e: any) => void;
  handleClick: (e: any) => void;
}

export const useEvents = (
  dependencies: any
): UseEventsReturn => {
  // Implementation
};
```

### Ref Typing
```typescript
const serviceRef = useRef<SlopesService | null>(null);
const animationFrameRef = useRef<number | null>(null);
const timeoutRef = useRef<NodeJS.Timeout | null>(null);
```

## Component Props and Interfaces

### Interface Parameter Order
When defining interfaces and destructuring object parameters, follow this order:
1. **Refs first** - all useRef references
2. **States and other values** - useState, props, computed values
3. **Functions last** - callbacks, event handlers, state setters

```typescript
// ✅ CORRECT order
interface IComponentProps {
  containerRef: RefObject<HTMLDivElement>;
  inputRef: RefObject<HTMLInputElement>;
  isExpanded: boolean;
  query: string;
  searchResults: ISearchResult[];
  activeIndex: number;
  onExpand: () => void;
  onInputChange: (value: string) => void;
  setActiveIndex: (index: number) => void;
}

// ✅ CORRECT destructuring order
const Component = ({ 
  containerRef, 
  inputRef,
  isExpanded, 
  query, 
  searchResults, 
  activeIndex,
  onExpand, 
  onInputChange, 
  setActiveIndex 
}) => {
  // component logic
};
```

### Component Props Typing
```typescript
interface ComponentProps {
  data: ISlopeEntry[];
  onSelect?: (slope: ISlopeEntry) => void;
  className?: string;
}

export const Component: React.FC<ComponentProps> = ({
  data,
  onSelect,
  className
}) => {
  // Implementation
};
```

### Optional vs Required Props
```typescript
interface Props {
  required: string;           // Required prop
  optional?: string;          // Optional prop
  callback?: () => void;      // Optional callback
  children: React.ReactNode;  // Required children
}
```

## Performance Optimizations

### Map Function Optimization
Always use `useCallback` for render functions in `.map()` operations to prevent unnecessary re-renders:

```typescript
// ✅ CORRECT - useCallback for map render function
const Component = ({ items, onSelect }) => {
  const renderItem = useCallback(
    (item: IItem, index: number) => (
      <ItemComponent 
        key={item.id} 
        item={item} 
        index={index}
        onSelect={onSelect}
      />
    ),
    [onSelect]
  );

  return (
    <div>
      {items.map(renderItem)}
    </div>
  );
};

// ❌ WRONG - inline function creates new reference on each render
const Component = ({ items, onSelect }) => {
  return (
    <div>
      {items.map((item, index) => (
        <ItemComponent 
          key={item.id} 
          item={item} 
          index={index}
          onSelect={onSelect}
        />
      ))}
    </div>
  );
};
```

### Minimize Re-renders

**✅ Use refs for non-rendering state:**
```typescript
const serviceRef = useRef<Service | null>(null);
const animationFrameRef = useRef<number | null>(null);
```

**✅ Stable callback references:**
```typescript
const handleEvent = useCallback((event: Event) => {
  serviceRef.current?.handleEvent(event);
}, []); // Empty deps - callback never changes
```

### Timeout and Interval Cleanup
Always clean up setTimeout/setInterval to prevent memory leaks and unexpected behavior:

```typescript
// ✅ CORRECT - useRef for timeout cleanup
const Component = () => {
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const handleDelayedAction = useCallback(() => {
    // Clear previous timeout if exists
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    
    timeoutRef.current = setTimeout(() => {
      console.log('Delayed action');
      timeoutRef.current = null;
    }, 1000);
  }, []);

  useEffect(() => {
    // Set up interval
    intervalRef.current = setInterval(() => {
      console.log('Periodic action');
    }, 5000);

    // Cleanup on unmount
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  return <button onClick={handleDelayedAction}>Start Action</button>;
};

// ❌ WRONG - no cleanup, potential memory leaks
const Component = () => {
  const handleAction = () => {
    setTimeout(() => {
      console.log('Action'); // May execute after component unmount
    }, 1000);
  };

  useEffect(() => {
    setInterval(() => {
      console.log('Periodic'); // Continues after unmount
    }, 5000);
  }, []);

  return <button onClick={handleAction}>Action</button>;
};
```

### Proper Cleanup in useEffect
```typescript
useEffect(() => {
  const service = new SomeService();
  
  return () => {
    service.cleanup(); // Always cleanup
  };
}, []);
```

## Common TypeScript Issues in React

### Missing Dependencies in useCallback
```typescript
// ❌ ESLint warning about missing dependencies
const callback = useCallback(() => {
  doSomething(externalValue);
}, []); // Missing externalValue

// ✅ Include all dependencies
const callback = useCallback(() => {
  doSomething(externalValue);
}, [externalValue]);
```

### Refs in Dependency Arrays
```typescript
// ❌ WRONG - Never add refs to dependencies
const serviceRef = useRef<Service | null>(null);

const callback = useCallback(() => {
  serviceRef.current?.doSomething();
}, [serviceRef]); // BAD: ref should not be in dependencies

// ✅ CORRECT - Refs are stable, exclude from dependencies
const callback = useCallback(() => {
  serviceRef.current?.doSomething();
}, []); // GOOD: no ref in dependencies - ignore ESLint warnings

// ✅ CORRECT - Include other dependencies, but not refs
const callback = useCallback(() => {
  serviceRef.current?.doSomething(data);
}, [data]); // GOOD: only actual dependencies - ignore ESLint warnings about refs
```

**Important:** When ESLint warns about missing ref dependencies, simply ignore these warnings. Do not add `eslint-disable` comments for ref-related dependency warnings.

## Code Review Checklist for React

- [ ] Component structure follows the correct order
- [ ] No refs in dependency arrays (useCallback/useEffect/useMemo)
- [ ] No setState functions in dependency arrays
- [ ] No stable useCallback functions (with empty deps) in dependency arrays
- [ ] useCallback used for .map() render functions
- [ ] Proper cleanup in useEffect hooks
- [ ] Props interface follows correct parameter order
- [ ] All dependencies included in hook dependency arrays
- [ ] Timeout and interval cleanup implemented
- [ ] Stable callback references used where appropriate

## Anti-Patterns to Avoid

1. **Adding refs to dependency arrays** - Refs are stable and should never be dependencies
2. **Adding setState functions to dependency arrays** - setState functions are stable
3. **Adding stable useCallback functions to dependency arrays** - Functions with empty deps are stable
4. **Inline functions in .map()** - Use useCallback for render functions
5. **Missing cleanup** - Always clean up timeouts/animations/intervals
6. **Wrong component structure order** - Follow the established hook order
7. **Missing dependencies** - Include all dependencies in hook arrays
8. **Unnecessary re-renders** - Use refs and stable callbacks appropriately
