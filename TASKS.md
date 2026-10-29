# def-platform task ledger

Every task carries an ID of the form `DEFPL-<n>`. IDs are assigned once,
never reused, and never renumbered.

**Next ID to assign: `DEFPL-2`**

If this file and history ever disagree, history wins:

```sh
git log --oneline | grep -oE 'DEFPL-[0-9]+' | sort -t- -k2 -n | tail -1
```

## Open

| ID | Task | Status | Commit |
| --- | --- | --- | --- |

## Done

| ID | Task | Status | Date | Commit |
| --- | --- | --- | --- | --- |
| DEFPL-1 | Adopt the develop-branch workflow (CLAUDE.md, TASKS/TODO/CHANGELOG, commit + changelog-updater agents) used by Sphinx, DigiSpin and Watchr | done | 2026-10-29 | — |
