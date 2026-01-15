# AI Spiritual Companion - Design Guidelines

## Design Approach

**Selected Approach:** Reference-Based with Wellness/Mindfulness Inspiration

Drawing from: Calm, Headspace (wellness warmth), combined with Linear's clarity and WhatsApp's conversational simplicity. This app requires emotional resonance while maintaining crystal-clear usability during vulnerable moments.

**Core Principles:**
- Gentle presence, not overwhelming design
- Progressive disclosure that builds trust
- Conversational warmth without sacrificing professionalism
- Clarity in every interaction—users are often seeking guidance in difficult moments

---

## Typography

**Font Families (Google Fonts):**
- Primary: 'Inter' - Clean, readable, modern for UI elements and body text
- Accent: 'Crimson Pro' - Serif warmth for headings and emotional moments

**Hierarchy:**
- Hero/Phase Headings: text-3xl to text-4xl, font-semibold, Crimson Pro
- Question Text: text-xl to text-2xl, font-medium, Inter
- Body/Descriptions: text-base to text-lg, regular weight, Inter
- Button Labels: text-base, font-semibold, Inter
- Chat Messages: text-base, regular weight, Inter
- Metadata/Hints: text-sm, light weight, Inter

---

## Layout System

**Spacing Primitives:** Tailwind units of 3, 4, 6, 8, 12, 16
- Component padding: p-6 or p-8
- Section spacing: space-y-6 or space-y-8
- Tight groupings: space-y-3 or space-y-4
- Generous breathing room: py-12 or py-16 between major sections

**Containers:**
- Onboarding flows: max-w-2xl mx-auto (centered, focused)
- Chat interface: max-w-4xl mx-auto
- Form inputs: w-full within containers
- Progress indicators: fixed top positioning, w-full

---

## Component Library

### Onboarding Components

**Progress Bar:**
- Fixed to top of viewport
- Subtle gradient fill showing completion
- Phase indicators (1-4) with current phase highlighted
- Height: h-2, with smooth transitions

**Option Cards (Phase 1 & throughout):**
- Large clickable cards with generous padding (p-6)
- Emoji/icon on left (text-4xl or text-5xl)
- Text aligned left
- Border: rounded-xl with 2px border
- Selected state: gentle glow effect, subtle background shift
- Hover: minimal lift (shadow-md)

**Multi-Step Forms (Phases 2-4):**
- Question header with serif font, prominent sizing
- Helper text in smaller, muted style below questions
- Step indicators showing current position within phase
- Back button (subtle, top-left) and primary Continue button (bottom, full-width)

**Input Elements:**
- Checkboxes/Radio buttons: Custom styled with smooth animations
- Text inputs (if needed): Rounded (rounded-lg), comfortable padding (p-4)
- All interactive elements: Clear focus states with accessibility-compliant contrast

### Chat Interface Components

**Message Bubbles:**
- User messages: Aligned right, distinct styling
- AI messages: Aligned left with subtle avatar/indicator
- Rounded corners (rounded-2xl on message side, rounded-md on opposite)
- Comfortable padding (px-4 py-3)
- Max-width: max-w-md to max-w-lg for readability
- Timestamp: Small text below bubble, muted

**Input Box:**
- Fixed to bottom of viewport
- Text area that expands with content (max 4-5 lines)
- Send button integrated on right side
- Border: subtle top border separating from chat history
- Padding: p-4 for comfortable typing area

**Chat History:**
- Scrollable container with smooth scrolling
- Messages grouped with spacing (space-y-4)
- Loading indicator: Three subtle pulsing dots when AI is typing
- Empty state: Welcoming message with suggested conversation starters

### Navigation & Layout

**Header:**
- Clean, minimal design
- Logo/app name on left
- User menu/settings icon on right
- Optional: Subtle spiritual symbol or mark as brand element
- Height: h-16, fixed positioning during chat

**Footer (if needed):**
- Minimal presence
- Support links, privacy policy
- Small spiritual affirmation or verse

---

## Images

**Hero/Welcome Screen (before onboarding):**
- Large, calming hero image: Soft-focus nature scene (sunrise, peaceful water, open sky)
- Image treatment: Slight overlay for text readability
- Text overlaid: App name, tagline, "Begin Your Journey" CTA
- Button on image: Backdrop blur (backdrop-blur-md), semi-transparent background

**Throughout Onboarding:**
- No images during question flows - maintain focus
- Possible: Subtle background texture or gradient

**Chat Interface:**
- AI avatar: Simple, abstract spiritual symbol or gentle geometric icon
- No distracting imagery in main chat area

**Image Descriptions:**
1. Hero: "Serene sunrise over calm water with soft golden light, representing hope and new beginnings"
2. AI Avatar: "Minimalist dove or light ray symbol in soft tones"

---

## Interaction Patterns

**Transitions:**
- Page/phase transitions: Gentle fade with slight upward slide (300ms ease)
- Button interactions: Subtle scale (0.98) on press
- Progress bar: Smooth width animation (500ms ease-out)
- Message appearance: Gentle fade-up entrance

**Feedback:**
- Selection confirmation: Immediate visual response with subtle haptic feel
- Form validation: Inline, gentle messaging
- Loading states: Calm, pulsing indicators (never aggressive spinners)
- Error states: Compassionate messaging, constructive guidance

**Navigation Flow:**
- Linear progression through onboarding (no skipping)
- Ability to go back one step
- Clear visual indication of current position
- Completion celebration: Gentle success state before transitioning to chat

---

## Accessibility

- WCAG AA contrast ratios minimum
- All interactive elements keyboard navigable
- Focus states: Visible outline with sufficient contrast
- Screen reader friendly labels on all inputs
- Proper heading hierarchy (h1, h2, h3)
- Touch targets: Minimum 44x44px for mobile
- Consistent form field implementations throughout