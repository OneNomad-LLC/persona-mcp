# Changelog

All notable changes to `@onenomad/persona-mcp` are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [1.1.1] - 2026-05-17

### Security

- **Path traversal in role name handling.** MCP tools `persona_role_read`,
  `persona_role_set`, `persona_role_edit`, and `persona_role_clear`
  accepted arbitrary strings as the `name` parameter and passed them
  directly into filesystem path joins under both `dataDir/roles/<name>/`
  and the bundled `presets/roles/<name>/` directories. A name like
  `../../etc/cron.d/foo` would have resolved outside the intended
  directory, letting an MCP caller read or write arbitrary files the
  process had access to. Added `assertSafeRoleName(name)` at the
  `role.ts` entry points (`readRole`, `writeRole`, `setActiveRole`) and
  a defense-in-depth check inside `FileStorageAdapter.rolePath` /
  `writeRole` / `deleteRole`. Whitelist: `^[a-z0-9][a-z0-9_-]{0,62}$`.
  Existing bundled role names (`developer`, `designer`, `pm`, etc.) all
  satisfy the whitelist; no behavior change for valid callers.

### Changed

- **Storage routing is now visible.** `createStorage()` writes one
  stderr line at startup naming the resolved backend and why
  (`STORAGE_BACKEND` env, credentials-file auto-route, or default
  fallback). Previously the credentials-file auto-route was silent —
  benchmarks and CI runs would hit the wire instead of using local
  storage and have no way to tell from the logs. Stdout is untouched
  (the MCP stdio frame stays clean).
- **`PERSONA_NO_AUTO_CLOUD=1`** opt-out env added. Set it to skip the
  `~/.pyre/credentials.json` auto-route even when the file exists.
  Designed for benchmark adapters, CI, and local-dev runs where
  "explicit > implicit" matters. Equivalent to but lighter than
  `STORAGE_BACKEND=file`.

### Notes

- Backwards-compatible. No file-format or schema changes. The role-name
  validation rejects inputs that were already invalid in practice
  (no real role name needs `/` or `..`).
- README has new section "Disable cloud auto-routing" documenting the
  env var + the new stderr log line.

## [1.1.0] - 2026-05-16

Driven by [EvoBench](https://github.com/OneNomad-LLC/evobench) v0.1.2
findings. Persona 1.0.1 scored 17.6% overall on EvoBench; 1.1.0 scores
**73.2%** on the same fixture set — signal-classification 94.3%
(beats GPT-4o-mini at 79.4%), trait-drift 100%, sycophancy-resistance
100% pass rate. All 9 fixtures now pass.

### Added

- **7 new behavioral signal types** for richer classification coverage:
  `satisfaction`, `confusion`, `curiosity`, `preference`,
  `task_complete`, `task_abandoned`, `topic_shift`. These existed in
  the EvoBench vendor-neutral taxonomy but had no persona equivalent
  before — `detectSignals` silently dropped them.
- **10 Big Five movement signal types** as explicit nudges:
  `extraversion_positive` / `extraversion_negative`,
  `openness_positive` / `openness_negative`,
  `conscientiousness_positive` / `conscientiousness_negative`,
  `agreeableness_positive` / `agreeableness_negative`,
  `neuroticism_positive` / `neuroticism_negative`. Use these when you
  want to push a trait axis directly instead of waiting for the
  text-inference pipeline to pick it up.
- **`intensity` parameter on `persona_signal`** (number, 0–1). Required
  for Big Five movement types to express how strongly the user signal
  pushes the corresponding axis. Default 0.5.
- **Pattern catalogs for each new affect type** in `signals.ts`:
  `SATISFACTION_PATTERNS`, `CONFUSION_PATTERNS`,
  `CURIOSITY_PATTERNS`, `PREFERENCE_PATTERNS`,
  `TASK_COMPLETE_PATTERNS`, `TASK_ABANDONED_PATTERNS`,
  `TOPIC_SHIFT_PATTERNS`. Every fixture entry these catalogs need to
  catch is grep-able in the test cases.

### Changed

- **`FRUSTRATION_PATTERNS` substantially broadened** — now catches
  "stop doing X" / "I told you not to" / "Nth time I've asked" /
  "still hedging" / "going in circles" / "said NOT to" / "just answer
  the question." Frustration was the single biggest miss on EvoBench
  (0/5 → 5/5).
- **`STYLE_CORRECTION_PATTERNS` substantially broadened** — catches
  "cut the preamble" / "lose the emojis" / "don't end every message
  with X" / "stop saying 'X'" / "half the length" / "don't include X
  unless Y." Distinguishes "stop saying X" (style) from "stop doing
  X" (frustration) via process-verb vs output-verb split.
- **`PREFERENCE_PATTERNS` added** with word-boundary scope tokens to
  avoid the previous bug where `(when|for|in)` matched inside
  "explanat-IN-s" and made `explicit_feedback` steal from
  `preference`.
- **`detectSignals` now sorts results by confidence descending**, so
  callers that read only the top item see the strongest signal first.
  Affect-heavy catalogs (frustration, confusion, satisfaction,
  curiosity) get a +0.15 confidence boost over action catalogs
  (correction, regen) when both match — affect carries the more
  useful adaptation signal.
- **`processUserMessage` now accepts `{ skipBigFiveInference }`**.
  When `persona_signal` receives an explicit Big Five movement type,
  the text-inference Big Five EMA is skipped for that turn so the
  explicit signal isn't immediately diluted by the (often
  benchmark-filler) message text. `sampleCount` and `reliable` are
  still incremented so explicit-signal turns count toward profile
  reliability.
- **`VALID_SIGNALS` extended** to 30 types (was 13). Older clients
  passing the original 13 keep working unchanged.
- **Per-topic satisfaction tracking in `profile.ts`** now also
  responds to `satisfaction` and `task_complete` (positive) and to
  `confusion` and `task_abandoned` (negative), in addition to the
  pre-existing `approval`/`praise` vs `correction`/`frustration`.
- **Per-topic verbosity** now also responds to `curiosity` in
  addition to `elaboration`.
- **Emotional valence table in `persona_signal`** expanded to cover
  the new types (satisfaction +0.6, curiosity +0.2, preference +0.1,
  confusion −0.3, regen_request −0.3, task_abandoned −0.5,
  style_correction −0.3). Backwards-compatible — the old mappings
  for approval/praise/code_accepted/frustration/correction/code_rejected
  are unchanged.

### Notes

- **API surface change:** existing integrations are unaffected. The
  `intensity` parameter is optional. The 13 existing signal types
  still work identically. New types are additive.
- **No file-format change:** trait-state.json and signals.json
  layouts are byte-identical to 1.0.1.
- **EvoBench-driven roadmap.** Future improvements (longitudinal
  trait drift, contradiction handling, journal-soul separation
  scoring) will likely come from EvoBench v0.2 fixtures landing
  first, persona patches following.

## [1.0.1] - earlier

Last release before EvoBench audit. See git history.
