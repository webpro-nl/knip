const { something } = require('./2-re-export-star');
something;

module.exports.somethingToIgnore = require('./2-re-export-star').somethingToIgnore;

module.exports.somethingNotToIgnore = require('./2-re-export-star').somethingNotToIgnore;
