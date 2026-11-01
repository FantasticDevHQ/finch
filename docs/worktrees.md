# Checkout lifecycle

Finch has no Convex app/example, development server, port allocation or process registry. No pre-existing worktree helpers were found. The backend-free adapter never signals processes or shares generated state.

From a clean checkout, `bun run worktree:setup -- ../finch-topic feature/FIN-123` creates a sibling from the freshly fetched immutable origin default commit. FINCH_BASE_BRANCH overrides live default discovery. `bun run worktree:setup` safely advances an existing checkout. Local selected-base branches advance only safely; local topic commits remain intact. Dirty trees, divergence, fetch failures and busy locks stop with recovery guidance. Reconcile manually and retry. Setup never stashes, resets, rebases or merges a topic into the base. Concurrent setup shares a Git-common-directory lock; confirm its owner exited before removing a stale lock.

Install dependencies separately in each checkout with `bun install --frozen-lockfile`, under the shared host heavy-operation lock. node_modules, ignored build outputs and environment files remain checkout-local. `bun run worktree:start` prepares local lifecycle state; then use the foreground `bun src/index.ts --help`. Synthetic tests should set `FINCH_CONFIG_PATH="$PWD/.finch-worktree/config"` to avoid sharing the user's default credentials. No production secrets are copied.

`bun run worktree:stop` and `bun run worktree:teardown` are repeatable no-ops preserving data. `bun run worktree:cleanup -- --yes` removes only the current checkout's .finch-worktree state and refuses symlinks. Dependencies/build outputs remain. Remove an entire checkout explicitly with `git worktree remove /absolute/path` after checking changes; never use force. No automatic global prune occurs.

PR tooling derives from JibHQ/jib-factory commit fae094712705fc1baba55fb4b3cfaaef78041b3a. Adaptations cover Bun commands, newline normalization, acceptance checklist enforcement and best-effort failure publication preserving the original API error. Reconcile these adaptations on upstream updates. The worktree adapter is Finch-specific; installing Convex is not applicable.
