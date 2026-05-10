# Requirements Document

## Introduction

Redesign the Jolliday homepage to replace the current dark, heavy aesthetic with a clean, light, professional design inspired by modern AI travel platforms like Layla.ai. The goal is to create a bright, trustworthy, and visually appealing landing page that communicates professionalism and clarity while maintaining all existing functionality (search, navigation, social proof, FAQ, CTA sections).

## Glossary

- **Homepage**: The Index page rendered at the root route (`/`) of the Jolliday application, comprising the header, hero section, and all landing page sections through the footer.
- **Hero_Section**: The full-viewport introductory area at the top of the Homepage containing the headline, subheadline, search input, and background visual.
- **Color_Scheme**: The set of CSS custom properties (HSL values) defined in `index.css` that control background, foreground, border, card, muted, and accent colors across the application.
- **Navigation_Header**: The fixed top navigation bar containing the Jolliday logo, sign-in link, and primary CTA button.
- **Section_Component**: Any of the discrete content blocks on the Homepage (HowItWorks, DestinationsMosaic, WhyJolliday, SocialProof, ProductPreview, HomeFAQ, FinalCTA).
- **Light_Theme**: A color scheme using white or near-white backgrounds, dark text, and subtle neutral borders to create a clean, airy appearance.
- **Search_Bar**: The rounded input field with submit button in the Hero_Section where users type their travel destination.

## Requirements

### Requirement 1: Light Color Scheme

**User Story:** As a visitor, I want the homepage to use a light, clean color palette, so that the page feels modern, professional, and easy to read.

#### Acceptance Criteria

1. THE Color_Scheme SHALL use a white or near-white value (HSL lightness above 98%, saturation at or below 5%) for the `--background` CSS variable.
2. THE Color_Scheme SHALL use a dark value (HSL lightness below 10%) for the `--foreground` CSS variable.
3. THE Color_Scheme SHALL use a light neutral value (HSL lightness above 95%, saturation at or below 5%) for the `--card` CSS variable.
4. THE Color_Scheme SHALL use a light neutral value (HSL lightness above 92%, saturation at or below 5%) for the `--muted` CSS variable.
5. THE Color_Scheme SHALL use a subtle border color (HSL lightness between 85% and 95%) for the `--border` CSS variable.
6. WHEN the Homepage loads, THE Color_Scheme SHALL apply the Light_Theme by default, regardless of the operating system's color scheme preference.
7. THE Color_Scheme SHALL maintain a minimum WCAG AA contrast ratio of 4.5:1 between the `--foreground` value and the `--background` value.

### Requirement 2: Hero Section Redesign

**User Story:** As a visitor, I want the hero section to be bright and uncluttered, so that I immediately understand what Jolliday does and feel invited to use it.

#### Acceptance Criteria

1. THE Hero_Section SHALL use a solid light background (lightness value of 95% or higher in HSL) or a linear gradient where all color stops have a lightness value of 90% or higher, instead of a full-bleed photographic background image.
2. THE Hero_Section SHALL display the headline text in dark color against the light background with a minimum contrast ratio of 7:1 as defined by WCAG 2.1 AA guidelines.
3. THE Hero_Section SHALL remove the dark overlay (`bg-black/50`) that currently covers the background image.
4. THE Search_Bar SHALL use a white background with a border of at least 1px solid with a contrast ratio of at least 3:1 against the section background, and a box-shadow with a vertical offset between 1px and 4px and an opacity no greater than 15%, to stand out against the section background.
5. THE Hero_Section SHALL include vertical padding of minimum 120px top and 80px bottom on viewports 768px and wider, and minimum 64px top and 48px bottom on viewports below 768px.
6. WHEN a visitor enters text into the search input and submits the form, THE Hero_Section SHALL navigate to `/chat` with the entered text passed as the `q` query parameter (URL-encoded).
7. THE Hero_Section SHALL display descriptive body text (subheadline) with a minimum contrast ratio of 4.5:1 against the section background.

### Requirement 3: Navigation Header Styling

**User Story:** As a visitor, I want the navigation to be clearly visible and professional, so that I can easily find sign-in and start-planning actions.

