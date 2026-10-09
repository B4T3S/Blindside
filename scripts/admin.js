import { DatabaseService } from "../src/backend/service/database_service.js";

function main() {
  if (process.argv.length <= 2) {
    console.log("Manage roles using the following format: npm admin <add/remove> <identifier> <role>");
    return;
  }

  if (process.argv.length < 5) {
    console.log("Missing argument(s)! You need to provide add/remove, an identifier and a role!");
  }

  const db = new DatabaseService();

  switch (process.argv[2].toLowerCase()) {
    case "add":
      db.add_user_role(process.argv[3].toLowerCase(), process.argv[4].toLowerCase());
      break;
    case "remove":
      db.remove_user_role(process.argv[3].toLowerCase(), process.argv[4].toLowerCase());
      break;
    default:
      console.log(`Unknown command ${process.argv[2]}! Available options are: "add" and "remove"`);
      break;
  }
}

main();
