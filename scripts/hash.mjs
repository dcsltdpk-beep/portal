// Usage: npm run hash -- "my-password"   -> prints a bcrypt hash for crm.users.password_hash
import bcrypt from "bcryptjs";
const pw = process.argv[2];
if (!pw) { console.error('Usage: npm run hash -- "password"'); process.exit(1); }
console.log(bcrypt.hashSync(pw, 12));
