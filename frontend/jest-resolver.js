const path = require("path");
const resolve = require("resolve");

module.exports = (request, options) => {
  if (request === "axios") {
    return resolve.sync(request, {
      ...options,
      basedir: path.join(options.basedir, "node_modules/axios"),
    });
  }
  return resolve.sync(request, options);
};