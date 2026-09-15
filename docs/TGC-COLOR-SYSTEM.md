# TGC Color System

**Organization:** Tanzania Gemmological Centre (TGC)\
**Version:** 1.1\
**Purpose:** Organization-wide color standard for digital products,
websites, applications, dashboards, documents, presentations, marketing
materials, and other visual interfaces.

------------------------------------------------------------------------

## 1. Purpose

This document defines the official reusable TGC color system.

It is intentionally **color-focused**. It does not depend on React,
Tailwind, shadcn/ui, Bootstrap, Flutter, Laravel, Django, or any other
technology.

A developer, designer, or AI system should be able to use this document
directly when creating a TGC product.

The implementation technology may change. The TGC color language should
remain consistent.

### Core principle

> Use the TGC brand colors to establish identity, neutral colors to
> build the interface, and semantic colors to communicate meaning.

------------------------------------------------------------------------

# 2. TGC Color Identity

The TGC visual identity is built around three principal colors:

  Role        Name       HEX         RGB
  ----------- ---------- ----------- ----------------
  Primary     TGC Blue   `#0152A9`   `1, 82, 169`
  Secondary   TGC Teal   `#074C70`   `7, 76, 112`
  Accent      TGC Gold   `#E4A41E`   `228, 164, 30`

### Brand hierarchy

``` text
                  TGC
                   │
       ┌───────────┼───────────┐
       │           │           │
      BLUE        TEAL        GOLD
       │           │           │
    Primary    Secondary     Accent
       │           │           │
    Identity   Institutional  Prestige
```

### Recommended visual balance

``` text
Blue       ████████████████████  Primary identity
Neutral    █████████████         Interface foundation
Teal       ████████              Supporting identity
Gold       ███                   Accent
```

These proportions are guidelines rather than fixed requirements.

------------------------------------------------------------------------

# 3. Primary Color --- TGC Blue

## `#0152A9`

TGC Blue is the primary organizational color.

### Meaning

Blue should communicate:

-   Trust
-   Scientific professionalism
-   Technology
-   Reliability
-   Competence
-   Institutional identity

### Recommended uses

Use TGC Blue for:

-   Primary actions
-   Primary navigation
-   Links
-   Active states
-   Important interface elements
-   Main brand areas
-   Digital product identity
-   Key data visualizations
-   Interactive elements

### Avoid

Do not use the primary blue for every element on a page.

Blue should identify important elements, not overwhelm the interface.

------------------------------------------------------------------------

# 4. TGC Blue Scale

The scale provides lighter and darker variants for different situations.

  Token            HEX         Primary purpose
  ---------------- ----------- --------------------------
  `tgc-blue-50`    `#EFF6FF`   Very light background
  `tgc-blue-100`   `#DCEBFA`   Light surface
  `tgc-blue-200`   `#B8D5F2`   Soft border / divider
  `tgc-blue-300`   `#82B4E5`   Light decorative element
  `tgc-blue-400`   `#3D8DD4`   Secondary emphasis
  `tgc-blue-500`   `#0A6ED1`   Bright brand blue
  `tgc-blue-600`   `#0152A9`   **TGC Primary**
  `tgc-blue-700`   `#00458F`   Hover / active
  `tgc-blue-800`   `#00366F`   Strong emphasis
  `tgc-blue-900`   `#00254D`   Very dark blue
  `tgc-blue-950`   `#001A36`   Deepest blue

### Default selection

``` text
Primary:       #0152A9
Hover:         #00458F
Active:        #00366F
Light surface: #EFF6FF
```

------------------------------------------------------------------------

# 5. Secondary Color --- TGC Teal

## `#074C70`

TGC Teal is the secondary institutional color.

### Meaning

Teal should communicate:

-   Institutional professionalism
-   Stability
-   Technical expertise
-   Laboratory/scientific context
-   Supporting brand identity

### Recommended uses

Use TGC Teal for:

-   Secondary navigation
-   Sidebars
-   Headers
-   Footers
-   Secondary actions
-   Supporting sections
-   Institutional layouts
-   Large dark surfaces

TGC Teal works particularly well with white text.

------------------------------------------------------------------------

# 6. TGC Teal Scale

  Token            HEX         Primary purpose
  ---------------- ----------- -------------------------
  `tgc-teal-50`    `#EEF8FB`   Very light background
  `tgc-teal-100`   `#D7EEF4`   Light surface
  `tgc-teal-200`   `#AEDDE8`   Soft border
  `tgc-teal-300`   `#7BC4D4`   Decorative/light accent
  `tgc-teal-400`   `#45A6BD`   Supporting emphasis
  `tgc-teal-500`   `#1689A5`   Medium teal
  `tgc-teal-600`   `#08718E`   Strong teal
  `tgc-teal-700`   `#075B73`   Dark teal
  `tgc-teal-800`   `#074C70`   **TGC Secondary**
  `tgc-teal-900`   `#063A56`   Very dark teal
  `tgc-teal-950`   `#032637`   Deepest teal

