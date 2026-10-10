import bycrypt from "bcrypt";

export  async function hashPassword(password: string): Promise<string> {
  const saltRounds = 10;
  const hashedPassword = await bycrypt.hash(password, saltRounds);
  return hashedPassword;
}

export  async function comparePassword(password: string, hashedPassword: string): Promise<boolean> {
  const isMatch = await bycrypt.compare(password, hashedPassword);
  return isMatch;
}