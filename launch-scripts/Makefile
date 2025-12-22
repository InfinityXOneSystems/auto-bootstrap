# Infinity-X Makefile for development and deployment

APP_NAME=infinityx
DOCKER_IMAGE=\(APP_NAME)/platform:latest

.PHONY: build run stop clean push sync

build:
	docker build -t \(DOCKER_IMAGE) .

run:
	docker run -d -p 8080:8080 --name \(APP_NAME) \(DOCKER_IMAGE)

stop:
	docker stop \(APP_NAME) || true
	docker rm \(APP_NAME) || true

clean:
	docker system prune -f

push:
	powershell ./automation/github_sync.ps1

sync:
	powershell ./automation/credentials_sync.ps1
