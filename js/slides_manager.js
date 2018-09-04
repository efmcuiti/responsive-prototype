$(document).ready(function () {
  
  var SEND_BUTTON_ID = '#sendForm',
      REJECT_BUTTON_ID = '#rejectButton',
      NEXT_BUTTON_ID = '#nextButton',
      BACK_BUTTON_ID = '#backButton',
      CONFIRM_PAGE_TITLE = 'Compra cuando quieras, Paga cuando puedas.',
      REGISTER_PAGE_TITLE = 'Acelera tus ventas y has de las compras un proceso simple.',
      currentSection = 0,
      allSections = $('.sectionContainer');
  
  // 1. Prepare the slides.
  prepareSections();
  
  // 2. Register the navigation methods.
  $(NEXT_BUTTON_ID).click(function(event) {
    navigate(1);
    verifyBoundaries();
  });
  $(BACK_BUTTON_ID).click(function(event) {
    navigate(-1);
    verifyBoundaries();
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
    $('.sectionContainer').hide();
    
    // 2. Get the first section, and hide its subsections (if any).
    $(allSections[0]).show();
    
    // 2.1. Begin the graphical counters.
    $('#prevStep').html('0');
    $('#nextStep').html('2');
    
    
    // 3. Check the boundaries.
    verifyBoundaries();
  }

  
  /**
    * Advance or roll back the slides.
    * Usage:
    * - A positive intenger means to advance.
    * - A negative integer means to go back.
    * @param step How much shoudl we advance, roll back.
    */
  function navigate(step) {
    // 1. Hide the current slide.
    $(allSections[currentSection]).hide('slow');
    
    // 2. Update the slide's index.
    currentSection += step;
    
    // 2.1. Update the graphical buttons.
    var nextStep = currentSection + 2,
        prevStep = currentSection;
    $('#prevStep').html(prevStep);
    $('#nextStep').html(nextStep);
    
    // 3. Show the new slide.
    $(allSections[currentSection]).show('slow');
  }
  
  /**
    * Verifies the boundary status to define if the form submit button should be enabled and the navigation buttons
    * (the get back) should be made invisible.
    */
  function verifyBoundaries() {
    // 1. If we are at the last section and subsection, we enable the send button and hide the continue one.
    if (currentSection === allSections.length-1) {
      $(SEND_BUTTON_ID).show();
      $(REJECT_BUTTON_ID).show();
      $(NEXT_BUTTON_ID).hide();
      $(BACK_BUTTON_ID).show();
    } else if (currentSection === 0) {
      // 2. If in the first slide, there is no back nor send button.
      $(BACK_BUTTON_ID).hide();
      $(SEND_BUTTON_ID).hide();
      $(REJECT_BUTTON_ID).hide();
      $(NEXT_BUTTON_ID).show();
    } else {
      // 3. In the middle of navigation, there is no send button.
      $(BACK_BUTTON_ID).show();
      $(SEND_BUTTON_ID).hide();
      $(REJECT_BUTTON_ID).hide();
      $(NEXT_BUTTON_ID).show();
    }
  }
});