# Overview

This is a Snake game application built with a React frontend and Express backend. The application features a classic Snake game implementation with 3D graphics capabilities using React Three Fiber, sound effects, and state management. The frontend is built with React, TypeScript, and Tailwind CSS with shadcn/ui components, while the backend uses Express with TypeScript and Drizzle ORM for database operations.

# User Preferences

Preferred communication style: Simple, everyday language.

# System Architecture

## Frontend Architecture

**Technology Stack:**
- React with TypeScript for type safety and component-based UI
- Vite as the build tool and development server for fast hot module replacement
- TailwindCSS for utility-first styling with custom design tokens
- shadcn/ui component library built on Radix UI primitives for accessible, customizable components

**State Management:**
- Zustand with subscription middleware for game state (`useGame` store)
- Zustand for audio state management (`useAudio` store)
- TanStack Query (React Query) for server state management and API caching

**3D Graphics:**
- React Three Fiber (@react-three/fiber) for 3D rendering via Three.js
- React Three Drei (@react-three/drei) for useful helpers and abstractions
- React Three Postprocessing for visual effects
- GLSL shader support via vite-plugin-glsl

**Game Architecture:**
- Canvas-based Snake game with traditional grid system (20x20 cells)
- Game phases: "ready", "playing", "ended" managed through Zustand store
- Audio system with background music and sound effects (hit, success)
- LocalStorage persistence for high scores

**Design Decisions:**
- Component-based architecture with UI components in `client/src/components/ui/`
- Custom hooks for responsive design (`useIsMobile`)
- Path aliases (`@/` for client src, `@shared/` for shared code) for cleaner imports
- Fixed viewport with no scrolling for immersive game experience

## Backend Architecture

**Technology Stack:**
- Express.js with TypeScript for the REST API server
- Node.js with ESM modules (type: "module")
- Separate development and production server entry points

**Server Structure:**
- Development server (`index-dev.ts`): Integrates Vite middleware for HMR
- Production server (`index-prod.ts`): Serves static built files
- Centralized route registration in `routes.ts` with `/api` prefix convention
- Request/response logging middleware with timing and truncation

**Storage Layer:**
- Abstract storage interface (`IStorage`) for CRUD operations
- In-memory implementation (`MemStorage`) as default storage adapter
- Storage interface designed to be swapped with database implementation
- User schema defined with username and password fields

**Build Process:**
- Client: Vite builds React app to `dist/public`
- Server: esbuild bundles server code to `dist/index.js`
- Separate dev and production npm scripts

**Design Rationale:**
- Storage abstraction allows easy migration from in-memory to database without changing API routes
- Development server uses Vite middleware to enable hot reload during development
- Production server serves pre-built static files for optimal performance
- Middleware pattern for consistent request logging and error handling

## External Dependencies

**Database:**
- PostgreSQL via Neon serverless driver (`@neondatabase/serverless`)
- Drizzle ORM for type-safe database queries and schema management
- Database URL configured via `DATABASE_URL` environment variable
- Migration files stored in `./migrations` directory
- Schema defined in `shared/schema.ts` for code sharing between client and server

**Session Management:**
- connect-pg-simple for PostgreSQL-backed Express sessions (configured but not actively used in current implementation)

**UI Component Libraries:**
- Radix UI primitives for all major components (dialogs, dropdowns, menus, etc.)
- Provides accessible, unstyled components styled with Tailwind
- Full suite of 30+ components available for rapid development

**Fonts and Assets:**
- Inter font via @fontsource for consistent typography
- Support for GLTF/GLB 3D models and audio files (MP3, OGG, WAV)

**Development Tools:**
- tsx for running TypeScript in development
- esbuild for fast production builds
- Replit-specific error overlay plugin for better DX
- PostCSS with Autoprefixer for CSS processing

**Design Trade-offs:**
- Neon serverless chosen for PostgreSQL to work in serverless/edge environments
- Drizzle ORM selected over Prisma for lighter weight and better TypeScript inference
- In-memory storage used as default to allow application to run without database setup
- Comprehensive UI component library included for rapid feature development