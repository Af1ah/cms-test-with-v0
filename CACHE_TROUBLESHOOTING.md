# Cache Issues Troubleshooting Guide

## Common Next.js Cache Issues

The webpack cache error you encountered is common in Next.js development, especially on Windows. Here's how to resolve it:

### 🔧 **Quick Fixes (in order of preference)**

#### 1. Use Built-in Scripts
\`\`\`bash
# Clean cache and restart dev server
pnpm run dev:clean

# Or just clean cache
pnpm run clean
\`\`\`

#### 2. Manual Cache Clearing
\`\`\`bash
# Stop the dev server (Ctrl+C)
# Then run:
pnpm run clean && pnpm run dev
\`\`\`

#### 3. Full Reset (if issues persist)
\`\`\`bash
# Complete reset including node_modules
pnpm run reset
\`\`\`

### 🐛 **Common Webpack Cache Errors**

- `ENOENT: no such file or directory, rename '...pack.gz_' -> '...pack.gz'`
- `Failed to resolve the "fs" module from "..."`
- `Cannot read properties of undefined (reading 'get')`

### 🎯 **Root Causes**

1. **File System Locks**: Antivirus software or file indexing
2. **Multiple Node Processes**: Multiple dev servers running
3. **Permissions**: Windows file permissions issues
4. **Disk Space**: Insufficient disk space for cache files

### 💡 **Prevention Tips**

1. **Single Dev Server**: Always stop the current server before starting a new one
2. **Regular Cleaning**: Run `pnpm run clean` weekly
3. **Antivirus Exclusion**: Add project folder to antivirus exclusions
4. **Disk Space**: Keep at least 1GB free space for cache

### 🚨 **Emergency Commands**

If all else fails:
\`\`\`bash
# Force kill all Node processes
taskkill /f /im node.exe

# Manual cache removal
Remove-Item -Recurse -Force .next -ErrorAction SilentlyContinue

# Restart development
pnpm run dev
\`\`\`

### 📁 **Cache Locations**
- `.next/` - Next.js build cache
- `node_modules/.cache/` - Package cache
- `%TEMP%/next-*` - Temporary files (Windows)

Keep this guide handy for future development! 🚀
