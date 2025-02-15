import { useState } from 'react';
import { FormContextProvider, FormData, FormDataSetter, FormSubmitter } from '@/lib/hooks/formContext';

interface Props<T extends FormData> {
    children: React.ReactNode,
    onSubmit?: (data: T) => unknown
}

export default function Form<T extends FormData>({ children, onSubmit }: Props<T>) {
    const [data, setData] = useState<T>({} as T);

    const setFormData: FormDataSetter = (key, value) => setData({ ...data, [key]: value });
    const submitForm: FormSubmitter = () => onSubmit?.(data);

    return (
        <FormContextProvider value={{ formData: data, setFormData, submitForm }}>
            { children }
        </FormContextProvider>
    );
}