# Phase 7: Client Portal - Research

**Researched:** 2026-03-27
**Domain:** E2E encrypted real-time messaging, client portal UX, appointment scheduling
**Confidence:** HIGH

## Summary

Phase 7 builds the client-facing portal: a secure shared space for messaging, document exchange, case tracking, and appointment requests. The core technical challenge is E2E encrypted real-time messaging using the existing libsodium X25519 keypairs from Phase 1. The project already has all cryptographic primitives needed -- `crypto_box_keypair()` keys are fully compatible with `crypto_kx_*` session key derivation functions in libsodium-wrappers-sumo.

For real-time delivery, Server-Sent Events (SSE) via Next.js Route Handlers is the correct choice. The project deploys on OVHcloud (not Vercel), so WebSocket would technically work, but SSE is simpler, more resilient, and sufficient for a messaging app where the server only needs to push new messages to connected clients (sending messages happens via server actions). tRPC is NOT installed in this project and the entire codebase uses server actions -- adding tRPC just for subscriptions would be a major architectural change that is not justified for this phase.

The portal layout shares the existing `(app)/layout.tsx` structure but needs role-conditional sidebar navigation. The existing `requireAvocat()` pattern becomes the template for a `requireClient()` and `requireAuth()` helper. All 14 locked decisions from CONTEXT.md are implementable with the current stack.

**Primary recommendation:** Use SSE via Next.js Route Handlers for real-time message delivery, server actions for sending messages, and `crypto_kx_client_session_keys`/`crypto_kx_server_session_keys` from the existing libsodium-wrappers-sumo to derive per-conversation shared encryption keys from existing user keypairs.

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- **D-01:** Chat temps reel (WebSocket ou SSE). Interface type conversation avec bulles, indicateur de frappe. Messages instantanés.
- **D-02:** Pieces jointes fichiers + images dans les messages. Reutilise le pipeline d'upload chiffre de Phase 2 (file-dropzone, XChaCha20-Poly1305).
- **D-03:** Accuses de lecture optionnels -- l'avocat active/desactive dans ses parametres (page /settings/cabinet existante). "Lu" discret sous le message quand active.
- **D-04:** Chiffrement X25519 key exchange. Chaque user a deja un keypair (Phase 1). Deriver une cle partagee par conversation. Messages chiffres XChaCha20-Poly1305. Pattern Signal simplifie.
- **D-05:** Notifications nouveaux messages : email immediat si pas en ligne + badge/compteur de messages non lus in-app. Reutilise React Email.
- **D-06:** Le client voit le statut actuel (Nouveau/En cours/Termine) et la timeline des evenements. PAS le score de qualification ni les notes internes.
- **D-07:** Multi-dossiers : un client peut avoir plusieurs dossiers en parallele. Liste de dossiers dans le portail.
- **D-08:** Le client retrouve tous ses documents uploades avec possibilite de retelechargement.
- **D-09:** Demande libre avec preferences : le client indique ses disponibilites via un formulaire. L'avocat confirme ou propose un creneau manuellement. Pas de calendrier synchronise en v1.
- **D-10:** Deux types de rendez-vous : visio (lien genere automatiquement) et presentiel (adresse du cabinet). L'avocat configure ses options dans les parametres.
- **D-11:** Rappels email J-1 et J-0. Templates React Email.
- **D-12:** Dashboard client avec sidebar : page d'accueil avec resume + sidebar.
- **D-13:** Layout partage avec le dashboard avocat + theme different. Meme structure mais sidebar adaptee au role.
- **D-14:** Indicateurs de securite discrets : cadenas, badge "Connexion securisee".

### Claude's Discretion
- Recherche dans l'historique des messages : optimiser selon les contraintes E2E (recherche locale cote client si possible)
- Choix technique WebSocket vs SSE pour le temps reel
- Pattern de stockage des messages chiffres cote serveur
- Gestion de la pagination/chargement des messages anciens

