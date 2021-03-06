const mongoose = require('mongoose');
let Demand = require('../models/demand.js');
let User = require('../models/user.js');

const bid = (app, isLoggedIn, checkUserAccess) => {
  const renderBid = (req, res) => {
    // render bid.ejs
    res.render('bid.ejs', {
      user: req.user // get the user out of session and pass to template
    });
  };

  // dev post bid
  const postBid = (req, res) => {
    const demandId = req.body.demandId;
    Demand
      .findOne({ '_id': demandId }) // find demand with demandId
      .exec(function(err, demand) {
        if (err) { throw err; }
        // grab params sent over with post request
        const bidAmount = req.body.bidAmount;
        const promisedTimeline = req.body.promisedTimeline;
        // get currently logged in dev's info
        const devId = req.user.id;
        const email = req.user.local.email;
        const name = req.user.local.realname;

        // create new bid object
        let newBid = {
          userId: devId,
          email: email,
          name: name,
          bidAmount: bidAmount,
          promisedTimeline: promisedTimeline,
          isLowestBid: false
        };

        // get array of all bids for current demand
        let currentBids = demand.bids;
        if (currentBids.length === 0) {
          // if there are no current bids, set the first bid to the lowest bid
          newBid.isLowestBid = true;
        } else {
          // check if the new bid is the lowest bid
          currentBids.forEach((bid, i) => {
            // find lowest bid
            if (bid.isLowestBid === true) {
              // once lowest bid is found, compare its bidAmoutn to new bid's bidAmount
              if (newBid.bidAmount < bid.bidAmount) {
                // if true, set newBid's isLowestBid to true and old lowest bid's isLowestBid to false
                newBid.isLowestBid = true;
                currentBids[i].isLowestBid = false;
              }
            }
          });
        }

        // push new bid to array of bids
        currentBids.push(newBid);
        // save updated list of bids
        demand.bids = currentBids;
        demand.save(function(err) {
          if (err) {
            throw err;
          }
          User
          .findOne({ '_id': req.user.id })
          .exec(function(err, user) {
            let postedBidIds = user.local.developerDetails.bidDemandIds;
            // push new demand id to list of demand ids
            postedBidIds.push(newBid.id);
            // save updated list of demand ids
            user.local.developerDetails.bidDemandIds = postedBidIds
            user.save(function(errr) {
              res.redirect('/bid');
            })
          })
        });

      });
  };

  // client accepts bid
  const acceptBid = (req, res) => {
    const demandId = req.body.demandId;
    const bidId = req.body.bidId;
    // find demand
    Demand
      .findOne({ '_id': demandId }) // find demand with demandId
      .exec(function(err, demand) {
        // find bid and set bidStatus to inReview
        // console.log(demand);
        const bids = demand.bids;
        // get id of dev who bid on demands
        let devId;
        bids.forEach((bid, i) => {
          devId = bid.userId;
          if (bid._id.toString() === bidId) {
            const bidAmount = bid.bidAmount;
            const clientMoney = req.user.local.deposit;
            // check if current user (client) has enough money to accept bid
            if (clientMoney >= bidAmount) {
              const bidAmount = bids[i].bidAmount;
              bids[i].bidStatus = 'accepted';
              demand.demandStatus = 'bidAccepted';
              demand.finalAcceptedBidAmount = bidAmount;

              // find contracdted dev and send 50% of bidding price to him
              User
                .findOne({ '_id': devId })
                .exec(function(err, dev) {
                  if (err) { throw err; }
                  dev.local.deposit += bidAmount * 0.5;
                  dev.save(function(err) {
                    if (err) {
                      throw err;
                    }
                    console.log('50% of bid amount sent to dev');

                    // find currently logged in client and take away 50% of bidding price
                    User
                      .findOne({ '_id': req.user.id })
                      .exec(function(err, client) {
                        if (err) { throw err; }
                        client.local.deposit -= bidAmount * 0.5;
                        client.save(function(err) {
                          if (err) {
                            throw err;
                          }
                          console.log('50% of bid amount taken from client');
                        })
                      });
                  });

                });

            } else {
              demand.demandStatus = 'clientNoMoney';
            }

          }
        });

        // save updated bid back to db document
        demand.bids = bids;

        // final contracted dev id
        demand.contractedDevId = devId;
        console.log(demand);
        demand.save((err, savedDemand) => {
          if (err) {
            throw err;
          }
          if (savedDemand.demandStatus === 'clientNoMoney') {
            res.send('No money');
          } else {
            res.send('Bid accepted');
          }

        });
      });

  };

  app.get('/bid', isLoggedIn, checkUserAccess, renderBid);
  app.post('/bid', isLoggedIn, checkUserAccess, postBid);
  app.post('/accept-bid', isLoggedIn, checkUserAccess, acceptBid);


  return app;
}

module.exports = bid
