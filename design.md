---
name: Trendyol Seller Analytics
colors:
  surface: '#f9f9f9'
  surface-dim: '#dadada'
  surface-bright: '#f9f9f9'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f3f3f3'
  surface-container: '#eeeeee'
  surface-container-high: '#e8e8e8'
  surface-container-highest: '#e2e2e2'
  on-surface: '#1a1c1c'
  on-surface-variant: '#574236'
  inverse-surface: '#2f3131'
  inverse-on-surface: '#f1f1f1'
  outline: '#8b7264'
  outline-variant: '#dec1b1'
  surface-tint: '#984700'
  primary: '#984700'
  on-primary: '#ffffff'
  primary-container: '#f27a1a'
  on-primary-container: '#562500'
  inverse-primary: '#ffb68a'
  secondary: '#545f73'
  on-secondary: '#ffffff'
  secondary-container: '#d5e0f8'
  on-secondary-container: '#586377'
  tertiary: '#00677f'
  on-tertiary: '#ffffff'
  tertiary-container: '#00a9cf'
  on-tertiary-container: '#003847'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#ffdbc8'
  primary-fixed-dim: '#ffb68a'
  on-primary-fixed: '#321300'
  on-primary-fixed-variant: '#743500'
  secondary-fixed: '#d8e3fb'
  secondary-fixed-dim: '#bcc7de'
  on-secondary-fixed: '#111c2d'
  on-secondary-fixed-variant: '#3c475a'
  tertiary-fixed: '#b7eaff'
  tertiary-fixed-dim: '#4cd6ff'
  on-tertiary-fixed: '#001f28'
  on-tertiary-fixed-variant: '#004e60'
  background: '#f9f9f9'
  on-background: '#1a1c1c'
  surface-variant: '#e2e2e2'
typography:
  display-lg:
    fontFamily: Inter
    fontSize: 32px
    fontWeight: '700'
    lineHeight: 40px
    letterSpacing: -0.02em
  headline-md:
    fontFamily: Inter
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 32px
    letterSpacing: -0.01em
  title-sm:
    fontFamily: Inter
    fontSize: 18px
    fontWeight: '600'
    lineHeight: 24px
  body-md:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 20px
  body-sm:
    fontFamily: Inter
    fontSize: 13px
    fontWeight: '400'
    lineHeight: 18px
  label-caps:
    fontFamily: Inter
    fontSize: 11px
    fontWeight: '700'
    lineHeight: 16px
    letterSpacing: 0.05em
  data-tabular:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '500'
    lineHeight: 20px
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  base: 4px
  xs: 8px
  sm: 12px
  md: 16px
  lg: 24px
  xl: 32px
  gutter: 24px
  margin-page: 40px
---

## Brand & Style

The design system is engineered for high-performance Trendyol sellers, prioritizing clarity, professional authority, and rapid data synthesis. It adopts a **Corporate / Modern** aesthetic that leans heavily into a "Premium SaaS" feel, moving away from the industrial clutter of traditional ERP systems.

The visual narrative is built on the concept of "Actionable Precision." By utilizing a high-contrast relationship between deep architectural blues and the iconic brand orange, the interface guides the user's eye toward growth opportunities and critical alerts. Soft linear gradients are applied to primary containers to provide a sense of depth and quality without sacrificing the flat, modern efficiency required for data-heavy environments. The result is a workspace that feels sophisticated, trustworthy, and energizing.

## Colors

The color strategy uses a structured hierarchy to manage cognitive load. 

- **Primary Architecture:** Deep blues (#1E293B) and cool greys form the structural skeleton (sidebar, navigation, and headers), providing a grounded, professional foundation.
- **Brand Accents:** The signature orange (#F27A1A) is used as a high-intent signal. It is reserved exclusively for primary Call-to-Actions (CTAs), active states, and critical brand touchpoints.
- **Data Visualization:** A vibrant secondary palette—featuring Teal (#00D1FF), Violet (#7C3AED), and Soft Orange (#FF7F5D)—is used for charts to ensure clear differentiation between data sets.
- **Backgrounds:** A clean neutral base (#F9F9F9) keeps the workspace feeling airy and expansive, allowing white cards to pop with subtle dimension.

## Typography

The design system utilizes **Inter** for its entire typographic engine due to its exceptional legibility in data-dense environments and its neutral, systematic character.

- **Data Optimization:** For numerical values and tables, the system defaults to tabular figures (`tnum`) to ensure columns of numbers align perfectly for easy scanning.
- **Hierarchy:** We use a strict weight contrast. Headlines are semi-bold to bold to anchor sections, while body text remains regular for long-form readability.
- **Labels:** Micro-copy and secondary metadata utilize uppercase labels with slight letter spacing to create a clear visual distinction from interactive data points.

## Layout & Spacing

This design system employs a **Fluid Grid** model built on an 8px rhythmic scale. The layout is structured around a 12-column system that allows for flexible dashboard configurations.

- **Containers:** Main dashboard content is housed in a flexible container with 40px side margins on desktop, ensuring the data is never cramped against the edges of the browser.
- **Gutters:** A consistent 24px gutter is maintained between cards to provide significant "white space breathing room," which is essential for reducing the visual noise common in analytics tools.
- **Padding:** Internal card padding is set to 24px (lg) to give data visualizations and tables a high-end, gallery-like presentation.

## Elevation & Depth

Hierarchy is established through **Tonal Layering** and **Ambient Shadows**. This design system avoids heavy, dark shadows in favor of light, multi-layered blurs that simulate natural light.

- **Surface Levels:** The background sits at the lowest level (Level 0). Cards sit at Level 1, featuring a white fill and a very soft, diffused shadow (0px 4px 20px rgba(0,0,0,0.04)).
- **Interactions:** Hover states on interactive cards or buttons trigger a slight elevation increase (Level 2), where the shadow becomes more pronounced and the card may scale by 0.5% for a tactile feel.
- **Overlays:** Modals and dropdowns use Level 3 elevation, incorporating a 10% backdrop blur (Glassmorphism lite) to maintain context while focusing the user's attention.

## Shapes

The shape language is defined by **Rounded** geometry to soften the technical nature of data analytics. 

- **Core Elements:** Standard UI components like input fields and small buttons use a 0.5rem (8px) radius.
- **Main Containers:** Dashboard cards and primary containers utilize a 1rem (16px) radius, creating a friendly, modern "SaaS" silhouette.
- **Accents:** Progress bars and tags use a fully rounded (pill) style to distinguish them from structural layout elements.

## Components

The component library focuses on minimalist execution and high-precision interaction.

- **Cards:** These are the primary building blocks. They feature a white background, a 16px corner radius, and subtle 1px light-grey borders (#E2E8F0) to define edges on high-brightness screens.
- **Buttons:** 
    - *Primary:* Trendyol Orange (#F27A1A) with white text.
    - *Secondary:* Deep Blue outline with semi-bold text.
    - *Ghost:* Clear background with thin-line icons for utility actions.
- **Inputs:** Clean, 48px height fields with 8px corner radius. Focus states use a 2px orange ring with high transparency to signal activity without overwhelming the eye.
- **Icons:** Use a custom set of 2px stroke, thin-line icons. Icons should never be filled unless they are in an "active" navigation state.
- **Data Viz:** Charts must use the specific chart palette. Gradients should be used within area charts (e.g., Solid Teal fading to transparent) to add depth while keeping the data point clear.
- **Chips/Status:** Use low-saturation background tints of the status colors (e.g., light mint for success) with high-saturation text to ensure readability and a "modern" feel.