# Soulguide - AI Spiritual Companion

## Overview

Soulguide is a personalized AI spiritual companion application that guides users through a multi-phase onboarding flow to understand their spiritual journey, then delivers tailored AI-powered conversations based on 8 distinct persona types. The app focuses on emotional resonance and clarity, helping users grow in faith through personalized guidance.

The application features:
- A 4-phase onboarding flow that assesses user struggles, depth of experience, behavioral patterns, and transformation goals
- Dynamic persona assignment based on user responses (e.g., "seeker_in_void", "doubter_in_crisis", "isolated_wanderer")
- AI chat powered by Anthropic Claude with persona-specific system prompts
- Dark/light theme support with a wellness-inspired design aesthetic

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React with TypeScript, using Vite as the build tool
- **Routing**: Wouter for lightweight client-side routing
- **State Management**: React Context for onboarding state and theme management
- **Data Fetching**: TanStack Query (React Query) for server state management
- **Styling**: Tailwind CSS with custom CSS variables for theming, shadcn/ui component library
- **Design System**: Warm wellness aesthetic with Inter (UI) and Crimson Pro (headings) fonts

### Backend Architecture
- **Runtime**: Node.js with Express
- **API Design**: RESTful endpoints under `/api/` prefix
- **AI Integration**: Anthropic Claude API for conversational AI responses
- **Build Process**: esbuild for server bundling, Vite for client bundling

### Data Layer
- **ORM**: Drizzle ORM with PostgreSQL dialect
- **Schema Location**: `shared/schema.ts` - shared between client and server
- **Storage Pattern**: Repository pattern with `IStorage` interface allowing for in-memory or database implementations
- **Key Entities**: Users, UserPersonas (onboarding responses + assigned persona), Conversations, Messages

### Persona System
The application assigns users one of 8 primary persona types based on onboarding responses:
- seeker_in_void, doubter_in_crisis, isolated_wanderer, guilt_ridden_striver
- overwhelmed_survivor, hungry_beginner, momentum_breaker, comparison_captive

Each persona has defined characteristics (tone, language, practices, focus areas) that shape AI responses.

### Key Design Patterns
- **Progressive Disclosure**: 4-phase onboarding with branching Phase 2 based on primary struggle selection
- **Persona-Driven AI**: System prompts dynamically built from user persona for personalized responses
- **Shared Types**: Zod schemas in `shared/schema.ts` ensure type consistency across client/server

## External Dependencies

### AI Services
- **Anthropic Claude API**: Primary AI provider for chat responses, configured via `AI_INTEGRATIONS_ANTHROPIC_API_KEY` and `AI_INTEGRATIONS_ANTHROPIC_BASE_URL` environment variables

### Database
- **PostgreSQL**: Primary database, connection via `DATABASE_URL` environment variable
- **Drizzle Kit**: Database migration management (`npm run db:push`)

### UI Component Libraries
- **shadcn/ui**: Comprehensive component library built on Radix UI primitives
- **Radix UI**: Accessible primitive components (dialog, dropdown, tabs, etc.)
- **Lucide React**: Icon library

### Development Tools
- **Replit Plugins**: Runtime error overlay, cartographer, and dev banner for Replit environment
- **TypeScript**: Full type coverage across client, server, and shared code