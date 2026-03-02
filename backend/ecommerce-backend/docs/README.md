# 📚 Ecommerce Backend — Documentation Index

> **Project:** `ecommerce-backend`  
> **Stack:** Cloudflare Workers · Neon Serverless Postgres · Drizzle ORM · Neon Data API · `jose` JWT  
> **Neon Project ID:** `proud-shadow-42759289`  
> **Last Updated:** 2026-02-26  

---

## 📂 Document Map

```
docs/
├── README.md                          ← You are here (Index)
├── architecture/
│   └── ARCHITECTURE_STRATEGY.md       ← Core split-access model overview
├── guides/
│   ├── 01-NEON-DB-SETUP.md            ← Neon Postgres: project, roles, RLS setup
│   ├── 02-DRIZZLE-ORM-GUIDE.md        ← Drizzle ORM: schema, migrations, queries
│   ├── 03-WORKERS-GUIDE.md            ← Cloudflare Workers: routing, auth, deployment
│   ├── 04-NEON-DATA-API-GUIDE.md      ← Neon Data API (PostgREST): frontend usage
│   └── 05-AUTH-AND-JWT-GUIDE.md       ← JWKS, JWT generation, token lifecycle
├── reference/
│   ├── SCHEMA-REFERENCE.md            ← All tables, columns, constraints, RLS policies
│   └── ENV-AND-SECRETS-REFERENCE.md   ← All environment variables and secrets
└── compliance/
    └── ARCHITECTURE-GAPS.md           ← Deviations from initial spec, explained
```

---

## 🗺️ Quick Navigation

| I want to...                                | Go to                                    |
|----------------------------------------------|------------------------------------------|
| Understand the split-access data model       | [`architecture/ARCHITECTURE_STRATEGY.md`](./architecture/ARCHITECTURE_STRATEGY.md) |
| Set up Neon DB from scratch                  | [`guides/01-NEON-DB-SETUP.md`](./guides/01-NEON-DB-SETUP.md) |
| Write a new DB table with Drizzle            | [`guides/02-DRIZZLE-ORM-GUIDE.md`](./guides/02-DRIZZLE-ORM-GUIDE.md) |
| Add a new Worker route (sensitive op)        | [`guides/03-WORKERS-GUIDE.md`](./guides/03-WORKERS-GUIDE.md) |
| Query data from the browser (non-sensitive)  | [`guides/04-NEON-DATA-API-GUIDE.md`](./guides/04-NEON-DATA-API-GUIDE.md) |
| Understand how JWTs are issued and verified  | [`guides/05-AUTH-AND-JWT-GUIDE.md`](./guides/05-AUTH-AND-JWT-GUIDE.md) |
| Look up a table's columns or RLS policy      | [`reference/SCHEMA-REFERENCE.md`](./reference/SCHEMA-REFERENCE.md) |
| Find the list of all env vars and secrets    | [`reference/ENV-AND-SECRETS-REFERENCE.md`](./reference/ENV-AND-SECRETS-REFERENCE.md) |
| See what deviated from the original plan     | [`compliance/ARCHITECTURE-GAPS.md`](./compliance/ARCHITECTURE-GAPS.md) |

---

## 🧠 Core Philosophy in One Paragraph

This project uses a **Zero-Trust, Split-Access Model**: not everything should go through a backend API. Operations that are purely user-scoped (cart, wishlist, reading own orders) bypass the Worker entirely and hit the Neon database directly using **PostgREST + JWT + RLS**. This scales infinitely at zero compute cost. Operations that require business logic, payment verification, or cross-table transactions (checkout, order management, auth) are routed exclusively through a **Cloudflare Worker** using the privileged `neondb_owner` connection. The Worker is the trust boundary — nothing sensitive escapes it.
