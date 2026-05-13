# Requirements Document

## Introduction

Full site rebuild of the Jolliday AI Travel Planner application from zero. The rebuild preserves the existing UI/UX, feature set, and architecture while producing a clean, well-structured codebase. The application is a conversational AI travel planner that generates trip plans via streaming chat, displays structured travel data (flights, hotels, activities, itineraries), and supports saving, sharing, and exporting trips.

## Glossary

- **App**: The Jolliday AI Travel Planner single-page application built with React 18, TypeScript, and Vite
- **Chat_Interface**: The conversational UI where users interact with the AI to plan trips
- **Edge_Function**: A Supabase Edge Function that runs server-side logic (AI generation, payment processing, data enrichment)
- **Plan_Parser**: The client-side module that extracts structured JSON blocks from fenced code blocks in AI responses
- **Trip_Context**: The React Context that manages the user's current trip basket (selected flights, hotels, activities) and comparison items
- **Trip_Plan**: A structured AI response containing flights, hotels, activities, itinerary, weather, travel info, and places data in fenced code blocks
- **QA_Enrichment**: A server-side pass that verifies and enriches a Trip_Plan with real Google Places data (coordinates, ratings, images)
- **Streaming_Text**: The rAF-batched rendering of SSE tokens from the AI chat edge function
- **Auth_System**: The Supabase Auth integration supporting email/password, Google OAuth, and Apple OAuth
- **Subscription_System**: The Stripe-based payment infrastructure for monthly and annual plans
- **Shared_Trip**: A publicly accessible trip page identified by a unique slug
- **Saved_Trip**: A user's trip persisted to the Supabase database with status tracking
- **Landing_Page**: The marketing homepage with hero search, how-it-works, destinations mosaic, social proof, FAQ, pricing, and CTA sections
- **Trip_Detail_Page**: The magazine-style editorial view of a complete trip plan with map, timeline, gallery, and export features
- **Admin_Panel**: The role-restricted dashboard for managing users
- **Paywall_Modal**: The modal that prompts free users to subscribe when accessing premium features
- **Plan_Crafting_Map**: The animated SVG component showing a plane flying along a bezier curve during plan generation
- **Photo_Lightbox**: The full-screen image viewer with navigation for trip photos
- **Comparison_Modal**: The modal that displays side-by-side comparison of flights or hotels

## Requirements

### Requirement 1: Project Scaffolding and Configuration

**User Story:** As a developer, I want a clean project scaffold with all tooling configured, so that I can build features on a solid foundation.

#### Acceptance Criteria

1. THE App SHALL use React 18, TypeScript, and Vite with the SWC plugin as the build toolchain
2. THE App SHALL use Tailwind CSS 3 with the typography plugin and tailwindcss-animate for styling
3. THE App SHALL use shadcn/ui components built on Radix UI primitives for the design system
4. THE App SHALL use React Router DOM v6 for client-side routing
5. THE App SHALL use TanStack React Query for server state management
6. THE App SHALL use React Context (Trip_Context) for client-side trip basket state, exposing at minimum the current trip items collection and methods to add, remove, and clear items
7. THE App SHALL use Zod for runtime schema validation
8. THE App SHALL use ESLint with typescript-eslint recommended rules targeting all `.ts` and `.tsx` files, and the lint command SHALL complete with zero errors
9. THE App SHALL use Vitest with React Testing Library for unit and integration testing, and the test command SHALL execute successfully with zero failing tests
10. THE App SHALL resolve path aliases using the `@/` prefix mapped to the `src/` directory
11. WHEN a developer runs the production build command, THE App SHALL compile without TypeScript errors and produce a valid output bundle in under 120 seconds

### Requirement 2: Landing Page

**User Story:** As a visitor, I want an engaging landing page that explains the product and lets me start planning, so that I understand the value and can begin immediately.

#### Acceptance Criteria

1. THE Landing_Page SHALL render a hero section with a search input that navigates to `/chat?q={encoded_query}` when the user submits a non-empty query
2. THE Landing_Page SHALL render a "How It Works" section explaining the trip planning flow in sequential steps
3. THE Landing_Page SHALL render a destinations mosaic displaying curated destination images in a responsive grid
4. THE Landing_Page SHALL render a social proof section with user testimonials and usage statistics
5. THE Landing_Page SHALL render an FAQ section using an accordion component for expandable questions and answers
6. THE Landing_Page SHALL render a pricing section displaying subscription plan options with feature comparisons
7. THE Landing_Page SHALL render a final call-to-action section encouraging users to start planning
8. WHILE the viewport width is below 768px, THE Landing_Page SHALL display a sticky bottom CTA button that navigates to the Chat_Interface, appearing after the user scrolls past 70% of the hero section and hiding when the footer is visible
9. THE Landing_Page SHALL apply fade-in CSS animations to sections as they enter the viewport

### Requirement 3: AI Chat Interface — Core Messaging

**User Story:** As a traveler, I want to have a conversational chat with an AI travel planner, so that I can describe my trip preferences and receive personalized plans.

#### Acceptance Criteria

1. THE Chat_Interface SHALL display a message input field with a maximum length of 2000 characters and a send button, fixed at the bottom of the viewport
2. WHEN the user submits a message, THE Chat_Interface SHALL clear the input field and send the conversation history and user preferences to the rzuma-chat Edge_Function via HTTP POST
3. WHEN the rzuma-chat Edge_Function responds, THE Chat_Interface SHALL consume the SSE stream and render tokens incrementally using requestAnimationFrame batching
4. WHILE the AI is generating a response, THE Chat_Interface SHALL display a loading indicator and disable the send button to prevent duplicate submissions
5. IF the SSE stream fails or the Edge_Function returns an error, THEN THE Chat_Interface SHALL display an error message to the user and preserve the last sent message so the user can retry
6. IF the browser does not support the Web Speech API, THEN THE Chat_Interface SHALL hide the voice input button
7. WHEN the browser supports the Web Speech API, THE Chat_Interface SHALL provide a voice input button that transcribes speech to text and appends the transcript to the message input field
8. WHEN the AI response contains quick reply suggestions in a `quickreplies` fenced block, THE Chat_Interface SHALL render clickable quick reply buttons below the message
9. WHEN a quick reply button is clicked, THE Chat_Interface SHALL submit that text as the next user message

### Requirement 4: AI Chat Interface — Plan Crafting Animation

**User Story:** As a traveler, I want visual feedback while my trip plan is being generated, so that I feel engaged during the wait.

#### Acceptance Criteria

1. WHILE the AI is generating a structured Trip_Plan, THE Chat_Interface SHALL display the Plan_Crafting_Map animation and SHALL continue displaying it until generation completes or fails
2. THE Plan_Crafting_Map SHALL render an SVG plane icon that animates along a quadratic bezier curve path from an origin point to a destination point, with the plane position advancing proportionally to generation progress from 0% to 100%
3. WHILE the plan is generating, THE Chat_Interface SHALL display a progress stages pill that cycles through at least 3 labeled generation phases at an interval between 2000 and 3000 milliseconds per phase
4. WHEN the Trip_Plan generation completes, THE Chat_Interface SHALL hide the Plan_Crafting_Map within 500 milliseconds and display the structured plan cards in its place
5. IF the Trip_Plan generation fails while the Plan_Crafting_Map is displayed, THEN THE Chat_Interface SHALL hide the Plan_Crafting_Map and display an error message indicating that plan generation was unsuccessful

### Requirement 5: AI Chat Interface — Conversation Management

**User Story:** As a traveler, I want to manage multiple conversations and access my chat history, so that I can plan different trips without losing context.

#### Acceptance Criteria

1. WHEN a message is sent or received in a conversation, THE Chat_Interface SHALL persist that conversation to localStorage within 1 second, storing a unique ID, title, messages array (up to 200 messages per conversation), and a last-updated timestamp
2. THE Chat_Interface SHALL display a conversation list sidebar showing all saved conversations (up to 50 conversations) ordered by most recent last-updated timestamp, displaying the title and last-updated timestamp for each entry
3. WHEN the user clicks "New Chat", THE Chat_Interface SHALL create a new empty conversation and set it as active
4. WHEN the user selects a conversation from the sidebar, THE Chat_Interface SHALL load and display that conversation's messages
5. WHEN the user deletes a conversation, THE Chat_Interface SHALL remove it from localStorage and set the most recently updated remaining conversation as active
6. IF the user deletes the only remaining conversation, THEN THE Chat_Interface SHALL create a new empty conversation and set it as active
7. THE Chat_Interface SHALL generate conversation titles from the first 40 characters of the first user message, or display "New Conversation" as the title until the first user message is sent
8. IF localStorage is unavailable or the write fails, THEN THE Chat_Interface SHALL display an error message indicating that the conversation could not be saved and retain the conversation data in memory for the current session

### Requirement 6: Plan Parser

