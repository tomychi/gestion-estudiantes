// src/lib/utils/search.ts

/**
 * Normalizes text for search by removing accents, converting to lowercase,
 * and removing extra spaces
 *
 * @param text - The text to normalize
 * @returns Normalized text for comparison
 *
 * @example
 * normalizeForSearch("María José") // returns "maria jose"
 * normalizeForSearch("Ñoño") // returns "nono"
 * normalizeForSearch("  José  ") // returns "jose"
 */
export function normalizeForSearch(text: string): string {
  if (!text) return "";

  return text
    .toLowerCase()
    .normalize("NFD") // Decompose accented characters
    .replace(/[\u0300-\u036f]/g, "") // Remove accent marks
    .replace(/[^\w\s]/g, "") // Remove special characters except word chars and spaces
    .replace(/\s+/g, " ") // Replace multiple spaces with single space
    .trim();
}

/**
 * Checks if a text matches a search term (accent and case insensitive)
 *
 * @param text - The text to search in
 * @param searchTerm - The term to search for
 * @returns true if the text contains the search term
 *
 * @example
 * matchesSearch("María García", "maria") // returns true
 * matchesSearch("José Pérez", "perez") // returns true
 * matchesSearch("Juan López", "lopez") // returns true
 */
export function matchesSearch(text: string, searchTerm: string): boolean {
  if (!searchTerm) return true;
  if (!text) return false;

  const normalizedText = normalizeForSearch(text);
  const normalizedSearch = normalizeForSearch(searchTerm);

  return normalizedText.includes(normalizedSearch);
}

/**
 * Filters an array of items based on multiple searchable fields
 *
 * @param items - Array of items to filter
 * @param searchTerm - The search term
 * @param fields - Array of field names or getter functions to search in
 * @returns Filtered array
 *
 * @example
 * const students = [
 *   { firstName: "María", lastName: "García", dni: "12345678" },
 *   { firstName: "José", lastName: "López", dni: "87654321" }
 * ];
 *
 * searchInFields(students, "maria", ["firstName", "lastName", "dni"])
 * // returns [{ firstName: "María", ... }]
 */
export function searchInFields<T>(
  items: T[],
  searchTerm: string,
  fields: (keyof T | ((item: T) => string))[],
): T[] {
  if (!searchTerm) return items;

  const normalizedSearch = normalizeForSearch(searchTerm);

  return items.filter((item) => {
    return fields.some((field) => {
      const value =
        typeof field === "function" ? field(item) : String(item[field] || "");

      return normalizeForSearch(value).includes(normalizedSearch);
    });
  });
}