### Default selection

``` text
Secondary:       #074C70
Hover:           #063A56
Active:          #032637
Light surface:   #EEF8FB
```

------------------------------------------------------------------------

# 7. Accent Color --- TGC Gold

## `#E4A41E`

Gold is the principal TGC accent.

It connects strongly to the identity of:

-   Gemstones
-   Precious materials
-   Excellence
-   Value
-   Prestige
-   Achievement

### Recommended uses

Use Gold for:

-   Small visual accents
-   Important highlights
-   Certification-related interfaces
-   Achievement indicators
-   Premium/official visual treatments
-   Selected statistics
-   Decorative brand elements
-   Certificate and formal document accents

### Important rule

**Gold is an accent, not the primary interface color.**

Do not make all buttons, headings, backgrounds, borders, and icons gold.

The combination should generally be:

``` text
Blue / Teal
    +
Neutral UI
    +
Small Gold accents
```

------------------------------------------------------------------------

# 8. TGC Gold Scale

  Token            HEX         Primary purpose
  ---------------- ----------- -----------------------
  `tgc-gold-50`    `#FFFAEB`   Very light background
  `tgc-gold-100`   `#FFF1C7`   Light surface
  `tgc-gold-200`   `#FFE28A`   Soft highlight
  `tgc-gold-300`   `#F8CE55`   Decorative
  `tgc-gold-400`   `#F0B832`   Bright accent
  `tgc-gold-500`   `#E4A41E`   **TGC Gold**
  `tgc-gold-600`   `#C98A0C`   Strong accent
  `tgc-gold-700`   `#A56D08`   Dark accent
  `tgc-gold-800`   `#86570B`   Very dark accent
  `tgc-gold-900`   `#70460D`   Deep gold
  `tgc-gold-950`   `#452A05`   Deepest gold

### Default selection

``` text
Accent:       #E4A41E
Strong:       #C98A0C
Dark:         #A56D08
Light:        #FFFAEB
```

------------------------------------------------------------------------

# 9. Neutral Color System

Neutral colors form the majority of most interfaces.

They provide:

-   Backgrounds
-   Surfaces
-   Text
-   Borders
-   Dividers
-   Disabled states
-   Secondary information

Do not use brand colors where a neutral is more appropriate.

------------------------------------------------------------------------

# 10. TGC Neutral Scale

  Token               HEX         Recommended use
  ------------------- ----------- --------------------------
  `tgc-neutral-50`    `#F8FAFC`   Application background
  `tgc-neutral-100`   `#F1F5F9`   Subtle surface
  `tgc-neutral-200`   `#E2E8F0`   Default border
  `tgc-neutral-300`   `#CBD5E1`   Strong border
  `tgc-neutral-400`   `#94A3B8`   Placeholder / disabled
  `tgc-neutral-500`   `#64748B`   Muted text
  `tgc-neutral-600`   `#475569`   Secondary text
  `tgc-neutral-700`   `#334155`   Strong secondary text
  `tgc-neutral-800`   `#1E293B`   Headings / dark surfaces
  `tgc-neutral-900`   `#0F172A`   Primary text
  `tgc-neutral-950`   `#020617`   Maximum dark surface

### Default UI neutrals

``` text
Background:       #F8FAFC
Surface:          #FFFFFF
Primary text:     #0F172A
Secondary text:   #475569
Muted text:       #64748B
Border:           #E2E8F0
Strong border:    #CBD5E1
```

------------------------------------------------------------------------

# 11. Semantic Colors

Semantic colors communicate the state or meaning of information.

They are separate from the TGC brand colors.

For example:

-   Blue does not mean "success."
-   Gold does not mean "warning."
-   Red means danger regardless of the TGC logo.

------------------------------------------------------------------------

## 11.1 Success

### Base

`#16A34A`

Use for:

-   Successful operations
-   Verified records
-   Completed processes
-   Active healthy states
-   Positive confirmations
-   Approved records

  Token           HEX
  --------------- -----------
  `success-50`    `#F0FDF4`
  `success-100`   `#DCFCE7`
  `success-500`   `#22C55E`
  `success-600`   `#16A34A`
  `success-700`   `#15803D`

------------------------------------------------------------------------

## 11.2 Warning

### Base

`#D97706`

Use for:

-   Pending actions
-   Expiring records
-   Attention required
-   Non-critical risks
-   Incomplete processes

  Token           HEX
  --------------- -----------
  `warning-50`    `#FFFBEB`
  `warning-100`   `#FEF3C7`
  `warning-500`   `#F59E0B`
  `warning-600`   `#D97706`
  `warning-700`   `#B45309`

