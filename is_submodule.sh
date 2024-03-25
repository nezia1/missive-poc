#!/bin/sh

# This script checks if the current directory is a submodule of missive (used in npm prepare to symlink biome since the VSCode extension doesn't check for subdirectories)
[ "$(basename $(git rev-parse --show-superproject-working-tree))" = "missive" ]
