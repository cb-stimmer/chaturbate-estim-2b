FROM ubuntu:xenial
MAINTAINER Paul Allen paulallen87555@gmail.com

WORKDIR /app
ENV DEBIAN_FRONTEND noninteractive

RUN apt-get update
RUN apt-get install -y curl apt-transport-https build-essential apt-utils

# Yarn
RUN curl -sS https://dl.yarnpkg.com/debian/pubkey.gpg | apt-key add -
RUN echo "deb https://dl.yarnpkg.com/debian/ stable main" | tee /etc/apt/sources.list.d/yarn.list

# NodeJS
RUN curl -sL https://deb.nodesource.com/setup_8.x | bash -

# Google Chrome
RUN curl -sS https://dl-ssl.google.com/linux/linux_signing_key.pub | apt-key add -
RUN echo "deb [arch=amd64] http://dl.google.com/linux/chrome/deb/ stable main" | tee /etc/apt/sources.list.d/google-chrome.list

RUN apt-get update
RUN apt-get install -y google-chrome-stable nodejs yarn

ADD index.js /app
ADD package.json /app
RUN cd /app && yarn install

# ENV DEBUG "chaturbate:*"
CMD ["yarn", "start"]