------------------------------------------------------------------------

## 11.3 Danger

### Base

`#DC2626`

Use for:

-   Errors
-   Failed operations
-   Rejected records
-   Destructive actions
-   Critical warnings

  Token          HEX
  -------------- -----------
  `danger-50`    `#FEF2F2`
  `danger-100`   `#FEE2E2`
  `danger-500`   `#EF4444`
  `danger-600`   `#DC2626`
  `danger-700`   `#B91C1C`

------------------------------------------------------------------------

## 11.4 Information

### Base

`#2563EB`

Use for:

-   Informational messages
-   Help
-   Explanations
-   Neutral notifications
-   System information

  Token        HEX
  ------------ -----------
  `info-50`    `#EFF6FF`
  `info-100`   `#DBEAFE`
  `info-500`   `#3B82F6`
  `info-600`   `#2563EB`
  `info-700`   `#1D4ED8`

------------------------------------------------------------------------

# 12. Core Role Tokens

A **role token** names what a color *does*, not what it *is*. Applications
consume role tokens; only this table maps them to palette values.

## 12.1 Rule of pairs

> Every token that can become a **background** must declare the
> **foreground** that is legible on it.

A background without a declared foreground is an incomplete token. This is the
single most common source of unreadable interfaces, and it is why the table
below is written in pairs.

## 12.2 Surface and text roles

  Token                 Light       Dark        Meaning
  --------------------- ----------- ----------- ----------------------------
  `background`          `#F8FAFC`   `#020617`   Application ground
  `foreground`          `#0F172A`   `#F8FAFC`   Text on `background`
  `card`                `#FFFFFF`   `#0F172A`   Cards and panels
  `card-foreground`     `#0F172A`   `#F8FAFC`   Text on `card`
  `popover`             `#FFFFFF`   `#0F172A`   Popovers, menus, dropdowns
  `popover-foreground`  `#0F172A`   `#F8FAFC`   Text on `popover`
  `muted`               `#F1F5F9`   `#1E293B`   Secondary surface, hover
  `secondary`           `#F1F5F9`   `#1E293B`   Quiet button surface
  `accent`              `#F1F5F9`   `#1E293B`   Hover and highlight surface
  `input`               `#E2E8F0`   `#334155`   Form control outline
  `muted-foreground`    `#64748B`   `#94A3B8`   Metadata, helper text
  `border`              `#E2E8F0`   `#334155`   Default divider
  `border-strong`       `#CBD5E1`   `#475569`   Input outlines, emphasis
  `ring`                `#0152A9`   `#3D8DD4`   Keyboard focus indicator

## 12.3 Brand roles

  Token                 Light       Dark        Meaning
  --------------------- ----------- ----------- ----------------------------
  `primary`             `#0152A9`   `#3D8DD4`   Main TGC action surface
  `primary-foreground`  `#FFFFFF`   `#001A36`   Text on `primary`
  `primary-hover`       `#00458F`   `#0A6ED1`   Primary hover
  `primary-active`      `#00366F`   `#0152A9`   Primary pressed
  `primary-subtle`      `#EFF6FF`   *derived*   Brand tint background
  `institutional`       `#074C70`   `#032637`   Nav, headers, footers
  `institutional-foreground`    `#FFFFFF`   `#F8FAFC`   Text on `institutional`
  `gold`                `#E4A41E`   `#F0B832`   Brand accent surface
  `gold-foreground`     `#452A05`   `#452A05`   Text on `gold`

## 12.4 Semantic roles

Each semantic colour is a **quad**, not a single value. One value cannot paint
both a solid button and a tinted badge.

  Suffix        Purpose                                  Example use
  ------------- ---------------------------------------- ----------------------
  *(base)*      Solid fill                               Button, filled badge
  `-foreground` Text on the solid fill                   Button label
  `-text`       The colour as *text* on a plain surface  Inline error message
  `-subtle`     Tinted background                        Alert, status pill

  Role       Base      On base   Text (light) Text (dark)  Subtle
  ---------- --------- --------- ------------ ------------ ---------------
  `success`  `#16A34A` `#FFFFFF` `#15803D`    `#4ADE80`    *derived*
  `warning`  `#D97706` `#FFFFFF` `#B45309`    `#FBBF24`    *derived*
  `danger`   `#DC2626` `#FFFFFF` `#B91C1C`    `#F87171`    *derived*
  `info`     `#2563EB` `#FFFFFF` `#1D4ED8`    `#60A5FA`    *derived*

**`-text` exists because a solid fill is rarely legible as text.** `#DC2626`
on a dark background fails contrast; `#F87171` passes. Never reuse the base
value for inline text.

## 12.5 Derived tokens

