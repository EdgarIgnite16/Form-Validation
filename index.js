// 1. Mong muốn / Kỳ vọng / Thành quả ==> output là gì ? 
var form = new Validator('#form-register', '.form-group', '.form-message');
form.onSubmit = function(formData) {
    console.log(formData);
}