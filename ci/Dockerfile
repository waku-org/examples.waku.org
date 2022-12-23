FROM node:16-alpine3.16

LABEL maintainer="jakub@status.im"

RUN apk --no-cache add openssh git

# Jenkins user needs a specific UID/GID to work
RUN addgroup -g 1001 jenkins \
 && adduser -u 1001 -G jenkins -D jenkins
USER jenkins
ENV HOME="/home/jenkins"