Values marked *derived* are computed from a base and the surface they sit on
rather than hand-picked per theme:

``` text
<role>-subtle = mix(<role> 12%, card)
<role>-border = mix(<role> 30%, card)
```

Each semantic role therefore has four members — the solid colour, `-subtle`,
`-border` and `-text`. Status badges consume the last three together; see §36.

One definition serves both themes, because the surface changes with the theme
and the tint follows it. Hand-picking a light and a dark value for every
semantic tint produces sixteen constants that drift apart over time.

# 13. Color Roles

Every color used in a TGC product should have a reason.

## Brand colors

``` text
Blue  → primary identity
Teal  → secondary identity
Gold  → accent identity
```

## Interface colors

``` text
Neutral → structure and readability
```

## Semantic colors

``` text
Green  → success
Amber  → warning
Red    → danger
Blue   → information
```

This separation prevents color confusion.

------------------------------------------------------------------------

# 14. Color Decision Rules

When choosing a color, follow this order:

``` text
What am I communicating?
        │
        ├── Brand identity?
        │      → TGC Blue / Teal / Gold
        │
        ├── User/system state?
        │      → Semantic color
        │
        ├── Text/surface/border?
        │      → Neutral
        │
        └── Decoration?
               → Brand accent or neutral
```

------------------------------------------------------------------------

# 15. Recommended Component Colors

## Primary button

``` text
Background: #0152A9
Text:       #FFFFFF
Hover:      #00458F
Active:     #00366F
```

## Secondary button

``` text
Background: #074C70
Text:       #FFFFFF
Hover:      #063A56
Active:     #032637
```

## Outline button

``` text
Background: transparent
Text:       #0152A9
Border:     #E2E8F0
Hover:      #EFF6FF
```

## Destructive button

``` text
Background: #DC2626
Text:       #FFFFFF
Hover:      #B91C1C
```

## Gold accent

``` text
Background: #E4A41E
Text:       #452A05
```

Use this combination when Gold is used as a surface. Always verify
contrast for the exact typography and context.

------------------------------------------------------------------------

# 16. Navigation Colors

Navigation and the page header are one continuous band of **chrome** wrapped
around the content. They are not the same sheet as the data, and they are the
only place the brand tint appears as a large surface.

## Light navigation

``` text
Background: #EFF6FF   (blue-50)
Text:       #0F172A   (foreground)
Active BG:  #B8D5F2   (blue-200)
Border:     #82B4E5   (blue-300)
```

The tint is carried on the **navigation surface**, never on `background`.
`background` is not only the page ground — Dialog, Sheet, outline Button and the
active Tab are all painted with it, so tinting that token colours half the
component library. Putting the colour on the sidebar lands it where it was
wanted and nowhere else.

The active state sits **two steps** darker than the track, not one. Track and
selection now share a hue, so lightness is the only signal left distinguishing
them; blue-100 on a blue-50 track was too close to locate the current page at a
glance. The border sits one step below the active state, so a divider never
outweighs a selection.

## Dark navigation

``` text
Background: #032637   (teal-950)
Text:       #F8FAFC   (foreground)
Active BG:  #063A56   (teal-900)
Border:     #07364D
```

Dark mode inverts the relationship: the navigation recedes *below* the content
rather than sitting above it, so the content card remains the raised surface.
The institutional teal survives here as the ground.

Do not use Gold as the background of the entire navigation.

## The header, and what else borrows the band

The page header takes the navigation surface rather than the content sheet it
sits on, and is **aliased** to it rather than given its own hexes — two shades
of almost-the-same on one continuous band reads as a rendering fault. A screen's
description box borrows the same surface for the same reason: it is the screen
explaining itself, so it belongs to the frame rather than to the data.

Repoint the header tokens to their own values only if the two are ever meant to
differ.

------------------------------------------------------------------------

# 17. Background Rules

Recommended hierarchy:

``` text
Application background
#F8FAFC

Card / surface
#FFFFFF

Secondary surface
#F1F5F9

Brand surface
#EFF6FF

Institutional surface
#EEF8FB

Accent surface
#FFFAEB
```

Large backgrounds should generally be light and low-saturation.

------------------------------------------------------------------------

# 18. Text Colors

## Primary text

``` text
#0F172A
```

Use for:

-   Headings
-   Important information
-   Main body text

## Secondary text

``` text
#475569
```

Use for:

-   Supporting descriptions
-   Secondary information

## Muted text

``` text
#64748B
```

Use for:

-   Metadata
-   Helper text
-   Timestamps
-   Less important information

Avoid using very light gray for normal text.

------------------------------------------------------------------------

# 19. Border Colors

### Default

``` text
#E2E8F0
```

### Strong

``` text
#CBD5E1
```

### Brand

