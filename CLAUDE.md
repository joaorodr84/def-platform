# def-platform

A 2D platformer (Deficientezinho) where you roll a wheelchair through an
obstacle course built, like most cities, by people who never tried it. Plain
HTML/CSS/JavaScript — no framework, no build step, no dependencies; open
[index.html](index.html) in a browser to play. See [README.md](README.md)
for controls, settings and the file layout.

## Branch before you work

Create the branch before the first edit, not after. When a request will
change files here (code, `TODO.md`, docs), the first action is
`git checkout -b <name>` off `develop` — checking out and pulling `develop`
first if `HEAD` isn't already there — so no work lands in the working tree
while `HEAD` is on `develop` or `main`.

- `<name>` is a plain `kebab-case-summary` of the change, prefixed with the
  task ID: `defpl-2-fix-curb-hop`.
- Already on a branch other than `develop` or `main`: stay on it, don't
  branch off a branch.
- Skip branching for read-only work: answering questions, reading code,
  opening the game in a browser, investigating a bug without fixing it.
  Branch the moment an investigation becomes a fix.
- Don't ask permission — this rule *is* the standing authorization.

`develop` and `main` are the two long-lived branches. `develop` is where
everything in progress lands; `main` only moves on a deliberate release (see
"Releases" below). The `commit` agent
([.claude/agents/commit.md](.claude/agents/commit.md)) picks up from a
feature branch: commit → land on `develop` (fast-forward or squash) →
delete the branch.

## Releases

GitHub Pages serves this site straight from `main` (legacy build, path `/`)
— every push to `main` is live within minutes at
https://joaorodr84.github.io/def-platform/. That's the same situation
Watchr's Railway deploy is in, and it gets the same answer: `develop` is the
stand-in where day-to-day work lands (see **Branch before you work**), and
`main` only moves on a deliberate release — nobody's routine commit puts a
change in front of players on its own.

To release:

```sh
git checkout main
git pull --ff-only origin main
git merge --ff-only develop
git push origin main
```

If `main` can't fast-forward, stop and ask — don't force or rebase `main` to
make it fit. `develop` keeps going unchanged; it's never reset or rebased
onto `main`.

There's no `package.json` and nothing to version (see **Versions**), so a
release here is just that fast-forward and push — no tag, no version bump.
This is a deliberate, owner-requested action ("release", "ship", "publish")
— unlike the rest of this file, it is not standing authorization to merge to
`main` on your own judgment.

## Hotfixes

A hotfix is an urgent fix to something already live on GitHub Pages — the
one case where work branches off `main` instead of `develop`, because
waiting for everything else on `develop` to also ship isn't acceptable.

- Branch name starts with `hotfix-`, not just the task ID, so it's
  unmistakable at a glance: `hotfix-crash-on-level1-load`.
- Cut from `main`, fixed, then landed on **both** `main` and `develop` (so
  the fix survives the next regular release) — never just one side.
- Reserved for genuinely urgent fixes. Anything that can wait for the normal
  cycle goes through `develop` like everything else in "Branch before you
  work" above.

## Task completion workflow

1. **Make code changes** and commit them, with the task ID in the subject.
2. **Do bookkeeping in the same commit** — move the task to Done in
   `TASKS.md` (status `done`, today's date) and delete its `TODO.md` entry.
3. **Then provide the summary** — the task is finished only when that commit
   exists.

## Task IDs

Every task carries an ID `DEFPL-<n>`, registered in [TASKS.md](TASKS.md),
which holds the next free number at the top — take it and increment it in
the same commit that uses it.

**Claim the ID when the task is written down, not when it ships.** A new
`TODO.md` entry gets one immediately; the commit that closes it reuses that
same ID. One ID per *task*.

- Commit subject: `fix: Stop coins spawning inside the first park hill (DEFPL-2)`.
- Branch name: `defpl-2-fix-curb-hop`.
- Bookkeeping (typo fixes, formatting, `TODO.md` tidying) may go unnumbered.
- Never renumber, never reuse, never rewrite an ID into an existing commit.

If `TASKS.md` and history disagree, history wins:

```sh
git log --oneline | grep -oE 'DEFPL-[0-9]+' | sort -t- -k2 -n | tail -1
```

## Commit messages

def-platform follows [Conventional Commits 1.0.0](https://www.conventionalcommits.org/en/v1.0.0/):

```text
<type>[optional scope][!]: <description> (DEFPL-<n>)

[body]

[footers]
```

- **Type** is required and lowercase. `feat` and `fix` first; `docs`,
  `refactor`, `perf`, `test`, `build`, `ci`, `chore` for changes that ship no
  behaviour.
- **Scope** names the area of the game (`fix(hop):`), never the task. Leave
  it off when the change is broad.
- **Description**: plain-language imperative, capitalised, no trailing full
  stop.
- **Body** says what was wrong or missing, why this approach, what was
  rejected, and how it was verified. Not a one-line commit.
- `Co-Authored-By:` is a footer like any other.

## Versions

There's no `package.json` and nothing resembling a build — the live site at
https://joaorodr84.github.io/def-platform/ is whatever `main` currently
holds, and that's the only version that exists. Git history, not a version
number, is the record of what changed and when.

## Tests

No automated test suite — this is plain JS/HTML/CSS with no build step and
nothing set up to run assertions against it yet. What a change owes instead:

- **Open `index.html` in a browser and actually play the change** — the
  golden path (start → play Level 1 → finish) and whatever edge case the
  change touches (a curb, a gap, boost toggling, a settings change). Type
  checking doesn't exist here either, so this is the only verification a
  change gets.
- **A bug fix describes, in the commit body, exactly how to reproduce it
  manually** — the steps that showed the bug, and the steps that confirm
  it's gone — since there's no regression test to point to instead.
- If a test framework is ever added, this section updates to say what a
  change owes it.

## Comments

Comments here record *why*, name the alternative that was rejected, and
carry the numbers behind the decision — not a restatement of the line below
them. Put them above the constant, the check or the guard they explain.

## Where decisions live

Commit bodies and code comments. `TODO.md`, `TASKS.md` and `CHANGELOG.md`
are the exceptions: what is planned, which ID names it, and what shipped.
