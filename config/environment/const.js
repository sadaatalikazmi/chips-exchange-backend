'use strict';
module.exports = {
  userRoles: ['user', 'admin', 'super-admin', 'advertiser'],
  userStatus: ['In Complete', 'Verified', 'Registered'],
  emailValidator: /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/,
  defaultChips: 10000,
  challengeStatus: ['ACCEPTED', 'REJECTED', 'PENDING', 'COUNTER'],

};

module.exports.nonce = Math.floor(Math.random(Math.floor(Date.now() / 1000)) * 10000000000);
module.exports.lastName = Math.floor(Math.random(Math.floor(Date.now() / 1000)) * 100000);
