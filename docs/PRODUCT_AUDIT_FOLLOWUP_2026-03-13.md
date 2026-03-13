# Product Audit Follow-Up — 2026-03-13

This short follow-up reflects the state after the March 13, 2026 fix sequence for:

- remote media fetch hardening
- delegated search/research routing cleanup
- mobile settings parity
- compose-state deduplication
- stale text-model fallback cleanup
- BYOP key partial hardening
- manual availability governance centralization

## Confirmed Closed In This Pass

1. Remote media fetches are no longer open to arbitrary hosts.
2. Delegated search/research no longer double-calls upstream by default.
3. Compose state is shared across landing and chat handoff.
4. Mobile quick settings now expose the key parity controls that were missing.
5. Hidden legacy text-model fallbacks are no longer used as chat-layout defaults.
6. BYOP balance fetching no longer sends the bearer token directly from browser code to Pollinations.
7. Text-model visibility is now manually centralized instead of being inferred loosely from scattered UI consumers.

## Highest-Signal Remaining Risks

### 1. BYOP remains XSS-sensitive by architecture

The key still lives in web storage and is still readable by client JavaScript. The latest hardening reduced exposure and normalized the request path, but it did not eliminate the core storage risk.

Why this still matters:
- successful XSS still compromises the user key
- this remains the main unresolved security truth in the app

### 2. Active documentation can still drift faster than runtime changes

The codebase now has a cleaner runtime truth than before, but active docs still span multiple architecture summaries and product narratives.

Why this still matters:
- contributors can still update one “truth” doc and miss another
- drift is now more governance debt than runtime debt

### 3. Mobile and compact-surface UX still need a dedicated pass

The parity bug is fixed, but that is not the same as the compact UI being fully settled.

Why this still matters:
- density, wording, and discoverability on smaller screens still deserve focused review
- this is now a UX polish stream, not a blocking architecture problem

## Recommended Next Pass

1. UX/mobile-first audit pass
2. documentation-governance cleanup pass
3. optional architecture pass on whether `WebContextService` should remain after the search-routing cleanup
