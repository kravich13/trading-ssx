# Performance Guidelines

## Animation and UI Updates

### Use requestAnimationFrame for UI Updates

**❌ Avoid:**
```typescript
// Throttle with setTimeout - not optimal for UI
const throttleTimeout = setTimeout(() => {
  updateUI();
}, 20);
```

**✅ Prefer:**
```typescript
// requestAnimationFrame - synced with display refresh
private animationFrameId: number | null = null;

if (this.animationFrameId === null) {
  this.animationFrameId = requestAnimationFrame(() => {
    this.updateUI();
    this.animationFrameId = null;
  });
}
```

## Memory Management

### Always Cleanup Resources

**✅ Proper Cleanup:**
```typescript
useEffect(() => {
  const service = new SomeService();
  
  return () => {
    service.cleanup(); // Always cleanup
  };
}, []);

// In service class
public cleanup(): void {
  if (this.animationFrameId !== null) {
    cancelAnimationFrame(this.animationFrameId);
    this.animationFrameId = null;
  }
}
```

## Data and List Optimization

### Chunked Loading for Large Datasets
When rendering thousands of records (like trade logs), use chunked loading to prevent UI freeze.

```typescript
const CHUNK_SIZE = 500;

const loadChunks = async (data: any[]) => {
  const totalChunks = Math.ceil(data.length / CHUNK_SIZE);
  
  for (let i = 0; i < totalChunks; i++) {
    const chunkData = data.slice(0, (i + 1) * CHUNK_SIZE);
    updateDisplay(chunkData);
    await new Promise((resolve) => requestAnimationFrame(resolve));
  }
};
```

**Benefits:**
- Prevents FPS drop
- Browser has time to render between chunks
- Progressive loading
- Can be cancelled if component unmounts

