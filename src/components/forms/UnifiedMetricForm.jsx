/**
 * Unified Metric Form Component
 * 
 * A dynamic form that renders platform-specific metrics based on configuration.
 * Replaces all individual platform metric forms (FacebookMetricForm, TwitterMetricForm, etc.)
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

export const UnifiedMetricForm = ({
    platform,
    isOpen,
    onClose,
    onSubmit,
    existingData = null,
}) => {
    const config = useMemo(() => getPlatformConfig(platform), [platform]);

    // Account type for platforms with variants (e.g., Instagram)
    const [accountType, setAccountType] = useState(
        config?.accountTypes?.[0]?.value || null
    );

    // Get fields based on platform and account type
    const metricFields = useMemo(() => {
        if (!config) return [];
        return getFormFields(platform, 'metrics', accountType);
    }, [platform, accountType, config]);

    // Initialize form state
    const defaultState = useMemo(() => {
        return getInitialFormState(platform, 'metrics');
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
            const { isValid, errors } = validateFormData(formData, metricFields);

            if (!isValid) {
                const firstError = Object.values(errors)[0];
                throw new Error(firstError || 'Please fill in all required fields');
            }

            // Calculate score based on filled fields
            const filledFields = metricFields.filter(
                field => formData[field.key]?.toString().trim() !== ''
            ).length;
            const score = Math.round((filledFields / metricFields.length) * 100);

            // Transform to API format
            const metrics = transformToApiFormat(formData, metricFields);

            // Add account type if present
            if (accountType) {
                metrics.push({
                    key: 'account_type',
                    value: accountType,
                    type: 'string',
                });
            }

            console.log('📦 Submitting metrics:', { platform, score, metrics });

            // Pass metrics back to parent
            onSubmit(score, 'metrics', metrics);

        } catch (err) {
            setError(err.message || 'Failed to submit metrics');
            console.error('❌ Error submitting metrics:', err);
        } finally {
            setLoading(false);
        }
    }, [formData, metricFields, accountType, platform, onSubmit]);

    // Check if form is valid
    const isFormValid = useCallback(() => {
        const requiredFields = metricFields.filter(f => f.required);
        return requiredFields.every(field => {
            const value = formData[field.key];
            return value !== '' && value !== undefined && value !== null;
        });
    }, [formData, metricFields]);

    // Handle account type change
    const handleAccountTypeChange = useCallback((e) => {
        setAccountType(e.target.value);
    }, []);

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
            <div className="bg-[#0D0D0D] rounded-lg p-6 w-full max-w-xl shadow-2xl my-8 max-h-[calc(100vh-4rem)] overflow-y-auto">
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
                        {config.label} Account Metrics
                    </h3>
                    <p className="text-xs font-normal text-[#868686]">
                        Metrics marked with (*) are mandatory and must be provided. Ensure all required details are accurate to successfully upload your account.
                    </p>
                </div>

                {/* Account Type Selector (for platforms with variants) */}
                {config.accountTypes && config.accountTypes.length > 0 && (
                    <div className="mb-5">
                        <label className="block text-sm font-normal text-[#868686] mb-2">
                            Account Type
                        </label>
                        <div className="flex gap-4 flex-wrap">
                            {config.accountTypes.map(type => (
                                <label key={type.value} className="flex items-center gap-2 cursor-pointer">
                                    <input
                                        type="radio"
                                        name="accountType"
                                        value={type.value}
                                        checked={accountType === type.value}
                                        onChange={handleAccountTypeChange}
                                        className="w-4 h-4 text-purple-600 border-2 border-gray-300 focus:ring-purple-500 focus:ring-2 checked:border-purple-600"
                                    />
                                    <span className="text-white text-sm">{type.label}</span>
                                </label>
                            ))}
                        </div>
                    </div>
                )}

                {/* Error Display */}
                {error && (
                    <div className="mb-4 p-3 bg-red-500/10 border border-red-500 rounded-lg">
                        <p className="text-red-500 text-sm">{error}</p>
                    </div>
                )}

                {/* Form */}
                <form onSubmit={handleSubmit} className="space-y-5">
                    {metricFields.map(field => (
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

export default UnifiedMetricForm;
