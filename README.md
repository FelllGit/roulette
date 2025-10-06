# Roulette
The Roulette app was created to introduce reversible slot weighting and a knockout gameplay mode, adding a dynamic and fair twist to the traditional roulette experience.

## Table of Contents
- [Technologies](#technologies)
- [Usage](#usage)
- [Development](#development)
- [Testing](#testing)
- [Deploy and CI/CD](#deploy-and-cicd)
- [Contributing](#contributing)
- [FAQ](#faq)
- [To do](#to-do)
- [Team](#team)
- [Sources](#sources)

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

### Run locally
```sh
npm install
npm start
```
`npm start` compiles the renderer with Vite and launches the Electron window. If the window does not appear automatically, run the command again.

Inside the app:
- Use the right-hand panel to add new items, edit existing ones, and remove entries from the wheel.
- Toggle `Зворотня вага` / `Нормальна вага` in the header to switch between reversed (cheaper items get higher odds) and normal weighting.
- Enable or disable knockout gameplay with the `Режим вибування` control.
- Choose a spin duration, then press `Крутити рулетку!` to spin. Results are kept in the history list so you can track the last winners.

### Package build
To produce installable artifacts for your platform, run:
```sh
npm run make
```
Electron Forge outputs installers and archives to the `out/` directory. Use `npm run package` if you only need an unpacked app bundle.

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
This launches Electron Forge, which starts Vite for the renderer and rebuilds the main process on changes. Restart the command if the Electron window closes while you are developing.

### Build renderer and main bundles
```sh
npm run build
```
The build task prepares production bundles in the `.vite/build/` directory without packaging installers. Use it to verify tree-shaking or to debug production-only issues.

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
