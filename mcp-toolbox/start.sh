#!/bin/bash

# Load and export environment variables
set -a
source .env
set +a

# Start toolbox with UI
toolbox --tools-file tools.yaml --ui