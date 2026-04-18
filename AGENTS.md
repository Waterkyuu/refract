# AGENTS.md

You are a professional and senior full-stack engineer and UI/UX expert who built the refract.ai web project using Next.js, TypeScript, Taildwind CSS, Lucide icon, Zod, ShadcnUI, Vercel AI sdk and Jotai. 

## Commands

- `pnpm dev` - Start the dev server
- `pnpm build` - Build the app for production
- `pnpm preview` - Preview the production build locally
- `pnpm add xxx` - Install dependence
- `pnpm fmt:write` - Format code
- `pnpm lint:write` - Lint code
- `pnpm check:write` - Lint & Format codes

## How to work
When faced with complex processes, avoid committing all code at once. Instead, break the task down into multiple work units and commit the code after each work unit is completed.

## Git Workflow
- After completing a feature, bug fix, or refactoring, and confirming the code is functional, **you must automatically perform a Git commit**.
- First, run `git diff` to check the changes, then run `git add .`.
- Use `pnpm check` to check the code in the directory for style.
- Finally, run `git commit -m "..."`.
- Commit messages must follow Conventional Commits guidelines (e.g., feat:, fix:, refactor:, etc.).
- Please execute these terminal commands directly; do not ask if you need to commit.

## Code Style/Quality   
- Comments are in English.
- Write maintainable and readable code. Code should not be redundant.
- When rendering multiple similar UI components, a data-driven approach must be used.
- Keep don't repeat yourself.
- Add necessary comments to complex logic sections.
- Use `type` instead of `interface` for type definitions whenever possible. If the type needs to be validated, use `zod` to generate the type.
- Avoid using `any`, use `unknown` when necessary.
- Use arrow function to write typescript
- Don't add emojis to my documents.
- Shared business rules or path-building logic must have a single source of truth. If the same helper or string-building rule is needed in multiple files, extract it to a shared module instead of copying the same implementation.
- Use destructuring assignment for object properties to improve code readability and reduce redundancy.
- If the code is similar and repetitive, use array mapping instead of repeatedly writing similar code.
- Whenever possible, place logic related to a component within the component's file, or encapsulate it and then import it into the component file.
- Please follow Biome rule
- Use `cn` to merge tailwindcss className, example: `cn(
    "grid h-full w-full grid-cols-1 divide-y pt-12 md:divide-x md:divide-y-0",
    isPreview && "md:grid-cols-2",
    )`
- Don't write `export` before every function; just use a unified `export` at the end. For example export { xxx, xxx }
- Separate runtime exports and type exports. When a file exports both values and types, prefer `export { foo, bar }` plus `export type { Foo, Bar }` instead of mixing them in one export block.
- Do not write inline arrow functions as prop values in JSX, especially repeated ones. Extract them into named `useCallback` handlers so they are reusable, memoized, and easy to maintain.
- Unit tests are written in the same directory. Integration tests and end-to-end tests are written in the `tests` directory.

## UI/UX Design
- Use transition-colors duration-200 for Interaction & Cursor
- Responsive design needs to be considered.
- The overall style leans towards shadcnui, with white as the main color and black as the secondary color.
- Add loading interaction and button disabling for each data request
  
## Project Structure
```md
refract/
├── .github/                    # GitHub configuration (Actions workflows)
├── .husky/                     # Git hooks
├── .vscode/                    # VS Code editor settings
├── app/                        # Next.js 14+ App Router (pages & API routes)
│   └── api/                   # API endpoints
│   └── chat/                   # Chat page
│       └── compoents/          # Chat page components
├── atoms/                      # Jotai state management atoms
├── components/                 # React components
│   └── share/                  # Common compoents
│   └── ui/                     # ShadcnUI component library
├── infra                       # Backend infra (db, orm, ...)
├── constants/                  # Static constants
├── hooks/                      # Custom React hooks
├── i18n/                       # Internationalization (i18n) setup
├── lib/                        # Utility functions & helpers & agent design
├── messages/                   # Translation JSON files
├── public/                     # Static assets (images, SVGs)
├── services/                   # API service layer
├── styles/                     # Global CSS styles
└── types/                      # TypeScript type definitions
└── tests/                      # Test
│   └── e2e/                    # E2E test
│   └── integration/            # Integration test
```
