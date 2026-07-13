declare module "bcryptjs" {
  const bcrypt: {
    hashSync(password: string, salt: number): string;
    compareSync(password: string, hash: string): boolean;
  };
  export default bcrypt;
}