### Deferred Ideas (OUT OF SCOPE)
- Calendrier synchronise type Calendly (integration Google Calendar / Outlook)
- Messages vocaux (enregistrement audio + chiffrement)
- Notifications push browser (Web Push API)
- Visioconference integree (WebRTC) -- v1 genere juste un lien externe
- Recherche full-text cote serveur des messages (incompatible E2E actuel)
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| PORT-01 | Client and lawyer can exchange end-to-end encrypted messages | X25519 key exchange via crypto_kx_* with existing keypairs, XChaCha20-Poly1305 per-message encryption, SSE for real-time delivery |
| PORT-02 | Client and lawyer can share documents securely within the portal | Reuse Phase 2 file-dropzone + XChaCha20-Poly1305 upload pipeline, attach encrypted files to messages |
| PORT-03 | Client can track case status and progress updates | Client-facing read-only view of intakeSubmissions.status + simplified timeline from caseTimelines |
| PORT-04 | Client can request appointment with availability preferences, lawyer confirms manually | New appointments table, form with date preferences + type selection, manual confirmation workflow |
</phase_requirements>

## Standard Stack

### Core (already installed)

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| libsodium-wrappers-sumo | latest | E2E encryption + key exchange | Already installed. crypto_kx_* functions available in sumo build. crypto_box_keypair keys from Phase 1 are compatible with crypto_kx_* |
| Next.js | 16.x | App Router + Route Handlers for SSE | Already installed. Route Handlers support ReadableStream for SSE |
| Drizzle ORM | latest | New schemas (conversations, messages, appointments) | Already installed. Schema-as-code pattern established |
| React Email + Resend | latest | New message notifications, appointment reminders | Already installed in packages/email/ |
| react-hook-form | latest | Appointment request form | Already installed |
| date-fns | 4.x | Date formatting, relative times, appointment display | Already installed |
| react-day-picker | 9.x | Calendar date picker for appointment preferences | Already installed |
| shadcn/ui | CLI v4 | New components: scroll-area, avatar, form, collapsible | Already installed. See UI-SPEC for component inventory |

### New Components to Install

| Component | Install Command | Purpose |
|-----------|----------------|---------|
| scroll-area | `pnpm dlx shadcn@latest add scroll-area` | Chat message list scrollable container |
| avatar | `pnpm dlx shadcn@latest add avatar` | User avatars in messages and case list |
| form | `pnpm dlx shadcn@latest add form` | Appointment request form (react-hook-form integration) |
| collapsible | `pnpm dlx shadcn@latest add collapsible` | Sidebar mobile menu, expandable sections |

### Not Adding

| Library | Reason |
|---------|--------|
| tRPC | NOT installed in project. Entire codebase uses server actions. Adding tRPC just for SSE subscriptions would be a massive architectural change. Use native EventSource + Route Handlers instead. |
| Socket.io / ws | SSE sufficient for this use case. Messages sent via server actions (client->server). SSE for server->client push. Simpler, no WebSocket server needed. |
| Pusher / Ably | External service, data leaves EU. Self-hosted SSE keeps data sovereign on OVHcloud. |

## Architecture Patterns

### Recommended Project Structure

```
apps/web/src/
  app/(app)/
    layout.tsx                    # MODIFY: role-conditional sidebar
    portail/                      # NEW: client portal route group
      page.tsx                    # Client dashboard (accueil)
      dossiers/
        page.tsx                  # Case list
        [id]/page.tsx             # Case detail with tabs
      messages/
        page.tsx                  # Conversation list + chat
      rendez-vous/
        page.tsx                  # Appointments
      documents/
        page.tsx                  # All documents
      parametres/
        page.tsx                  # Client settings
    api/
      sse/messages/route.ts       # SSE endpoint for real-time messages
  server/actions/
    portal.actions.ts             # Client-facing server actions (requireClient guard)
    messaging.actions.ts          # Message CRUD (both roles)
    appointment.actions.ts        # Appointment request/confirm/cancel
  components/
    portal/                       # Client portal components
      client-sidebar.tsx
      dashboard-summary.tsx
      case-list-client.tsx
      case-status-tracker.tsx
    chat/                         # Shared messaging components
      chat-container.tsx
      chat-bubble.tsx
      chat-input.tsx
      typing-indicator.tsx
      encryption-badge.tsx
      unread-badge.tsx
    appointments/
      appointment-request-form.tsx
      appointment-card.tsx
      appointment-status-badge.tsx
  lib/
    db/schema/
      messaging.ts                # conversations, messages tables
      appointments.ts             # appointments table
    sse/
      message-emitter.ts          # EventEmitter for SSE message broadcasting
  hooks/
    use-sse-messages.ts           # Client hook for SSE subscription
    use-typing-indicator.ts       # Debounced typing state
packages/crypto/src/
  key-exchange.ts                 # NEW: crypto_kx wrapper for conversation key derivation
```

