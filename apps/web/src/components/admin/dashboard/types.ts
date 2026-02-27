/** Admin dashboard domain-specific types. */

export type Toast = {
  id: number;
  tone: "success" | "error";
  message: string;
};
