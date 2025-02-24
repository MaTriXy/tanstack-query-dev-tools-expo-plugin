import { useDevToolsPluginClient } from "expo/devtools";
import React, { useEffect, useState } from "react";

import DevTools from "./_components/devtools/DevTools";
import { User } from "./_types/User";
import Providers from "./providers";

interface Props {
  users: User[];
}
export default function ExternalDevTools({ users }: Props) {
  const client = useDevToolsPluginClient(
    "tanstack-query-dev-tools-expo-plugin"
  );

  const [username, setUsername] = useState("");
  const [currentUser, setCurrentUser] = useState<User>();
  const [showQueries, setShowQueries] = useState(true);

  // Default to the first user if no user is selected
  useEffect(() => {
    if (users.length && !currentUser) {
      setCurrentUser(users[0]);
    }
  }, [users]);

  return (
    <Providers>
      <div>
        <div
          className={`p-[1px] w-full ${
            client?.isConnected ? "bg-green-400" : "bg-red-400"
          }`}
        />
      </div>
      <div className=" w-full h-full py-2 ">
        <div className="border-[#d0d5dd] border-b-2 py-1 flex flex-wrap  ">
          <div className="mx-2">
            <span className="text-[#475467] font-bold ">TANSTACK</span>
            <p className="bg-custom-gradient font-semibold text-xs flex ">
              <span className="gradient-text -mt-1">React Query v5 </span>
            </p>
          </div>
          <div className="ml-1 my-auto flex flex-wrap">
            <div className="flex items-center justify-center">
              <button
                onClick={() => {
                  setShowQueries(true);
                }}
                className={`${
                  showQueries === true
                    ? "bg-[#F2F4F7] text-[#344054] hover:bg-[#F0F8FF]"
                    : " bg-[#EAECF0] text-[#909193]"
                }    p-1  border-[1px] border-[#d0d5dd] rounded-bl-[4px] rounded-tl-[4px] text-xs  px-2`}
              >
                Queries
              </button>
              <button
                onClick={() => {
                  setShowQueries(false);
                }}
                className={`${
                  showQueries === false
                    ? "bg-[#F2F4F7] text-[#344054] hover:bg-[#F0F8FF]"
                    : "bg-[#EAECF0] text-[#909193]"
                }    p-1  border-[1px] border-[#d0d5dd] rounded-br-[4px] rounded-tr-[4px] text-xs px-2`}
              >
                Mutations
              </button>
            </div>
            <div className=" flex flex-wrap">
              <div className="flex">
                <select
                  value={username}
                  disabled={!users.length}
                  className="p-1 m-1 border-2 border-[#d0d5dd]   shadow-lg rounded-md mx-3"
                  onChange={(e) => {
                    setUsername(e.target.value.trim());
                  }}
                >
                  {users.length ? (
                    <option key="default" hidden value="">
                      Select a user
                    </option>
                  ) : (
                    <option key="default" hidden value="">
                      No connected users
                    </option>
                  )}
                  {users.map((user, index) => (
                    <option
                      onClick={() => {
                        setCurrentUser(user);
                      }}
                      key={index + user.device}
                      value={user.device.toString()}
                    >
                      {user.device}
                    </option>
                  ))}
                </select>
              </div>
              <p
                className={`ml-auto  ${
                  currentUser ? "bg-green-400" : "bg-red-400"
                } p-1 m-2 rounded-md text-sm  mt-auto`}
              >
                {currentUser ? "CONNECTED" : "DISCONNECTED"}
              </p>
            </div>
          </div>
        </div>
        {showQueries ? (
          <DevTools
            allQueries={currentUser?.allQueries}
            currentUser={currentUser}
          />
        ) : (
          <h1 className="m-3">Comming soon...</h1>
        )}
      </div>
    </Providers>
  );
}
