// The code wall behind the name in the landing section (src/scripts/home/wall.js):
// three of my C programs, one per window, as committed on GitHub. Each file in
// wall/ starts below the file's header comment, which has my email address in
// it: start is the line it starts on and rev the commit it was copied from, so
// the line numbers match the file on GitHub. To refresh one, copy it again from
// that line and update rev:
//
//   git -C ~/Developer/life show HEAD:life.c | tail -n +8 > src/data/wall/life.c
//
// top is the line the window opens at, and edits are what the ghost cursor may
// change: the word in the first line containing line, and what it types instead.

import life from "./wall/life.c?raw";
import cube from "./wall/cube.c?raw";
import layerkey from "./wall/layerkey.c?raw";

export const WALL = [
  {
    repo: "life", path: "life.c", rev: "c80091d4748c63f34b4320d8fcd395a85ab7fba2", start: 8, text: life, top: 6,
    edits: [
      { line: "#define SLEEP_MSEC 225", word: "225", text: "200" },
      { line: "rnd > 0.8 ? ALIVE", word: "0.8", text: "0.75" },
      { line: "init_pair(CURS_COL, COLOR_BLUE", word: "COLOR_BLUE", text: "COLOR_GREEN" },
      { line: "Something terrible has happened.", word: "terrible", text: "unexpected" },
    ],
  },
  {
    repo: "cube", path: "src/cube.c", rev: "f62e55bd04e7e924e2e39d2e84f1a9116b918be3", start: 9, text: cube, top: 33,
    edits: [
      { line: "cam_distance = 50.0", word: "50.0", text: "40.0" },
      { line: "zoom         = 500.0", word: "500.0", text: "420.0" },
      { line: "scale_x      = 2.0", word: "2.0", text: "2.2" },
    ],
  },
  {
    repo: "layerkey", path: "layerkey.c", rev: "78b12073b405c26cb6b5dd2ede4f2bb251928959", start: 12, text: layerkey, top: 30,
    edits: [
      { line: "bsearch(&ch, keys, 31,", word: "31", text: "32" },
      { line: "Unable to open config file.", word: "Unable", text: "Failed" },
      { line: "Symbol Layer", word: "Symbol", text: "Symbols" },
    ],
  },
];
