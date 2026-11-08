const { something } = require('./2-re-export-star');
something;

require('./4-re-export-member');

module.exports.somethingToIgnore = require('./2-re-export-star').somethingToIgnore;

module.exports.somethingNotToIgnore = require('./2-re-export-star').somethingNotToIgnore;
