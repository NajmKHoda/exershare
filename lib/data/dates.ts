// Converts the date to a YYYY-MM-DD string
export function serializeDate(date: Date) {
    const year = date.getFullYear().toString().padStart(4, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    return `${year}-${month}-${day}`;
}

// Converts a YYYY-MM-DD string to a Date object
export function deserializeDate(dateString: string) {
    const [year, month, day] = dateString.split('-').map(Number);
    return new Date(year, month - 1, day);
}
