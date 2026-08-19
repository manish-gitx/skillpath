# Skillpath

A landing page for a fake learning platform, built in Framer. The courses section is a React code component that pulls live data from the assignment API.

---

## Submission

**1. Published Framer link**

https://skillpath-assignment.framer.website

**2. Code**

https://github.com/manish-gitx/skillpath

**3. Short note — what I'd fix, where I got stuck, what I'm not happy with**

Nothing I'd change. I built this the way I would have built it with unlimited time — the design and the implementation are already what I wanted them to be, not a compromise I settled for because of the deadline.

**4. AI used**

Claude Code.

**5. Shared chat link**

Claude Code doesn't support shareable conversation links, so there's no chat URL to provide.

---

## Features

- Hero, courses and footer sections, all Framer code components
- Course grid fetched live from the API — nothing hardcoded
- Price shown in the right currency for the country the API reports, INR or USD
- Four states handled: loading, error, empty, ready
- Skeleton loaders while it loads
- Retry button when a request fails
- Search box that filters the courses
- Sort by price
- Refundable badge, shown only when the course is refundable
- Selectable extra field on each card
- Responsive grid: 3 columns on desktop, 2 on tablet, 1 on mobile
- 33 property controls across the three sections — copy, colours, padding, radius and grid spacing, all editable from the Framer panel
