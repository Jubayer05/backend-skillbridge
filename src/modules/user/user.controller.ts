import type { RequestHandler } from "express";
import { prisma } from "../../lib/prisma";

const createUser: RequestHandler = async (req, res) => {
  const payload = req.body;
  const user = await prisma.user.create({
    data: payload,
  });
  res.status(201).json(user);
};

const getUsers: RequestHandler = async (req, res) => {
  const users = await prisma.user.findMany();
  res.status(200).json(users);
};

const getUser: RequestHandler = async (req, res) => {
  const { id } = req.params;
  const user = await prisma.user.findUnique({
    where: { id: id as string },
  });
  res.status(200).json(user);
};

const updateUser: RequestHandler = async (req, res) => {
  const { id } = req.params;
  const { name, email, password } = req.body;
  const user = await prisma.user.update({
    where: { id: id as string },
    data: { name, email, password },
  });
  res.status(200).json(user);
};

const deleteUser: RequestHandler = async (req, res) => {
  const { id } = req.params;
  await prisma.user.delete({
    where: { id: id as string },
  });
  res.status(200).json({ message: "User deleted successfully" });
};

export const userController: Record<string, RequestHandler> = { createUser, getUsers, getUser, updateUser, deleteUser };