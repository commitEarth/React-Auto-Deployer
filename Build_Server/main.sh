#!/bin/bash

export GIT_REPOSITORY="$GIT_REPOSITORY"

git clone "$GIT_REPOSITORY" /home/app/output

exec node main.js