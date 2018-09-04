$(document).ready(function() {
  // Modal management.
  $('#modalCloseBtn').click(function(event) {
    $('#msgModal').css('display', 'none');
  });
  $('body').keypress(function(event) {
    if (event.which == 13) {
      $('#msgModal').css('display', 'none');
    }
  });
});