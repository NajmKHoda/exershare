import { createContext, useContext } from 'react';

const FormContext = createContext<FormContext | null>(null);

function useFormContext() {
    const formData = useContext(FormContext);
    if (!formData) {
        throw new Error('Form context may only be accessed within a Form component.');
    }
    return formData;
}

export function useFormState<T>(name: string, initialValue: T): [T, (value: T) => unknown] {
    const { formData, setFormData } = useFormContext();
    if (formData[name] === undefined) setFormData(name, initialValue);

    return [
        formData[name] as T || initialValue,
        (value: T) => setFormData(name, value)
    ];
}

export function useFormSubmitter() {
    return useFormContext().submitForm;
}

export const FormContextProvider = FormContext.Provider;

export type FormData = Record<string, unknown>;
export type FormDataSetter = (key: string, value: unknown) => unknown;
export type FormSubmitter = () => unknown;

interface FormContext {
    readonly formData: FormData,
    readonly submitForm: FormSubmitter,
    readonly setFormData: FormDataSetter
}