### Pattern 1: E2E Encrypted Messaging with X25519 Key Exchange

**What:** Derive a per-conversation shared secret from each user's existing X25519 keypair. Encrypt every message client-side before sending to server. Server stores only ciphertext.

**When to use:** Every message send/receive operation.

**Architecture:**

```
Client A (sender)                     Server                    Client B (receiver)
    |                                    |                           |
    | 1. Fetch B's publicKey             |                           |
    |<---------------------------------->|                           |
    | 2. crypto_kx_client_session_keys   |                           |
    |    (A.pub, A.priv, B.pub)          |                           |
    |    -> sharedTx key                 |                           |
    | 3. encrypt(msg, sharedTx)          |                           |
    | 4. POST encrypted message          |                           |
    |----------------------------------->|                           |
    |                                    | 5. Store ciphertext+nonce |
    |                                    | 6. SSE push to B          |
    |                                    |-------------------------->|
    |                                    |    7. crypto_kx_server_session_keys
    |                                    |       (B.pub, B.priv, A.pub)
    |                                    |       -> sharedRx key
    |                                    |    8. decrypt(ciphertext, sharedRx)
```

**Example (key exchange wrapper):**

```typescript
// packages/crypto/src/key-exchange.ts
import sodium from "libsodium-wrappers-sumo";

export interface ConversationKeys {
  rx: Uint8Array; // Key to decrypt received messages
  tx: Uint8Array; // Key to encrypt sent messages
}

/**
 * Derive conversation keys for the "client" role in the exchange.
 * The first user to create the conversation is the "client".
 * crypto_box_keypair keys are compatible with crypto_kx_* functions.
 */
export async function deriveClientKeys(
  myPublicKey: Uint8Array,
  mySecretKey: Uint8Array,
  theirPublicKey: Uint8Array,
): Promise<ConversationKeys> {
  await sodium.ready;
  const { sharedRx, sharedTx } = sodium.crypto_kx_client_session_keys(
    myPublicKey,
    mySecretKey,
    theirPublicKey,
  );
  return { rx: sharedRx, tx: sharedTx };
}

/**
 * Derive conversation keys for the "server" role in the exchange.
 * The second participant uses this.
 */
export async function deriveServerKeys(
  myPublicKey: Uint8Array,
  mySecretKey: Uint8Array,
  theirPublicKey: Uint8Array,
): Promise<ConversationKeys> {
  await sodium.ready;
  const { sharedRx, sharedTx } = sodium.crypto_kx_server_session_keys(
    myPublicKey,
    mySecretKey,
    theirPublicKey,
  );
  return { rx: sharedRx, tx: sharedTx };
}
```

**Critical detail:** The "client" and "server" roles in `crypto_kx_*` are not about HTTP client/server -- they are about which party initiated the conversation. The conversation record must store which user is the "initiator" (client role) and which is the "responder" (server role) so each side uses the correct derivation function. `client_tx === server_rx` and `client_rx === server_tx`.

### Pattern 2: SSE Real-Time Delivery via Route Handler

**What:** Server pushes new messages to connected clients via Server-Sent Events. Messages are sent via server actions (HTTP POST). No WebSocket needed.

**When to use:** Real-time message delivery, typing indicators, read receipts.

**Example (SSE endpoint):**

```typescript
// apps/web/src/app/api/sse/messages/route.ts
import { auth } from "@/lib/auth";
import { messageEmitter } from "@/lib/sse/message-emitter";

export async function GET(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return new Response("Unauthorized", { status: 401 });
  }

  const userId = session.user.id;
  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    start(controller) {
      // Send initial connection event
      controller.enqueue(
        encoder.encode(`data: ${JSON.stringify({ type: "connected" })}\n\n`)
      );

      // Listen for messages targeted at this user
      const onMessage = (data: unknown) => {
        controller.enqueue(
          encoder.encode(`data: ${JSON.stringify(data)}\n\n`)
        );
      };

      messageEmitter.on(`user:${userId}`, onMessage);

      // Heartbeat every 30s to keep connection alive
      const heartbeat = setInterval(() => {
        controller.enqueue(encoder.encode(`: heartbeat\n\n`));
      }, 30000);

      // Cleanup on disconnect
      request.signal.addEventListener("abort", () => {
        messageEmitter.off(`user:${userId}`, onMessage);
        clearInterval(heartbeat);
        controller.close();
      });
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}
```

