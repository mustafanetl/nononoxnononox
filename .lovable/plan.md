

# Making Rzuma Worth Paying For

## The Core Problem

Right now, Rzuma generates **simulated** travel data. Users get nice-looking cards but can't actually book anything or get real prices. To charge $10/month or $50 lifetime, users need features they can't get for free elsewhere.

## Features That Create Real Value

### 1. User Authentication + Saved Trips (Database)
Users need accounts to justify a subscription. Save trips to the database so they persist across devices, not just localStorage.

- Add auth (email/password signup + login)
- Create `profiles`, `saved_trips`, and `saved_items` tables
- Users can name, save, and revisit full trip plans
- "My Trips" dashboard showing all saved plans with status (planning, booked, completed)

### 2. Real Booking Links (Affiliate Revenue)
Turn every card into a revenue opportunity by linking to real booking platforms with affiliate parameters.

- Flight cards link to Google Flights, Skyscanner, or Kayak with pre-filled search params (from, to, date)
- Hotel cards link to Booking.com or Hotels.com with destination + dates
- Activity cards link to GetYourGuide or Viator with search terms
- Add "Book Now" buttons on detail modals that open these links
- This also gives users actual utility -- they can go from planning to booking in one click

### 3. PDF Trip Export
A polished, downloadable PDF of the full trip plan that users can print or share.

- Generate a formatted PDF with flights, hotels, activities, itinerary, weather, and travel info
- Include a packing checklist based on weather data
- Add the trip timeline for multi-city routes
- Use `jspdf` + `html2canvas` or a simple HTML-to-PDF approach

### 4. Collaborative Trip Planning
Let users invite others to view or edit a trip -- critical for group/family travel.

- Share a trip via a unique link
- Invited users can see the plan and vote on activities/hotels
- Simple voting system: thumbs up/down on each item
- Requires `trip_collaborators` and `item_votes` tables

### 5. Smart Packing List Generator
Auto-generate a packing checklist based on destination, weather, duration, and occasion.

- Create a `Pack