``` text
#B8D5F2
```

Use brand-colored borders selectively.

Most application borders should remain neutral.

------------------------------------------------------------------------

# 20. Status Mapping

Use this standard wherever statuses occur.

  Status meaning   Color            Example
  ---------------- ---------------- -----------------
  Successful       Success          Verified
  Active           Success          Active
  Completed        Success          Completed
  Approved         Success          Approved
  Pending          Warning          Pending
  Attention        Warning          Requires review
  Processing       Info             Processing
  Draft            Neutral          Draft
  Archived         Neutral          Archived
  Rejected         Danger           Rejected
  Failed           Danger           Failed
  Cancelled        Danger/Neutral   Cancelled

Status colors should be supplemented with text or icons.

------------------------------------------------------------------------

# 21. Color + Icon + Text

Never depend on color alone.

Preferred:

``` text
✓ Verified
! Pending
× Rejected
i Processing
```

Not:

``` text
●
```

where the user must understand the color to determine the state.

------------------------------------------------------------------------

# 22. Data Visualization

TGC charts should use a controlled color sequence.

## Preferred categorical order

``` text
1. TGC Blue
2. TGC Teal
3. TGC Gold
4. Supporting blue/teal shades
5. Neutral shades
```

For semantic charts:

``` text
Success → Green
Warning → Amber
Danger  → Red
Information → Blue
```

Do not use Gold to represent warning merely because the colors look
similar.

------------------------------------------------------------------------

# 23. Color Combinations

## Primary TGC combination

``` text
TGC Blue
#0152A9

+
White
#FFFFFF
```

Best for:

-   Buttons
-   Headers
-   Primary actions
-   Strong branding

------------------------------------------------------------------------

## Institutional combination

``` text
TGC Teal
#074C70

+
White
#FFFFFF
```

Best for:

-   Navigation
-   Footer
-   Institutional sections
-   Dark surfaces

------------------------------------------------------------------------

## Premium/gemmological combination

``` text
TGC Blue
#0152A9

+
TGC Gold
#E4A41E

+
White
#FFFFFF
```

Use Gold as an accent.

------------------------------------------------------------------------

## Light application combination

``` text
Background
#F8FAFC

Surface
#FFFFFF

Blue
#0152A9

Teal
#074C70

Gold
#E4A41E
```

This should be the default visual direction for most TGC applications.

------------------------------------------------------------------------

# 24. Color Combinations to Avoid

Avoid:

``` text
Gold + Gold + Gold
```

throughout an interface.

Avoid:

``` text
Blue + Teal + Gold
```

at equal visual intensity everywhere.

Avoid placing saturated colors next to each other without a neutral
separator when readability suffers.

Avoid using:

``` text
red = decorative
green = decorative
yellow = decorative
```

when those colors already have semantic meanings.

------------------------------------------------------------------------

# 25. Dark Mode Color System

Dark mode should preserve TGC identity while maintaining readability.

## Dark surfaces

``` text
Background: #020617
Surface:    #0F172A
Surface 2:  #1E293B
Border:     #334155
```

## Dark mode text

``` text
Primary:    #F8FAFC
Secondary:  #CBD5E1
Muted:      #94A3B8
```

## Brand colors in dark mode

Use lighter brand shades where needed:

``` text
Primary Blue: #3D8DD4
Light Blue:   #82B4E5

Teal:         #45A6BD

Gold:         #F0B832
```

The original brand values remain the official brand colors. These
lighter values are UI adaptations for dark surfaces.

------------------------------------------------------------------------

# 26. Accessibility Rules

Color choices must be tested in their actual usage.

Do not assume:

``` text
Brand color = accessible text color
```

For important text:

-   Use sufficient contrast.
-   Avoid low-contrast gray text.
-   Avoid using light blue as normal body text.
-   Avoid using light gold as normal text.
-   Test dark-mode combinations independently.

Color must not be the only mechanism for:

-   Errors
-   Success
-   Warnings
-   Status
-   Required fields

------------------------------------------------------------------------

# 27. Logo Colors

The official logo contains additional visual variations, gradients,
highlights, and photographic colors.

These should **not** all become design-system colors.

The design system intentionally extracts the stable organizational
identity:

``` text
Blue
Teal
Gold
Neutral
Semantic colors
```

The logo itself should remain visually faithful to the official artwork.

Do not recolor the logo using arbitrary application colors.

------------------------------------------------------------------------

# 28. AI Instructions

When an AI is asked to design or generate a TGC interface, it should
follow these rules.

### Mandatory

1.  Use TGC Blue `#0152A9` as the primary brand color.
2.  Use TGC Teal `#074C70` as the secondary brand color.
3.  Use TGC Gold `#E4A41E` as an accent.
4.  Use neutral colors for most backgrounds, surfaces, text, and
    borders.
