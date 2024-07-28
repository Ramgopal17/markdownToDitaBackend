// function for replacing characters with html entity
function replaceSpecialCharactersWithEntities(text) {
  // Define an object mapping special characters to their corresponding HTML entities
  const entitiesMap = {
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;",
    $: "&#36;",
    "%": "&#37;",
    "#": "&#35;",
    "@": "&#64;",
    // Add more mappings as needed
  };
  // Use regex to replace each special character with its HTML entity
  return text.replace(/[&<>"'$%@#]/g, (match) => entitiesMap[match]);
}

module.exports = replaceSpecialCharactersWithEntities;
