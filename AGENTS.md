# Architecture rules

- Keep credit-free read-only chat tools in the authenticated bot-query function with a shared deterministic router; tool reads must not depend on model inference.
- Enforce administrator-only tools on the server using the protected role RPC, and scope personal reads to the authenticated user even for administrators.
- Route runtime GitHub requests through the linked connector gateway; never expose connection credentials to the browser.