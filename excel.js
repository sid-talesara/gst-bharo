const XLSX = require("xlsx");
const readline = require("readline");

// Read the Excel file
const workbook = XLSX.readFile("public/Online Courses.xlsx");

// Choose the sheet to work with
const sheetName = workbook.SheetNames[0];
const sheet = workbook.Sheets[sheetName];

// Get the range of cells in the sheet
const range = XLSX.utils.decode_range(sheet["!ref"]);

// Iterate over the cells and display the data
for (let rowNum = range.s.r; rowNum <= range.e.r; rowNum++) {
  let row = "";
  for (let colNum = range.s.c; colNum <= range.e.c; colNum++) {
    const cellAddress = XLSX.utils.encode_cell({ r: rowNum, c: colNum });
    const cellValue = sheet[cellAddress]?.v || "";
    row += `${cellValue}\t`;
  }
  console.log(row);
}

// Create a readline interface for user input
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

// Prompt the user for operation and cell addresses
rl.question("Enter the operation (sum, diff): ", (operation) => {
  rl.question(
    "Enter the first cell address (e.g., A1): ",
    (firstCellAddress) => {
      rl.question(
        "Enter the second cell address (e.g., B1): ",
        (secondCellAddress) => {
          // Parse cell addresses
          const firstCell = XLSX.utils.decode_cell(firstCellAddress);
          const secondCell = XLSX.utils.decode_cell(secondCellAddress);

          // Perform the operation based on user input
          let result;
          if (operation === "sum") {
            result = sheet[firstCellAddress]?.v + sheet[secondCellAddress]?.v;
          } else if (operation === "diff") {
            result = sheet[firstCellAddress]?.v - sheet[secondCellAddress]?.v;
          } else {
            result = "Invalid operation.";
          }

          // Display the result
          console.log(`Result: ${result}`);

          rl.close();
        }
      );
    }
  );
});