5.  Use semantic colors for system states.
6.  Do not invent new brand colors unless explicitly requested.
7.  Do not use Gold as the dominant color.
8.  Do not use color alone to communicate status.
9.  Preserve the TGC brand hierarchy.
10. Prefer the semantic token names in this document when generating
    implementation code.

### Default implementation tokens

``` text
primary          #0152A9    primary-foreground  #FFFFFF
primary-hover    #00458F    primary-active      #00366F
primary-subtle   #EFF6FF

institutional    #074C70    institutional-foreground  #FFFFFF
institutional-subtle  #EEF8FB
gold             #E4A41E    gold-foreground     #452A05
gold-subtle      #FFFAEB

background       #F8FAFC    foreground          #0F172A
card             #FFFFFF    card-foreground     #0F172A
popover          #FFFFFF    popover-foreground  #0F172A
muted            #F1F5F9    muted-foreground    #64748B
secondary        #F1F5F9    accent              #F1F5F9
border           #E2E8F0    border-strong       #CBD5E1
input            #E2E8F0    ring                #0152A9

sidebar          #EFF6FF    sidebar-accent      #B8D5F2
sidebar-border   #82B4E5    sidebar-foreground  = foreground
header           = sidebar   header-border      = sidebar-border
table-header     #E8EEF6

success          #16A34A    success-text        #15803D
success-subtle             success-border
warning          #D97706    warning-text        #B45309
warning-subtle             warning-border
danger           #DC2626    danger-text         #B91C1C
danger-subtle              danger-border
info             #2563EB    info-text           #1D4ED8
info-subtle                info-border

radius           0.625rem   radius-sm / -md / -lg / -xl  derived from it
```

Tokens with no value are **derived** — see §12.5 for the formula. The four
`-border` members are not decoration: status badges consume `-subtle`,
`-border` and `-text` together, so a role missing one of them cannot render a
badge (§36).

`accent` and `secondary` are framework-owned names with their own meaning; see
section 33 before assigning to them.

------------------------------------------------------------------------

# 29. Developer Instructions

When implementing TGC colors in code:

### Prefer

``` text
primary
background
foreground
card
popover
muted
border
sidebar
header
success
warning
danger
info
```

Note `card` and `popover` rather than a single `surface`: the two are the same
colour today but are separate roles, because a menu floating over a card has to
be able to separate itself from it without a theme-wide change.

### Avoid

``` text
blue1
blue2
niceBlue
customBlue
randomGold
darkBlue2
```

unless those values are explicitly part of the documented token system.

The developer should map semantic names to actual color values in one
centralized location.

This allows the implementation technology to change without changing the
TGC color specification.

------------------------------------------------------------------------

# 30. Recommended Token Structure

Any technology can implement the system using this conceptual structure:

``` text
TGC COLORS
│
├── BRAND
│   ├── Blue
│   ├── Teal
│   └── Gold
│
├── NEUTRAL
│   ├── 50
│   ├── 100
│   ├── ...
│   └── 950
│
├── SEMANTIC
│   ├── Success
│   ├── Warning
│   ├── Danger
│   └── Info
│
└── ROLE
    ├── Primary
    ├── Secondary
    ├── Accent
    ├── Background
    ├── Surface
    ├── Foreground
    └── Border
```

------------------------------------------------------------------------

# 31. Quick Reference

## TGC Brand

``` text
BLUE
#0152A9

TEAL
#074C70

GOLD
#E4A41E
```

## Primary UI

``` text
Primary
#0152A9

Primary Hover
#00458F

Primary Active
#00366F
```

## Secondary UI

``` text
Secondary
#074C70

Secondary Hover
#063A56

Secondary Active
#032637
```

## Neutral UI

``` text
Background
#F8FAFC

Card
#FFFFFF

Text
#0F172A

Muted Text
#64748B

Border
#E2E8F0
```

## Chrome

``` text
Sidebar / Header
#EFF6FF

Active nav item
#B8D5F2

Chrome border
#82B4E5

Table header
#E8EEF6
```

## Semantic

``` text
Success
#16A34A

Warning
#D97706

Danger
#DC2626

Info
#2563EB
```

------------------------------------------------------------------------

# 32. Final TGC Color Rule

When in doubt:

``` text
                 TGC PRODUCT
                      │
             ┌────────┴────────┐
             │                 │
          IDENTITY           MEANING
             │                 │
       Blue / Teal / Gold    Semantic
             │              colors
             │
             └──────┬──────────┘
                    │
                 NEUTRALS
                    │
             Readable interface
```

The TGC color language can be summarized as:

> **Blue establishes TGC. Teal supports TGC. Gold distinguishes TGC.
> Neutrals make TGC usable. Semantic colors explain what is happening.**

