const mongoose = require('mongoose');
const Schema = mongoose.Schema;

// define the schema for demand model
const blacklistSchema = Schema({
  userId: Schema.Types.ObjectId,
  loggedOnce: {type: Boolean, default:false },
  expiresOn: {type: Date, default: new Date(+new Date() + 365*24*60*60*1000) }

});

// create the model for demand and expose it to our app
module.exports = mongoose.model('Blacklist', blacklistSchema);