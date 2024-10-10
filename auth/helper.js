const jwt = require('jsonwebtoken');
const config = require('../config/environment');
const { nonce } = require('../config/environment/const')

/**
 * Create JWT
 */

exports.createJWT = async (userfound) => {

  return new Promise(async (resolve, reject) => {
    try {
      let token = jwt.sign({ id: userfound['id'], role: userfound['role'] }, config['secrets']['session'], { expiresIn: 60 * 60 * 24 * 365, algorithm: 'HS256' });
      resolve({ token });
    } catch (e) { reject(e) }
  });
};
