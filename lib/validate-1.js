const $ = document.querySelector.bind(document);
const $$ = document.querySelectorAll.bind(document);

// Func Validator
function Validator(options) {
    // lấy element của form cần validate
    var formElement = $(options.form); // lấy toàn bộ element của form
    var selectorRules = {}; // Có thể validate nhiều Rules

    function getParrentDir(element, selector) {
        while(element.parentElement) {
            if(element.parentElement.matches(selector)) {
                return element.parentElement;
            }
            element = element.parentElement;
        }
    }
    
    //==========================================================================//
    // hàm thực hiện validate
    // validate event onblur
    function validate_onBlur(inputElement, rule) {        
        // value: inputElement.value
        // handle function: rule.handle()
        var errorElement = getParrentDir(inputElement, options.formGroupSelector).querySelector(options.errorSelector);            
        var errorMessage;

        // lấy ra các rules của selector
        var rules = selectorRules[rule.selector];
        // console.log(rules)

        // lặp qua từng rule & kiểm tra
        // nếu có lỗi thì dừng việc kiểm tra 
        
        for(var i=0;i<rules.length;i++){
            switch(inputElement.type) {
                case 'checkbox':
                    break;
            
                case 'radio':
                    errorMessage = rules[i](formElement.querySelector(rule.selector + ':checked'));
                    break;

                default:
                    errorMessage = rules[i](inputElement.value);
                    break;
            }
            if(errorMessage) break;
        }
        
        if(errorMessage) {
            errorElement.innerText = errorMessage;
            getParrentDir(inputElement, options.formGroupSelector).classList.add('invalid');
        } else {
            errorElement.innerText = '';
            getParrentDir(inputElement, options.formGroupSelector).classList.remove('invalid');
        }
        // console.log(!!errorMessage)
        return !errorMessage;
    }

    // validate event oninput
    function validate_onInput(inputElement) {        
        var errorElement = getParrentDir(inputElement, options.formGroupSelector).querySelector(options.errorSelector);            
        errorElement.innerText = '';
        getParrentDir(inputElement, options.formGroupSelector).classList.remove('invalid');
    }

    //==========================================================================//

    if(formElement){    
        // xử lí lặp qua mỗi rule và xử lí (lắng nghe sự kiện)
        formElement.onsubmit = function(e) {
            // loại bỏ sự kiện mặc định của submit form
            e.preventDefault();

            var isFormValid = true; // đặt flag để kiểm tra

            // lặp qua từng rule để xử lí sự kiện validate khi người dùng bấm submit
            options.rules.forEach((rule) => {
                var inputElement = formElement.querySelector(rule.selector);
                var isValid = validate_onBlur(inputElement, rule); 
                if(!isValid) isFormValid = false;
            });

            if(isFormValid) {
                // trường hợp submit với js
                if(typeof options.onSubmit === 'function') {
                    // select tất cả element có field là name & không có field là disable
                    var enableInputs = formElement.querySelectorAll('[name]:not([disable])');
                    // console.log(enableInputs);
                    // enableInputs sẽ không có các method như forEach, Map, Reduce
                    // Do đó cần convert Node List về lại Array
                    var formValue = Array.from(enableInputs).reduce((values, input) => {
                        switch(input.type) {
                            case 'radio':
                                values[input.name] = formElement.querySelector('input[name="' + input.name + '"]:checked').value;
                                break;

                            case 'checkbox':
                                if(!input.matches(':checked')) {
                                    values[input.name] = "";
                                    return values
                                }
                                if(!Array.isArray(values[input.name]) && input.matches(':checked')) values[input.name] = [];
                                values[input.name].push(input.value);
                                break;

                            case 'file':
                                values[input.name] = input.files;
                                break;
                            
                            default:
                                values[input.name] = input.value;
                                break;
                        }
                        return values;
                    }, {});

                    options.onSubmit(formValue);
                }
                // trường hợp submit với hành vi mặc định
                else {
                    formElement.submit();
                }
            }
        }

        // lấy từng option có rule đã được config
        options.rules.forEach((rule) => {
            // lưu lại các rules cho mỗi input
            if(Array.isArray(selectorRules[rule.selector])) {
                // nếu nó đã là một cái mảng thì push phần tử đó vào mảng đang có
                selectorRules[rule.selector].push(rule.handle);
            }else {
                // nếu không phải là một cái mảng thì sẽ gán cho nó bằng một cái mảng
                // với phần tử đầu tiên là một rule
                selectorRules[rule.selector] = [rule.handle];
            }
            
            var inputElements = formElement.querySelectorAll(rule.selector);
            Array.from(inputElements).forEach((inputElement) => {
                if(inputElement) {
                    // xử lí trường hợp blur khỏi input
                    inputElement.onblur = function() {
                        // gọi lại hàm validate để xử lí validate form
                        validate_onBlur(inputElement, rule); 
                    }
    
                    // xử lí trường hợp khi người dùng nhập 
                    inputElement.oninput = function() {
                        // gọi lại hàm validate để xử lí validate form
                        validate_onInput(inputElement); 
                    }
                }
            });
        })
    }    
}

// Định nghĩa rules
/*
    Nguyên tắc của các rules: 
    1. Khi có lỗi => trả ra message lỗi
    2. Khi không có lỗi => không trả ra cái gì cả
    3. Tham số message là tham số tuỳ chọn, nếu truyền vào thì sẽ hiện ra như msg
        cón không thì focus theo mặc định
*/

Validator.isRequied = function(selector, message) {
    return {
        selector: selector,
        handle: function(value) {
            return value ? undefined : (message || "Vui lòng nhập trường này");
        }
    }
}

Validator.isEmail = function(selector, message) {
    return {
        selector: selector,
        handle: function(value) {
            var regex = /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/;
            return regex.test(value) ? undefined : (message || "Trường này phải là email !");
        }
    }
}

Validator.minLength = function(selector, min, message) {
    return {
        selector: selector,
        handle: function(value) {
            return value.length >= min ? undefined : (message || `Vui lòng nhập tối thiểu ${min} kí tự !`);
        }
    }
}


Validator.isConfirmed = function(selector, getConfirmValue, message) {
    return {
        selector: selector,
        handle: function(value) {
            return value === getConfirmValue() ? undefined : (message || `Giá trị nhập vào không chính xác !`);
        }
    }
}

// ------------------------------------------------------------------------- //
Validator({
    form: '#form-1',
    formGroupSelector: '.form-group',
    errorSelector: '.form-message',
    rules: [
        // account
        Validator.isRequied('#fullname', 'Tên tài khoản không được phép để trống'),       
        Validator.minLength('#fullname', 8),    
        
        // email
        Validator.isRequied('#email'),    
        Validator.isEmail('#email', 'Cú pháp Email không chính xác. Vui lòng nhập lại !'),
        
        // password
        Validator.isRequied('#password'),    
        Validator.minLength('#password', 4),    
        
        // confirm password
        Validator.isRequied('#password_confirmation'),    
        Validator.isConfirmed('#password_confirmation', () => {
            return $('#password').value;
        }, 'Mật khẩu nhập lại không chính xác !'),

        // gender
        Validator.isRequied('input[name="gender"]'),    

        // province
        Validator.isRequied('#province'),  
        
        // avatar
        Validator.isRequied('#avatar'),  
    ],

    onSubmit: function(data) {
        console.log(data);
    }
});