/**
 * Reusable Form Field Components
 * 
 * These components provide consistent styling and behavior for form fields
 * across all platform forms.
 */

import React, { memo, useCallback, useId } from 'react';
import star from '../../assets/star.svg';

// =========================================
// TextField Component
// =========================================
export const TextField = memo(({
    name,
    label,
    sublabel,
    value,
    onChange,
    type = 'text',
    required = false,
    placeholder,
    step,
    min,
    max,
    disabled = false,
}) => {
    const fieldId = useId();

    return (
        <div>
            <div className="flex items-center gap-1 text-sm mb-2">
                <img src={star} alt="" />
                <h2>{label} {required && <span className="text-primary"> *</span>}</h2>
            </div>
            {sublabel && (
                <label htmlFor={fieldId} className="block text-sm font-normal text-[#868686] mb-2">
                    {sublabel}
                </label>
            )}
            <input
                id={fieldId}
                type={type}
                name={name}
                value={value}
                onChange={onChange}
                step={step}
                min={min}
                max={max}
                disabled={disabled}
                className="w-full px-3 py-4 bg-[rgba(255,255,255,0.1)] text-xs rounded-full text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#613cd0]"
                placeholder={placeholder || `Enter ${label}`}
            />
        </div>
    );
});

TextField.displayName = 'TextField';

// =========================================
// NumberField Component
// =========================================
export const NumberField = memo(({
    name,
    label,
    sublabel,
    value,
    onChange,
    required = false,
    placeholder,
    step = 1,
    min = 0,
    max,
    disabled = false,
}) => {
    return (
        <TextField
            name={name}
            label={label}
            sublabel={sublabel}
            value={value}
            onChange={onChange}
            type="number"
            required={required}
            placeholder={placeholder}
            step={step}
            min={min}
            max={max}
            disabled={disabled}
        />
    );
});

NumberField.displayName = 'NumberField';

// =========================================
// SelectField Component
// =========================================
export const SelectField = memo(({
    name,
    label,
    sublabel,
    value,
    onChange,
    options = [],
    required = false,
    placeholder = 'Select an option',
    disabled = false,
}) => {
    const fieldId = useId();

    return (
        <div>
            <div className="flex items-center gap-1 text-sm mb-2">
                <img src={star} alt="" />
                <h2>{label} {required && <span className="text-primary"> *</span>}</h2>
            </div>
            {sublabel && (
                <label htmlFor={fieldId} className="block text-sm font-normal text-[#868686] mb-2">
                    {sublabel}
                </label>
            )}
            <select
                id={fieldId}
                name={name}
                value={value}
                onChange={onChange}
                disabled={disabled}
                className="w-full px-3 py-4 bg-[rgba(255,255,255,0.1)] text-xs rounded-full text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#613cd0]"
            >
                <option value="">{placeholder}</option>
                {options.map(option => (
                    <option key={option.value} value={option.value}>
                        {option.label}
                    </option>
                ))}
            </select>
        </div>
    );
});

SelectField.displayName = 'SelectField';

// =========================================
// BooleanField Component (Yes/No Radio)
// =========================================
export const BooleanField = memo(({
    name,
    label,
    sublabel,
    value,
    onChange,
    required = false,
    disabled = false,
}) => {
    const groupId = useId();

    return (
        <div>
            <div className="flex items-center gap-1 text-sm mb-2">
                <img src={star} alt="" />
                <h2>{label} {required && <span className="text-primary"> *</span>}</h2>
            </div>
            {sublabel && (
                <label className="block text-sm font-normal text-[#868686] mb-2">
                    {sublabel}
                </label>
            )}
            <div className="flex gap-4">
                <label className="flex items-center gap-2 cursor-pointer">
                    <input
                        type="radio"
                        name={name}
                        value="yes"
                        checked={value === 'yes'}
                        onChange={onChange}
                        disabled={disabled}
                        className="w-4 h-4 text-purple-600 border-2 border-gray-300 focus:ring-purple-500 focus:ring-2 checked:border-purple-600"
                    />
                    <span className="text-white text-sm">Yes</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer">
                    <input
                        type="radio"
                        name={name}
                        value="no"
                        checked={value === 'no'}
                        onChange={onChange}
                        disabled={disabled}
                        className="w-4 h-4 text-purple-600 border-2 border-gray-300 focus:ring-purple-500 focus:ring-2 checked:border-purple-600"
                    />
                    <span className="text-white text-sm">No</span>
                </label>
            </div>
        </div>
    );
});

BooleanField.displayName = 'BooleanField';

// =========================================
// DateField Component
// =========================================
export const DateField = memo(({
    name,
    label,
    sublabel,
    value,
    onChange,
    required = false,
    disabled = false,
    type = 'month', // 'date' or 'month'
}) => {
    const fieldId = useId();

    return (
        <div>
            <div className="flex items-center gap-1 text-sm mb-2">
                <img src={star} alt="" />
                <h2>{label} {required && <span className="text-primary"> *</span>}</h2>
            </div>
            {sublabel && (
                <label htmlFor={fieldId} className="block text-sm font-normal text-[#868686] mb-2">
                    {sublabel}
                </label>
            )}
            <input
                id={fieldId}
                type={type}
                name={name}
                value={value}
                onChange={onChange}
                disabled={disabled}
                className="w-full px-3 py-4 bg-[rgba(255,255,255,0.1)] text-xs rounded-full text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#613cd0] [color-scheme:dark]"
            />
        </div>
    );
});

DateField.displayName = 'DateField';

// =========================================
// Dynamic Form Field Renderer
// =========================================
import { FIELD_TYPES } from '../../config/platformConfig';

export const DynamicFormField = memo(({
    field,
    value,
    onChange,
    disabled = false,
}) => {
    const handleChange = useCallback((e) => {
        onChange(e);
    }, [onChange]);

    const commonProps = {
        name: field.key,
        label: field.label,
        sublabel: field.sublabel,
        value: value || '',
        onChange: handleChange,
        required: field.required,
        disabled,
    };

    switch (field.type) {
        case FIELD_TYPES.TEXT:
            return <TextField {...commonProps} />;

        case FIELD_TYPES.NUMBER:
            return (
                <NumberField
                    {...commonProps}
                    step={field.step || 1}
                    min={field.min}
                    max={field.max}
                />
            );

        case FIELD_TYPES.BOOLEAN:
            return <BooleanField {...commonProps} />;

        case FIELD_TYPES.SELECT:
            return (
                <SelectField
                    {...commonProps}
                    options={field.options || []}
                    placeholder={field.placeholder || `Select ${field.label}`}
                />
            );

        case FIELD_TYPES.DATE:
            return <DateField {...commonProps} type={field.dateType || 'month'} />;

        default:
            return <TextField {...commonProps} />;
    }
});

DynamicFormField.displayName = 'DynamicFormField';

export default {
    TextField,
    NumberField,
    SelectField,
    BooleanField,
    DateField,
    DynamicFormField,
};
