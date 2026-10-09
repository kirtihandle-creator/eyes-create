# shortie reviewer notes

## Architecture
A zero-dependency CommonJS Node.js URL shortener, with an HTTP server, CLI, browser UI, and JSON-file persistence. `src/server.js` composes ordered route handlers; business logic lives in `src/services`, validation and code generation in `src/utils`, and browser assets in `public/`. Links are stored synchronously in `data/links.json` through `src/services/store.js`.

## Conventions
- Use CommonJS modules and explicit `module.exports`; services are classes (`src/services/store.js`, `src/services/shortener.js`) while routes/utilities export functions.
- Route handlers are composable functions receiving `(req, res, pathname)` and return `false` when they do not handle a request, or handle the response and return `true`; preserve this contract when adding routes (`src/routes/api.js`, `src/routes/redirect.js`).
- Register routes in intentional order in `src/server.js`: static files, API routes, then short-code redirects. A handler must not consume requests intended for later handlers.
- Keep persistence behind `Store`; mutations use `set()`/`save()` rather than directly writing the JSON file (`src/services/store.js`). `Shortener` owns URL validation, code allocation, hit increments, and public link operations (`src/services/shortener.js`).
- URLs are restricted to HTTP(S) by `isValidUrl`; short codes should be checked with `isValidCode` before lookup or mutation (`src/routes/api.js`, `src/routes/admin.js`, `src/routes/redirect.js`).
- Generated codes use the shared six-character alphabet in `src/utils/codegen.js`; it deliberately omits visually ambiguous characters such as `l`, `o`, `O`, `0`, `1`, and `I`.
- Configuration comes from environment variables with defaults in `src/config.js`; support `PORT`, `HOST`, and `DATA_FILE` rather than hard-coding deployment-specific paths.
- File-backed operations are synchronous by design, matching the small zero-dependency application (`Store`, `Analytics`, and admin import/export).

## Intentional non-standard choices
- Hit counts are stored directly on each link record and incremented during redirect resolution (`src/services/shortener.js`), rather than using a database or middleware.
- Admin authentication uses a Bearer token and constant-time comparison; unset `ADMIN_TOKEN` disables admin routes with a 404 (`src/routes/admin.js`).

## Watch out for
- `src/routes/admin.js` is currently not included in the `handlers` array in `src/server.js`; adding or changing admin functionality should verify route registration, not just handler implementation.
- Preserve path/file containment checks for static and admin file operations. Do not replace `safeDataPath()` with direct user-controlled paths (`src/routes/admin.js`).
- Do not trust imported records: imports must continue validating codes and URLs and normalizing hit counts (`src/routes/admin.js`).
- Avoid bypassing `Shortener.resolve()` for redirects, since it is responsible for incrementing and persisting hit counts.
- New API handlers should use `readBody()` and return JSON through `sendJson()` with the established status/error conventions (`src/routes/api.js`).