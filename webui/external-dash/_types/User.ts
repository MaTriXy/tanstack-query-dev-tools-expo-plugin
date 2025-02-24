import { ExtendedQuery } from "./QueryExternal";
export interface User {
  device: "web" | "android" | "ios";
  allQueries: ExtendedQuery[];
}
