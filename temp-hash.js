import bcrypt from 'bcrypt';

async function generateHash() {
  const password = 'mithorizon';
  const saltRounds = 10;
  const hash = await bcrypt.hash(password, saltRounds);
  console.log(hash);
}

generateHash();