#### Acceptance Criteria

1. WHEN the page is scrolled more than 50px from the top, THE Navigation_Header SHALL display a white or light semi-transparent background (opacity of at least 80%) with a 1px bottom border using the `--border` color.
2. WHEN the page scroll position is at the top (0–50px), THE Navigation_Header SHALL display a transparent background with no bottom border.
3. THE Navigation_Header SHALL display the Jolliday logo and text with a minimum contrast ratio of 4.5:1 against the current header background in both scrolled and non-scrolled states.
4. THE Navigation_Header SHALL style the primary CTA button ("Start Planning") with the accent color or a high-contrast fill, and the secondary action ("Sign in") with text-only styling, so that the two actions are visually distinct from each other.
5. THE Navigation_Header SHALL remain fixed at the top of the viewport with a z-index that keeps it above all page content during scrolling.
6. WHEN the viewport width is less than 640px, THE Navigation_Header SHALL display the "Sign in" action as an icon-only button to conserve horizontal space.

### Requirement 4: Section Backgrounds and Spacing

**User Story:** As a visitor, I want each homepage section to feel spacious and visually distinct, so that I can scan the page content without feeling overwhelmed.

#### Acceptance Criteria

1. EACH Section_Component SHALL use a background color with a lightness value of 98% or above (in HSL) and a saturation of 5% or below.
2. WHILE the viewport width is 768px or greater, EACH Section_Component SHALL maintain vertical padding of at least 80px (top and bottom).
3. WHILE the viewport width is less than 768px, EACH Section_Component SHALL maintain vertical padding of at least 48px (top and bottom).
4. WHERE a Section_Component uses an alternate background for visual rhythm, THE Section_Component SHALL use a background color with an HSL lightness between 96% and 99% rather than a dark shade (lightness below 50%).
5. THE FinalCTA section SHALL use a background color with an HSL lightness of 90% or above, or a linear gradient where all color stops have an HSL lightness of 90% or above, instead of the current inverted dark (`bg-foreground`) style.
6. WHEN a visitor scrolls between adjacent Section_Components, THE page SHALL render a visible distinction between sections through either a background color change (minimum 2% lightness difference) or a 1px border separator.

### Requirement 5: Typography and Text Contrast

**User Story:** As a visitor, I want all text on the homepage to be easy to read, so that I can quickly understand the value proposition.

#### Acceptance Criteria

1. THE Homepage SHALL render the background using an HSL lightness value of 98% or higher (achromatic or near-achromatic, saturation ≤ 2%).
2. THE Homepage SHALL display all heading text (h1–h6, rendered in Plus Jakarta Sans) with an HSL lightness value of 15% or lower, achieving a contrast ratio of at least 7:1 against the background.
3. THE Homepage SHALL display all body and descriptive text (paragraphs, labels, captions rendered in Inter) with an HSL lightness value between 25% and 40%, achieving a contrast ratio of at least 4.5:1 against the background.
4. THE Homepage SHALL use the existing font families (Inter for body, Plus Jakarta Sans for headings) without change.
5. WHEN body text is rendered at a font size below 16px, THE Homepage SHALL ensure that text maintains a contrast ratio of at least 4.5:1 against the background (WCAG AA for normal text).

### Requirement 6: Card and Component Styling

**User Story:** As a visitor, I want cards and UI elements to look polished and modern, so that the page feels high-quality and trustworthy.

#### Acceptance Criteria

1. EACH card element (testimonials, feature cards, destination tiles) SHALL use a white background (HSL lightness 95% or above) with a 1px solid border of color hsl(0, 0%, 85%) or equivalent light gray (lightness between 82% and 88%).
2. EACH card element SHALL include a box shadow of 0px 1px 3px 0px rgba(0, 0, 0, 0.06), 0px 1px 2px -1px rgba(0, 0, 0, 0.03) to create depth without heaviness.
3. THE DestinationsMosaic tiles SHALL retain their photographic backgrounds with a gradient overlay using `from-black/50` (50% opacity black at the bottom) transitioning via `via-black/10` to transparent at the top, replacing the current `from-black/70` value.
4. EACH card element SHALL use a border-radius of 1rem (16px) to maintain consistent rounded corners across all card types.

