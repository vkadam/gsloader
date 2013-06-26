#!/bin/sh
# This checks pre-requisites then installs the npm dependencies.

# Update submodules
git submodule update --init --recursive

# sudo rm -rf node_modules
npm install