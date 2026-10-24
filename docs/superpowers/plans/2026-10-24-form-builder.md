# Form Builder Implementation Plan

> Execute inline with superpowers:executing-plans. User authorized implementation directly.

**Goal:** самостоятельный npm пакет универсального RHF Form Builder.
**Architecture:** typed adapter + runtime context + configuration-bound Form/Slot.
**Tech Stack:** TypeScript, React 18/19, RHF 7.66+, tsdown, Vitest, RTL.
**Spec:** ../specs/2026-10-24-form-builder-design.md

## Constraints

React and RHF peer dependencies; ESM use client; no UI kit dependency; no state manager; native transformed generics.

## Review Focus

- StrictMode effect cleanup and duplicate slots.
- Loading must retain values, async submit must lock immediately.
- User callbacks cannot replace bindings; custom callback/ref must compose.
- Changing fields and field arrays must preserve native unregister semantics.
- SSR IDs and generic component props must remain honest.

## Tasks

- [x] 1. Add tests for automatic render, binding, slot override, provider, custom render, submit. Run red. Implement src/types.ts, adapter.ts, builder.tsx, index.ts; run green.
- [x] 2. Add tests for validation, blur/reset/setValue/watch, conditional fields, loading, duplicate slots, refs, SSR hydration. Run red for missing behavior; implement and verify.
- [x] 3. Add tests/types.tsx covering invalid names/types/props, exact slots, renders, and transformed submit. Run typecheck and correct public types.
- [x] 4. Create runnable examples/vite and examples/nextjs with Zod, native custom component, Ant Design, slots and provider. Build both.
- [x] 5. Add README, API/accessibility/arrays/persistence docs, ESLint/Prettier and CI matrix React 18/19. Run check, examples builds, pack consumer check and independent review; initialize independent repository and deliver.
