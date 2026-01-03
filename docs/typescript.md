# TypeScript Standards

## General Principles

### 1. Fix TypeScript Errors First
- Always resolve TypeScript errors before refactoring
- Use `yarn tsc` to check for type errors
- Don't ignore type errors with `@ts-ignore` unless absolutely necessary

### 2. Strict Type Safety
- Avoid `any` types
- Use proper interfaces and types
- Leverage TypeScript's inference when appropriate

### 3. React TypeScript Guidelines
For React-specific TypeScript patterns including hooks, components, and props typing, see [React Development Guidelines](./react.md).

## Service Class Typing

### Proper Service Interface
```typescript
export class TradeService {
  private db: Database;
  private investors: IInvestorEntry[];
  private animationFrameId: number | null = null;
  
  constructor(
    db: Database,
    investors: IInvestorEntry[],
    setUpdated: (updated: boolean) => void
  ) {
    // Constructor typing
  }
  
  public handleUpdate = (e: any): void => {
    // Proper event typing
  };
  
  private executeLogic = (amount: number): void => {
    // Private method typing
  };
}
```

### Generic Service Pattern
```typescript
interface ServiceDependencies<T> {
  data: T[];
  callback: (item: T | null) => void;
}

export class GenericService<T extends BaseEntity> {
  private data: T[];
  
  constructor(dependencies: ServiceDependencies<T>) {
    this.data = dependencies.data;
  }
}
```


## API and Data Types

### API Response Types
```typescript
interface ApiResponse<T> {
  data: T;
  status: 'success' | 'error';
  message?: string;
}

interface SlopeApiResponse extends ApiResponse<ISlopeEntry[]> {
  metadata: {
    total: number;
    page: number;
  };
}
```

### Entity Types
```typescript
interface IInvestorEntry {
  id: number;
  name: string;
  capital: number;
  deposit: number;
}

enum ETradeStatus {
  OPEN = 'open',
  CLOSED = 'closed'
}
```

## Utility Function Typing

### Pure Function Types
```typescript
type ProfitCalculator = (
  trades: ITradeEntry[],
  totalCapital: number
) => {
  totalProfit: number;
  accuracy: number;
} | null;

export const calculateMetrics: ProfitCalculator = (trades, totalCapital) => {
  // Implementation
};
```

### Generic Utilities
```typescript
type Mapper<T, U> = (item: T) => U;
type Filter<T> = (item: T) => boolean;

export const processData = <T, U>(
  data: T[],
  mapper: Mapper<T, U>,
  filter?: Filter<T>
): U[] => {
  const filtered = filter ? data.filter(filter) : data;
  return filtered.map(mapper);
};
```

## Event Handling Types

### Mapbox Event Types
```typescript
type MouseEventHandler = (e: mapboxgl.MapMouseEvent) => void;
type ClickEventHandler = (e: mapboxgl.MapMouseEvent & mapboxgl.EventData) => void;

interface EventHandlers {
  onMouseMove: MouseEventHandler;
  onClick: ClickEventHandler;
}
```

### Custom Event Types
```typescript
interface CustomSlopeEvent {
  type: 'slope-hover' | 'slope-click';
  slope: ISlopeEntry;
  coordinates: mapboxgl.LngLat;
}

type SlopeEventHandler = (event: CustomSlopeEvent) => void;
```

## Error Handling Types

### Error Types
```typescript
interface ServiceError {
  code: string;
  message: string;
  context?: Record<string, unknown>;
}

type ErrorHandler = (error: ServiceError) => void;

class SlopeCalculationError extends Error {
  constructor(
    message: string,
    public readonly slopeId: number,
    public readonly context: Record<string, unknown>
  ) {
    super(message);
    this.name = 'SlopeCalculationError';
  }
}
```

## Configuration Types

### Service Configuration
```typescript
interface ServiceConfig {
  throttleDelay?: number;
  thresholdDistance?: number;
  enableLogging?: boolean;
}

const defaultConfig: Required<ServiceConfig> = {
  throttleDelay: 200,
  thresholdDistance: 50,
  enableLogging: false
};
```

### Color Import Types
```typescript
// CORRECT: Import colors from centralized SCSS
import colors from '<eco>/shared/styles/Colors.module.scss';

interface MapboxConfig {
  lineColor: string;
  textColor: string;
  borderColor: string;
}

const mapboxConfig: MapboxConfig = {
  lineColor: colors.slopeLineColor,
  textColor: colors.slopeTextColor,
  borderColor: colors.slopeBorderColor,
};

// Type for color keys
type ColorKey = keyof typeof colors;
```

## Best Practices

### 1. Type Guards
```typescript
const isInvestorEntry = (obj: unknown): obj is IInvestorEntry => {
  return (
    typeof obj === 'object' &&
    obj !== null &&
    'id' in obj &&
    'name' in obj
  );
};
```

### 2. Discriminated Unions
```typescript
interface LoadingState {
  status: 'loading';
}

interface SuccessState {
  status: 'success';
  data: ISlopeEntry[];
}

interface ErrorState {
  status: 'error';
  error: string;
}

type DataState = LoadingState | SuccessState | ErrorState;
```

### 3. Utility Types
```typescript
// Pick specific properties
type SlopePreview = Pick<ISlopeEntry, 'id' | 'name' | 'difficulty'>;

// Make properties optional
type PartialSlope = Partial<ISlopeEntry>;

// Exclude properties
type SlopeWithoutCoordinates = Omit<ISlopeEntry, 'coordinates' | 'polygon'>;
```

### 4. Conditional Types
```typescript
type ApiResult<T, E = string> = T extends string 
  ? { success: false; error: E }
  : { success: true; data: T };
```

## Common TypeScript Issues

### 1. Null/Undefined Checks
```typescript
// ❌ Potential runtime error
const result = data.map(item => item.name);

// ✅ Proper null checking
const result = data?.map(item => item.name) ?? [];
```

### 2. Type Assertions vs Type Guards
```typescript
// ❌ Unsafe type assertion
const slope = data as ISlopeEntry;

// ✅ Safe type guard
if (isSlopeEntry(data)) {
  const slope = data; // TypeScript knows this is ISlopeEntry
}
```