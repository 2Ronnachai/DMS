class AppValidation {
    static getDescriptionValidationRules(fieldName, isRequired = true) {
        return [
            ...(isRequired ? [{
                type: 'required',
                message: `${fieldName} is required`
            }] : []),
            {
                type: 'stringLength',
                min: 3,
                max: 50,
                message: 'Description must be between 3 and 50 characters'
            },
            {
                type: 'custom',
                validationCallback: (e) => {
                    if (!e.value) return true;

                    if (/['"]/.test(e.value)) {
                        e.rule.message = 'Single quotes (\') and double quotes (") are not allowed';
                        return false;
                    }

                    if (!/^[a-zA-Z0-9!%&()*+\-./#:=@_ ]+$/.test(e.value)) {
                        e.rule.message = 'Only letters, numbers and special characters (!%&()*+-./#:=@_) are allowed';
                        return false;
                    }

                    return true;
                }
            }
        ];
    }

    static getNumberValidationRules(fieldName, isRequired = true, minValue = null, maxValue = null) {
        const rules = [];

        if (isRequired) {
            rules.push({
                type: 'required',
                message: `${fieldName} is required`
            });
        }

        if (minValue !== null && maxValue !== null) {
            rules.push({
                type: 'numeric',
                message: `${fieldName} must be a valid number`
            });
            rules.push({
                type: 'range',
                min: minValue,
                max: maxValue,
                message: `${fieldName} must be between ${minValue} and ${maxValue}`
            });
        } else if (minValue !== null) {
            rules.push({
                type: 'numeric',
                message: `${fieldName} must be a valid number`
            });
            rules.push({
                type: 'range',
                min: minValue,
                message: `${fieldName} must be at least ${minValue}`
            });
        } else if (maxValue !== null) {
            rules.push({
                type: 'numeric',
                message: `${fieldName} must be a valid number`
            });
            rules.push({
                type: 'range',
                max: maxValue,
                message: `${fieldName} must be at most ${maxValue}`
            });
        }
        return rules;
    }

    static getCurrencyFormat(currency = 'THB', precision = 4) {
        return {
            type: 'fixedPoint',
            precision: precision,
            formatter: (value) => {
                if (value === null || value === undefined) return '';
                return `${value.toLocaleString('en-US', {
                    minimumFractionDigits: precision,
                    maximumFractionDigits: precision
                })} ${currency}`;
            }
        };
    }
}

// Example usage:
const appValidation = new AppValidation();