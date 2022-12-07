import { Prisma, User } from "@prisma/client";
import bcrypt from "bcryptjs";
import { prisma } from "~/utils/db";

export const excludedFields = [
  "password",
  "verified",
  "verificationCode",
  "passwordResetAt",
  "passwordResetToken",
];

export const findUserByEmail = (email: string) => {
  return prisma.user.findUnique({
    where: {
      email,
    },
  });
};

export const createUserByEmailAndPassword = async (user: Prisma.UserCreateInput) => {
  user.email = user.email!.toLowerCase();
  user.password = bcrypt.hashSync(user.password!, 12);
  return (await prisma.user.create({
    data: user,
  })) as User;
};

export const findUniqueUser = async (
  where: Prisma.UserWhereUniqueInput,
  select?: Prisma.UserSelect
) => {
  return (await prisma.user.findUnique({
    where,
    select,
  })) as User;
};

export const findUser = async (
  where: Partial<Prisma.UserWhereInput>,
  select?: Prisma.UserSelect
) => {
  return (await prisma.user.findFirst({
    where,
    select,
  })) as User;
};

export const findUserById = async (id: string) => {
  return (await prisma.user.findUnique({
    where: {
      id,
    },
  })) as User;
};

export const updateUser = async (
  where: Partial<Prisma.UserWhereUniqueInput>,
  data: Prisma.UserUpdateInput,
  select?: Prisma.UserSelect
) => {
  return (await prisma.user.update({ where, data, select })) as User;
};