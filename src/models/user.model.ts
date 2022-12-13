import { Prisma, User } from "@prisma/client";
import * as argon2 from "argon2";
import { prisma } from "~/utils/db";

export const excludedFields = [
  "password",
  "emailVerified",
  "verified_at",
  "verificationCode",
  "passwordResetAt",
  "passwordResetToken",
];

export const createUser = async <T extends Prisma.UserCreateArgs>(
  {data,
  select}: Prisma.SelectSubset<T, Prisma.UserCreateArgs>
) => {
  data.email = data.email!.toLowerCase();
  data.password = await argon2.hash(data.password!);

  const res = prisma.user.create<Prisma.SelectSubset<T, Prisma.UserCreateArgs>>(
    {
      data,
      select,
    } as Prisma.SelectSubset<T, Prisma.UserCreateArgs>
  );
  return res;
};
// export const createUser = async <T extends Prisma.UserCreateArgs>(
//   args?: Prisma.SelectSubset<T, Prisma.UserCreateArgs>
// ) => {
//   args!.data.email = args!.data.email!.toLowerCase();
//   args!.data.password = await argon2.hash(args!.data.password!);

//   const res = prisma.user.create<Prisma.SelectSubset<T, Prisma.UserCreateArgs>>(
//     {
//       ...args!,
//     }
//   );
//   return res;
// };

// Just as an example, it better not to use this function as type checking is not done
export const findUserById = async (id: string) => {
  return (await prisma.user.findUnique({
    where: {
      id,
    },
  })) as User;
};
