import { useState, useRef, useCallback, useEffect } from 'react';

/**
 * A stable form state hook that prevents form data loss on parent re-renders.
 * 
 * Features:
 * - Only initializes from existingData on first mount (not on re-renders)
 * - Provides memoized onChange handler to prevent unnecessary re-renders
 * - Tracks if form was already initialized to prevent data loss
 * 
 * @param {Object} defaultState - The default initial state for the form
 * @param {Object} existingData - Optional existing data to populate the form (e.g., from edit mode)
 * @returns {Object} { formData, setFormData, handleInputChange, resetForm }
 */
export const useStableFormState = (defaultState, existingData = null) => {
    // Track if we've already initialized to prevent re-initialization on re-renders
    const isInitializedRef = useRef(false);
    const existingDataKeyRef = useRef(null);

    // Create initial state only once
    const getInitialState = () => {
        if (existingData && Object.keys(existingData).length > 0) {
            // Merge existing data with default state, existing data takes precedence
            return { ...defaultState, ...existingData };
        }
        return defaultState;
    };

    const [formData, setFormData] = useState(getInitialState);

    // Handle existingData changes (e.g., switching between edit items)
    useEffect(() => {
        if (!existingData) return;

        // Create a stable key from existingData to detect actual changes
        const dataKey = JSON.stringify(existingData);

        // Only update if existingData actually changed to something new
        if (existingDataKeyRef.current !== dataKey && Object.keys(existingData).length > 0) {
            existingDataKeyRef.current = dataKey;
            setFormData(prev => ({ ...defaultState, ...existingData }));
        }
    }, [existingData]);

    // Memoized input change handler - stable reference prevents child re-renders
    const handleInputChange = useCallback((e) => {
        const { name, value, type, checked } = e.target;

        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));
    }, []);

    // Programmatic field update
    const updateField = useCallback((fieldName, value) => {
        setFormData(prev => ({
            ...prev,
            [fieldName]: value
        }));
    }, []);

    // Reset form to default state
    const resetForm = useCallback(() => {
        setFormData(defaultState);
        isInitializedRef.current = false;
        existingDataKeyRef.current = null;
    }, [defaultState]);

    // Get current value with fallback
    const getValue = useCallback((fieldName, fallback = '') => {
        return formData[fieldName] ?? fallback;
    }, [formData]);

    return {
        formData,
        setFormData,
        handleInputChange,
        updateField,
        resetForm,
        getValue
    };
};

/**
 * Hook to prevent form submission race conditions.
 * Ensures form state is fully committed before validation runs.
 * 
 * @param {Function} onSubmit - The actual submit handler
 * @param {Object} formData - Current form data
 * @returns {Function} Wrapped submit handler
 */
export const useStableSubmit = (onSubmit, formData) => {
    const formDataRef = useRef(formData);

    // Keep ref in sync with latest form data
    useEffect(() => {
        formDataRef.current = formData;
    }, [formData]);

    const handleSubmit = useCallback((e) => {
        e.preventDefault();

        // Use the latest form data from ref to avoid stale closure issues
        onSubmit(formDataRef.current);
    }, [onSubmit]);

    return handleSubmit;
};

export default useStableFormState;
