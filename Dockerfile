ARG BASE_IMAGE=ubuntu
ARG BASE_IMAGE_RELEASE=latest
ARG BRANCH
ARG NODE_MAJOR
ARG TARGET

FROM $BASE_IMAGE:$BASE_IMAGE_RELEASE AS builder
#  get arg
ARG BRANCH
ARG NODE_MAJOR
ARG TARGET=dev
# convert arg to env
ENV NODE_MAJOR=$NODE_MAJOR
ENV BRANCH=$BRANCH
ENV TARGET=$TARGET
RUN echo current branch is $BRANCH
RUN echo NODE release is $NODE_MAJOR 
RUN echo current target is $TARGET it can be 'dev' or 'prod'

COPY . /var/webModules 
WORKDIR /var/webModules
RUN make removebuildtools
RUN chmod -R 555 *


# --- START Build image ---
FROM nginx:alpine-slim
# buildkit
# COPY --from=builder --chmod=555 /var/webModules /usr/share/nginx/html
RUN apk update && apk upgrade --no-cache
COPY --from=builder /var/webModules /usr/share/nginx/html
EXPOSE 80 
