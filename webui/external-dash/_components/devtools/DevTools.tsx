import { Query } from "@tanstack/react-query";
import React from "react";

import QueriesList from "./QueriesList";
import { User } from "../../_types/User";
interface Props {
  allQueries: Query[] | undefined;
  currentUser: User | undefined;
}
export default function DevTools({ allQueries, currentUser }: Props) {
  if (!allQueries || !currentUser) return null;
  return (
    <div className="bg-white min-w-[300px] h-[200px]">
      <QueriesList allQueries={allQueries} currentUser={currentUser} />
    </div>
  );
}
