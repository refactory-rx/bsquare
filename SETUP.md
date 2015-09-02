UBUNTU

Install node

wget http://nodejs.org/dist/v0.12.7/node-v0.12.7-linux-x64.tar.gz
sudo tar -C /usr/local --strip-components 1 -xzf node-v0.12.7-linux-x64.tar.gz
ls -l /usr/local/bin/node
ls -l /usr/local/bin/npm

Configure NPM

mkdir "${HOME}/.npm-packages"
echo NPM_PACKAGES="${HOME}/.npm-packages" >> ~/.bashrc
echo NODE_PATH=\"\$NPM_PACKAGES/lib/node_modules\:\$NODE_PATH\" >> ~/.bashrc
echo PATH=\"\$NPM_PACKAGES/bin\:\$PATH\" >> ~/.bashrc
echo unset MANPATH >> ~/.bashrc
echo MANPATH=\"\$NPM_PACKAGES/share/man\:$(manpath)\" >> ~/.bashrc

echo prefix=${HOME}/.npm-packages >> ~/.npmrc

Install Git

sudo apt-get update
sudo apt-get install git

