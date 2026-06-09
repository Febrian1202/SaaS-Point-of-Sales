# Project Overview: Kios Sheza - Web

This is a modern web application built with **SvelteKit 2** and **Svelte 5**, serving as the frontend for the **Kios Sheza** project. It leverages the latest web technologies for a fast, type-safe, and highly customizable user experience.

## Core Technology Stack

- **Framework:** [SvelteKit 2](https://svelte.dev/docs/kit) with [Svelte 5](https://svelte.dev/docs/svelte/v5-migration-guide) (Runes mode enabled)
- **Language:** [TypeScript](https://www.typescriptlang.org/)
- **Styling:** [Tailwind CSS 4](https://tailwindcss.com/blog/tailwindcss-v4-alpha)
- **UI Components:** [Shadcn Svelte](https://shadcn-svelte.com/) (Vega style)
- **Icons:** [Lucide Svelte](https://lucide.dev/guide/svelte)
- **Package Manager:** [Bun](https://bun.sh/)
- **Environment:** Node.js 22+

## Architecture & Directory Structure

The project follows the standard SvelteKit directory structure with some specific conventions:

- `src/lib/`: Shared code, assets, and components.
    - `assets/`: Static assets like icons and images (e.g., `favicon.svg`).
    - `components/`: UI components.
        - `ui/`: Shadcn Svelte components.
    - `hooks/`: Custom Svelte hooks.
    - `utils.ts`: General utility functions (e.g., the `cn` helper for Tailwind classes).
- `src/routes/`: File-based routing for the application.
    - `+layout.svelte`: Root layout importing global styles and defining the app structure.
    - `layout.css`: Global Tailwind CSS 4 configuration and theme variables.
- `static/`: Static files served directly (e.g., `robots.txt`).

## Key Commands

Use `bun` as the primary package manager for all commands.

| Command | Description |
| :--- | :--- |
| `bun run dev` | Starts the development server with Vite. |
| `bun run build` | Builds the application for production. |
| `bun run preview` | Previews the production build locally. |
| `bun run check` | Runs `svelte-check` for type-checking and syncs SvelteKit. |
| `bun run lint` | Lints the codebase using ESLint and Prettier. |
| `bun run format` | Formats the codebase using Prettier. |

## Development Conventions

### Svelte 5 & Runes
- **Strict Runes Mode:** The project is configured to enforce Svelte 5 runes mode for all source files.
- Use `$state`, `$derived`, `$props`, `$effect`, etc., instead of legacy Svelte 4 syntax.
- Prefer `{@render children()}` pattern for layouts and component composition.

### Styling with Tailwind CSS 4
- Styles are primarily managed in `src/routes/layout.css` using the new `@theme` and CSS variable system.
- Use the `cn()` utility from `$lib/utils.ts` for conditional class merging.
- Colors and themes (Light/Dark) are defined as CSS variables in `layout.css`.

### TypeScript & Types
- All components and scripts should use TypeScript (`lang="ts"`).
- Global types are defined in `src/app.d.ts`.
- Use the helper types in `$lib/utils.ts` (e.g., `WithElementRef`, `WithoutChildren`) for consistent prop definitions.

### Imports & Aliases
- Use `$lib` for importing from the `src/lib` directory.
- Avoid deep relative imports (e.g., `../../../lib/...`).

## UI Component Guidelines
- New UI components should be added to `src/lib/components/ui` using the shadcn-svelte CLI or by following the existing patterns.
- Icons should be sourced from `lucide-svelte`.
