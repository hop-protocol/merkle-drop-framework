#!/bin/bash

if ! command -v wrk2 >/dev/null 2>&1; then
  if [ -f "/etc/arch-release" ]; then
    yay -S wrk2-git
  fi
fi

URL="http://localhost:8000/v1/rewards?address=0x9997da3de3ec197c853bcc96caecf08a81de9d69"
#URL="http://localhost:8000/v1/refund-amount?gasLimit=144561&gasPrice=9408027411&amount=1000000000000000&token=ETH&bonderFee=0&fromChain=ethereum"
#URL="http://localhost:8000/v1/rewards-info"

wrk2 -t5 -c200 -d30s -R2000 -s payload.lua $URL
