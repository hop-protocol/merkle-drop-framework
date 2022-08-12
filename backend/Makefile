docker-run-worker:
	docker stop mdf; docker rm mdf; docker run --rm --name mdf --env-file docker.env -v /tmp/dockerfeesdb:/tmp/db -v /tmp/dockerleveldb:/tmp/leveldb hopprotocol/merkle-drop-framework start:dist worker

docker-run-generate:
	docker run --env-file docker.env hopprotocol/merkle-drop-framework start:dist generate

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

request:
	curl "http://localhost:8000/v1/rewards?address=0xe5b64192a2ca4bec729134ad6d2524ca31a5102c"
