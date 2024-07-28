// "use strict";

// function ignoreImports(state, startLine, endLine, silent) {
//   let nextLine,
//     token,
//     lineText,
//     pos = state.bMarks[startLine] + state.tShift[startLine],
//     max = state.eMarks[startLine];

//   if (
//     pos >= max ||
//     state.src.charCodeAt(pos) !== 0x69 /* i */ ||
//     state.src.substr(pos, 6) !== "import"
//   ) {
//     return false;
//   }

//   if (silent) {
//     return true;
//   }

//   nextLine = startLine + 1;
//   while (nextLine < state.lineMax) {
//     lineText = state.getLines(nextLine, nextLine + 1, 0, false);
//     if (lineText.trim().length === 0) break;
//     console.log("Removed import line:", lineText);
//     nextLine++;
//   }

//   state.line = nextLine;

//   return true;
// }

// module.exports = function ignore_imports_plugin(md) {
//   md.block.ruler.before("paragraph", "ignoreimports", ignoreImports);
// };

// =======================================

"use strict";

function ignoreImports(state, startLine, endLine, silent) {
  let nextLine,
    lineText,
    pos = state.bMarks[startLine] + state.tShift[startLine],
    max = state.eMarks[startLine];

  // Check if the line starts with "import"
  if (state.src.substr(pos, 6) === "import") {
    // if (!silent) {
    //   console.log("Removed import line:", state.src.slice(pos, max));
    // }
    // Skip the line
    state.line++;
    return true;
  }

  return false;
}

module.exports = function ignore_imports_plugin(md) {
  md.block.ruler.before("paragraph", "ignoreimports", ignoreImports);
};