**User Story:** As a developer, I want a robust parser that extracts structured data from AI responses, so that the UI can render typed cards for flights, hotels, activities, and itineraries.

#### Acceptance Criteria

1. THE Plan_Parser SHALL extract fenced code blocks of types: flights, activities, hotels, itinerary, timeline, destination_enrich, travelinfo, weather, quickreplies, and places
2. THE Plan_Parser SHALL track JSON string context character-by-character so that backtick characters inside JSON string values do not prematurely close a fence
3. THE Plan_Parser SHALL require fence openings to be preceded by a newline or be at the start of the text, and followed only by whitespace or a newline before the block content begins
4. WHEN a fenced block contains incomplete JSON (during streaming), THE Plan_Parser SHALL strip trailing commas and auto-close unbalanced braces and brackets before parsing
5. THE Plan_Parser SHALL return both the parsed items array and the character ranges (start inclusive, end exclusive, encompassing the opening fence through the closing fence) of each block so callers can strip blocks from prose
6. THE Plan_Parser SHALL spread JSON arrays into the items result (each array element becomes a separate item) and push JSON objects as single items, such that re-parsing a formatted fenced-block representation of the items array produces a deeply-equal items result
7. WHEN a fenced block contains invalid JSON that cannot be repaired, THE Plan_Parser SHALL return an empty items array for that block without throwing an error
8. WHEN no closing fence is found for an opened block (streaming in progress), THE Plan_Parser SHALL treat the end of the input text as the block boundary and attempt to parse the content accumulated so far
9. IF the text after the fence type name on the opening line starts with a JSON delimiter ([ or {), THEN THE Plan_Parser SHALL treat that same-line content as the block body rather than requiring a newline separator

### Requirement 7: Trip Plan Display — Cards

**User Story:** As a traveler, I want to see my trip plan presented as visual cards for flights, hotels, and activities, so that I can quickly review and compare options.

#### Acceptance Criteria

1. WHEN the AI response contains a `flights` block with one or more entries, THE Chat_Interface SHALL render a horizontally scrollable row of FlightCard components, each displaying airline name, departure and arrival airport codes, departure and arrival times, duration, number of stops, date, and price with currency symbol
2. WHEN the AI response contains a `hotels` block with one or more entries, THE Chat_Interface SHALL render a horizontally scrollable row of HotelCard components, each displaying hotel name, star rating as icons, price per night with currency symbol, location, and a hotel image when available
3. WHEN the AI response contains an `activities` block with one or more entries, THE Chat_Interface SHALL render a horizontally scrollable row of ActivityCard components, each displaying activity name, category icon, price with currency symbol, duration, and neighborhood when available
4. WHEN the AI response contains an `itinerary` block with one or more entries, THE Chat_Interface SHALL render ItineraryCard components displaying day number, day title, and for each time slot: time, venue name, neighborhood, duration, and cost
5. WHEN the user clicks a flight card, THE Chat_Interface SHALL open a FlightDetailModal displaying destination city image, airline, date, departure and arrival times with airport codes and city names, duration, number of stops, estimated price, and a booking link
6. WHEN the user clicks a hotel card, THE Chat_Interface SHALL open a HotelDetailModal displaying hotel image, hotel name, star rating, location, description, price per night, guest rating when available, and a booking link
7. WHEN the user clicks an activity card, THE Chat_Interface SHALL open an ActivityDetailModal displaying activity photo gallery (up to 4 photos with navigation), activity name, category, description, duration, price per person, neighborhood, opening hours when available, and an option to add to trip
8. IF the AI response contains a `flights`, `hotels`, `activities`, or `itinerary` block that is empty (zero entries), THEN THE Chat_Interface SHALL not render a card row for that block

### Requirement 8: Trip Basket and Comparison

**User Story:** As a traveler, I want to add items to a trip basket and compare options side-by-side, so that I can build my ideal trip.

#### Acceptance Criteria

1. WHEN the user clicks "Add to Trip" on a flight, activity, or hotel card, THE Trip_Context SHALL add that item to the trip basket and persist it for the duration of the session
2. WHEN the user clicks "Remove from Trip" on a card already in the basket, THE Trip_Context SHALL remove that item from the trip basket
3. WHILE the trip basket contains one or more items, THE Chat_Interface SHALL display a BudgetPanel showing the total estimated cost and the count of items in the basket
4. THE Trip_Context SHALL calculate the total budget by summing all flight prices, all activity prices, and all hotel pricePerNight values multiplied by 3 nights
5. WHEN the user adds two or more items of the same type (flight or hotel) to the compare list, THE Chat_Interface SHALL enable the Comparison_Modal
6. THE Comparison_Modal SHALL display compared flights in a table with columns: Airline, Route, Duration, Stops, and Price; and compared hotels in a table with columns: Hotel Name, Star Rating, Location, and Price Per Night
7. WHEN the user clicks "Clear all" in the Comparison_Modal, THE Trip_Context SHALL remove all items from the compare list and close the modal
8. IF the user attempts to add an item to the compare list that is already present, THEN THE Trip_Context SHALL not create a duplicate entry and SHALL retain the existing item unchanged
9. IF the trip basket is empty, THEN THE Chat_Interface SHALL hide the BudgetPanel trigger button

### Requirement 9: Trip Summary Card

**User Story:** As a traveler, I want a visually compelling summary card of my completed trip plan in the chat, so that I can see the key stats at a glance and tap through to the full trip detail page.

#### Acceptance Criteria

1. WHEN the AI finishes generating a complete Trip_Plan (containing at least an itinerary or activities block), THE Chat_Interface SHALL render a TripSummaryCard component in the chat stream
2. THE TripSummaryCard SHALL display a cinematic hero image of the destination city, using the enriched Google Places photo when available, falling back to a curated stock image, and finally to a gradient placeholder if no image loads
3. THE TripSummaryCard SHALL overlay the destination name on the hero image with a letter-rise staggered animation and display a subtitle showing the number of days (e.g., "4 days crafted just for you")
4. THE TripSummaryCard SHALL display a row of 4 stat tiles overlapping the bottom of the hero image, showing: Days (calendar icon), Stops (pin icon, total itinerary slots or activity count), Stays (hotel icon, hotel count), and Flights (plane icon, flight count)
5. WHEN the trip plan includes flight data with an origin city, THE TripSummaryCard SHALL display a route recap section showing origin → destination with a dashed arc SVG and a plane icon at the midpoint
6. WHEN the trip plan includes itinerary data, THE TripSummaryCard SHALL display a day rail teaser showing up to 8 day dots connected by dashed lines and a text preview of the first 3 days' titles
7. THE TripSummaryCard SHALL display a "Open full plan" CTA button at the bottom of the card
8. WHEN the user clicks anywhere on the TripSummaryCard, THE App SHALL store the trip plan data (flights, hotels, activities, itinerary, travel info, enriched images, venue photos) in sessionStorage and navigate to `/trip/view`
9. IF sessionStorage write fails due to size limits, THEN THE App SHALL retry storing the data without enriched photos and venue photos
10. THE TripSummaryCard SHALL display a "Share" button in the top-right corner that generates a 9:16 share card image of the trip summary for social media sharing
11. THE TripSummaryCard SHALL apply entrance animations including ken-burns on the hero image, staggered rise animations on stat tiles, and a breathing shadow animation on the card container

### Requirement 10: QA Enrichment

**User Story:** As a traveler, I want my trip plan verified with real venue data, so that I can trust the recommendations are accurate.

#### Acceptance Criteria

1. WHEN the AI generates a structured Trip_Plan containing activities, hotels, or itinerary blocks, THE Chat_Interface SHALL send the plan text and destination hint to the review-trip-plan Edge_Function via HTTP POST
2. WHILE the QA enrichment is in progress, THE Chat_Interface SHALL display a "Verifying" status indicator that remains visible until the Edge_Function responds or the request fails
3. WHEN the review-trip-plan Edge_Function returns an approved enriched plan, THE Chat_Interface SHALL replace the displayed plan with the enriched version containing verified coordinates and matched venue names
4. IF the review-trip-plan Edge_Function fails, returns unapproved, or returns approved with a "skipped" flag, THEN THE Chat_Interface SHALL retain the original AI-generated plan without modification and remove the "Verifying" indicator
5. WHEN the review-trip-plan Edge_Function receives a plan, THE Edge_Function SHALL query Google Places Text Search API for each unique venue name in the hotels, activities, and itinerary blocks, matching results by token overlap between the queried name and the returned place display name
6. IF a venue cannot be matched on Google Places or resolves to a location outside the destination country, THEN THE review-trip-plan Edge_Function SHALL return unapproved with a list of up to 12 issue descriptions identifying the unverified venues
7. WHEN all venues in the plan are verified and located within the destination country, THE review-trip-plan Edge_Function SHALL patch the plan blocks with verified latitude, longitude, matched display name, and place ID, and return approved with the enriched plan text
8. WHEN the review-trip-plan Edge_Function receives a plan with an itinerary block, THE Edge_Function SHALL validate structural completeness by checking that each day contains at least 4 slots for arrival/departure days or 6 slots for full days, includes meal slots, contains no generic placeholder venue names, and has no missing day numbers in the sequence

### Requirement 11: Trip Detail Page

**User Story:** As a traveler, I want a beautiful editorial view of my complete trip, so that I can review all details in a magazine-style layout.

#### Acceptance Criteria

1. THE Trip_Detail_Page SHALL render a hero section with a destination image using a Ken Burns CSS animation that continuously cycles a zoom-and-pan effect over a duration of 15 to 20 seconds per cycle
2. THE Trip_Detail_Page SHALL render an interactive Leaflet map with markers for all hotels, activities, and points of interest, with day-based filtering controls and tooltip labels on each marker
3. THE Trip_Detail_Page SHALL render a day-by-day timeline showing the itinerary where each entry displays a time slot (in HH:MM format), venue name, and a description of up to 280 characters
4. THE Trip_Detail_Page SHALL render a photo gallery of destination images with Photo_Lightbox support for full-screen viewing, keyboard navigation (arrow keys), and swipe gestures on touch devices
5. THE Trip_Detail_Page SHALL render a packing list section displaying up to 30 checkable items relevant to the destination and weather, with a progress indicator showing checked count versus total count
6. THE Trip_Detail_Page SHALL render a currency converter widget that defaults to converting from USD to the destination currency
7. THE Trip_Detail_Page SHALL render weather information for the destination during the travel dates including daily high and low temperatures and general conditions
8. THE Trip_Detail_Page SHALL render travel information including visa requirements, local language, and timezone for the destination
9. WHEN the user clicks "Export PDF", THE Trip_Detail_Page SHALL generate a PDF document using jsPDF containing the trip destination, travel dates, day-by-day itinerary, hotel details, and packing list
10. IF PDF generation fails, THEN THE Trip_Detail_Page SHALL display an error message indicating the export could not be completed
11. WHEN the user clicks "Share", THE Trip_Detail_Page SHALL generate a shareable URL and copy it to the clipboard with a confirmation notification
12. THE Trip_Detail_Page SHALL support localized UI text in 10 languages (en, sv, es, fr, de, it, pt, nl, da, no)

### Requirement 12: Authentication

**User Story:** As a user, I want to create an account and sign in, so that I can save my trips and access them across devices.

#### Acceptance Criteria

1. WHEN a user submits the registration form with a valid email address and a password of at least 8 characters, THE Auth_System SHALL create the account and send a confirmation email
2. IF a user submits the registration form with a password shorter than 8 characters or an invalid email format, THEN THE Auth_System SHALL reject the submission and display an error message indicating the specific validation failure
3. THE Auth_System SHALL support OAuth sign-in via Google
4. THE Auth_System SHALL support OAuth sign-in via Apple
5. IF OAuth sign-in fails due to provider error or user cancellation, THEN THE Auth_System SHALL return the user to the sign-in screen and display an error message
6. WHEN a new user completes registration, THE Auth_System SHALL invoke the send-transactional-email Edge_Function with the "welcome" template within 60 seconds of account creation
7. WHEN the user requests a password reset, THE Auth_System SHALL send a reset link via Supabase Auth that expires after 60 minutes and render a ResetPassword page for the new password entry
8. THE Chat_Interface SHALL allow anonymous usage without requiring authentication
9. WHEN an authenticated user's session expires, THE Auth_System SHALL attempt silent token refresh before falling back to the anonymous key for API calls
10. THE Auth_System SHALL expose a useAuth hook providing the current user object, loading state, and signOut function

### Requirement 13: Saved Trips

**User Story:** As a registered user, I want to save my trip plans and manage them from a dashboard, so that I can revisit and organize my travel plans.

#### Acceptance Criteria

1. WHEN an authenticated user clicks "Save Trip", THE App SHALL persist the trip's title, destination, messages JSON, and a default status of "planning" to the saved_trips table in Supabase
2. THE MyTrips page SHALL display all saved trips for the authenticated user with title, destination, and status, ordered by most recently updated first
3. THE MyTrips page SHALL support trip status values of "planning", "booked", and "completed", and SHALL allow the user to manually change a trip's status
4. WHEN the user clicks "Delete" on a saved trip, THE App SHALL display a confirmation dialog, and upon confirmation SHALL remove the trip from the saved_trips table
5. WHEN the user clicks "Open" on a saved trip, THE Chat_Interface SHALL load the trip's messages into a new conversation
6. WHEN the user navigates to a shared trip link and clicks "Import", THE App SHALL save a copy of that trip to the user's saved_trips with a status of "planning"
7. IF a save, delete, or import operation fails, THEN THE App SHALL display an error notification and preserve the previous state
8. IF an unauthenticated user navigates to the MyTrips page, THEN THE App SHALL redirect them to the authentication page

### Requirement 14: Shared Trips

**User Story:** As a traveler, I want to share my trip plan with friends via a public link, so that others can view and optionally import my itinerary.

#### Acceptance Criteria

1. WHEN an authenticated user clicks "Share Trip", THE App SHALL generate a unique alphanumeric slug of 8 characters, persist the trip snapshot to the shared_trips table, and copy the public URL to the clipboard
2. THE App SHALL serve shared trips at the route `/p/:slug` using the SharedTrip page component
3. THE SharedTrip page SHALL render the trip in a read-only Trip Detail layout without requiring authentication
4. WHEN a shared trip page is loaded, THE App SHALL increment the view count for that trip in the shared_trips table
5. WHEN an authenticated user views a shared trip, THE SharedTrip page SHALL display an "Import to My Trips" button
6. IF the shared trip slug does not exist, THEN THE App SHALL display a not-found page with a navigation option to return home

### Requirement 15: Subscription System

**User Story:** As a business, I want a subscription system with Stripe integration, so that users can pay for premium features.

#### Acceptance Criteria

1. THE Subscription_System SHALL support a monthly plan at $9.99/month and an annual plan at $4.17/month (billed annually at $49.99/year)
2. WHEN the user selects a plan, THE App SHALL invoke the create-checkout Edge_Function and redirect to the Stripe Checkout URL
3. IF the create-checkout Edge_Function returns an error or does not respond within 10 seconds, THEN THE App SHALL display an error message and allow the user to retry
4. THE check-subscription Edge_Function SHALL verify the user's subscription status via Stripe API and return plan, subscription ID, expiration date, and cancellation status
5. THE useSubscription hook SHALL invoke the check-subscription Edge_Function on initial mount and poll it every 60 seconds thereafter
6. IF the check-subscription Edge_Function is unreachable, THEN THE useSubscription hook SHALL fall back to querying the local subscriptions table, treating a record as active only when status is "active" and expiration date is in the future
7. WHEN the user clicks "Manage Subscription", THE App SHALL invoke the customer-portal Edge_Function and redirect to the Stripe Customer Portal
8. WHEN a user with a "free" plan attempts to access a premium feature, THE Paywall_Modal SHALL display plan options with prices
9. THE Subscription_System SHALL offer a 3-day free trial available only once per user account
10. WHEN the user confirms cancellation, THE App SHALL display a cancellation confirmation showing the end-of-period date

### Requirement 16: User Settings

**User Story:** As a registered user, I want to manage my profile and travel preferences, so that the AI can personalize recommendations.

#### Acceptance Criteria

1. THE Settings page SHALL allow the user to edit their display name (maximum 50 characters) and avatar URL
2. THE Settings page SHALL allow the user to set their home city (maximum 100 characters)
3. THE Settings page SHALL allow the user to select exactly one travel style preference from: "budget", "mid-range", or "luxury"
4. THE Settings page SHALL allow the user to specify dietary restrictions from a predefined list (Vegetarian, Vegan, Halal, Kosher, Gluten-free, Dairy-free, Nut allergy, Pescatarian)
5. THE Settings page SHALL allow the user to record visited places with name, rating (1-5), and category, up to 50 entries
6. THE Settings page SHALL allow the user to specify liked and disliked activity categories
7. WHEN the user saves preferences, THE App SHALL persist them to the user_preferences table in Supabase and display a success confirmation
8. WHEN the user saves preferences, THE App SHALL dispatch a "jolliday-preferences-updated" custom event so the Chat_Interface loads updated preferences without page reload
9. IF the save operation fails, THEN THE App SHALL display an error message and preserve the user's unsaved input
10. IF the user has an active subscription, THEN THE Settings page SHALL display subscription management controls

### Requirement 17: Admin Panel

**User Story:** As an administrator, I want a dashboard to view and manage users, so that I can oversee the platform.

#### Acceptance Criteria

1. THE Admin_Panel SHALL be accessible only to users with the admin role as determined by the useIsAdmin hook
2. IF a non-admin user navigates to the admin route, THEN THE App SHALL redirect them to the home page
3. THE Admin_Panel SHALL display a table of registered users showing: email, display name, subscription plan, sign-up date, and last sign-in date
4. THE useIsAdmin hook SHALL query the user_roles table to determine if the current user has admin privileges
5. WHILE the useIsAdmin hook is resolving, THE Admin_Panel SHALL display a loading indicator and SHALL NOT render admin content or redirect
6. THE Admin_Panel SHALL display summary statistics including total user count and paid subscriber count

### Requirement 18: Static Pages

**User Story:** As a visitor, I want access to legal and informational pages, so that I can understand the terms of service and contact the team.

#### Acceptance Criteria

1. THE App SHALL render a FAQ page at `/faq` with expandable question-and-answer sections using an accordion component
2. THE App SHALL render a Terms of Service page at `/terms` with legal text organized into titled sections
3. THE App SHALL render a Privacy Policy page at `/privacy` with privacy text organized into titled sections
4. THE App SHALL render a Contact page at `/contact` displaying a contact form with name, email, and message fields
5. IF the user submits the contact form with any field left empty, THEN THE App SHALL display an error and SHALL NOT submit
6. WHEN the Unsubscribe page at `/unsubscribe` is loaded with a valid `token` query parameter, THE App SHALL display a confirmation prompt for the unsubscribe action
7. IF the Unsubscribe page is loaded without a token or with an invalid token, THEN THE App SHALL display an error message

### Requirement 19: Promotional Pages

**User Story:** As a marketer, I want dedicated promotional landing pages, so that I can run targeted campaigns.

#### Acceptance Criteria

1. THE App SHALL render a promotional page at `/promo` with campaign-specific animated content and a CTA linking to `/chat`
2. THE App SHALL render a promotional page at `/promox` in 9:16 vertical layout optimized for mobile
3. THE App SHALL render a promotional page at `/promoar` with `dir="rtl"` and `lang="ar"` attributes, displaying all text in Arabic
4. Each promotional page SHALL include a visible link that navigates to the Chat_Interface to begin trip planning

### Requirement 20: Routing and Navigation

**User Story:** As a user, I want consistent navigation across the application, so that I can move between features easily.

#### Acceptance Criteria

1. THE App SHALL define client-side routes for: `/` (landing), `/chat`, `/auth`, `/my-trips`, `/reset-password`, `/trip/view`, `/p/:slug`, `/settings`, `/faq`, `/terms`, `/privacy`, `/contact`, `/unsubscribe`, `/admin`, `/promo`, `/promox`, `/promoar`
2. WHEN a user navigates to a URL path that does not match any defined route, THE App SHALL render a Not Found page with a "404" heading and a link back to `/`
3. THE App SHALL wrap all routes in the following context hierarchy (outermost to innermost): ThemeProvider, QueryClientProvider, TripProvider, TooltipProvider
4. THE App SHALL provide toast notification capability via both Radix Toast and Sonner for transient user feedback

### Requirement 21: External Service Integration — Supabase

**User Story:** As a developer, I want a configured Supabase client, so that the app can authenticate users, query the database, and invoke edge functions.

#### Acceptance Criteria

1. THE App SHALL initialize a Supabase client using VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY environment variables with session persistence via localStorage and automatic token refresh enabled
2. IF either environment variable is missing, THEN THE App SHALL fail to start and display an error indicating the missing configuration
3. THE App SHALL use the Supabase client for all authentication operations (sign up, sign in, sign out, session management)
4. THE App SHALL use the Supabase client to query and mutate tables: profiles, user_preferences, saved_trips, shared_trips, subscriptions, user_roles
5. THE App SHALL use the Supabase client to invoke edge functions: rzuma-chat, review-trip-plan, enrich-destination, create-checkout, check-subscription, customer-portal, send-transactional-email
6. WHEN making authenticated API calls, THE App SHALL use the user's JWT as Bearer token; IF no session exists, THE App SHALL fall back to the VITE_SUPABASE_PUBLISHABLE_KEY without throwing

### Requirement 22: External Service Integration — Maps and Media

**User Story:** As a traveler, I want interactive maps and rich media in my trip views, so that I can visualize destinations.

#### Acceptance Criteria

1. THE App SHALL render maps using Leaflet with CartoDB tile layers supporting pan, zoom, and marker click interactions
2. THE App SHALL display map markers for hotels and activities with tooltip labels showing location name and type
3. THE App SHALL display destination hero images from a curated set of Unsplash photo URLs mapped to known city names, falling back to a generic image for unrecognized cities
4. IF a curated Unsplash image is unavailable, THEN THE App SHALL fetch the lead image from the destination's Wikipedia article via REST API
5. THE App SHALL generate outbound links to Skyscanner for flight searches and Booking.com for hotel searches, opening in new tabs
6. IF a map tile or image request fails, THEN THE App SHALL display the container without error and fall back to a placeholder

### Requirement 23: External Service Integration — Stripe Payments

**User Story:** As a developer, I want Stripe integration handled server-side, so that payment processing is secure.

#### Acceptance Criteria

1. WHEN invoked with a valid plan parameter ("monthly" or "annual"), THE create-checkout Edge_Function SHALL create a Stripe Checkout Session and return the checkout URL
2. IF the user does not have a Stripe customer record, THEN THE create-checkout Edge_Function SHALL create one before creating the session
3. THE check-subscription Edge_Function SHALL query Stripe for the user's active subscription and return plan, subscription ID, expiration date, and cancellation status
4. THE customer-portal Edge_Function SHALL create a Stripe Customer Portal session and return the portal URL
5. IF the plan parameter is missing or invalid, THEN THE create-checkout Edge_Function SHALL return HTTP 400
6. IF the Stripe API call fails, THEN THE Edge_Function SHALL return HTTP 500 with a generic error message without exposing internal details
7. IF the request lacks a valid authenticated session, THEN THE Edge_Function SHALL return HTTP 401

### Requirement 24: Database Schema

**User Story:** As a developer, I want a well-defined database schema, so that all application data is properly structured and queryable.

#### Acceptance Criteria

1. THE database SHALL contain a `profiles` table with columns: id (UUID PK), user_id (UUID unique NOT NULL references auth.users), display_name (TEXT), avatar_url (TEXT), created_at (TIMESTAMPTZ default now())
2. THE database SHALL contain a `user_preferences` table with columns: id (UUID PK), user_id (UUID unique NOT NULL), home_city (TEXT), travel_style (TEXT), dietary_restrictions (JSONB default '[]'), past_trips (JSONB default '[]'), visited_places (JSONB default '[]'), liked_categories (JSONB default '[]'), disliked_categories (JSONB default '[]'), display_name (TEXT), updated_at (TIMESTAMPTZ default now())
3. THE database SHALL contain a `saved_trips` table with columns: id (UUID PK), user_id (UUID NOT NULL), title (TEXT NOT NULL), destination (TEXT), occasion (TEXT), status (TEXT NOT NULL default 'planning'), data_json (JSONB NOT NULL default '{}'), created_at and updated_at (TIMESTAMPTZ)
4. THE database SHALL contain a `shared_trips` table with columns: id (UUID PK), slug (TEXT NOT NULL unique), owner_user_id (UUID), title (TEXT NOT NULL), destination (TEXT), data_json (JSONB NOT NULL default '{}'), view_count (INTEGER default 0), created_at (TIMESTAMPTZ)
5. THE database SHALL contain a `subscriptions` table with columns: id (UUID PK), user_id (UUID unique NOT NULL), plan (TEXT default 'free'), status (TEXT default 'active'), started_at (TIMESTAMPTZ), expires_at (TIMESTAMPTZ), created_at (TIMESTAMPTZ)
6. THE database SHALL contain a `user_roles` table with columns: id (UUID PK), user_id (UUID NOT NULL), role (app_role enum: 'admin' | 'user'), created_at (TIMESTAMPTZ), with unique constraint on (user_id, role)
7. THE database SHALL contain email tables: email_send_log, email_send_state, email_unsubscribe_tokens, suppressed_emails
8. THE database SHALL enforce Row Level Security (RLS) so users can only access their own data; shared_trips are publicly readable; email tables are service_role only
9. WHEN a new user is created in auth.users, THE database SHALL automatically insert a profiles row via trigger

### Requirement 25: UI Animations and Visual Effects

**User Story:** As a user, I want smooth animations and visual polish, so that the application feels premium and responsive.

#### Acceptance Criteria

1. WHEN a page section enters the viewport, THE App SHALL apply a fade-in animation with 300ms duration and ease-out timing
2. WHILE the Trip_Detail_Page hero image is visible, THE App SHALL apply a Ken Burns animation scaling from 1.0 to 1.08 over 18 seconds with alternating direction
3. WHEN a modal or card entrance is triggered, THE App SHALL apply a punch-in animation scaling from 1.12 to 1.0 over 1.1 seconds
4. WHILE the user hovers over an interactive card, THE App SHALL apply a transition within 200ms including scale increase and shadow elevation change
5. WHEN a card collection is displayed, THE App SHALL render a horizontally scrollable carousel using Embla Carousel supporting touch/drag gestures
6. THE Plan_Crafting_Map SHALL animate an SVG plane along a quadratic bezier curve with smooth easing, updating position based on progress 0–100
7. WHILE the Streaming_Text component is receiving tokens, THE App SHALL render each incoming word with a staggered fade-up animation (opacity 0→1, translateY 6px→0) with 0.32s duration and 18ms stagger delay

### Requirement 26: Responsive Design and Accessibility

**User Story:** As a user on any device, I want the application to be fully responsive and accessible, so that I can use it comfortably regardless of screen size or ability.

#### Acceptance Criteria

1. THE App SHALL render all content without horizontal overflow or overlapping elements on viewport widths from 320px to 2560px
2. THE App SHALL use Tailwind responsive breakpoints (sm, md, lg, xl, 2xl) for layout adaptation
3. THE App SHALL meet WCAG 2.1 Level AA color contrast requirements (minimum 4.5:1 for normal text, 3:1 for large text)
4. THE App SHALL allow all interactive elements to be reached via Tab key and activated via Enter or Space
5. THE App SHALL include ARIA labels on all interactive components and landmark regions
6. THE App SHALL use semantic HTML elements (nav, main, article, section, header, footer)
7. WHILE navigating via keyboard, THE App SHALL display a visible focus indicator with minimum 3:1 contrast ratio

### Requirement 27: Performance and Optimization

**User Story:** As a user, I want the application to load quickly and respond smoothly, so that my experience is not hindered by performance issues.

#### Acceptance Criteria

1. THE App SHALL use React.lazy and Suspense for route-level code splitting on all routes except the landing page
2. WHILE plan generation is streaming, THE App SHALL batch DOM updates using requestAnimationFrame to maintain 60fps
3. THE App SHALL use TanStack React Query with staleTime of at least 60 seconds for subscription and user data queries
4. THE App SHALL apply `loading="lazy"` to all img elements below the fold
5. THE App SHALL configure Vite production builds with tree-shaking, minification, and chunk splitting

### Requirement 28: Error Handling and Resilience

**User Story:** As a user, I want the application to handle errors gracefully, so that I am never left with a broken or blank screen.

#### Acceptance Criteria

1. IF an Edge_Function call fails, THEN THE App SHALL display a toast notification identifying which operation failed without exposing technical details
2. IF the subscription check fails, THEN THE useSubscription hook SHALL query the local subscriptions table before defaulting to "free"
3. IF the QA enrichment fails, THEN THE Chat_Interface SHALL retain the original AI-generated plan without modification
4. IF localStorage is full or unavailable, THEN THE Chat_Interface SHALL continue functioning without persisting conversations
5. THE App SHALL never display raw error messages or stack traces to the user
6. WHEN a network request fails, THE App SHALL display a retry button that re-sends the original request
7. IF a network request receives no response within 30 seconds, THEN THE App SHALL abort and display an error with retry option

### Requirement 29: Activity and Itinerary Swap

**User Story:** As a traveler, I want to swap individual activities or itinerary slots with alternatives, so that I can customize my plan without regenerating the entire trip.

#### Acceptance Criteria

1. WHEN the user requests an alternative for an activity, THE Chat_Interface SHALL replace that activity in the activities JSON block while preserving the original item ID
2. WHEN the user requests an alternative for an itinerary slot, THE Chat_Interface SHALL update the slot's venue, activity, neighborhood, duration, cost, and bookAhead fields with the new activity data while preserving time and transit values
3. WHEN a swap operation is completed, THE Chat_Interface SHALL update the conversation message content in-place so the change persists across session reloads
4. IF the alternative request fails or returns no results, THEN THE Chat_Interface SHALL display an error and leave the original activity unchanged

### Requirement 30: Destination Enrichment

**User Story:** As a traveler, I want rich destination data including photos and geographic information, so that my trip detail page is visually compelling.

#### Acceptance Criteria

1. THE enrich-destination Edge_Function SHALL accept a destination name and return photo URLs, geographic coordinates, and a text description
2. WHEN a city name is provided, THE useCityHeroImage hook SHALL resolve a hero image using priority: curated stock image → Wikipedia lead image → generic fallback
3. WHEN a destination is provided, THE useCityImages hook SHALL return up to the requested number of image URLs by invoking enrich-destination, caching results in localStorage for 7 days
4. IF the enrich-destination Edge_Function fails or returns no images, THEN THE hook SHALL retain null placeholders without displaying an error
5. IF the destination name is empty, THEN THE enrich-destination Edge_Function SHALL return an empty response without invoking external services

### Requirement 31: Email System

**User Story:** As a business, I want transactional email capabilities, so that users receive welcome emails and can manage their email preferences.

#### Acceptance Criteria

1. THE send-transactional-email Edge_Function SHALL accept a template name, recipient email, idempotency key, and template data
2. THE send-transactional-email Edge_Function SHALL use the idempotency key to prevent duplicate sends within a 24-hour window
3. WHEN an email send is attempted, THE App SHALL log the outcome to the email_send_log table including recipient, template, timestamp, and status
4. WHEN a user visits the Unsubscribe page with a valid token, THE page SHALL add the email to suppressed_emails and display a confirmation
5. THE send-transactional-email Edge_Function SHALL check suppressed_emails before sending and skip suppressed recipients
6. IF the Edge_Function receives missing or invalid parameters, THEN it SHALL reject with an error response without sending
7. IF the Unsubscribe page receives an invalid or expired token, THEN it SHALL display an error without modifying suppressed_emails

### Requirement 10: Trip Detail Page

**User Story:** As a traveler, I want a beautiful editorial view of my complete trip, so that I can review all details in a magazine-style layout.

#### Acceptance Criteria

1. THE Trip_Detail_Page SHALL render a hero section with a destination image using a Ken Burns CSS animation that continuously cycles a zoom-and-pan effect over a duration of 15 to 20 seconds per cycle
2. THE Trip_Detail_Page SHALL render an interactive Leaflet map with markers for all hotels, activities, and points of interest, with day-based filtering controls and tooltip labels on each marker
3. THE Trip_Detail_Page SHALL render a day-by-day timeline showing the itinerary where each entry displays a time slot (in HH:MM format), venue name, and a description of up to 280 characters
4. THE Trip_Detail_Page SHALL render a photo gallery of destination images with Photo_Lightbox support for full-screen viewing, keyboard navigation (arrow keys), and swipe gestures on touch devices
5. THE Trip_Detail_Page SHALL render a packing list section displaying up to 30 checkable items relevant to the destination and weather, with a progress indicator showing checked count versus total count
6. THE Trip_Detail_Page SHALL render a currency converter widget that defaults to converting from USD to the destination currency and displays a live-rate indicator when rates are fetched successfully
7. THE Trip_Detail_Page SHALL render weather information for the destination during the travel dates including daily high and low temperatures and general conditions
8. THE Trip_Detail_Page SHALL render travel information including visa requirements, local language, and timezone for the destination
9. WHEN the user clicks "Export PDF", THE Trip_Detail_Page SHALL generate a PDF document using jsPDF containing the trip destination, travel dates, day-by-day itinerary, hotel details, and packing list
10. IF PDF generation fails, THEN THE Trip_Detail_Page SHALL display an error message indicating the export could not be completed and preserve the page state without data loss
11. WHEN the user clicks "Share", THE Trip_Detail_Page SHALL generate a shareable URL that provides read-only access to the trip details and copy it to the clipboard with a confirmation notification
12. THE Trip_Detail_Page SHALL support localized UI text in 10 languages: English, Swedish, Spanish, French, German, Italian, Portuguese, Dutch, Danish, and Norwegian

### Requirement 11: Authentication

**User Story:** As a user, I want to create an account and sign in, so that I can save my trips and access them across devices.

#### Acceptance Criteria

1. WHEN a user submits the registration form with a valid email address and a password of at least 8 characters, THE Auth_System SHALL create the account and send a confirmation email to the provided address
2. IF a user submits the registration form with a password shorter than 8 characters or an invalid email format, THEN THE Auth_System SHALL reject the submission and display an error message indicating the specific validation failure
3. THE Auth_System SHALL support OAuth sign-in via Google
4. THE Auth_System SHALL support OAuth sign-in via Apple
5. IF OAuth sign-in fails due to provider error or user cancellation, THEN THE Auth_System SHALL return the user to the sign-in screen and display an error message indicating the sign-in was not completed
6. WHEN a new user completes registration by confirming their email or completing OAuth sign-in for the first time, THE Auth_System SHALL invoke the send-transactional-email Edge_Function with the "welcome" template within 60 seconds of account creation
7. WHEN the user requests a password reset, THE Auth_System SHALL send a reset link via Supabase Auth that expires after 60 minutes and render a ResetPassword page for the new password entry
8. THE Chat_Interface SHALL allow anonymous usage without requiring authentication
9. WHEN an authenticated user's session expires, THE Auth_System SHALL attempt silent token refresh within 5 seconds before falling back to the anonymous key for API calls
10. THE Auth_System SHALL expose a useAuth hook providing the current user object, loading state, and signOut function

### Requirement 12: Saved Trips

**User Story:** As a registered user, I want to save my trip plans and manage them from a dashboard, so that I can revisit and organize my travel plans.

#### Acceptance Criteria

1. WHEN an authenticated user clicks "Save Trip", THE App SHALL persist the trip's title, destination, messages JSON, and a default status of "planning" to the saved_trips table in Supabase with the user's ID
2. THE MyTrips page SHALL display all saved trips for the authenticated user with title, destination, and status, ordered by most recently updated first
3. THE MyTrips page SHALL support trip status values of "planning", "booked", and "completed", and SHALL allow the user to manually change a trip's status via a status selector
4. WHEN the user clicks "Delete" on a saved trip, THE App SHALL display a confirmation dialog, and upon user confirmation SHALL remove the trip from the saved_trips table
5. WHEN the user clicks "Open" on a saved trip, THE Chat_Interface SHALL load the trip's messages into a new conversation
6. WHEN the user navigates to a shared trip link and clicks "Import", THE App SHALL save a copy of that trip to the user's saved_trips with a status of "planning"
7. IF a save, delete, or import operation fails, THEN THE App SHALL display an error notification indicating the failed operation and preserve the previous state
8. IF an unauthenticated user navigates to the MyTrips page, THEN THE App SHALL redirect them to the authentication page

### Requirement 13: Shared Trips

**User Story:** As a traveler, I want to share my trip plan with friends via a public link, so that others can view and optionally import my itinerary.

#### Acceptance Criteria

1. WHEN an authenticated user clicks "Share Trip", THE App SHALL generate a unique alphanumeric slug of 8 characters, persist the trip snapshot to the shared_trips table, and copy the public URL to the clipboard
2. IF an unauthenticated user clicks "Share Trip", THEN THE App SHALL redirect the user to the authentication page before allowing share link creation
3. THE App SHALL serve shared trips at the route `/p/:slug` using the SharedTrip page component
4. THE SharedTrip page SHALL render the trip in a read-only Trip Detail layout without requiring authentication
5. WHEN a shared trip page is loaded, THE App SHALL increment the view count for that trip in the shared_trips table on each page load
6. WHEN an authenticated user views a shared trip, THE SharedTrip page SHALL display an "Import to My Trips" button that copies the trip data into the user's saved_trips
7. IF an unauthenticated user activates the import action, THEN THE App SHALL redirect the user to the authentication page and automatically complete the import after successful sign-in
8. IF the shared trip slug does not exist or the trip data is unavailable, THEN THE App SHALL display a not-found page indicating the link may have expired or been removed, with a navigation option to return to the home page

### Requirement 14: Subscription System

**User Story:** As a business, I want a subscription system with Stripe integration, so that users can pay for premium features.

#### Acceptance Criteria

1. THE Subscription_System SHALL support a monthly plan at $9.99/month and an annual plan at $4.17/month (billed annually at $49.99/year)
2. WHEN the user selects a plan, THE App SHALL invoke the create-checkout Edge_Function and redirect to the Stripe Checkout URL within 5 seconds of plan selection
3. IF the create-checkout Edge_Function returns an error or does not respond within 10 seconds, THEN THE App SHALL display an error message indicating that checkout could not be initiated and allow the user to retry
4. THE check-subscription Edge_Function SHALL verify the user's subscription status via Stripe API and return plan, subscription ID, expiration date, and cancellation status
5. THE useSubscription hook SHALL invoke the check-subscription Edge_Function on initial mount and poll it every 60 seconds thereafter to keep subscription state current
6. IF the check-subscription Edge_Function returns a non-2xx response or does not respond within 10 seconds, THEN THE useSubscription hook SHALL fall back to querying the local subscriptions table in Supabase, treating a record as active only when its status is "active" and its expiration date is in the future
7. WHEN the user clicks "Manage Subscription", THE App SHALL invoke the customer-portal Edge_Function and redirect to the Stripe Customer Portal
8. WHEN a user with a "free" plan attempts to access a premium feature, THE Paywall_Modal SHALL display the monthly and annual plan options with their prices and a prompt to start a free trial
9. THE Subscription_System SHALL offer a 3-day free trial that is available only once per user account, regardless of how many times the user subscribes or cancels
10. WHEN the user confirms cancellation of their subscription, THE App SHALL display a cancellation confirmation showing the end-of-period date, and the user SHALL retain premium access until that date

### Requirement 15: User Settings

**User Story:** As a registered user, I want to manage my profile and travel preferences, so that the AI can personalize recommendations.

#### Acceptance Criteria

1. THE Settings page SHALL allow the user to edit their display name (maximum 50 characters) and avatar (as a URL input field)
2. THE Settings page SHALL allow the user to set their home city (maximum 100 characters, free-text input)
3. THE Settings page SHALL allow the user to select exactly one travel style preference from the options: "budget", "mid-range", or "luxury", or leave the selection empty
4. THE Settings page SHALL allow the user to specify dietary restrictions by selecting zero or more options from a predefined list (Vegetarian, Vegan, Halal, Kosher, Gluten-free, Dairy-free, Nut allergy, Pescatarian)
5. THE Settings page SHALL allow the user to record visited places, each consisting of a name (maximum 100 characters), a rating (integer from 1 to 5), and a category (free-text, maximum 50 characters), up to a maximum of 50 visited places
6. THE Settings page SHALL allow the user to specify liked and disliked activity categories by selecting from a predefined set of category options
7. WHEN the user saves preferences, THE App SHALL persist them to the user_preferences table in Supabase and display a success confirmation message within 3 seconds
8. WHEN the user saves preferences, THE App SHALL dispatch a "jolliday-preferences-updated" custom event so the Chat_Interface loads the updated preferences without page reload
9. IF the save operation fails due to a network or database error, THEN THE App SHALL display an error message indicating the save failed and preserve the user's unsaved input in the form
10. IF the user has an active subscription, THEN THE Settings page SHALL display subscription management controls including a billing management option and a cancel subscription option

### Requirement 16: Admin Panel

**User Story:** As an administrator, I want a dashboard to view and manage users, so that I can oversee the platform.

#### Acceptance Criteria

1. THE Admin_Panel SHALL be accessible only to users with the admin role as determined by the useIsAdmin hook
2. IF a non-admin user navigates to the admin route, THEN THE App SHALL redirect them to the home page
3. THE Admin_Panel SHALL display a table of registered users showing the following fields for each user: email, display name, subscription plan, sign-up date, and last sign-in date
4. THE useIsAdmin hook SHALL query the user_roles table to determine if the current user has admin privileges
5. WHILE the useIsAdmin hook is resolving the admin status, THE Admin_Panel SHALL display a loading indicator and SHALL NOT render the admin content or redirect
6. WHEN the Admin_Panel loads user data, THE Admin_Panel SHALL display summary statistics including total user count, paid subscriber count, total trip count, emails sent count, and emails failed count
7. IF the admin data fetch returns an error, THEN THE Admin_Panel SHALL display an error message indicating the data could not be loaded

### Requirement 17: Static Pages

**User Story:** As a visitor, I want access to legal and informational pages, so that I can understand the terms of service and contact the team.

#### Acceptance Criteria

1. THE App SHALL render a FAQ page at `/faq` displaying at least 1 question-and-answer item, where each item is collapsed by default and expands to reveal the answer when the user selects it
2. THE App SHALL render a Terms of Service page at `/terms` with legal text organized into titled sections covering at minimum: acceptance of terms, description of service, user accounts, subscriptions and billing, limitation of liability, and contact information
3. THE App SHALL render a Privacy Policy page at `/privacy` with privacy text organized into titled sections covering at minimum: information collected, how data is used, data storage and security, data sharing, user rights, and contact information
4. THE App SHALL render a Contact page at `/contact` displaying a contact email address and a contact form with name (maximum 100 characters), email (maximum 255 characters), and message (maximum 1000 characters) fields
5. IF the user submits the contact form with any field left empty, THEN THE App SHALL display an error message indicating that all fields are required and SHALL NOT submit the form
6. WHEN the user submits the contact form with all fields filled, THE App SHALL display a success confirmation message and clear the form fields
7. WHEN the Unsubscribe page at `/unsubscribe` is loaded with a valid `token` query parameter, THE App SHALL display a confirmation prompt allowing the user to confirm the unsubscribe action
8. IF the Unsubscribe page is loaded without a `token` parameter or with an invalid or expired token, THEN THE App SHALL display an error message indicating the link is invalid or expired

### Requirement 18: Promotional Pages

**User Story:** As a marketer, I want dedicated promotional landing pages, so that I can run targeted campaigns.

#### Acceptance Criteria

1. THE App SHALL render a promotional page at `/promo` in landscape-oriented layout, displaying an animated scene-based showcase with intro, product demonstration, and closing scenes with a call-to-action
2. THE App SHALL render a promotional page at `/promox` in 9:16 vertical aspect ratio layout, displaying an animated scene-based showcase optimized for mobile and short-form video platforms
3. THE App SHALL render a promotional page at `/promoar` in 9:16 vertical aspect ratio layout with `dir="rtl"` and `lang="ar"` attributes, displaying all user-facing text in Arabic
4. WHEN a user reaches the final scene of any promotional page, THE App SHALL display a visible link that navigates to the Chat_Interface at `/chat` to begin trip planning
5. WHEN a promotional page is first loaded, THE App SHALL display a play button that initiates the animated sequence, and THE App SHALL NOT auto-play the sequence without user interaction
6. WHILE the animated sequence is playing, THE App SHALL display a progress indicator showing the current position within the total sequence duration

### Requirement 19: Routing and Navigation

**User Story:** As a user, I want consistent navigation across the application, so that I can move between features easily.

#### Acceptance Criteria

1. THE App SHALL define client-side routes for: `/` (landing), `/chat`, `/auth`, `/my-trips`, `/reset-password`, `/trip/view`, `/p/:slug`, `/settings`, `/faq`, `/terms`, `/privacy`, `/contact`, `/unsubscribe`, `/admin`, `/promo`, `/promox`, `/promoar`
2. WHEN a user navigates to a URL path that does not match any defined route, THE App SHALL render a Not Found page displaying a "404" heading, a message indicating the page was not found, and a link that navigates the user back to the `/` route
3. THE App SHALL wrap all routes in the following context hierarchy in this nesting order (outermost to innermost): ThemeProvider, QueryClientProvider, TripProvider, TooltipProvider
4. THE App SHALL provide toast notification capability via both Radix Toast (Toaster) and Sonner, rendered within the context hierarchy and available to all routed pages for displaying transient success, error, and informational messages

### Requirement 20: External Service Integration — Supabase

**User Story:** As a developer, I want a configured Supabase client, so that the app can authenticate users, query the database, and invoke edge functions.

#### Acceptance Criteria

1. THE App SHALL initialize a Supabase client using the environment variables VITE_SUPABASE_URL (project URL) and VITE_SUPABASE_PUBLISHABLE_KEY (anonymous key), with session persistence enabled via localStorage, automatic token refresh enabled, and persistent sessions enabled
2. IF the VITE_SUPABASE_URL or VITE_SUPABASE_PUBLISHABLE_KEY environment variable is missing or empty at initialization, THEN THE App SHALL fail to start and display an error indicating the missing configuration
3. THE App SHALL use the Supabase client for all authentication operations (sign up, sign in, sign out, session management)
4. THE App SHALL use the Supabase client to query and mutate the following tables: profiles, user_preferences, saved_trips, shared_trips, subscriptions, user_roles
5. THE App SHALL use the Supabase client to invoke edge functions: rzuma-chat, review-trip-plan, enrich-destination, create-checkout, check-subscription, customer-portal, send-transactional-email
6. WHEN making authenticated API calls, THE App SHALL retrieve the current session's JWT access token and include it as a Bearer token in the Authorization header; IF session retrieval fails or no session exists, THEN THE App SHALL fall back to using the VITE_SUPABASE_PUBLISHABLE_KEY as the Bearer token without throwing an error

### Requirement 21: External Service Integration — Maps and Media

**User Story:** As a traveler, I want interactive maps and rich media in my trip views, so that I can visualize destinations.

#### Acceptance Criteria

1. THE App SHALL render maps using Leaflet with CartoDB tile layers that support pan, zoom, and marker click interactions
2. THE App SHALL display map markers for hotels and activities, where each marker shows a tooltip on hover containing the location name and its type or associated day number
3. THE App SHALL display destination hero images sourced from a curated set of Unsplash photo URLs mapped to known city names, falling back to a deterministic generic Unsplash image for unrecognized cities
4. IF a curated Unsplash hero image is not available for the destination, THEN THE App SHALL fetch the lead image from the destination's Wikipedia article via the REST API and cache the result for the session
5. THE App SHALL generate outbound links to Skyscanner (parameterized with origin, destination, and departure date) for flight searches and to Booking.com (parameterized with hotel name and location) for hotel searches, opening each link in a new browser tab
6. IF a map tile layer or external image request fails to load, THEN THE App SHALL display the map or image container without error and fall back to the next available source or a placeholder

### Requirement 22: External Service Integration — Stripe Payments

**User Story:** As a developer, I want Stripe integration handled server-side, so that payment processing is secure.

#### Acceptance Criteria

1. WHEN invoked by an authenticated user with a valid plan parameter ("monthly" or "annual"), THE create-checkout Edge_Function SHALL create a Stripe Checkout Session for the selected plan and return the checkout session URL in the response body
2. IF the invoking user does not yet have a Stripe customer record, THEN THE create-checkout Edge_Function SHALL create a new Stripe customer associated with the user's email before creating the checkout session
3. THE check-subscription Edge_Function SHALL query Stripe for the user's active subscription and return the plan name, subscription ID, expiration date, and cancellation status
4. THE customer-portal Edge_Function SHALL create a Stripe Customer Portal session and return the portal URL in the response body
5. IF the plan parameter is missing or not one of "monthly" or "annual", THEN THE create-checkout Edge_Function SHALL return an error response with HTTP status 400 indicating the invalid input without exposing internal details
6. IF the Stripe API call fails, THEN THE Edge_Function SHALL return an error response with HTTP status 500 containing a generic error message indicating the failure reason category without exposing Stripe API keys, internal stack traces, or raw Stripe error details
7. IF the request is made without a valid authenticated user session, THEN THE Edge_Function SHALL return an error response with HTTP status 401 indicating that authentication is required

### Requirement 23: Database Schema

**User Story:** As a developer, I want a well-defined database schema, so that all application data is properly structured and queryable.

#### Acceptance Criteria

1. THE database SHALL contain a `profiles` table with columns: id (UUID, primary key), user_id (UUID, unique, NOT NULL, references auth.users), display_name (TEXT), avatar_url (TEXT), and created_at (TIMESTAMPTZ, NOT NULL, default now())
2. THE database SHALL contain a `user_preferences` table with columns: id (UUID, primary key), user_id (UUID, unique, NOT NULL, references auth.users), home_city (TEXT), travel_style (TEXT), dietary_restrictions (JSONB, default '[]'), past_trips (JSONB, default '[]'), visited_places (JSONB, default '[]'), liked_categories (JSONB, default '[]'), disliked_categories (JSONB, default '[]'), display_name (TEXT), and updated_at (TIMESTAMPTZ, default now())
3. THE database SHALL contain a `saved_trips` table with columns: id (UUID, primary key), user_id (UUID, NOT NULL, references auth.users), title (TEXT, NOT NULL), destination (TEXT), occasion (TEXT), status (TEXT, NOT NULL, default 'planning'), data_json (JSONB, NOT NULL, default '{}'), created_at (TIMESTAMPTZ, NOT NULL, default now()), and updated_at (TIMESTAMPTZ, NOT NULL, default now())
4. THE database SHALL contain a `shared_trips` table with columns: id (UUID, primary key), slug (TEXT, NOT NULL, unique), owner_user_id (UUID), title (TEXT, NOT NULL), destination (TEXT), data_json (JSONB, NOT NULL, default '{}'), view_count (INTEGER, NOT NULL, default 0), and created_at (TIMESTAMPTZ, NOT NULL, default now())
5. THE database SHALL contain a `subscriptions` table with columns: id (UUID, primary key), user_id (UUID, unique, NOT NULL, references auth.users), plan (TEXT, NOT NULL, default 'free'), status (TEXT, NOT NULL, default 'active'), started_at (TIMESTAMPTZ, NOT NULL, default now()), expires_at (TIMESTAMPTZ), and created_at (TIMESTAMPTZ, NOT NULL, default now())
6. THE database SHALL contain a `user_roles` table with columns: id (UUID, primary key), user_id (UUID, NOT NULL, references auth.users), role (app_role enum: 'admin' or 'user', NOT NULL), and created_at (TIMESTAMPTZ, NOT NULL, default now()), with a unique constraint on (user_id, role)
7. THE database SHALL contain email-related tables: email_send_log (with columns for id, message_id, recipient_email, status, and timestamps), email_send_state (single-row config with retry_after_until, batch_size, send_delay_ms, and TTL settings), email_unsubscribe_tokens (with columns for id, token unique, email, and created_at), and suppressed_emails (with columns for id, email, reason, and created_at)
8. THE database SHALL enforce Row Level Security (RLS) on all tables such that: authenticated users can only SELECT, INSERT, UPDATE, and DELETE their own rows in profiles, user_preferences, saved_trips, and subscriptions; shared_trips are publicly readable by anyone but only owners can INSERT, UPDATE, or DELETE; user_roles are readable by the owning user and by admins; and email tables are accessible only via service_role
9. WHEN a new user is created in auth.users, THE database SHALL automatically insert a row into the profiles table via a trigger, setting display_name to the user's metadata display_name or the local part of their email address

### Requirement 24: UI Animations and Visual Effects

**User Story:** As a user, I want smooth animations and visual polish, so that the application feels premium and responsive.

#### Acceptance Criteria

1. WHEN a page section enters the viewport, THE App SHALL apply a fade-in animation with a duration of 300ms using ease-out timing, transitioning opacity from 0 to 1
2. WHILE the Trip_Detail_Page hero image is visible, THE App SHALL apply a Ken Burns animation that scales from 1.0 to 1.08 with a subtle translate, cycling over 18 seconds with ease-in-out timing in alternating direction
3. WHEN a modal or card entrance is triggered, THE App SHALL apply a punch-in animation that scales from 1.12 to 1.0 with a brightness flash over 1.1 seconds using cubic-bezier(0.22, 1, 0.36, 1) easing
4. WHILE the user hovers over an interactive card, THE App SHALL apply a transition within 200ms that includes at least two of the following visual changes: scale increase, shadow elevation change, or border color change
5. WHEN a card collection is displayed, THE App SHALL render a horizontally scrollable carousel using Embla Carousel that supports touch/drag gestures and contains at least 2 visible cards at a time on viewports 768px or wider
6. THE Plan_Crafting_Map SHALL animate an SVG plane along a quadratic bezier curve path with smooth easing (cubic-bezier 0.25, 1, 0.5, 1), updating position based on a progress value between 0 and 100
7. WHILE the Streaming_Text component is receiving tokens, THE App SHALL render each incoming word with a staggered fade-up animation (opacity 0 to 1, translateY 6px to 0) with 0.32s duration per word and 18ms stagger delay between consecutive words, animating only the most recent 14 words while earlier text remains static

### Requirement 25: Responsive Design and Accessibility

**User Story:** As a user on any device, I want the application to be fully responsive and accessible, so that I can use it comfortably regardless of screen size or ability.

#### Acceptance Criteria

1. THE App SHALL render all content without horizontal overflow, overlapping elements, or truncated interactive controls on viewport widths from 320px to 2560px
2. THE App SHALL use Tailwind responsive breakpoints (sm, md, lg, xl, 2xl) to adjust layout such that navigation, content areas, and interactive elements reflow to fit the available viewport width without requiring horizontal scrolling
3. THE App SHALL meet WCAG 2.1 Level AA color contrast requirements for all text (minimum 4.5:1 ratio for normal text and 3:1 for text 18px or larger)
4. THE App SHALL allow all interactive elements to be reached via the Tab key in a logical reading order, activated via Enter or Space, and dismissed or closed via the Escape key where applicable
5. THE App SHALL include a non-empty ARIA label or accessible name on every interactive component and landmark region that describes the element's purpose or action
6. THE App SHALL use semantic HTML elements (nav, main, article, section, header, footer) for document structure
7. WHILE a user is navigating via keyboard, THE App SHALL display a visible focus indicator with a minimum contrast ratio of 3:1 against adjacent colors on the currently focused interactive element

### Requirement 26: Performance and Optimization

**User Story:** As a user, I want the application to load quickly and respond smoothly, so that my experience is not hindered by performance issues.

#### Acceptance Criteria

1. THE App SHALL use React.lazy and Suspense for route-level code splitting on all routes except the landing page, displaying a loading spinner as the fallback UI until the route chunk has loaded
2. WHILE plan generation is streaming tokens, THE App SHALL batch DOM updates using requestAnimationFrame so that frame duration does not exceed 16ms (maintaining 60fps)
3. THE App SHALL use TanStack React Query with a staleTime of at least 60 seconds for subscription status and user data queries, so that no duplicate network request is made for the same query key within the stale window
4. THE App SHALL apply the native `loading="lazy"` attribute to all img elements positioned outside the initial viewport (below the fold)
5. THE App SHALL configure Vite for production builds with tree-shaking, minification, and chunk splitting such that no individual JavaScript chunk exceeds 250 KB gzipped
6. THE App SHALL achieve a Largest Contentful Paint (LCP) of 2500ms or less and a Time to Interactive (TTI) of 3500ms or less on a simulated 4G connection for the landing page

### Requirement 27: Error Handling and Resilience

**User Story:** As a user, I want the application to handle errors gracefully, so that I am never left with a broken or blank screen.

#### Acceptance Criteria

1. IF an Edge_Function call fails, THEN THE App SHALL display a toast notification within 2 seconds that identifies which operation failed without exposing technical details
2. IF the subscription check fails, THEN THE useSubscription hook SHALL query the local "subscriptions" database table for an active record before defaulting to "free" status
3. IF the QA enrichment fails, THEN THE Chat_Interface SHALL retain and display the original AI-generated plan without modification
4. IF localStorage is full or unavailable, THEN THE Chat_Interface SHALL continue functioning without persisting conversation history and without displaying an error to the user
5. THE App SHALL never display raw error messages, stack traces, or internal identifiers to the user
6. WHEN a network request to an Edge_Function fails, THE App SHALL display a retry button adjacent to the error notification that re-sends the original request when activated
7. IF a network request receives no response within 30 seconds, THEN THE App SHALL abort the request and display an error notification with a retry option

### Requirement 28: Activity and Itinerary Swap

**User Story:** As a traveler, I want to swap individual activities or itinerary slots with alternatives, so that I can customize my plan without regenerating the entire trip.

#### Acceptance Criteria

1. WHEN the user requests an alternative for an activity, THE Chat_Interface SHALL present up to 3 alternative venues matching the same category and destination, and upon user selection, replace that activity in the activities JSON block while preserving the original item ID
2. WHEN the user requests an alternative for an itinerary slot, THE Chat_Interface SHALL update the slot's venue, activity, neighborhood, duration, cost, and bookAhead fields with the new activity data while preserving the slot's time and transitNext values
3. WHEN a swap operation is completed, THE Chat_Interface SHALL update the conversation message content in-place by rewriting the relevant JSON block within the assistant message so the change persists across session reloads
4. IF the alternative generation request fails or returns no results, THEN THE Chat_Interface SHALL display an error message indicating alternatives could not be loaded and leave the original activity unchanged

### Requirement 29: Destination Enrichment

**User Story:** As a traveler, I want rich destination data including photos and geographic information, so that my trip detail page is visually compelling.

#### Acceptance Criteria

1. THE enrich-destination Edge_Function SHALL accept a destination name and return an array of photo objects (each containing a URL and thumbnail URL), geographic coordinates (latitude and longitude), and a text description of the destination
2. WHEN a city name is provided, THE useCityHeroImage hook SHALL resolve a single hero image URL using the following priority: a hand-picked stock hero image for known cities, then a Wikipedia lead image fetched asynchronously, then a deterministic generic stock fallback
3. WHEN a destination is provided, THE useCityImages hook SHALL return up to the requested number of destination image URLs (default 3) by invoking the enrich-destination Edge_Function, and SHALL cache results in localStorage for 7 days
4. IF the enrich-destination Edge_Function invocation fails or returns no images, THEN THE useCityImages hook SHALL retain null placeholders for each requested image slot without displaying an error to the user
5. IF the destination name is empty or blank, THEN THE enrich-destination Edge_Function SHALL return an empty response without invoking external image services

### Requirement 30: Email System

**User Story:** As a business, I want transactional email capabilities, so that users receive welcome emails and can manage their email preferences.

#### Acceptance Criteria

1. THE send-transactional-email Edge_Function SHALL accept a template name (maximum 64 characters), recipient email (valid RFC 5322 format), idempotency key (maximum 128 characters), and template data (maximum 10 KB payload)
2. THE send-transactional-email Edge_Function SHALL use the idempotency key to prevent duplicate email sends within a 24-hour window, returning a success response without re-sending if a matching key is found
3. WHEN an email send is attempted, THE App SHALL log the outcome to the email_send_log table including recipient, template name, timestamp, and result status (sent, suppressed, or failed)
4. WHEN a user visits the Unsubscribe page with a valid token, THE Unsubscribe page SHALL add the associated email to the suppressed_emails table and display a confirmation message indicating the email has been unsubscribed
5. THE send-transactional-email Edge_Function SHALL check the suppressed_emails table before sending and skip suppressed recipients
6. IF the send-transactional-email Edge_Function receives a request with missing or invalid parameters, THEN THE Edge_Function SHALL reject the request with an error response indicating which parameter failed validation, without sending an email
7. IF the Unsubscribe page receives an invalid or expired token, THEN THE Unsubscribe page SHALL display a message indicating the unsubscribe link is invalid or expired, without modifying the suppressed_emails table
