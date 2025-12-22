#!/usr/bin/env bash
PROJECT_ID="YOUR_PROJECT_ID"
REGION="us-central1"
IMAGE="infinityx/full-platform:latest"
gcloud auth configure-docker \-docker.pkg.dev
docker build -t \-docker.pkg.dev/\/ai/\ .
docker push \-docker.pkg.dev/\/ai/\
