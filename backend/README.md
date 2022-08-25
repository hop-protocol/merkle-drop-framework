# Merkle drop framework backend

> The backend worker for fetching rewards data and computing merkle data to publish to github.

NOTE: currently it's not generalized and it's set up for the Optimism [fee refund](https://github.com/hop-protocol/fee-refund) rewards.

## Install

```sh
npm install @hop-protocol/mdf
```

Docker image

```sh
docker pull hopprotocol/merkle-drop-framework:latest
```

## Development

Environment variables

```sh
REWARDS_CONTRACT_ADDRESS=
TOKEN_ADDRESS=
REWARDS_DATA_GIT_URL=
REWARDS_DATA_OUTPUT_GIT_URL=
DATA_REPO_PATH=/tmp/rewards-data
OUTPUT_REPO_PATH=/tmp/rewards-output
OUTPUT_MERKLE_PATH=/tmp/merkle-output
PRIVATE_KEY=
```

Start worker

```sh
npm run start:worker
```

Instructions to run discourse locally with Docker, for testing discourse auto-post:

- https://meta.discourse.org/t/beginners-guide-to-install-discourse-for-development-using-docker/102009
