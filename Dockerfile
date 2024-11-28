ARG BASE_IMAGE=ubuntu
ARG BASE_IMAGE_RELEASE=latest
ARG BRANCH
ARG NODE_MAJOR

FROM $BASE_IMAGE:$BASE_IMAGE_RELEASE AS builder
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

# install yarn npm nodejs
RUN  mkdir -p /etc/apt/keyrings && \
     curl -fsSL https://deb.nodesource.com/gpgkey/nodesource-repo.gpg.key | gpg --dearmor -o /etc/apt/keyrings/nodesource.gpg && \
     echo "deb [signed-by=/etc/apt/keyrings/nodesource.gpg] https://deb.nodesource.com/node_$NODE_MAJOR.x nodistro main" | tee /etc/apt/sources.list.d/nodesource.list && \
     apt-get update && \
     apt-get install -y --no-install-recommends nodejs && \
     npm -g install yarn 


# install package for html5validator
RUN  apt-get update  -y && \
     apt-get install -y --no-install-recommends \
	python3-pip \
	openjdk-8-jre \
	python3-venv

# install html5validator
RUN python3 -m venv myenv && /myenv/bin/pip3 install html5validator

# copy data files 
# from abcdesktopio/webModules repo or from your local directory
# RUN git clone -b $BRANCH https://github.com/abcdesktopio/webModules.git /var/webModules
# -- or --
COPY . /var/webModules 


#
# run makefile step by step 
# to get troubleshooting info
#

# install less
RUN npm install --global less

# make install
RUN cd /var/webModules && make install
# update js files
RUN cd /var/webModules && make updatejs
# make dev
RUN cd /var/webModules && make dev 
# create version.json file
RUN cd /var/webModules && ./mkversion.sh && cat version.json
# run html5validator
RUN cd /var/webModules && /myenv/bin/html5validator index.html 


# Clean
# remove unused web content files 
RUN  cd /var/webModules && rm -rf \
	.eslintrc.json \
	.git \
	.github \
	.gitignore \
	Dockerfile \
	Makefile \
	transpile \
	package.json \
	*.sh

# RUN cd /var/webModules && make untranspile
# RUN cd /var/webModules/transpile && npm audit fix
# RUN cd /var/webModules && npm i --package-lock-only && npm audit fix


# --- START Build image ---
FROM nginx
COPY --from=builder /var/webModules /usr/share/nginx/html
EXPOSE 80 
