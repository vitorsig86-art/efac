import type { VectorPopupConfig } from "../projects/types";

// Formatting copied from Andrelândia vectorPopup.ts; selection stays in EFAC.
function clean(value: unknown): string {
  return typeof value === "string" ? value.replace(/\s+/g, " ").trim() : String(value);
}
function present(value: unknown): boolean {
  return value !== null && value !== undefined && !(typeof value === "number" && !Number.isFinite(value))
    && !(typeof value === "string" && /^(?:null|undefined)?$/i.test(clean(value)));
}
function numeric(value: unknown): { value: number; unit?: string } | null {
  if (typeof value === "number") return Number.isFinite(value) ? { value } : null;
  if (typeof value !== "string") return null;
  const match = clean(value).match(/^([+-]?\d+(?:[.,]\d+)?)\s*(m|km|ha|km²|km2|%)?$/i);
  if (!match) return null;
  return { value: Number(match[1].replace(",", ".")), unit: match[2]?.toLowerCase().replace("km2", "km²") };
}
const unitFactors: Record<string, number> = { m: 1, km: 1000, ha: 10000, "km²": 1000000 };

export function readAndrelandiaPopup(properties: Record<string, unknown>, config: VectorPopupConfig) {
  const titleValue = config?.titleProperty ? properties[config.titleProperty] : undefined;
  const definitions = config.fields;
  const seen = new Set<string>();
  const fields: { label?: string; value: string; section?: string }[] = [];
  for (const field of definitions) {
    const raw = properties[field.property];
    if (!present(raw)) continue;
    let number = numeric(raw);
    if (field.ratioTo) {
      const denominator = numeric(properties[field.ratioTo]);
      if (!number || !denominator || denominator.value === 0) continue;
      number = { value: number.value / denominator.value * 100 };
    }
    const decimals = field.numberFormat?.decimalPlaces ?? (field.format === "integer" ? 0 : field.decimals);
    let value = field.valueLabels?.[clean(raw)] ?? clean(raw);
    if (number && (typeof raw === "number" || decimals !== undefined || field.unit || field.ratioTo)) {
      let amount = number.value;
      if (field.unit && number.unit && number.unit !== field.unit) {
        const sameDimension = ["m", "km"].includes(field.unit) === ["m", "km"].includes(number.unit);
        if (!sameDimension || !unitFactors[number.unit]) continue;
        amount *= unitFactors[number.unit] / unitFactors[field.unit];
      }
      value = new Intl.NumberFormat(field.numberFormat?.locale ?? "pt-BR", decimals === undefined ? {} : {
        minimumFractionDigits: decimals, maximumFractionDigits: decimals,
      }).format(amount);
      if (field.unit) value += ` ${field.unit}`;
      else if (number.unit) value += ` ${number.unit}`;
    }
    const suffix = field.suffix && value.endsWith(field.suffix.trim()) ? "" : field.suffix ?? "";
    value = `${field.prefix ?? ""}${value}${suffix}`;
    const key = `${field.section ?? ""}:${field.label ?? field.property}:${value}`;
    if (seen.has(key)) continue;
    seen.add(key);
    fields.push({ label: field.label, value, section: field.section });
  }
  return {
    title: present(titleValue) ? `${config?.titlePrefix ?? ""}${clean(titleValue)}${config?.titleSuffix ?? ""}` : config?.title ?? "Informações",
    fields,
  };
}
