#!/bin/bash
# SPDX-License-Identifier: GPL-3.0-or-later
# Copyright (C) 2017 paulallen87

docker rm -f cb-app

docker build -t cb/app .

docker run \
  -ti \
  --name=cb-app \
  -e CB_USERNAME=${1} \
  --cap-add=SYS_ADMIN \
  cb/app
