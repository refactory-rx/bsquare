UBUNTU

Install Git

sudo apt-get update
sudo apt-get install git

Install node

wget http://nodejs.org/dist/v0.12.7/node-v0.12.7-linux-x64.tar.gz
sudo tar -C /usr/local --strip-components 1 -xzf node-v0.12.7-linux-x64.tar.gz
ls -l /usr/local/bin/node
ls -l /usr/local/bin/npm

Install Mongo

sudo apt-key adv --keyserver hkp://keyserver.ubuntu.com:80 --recv 7F0CEB10
echo "deb http://repo.mongodb.org/apt/ubuntu trusty/mongodb-org/3.0 multiverse" | sudo tee /etc/apt/sources.list.d/mongodb-org-3.0.list
sudo apt-get update
sudo apt-get install -y mongodb-org

Configure NPM

mkdir "${HOME}/.npm-packages"
echo NPM_PACKAGES="${HOME}/.npm-packages" >> ~/.bashrc
echo NODE_PATH=\"\$NPM_PACKAGES/lib/node_modules\:\$NODE_PATH\" >> ~/.bashrc
echo PATH=\"\$NPM_PACKAGES/bin\:\$PATH\" >> ~/.bashrc
echo unset MANPATH >> ~/.bashrc
echo MANPATH=\"\$NPM_PACKAGES/share/man\:$(manpath)\" >> ~/.bashrc

echo prefix=${HOME}/.npm-packages >> ~/.npmrc

Install NPM global modules

npm install -g grunt
npm install -g grunt-cli
npm install -g bower
npm install -g babel

Install App Modules

cd bsquare-app
npm install
bower install

cd ../bsquare-auth
npm install

cd ../bsquare-phantom
npm install

cd ../(bsquare-tickets
npm install

