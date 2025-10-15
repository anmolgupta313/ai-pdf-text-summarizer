export default function stringToJson(data,setSumamry) {
    const jsonStartIndex = data.sumamry.indexOf("{");
const jsonEndIndex = data.sumamry.lastIndexOf("}") + 1;

if (jsonStartIndex !== -1 && jsonEndIndex !== -1) {
  const jsonString = data.sumamry.substring(jsonStartIndex, jsonEndIndex);
  try {
    const extractedObject = JSON.parse(jsonString);
    setSumamry(extractedObject);
  } catch (error) {
    console.error("Error parsing JSON:", error);
  }
}
}

