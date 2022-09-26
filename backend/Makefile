docker-run-worker:
	docker stop mdf; docker rm mdf; docker run --rm --name mdf --env-file docker.env -v /tmp/dockerfeesdb:/tmp/db -v /tmp/dockerleveldb:/tmp/leveldb hopprotocol/merkle-drop-framework start:dist worker

docker-run-generate:
	docker run --env-file docker.env hopprotocol/merkle-drop-framework start:dist generate --start-timestamp=1660546800 --end-timestamp=1660860183

# Pull docker image
docker-pull:
	docker pull hopprotocol/merkle-drop-framework

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

request-rewards:
	curl "http://localhost:8000/v1/rewards?address=0x9997da3de3ec197c853bcc96caecf08a81de9d69"
	#curl "https://hop-merkle-rewards-backend.hop.exchange/v1/rewards?address=0x9997da3de3ec197c853bcc96caecf08a81de9d69"

request-refund-amount:
	curl "http://localhost:8000/v1/refund-amount?gasLimit=144561&gasPrice=9408027411&amount=1000000000000000&token=ETH&bonderFee=0&fromChain=ethereum"

request-rewards-info:
	curl "http://localhost:8000/v1/rewards-info"
# curl "https://optimism-fee-refund-api.hop.exchange/v1/rewards-info"

bench:
	(cd loadtest && ./bench.sh)
