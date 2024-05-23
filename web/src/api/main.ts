"use client";
import axios from "axios";
import { useUser } from "@clerk/nextjs";
import { currentUser } from "@clerk/nextjs/server";
export const api = axios.create({
  baseURL: "http://localhost:3001",
});
