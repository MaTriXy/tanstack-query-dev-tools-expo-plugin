import { ExtendedQuery } from "./QueryExternal";
export interface User {
  device: "ios" | "android" | "windows" | "macos" | "web";
  allQueries: ExtendedQuery[];
}
