import * as fruitClasses from "./fruit";
import * as veggieClasses from "./vegetables";

// Outputs:
// I am an orange
// I am an apple
// I am broccoli
// I am spinach

for (const className in fruitClasses) {
  const classInstance = new fruitClasses[className]();
  console.log(`${classInstance.message}`);
}

for (const myClass of veggieClasses) {
  const classInstance = new myClass();
  console.log(classInstance.message);
}