------------------------------------------------------------------------

# 33. Reserved and Colliding Names

Some role names are already claimed by common UI frameworks with a *different*
meaning. Applying the TGC meaning on top of the framework meaning silently
repaints unrelated parts of an interface.

  Name          Framework meaning                   TGC meaning   Resolution
  ------------- ----------------------------------- ------------- ---------------------------
  `accent`      Neutral hover/selection surface     TGC Gold      TGC uses **`gold`**
  `secondary`   Quiet neutral chip or button        TGC Teal      TGC uses **`institutional`**
  `destructive` Danger                              Danger        Alias --- same meaning

### Why `accent` is not Gold

In shadcn/ui, Radix and most component kits, `accent` is the colour of a
hovered menu item, a highlighted calendar day and a focused list row. It is a
**neutral**, and it appears hundreds of times per screen.

Binding Gold to that name makes the entire interface hover gold, which directly
contradicts section 7. The brand accent therefore gets its own name, `gold`,
and `accent` is left as the framework's neutral.

### Why `secondary` is not Teal

Section 5 assigns Teal to **large institutional surfaces** --- sidebars,
headers, footers. Component kits use `secondary` for small quiet elements such
as badges and low-emphasis buttons. A badge filled with `#074C70` is a heavy
dark block where a light chip was intended.

Teal is a surface identity, not a button variant, so it is named
`institutional`.

### General rule

> When a TGC role name collides with a framework role name, TGC renames its own
> token. Never redefine a framework token to mean something else.

The interface layer belongs to the framework. The brand layer sits alongside it
under its own names.

------------------------------------------------------------------------

# 34. Dark Mode Role Parity

Section 25 gives dark surfaces. This section completes the role table, so that
every light-mode role has a defined dark counterpart. A theme is not finished
until this table has no blanks.

  Role                   Light       Dark        Note
  ---------------------- ----------- ----------- -------------------------------
  `background`           `#F8FAFC`   `#020617`
  `card`                 `#FFFFFF`   `#0F172A`   Cards lift *above* the ground
  `popover`              `#FFFFFF`   `#0F172A`
  `muted`                `#F1F5F9`   `#1E293B`
  `secondary`            `#F1F5F9`   `#1E293B`
  `accent`               `#F1F5F9`   `#1E293B`
  `foreground`           `#0F172A`   `#F8FAFC`
  `muted-foreground`     `#64748B`   `#94A3B8`
  `border`               `#E2E8F0`   `#334155`
  `border-strong`        `#CBD5E1`   `#475569`
  `input`                `#E2E8F0`   `#334155`
  `primary`              `#0152A9`   `#3D8DD4`   Lightens as the ground darkens
  `primary-foreground`   `#FFFFFF`   `#001A36`   **Inverts** with it
  `institutional`        `#074C70`   `#032637`   Darkens; it is already dark
  `gold`                 `#E4A41E`   `#F0B832`
  `ring`                 `#0152A9`   `#3D8DD4`
  `sidebar`              `#EFF6FF`   `#032637`   Blue chrome; teal in the dark
  `sidebar-accent`       `#B8D5F2`   `#063A56`   The active page
  `sidebar-border`       `#82B4E5`   `#07364D`
  `header`               = `sidebar` = `sidebar` Aliased, not duplicated
  `table-header`         `#E8EEF6`   `#1E293B`   Its own tone, not `muted`

### The inversion rule

`primary` and `primary-foreground` swap lightness together, never separately:

``` text
Light   dark blue surface   +   white text
Dark    light blue surface  +   dark navy text
```

A light-blue button carrying white text is the most common dark-mode brand
failure. If `primary` gets lighter, `primary-foreground` must get darker.

### Semantic colours in dark mode

Solid fills keep their light-mode values --- `#16A34A`, `#D97706`, `#DC2626`,
`#2563EB` --- because they are already dark enough to carry white text on any
ground. Only the `-text` variants change, to the lighter values in section 12.4.
The `-subtle` and `-border` members need no dark values at all: they are mixed
against `card`, which has already inverted, so the tint follows the theme by
itself.

### The chrome inverts its relationship, not just its colour

In light mode the navigation sits *above* the content and the content floats on
it. In dark mode it recedes *below*, so the content card is still the raised
surface. That is why `sidebar` does not simply darken to a navy — it becomes the
institutional teal, and the content lifts off it.

------------------------------------------------------------------------

# 35. Data Visualization Tokens

Section 22 gives the categorical *order*. These are the values.

  Token       Light       Dark        Source
  ----------- ----------- ----------- -----------------
  `chart-1`   `#0152A9`   `#3D8DD4`   TGC Blue
  `chart-2`   `#074C70`   `#45A6BD`   TGC Teal
  `chart-3`   `#E4A41E`   `#F0B832`   TGC Gold
  `chart-4`   `#3D8DD4`   `#82B4E5`   Blue 400 / 300
  `chart-5`   `#45A6BD`   `#7BC4D4`   Teal 400 / 300
  `chart-6`   `#94A3B8`   `#64748B`   Neutral

