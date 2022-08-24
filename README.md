# Merkle drop framework

> Generalized merkle drop framework for rewards

## Packages

### backend

  - The backend worker that periodically fetches data needed to compute merkle root and then publishes to github

### frontend

  - The generalized frontend to view rewards and set merkle roots. It reads locked rewards from merkle data in github and claimable rewards from the chain.
