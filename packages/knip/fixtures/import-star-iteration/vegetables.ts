class Broccoli {
  public message = "I am broccoli";
}

class Spinach {
  public message = "I am spinach";
}

// This is contrived, but this leads to us being able to use for (...of) in index.ts
const veggieClasses = [Broccoli, Spinach];
export = veggieClasses;  // Makes the file a module
