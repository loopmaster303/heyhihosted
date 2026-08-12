# VACE Endpoint Recovery Design

## Objective

Restore VACE generation after the legacy `api.sharedservices.pruna.ai` hostname became a dangling DNS CNAME, and ensure future Pruna submit-network failures surface as an explicit upstream error instead of a generic internal server error.

## Evidence

- The live Next.js server logged `TypeError: fetch failed` caused by `getaddrinfo ENOTFOUND api.sharedservices.pruna.ai` for VACE.
- DNS resolves the hostname only to a dangling AWS ELB CNAME with no address record.
- Pruna's current Models API lists `vace` on the standard `https://api.pruna.ai/v1/predictions` endpoint using the `Model: vace` header.
- The existing VACE payload already matches the documented `size`, `frame_num`, `speed_mode`, sampling, seed, and `src_ref_images` contract.

## Design

VACE will use the same standard Pruna base URL as the other registered models. Since no model will use the shared endpoint afterward, the endpoint union and dead shared-base branch will be removed rather than retained as a fallback.

The initial prediction submission boundary will catch non-`ApiError` fetch failures and translate them to `ApiError(502, ..., 'PRUNA_NETWORK_ERROR')`. HTTP errors and all later polling behavior remain unchanged.

## Verification

- A registry test proves VACE uses the default endpoint.
- A client test proves VACE submits to `api.pruna.ai` and never the retired shared host.
- A client test proves a rejected submit fetch becomes `PRUNA_NETWORK_ERROR` with status 502.
- Focused Pruna tests, full Jest, lint, and diff checks run after implementation.

