import api from "./axios";
import type { User, AuthResponse } from "../types/index";

export const registerUser = async (data: {
  name: string;
  email: string;
  password: string;
}): Promise<AuthResponse> => {
  const res = await api.post("auth/register", data);
  return res.data;
};

export const loginUser = async (data: {
  email: string;
  password: string;
}): Promise<AuthResponse> => {
  const res = await api.post("auth/login", data);
  return res.data;
};

export const getMe = async (): Promise<User> => {
  const res = await api.get("auth/me");
  return res.data;
};
