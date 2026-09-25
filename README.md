# Smart Journey Planner Interface

A responsive, mobile-first journey-planning interface for comparing multimodal city routes. Users can search between two locations, sort routes by time, fare, or transfers, inspect step-by-step directions, and review a selected journey in both light and dark themes.

## Features

- Origin and destination inputs with one-tap swapping
- Departure-time presets for now, 30 minutes, 1 hour, or 2 hours
- Route comparison across walking, metro, bus, train, and cab options
- Sorting by fastest, cheapest, or fewest transfers
- Expandable route cards and step-by-step journey details
- Interactive route map with highlighted alternatives
- Light and dark interface themes
- Responsive layout optimized for mobile screens
- Simulated payment confirmation flow

> This is currently a frontend prototype. Routes, travel times, fares, and map data are mock data, and the payment action only displays a browser alert.

## Tech Stack

- [React 19](https://react.dev/)
- [TypeScript 5.7](https://www.typescriptlang.org/)
- [Vite 8](https://vite.dev/)
- [Tailwind CSS 4](https://tailwindcss.com/)
- [oxfmt](https://oxc.rs/docs/formatter.html)

## Prerequisites

- [Node.js 22](https://nodejs.org/)
- npm (included with Node.js)

> The repository also contains a pnpm lockfile and a `.mise.toml` configuration. pnpm 10.34.3 can be used instead of npm if preferred.

## Getting Started

Install dependencies:

```bash
npm install
```

Start the development server:

```bash
npm run dev
```

The app is available at [http://localhost:8443](http://localhost:8443) by default. The port can be changed with the `PORT` environment variable:

```bash
PORT=3000 npm run dev
```

Vite enables hot module replacement, so changes to source files are reflected automatically.

## Available Scripts

| Command | Description |
| --- | --- |
| `npm run dev` | Start the Vite development server |
| `npm run build` | Create a production build |
| `npm run preview` | Serve the production build locally |
| `npm run format` | Format source files with oxfmt |

To preview a production build:

```bash
npm run build
npm run preview
```

The preview server also uses port `8443` unless `PORT` is set.

## Project Structure

```text
.
├── src/
│   ├── App.tsx       # Application screens, components, route data, and interactions
│   ├── index.css     # Global styles, font setup, and animations
│   └── main.tsx      # React entry point
├── .figma/
│   └── make/
│       └── site.json # Figma Make site metadata
├── index.html        # Vite HTML shell
├── package.json      # Dependencies and npm scripts
├── tsconfig.json     # TypeScript configuration
└── vite.config.ts    # Vite, React, Tailwind, and Figma Make configuration
```

## Application Flow

1. Enter an origin and destination and choose a departure time.
2. Search for routes and sort the results by preference.
3. Expand a route to review each transport leg.
4. Select a route to view its complete step-by-step timeline.
5. Continue to the simulated payment confirmation.

## Future Integration

The prototype is structured for a future API integration. Likely next steps include:

- Connecting location search to a maps and geocoding service
- Loading live route, schedule, delay, and fare data
- Persisting recent searches and preferred routes
- Integrating a real payment gateway
- Adding authentication, accessibility testing, and automated tests