**Client-side hook:**

```typescript
// apps/web/src/hooks/use-sse-messages.ts
"use client";
import { useEffect, useCallback, useRef } from "react";

export function useSSEMessages(onMessage: (data: unknown) => void) {
  const eventSourceRef = useRef<EventSource | null>(null);

  const connect = useCallback(() => {
    const es = new EventSource("/api/sse/messages");

    es.onmessage = (event) => {
      const data = JSON.parse(event.data);
      onMessage(data);
    };

    es.onerror = () => {
      es.close();
      // Auto-reconnect after 3s
      setTimeout(connect, 3000);
    };

    eventSourceRef.current = es;
  }, [onMessage]);

  useEffect(() => {
    connect();
    return () => eventSourceRef.current?.close();
  }, [connect]);
}
```

### Pattern 3: Role-Conditional Layout

**What:** Shared app layout with sidebar content that changes based on user role (avocat vs client).

**When to use:** The `(app)/layout.tsx` must serve both `/dashboard` (lawyer) and `/portail` (client) routes.

**Approach:**

```typescript
// apps/web/src/app/(app)/layout.tsx
export default async function AppLayout({ children }) {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const isClient = session.user.role === "client";
  const isAvocat = session.user.role === "avocat";

  return (
    <div className="flex min-h-screen">
      {/* Sidebar: conditional on role */}
      <aside className="hidden border-r bg-card lg:block lg:w-60">
        {isAvocat ? <AvocatSidebar /> : <ClientSidebar />}
      </aside>
      {/* Main content */}
      <div className="flex flex-1 flex-col">
        <header className="border-b bg-card px-6 py-3">
          {/* Shared header with security badge */}
        </header>
        <main className="flex-1 px-6 py-8">{children}</main>
      </div>
    </div>
  );
}
```

### Pattern 4: Auth Guards (requireClient / requireAuth)

**What:** Mirror the existing `requireAvocat()` pattern for client-facing actions.

```typescript
async function requireClient() {
  const session = await auth();
  if (!session?.user?.id) {
    return { authorized: false as const, error: "not_authenticated" };
  }
  if (session.user.role !== "client") {
    return { authorized: false as const, error: "unauthorized" };
  }
  return { authorized: true as const, userId: session.user.id, session };
}

// For actions accessible by both roles
async function requireAuth() {
  const session = await auth();
  if (!session?.user?.id) {
    return { authorized: false as const, error: "not_authenticated" };
  }
  return { authorized: true as const, userId: session.user.id, role: session.user.role, session };
}
```

### Anti-Patterns to Avoid

- **Storing plaintext messages on server:** Server MUST only store ciphertext + nonce. No plaintext, no searchable index.
- **Deriving shared keys on server:** Key exchange MUST happen client-side only. Server never sees private keys or shared secrets.
- **Using crypto_box directly for messages:** Use `crypto_kx_*` to derive session keys, then `crypto_secretbox_easy` (XChaCha20-Poly1305) for each message. This is more efficient than `crypto_box_easy` per-message.
- **Sending notifications with message content:** Email notifications say "Vous avez un nouveau message" -- NEVER include decrypted message content in emails.
- **Dual EventSource connections:** One SSE connection per user, multiplexing all event types (messages, typing, read receipts).

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Key exchange | Manual scalar multiplication | `sodium.crypto_kx_client_session_keys` / `server_session_keys` | Handles BLAKE2b hashing of shared secret with public keys, produces directional keys |
| SSE reconnection | Manual retry logic | Native `EventSource` auto-reconnect + 3s fallback | EventSource has built-in reconnection; add manual fallback for error cases |
| Typing debounce | Raw setTimeout | Debounce utility (2s window per D-03 context) | Edge cases: rapid typing, disconnect during typing state |
| Date formatting | Manual date strings | `date-fns` `formatRelative`, `format`, `formatDistanceToNow` | Already installed, handles French locale |
| Calendar picker | Custom date selector | react-day-picker (already installed) via shadcn calendar | Already in project, accessible, keyboard-navigable |
| Scroll anchoring | Manual scroll position tracking | CSS `overflow-anchor: auto` + scroll-area component | Browser-native scroll anchoring handles most cases |
| File attachments in chat | New upload pipeline | Reuse existing `file-dropzone.tsx` + `upload.actions.ts` pipeline from Phase 2 | Already handles encryption, S3 upload, SSE-C |

