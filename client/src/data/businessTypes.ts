export const businessTypes = [
  "Restaurant",
  "Cafe",
  "Fine dining",
  "Bar",
  "Bakery",
  "Cloud kitchen",
  "Franchise"
];

export const otherBusinessType = "Other";

export function isPresetBusinessType(value: string) {
  return businessTypes.includes(value);
}
