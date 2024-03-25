#!/bin/sh

is_submodule() {
    superproject=$(git rev-parse --show-superproject-working-tree)

    # This script checks if the current directory is a submodule of missive (used in npm prepare to symlink biome since the VSCode extension doesn't check for subdirectories)
    [ -n "$superproject" ] && [ "$(basename "$superproject")" = "missive" ]
}
npx lefthook install && echo 'Lefthook installed.'

if is_submodule; then
    echo 'Submodule check passed.'
    ln -f biome.json ../biome.json
    echo 'Symlink created.'
else
    echo 'Submodule check failed. Symlink not created.'
fi
