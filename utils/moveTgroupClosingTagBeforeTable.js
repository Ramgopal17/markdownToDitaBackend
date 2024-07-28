// move Tgroup closing tag before table closing tag
function moveTgroupClosingTagBeforeTable(xmlString) {
  let modifiedXml = xmlString;

  // Loop through all occurrences of <table>
  let index = modifiedXml.indexOf("<table>");
  while (index !== -1) {
    // Find the position of the closing tag </tgroup> after the current <table>
    const endIndex = modifiedXml.indexOf("</tgroup>", index);

    // Extract the closing tag </tgroup>
    const closingTag = modifiedXml.substring(
      endIndex,
      modifiedXml.indexOf(">", endIndex) + 1
    );

    // Remove the closing tag </tgroup> from the XML string
    modifiedXml =
      modifiedXml.substring(0, endIndex) +
      modifiedXml.substring(modifiedXml.indexOf(">", endIndex) + 1);

    // Find the position of the closing tag </table> after the current <table>
    const tableIndex = modifiedXml.indexOf("</table>", index);

    // Insert the closing tag </tgroup> before the closing tag </table> after the current <table>
    modifiedXml =
      modifiedXml.substring(0, tableIndex) +
      closingTag +
      modifiedXml.substring(tableIndex);

    // Move to the next occurrence of <table>
    index = modifiedXml.indexOf("<table>", tableIndex + 1);
  }

  return modifiedXml;
}

module.exports = moveTgroupClosingTagBeforeTable;
