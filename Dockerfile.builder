ARG BASE_IMAGE=ubuntu
ARG BASE_IMAGE_RELEASE=latest
ARG BRANCH
ARG NODE_MAJOR

FROM $BASE_IMAGE:$BASE_IMAGE_RELEASE
#  get arg
ARG BRANCH
ARG NODE_MAJOR
# convert arg to env
ENV NODE_MAJOR=$NODE_MAJOR
ENV BRANCH=$BRANCH
RUN echo current branch is $BRANCH
RUN echo NODE release is $NODE_MAJOR 
RUN echo 'debconf debconf/frontend select Noninteractive' | debconf-set-selections && \
    apt-get update  -y && \
    apt-get install -y --no-install-recommends \
	build-essential			                \
        git			                        \
	gnupg						\
	ca-certificates					\
	curl						\
	dpkg						\
	python3						\
	devscripts 					\
	wget 						\
	ca-certificates					


# install npm nodejs 
RUN curl -fsSL https://deb.nodesource.com/setup_$NODE_MAJOR.x | bash - && \
    apt-get update && apt-get install -y --no-install-recommends nodejs && \
    npm install -g npm

# RUN  mkdir -p /etc/apt/keyrings && \
#     curl -fsSL https://deb.nodesource.com/gpgkey/nodesource-repo.gpg.key | gpg --dearmor -o /etc/apt/keyrings/nodesource.gpg && \
#     echo "deb [signed-by=/etc/apt/keyrings/nodesource.gpg] https://deb.nodesource.com/node_$NODE_MAJOR.x nodistro main" | tee /etc/apt/sources.list.d/nodesource.list && \
#     apt-get update && \
#     apt-get install -y --no-install-recommends nodejs && \
#     npm -g install yarn 


## install package for html5validator
#RUN  apt-get update  -y && \
#     apt-get install -y --no-install-recommends \
#	python3-pip \
#	openjdk-8-jre \
#	python3-venv
# install html5validator
#RUN python3 -m venv myenv && /myenv/bin/pip3 install html5validator

# copy /var/webModules
# to run make install
#
COPY . /var/webModules

#
# run makefile step by step 
# to get troubleshooting info
#

# install less 
# less is required 
RUN npm install --global less

# run make install 
WORKDIR /var/webModules
RUN make install
RUN make dev

# create version.json file
RUN ./mkversion.sh && cat version.json
# run html5validator
# RUN cd /var/webModules && /myenv/bin/html5validator index.html
