# Merkle drop framework

> Generalized merkle drop framework for rewards

## Packages

### backend

  - The backend worker that periodically fetches data needed to compute merkle root and then publishes to github

### frontend

  - The generalized frontend to view rewards and set merkle roots. It reads locked rewards from merkle data in github and claimable rewards from the chain.

### Overview

<img width="500" src="https://user-images.githubusercontent.com/168240/186722357-5da308fa-c62f-4ecd-abc1-820443738f96.png" alt="diagram" />

#### Steps

1. The backend worker frequently polls TheGraph for data of hop transfers.
1. The backend worker computes the reward amount for each account within a time range.
1. The backend worker computes the merkle data for the reward amounts.
1. The backend worker stores the merkle data locally for tracking real time rewards. 
1. The backend worker once a week publishes the merkle data to github.
1. The backend worker auto-submits a post to hop forum post about the latest published merkle data.
1. The backend worker serves real time locked rewards via an endpoint for frontend.
1. The community multisig verifies the latest merkle data using backend docker image.
1. The community multisig publishes the lates merkle root onchain using generalized frontend.
1. The frontend displays locked rewards (unpublished rewards merkle root) and claimable rewards (published rewards merkle root onchain) for account.
