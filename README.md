# Roulette
Roulette is an app for livestream giveaways. Manage prizes on the fly and switch between normal and reversed odds.

## Table of Contents
- [Technologies](#technologies)
- [Usage](#usage)
- [Development](#development)
- [Contributing](#contributing)
- [To do](#to-do)

## Technologies

### Core 🏍️

- [Electron 37](https://www.electronjs.org)
- [Vite 7](https://vitejs.dev)

### DX 🛠️

- [TypeScript 5.8](https://www.typescriptlang.org)
- [Prettier](https://prettier.io)
- [ESLint 9](https://eslint.org)
- [Zod 4](https://zod.dev)
- [React Query (TanStack)](https://react-query.tanstack.com)

### UI 🎨

- [React 19](https://reactjs.org)
- [Tailwind 4](https://tailwindcss.com)
- [Shadcn UI](https://ui.shadcn.com)
- [Geist](https://vercel.com/font) as default font
- [i18next](https://www.i18next.com)
- [TanStack Router](https://tanstack.com/router)
- [Lucide](https://lucide.dev)

## Usage
Run the Roulette desktop app locally or build distributables from this repository.

Inside the app you can:

- Add new ones with a price and color, edit or delete them;
- Switch weighting modes to flip between inverted odds and classic proportional odds;
- Turn elimination mode on or off;
- Set how long each spin lasts.

## Development

### Requirements
- [Node.js](https://nodejs.org/) 20 LTS or newer (Electron 37 ships with Node 22; using Node ≥20 locally prevents tooling mismatches).
- npm 10+ (bundled with Node) or another compatible package manager.

### Setup
Install project dependencies:
```sh
npm install
```

### Run the desktop app in watch mode
```sh
npm start
```
This launches Electron Forge, which starts Vite for the renderer and rebuilds the main process on changes.

### Package build
To produce installable artifacts for your platform, run:
```sh
npm run make
```
Electron Forge outputs installers and archives to the `out/` directory. Use `npm run package` if you only need an unpacked app bundle.

### Code quality scripts
- `npm run lint` – run ESLint across the project.
- `npm run format` – check formatting with Prettier.
- `npm run format:write` – apply Prettier fixes in-place.

## Contributing
### Reporting issues
- Search existing GitHub issues before opening a new one to avoid duplicates.
- Include reproduction steps, screenshots or screen recordings when possible, plus your OS and app version (`npm start` vs packaged build).
- Label feature ideas clearly so we can distinguish them from bug reports.

### Pull requests
- Fork the repository, create a feature branch, and keep changes focused on one fix or enhancement.
- Run `npm test` and `npm run lint` before submitting; include new tests when you change behaviour.
- Describe the motivation, the solution, and any follow-up work in the PR template. Cross-link related issues so reviewers have full context.

### Why did you develop this project?
The application was developed for a streamer because there were no suitable tools available on the market.

## To do
- [x] MVP
- [ ] Refact project
- [ ] Add linter
- [ ] Rewrite CI/CD pipelines
- [ ] Implement i18
