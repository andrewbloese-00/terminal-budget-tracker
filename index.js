import { existsSync, readFileSync, writeFileSync } from "fs";
import { createInterface } from "readline";

/**
 * @typedef {{ month: number, year: number, amount: number }} SavingsEntry
 * @typedef {{ categories: string[], entries: { [category:string]: SavingsEntry[]} , targets: {[category:string]:Number}}} AppState
 */
const DATA_STORE = "/Users/blaze/earning-goals/data.json";
const MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

if (!existsSync(DATA_STORE)) {
  console.time("build store");
  console.log("First Start, Creating Data Store...");
  writeFileSync(
    DATA_STORE,
    JSON.stringify({ categories: [], entries: {}, targets: {} }),
    "utf8",
  );
  console.timeEnd("build store");
}

/**@type {AppState} */
let state = JSON.parse(readFileSync(DATA_STORE, "utf8"));

const reader = createInterface({
  input: process.stdin,
  output: process.stdout,
});

const questionPromise = (prompt, cast = String) =>
  new Promise((resolve) => {
    reader.question(prompt, (answer) => resolve(cast(answer.trim())));
  });

async function handleAddCategory() {
  console.clear();
  console.log("== Create a Category ==");
  const prompt = "Enter a name for the category: \n > ";
  const categoryName = await questionPromise(prompt);

  const categoryTarget = await questionPromise(
    "What is the monthly target for this category?\n > $",
    Number,
  );

  if (state.categories.includes(categoryName))
    return console.error("[ERR] category exists!");

  state.categories.push(categoryName);
  state.entries[categoryName] = [];
  state.targets[categoryName] = categoryTarget;
  saveState();
}

function saveState() {
  writeFileSync(DATA_STORE, JSON.stringify(state), "utf8");
}

async function handleAddEntry() {
  console.clear();
  console.log("== Adding Entry ==");
  let options = "\n[0] -> Cancel ";
  for (let i = 0; i < state.categories.length; i++)
    options += `\n[${i + 1}] -> ${state.categories[i]}`;

  const category = await questionPromise(
    `Select A Category:${options}\n > `,
    Number,
  );
  if (category === 0) return console.log("Canceled Action 'a'");
  if (category < 0 || category - 1 >= state.categories.length)
    return console.error("[ERR] Category does not exist");
  const amount = await questionPromise(`\nHow much?\n > $`, Number);

  if (amount <= 0) return console.error("[ERR] Amount Must Be Greater Than 0!");
  const now = new Date();
  const month = now.getMonth();
  const year = now.getFullYear();
  state.entries[state.categories[category - 1]].push({ month, year, amount });
  saveState();
}

function printHelp() {
  console.clear();
  console.log(
    "== Help ==\n a -> add an entry \n b -> view progress bars\n c -> create a category \n h -> help \n p -> view month progress \n q -> quit \n",
  );
}

function printBars() {
  console.clear();
  const today = new Date(); //today is a new day...
  const [m, y] = [today.getMonth(), today.getFullYear()];
  console.log(`== Bars ${MONTHS[m]},${y} ==`);

  for (const category of state.categories) {
    const entries = state.entries[category].filter(
      ({ month, year }) => month === m && year === y,
    );
    let sum = 0;
    for (let i = 0; i < entries.length; i++) {
      sum += entries[i].amount;
    }
    const prog = sum / state.targets[category];
    console.log(category);
    progressbar(prog);
  }
}

function printProgress() {
  console.clear();
  const today = new Date(); //today is a new day...
  let report = "";
  const [m, y] = [today.getMonth(), today.getFullYear()];
  console.log(`== Progress ${MONTHS[m]},${y} ==`);

  for (const category of state.categories) {
    const entries = state.entries[category].filter(
      ({ month, year }) => month === m && year === y,
    );
    let sum = 0;
    for (let i = 0; i < entries.length; i++) {
      sum += entries[i].amount;
    }
    const prog = sum / state.targets[category];
    const percent = (prog * 100).toFixed(1);
    report += `\n${category}: ${percent}%\n Amount: $${sum.toFixed(2)}\n Goal: $${state.targets[category]} \n Entries: ${entries.length}\n`;
  }
  console.log(report);
}

function progressbar(prog, width = process.stdout.columns / 2) {
  let bar = "[";
  for (let i = 0; i < width; i++) {
    if (prog > 0 && Math.ceil(prog * width) >= i) bar += "X";
    else bar += " ";
  }
  console.log(`${bar}]`);
}

const actions = {
  a: handleAddEntry,
  b: printBars,
  c: handleAddCategory,
  h: printHelp,
  p: printProgress,
  q: async () => {
    let msg =
      Math.random() > 0.5
        ? Math.random() > 0.5
          ? "Bye! :)"
          : "Goodbye! :)"
        : "Have a great day!";
    console.clear();
    console.log("\n" + msg + "\n");
    process.exit(0);
  },
};

async function handleInput(answer) {
  const code = answer.trim().toLowerCase();
  if (typeof actions[code] !== "function")
    return console.error("Invalid Input. 'h' for help");
  await actions[code]();
}

async function main() {
  console.log("=== JS Earnings Tracker ===");
  while (true) {
    const reply = await questionPromise(" > ");
    await handleInput(reply);
  }
}

main();
