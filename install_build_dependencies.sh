#!/bin/bash

echo "install build-essential git gnupg ca-certificates curl dpkg python3 devscripts wget"
echo 'debconf debconf/frontend select Noninteractive' | sudo debconf-set-selections
sudo apt-get update  -y
sudo apt-get install -y --no-install-recommends build-essential git gnupg ca-certificates curl dpkg python3 devscripts wget 

echo "install yarn npm nodejs "
mkdir -p /etc/apt/keyrings 
curl -fsSL https://deb.nodesource.com/gpgkey/nodesource-repo.gpg.key | sudo gpg --dearmor -o /etc/apt/keyrings/nodesource.gpg 
echo "deb [signed-by=/etc/apt/keyrings/nodesource.gpg] https://deb.nodesource.com/node_20.x nodistro main" | sudo tee /etc/apt/sources.list.d/nodesource.list 
sudo apt-get update
sudo apt-get install -y --no-install-recommends nodejs
sudo npm -g install yarn 

sudo yarn global add less minify