var phantomService = require('./services/phantomService');

module.exports = function(app) {
    phantomService.init(app);
};
