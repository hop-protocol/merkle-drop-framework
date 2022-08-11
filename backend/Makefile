docker-run:
	docker run --rm --name mdf --env-file docker.env -v /tmp/dockerfeesdb:/tmp/db hopprotocol/merkle-drop-framework start:dist worker

# Build docker target
docker-build:
	docker build -f Dockerfile -t hopprotocol/merkle-drop-framework .

# Tag docker image
docker-tag:
	$(eval REV=$(shell git rev-parse HEAD | cut -c1-7))
	docker tag hopprotocol/merkle-drop-framework:latest hopprotocol/merkle-drop-framework:latest
	docker tag hopprotocol/merkle-drop-framework:latest hopprotocol/merkle-drop-framework:$(REV)

# Push to registry
docker-push:
	$(eval REV=$(shell git rev-parse HEAD | cut -c1-7))
	docker push hopprotocol/merkle-drop-framework:latest
	docker push hopprotocol/merkle-drop-framework:$(REV)

# Build docker image and push to AWS registry
docker-build-and-push: docker-build docker-tag docker-push
