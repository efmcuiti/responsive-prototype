$(document).ready(function () {
  var TYPES = {
    "text": "[0-9a-Z]"
  }
  
  $('.formInput').focusout(function (event){
    var type = $(this).attr('ppType');
    var idNum = $(this).val();
    if (idNum) {
      $(this).css("border-color","red");
    }
    console.log(idNum);
    console.log(type);
  });
});