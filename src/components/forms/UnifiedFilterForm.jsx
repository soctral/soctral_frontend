/**
 * Unified Filter Form Component
 * 
 * A dynamic form that renders platform-specific filters based on configuration.
 * Replaces all individual platform filter forms (FacebookFilterForm, TwitterFilterForm, etc.)
 */

import React, { useState, useCallback, useMemo } from 'react';
import { X, ArrowLeft } from 'lucide-react';
import { useStableFormState } from '../../hooks/useStableFormState';
import { DynamicFormField } from './FormField';
import {
    getPlatformConfig,
    getFormFields,
    getInitialFormState,
    transformToApiFormat,
    validateFormData,
} from '../../config/platformConfig';

export const UnifiedFilterForm = ({
    platform,
    isOpen,
    onClose,
    onSubmit,
    existingData = null,
}) => {
    const config = useMemo(() => getPlatformConfig(platform), [platform]);

    // Get filter fields based on platform
    const filterFields = useMemo(() => {
        if (!config) return [];
        return getFormFields(platform, 'filters');
    }, [platform, config]);

    // Initialize form state
    const defaultState = useMemo(() => {
        return getInitialFormState(platform, 'filters');
    }, [platform]);

    const { formData, handleInputChange } = useStableFormState(defaultState, existingData);

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    // Memoized submit handler
    const handleSubmit = useCallback(async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            // Validate form
            const { isValid, errors } = validateFormData(formData, filterFields);

            if (!isValid) {
                const firstError = Object.values(errors)[0];
                throw new Error(firstError || 'Please fill in all required fields');
            }

            // Calculate score based on filled fields
            const filledFields = filterFields.filter(
                field => formData[field.key]?.toString().trim() !== ''
            ).length;
            const score = Math.round((filledFields / filterFields.length) * 100);

            // Transform to API format
            const filters = transformToApiFormat(formData, filterFields);

            console.log('📦 Submitting filters:', { platform, score, filters });

            // Pass filters back to parent
            onSubmit(score, 'filters', filters);

        } catch (err) {
            setError(err.message || 'Failed to submit filters');
            console.error('❌ Error submitting filters:', err);
        } finally {
            setLoading(false);
        }
    }, [formData, filterFields, platform, onSubmit]);

    // Check if form is valid
    const isFormValid = useCallback(() => {
        const requiredFields = filterFields.filter(f => f.required);
        return requiredFields.every(field => {
            const value = formData[field.key];
            return value !== '' && value !== undefined && value !== null;
        });
    }, [formData, filterFields]);

    if (!isOpen) return null;
    if (!config) {
        return (
            <div className="fixed inset-0 bg-gradient-to-b from-black/90 via-black/80 to-black/90 z-[10001] flex items-center justify-center">
                <div className="bg-[#0D0D0D] rounded-lg p-6 w-full max-w-xl shadow-2xl">
                    <p className="text-red-500">Platform "{platform}" not found</p>
                    <button onClick={onClose} className="mt-4 text-gray-400 hover:text-white">
                        Close
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="fixed inset-0 bg-gradient-to-b from-black/90 via-black/80 to-black/90 z-[10001] rounded-md flex items-center justify-center overflow-y-auto">
            <div className="bg-[#0D0D0D] rounded-lg p-6 w-full max-w-lg shadow-2xl my-8 max-h-[calc(100vh-4rem)] overflow-y-auto">
                {/* Header */}
                <div className="w-full flex items-center justify-between mb-6">
                    <button
                        onClick={onClose}
                        className="text-gray-400 hover:text-white transition-colors"
                    >
                        <ArrowLeft className="w-5 h-5" />
                    </button>

                    <button
                        onClick={onClose}
                        className="text-gray-400 hover:text-white transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Title */}
                <div className="flex flex-col items-center justify-center mb-[.8rem]">
                    <h3 className="text-md font-semibold mb-5">
                        {config.label} Account Filters
                    </h3>
                    <p className="text-xs font-normal text-[#868686]">
                        Filters marked with (*) are mandatory and must be provided. Ensure all required details are accurate for better visibility and matching.
                    </p>
                </div>

                {/* Error Display */}
                {error && (
                    <div className="mb-4 p-3 bg-red-500/10 border border-red-500 rounded-lg">
                        <p className="text-red-500 text-sm">{error}</p>
                    </div>
                )}

                {/* Form */}
                <form onSubmit={handleSubmit} className="space-y-5">
                    {filterFields.map(field => (
                        <DynamicFormField
                            key={field.key}
                            field={field}
                            value={formData[field.key]}
                            onChange={handleInputChange}
                        />
                    ))}

                    {/* Submit Button */}
                    <div className="flex gap-3 pt-4">
                        <button
                            type="submit"
                            disabled={!isFormValid() || loading}
                            className={`flex-1 px-4 py-3 text-white rounded-full transition-colors ${isFormValid() && !loading
                                    ? 'bg-[#613cd0] hover:bg-[#7050d5]'
                                    : 'bg-gray-500 cursor-not-allowed'
                                }`}
                        >
                            {loading ? 'Uploading...' : 'Upload'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default UnifiedFilterForm;