Six is the practical limit for a categorical sequence. Beyond six a legend stops
being readable, and the data needs grouping rather than more colours.

Chart axes, gridlines and tick labels are **neutral**, never brand:

``` text
Axis line / ticks   border-strong
Tick labels         muted-foreground
Gridlines           border
```

Hardcoded greys such as `#888888` fail in one theme or the other. Always bind
axis chrome to the neutral role tokens.

------------------------------------------------------------------------

# 36. Status Component Recipe

Section 20 maps statuses to colours and section 21 requires an icon or label.
This is the concrete construction.

A status indicator is built from **three tokens of a single semantic role**:

``` text
Background   <role>-subtle
Border       <role>-border
Text + icon  <role>-text
```

Worked example --- a "Pending" pill:

``` text
Background   warning-subtle
Border       warning-border
Text + icon  warning-text
Label        "Pending"        <- required, not optional
```

Do not build status indicators from raw palette values such as `amber-500`. The
palette is the source the roles are drawn from; components consume roles. A
component that reaches past the role layer cannot be re-themed, and will not
follow the interface into dark mode.

  Status                              Role
  ----------------------------------- -----------
  Verified, Active, Completed         `success`
  Pending, Requires review, Expiring  `warning`
  Processing                          `info`
  Rejected, Failed                    `danger`
  Draft, Archived                     *neutral*

Neutral statuses use `muted` / `border` / `muted-foreground`.

------------------------------------------------------------------------

# 37. Implementation Checklist

A TGC implementation is complete when all of the following hold.

``` text
[ ] Every role token is defined once, in one file.
[ ] Every background role has a paired foreground role.
[ ] Every light role has a dark counterpart, with no blanks.
[ ] primary and primary-foreground invert together.
[ ] No framework token has been redefined to a brand meaning.
[ ] Gold is bound to `gold`, never to `accent`.
[ ] Semantic tints are derived from the surface, not hand-picked.
[ ] Chart axis chrome uses neutral roles, not hardcoded grey.
[ ] No component references a raw palette value directly.
[ ] Every status carries an icon or text label, not colour alone.
```

The last four decay silently after launch. They are worth a lint rule.

------------------------------------------------------------------------

# 38. How This Specification Is Implemented

Sections 1--37 describe the colour system independently of any technology.
This section describes how it is wired in this codebase, and is the one part
that changes if the stack does.

## One file

Every token lives in `src/styles/theme.css`. `src/styles/index.css` imports it
and adds base rules; nothing else defines a colour.

## Defining a token

Declare the complete light palette on **bare `:root`**, then redefine under
`.dark` only the tokens that actually change:

``` css
:root {
  --sidebar: #eff6ff;
  --sidebar-accent: #b8d5f2;
}

.dark {
  --sidebar: #032637;
  --sidebar-accent: #063a56;
}
```

A token whose only definition sits inside `.dark` has no value in light mode,
and the property silently resolves to nothing. This is the single most common
way a theme half-works.

Derived tokens (§12.5) need one definition, not two, because the mix resolves
against a surface that has already changed:

``` css
--success-subtle: color-mix(in oklab, var(--success) 12%, var(--card));
--success-border: color-mix(in oklab, var(--success) 30%, var(--card));
```

Aliases are just `var()`:

``` css
--header: var(--sidebar);
```

## Making a token usable

**A token is not a utility class until it is mapped.** Tailwind v4 reads the
`@theme inline` block at the bottom of `theme.css`, and only names it finds
there become classes:

``` css
@theme inline {
  --color-sidebar: var(--sidebar);
  --color-success-subtle: var(--success-subtle);
}
```

`--color-sidebar` is what makes `bg-sidebar` and `text-sidebar` exist. Define
`--brand-x` without a matching `--color-brand-x` and `bg-brand-x` compiles to
nothing at all — no error, no warning, no colour. If a class you expect has no
effect, check the mapping block first.

The same block defines the radius scale, so `rounded-md` tracks `--radius`.

## Where tokens are consumed

Components never reference a hex value. Two places are worth knowing:

- **Status badges** — `src/components/status-badge.tsx` consumes the
  `-subtle` / `-border` / `-text` triplet of each semantic role (§36). This is
  the reason the `-border` members exist.
- **Scrollbars** — `src/styles/index.css` paints them with `border-strong` on
  `muted`, so they are visible against every surface in both themes without a
  bespoke colour.

------------------------------------------------------------------------

**TGC Color System --- Version 1.1**
