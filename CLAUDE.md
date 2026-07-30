Read the root ../CLAUDE.md and ../MOBILE_FEATURE_PARITY.md first — this project inherits all of RailLens's development principles (preserve architecture, incremental changes, ask before breaking changes, explain trade-offs).

## Mobile-specific rules

- This app is a full port of train-db-frontend, not a lightweight companion. Every implemented web feature needs an equivalent here unless there's a strong platform reason otherwise (see ../MOBILE_FEATURE_PARITY.md).
- Reuse train-db's REST API. Never re-implement backend business logic (search matching, scoring, graph analytics, validation rules) on-device. If mobile needs data the API doesn't expose, extend the backend first.
- Client-side-only web features (favorites, recent/popular searches, saved journeys, theme preference, admin key) are localStorage on web; mirror them here with MMKV (src/lib/storage.ts) for plain data and Keychain (src/lib/secureStorage.ts) for credentials (JWT, admin key) — never mix the two.
- Keep src/types/api.ts in sync with the backend's model/*.java records when either side changes a response shape.
- Feature-based structure: each src/features/<name>/ owns its api.ts + screens. Don't reach across feature folders except through exported stores/hooks.
- Features marked "Future"/"Coming Soon" on the web (FEATURE.md's ⏭️ items) stay future here too — don't build ahead of the web app's own roadmap.
