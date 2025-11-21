# Phase 1, Step 1: Project Scaffolding

**Duration**: 1-2 days
**Prerequisite**: None (first step)

## Overview

This step initializes the Vite + React + TypeScript project, installs all core dependencies, and sets up the foundational project structure with proper configuration for development tools.

## Goals

- Create a new Vite React TypeScript project
- Install all required dependencies (Ant Design, Zustand, dnd-kit, Supabase, etc.)
- Configure ESLint, Prettier, and TypeScript
- Set up TailwindCSS (supplementary to Ant Design)
- Create the base project structure
- Verify the development environment works

---

## Step 1.1: Initialize Vite Project

```bash
# Navigate to your projects directory
cd ~/projects  # or wherever you keep your projects

# Create new Vite project with React + TypeScript template
npm create vite@latest dothething -- --template react-ts

# Navigate into the project
cd dothething
```

**Expected Output**: A new directory `dothething` with Vite's React-TypeScript template.

---

## Step 1.2: Install Core Dependencies

### UI & State Management

```bash
# Ant Design and icons
npm install antd @ant-design/icons

# Drag and drop
npm install @dnd-kit/core @dnd-kit/sortable @dnd-kit/utilities

# State management
npm install zustand

# Routing
npm install react-router-dom

# Date utilities
npm install date-fns

# Animations
npm install framer-motion

# Supabase client
npm install @supabase/supabase-js
```

### Development Dependencies

```bash
# TailwindCSS
npm install -D tailwindcss postcss autoprefixer

# ESLint and Prettier
npm install -D eslint prettier eslint-config-prettier eslint-plugin-react eslint-plugin-react-hooks @typescript-eslint/eslint-plugin @typescript-eslint/parser

# Vitest for testing
npm install -D vitest @vitest/ui jsdom @testing-library/react @testing-library/jest-dom @testing-library/user-event

# Type definitions
npm install -D @types/node
```

**Verify Installation**: Check `package.json` to ensure all dependencies are listed.

---

## Step 1.3: Configure TailwindCSS

```bash
# Initialize TailwindCSS
npx tailwindcss init -p
```

**Update `tailwind.config.js`**:

```javascript
/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {},
  },
  plugins: [],
  // Important: Use prefix to avoid conflicts with Ant Design
  corePlugins: {
    preflight: false, // Disable Tailwind's base styles to avoid conflicts with Ant Design
  },
}
```

**Create `src/index.css`** (replace existing content):

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

/* Any custom global styles go here */
```

---

## Step 1.4: Configure TypeScript

**Update `tsconfig.json`**:

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "useDefineForClassFields": true,
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "skipLibCheck": true,

    /* Bundler mode */
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true,
    "jsx": "react-jsx",

    /* Linting */
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noFallthroughCasesInSwitch": true,

    /* Path aliases */
    "baseUrl": ".",
    "paths": {
      "@/*": ["./src/*"],
      "@/components/*": ["./src/components/*"],
      "@/stores/*": ["./src/stores/*"],
      "@/types/*": ["./src/types/*"],
      "@/lib/*": ["./src/lib/*"],
      "@/hooks/*": ["./src/hooks/*"]
    }
  },
  "include": ["src"],
  "references": [{ "path": "./tsconfig.node.json" }]
}
```

**Update `vite.config.ts`** to support path aliases:

```typescript
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@/components': path.resolve(__dirname, './src/components'),
      '@/stores': path.resolve(__dirname, './src/stores'),
      '@/types': path.resolve(__dirname, './src/types'),
      '@/lib': path.resolve(__dirname, './src/lib'),
      '@/hooks': path.resolve(__dirname, './src/hooks'),
    },
  },
})
```

---

## Step 1.5: Configure ESLint

**Create `.eslintrc.cjs`**:

```javascript
module.exports = {
  root: true,
  env: { browser: true, es2020: true },
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended',
    'plugin:react-hooks/recommended',
    'plugin:react/recommended',
    'plugin:react/jsx-runtime',
    'prettier',
  ],
  ignorePatterns: ['dist', '.eslintrc.cjs'],
  parser: '@typescript-eslint/parser',
  plugins: ['react-refresh', '@typescript-eslint', 'react'],
  rules: {
    'react-refresh/only-export-components': [
      'warn',
      { allowConstantExport: true },
    ],
    '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
    'react/react-in-jsx-scope': 'off',
  },
  settings: {
    react: {
      version: 'detect',
    },
  },
}
```

---

## Step 1.6: Configure Prettier

**Create `.prettierrc`**:

```json
{
  "semi": false,
  "singleQuote": true,
  "trailingComma": "es5",
  "tabWidth": 2,
  "printWidth": 100,
  "arrowParens": "avoid"
}
```

**Create `.prettierignore`**:

```
dist
node_modules
coverage
*.lock
package-lock.json
```

---

## Step 1.7: Create Project Structure

Create the following directories and files:

```bash
# Create directory structure
mkdir -p src/components
mkdir -p src/stores
mkdir -p src/types
mkdir -p src/lib
mkdir -p src/hooks
mkdir -p src/pages
mkdir -p src/assets

# Create placeholder files to preserve directory structure
touch src/components/.gitkeep
touch src/stores/.gitkeep
touch src/types/.gitkeep
touch src/lib/.gitkeep
touch src/hooks/.gitkeep
touch src/pages/.gitkeep
```

