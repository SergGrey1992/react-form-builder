# Выполнение

- Публичные контракты и runtime: реализованы, тесты прошли.
- RHF lifecycle, SSR/hydration, StrictMode, dynamic fields: проверены.
- Негативные compile-time тесты: неверные paths/types/props/slots, protected props, обязательные props, nested arrays, custom render, независимые wrapper props, transformed submit.
- Vite и Next.js + Ant Design + persistence примеры: собраны и проверены в браузере.
- CI: matrix React18/19, сборка примеров, packed consumer.
- Final review: independent reviewer. Fixed ref cleanup and required component props with RED→GREEN coverage.
- Ruling: inline implementation authorized by user, design/planning approval prompts skipped; no extra packages or worktree needed for empty independent repository.
- Ruling: local adapter overrides preserve factory prop contracts; new component contract needs new factory. This avoids a misleading change to compile-time slot types.
- Ruling: future arrays documented as separate discriminated nodes, not special registry field type, to avoid taking a custom adapter name.
