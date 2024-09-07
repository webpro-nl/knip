import { type GlobalProvider } from "@ladle/react";
import React from "react";

// For details see https://ladle.dev/docs/providers
export const Provider: GlobalProvider = ({ children }) => <div>{children}</div>;
