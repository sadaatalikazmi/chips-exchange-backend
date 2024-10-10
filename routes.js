"use strict";
/**
 *   Main application routes
 **/

module.exports = (app) => {
  app.use("/api/user", require("./api/user"));
  app.use("/api/challenge", require("./api/challenges"));
  app.use("/api/transaction", require("./api/transactions"));
};
