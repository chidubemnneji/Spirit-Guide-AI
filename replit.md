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
- **Key Entities**: Users, UserPersonas (onboarding responses + assigned persona), Conversations, Messages, RecommendationCards

### Persona System (Legacy)
The application assigns users one of 8 primary persona types based on onboarding responses:
- seeker_in_void, doubter_in_crisis, isolated_wanderer, guilt_ridden_striver
- overwhelmed_survivor, hungry_beginner, momentum_breaker, comparison_captive

Each persona has defined characteristics (tone, language, practices, focus areas) that shape AI responses.

### GRACE Persona System v2.0
Located in `shared/gracePersona.ts` and `server/services/gracePersonaSystem.ts`:

**5 Archetypes** (mapped from legacy personas):
- `wounded_seeker`: Processing spiritual pain, needs safety-first, non-pressuring support
- `eager_builder`: Ready to grow, wants practical steps and guidance
- `curious_explorer`: Open but cautious, values intellectual honesty
- `returning_prodigal`: Coming back after leaving, needs shame-free welcome
- `struggling_saint`: Long-time believer in difficulty, needs honest companionship

**4 Trust Levels** with behavior modifiers:
- `new` (0-25): Minimal suggestions, pure empathy
- `warming` (26-50): 1 suggestion per response, gentle invitations
- `established` (51-75): 2 suggestions, direct but kind
- `deep` (76-100): Full directness, pattern observations

**3 Interaction Modes**:
- `support`: Listen and validate only
- `formation`: Gentle growth invitations
- `learning`: Scripture study and teaching

**Shame Detection** (7 types):
- identity, performance, comparison, belonging, past, doubt, spiritual
- Detects shame patterns in messages and provides reframes

**Database Fields** (JSONB in user_personas):
- graceArchetype, graceTrust, graceMode, graceEvolution
- graceScores, graceSensitivity, graceSafetyProfile, graceTradition

### Feeling-Based Scripture Service
Located in `server/services/feelingScriptureService.ts`:

**6 Supported Feelings**:
- anxious, sad, stressed, joyful, hopeful, confused

**API Endpoints**:
- `POST /api/scripture/feeling` - Get scriptures by feeling with optional user context
- `GET /api/scripture/feeling?feeling=anxious&count=3` - Simple scripture lookup
- `POST /api/scripture/detect-feeling` - Auto-detect feeling from message text

**Features**:
- Verified Bible verses with fallback data
- User context boosting for personalization
- Weighted random selection for variety

### AI Intelligence Services (World-Class Features)

Located in `server/services/`:

1. **Pastoral Voice Service** (`pastoralVoice.ts`)
   - Voice guidelines based on Tim Keller, Richard Rohr, Eugene Peterson styles
   - Persona-specific voice adjustments
   - Emotional state adjustments
   - Relationship stage adjustments

2. **Emotional Intelligence Service** (`emotionalIntelligence.ts`)
   - Detects emotional state (struggling, peaceful, hopeful, overwhelmed, guilty, angry, confused, lonely)
   - Returns intensity (1-10), urgency (low/medium/high/crisis), needs, and tone recommendations
   - Builds emotional modifiers for AI prompts

3. **Crisis Detection Service** (`crisisDetection.ts`)
   - Safety-first detection of crisis indicators
   - Crisis protocols with immediate resources (988 Lifeline, Crisis Text Line)
   - Levels: none, concern, moderate, high, immediate
   - Logs crisis alerts for review

4. **Memory Extraction Service** (`memoryExtractor.ts`)
   - Extracts topics, memorable moments, and themes from conversations
   - Formats memory context for AI prompts to enable continuity

5. **Recommendation Engine Service** (`recommendationEngine.ts`)
   - Generates personalized spiritual practice recommendations
   - Creates 3 practice cards per Phase 4+ message (contemplative, active, reflective)
   - AI-powered with fallback recommendations when unavailable
   - Card data: practiceType, title, description, duration, instructions, iconEmoji

### Interactive Recommendation Cards (Phase 4+)
- **Trigger**: Automatically generated for messages after the user's 4th turn (recommendation phase)
- **Card Types**: Tappable practice suggestions (breath prayer, scripture pause, contemplative walk, etc.)
- **User Interactions**: Click to expand, mark complete, rate helpfulness (1-5 stars)
- **Tracking**: Clicks, completions, and ratings stored for personalization

### Conversation Phases (Pastoral Progression)
- **Phase 1 (Acknowledgment)**: Pure validation, no advice
- **Phase 2 (Consolation)**: Biblical comfort, one verse/story
- **Phase 3 (Reflection)**: Gentle questions, space for exploration
- **Phase 4+ (Recommendation)**: Personalized practices, Bible verses

### Key Design Patterns
- **Progressive Disclosure**: 4-phase onboarding with branching Phase 2 based on primary struggle selection
- **Persona-Driven AI**: System prompts dynamically built from user persona for personalized responses
- **Pastoral Phase Progression**: Conversations follow acknowledgment → consolation → reflection → recommendation phases
- **Safety-First AI**: Crisis detection runs on every message before generating responses
- **Crisis Short-Circuit**: For HIGH/IMMEDIATE crisis levels, returns predefined safety response with 988/Crisis Text Line resources without relying on AI
- **Graceful Fallback**: If AI credentials unavailable, provides phase-appropriate templated responses (not an error)
- **Emotional Intelligence**: AI adapts tone and response length based on detected emotional state
- **Environment Validation**: Server logs clear warning at startup if AI credentials missing
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