import { Prisma } from "@prisma/client";
import bcrypt from "bcryptjs";
import { prisma } from "~/utils/db";

export const findUserByEmail = (email: string) => {
  return prisma.user.findUnique({
    where: {
      email,
    },
  });
};

export const createUserByEmailAndPassword = (user: Prisma.UserCreateInput) => {
  user.email = user.email!.toLowerCase();
  user.password = bcrypt.hashSync(user.password!, 12);
  return prisma.user.create({
    data: user,
  });
};

export const findUserById = (id: string) => {
  return prisma.user.findUnique({
    where: {
      id,
    },
  });
};
