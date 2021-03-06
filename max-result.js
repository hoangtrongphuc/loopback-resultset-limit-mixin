'use strict';

var _debug2 = require('./debug');

var _debug3 = _interopRequireDefault(_debug2);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var debug = (0, _debug3.default)();
var _ = require('lodash');

module.exports = function (Model, options) {
  /**
   * Apply appropriate limit to a query.
   *
   * @param {object} filter Filter to apply limit to.
   */
  function applyLimit(filter) {
    var requestLimit = _.toNumber(_.get(filter, 'limit'));
    var limit = _.min([requestLimit, options.limit]) || options.limit;

    return _.set(filter, 'limit', limit);
  }

  /**
   * Normalize include spec to a standard format.
   *
   * @param {object} include Include spec to normalize.
   */
  function normalizeInclude(include) {
    if (_.isString(include)) {
      return {
        relation: include,
        scope: applyLimit({})
      };
    } else if (_.isPlainObject(include)) {
      if (_.has(include, 'scope.include')) {
        include.scope.include = normalizeInclude(include.scope.include);
      }
      include.scope = applyLimit(include.scope || {});
      return include;
    } else if (_.isArray(include)) {
      return _.map(include, normalizeInclude);
    }

    return null;
  }

  /**
   * Modify incoming query to apply appropriate limit filters.
   */
  Model.beforeRemote('**', function (ctx, unused, next) {
    // Get a handle on the provided filter.
    var filter = _.get(ctx, 'args.filter');

    // Ensure its in json format.
    filter = _.isString(filter) ? JSON.parse(filter) : filter || {};

    debug('original before: %o', filter);

    // Handle a single relation defined as a string.
    if (filter.include) {
      filter.include = normalizeInclude(filter.include);
    }

    debug('normalized filter: %o', filter);
    applyLimit(filter);
    debug('filter after: %o', filter);
    _.set(ctx, 'args.filter', filter);

    next();
  });
};