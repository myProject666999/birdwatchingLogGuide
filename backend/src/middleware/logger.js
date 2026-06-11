const morgan = require('morgan');
const debug = require('debug')('app:http');

const debugStream = {
  write: (message) => {
    debug(message.trim());
  }
};

const requestLogger = morgan('[:method] :url :status :response-time ms - :res[content-length]', {
  stream: debugStream
});

module.exports = { requestLogger };
