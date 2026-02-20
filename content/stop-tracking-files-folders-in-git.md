+++
title = 'Stop Tracking Files Folders in Git'
description = "A step-by-step guide to safely remove tracked files/folders from Git and GitHub, even if your local branch is behind or diverged." 
date = 2026-02-20T21:33:31+06:00
draft = false
tags = ["git"]
authors = ["Redoan"]
+++


Sometimes you accidentally commit and push files or folders (e.g., `build/`, `dist/`, `public/`) that should **never** be tracked. Later, you want to:

- Stop tracking them
- Keep them locally for development/builds
- Sync your branch cleanly with remote

Here’s a safe, step-by-step workflow.

---

## Check Branch Status

```bash
git status
```

You may see:

```
Your branch and 'origin/main' have diverged,
and have X and Y different commits each
```

or modified files you don’t want to track.

**Important:** If your branch is behind remote, do **not remove files yet** — you will create conflicts otherwise.

---

## Fetch Remote Changes

```bash
git fetch origin
```

This updates your local info about the remote branch.

---

## Rebase or Merge Remote Changes

If your branch diverged, **rebase first** to make history linear and avoid conflicts:

```bash
git pull --rebase origin main
```

- Resolve conflicts if they happen.
- If the files/folders you want to stop tracking are involved in modify/delete conflicts, you can **skip the removal commit** for now:

```bash
git rebase --skip
```

> This ensures your branch fully incorporates all remote changes before removing the tracked folder.

---

## Add to `.gitignore`

```bash
echo "folder_or_file_to_ignore/" >> .gitignore
```

Examples: `public/`, `dist/`, `build/`, `node_modules/`

---

## Remove From Git Tracking (Keep Locally)

```bash
git rm -r --cached folder_or_file_to_ignore
```

- `--cached` removes files from Git index but keeps them on disk.

---

## Commit the Removal

```bash
git add .gitignore
git commit -m "Stop tracking folder_or_file_to_ignore"
```

---

## Push Changes

```bash
git push origin main
```

- Files/folders are removed from the remote repo.
- Local copy remains.
- `.gitignore` prevents future accidental commits.

---

## Verify

```bash
git ls-tree -r main --name-only | grep folder_or_file_to_ignore
```

Should return **nothing** → removal is successful.

---

## Key Notes / Best Practices

1. **Always rebase first** if your local branch is behind or diverged. Otherwise, Git may create modify/delete conflicts.
2. Use `.gitignore` to prevent future tracking.
3. For build/output folders, consider pushing them to a **separate branch** or deploying via CI/CD.
4. Skipping a commit during rebase is safe if it’s the removal commit — you can reapply it after the rebase finishes.

---

**Why This Order Matters**

- Rebasing first ensures your branch has all remote commits.
- Removing tracked files **before syncing** can trigger conflicts if remote has modifications.
- Doing it in the correct order guarantees a **clean, conflict-free commit history**.
