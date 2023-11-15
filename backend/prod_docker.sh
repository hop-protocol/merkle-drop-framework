#/bin/env bash

docker pull hopprotocol/merkle-drop-framework:latest

docker stop mdf
docker rm mdf

docker run -d \
        --name mdf \
        --env-file docker.env \
        -p 8000:8000 \
        --restart=unless-stopped \
        --log-driver=awslogs \
        --log-opt awslogs-region=us-east-1 \
        --log-opt awslogs-group="HopOptimismFeeRefundBackend" \
        --log-opt awslogs-create-group=true \
        -v /home/ubuntu/db:/tmp/db \
        -v /home/ubuntu/leveldb:/tmp/leveldb \
        -v /home/ubuntu/rewards-output:/tmp/rewards-output \
        -v /home/ubuntu/merkle-output:/tmp/merkle-output \
        hopprotocol/merkle-drop-framework:latest start:dist -- worker --server --start-timestamp=1663898400 --poll-interval=30 --checkpoint-interval=2419200 --post-forum
        #hopprotocol/merkle-drop-framework:latest start:dist -- worker --server --start-timestamp=1663898400 --poll-interval=30 --checkpoint-interval=1209600 --post-forum
        #hopprotocol/merkle-drop-framework:latest start:dist -- worker --server --start-timestamp=1663898400 --poll-interval=30 --checkpoint-interval=2419200 --post-forum
        #hopprotocol/merkle-drop-framework:latest start:dist -- worker --server --start-timestamp=1663898400 --poll-interval=30 --checkpoint-interval=100 --post-forum

#604800
