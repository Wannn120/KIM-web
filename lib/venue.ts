export const DEFAULT_FIELD = {
  id: "klaten-field-1",
  name: "Lapangan Klaten International",
  location: "Klaten",
  description: "Lapangan mini soccer premium dengan fasilitas lengkap di Klaten.",
  price: 110000,
  type: "Mini Soccer",
  size: "5v5",
  rating: 4.9,
  imageUrl: "",
};

export const DEFAULT_FIELD_ID = DEFAULT_FIELD.id;
export const DEFAULT_FIELD_NAME = DEFAULT_FIELD.name;
export const DEFAULT_FIELD_PRICE = DEFAULT_FIELD.price;

export function getDefaultFieldPrice() {
  return DEFAULT_FIELD.price;
}

export function isDefaultFieldId(fieldId?: string) {
  return !fieldId || fieldId === DEFAULT_FIELD_ID;
}