## Common Pitfalls

### Pitfall 1: Wrong crypto_kx Role Assignment
**What goes wrong:** Both parties use `crypto_kx_client_session_keys` or both use `crypto_kx_server_session_keys`. Messages can't be decrypted.
**Why it happens:** The crypto_kx "client"/"server" terminology is confusing -- it has nothing to do with HTTP roles.
**How to avoid:** Store `initiatorId` in the conversation record. The initiator always uses `client_session_keys`, the other party uses `server_session_keys`. Determine role by comparing `userId === conversation.initiatorId`.
**Warning signs:** Decryption failures only happen in one direction (A can read B's messages but B can't read A's).

### Pitfall 2: SSE Connection Limits
**What goes wrong:** Browser has a limit of 6 concurrent HTTP connections per domain (HTTP/1.1). Multiple tabs exhaust the limit.
**Why it happens:** Each EventSource opens a persistent connection.
**How to avoid:** Use HTTP/2 (multiplexing, no 6-connection limit) on the deployment server. Add tab visibility detection to close SSE when tab is hidden and reconnect on focus.
**Warning signs:** App stops loading resources after 6+ tabs are open.

### Pitfall 3: Private Key Not Available Client-Side
**What goes wrong:** User logs in on new device, private key is not in IndexedDB. Can't decrypt messages.
**Why it happens:** Private keys are stored in IndexedDB (Phase 1 decision), browser-local. New device = empty IndexedDB.
**How to avoid:** Detect missing private key on portal load. Prompt for recovery phrase (BIP39 from Phase 1) to restore the private key from the encrypted recovery bundle in the DB.
**Warning signs:** "Decryption failed" errors after login on new device.

### Pitfall 4: Optimistic Message Ordering
**What goes wrong:** Messages appear out of order when network is slow. Optimistic insert at bottom, server confirmation arrives late.
**Why it happens:** Optimistic UI adds message immediately, but SSE delivers server-confirmed messages in server order.
**How to avoid:** Use a `clientMessageId` (UUID) for optimistic messages. When SSE delivers the server-confirmed version, replace the optimistic entry by matching `clientMessageId`. Sort by server timestamp once confirmed.
**Warning signs:** Duplicate messages or messages jumping positions.

### Pitfall 5: Memory Leak in SSE EventSource
**What goes wrong:** EventSource listeners accumulate on re-renders, causing memory leaks and duplicate handlers.
**Why it happens:** React useEffect cleanup not properly removing listeners.
**How to avoid:** Store EventSource in a ref. Always close in cleanup. Use a single `useSSEMessages` hook at a high level, not per-component.
**Warning signs:** Multiple "connected" events in console, messages appearing multiple times.

### Pitfall 6: Missing Conversation Key Cache
**What goes wrong:** Every message decryption triggers `crypto_kx_*` derivation + IndexedDB private key read. Chat scroll becomes sluggish.
**Why it happens:** Key derivation is CPU-intensive (BLAKE2b hash).
**How to avoid:** Cache derived conversation keys in memory (React state or module-level Map) for the session. Re-derive only when conversation changes or on fresh page load.
**Warning signs:** Noticeable lag when scrolling through message history.

## Code Examples

### Database Schema: Conversations and Messages

```typescript
// apps/web/src/lib/db/schema/messaging.ts
import { pgTable, text, timestamp, integer } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { users } from "./auth";
import { intakeSubmissions } from "./intake";

export const conversations = pgTable("conversations", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  submissionId: text("submission_id").notNull().references(() => intakeSubmissions.id),
  clientId: text("client_id").notNull().references(() => users.id),
  avocatId: text("avocat_id").notNull().references(() => users.id),
  // Who initiated the conversation (determines crypto_kx role)
  initiatorId: text("initiator_id").notNull().references(() => users.id),
  lastMessageAt: timestamp("last_message_at", { mode: "date" }),
  createdAt: timestamp("created_at", { mode: "date" }).defaultNow().notNull(),
});

export const messages = pgTable("messages", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  conversationId: text("conversation_id").notNull().references(() => conversations.id),
  senderId: text("sender_id").notNull().references(() => users.id),
  // Encrypted content (ciphertext as base64)
  encryptedContent: text("encrypted_content").notNull(),
  nonce: text("nonce").notNull(), // base64-encoded nonce
  // Optional file attachment
  attachmentId: text("attachment_id"), // references intake_documents.id
  // Client-generated UUID for optimistic UI dedup
  clientMessageId: text("client_message_id"),
  // Read tracking
  readAt: timestamp("read_at", { mode: "date" }),
  createdAt: timestamp("created_at", { mode: "date" }).defaultNow().notNull(),
});
```

### Database Schema: Appointments

```typescript
// apps/web/src/lib/db/schema/appointments.ts
import { pgTable, text, timestamp } from "drizzle-orm/pg-core";
import { users } from "./auth";
import { intakeSubmissions } from "./intake";

export const appointments = pgTable("appointments", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  submissionId: text("submission_id").notNull().references(() => intakeSubmissions.id),
  clientId: text("client_id").notNull().references(() => users.id),
  avocatId: text("avocat_id").notNull().references(() => users.id),
  type: text("type", { enum: ["visio", "presentiel"] }).notNull(),
  status: text("status", { enum: ["en_attente", "confirme", "refuse", "passe"] })
    .default("en_attente").notNull(),
  // Client preferences (stored as JSON)
  preferredDates: text("preferred_dates").notNull(), // JSON: string[] (ISO dates)
  preferredSlots: text("preferred_slots").notNull(), // JSON: string[] ("matin"|"apres_midi"|"fin_journee")
  notes: text("notes"),
  // Confirmed details (set by lawyer)
  confirmedDate: timestamp("confirmed_date", { mode: "date" }),
  visioLink: text("visio_link"), // Auto-generated for visio type
  cabinetAddress: text("cabinet_address"), // From lawyer profile for presentiel
  rejectionReason: text("rejection_reason"),
  createdAt: timestamp("created_at", { mode: "date" }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { mode: "date" }).defaultNow().notNull(),
});
```

### Client-Side Message Encryption

```typescript
// Encrypt a message before sending
async function encryptMessage(
  plaintext: string,
  conversationKeys: ConversationKeys,
): Promise<{ ciphertext: string; nonce: string }> {
  await sodium.ready;
  const plaintextBytes = sodium.from_string(plaintext);
  const nonce = sodium.randombytes_buf(sodium.crypto_secretbox_NONCEBYTES);
  const ciphertext = sodium.crypto_secretbox_easy(
    plaintextBytes,
    nonce,
    conversationKeys.tx, // Use tx key for sending
  );
  return {
    ciphertext: sodium.to_base64(ciphertext, sodium.base64_variants.ORIGINAL),
    nonce: sodium.to_base64(nonce, sodium.base64_variants.ORIGINAL),
  };
}

// Decrypt a received message
async function decryptMessage(
  ciphertextB64: string,
  nonceB64: string,
  conversationKeys: ConversationKeys,
): Promise<string> {
  await sodium.ready;
  const ciphertext = sodium.from_base64(ciphertextB64, sodium.base64_variants.ORIGINAL);
  const nonce = sodium.from_base64(nonceB64, sodium.base64_variants.ORIGINAL);
  const plaintext = sodium.crypto_secretbox_open_easy(
    ciphertext,
    nonce,
    conversationKeys.rx, // Use rx key for receiving
  );
  return sodium.to_string(plaintext);
}
```

### SSE Message Emitter (Server-Side)

```typescript
// apps/web/src/lib/sse/message-emitter.ts
import { EventEmitter } from "events";

// Singleton emitter for the process
// In production with multiple workers, replace with Valkey pub/sub
export const messageEmitter = new EventEmitter();
messageEmitter.setMaxListeners(1000); // Support many concurrent connections

export type SSEEvent =
  | { type: "new_message"; conversationId: string; messageId: string; senderId: string; encryptedContent: string; nonce: string; createdAt: string }
  | { type: "typing"; conversationId: string; userId: string; name: string }
  | { type: "read_receipt"; conversationId: string; messageId: string; readBy: string }
  | { type: "unread_count"; count: number };
```

## Discretion Recommendations

### WebSocket vs SSE: Use SSE
**Recommendation:** SSE via Next.js Route Handlers.
**Rationale:**
- Messages are sent via server actions (client -> server = HTTP POST). Only server -> client needs real-time push.
- SSE is one-way (server to client), which matches this use case perfectly.
- Native `EventSource` API handles reconnection automatically.
- No additional server infrastructure (no WebSocket upgrade, no ws library).
- Typing indicators and read receipts are lightweight enough for SSE.
- If scaling beyond a single process, add Valkey pub/sub behind the EventEmitter.

### Message Storage Pattern
**Recommendation:** Store encrypted messages in PostgreSQL with the schema above. Each message row contains `encrypted_content` (base64 ciphertext), `nonce` (base64), `sender_id`, and `conversation_id`. The server NEVER has access to plaintext.

### Message Search
**Recommendation:** Client-side search only. After decrypting messages into memory, use `String.includes()` or `Intl.Segmenter` for searching. Limited to currently loaded messages. This is a known limitation of E2E encryption -- acceptable for v1.

### Pagination Strategy
**Recommendation:** Cursor-based pagination with `createdAt` as cursor. Load 50 messages initially, load 50 more on scroll-to-top. Use the scroll-area component with a "load more" skeleton at the top. Decrypt messages in batches as they load.

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| WebSocket for all real-time | SSE for unidirectional push | 2024-2025 (serverless era) | Simpler infra, no WS server |
| crypto_box per-message | crypto_kx session keys + secretbox | Libsodium best practice | More efficient: derive once, encrypt many |
| tRPC subscriptions | Server Actions + SSE Route Handler | Project-specific (no tRPC installed) | Avoids adding major dependency for one feature |

## Open Questions

1. **Valkey pub/sub for multi-process SSE**
   - What we know: EventEmitter works for single-process. Production may need multiple workers.
   - What's unclear: Whether OVHcloud K8s deployment will use multiple replicas of the Next.js process.
   - Recommendation: Start with in-process EventEmitter. Add Valkey pub/sub layer when scaling to multiple replicas. The abstraction (messageEmitter) makes this swap easy.

2. **Visio link generation for appointments**
   - What we know: D-10 says "lien genere automatiquement" for visio appointments.
   - What's unclear: Which service to use for the link (no WebRTC in v1).
   - Recommendation: Generate a Jitsi Meet link (open-source, no account needed): `https://meet.jit.si/legalconnect-{appointmentId}`. Free, EU-friendly, no auth required.

3. **Lawyer settings for read receipts**
   - What we know: D-03 says toggle in `/settings/cabinet`. This page exists (Phase 6).
   - What's unclear: Exact field name in lawyerProfiles schema.
   - Recommendation: Add `readReceiptsEnabled` integer column (1/0) to `lawyerProfiles` table. Default 1 (enabled).

## Project Constraints (from CLAUDE.md)

- **Security**: E2E encryption mandatory. libsodium-wrappers-sumo for all crypto operations.
- **Hosting**: OVHcloud (EU, RGPD). No external services that move data outside EU.
- **AI**: Not directly used in this phase (no LLM calls in messaging or appointments).
- **UX**: Interface must inspire trust and security at every step. Encryption badges mandatory.
- **Empathy**: Email notifications must follow warm, supportive tone (vouvoiement).
- **Stack**: Next.js 16 + Drizzle + shadcn/ui + React Email. Server actions pattern (NOT tRPC -- not installed).
- **Package manager**: pnpm (workspace monorepo with Turborepo).
- **IDs**: Text IDs with `crypto.randomUUID()` for all Drizzle primary keys.
- **Schema pattern**: Drizzle relations defined alongside schemas. JSON stored as text columns with safeJsonParse utility.
- **Auth pattern**: `requireAvocat()` / `requireClient()` / `requireAuth()` guards at top of server actions.
- **UI pattern**: RSC pages with server-side data fetching. URL searchParams for state. Sonner toasts for feedback.
- **shadcn rules**: Use `gap-*` not `space-*`, semantic colors, `cn()` for conditional classes, `data-icon` for button icons, FieldGroup/Field for forms.

## Validation Architecture

### Test Framework

| Property | Value |
|----------|-------|
| Framework | Vitest (workspace config at root + per-package) |
| Config file | `/Users/dhamon/vitest.config.ts` (root), `/Users/dhamon/packages/crypto/vitest.config.ts` |
| Quick run command | `pnpm vitest run --reporter=verbose` |
| Full suite command | `pnpm vitest run` |

### Phase Requirements -> Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| PORT-01 | E2E message encryption/decryption with crypto_kx keys | unit | `pnpm vitest run packages/crypto/src/__tests__/key-exchange.test.ts -x` | Wave 0 |
| PORT-01 | Message send server action stores encrypted content | unit | `pnpm vitest run tests/messaging.test.ts -x` | Wave 0 |
| PORT-01 | SSE delivers new message event to connected client | integration | `pnpm vitest run tests/sse-messages.test.ts -x` | Wave 0 |
| PORT-02 | File attachment encrypted and linked to message | unit | `pnpm vitest run tests/messaging-attachments.test.ts -x` | Wave 0 |
| PORT-03 | Client sees correct case status (not internal fields) | unit | `pnpm vitest run tests/portal-cases.test.ts -x` | Wave 0 |
| PORT-04 | Appointment request creates record with en_attente status | unit | `pnpm vitest run tests/appointments.test.ts -x` | Wave 0 |
| PORT-04 | Appointment confirm/refuse by lawyer | unit | `pnpm vitest run tests/appointments.test.ts -x` | Wave 0 |

### Sampling Rate
- **Per task commit:** `pnpm vitest run --reporter=verbose`
- **Per wave merge:** `pnpm vitest run`
- **Phase gate:** Full suite green before `/gsd:verify-work`

### Wave 0 Gaps
- [ ] `packages/crypto/src/__tests__/key-exchange.test.ts` -- covers PORT-01 crypto_kx key derivation
- [ ] `tests/messaging.test.ts` -- covers PORT-01/PORT-02 message CRUD server actions
- [ ] `tests/portal-cases.test.ts` -- covers PORT-03 client case list/detail
- [ ] `tests/appointments.test.ts` -- covers PORT-04 appointment lifecycle

## Sources

### Primary (HIGH confidence)
- Existing codebase: `packages/crypto/src/keypair.ts` -- confirms crypto_box_keypair (X25519)
- Existing codebase: `apps/web/src/lib/db/schema/` -- all current schema patterns
- Existing codebase: `apps/web/src/server/actions/dashboard.actions.ts` -- requireAvocat pattern
- [Libsodium Key Exchange docs](https://libsodium.gitbook.io/doc/key_exchange) -- crypto_kx API
- [Libsodium issue #639](https://github.com/jedisct1/libsodium/issues/639) -- confirms crypto_box and crypto_kx keypair compatibility

### Secondary (MEDIUM confidence)
- [Next.js Real-Time Chat: The Right Way to Use WebSocket and SSE](https://eastondev.com/blog/en/posts/dev/20260107-nextjs-realtime-chat/) -- SSE Route Handler pattern
- [tRPC v11 Subscriptions docs](https://trpc.io/docs/server/subscriptions) -- SSE subscription pattern (reference only, not using tRPC)
- [tRPC SSE Chat example](https://github.com/trpc/examples-next-sse-chat) -- Architecture inspiration

### Tertiary (LOW confidence)
- Jitsi Meet for visio links -- needs validation that it meets legal data requirements

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH -- all libraries already installed, patterns established in prior phases
- Architecture: HIGH -- crypto_kx compatibility verified, SSE pattern well-documented, schema follows existing patterns
- Pitfalls: HIGH -- based on real crypto and SSE edge cases, verified against libsodium docs

**Research date:** 2026-03-27
**Valid until:** 2026-04-27 (stable domain, no fast-moving dependencies)
