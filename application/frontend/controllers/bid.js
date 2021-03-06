'use strict';

(function () {
  // Show list of possible bids
  $.get('/api/demands', function(data) {
    data.forEach((demand, index) => {
      console.log(demand.demandStatus);
      // if demand was already accepted, skip it
      if (demand.demandStatus !== 'open') {
        return;
      }
      $('#demands-list').append(
        '<div class="well" id="well-' + demand._id +'">' +
          '<p>Spec: ' + demand.spec + '</p>' +
          '<p>Bidding Timeline: ' + demand.biddingTimeline + '</p>' +
          '<input type="button" onclick="handleBidClick(\'' + demand._id + '\')" value="Bid" />' +
          '<div id="bid-form-div-' + demand._id + '" style="display: none;">' +
            '<div>' +
              '<label>Bid Amount $$$</label>' +
              '<input type="number" pattern="\d*" id="bid-amount-' + demand._id + '"/>' +
            '</div>' +
            '<div>' +
              '<label>Promised Timeline</label>' +
              '<input type="text" id="promised-timeline-' + demand._id + '"/>' +
            '</div>' +
            '<input type="button" onclick="handleBidOkayClick(\'' + demand._id + '\')" value="Okay" />' +
            '<input type="button" onclick="handleBidCancelClick(\'' + demand._id + '\')" value="Cancel" />' +
          '</div>' +
        '</div>'
      );
    });
  }, 'json' );
})();

function handleBidClick(id) {
  $('#bid-form-div-' + id).show();
};

function handleBidOkayClick(id) {
  const demandId = id;
  const bidAmount = $('#bid-amount-' + id).val();
  const promisedTimeline = $('#promised-timeline-' + id).val();

  $.post('/bid', { 'demandId': demandId, 'bidAmount': bidAmount, 'promisedTimeline': promisedTimeline }, function(data) {
    $('#well-' + id).hide();
    alert('Bid successful');
  });
}

function handleBidCancelClick(id) {
  $('#bid-form-div-' + id).hide();
}