**Final Structure**:

```
dothething/
├── node_modules/
├── public/
├── src/
│   ├── assets/
│   ├── components/
│   │   └── .gitkeep
│   ├── hooks/
│   │   └── .gitkeep
│   ├── lib/
│   │   └── .gitkeep
│   ├── pages/
│   │   └── .gitkeep
│   ├── stores/
│   │   └── .gitkeep
│   ├── types/
│   │   └── .gitkeep
│   ├── App.tsx
│   ├── index.css
│   ├── main.tsx
│   └── vite-env.d.ts
├── .eslintrc.cjs
├── .gitignore
├── .prettierrc
├── .prettierignore
├── index.html
├── package.json
├── tailwind.config.js
├── tsconfig.json
├── tsconfig.node.json
└── vite.config.ts
```

---

## Step 1.8: Set Up Environment Variables

**Create `.env.local`** (for local development):

```bash
# Supabase Configuration (will be filled in Step 2)
VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=

# App Configuration
VITE_APP_NAME=DoTheThing
```

**Update `.gitignore`** to include:

```
# Environment variables
.env
.env.local
.env.*.local
```

---

## Step 1.9: Update package.json Scripts

**Add these scripts to `package.json`**:

```json
{
  "scripts": {
    "dev": "vite",
    "build": "tsc && vite build",
    "lint": "eslint . --ext ts,tsx --report-unused-disable-directives --max-warnings 0",
    "lint:fix": "eslint . --ext ts,tsx --fix",
    "format": "prettier --write \"src/**/*.{ts,tsx,css}\"",
    "preview": "vite preview",
    "test": "vitest",
    "test:ui": "vitest --ui"
  }
}
```

---

## Step 1.10: Create Basic App Shell

**Update `src/main.tsx`**:

```typescript
import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
)
```

**Update `src/App.tsx`**:

```typescript
import { ConfigProvider, theme } from 'antd'

function App() {
  return (
    <ConfigProvider
      theme={{
        algorithm: theme.defaultAlgorithm,
        token: {
          colorPrimary: '#3B82F6', // Blue-500 from Tailwind
          borderRadius: 8,
          fontSize: 14,
        },
      }}
    >
      <div className="min-h-screen bg-gray-50">
        <div className="container mx-auto p-8">
          <h1 className="text-3xl font-bold text-gray-900">DoTheThing</h1>
          <p className="mt-2 text-gray-600">
            Task management application - Project setup complete!
          </p>
        </div>
      </div>
    </ConfigProvider>
  )
}

export default App
```

---

## Step 1.11: Verify Setup

### Test Development Server

```bash
npm run dev
```

**Expected**:
- Dev server starts on `http://localhost:5173`
- Browser shows "DoTheThing" heading with the message
- No console errors
- Ant Design styles are applied

### Test Linting

```bash
npm run lint
```

**Expected**: No errors (warnings are okay for now)

### Test Formatting

```bash
npm run format
```

**Expected**: All files formatted according to Prettier rules

### Test Build

```bash
npm run build
```

**Expected**: Build succeeds, creates `dist/` directory

---

## Step 1.12: Create Git Repository

```bash
# Initialize git (if not already done)
git init

# Add all files
git add .

# Create initial commit
git commit -m "Initial project setup with Vite, React, TypeScript, Ant Design"
```

---

## Verification Checklist

Before proceeding to Step 2, verify:

- [ ] `npm run dev` starts without errors
- [ ] Browser displays the app at `http://localhost:5173`
- [ ] Ant Design ConfigProvider is working (blue primary color visible)
- [ ] TailwindCSS utilities work (padding, margins visible)
- [ ] TypeScript compilation has no errors
- [ ] ESLint runs without errors
- [ ] Prettier formats code correctly
- [ ] All dependencies are installed in `package.json`
- [ ] Project structure matches the plan
- [ ] `.env.local` file exists (even if empty)
- [ ] Git repository is initialized

---

## Troubleshooting

### Issue: `Cannot find module '@/*'`

**Solution**: Restart your TypeScript server in VS Code:
- Press `Cmd/Ctrl + Shift + P`
- Type "TypeScript: Restart TS Server"
- Select and run

### Issue: TailwindCSS classes not working

**Solution**:
1. Verify `tailwind.config.js` `content` array includes your files
2. Verify `src/index.css` imports Tailwind directives
3. Restart dev server

### Issue: Ant Design styles not applying

**Solution**:
1. Verify `antd` is imported in a component
2. Check ConfigProvider wraps your app
3. Clear browser cache and restart dev server

---

## Next Steps

Once all verification checks pass, proceed to:
- **[Step 2: Supabase Setup](./step-2-supabase-setup.md)**

This will set up the backend database, authentication, and Row Level Security policies.

---

## Summary

You've successfully:
- ✅ Created a Vite + React + TypeScript project
- ✅ Installed all core dependencies (Ant Design, Zustand, dnd-kit, Supabase, etc.)
- ✅ Configured ESLint, Prettier, and TypeScript with strict mode
- ✅ Set up TailwindCSS (configured to work alongside Ant Design)
- ✅ Created the base project structure with path aliases
- ✅ Verified the development environment works
- ✅ Initialized Git repository

The foundation is ready for database setup and authentication implementation.
