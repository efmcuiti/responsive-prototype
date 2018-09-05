$(document).ready(function () {
  var FORM_MODAL_SUFFIX = "-modal",
      SERVICES_HOST = "http://localhost:8091",
      CONFIRM_ENDPOINT = "/v1/purchase/confirm",
      RETRIEVE_BANKS_ENDPOINT = "/v1/bank",
      RETRIEVE_PURCHASE_ENDPOINT = "/v1/purchase",
      APIKEY = "e1947a58931ca8103afb8f7c9e7df1ba",
      AUTHORIZATION = "Bearer 30ddec919a1a344be4d18263bcd0011b",
      PENDING_STATUS = "pendingConfirmation",
      JS_BUYER_FORM_ID = "js-persodata-buyer",
      JS_CC_FORM_ID = "js-persodata-cc",
      CC_IMAGES = {
        "basePath": "img/iconset/",
        "AMX": "amex.svg",
        "VIS": "visa.svg",
        "MAS": "master-card.svg",
        "DIN": "dinners.svg",
        "bluepay": "bluepay.svg"
      },
      CC_NUMBER_MASK = "**** **** **** ",
      SERVICE_TIMEOUT = 10 * 1000, // 10 seconds.
      REJECT_SUCCESS_MSG = 'La compra ha sido rechazada.',
      CONFIRM_SUCCESS_MSG = 'Felicitaciones, tu compra fue confirmada. <br /> En poco tiempo te informaremos ' +
        'a tu correo electr&oacute;nico el resultado de la evaluaci&oacute;n.',
      REJECT_TITLE_MSG = 'Resultado del rechazo',
      CONFIRM_TITLE_MSG = 'Resultado de la confirmaci&oacute;n',
      ERROR_TITLE_MSG = 'Error',
      WRONG_STATUS_TITLE_MSG = 'Importante',
      REDIRECT_LOCATION = 'https://www.prestapolis.com/',
      GENERIC_400_ERROR_MSG = 'Error en la informaci&oacute;n, por favor verifique los datos e intente de nuevo.',
      GENERIC_500_ERROR_MSG = 'Error en el sistema, por favor intente m&aacute;s tarde.',
      WRONG_STATUS_MSG = 'La compra asociada a este enlace ya se proces&oacute;.',
      currentFormModal = '',
      purchaseId = getUrlVars()['purchase'],
      currentBill,
      ccInfo;
      
  // Confirm button clicked.
  $('.js-confirm').click(function (event) {
    var confirmedPurchase = wrapConfirmationRequest();
    sendConfirmRequest(confirmedPurchase, true);
  });
  
  // Reject button clicked.
  $('.js-reject').click(function (event) {
    currentFormModal = 'js-confirm-reject-modal';
    $('#js-confirm-reject-modal').css('display', 'block');
  });
  
  $('#js-confirm-rejection').click(function (event) {
    buildMockBillInfo();
    var confirmedPurchase = wrapConfirmationRequest();
    sendConfirmRequest(confirmedPurchase, false);
  });

  // 1. Hide all the view more divs (and modals).
  $('.js-show-more__content').hide();
  $('.modal').css('display', 'none');
  
  $('#cc-number').keyup(function (event) {
    var number = $(this).val() + ''
        key = event.originalEvent.key,
        effectiveNumber = number.replace(/\s+/g, '');
    if ((key === 'Backspace') && (effectiveNumber.length > 0) && (effectiveNumber.length%4 === 0)) {
      number = number.substring(0, number.length-1);
      $(this).val(number);
    }
    effectiveNumber = number.replace(/\s+/g, '');
    if (((effectiveNumber.length > 0)) && (effectiveNumber.length%4 === 0)) {
      $(this).val(number + ' ');
    }
  });

  initFlow();

  // 2. Show the more divs when appropriate.
  $('.js-show-more__link').click(function (event) {
    var close_detail = $(this).closest('.content--detail'),
        to_show = close_detail.find('.js-show-more__content');
    to_show.toggle('slow');
    scrollToAnchor(to_show);
  });

  // 3. "Save" any change in the forms.
  $('.js-modal-save').click(function (event) {
    // Once a "save" button is clicked, we must update the billInfo element.
    // Also, we must update the informative elements.
    // In case of the credit card, we shall update a sepparate object.
    var candidate = $(this).attr('id');
    currentFormModal = $(this).closest('.modal').attr('id');
    switch(candidate) {
      case JS_BUYER_FORM_ID :
        saveBillBuyerInfo();
        break;
      case JS_CC_FORM_ID :
        saveBillBuyerCcInfo();
        break;
    }

    // In the end, we should close the form modal.
    $('#' + currentFormModal).css('display', 'none');
    currentFormModal = '';
  });

  // Modal management.
  $('.js-edit').click(function(event) {
    currentFormModal = $(this).attr('id') + FORM_MODAL_SUFFIX;
    $('#' + currentFormModal).css('display', 'block');
  });

  $('.js-modal-close').click(function(event) {
    $('#' + currentFormModal).css('display', 'none');
    var redirect = $('#' + currentFormModal).attr('redirect');
    currentFormModal = '';
    if (redirect) {
      window.location.replace(REDIRECT_LOCATION);
    }
  });

  $('body').keypress(function(event) {
    if (event.which == 13) {
      $('#' + currentFormModal).css('display', 'none');
      currentFormModal = '';
    }
  });
  
  // Dues slider management.
  $('#cc-Dues').on('input', function(event) {
    $('#cc-DuesLabel').text($(this).val());
  });

  /** 
    * Read a page's GET URL variables and return them as an associative array.
    */
  function getUrlVars()
  {
    var vars = [], 
        hash;
    var hashes = window.location.href.slice(window.location.href.indexOf('?') + 1).split('&');
    for(var i = 0; i < hashes.length; i++)
    {
      hash = hashes[i].split('=');
      vars.push(hash[0]);
      if (hash[1]) {
        vars[hash[0]] = hash[1].replace(/#/g, "");
      }
    }
    return vars;
  }

  /**
    * Once a "view more" link is clicked. This method ensures the element 
    * is kept within the user's view span.
    * @param anchor Where to roll to.
    */
  function scrollToAnchor(anchor){
    var aTag = $(anchor);
    $('html,body').animate({scrollTop: aTag.offset().top},'slow');
  }

  /**
    * Check if there is a bill id and tries to retrieve information
    * from the back-end services.
    */
  function initFlow() {
    if (!purchaseId) {
      var rawHref = window.location.href;
      purchaseId = rawHref.substring(rawHref.lastIndexOf('/')+1);
    }
    
    if (!purchaseId) {
      console.log('No purchase was provided.');
      return;
    }

    loadBillData(purchaseId);
    
    // 2. Load the list of banks.
    // loadBanksList(); // Suspended since they're not important in the first delivery.
  }

  /**
    * Using the purchase provided through the path, this method 
    * retrieves the initial registered data for it.
    * @param billId What to query to the services host.
    */
  function loadBillData(billId) {
    var bill;

    $.ajax({
      url: SERVICES_HOST + RETRIEVE_PURCHASE_ENDPOINT,
      method: 'GET',
      beforeSend: function(xhr) {
        xhr.setRequestHeader('apikey', APIKEY);
        xhr.setRequestHeader('Authorization', AUTHORIZATION);
        xhr.setRequestHeader('billId', billId);
      },
      statusCode: {
        404: function() {
          console.log('Could not find bill data for the id: ' + billId);
        },
        400: function() {
          console.log('Bad request for the bill: ' + billId);
        },
        500: function() {
          console.log('Internal Error');
        }
      },
      success: function(result) {
        updateBillContent(result);
      },
      error: function(err) {
        console.log(JSON.stringify(err, null, 2));
      } 
    });
  }

  /**
    * Given a JSON message with the given bill, this method replaces the content
    * if it has the right status.
    * @billInfo JSON object with the required data.
    */
  function updateBillContent(billInfo) {
    if (billInfo['status'] !== PENDING_STATUS) {
      console.log('The bill has the wrong status.');
      prepareInformativeModal(WRONG_STATUS_TITLE_MSG, WRONG_STATUS_MSG);
      currentFormModal = 'js-generic-modal';
      $('#'+ currentFormModal).attr('redirect', 'true');
      $('#'+ currentFormModal).css('display', 'block');
      return;
    }

    currentBill = billInfo;

    // 1. Load the basic-unchanged-data.
    updateBillBasicInfo(currentBill);

    // 2. Load the buyer info.
    updateBillBuyerInfo(currentBill);
  }

  /**
    * Handles the elements in the form containing the bill data. It prints 
    * the data.
    * @billInfo Basic bill data to pre-load in the form.
    */
  function updateBillBasicInfo(billInfo) {
    // Load the basic bill info.
    $('#billProduct').text(billInfo['item']);


    var value = billInfo['billAmount'],
        amount = '$' + value.toFixed(2).replace(/(\d)(?=(\d\d\d)+(?!\d))/g, "$1,");
    $('#billAmount').text(amount);

    $('#billDescription').text(billInfo['description']);

    var rawIva = (billInfo['iva']/100) * value,
        iva = '$' + rawIva.toFixed(2).replace(/(\d)(?=(\d\d\d)+(?!\d))/g, "$1,");
    $('#billIva').text(iva + ' (' + billInfo['iva'] + '%)');
  }

  /**
    * Handles the elements in the form containing the bill data. It prints 
    * the data.
    * Important: We must remove the Time Zone part of the date in order to correctly load it in 
    * the forms.
    * @billInfo Basic bill data to pre-load in the form.
    */
  function updateBillBuyerInfo(billInfo) {
    var fullName = billInfo.persoData.firstName;
    if (billInfo.persoData.middleName) {
      fullName += ' ' + billInfo.persoData.middleName;
    }
    fullName += ' ' + billInfo.persoData.lastName;
    if (billInfo.persoData.otherNames) {
      fullName += ' ' + billInfo.persoData.otherNames;
    }

    // 1. Update the visual data.
    $('#buyerName').text(fullName);
    $('#buyerEmail').text(billInfo.persoData.contacts[0].email);
    $('#buyerIdType').text(billInfo.persoData.idType);
    $('#buyerIdNumber').text(billInfo.persoData.idNumber.replace(/(\d)(?=(\d\d\d)+(?!\d))/g, "$1."));
    $('#buyerBirthDate').text(billInfo.persoData.birthdate.split("T")[0]);
    $('#buyerPhoneNumber').text(billInfo.persoData.contacts[0].mobilePhone);
    $('#buyerAddress').text(billInfo.persoData.contacts[0].address); 

    // 2. Update the corresponding form fields (in case the user wants to modify it.
    $('#persodata-idNumber').val(billInfo.persoData.idNumber);
    $('#persodata-name').val(fullName);
    $('#persodata-birthdate').val(billInfo.persoData.birthdate.split("T")[0]);
    $('#persodata-phone').val(billInfo.persoData.contacts[0].mobilePhone);
    $('#persodata-email').val(billInfo.persoData.contacts[0].email);
    $('#persodata-address').val(billInfo.persoData.contacts[0].address);
  }

  /**
    * Handles the elements in the form containing the credit card data. It prints 
    * the data.
    * Important: We must remove the Time Zone part of the date in order to correctly load it in 
    * the forms.
    * @buyerCcInfo Credit Card information to update in the page.
    */ 
  function updateBillBuyerCcInfo(buyerCcInfo) {
    // 1. Update the visual data.
    var maskedNumber = CC_NUMBER_MASK + buyerCcInfo.number.substring(buyerCcInfo.number.length-4);
    $('#ccMaskedNumber').text(maskedNumber);
    $('#ccExpiresOn').text(buyerCcInfo.expires.split("-01T")[0]);
    $('#ccDues').text(buyerCcInfo.dues);

    // 1.1. Update the icon image for the card.
    var icon = CC_IMAGES.basePath + CC_IMAGES[buyerCcInfo.issuer];
    console.log('Img: ' + $('#js-cc-img').val());
    $('#js-cc-img').attr('src', icon);
  }

  /**
    * Takes the data from the Buyer's form and updates the currentBill object with 
    * its data.
    */
  function saveBillBuyerInfo() {
    // 1. Update the currentBill.
    currentBill.persoData.idNumber = $('#persodata-idNumber').val();
    currentBill.persoData.birthdate = $('#persodata-birthdate').val() + 'T00:00:00Z';
    currentBill.persoData.contacts[0].mobilePhone = $('#persodata-phone').val();
    currentBill.persoData.contacts[0].email = $('#persodata-email').val();
    currentBill.persoData.contacts[0].address = $('#persodata-address').val();

    // 1.1. For the buyer's name, we require some additional logic.
    var nameParts = $('#persodata-name').val().split(' ');
    currentBill.persoData.firstName = nameParts[0];
    if (nameParts.length > 2) {
      currentBill.persoData.middleName = nameParts[1];
      currentBill.persoData.lastName = nameParts[2];
      if (nameParts[3]) {
        currentBill.persoData.otherNames = nameParts[3];
      }
    } else {
      currentBill.persoData.lastName = nameParts[1];
    }

    // 2. Trigger the visual update.
    updateBillBuyerInfo(currentBill);
  }

  /**
    * Takes the data from the Buyer's Credit Card form and updates the cc object with 
    * its data.
    */
  function saveBillBuyerCcInfo() {
    // 1. Update the current credit card info.
    ccInfo = {
      "number": $('#cc-number').val() + "",
      "cvc": $('#cc-cvc').val() + "",
      "expires": '20' + $('#cc-expDate--year').val() + '-' + $('#cc-expDate--month').val() + '-01T00:00:00Z',
      "issuer": defineCardIssuer($('#cc-number').val() + ""),
      "dues": parseInt($('#cc-Dues').val())
    };
    // 2. Trigger the visual update.
    updateBillBuyerCcInfo(ccInfo);
  }

  /**
    * Given a credit card's number in string format,
    * this method defines the issuer.
    * Visa: 4xxx
    * Amex: 3xxx, 37xx
    * MasterCard: 5xxx
    * Dinners club: 300x 305xx 36xx 38xx
    * @param cardNumber Based on it, the image will be assigned.
    */
  function defineCardIssuer(cardNumber) {
    if (cardNumber.startsWith('4')) {
      return "VIS";
    }

    if (cardNumber.startsWith('5')) {
      return "MAS";
    }

    if (cardNumber.startsWith('3') || cardNumber.startsWith('37')) {
      return "AMX";
    }
    
    if (cardNumber.startsWith('300') || cardNumber.startsWith('305')
          || cardNumber.startsWith('36') || cardNumber.startsWith('38')) {
      return "DIN";
    }
    
    return "bluepay"; // default.
  }

  /**
    * Prepares the JSON message with the confirmation of the purchase.
    */
  function wrapConfirmationRequest() {
    var confirmRequest = {
      "idType": currentBill.persoData.idType,
      "idNumber": currentBill.persoData.idNumber,
      "firstName": currentBill.persoData.firstName,
      "lastName": currentBill.persoData.lastName,
      "middleName": currentBill.persoData.middleName,
      "otherNames": currentBill.persoData.otherNames,
      "economicActivity": "",
      "birthdate": currentBill.persoData.birthdate,
      "contacts": [
        {
          "mobilePhone": currentBill.persoData.contacts[0].mobilePhone,
          "email": currentBill.persoData.contacts[0].email,
          "address": currentBill.persoData.contacts[0].address,
          "default": true
        }
      ],
      "cards": [
        {
          "cvc": ccInfo.cvc,
          "issuer": ccInfo.issuer,
          "type": "Credit",
          "expiresOn": ccInfo.expires,
          "number": ccInfo.number,
          "bankId": 1
        }
      ],
      "bills": [
        {
          "billId": purchaseId,
          "dues": ccInfo.dues
        }
      ],
      "countryCode": 57
    };
    return confirmRequest;
  }
  
  /**
    * Sends a request towards the service layer related with the confirmation/rejection of 
    * a purchase.
    * @param confirmedPurchase JSON message with all the purchase information.
    * @param confirm True if the user accepted the purchase, false if she rejects.
    */
  function sendConfirmRequest(confirmedPurchase, confirm) {
    $.ajax({
      url: SERVICES_HOST + CONFIRM_ENDPOINT,
      method: 'POST',
      beforeSend: function(xhr) {
        xhr.setRequestHeader('apikey', APIKEY);
        xhr.setRequestHeader('Authorization', AUTHORIZATION);
        xhr.setRequestHeader('confirmed', confirm);
      },
      contentType: "application/json",
      data: JSON.stringify(confirmedPurchase),
      statusCode: {
        404: function() {
          prepareInformativeModal(ERROR_TITLE_MSG, GENERIC_400_ERROR_MSG);
          currentFormModal = 'js-generic-modal';
          $('#'+ currentFormModal).css('display', 'block');
          console.error('No confirm response found.');
        },
        400: function(response) {
          prepareInformativeModal(ERROR_TITLE_MSG, GENERIC_400_ERROR_MSG);
          currentFormModal = 'js-generic-modal';
          $('#'+ currentFormModal).css('display', 'block');
          console.error('Bad request for the confirm request.');
        },
        500: function() {
          prepareInformativeModal(ERROR_TITLE_MSG, GENERIC_500_ERROR_MSG);
          currentFormModal = 'js-generic-modal';
          $('#'+ currentFormModal).css('display', 'block');
          console.error('Internal Error when confirming.');
        }
      },
      success: function(response) {
        // 1. Load the generic modal.
        // 2.1. Prepare the text and sections.
        var msg = (confirm) ? CONFIRM_SUCCESS_MSG : REJECT_SUCCESS_MSG,
            title = (confirm) ? CONFIRM_TITLE_MSG : REJECT_TITLE_MSG;
        prepareInformativeModal(title, msg);
        currentFormModal = 'js-generic-modal';
        $('#'+ currentFormModal).attr('redirect', 'true');
        $('#'+ currentFormModal).css('display', 'block');
        console.log(JSON.stringify(response, null, 2))
      },
      error: function(err) {
        console.error(JSON.stringify(err, null, 2));
      } 
    });
  }
  
  /**
    * Guiven the bug present in the back end services,
    * this method builds a false-info data for CC-Info
    * in the case of a rejection.
    * IMPORTANT: Remove once the JIRA: SPLIT-62 is solved.
    * (https://prestapolis.atlassian.net/browse/SPLIT-62)
    */
  function buildMockBillInfo() {
    ccInfo = {
      "number": '1111111111111111',
      "cvc": '111',
      "expires": '1900-01-01T00:00:00Z',
      "issuer": 'UND',
      "dues": 0
    };
  }
  
  /**
    * Given a text content, this function prepares the content of the generic modal window
    * to display the given content.
    * @param title What title to show to the user.
    * @param content What to display to the user.
    * @param isError True if we are going to show errors, false otherwise.
    */
  function prepareInformativeModal(title, content, isError) {
    // 1. Hide the error's section and show the contents.
    if (isError) {
      $('#js-modal-error').show();
      $('#js-modal-info').hide();
      $('#js-modal-error').html(content);
    } else {
      $('#js-modal-error').hide();
      $('#js-modal-info').show();
      $('#js-modal-info').html(content);
    }
    
    // 2. Set the title and the text content.
    $('#js-generic-modal__title--content').html(title);
  }
});