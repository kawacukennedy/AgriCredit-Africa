import { useState, useCallback } from 'react';
import { z } from 'zod';

export interface FormState<T> {
  data: T;
  errors: Record<string, string>;
  isValid: boolean;
  isDirty: boolean;
  isSubmitting: boolean;
}

export interface UseFormValidationOptions<T> {
  schema: z.ZodSchema<T>;
  initialData: T;
  onSubmit?: (data: T) => Promise<void> | void;
  validateOnChange?: boolean;
  validateOnBlur?: boolean;
}

export function useFormValidation<T extends Record<string, any>>({
  schema,
  initialData,
  onSubmit,
  validateOnChange = true,
  validateOnBlur = true,
}: UseFormValidationOptions<T>) {
  const [state, setState] = useState<FormState<T>>({
    data: initialData,
    errors: {},
    isValid: false,
    isDirty: false,
    isSubmitting: false,
  });

  const validateField = useCallback((field: keyof T, value: any) => {
    try {
      const fieldSchema = schema.pick({ [field]: true } as any);
      fieldSchema.parse({ [field]: value });
      return null;
    } catch (error) {
      if (error instanceof z.ZodError) {
        return error.errors[0]?.message || 'Invalid value';
      }
      return 'Validation error';
    }
  }, [schema]);

  const validateForm = useCallback((data: T = state.data) => {
    try {
      schema.parse(data);
      return { isValid: true, errors: {} };
    } catch (error) {
      if (error instanceof z.ZodError) {
        const errors: Record<string, string> = {};
        error.errors.forEach((err) => {
          const path = err.path.join('.');
          errors[path] = err.message;
        });
        return { isValid: false, errors };
      }
      return { isValid: false, errors: { general: 'Validation failed' } };
    }
  }, [schema, state.data]);

  const setFieldValue = useCallback((field: keyof T, value: any) => {
    setState(prev => {
      const newData = { ...prev.data, [field]: value };
      const newErrors = { ...prev.errors };

      if (validateOnChange) {
        const fieldError = validateField(field, value);
        if (fieldError) {
          newErrors[field as string] = fieldError;
        } else {
          delete newErrors[field as string];
        }
      }

      const { isValid } = validateForm(newData);

      return {
        ...prev,
        data: newData,
        errors: newErrors,
        isValid,
        isDirty: true,
      };
    });
  }, [validateOnChange, validateField, validateForm]);

  const setFieldError = useCallback((field: keyof T, error: string | null) => {
    setState(prev => {
      const newErrors = { ...prev.errors };
      if (error) {
        newErrors[field as string] = error;
      } else {
        delete newErrors[field as string];
      }

      const { isValid } = validateForm(prev.data);

      return {
        ...prev,
        errors: newErrors,
        isValid,
      };
    });
  }, [validateForm]);

  const handleBlur = useCallback((field: keyof T) => {
    if (!validateOnBlur) return;

    const error = validateField(field, state.data[field]);
    if (error) {
      setFieldError(field, error);
    }
  }, [validateOnBlur, validateField, state.data, setFieldError]);

  const reset = useCallback((newData?: T) => {
    setState({
      data: newData || initialData,
      errors: {},
      isValid: false,
      isDirty: false,
      isSubmitting: false,
    });
  }, [initialData]);

  const submit = useCallback(async () => {
    const { isValid, errors } = validateForm();

    if (!isValid) {
      setState(prev => ({ ...prev, errors }));
      return { success: false, errors };
    }

    setState(prev => ({ ...prev, isSubmitting: true }));

    try {
      if (onSubmit) {
        await onSubmit(state.data);
      }
      setState(prev => ({ ...prev, isSubmitting: false }));
      return { success: true };
    } catch (error) {
      setState(prev => ({
        ...prev,
        isSubmitting: false,
        errors: { general: error instanceof Error ? error.message : 'Submission failed' }
      }));
      return { success: false, errors: { general: 'Submission failed' } };
    }
  }, [validateForm, onSubmit, state.data]);

  return {
    ...state,
    setFieldValue,
    setFieldError,
    handleBlur,
    validateForm,
    reset,
    submit,
  };
}