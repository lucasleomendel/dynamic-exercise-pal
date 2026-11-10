# Architecture rules

- Keep credit-free read-only chat tools in the authenticated bot-query function with a shared deterministic router; tool reads must not depend on model inference.
- Enforce administrator-only tools on the server using the protected role RPC, and scope personal reads to the authenticated user even for administrators.
- Route runtime GitHub requests through the linked connector gateway; never expose connection credentials to the browser.
- Route read-only chat intents locally before calling bot-query; stream model output through the server SDK and batch UI updates so ordinary coaching avoids extra round trips and per-token persistence.
- Use local session identity only for client cache-ownership checks; retain server authentication and RLS for authorization, preventing repeated remote identity reads without weakening account isolation.