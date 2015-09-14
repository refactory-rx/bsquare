UBUNTU
------

# Install Git
sudo apt-get update
sudo apt-get install git

# Install NodeJS
wget http://nodejs.org/dist/v0.12.7/node-v0.12.7-linux-x64.tar.gz
sudo tar -C /usr/local --strip-components 1 -xzf node-v0.12.7-linux-x64.tar.gz
ls -l /usr/local/bin/node
ls -l /usr/local/bin/npm

# Install MongoDB
sudo apt-key adv --keyserver hkp://keyserver.ubuntu.com:80 --recv 7F0CEB10
echo "deb http://repo.mongodb.org/apt/ubuntu trusty/mongodb-org/3.0 multiverse" | sudo tee /etc/apt/sources.list.d/mongodb-org-3.0.list
sudo apt-get update
sudo apt-get install -y mongodb-org

# Configure NPM
mkdir "${HOME}/.npm-packages"
echo NPM_PACKAGES="${HOME}/.npm-packages" >> ~/.bashrc
echo NODE_PATH=\"\$NPM_PACKAGES/lib/node_modules\:\$NODE_PATH\" >> ~/.bashrc
echo PATH=\"\$NPM_PACKAGES/bin\:\$PATH\" >> ~/.bashrc
echo unset MANPATH >> ~/.bashrc
echo MANPATH=\"\$NPM_PACKAGES/share/man\:$(manpath)\" >> ~/.bashrc
echo prefix=${HOME}/.npm-packages >> ~/.npmrc


Mac OSX 10.10 Yosemite
----------------------

# Download and install Git
http://desktop.github.com/

# Download and install NodeJS
https://nodejs.org/en/

# Install MongoDB
brew update
brew install mongodb

# Setup MongoDB
sudo mkdir /data
sudo chown <user>:<group> /data
mkdir /data/db
cp /usr/local/Cellar/mongodb/3.0.6/homebrew.mxcl.mongodb.plist ~/Library/LaunchAgents/mongodb.plist
* Edit service name to "mongodb" in ~/Library/LaunchAgents/mongodb.plist
launchctl load ~/Library/LaunchAgents/mongodb.plist
launchctl start mongodb

# Configure NPM
mkdir "${HOME}/.npm-packages"
echo NPM_PACKAGES="${HOME}/.npm-packages" >> ~/.bash_profile
echo NODE_PATH=\"\$NPM_PACKAGES/lib/node_modules\:\$NODE_PATH\" >> ~/.bash_profile
echo PATH=\"\$NPM_PACKAGES/bin\:\$PATH\" >> ~/.bash_profile
echo unset MANPATH >> ~/.bash_profile
echo MANPATH=\"\$NPM_PACKAGES/share/man\:$(manpath)\" >> ~/.bash_profile
echo prefix=${HOME}/.npm-packages >> ~/.npmrc

# Configure dev machine settings
ssh-keygen -t rsa
brew install ssh-copy-id
...

Shared
------

# Install NPM global modules
npm install -g grunt
npm install -g grunt-cli
npm install -g bower
npm install -g babel

# Install App Modules
cd bsquare-app
npm install
bower install
grunt babel concat ngAnnotate uglify:server
cd ../bsquare-auth
npm install
cd ../bsquare-phantom
npm install
cd ../bsquare-tickets
npm install

# Add MongoDB users
mongo
use admin;
db.createUser({ user: "admin", pwd: "<pwd>", roles: [ { role: "userAdminAnyDatabase", db: "admin" }] });
var schema = db.system.version.findOne({ "_id" : "authSchema" });
schema.currentVersion = 3;
db.system.version.save(schema);
db.createUser({ user: "<username>", pwd: "<pwd>", roles: [ "readWrite" ] });
exit;
* Edit net.port to "27111" and security.authentication to "enabled" in mongod conf file
