#!/bin/sh

superproject=$(git rev-parse --show-superproject-working-tree)

# This script checks if the current directory is a submodule of missive (used in npm prepare to symlink biome since the VSCode extension doesn't check for subdirectories)
[ -n "$superproject" ] && [ "$(basename "$superproject")" = "missive" ]
