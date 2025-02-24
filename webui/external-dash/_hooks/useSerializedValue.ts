import { useState, useEffect } from "react";

/**
 * Displays a string regardless the type of the data
 * @param {unknown} value Value to be stringified
 * @param {boolean} beautify Formats json to multiline
 */
export function useSerializedValue(value: any, beautify = false) {
  const [serializedValue, setSerializedValue] = useState("");

  useEffect(() => {
    async function serializeValue() {
      const { serialize } = await import("superjson");
      const { json } = serialize(value);
      const stringValue = JSON.stringify(json, null, beautify ? 2 : undefined);
      setSerializedValue(stringValue);
    }

    serializeValue();
  }, [value, beautify]);

  return serializedValue;
}
