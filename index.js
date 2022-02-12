// 1. Mong muốn / Kỳ vọng / Thành quả ==> output là gì ? 
Validator('#form-register', '.form-group', '.form-message', {
    onSubmit: function(data) {
        console.log('Call API.....')
        console.log(data)
    }
});