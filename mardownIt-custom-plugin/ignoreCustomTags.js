"use strict";

const removeComponentPlugin = (md) => {
  md.core.ruler.push("remove_component", function (state) {
    // Loop through tokens and remove the component
    for (let i = state.tokens.length - 1; i >= 0; i--) {
      const token = state.tokens[i];

      // Check if the token is an inline HTML block containing the component
      if (
        token.type === "inline" &&
        (token.content.includes("<AccordionForFAQ") ||
          token.content.includes("<CardComp"))
      ) {
        state.tokens.splice(i, 1);
      }
    }
  });
};

module.exports = function ignore_imports_and_custom_tags_plugin(md) {
  return removeComponentPlugin(md);
};
