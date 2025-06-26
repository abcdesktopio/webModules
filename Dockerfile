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
RUN make clean
RUN make $TARGET
# create version.json file
RUN ./mkversion.sh && cat version.json

# Clean
# remove unused web content files 
RUN make removebuildtools
RUN chmod -R 555 *
# RUN cd /var/webModules/transpile && npm audit fix
# RUN cd /var/webModules && npm i --package-lock-only && npm audit fix


# --- START Build image ---
FROM nginx:alpine-slim
# buildkit
# COPY --from=builder --chmod=555 /var/webModules /usr/share/nginx/html
COPY --from=builder /var/webModules /usr/share/nginx/html
EXPOSE 80 
