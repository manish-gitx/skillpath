# Skillpath

A landing page for a fake learning platform, built in Framer. The courses
section is a React code component that pulls live data from the assignment API.

**Live:** https://skillpath-assignment.framer.website

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
- 33 property controls across the three sections — copy, colours, padding,
  radius and grid spacing, all editable from the Framer panel
