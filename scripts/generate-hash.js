const bcrypt = require('bcryptjs');

const password = process.argv[2];

if (!password) {
  console.error('Usage: node scripts/generate-hash.js <password>');
  process.exit(1);
}

bcrypt.hash(password, 12).then((hash) => {
  console.log('\nBcrypt hash for your password:\n');
  console.log(hash);
  console.log('\nCopy this value into ADMIN_PASSWORD_HASH in your .env file.\n');
});
