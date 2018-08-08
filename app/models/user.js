const _ = require('lodash');
const joi = require('joi');

module.exports = {
  schema: {
    username: joi.string().required(),
    name: joi.string().required(),
    password: joi.string().valid('').default(_.sampleSize('abcdefghkmnpqrstuvwxyzABCDEFGHKMNPQRSTUVWXYZ23456789', 8).join('')),
    admin: joi.boolean().default(false),
    createdDate: joi.date().iso().default(new Date().toISOString()),
    modifiedDate: joi.date().iso().default(new Date().toISOString())
  },
  forClient(obj) {
    // Implement outgoing transformations here
    obj.id = obj._key;
    obj = _.omit(obj, ['_rev', '_oldRev', '_id', '_key']);
    return obj;
  },
  fromClient(obj) {
    // Implement incoming transformations here
    obj = _.omit(obj, ['id']);
    return obj;
  }
};
