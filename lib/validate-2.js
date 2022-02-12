const $ = document.querySelector.bind(document);
const $$ = document.querySelectorAll.bind(document);

function Validator(formSelector, formGr, formMsg, options = {}) {
    function getParent(element, selector) {
        while(element.parentElement) {
            if(element.parentElement.matches(selector)) {
                return element.parentElement;
            }
            element = element.parentElement;
        }
    }

    /*
        Quy ước tạo rules:
        1. Nếu có lỗi thì return errorMessage
        2. Nếu không có lỗi thỉ return undefined
    */

    var formRules = {}; // Khởi tạo formRules rỗng chứa các rule được ghi lại để thực hiện
    var validatorRules = {
        required: function(value) {
            return value ? undefined :  'Vui lòng nhập trường này !';
        },

        email: function(value) {
            var regex = /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/;
            return regex.test(value) ? undefined :  "Trường này phải là email !";
        },

        min: function(min) {
            return function(value) {
                return value.length >= min ? undefined : `Vui lòng nhập tối thiểu ${min} kí tự !`;
            }
        },

        max: function(max) {
            return function(value) {
                return value.length <= max ? undefined : `Vui lòng nhập tối đa ${max} kí tự !`;
            }
        },
    };


    // lấy ra form Element trong Dom theo formSelector
    var formElement = $(formSelector);

    // Nếu formElement có tồn tại
    if(formElement) {
        var inputs = formElement.querySelectorAll('[name][rules]'); // inputs: Node List
        for(var input of inputs) {
            var rules = input.getAttribute('rules').split('|');
            for(var rule of rules) {

                var ruleInfo;
                var isRuleHasValue = rule.includes(':');

                // nếu rule có tham số => tách tên của rule đó
                if(isRuleHasValue) {
                    ruleInfo = rule.split(':');
                    rule = ruleInfo[0]
                }

                var ruleFunc = validatorRules[rule];

                // tiếp tục chạy func trong rule và nhận về giá trị của rule => gán giá trị vào rule
                if(isRuleHasValue) {
                    ruleFunc = ruleFunc(ruleInfo[1]);
                }

                if(Array.isArray(formRules[input.name])) {
                    formRules[input.name].push(ruleFunc);
                } else {
                    formRules[input.name] = [ruleFunc];
                }
            }

            // lắng nghe sự kiện để validate: Blur, Change, 
            input.onblur = handleValidate;
            input.oninput = handleClearError;
        }

        // function validate
        // --------------- //
        // hàm thực hiện validate
        function handleValidate(event) {
            var rules = formRules[event.target.name];
            var errorMessage;

            rules.find((rule) => {
                errorMessage = rule(event.target.value);
                return errorMessage;
            })

            // Nếu có lỗi thì hiển thị message lỗi ra UI
            if (errorMessage) {
                var formGroup = getParent(event.target, formGr);
                if(formGroup) {
                    formGroup.classList.add('invalid');
                    var formMessage = formGroup.querySelector(formMsg);
                    if(formMessage) {
                        formMessage.innerText = errorMessage;
                    }
                }
            }

            return !errorMessage;
        }

        // Hàm Clear Msg Lỗi
        function handleClearError(event) {
            var formGroup = getParent(event.target, formGr);
            var isError = formGroup.classList.contains('invalid');
            if(isError) {
                formGroup.classList.remove('invalid');
                var formMessage = formGroup.querySelector(formMsg);
                if(formMessage) {
                    formMessage.innerText = '';
                }
            }
        }

        // Xử lí hành vi submit của form 
        formElement.onsubmit = function(event) {
            event.preventDefault();
            
            var inputs = formElement.querySelectorAll('[name][rules]'); // inputs: Node List
            var isValid = true;

            for(var input of inputs) {
                if(!handleValidate({target: input})) {
                    isValid = false;
                }
            }

            // Khi không có lỗi thì submit form
            if(isValid) {
                if(typeof options.onSubmit === 'function') {
                    // enableInputs sẽ không có các method như forEach, Map, Reduce
                    // Do đó cần convert Node List về lại Array

                    var enableInputs = formElement.querySelectorAll('[name]:not([disable])');
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

                    // gọi lại hàm onSubmit và trả về giá trị của form
                    options.onSubmit(formValue); // call API cho ajax
                } else {
                    formElement.submit();
                }
            }
        }
    }
}