### Requirement 7: Accent Color Update

**User Story:** As a visitor, I want the accent color to feel fresh and professional, so that interactive elements are clearly identifiable without being garish.

#### Acceptance Criteria

1. THE Color_Scheme SHALL use a single HSL value for the `--primary` CSS variable with hue between 200 and 270 (blue through violet), saturation between 50% and 80%, and lightness between 40% and 55%, achieving a contrast ratio of at least 4.5:1 against a white (#FFFFFF) background as measured by WCAG 2.1 contrast formula.
2. THE primary CTA buttons SHALL use the `--primary` color as background with white (`0 0% 100%`) text, achieving a contrast ratio of at least 4.5:1 between the text and the button background.
3. THE Search_Bar submit button SHALL use the `--primary` color as its background fill with white text, matching the same color treatment as primary CTA buttons.
4. WHEN the `--primary` CSS variable is updated, THE Color_Scheme SHALL also update `--accent` and `--ring` variables to the same HSL value to maintain visual consistency across focus states and highlighted elements.

### Requirement 8: Responsive Design Preservation

**User Story:** As a mobile user, I want the redesigned homepage to work correctly on all screen sizes, so that I have a good experience regardless of device.

#### Acceptance Criteria

1. THE Homepage SHALL render without horizontal overflow and without overlapping elements at each of the defined breakpoints: 640px (sm), 768px (md), 1024px (lg), and 1200px (xl).
2. WHEN viewed on screens narrower than 768px, THE MobileStickyCTA SHALL remain visible as a fixed bottom bar after the user scrolls past 70% of the viewport height, SHALL use Light_Theme design tokens for background, text, and border colors, and SHALL not overlap page content or the footer.
3. WHEN viewed on screens narrower than 768px, THE Hero_Section SHALL apply vertical padding no less than 50% of the desktop padding values (top padding at least 72px, bottom padding at least 48px) and SHALL display heading, subheading, and search input without text truncation or element overlap.
4. IF the viewport width is 320px or narrower, THEN THE Homepage SHALL remain scrollable, all interactive elements SHALL have a minimum tap target size of 44×44px, and no text SHALL overflow its container.

### Requirement 9: Remove Dark Mode Default

**User Story:** As a visitor, I want the site to load in light mode by default, so that the first impression is clean and bright.

#### Acceptance Criteria

1. THE application SHALL set `defaultTheme` to `"light"` in the ThemeProvider configuration.
2. WHEN the application loads for a visitor with no previously stored theme preference, THE application SHALL render without the `.dark` class on the root HTML element.
3. THE `:root` CSS variables SHALL define light theme values where `--background` has a lightness of 95% or higher and `--foreground` has a lightness of 10% or lower.
4. THE `.dark` class CSS variables SHALL retain dark theme values where `--background` has a lightness of 10% or lower and `--foreground` has a lightness of 90% or higher.
5. WHEN a visitor toggles to dark mode using the theme toggle control, THE application SHALL apply the `.dark` class to the root HTML element and display the dark theme variables.

### Requirement 10: Build and Render Verification

**User Story:** As a developer, I want the redesigned homepage to compile and render without errors, so that the changes are production-ready.

#### Acceptance Criteria

1. WHEN the project is built using `npm run build`, THE build process SHALL complete with exit code 0 and produce no TypeScript type errors, no compilation errors, and no ESLint errors.
2. WHEN the Homepage is loaded in a browser and each Section_Component is scrolled into view, THE browser console SHALL display zero errors originating from any file within the `src/components/landing/` directory or `src/components/HeroSection.tsx`.
3. THE Homepage SHALL render all Section_Components in the following top-to-bottom DOM order: HeroSection, HowItWorks, DestinationsMosaic, WhyJolliday, SocialProof, HomeFAQ, FinalCTA.
4. WHEN the Homepage is loaded in a browser, THE page SHALL reach an interactive state within 5 seconds on a standard broadband connection, with all seven Section_Components visible in the DOM without requiring JavaScript error recovery or fallback UI.
