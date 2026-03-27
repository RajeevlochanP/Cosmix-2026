#!/bin/zsh

REMOTE_URL="https://github.com/Thrivikramteja/Cosmix-2026.git"

COMMITS=(
  "2026-03-26 20:01:37|init|README.md"
  "2026-03-26 21:22:11|backend setup|backend"
  "2026-03-26 23:07:54|add model|backend/model_architecture.py"
  "2026-03-27 01:13:29|add notebooks|*.ipynb"
  "2026-03-27 03:18:42|add refs|*.pdf"
  "2026-03-27 08:04:15|frontend setup|client"
  "2026-03-27 10:27:03|add frontend src|client/client/src"
  "2026-03-27 13:19:44|api connect|client/client/src/App.jsx"
  "2026-03-27 15:41:58|fixes|backend client/client/src/App.jsx"
  "2026-03-27 18:56:09|final|."
)

# init repo
rm -rf .git
git init

git remote add origin "$REMOTE_URL"

echo "Starting commits..."

for entry in "${COMMITS[@]}"; do
  IFS='|' read -r ts msg files <<< "$entry"

  echo "\n---"
  echo "Commit: $msg at $ts"

  # add files safely
  git add $files 2>/dev/null

  GIT_AUTHOR_DATE="$ts" GIT_COMMITTER_DATE="$ts" \
  git commit -m "$msg" --allow-empty
done

echo "\nPushing..."
git branch -M master
git push -u origin master --force

echo "Done!"