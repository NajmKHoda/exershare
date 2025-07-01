/**
 * Converts a string to title case by capitalizing the first letter
 * @param str The string to convert
 * @returns The string in title case
 */
export function toTitleCase(str: string): string {
    return str.charAt(0).toUpperCase() + str.slice(1);
}
