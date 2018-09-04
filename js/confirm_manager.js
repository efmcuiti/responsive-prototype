$(document).ready(function () {
  
  var SEND_BUTTON_ID = '#sendForm',
      REJECT_BUTTON_ID = '#rejectButton',
      CONFIRM_PAGE_TITLE = 'Compra cuando quieras, Paga cuando puedas.',
      REGISTER_PAGE_TITLE = 'Acelera tus ventas y has de las compras un proceso simple.',
      currentSection = 0,
      allSections = $('.formContainer');
  
  // 1. Prepare the slides.
  prepareSections();
  
  // 3. handle the clicks.
  $('.subtitle').click(function (event) {
    var parentDiv = $(this).closest('.sectionContainer'),
        childForm = parentDiv.find('.formContainer');
    childForm.toggle('slow');
  });
  
  /**
    * Hides sections and subsections leaving just the first portion ready.
    */
  function prepareSections() {
    // 0. Set the title.
    var href = window.location.href,
        title = (href.indexOf('confirmPurchase') !== -1) ? CONFIRM_PAGE_TITLE : REGISTER_PAGE_TITLE;
    $('title').html(title);
    
    // 1. Hide all sections.
    $('.formContainer').hide();
  }
});