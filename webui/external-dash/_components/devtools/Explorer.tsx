import React, { useState, useMemo } from "react";
import { Query, QueryKey, useQueryClient } from "@tanstack/react-query";
import { Check, CopiedCopier, Copier, ErrorCopier, List, Trash } from "./svgs";
import { updateNestedDataByPath } from "./updateNestedDataByPath";
import sendClientCommand from "../../_util/sendClientCommand";
import { Socket } from "socket.io-client";
import { User } from "../../_types/User";
import { useSerializedValue } from "../../_hooks/useSerializedValue";
function isIterable(x: any): x is Iterable<unknown> {
  return Symbol.iterator in x;
}
/**
 * Chunk elements in the array by size
 *
 * when the array cannot be chunked evenly by size, the last chunk will be
 * filled with the remaining elements
 *
 * @example
 * chunkArray(['a','b', 'c', 'd', 'e'], 2) // returns [['a','b'], ['c', 'd'], ['e']]
 */
function chunkArray<T extends { label: string; value: unknown }>(
  array: Array<T>,
  size: number
): Array<Array<T>> {
  if (size < 1) return [];
  let i = 0;
  const result: Array<Array<T>> = [];
  while (i < array.length) {
    result.push(array.slice(i, i + size));
    i = i + size;
  }
  return result;
}
const Expander = ({ expanded }: { expanded: boolean }) => {
  return (
    <span
      className={`inline-block transform ${
        expanded ? "rotate-90" : "rotate-0"
      }`}
    >
      <svg
        width="12"
        height="12"
        viewBox="0 0 16 16"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="stroke-current text-[#98a2b3]"
      >
        <path
          d="M6 12L10 8L6 4"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </span>
  );
};
type CopyState = "NoCopy" | "SuccessCopy" | "ErrorCopy";
const CopyButton = ({ value }: { value: any }) => {
  const [copyState, setCopyState] = useState<CopyState>("NoCopy");

  const handleCopy = () => {
    navigator.clipboard
      .writeText(JSON.stringify(value))
      .then(() => {
        setCopyState("SuccessCopy");
        setTimeout(() => setCopyState("NoCopy"), 1500);
      })
      .catch((err) => {
        console.error("Failed to copy: ", err);
        setCopyState("ErrorCopy");
        setTimeout(() => setCopyState("NoCopy"), 1500);
      });
  };

  return (
    <button
      className="bg-transparent text-gray-500 border-none inline-flex p-0 items-center justify-center cursor-pointer w-3 h-3 relative z-10 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-800 focus-visible:ring-offset-2 hover:text-gray-600"
      title="Copy object to clipboard"
      aria-label={
        copyState === "NoCopy"
          ? "Copy object to clipboard"
          : copyState === "SuccessCopy"
          ? "Object copied to clipboard"
          : "Error copying object to clipboard"
      }
      onClick={copyState === "NoCopy" ? handleCopy : undefined}
    >
      {copyState === "NoCopy" && <Copier />}
      {copyState === "SuccessCopy" && <CopiedCopier theme="light" />}
      {copyState === "ErrorCopy" && <ErrorCopier />}
    </button>
  );
};
const DeleteItemButton = ({
  socket,
  dataPath,
  activeQuery,
  currentUser,
}: {
  currentUser: User;
  socket: Socket;
  dataPath: Array<string>;
  activeQuery: Query<unknown, Error, unknown, QueryKey> | undefined;
}) => {
  if (!activeQuery) return null;
  const handleDelete = () => {
    if (!activeQuery) return null;

    const oldData = activeQuery.state.data;
    // const newData = deleteNestedDataByPath(oldData, dataPath);
    // queryClient.setQueryData(activeQuery.queryKey, newData);
    const socketID = currentUser && currentUser.id;
    if (!socketID) return;
    sendClientCommand({
      socket: socket,
      socketID: socketID,
      command: {
        queryKey: activeQuery.queryKey.toString(),
        command: "Data Delete",
        dataPath: dataPath,
      },
    });
  };

  return (
    <button
      className="bg-transparent text-gray-500 border-none inline-flex p-0 items-center justify-center cursor-pointer w-3 h-3 relative z-10 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-800 focus-visible:ring-offset-2 hover:text-gray-600"
      title="Delete item"
      aria-label="Delete item"
      onClick={handleDelete}
    >
      <Trash />
    </button>
  );
};
const ClearArrayButton = ({
  socket,
  dataPath,
  activeQuery,
  currentUser,
}: {
  currentUser: User;
  socket: Socket;
  dataPath: Array<string>;
  activeQuery: Query<unknown, Error, unknown, QueryKey> | undefined;
}) => {
  if (!activeQuery) return null;

  const handleClear = () => {
    const oldData = activeQuery.state.data;
    const newData = updateNestedDataByPath(oldData, dataPath, []);
    // Send client the new data
    // queryClient.setQueryData(activeQuery.queryKey, newData);
    const socketID = currentUser && currentUser.id;
    if (!socketID) return;
    sendClientCommand({
      socket: socket,
      socketID: socketID,
      command: {
        queryKey: activeQuery.queryKey.toString(),
        command: "Data Update",
        newValue: newData,
      },
    });
  };

  return (
    <button
      className="bg-transparent text-gray-500 border-none inline-flex p-0 items-center justify-center cursor-pointer w-3 h-3 relative z-10 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-800 focus-visible:ring-offset-2 hover:text-gray-600"
      title="Remove all items"
      aria-label="Remove all items"
      onClick={handleClear}
    >
      <List />
    </button>
  );
};
const ToggleValueButton = ({
  currentUser,
  socket,
  dataPath,
  activeQuery,
  value,
}: {
  currentUser: User;
  socket: Socket;
  dataPath: Array<string>;
  activeQuery: Query<unknown, Error, unknown, QueryKey> | undefined;
  value: any;
}) => {
  //
  const queryClient = useQueryClient();
  if (!activeQuery) return null;

  const handleClick = () => {
    const oldData = activeQuery.state.data;
    const newData = updateNestedDataByPath(oldData, dataPath, !value);
    // Send client the new data
    // queryClient.setQueryData(activeQuery.queryKey, newData);
    const socketID = currentUser && currentUser.id;
    if (!socketID) return;
    sendClientCommand({
      socket: socket,
      socketID: socketID,
      command: {
        queryKey: activeQuery.queryKey.toString(),
        command: "Data Update",
        newValue: newData,
      },
    });
  };

  return (
    <button
      className={`
    bg-transparent text-[#667085] border-none inline-flex items-center justify-center cursor-pointer 
    w-4 h-4 relative z-10 hover:text-gray-600 focus:outline-none focus-visible:ring-2 
    focus-visible:ring-blue-800 focus-visible:ring-offset-2
  `}
      title="Toggle value"
      aria-label="Toggle value"
      onClick={handleClick}
    >
      <Check checked={value} theme="light" />
    </button>
  );
};
type Props = {
  currentUser: User;
  socket: Socket;
  editable?: boolean; // true
  label: string; //Data
  value: any; //unknown; // activeQueryStateData()
  defaultExpanded?: Array<string>; // {['Data']} // Label for Data Explorer
  activeQuery?: Query<unknown, Error, unknown, QueryKey> | undefined; // activeQuery()
  dataPath?: Array<string>;
  itemsDeletable?: boolean;
};
export default function Explorer({
  currentUser,
  socket,
  editable,
  label,
  value,
  defaultExpanded,
  activeQuery,
  dataPath,
  itemsDeletable,
}: Props) {
  const queryClient = useQueryClient();

  // Explorer's section is expanded or collapsed
  const [isExpanded, setIsExpanded] = useState(
    (defaultExpanded || []).includes(label)
  );
  const toggleExpanded = () => setIsExpanded((old) => !old);
  const [expandedPages, setExpandedPages] = useState<Array<number>>([]);

  // Flattens data to label and value properties for easy rendering.
  const subEntries = useMemo(() => {
    if (Array.isArray(value)) {
      // Handle if array
      return value.map((d, i) => ({
        label: i.toString(),
        value: d,
      }));
    } else if (
      value !== null &&
      typeof value === "object" &&
      isIterable(value)
    ) {
      // Handle if object
      if (value instanceof Map) {
        return Array.from(value, ([key, val]) => ({
          label: key.toString(),
          value: val,
        }));
      }
      return Array.from(value, (val, i) => ({
        label: i.toString(),
        value: val,
      }));
    } else if (typeof value === "object" && value !== null) {
      return Object.entries(value).map(([key, val]) => ({
        label: key,
        value: val,
      }));
    }
    return [];
  }, [value]);

  // Identifies the data type of the value prop (e.g., 'array', 'Iterable', 'object')
  const valueType = useMemo(() => {
    if (Array.isArray(value)) {
      return "array";
    } else if (
      value !== null &&
      typeof value === "object" &&
      isIterable(value) &&
      typeof value[Symbol.iterator] === "function"
    ) {
      return "Iterable";
    } else if (typeof value === "object" && value !== null) {
      return "object";
    }
    return typeof value;
  }, [value]);

  // Takes a long list of items and divides it into smaller groups or 'chunks'.
  const subEntryPages = useMemo(() => {
    return chunkArray(subEntries, 100);
  }, [subEntries]);

  const currentDataPath = dataPath ?? []; // NOT USED FOR DATA EXPLORER

  const handleChange = (changeEvent: any) => {
    if (!activeQuery) return null;
    const oldData = activeQuery.state.data;
    let newValue;

    if (valueType === "number") {
      newValue = Number(changeEvent.target.value);
    } else {
      newValue = changeEvent.target.value;
    }
    const newData = updateNestedDataByPath(oldData, currentDataPath, newValue);
    const socketID = currentUser && currentUser.id;
    if (!socketID) return;
    sendClientCommand({
      socket: socket,
      socketID: socketID,
      command: {
        queryKey: activeQuery.queryKey.toString(),
        command: "Data Update",
        newValue: newData,
      },
    });
  };
  const myDisplayValue = useSerializedValue(value);

  if (activeQuery === undefined) {
    return null;
  }

  return (
    <div className="min-w-[200px] text-xs flex flex-wrap w-full ">
      <div className="relative outline-none break-words w-full mr-1">
        {/* when={subEntryPages().length} */}
        {subEntryPages.length > 0 && (
          // Expanded Show
          <>
            <div className="flex items-center gap-2">
              <button
                className=" cursor-pointer text-inherit font-inherit outline-inherit h-5 bg-transparent border-none p-0 inline-flex items-center gap-1 relative"
                onClick={() => toggleExpanded()}
              >
                <Expander expanded={isExpanded} /> <span>{label}</span>
                <span className="text-gray-500 text-xs ml-1">
                  {String(valueType).toLowerCase() === "iterable"
                    ? "(Iterable) "
                    : ""}
                  {subEntries.length} {subEntries.length > 1 ? `items` : `item`}
                </span>
              </button>
              {/* Editable actions */}
              {editable && (
                <div className="inline-flex gap-2 items-center">
                  <CopyButton value={value} />
                  {itemsDeletable && activeQuery !== undefined && (
                    <DeleteItemButton
                      currentUser={currentUser}
                      socket={socket}
                      activeQuery={activeQuery!}
                      dataPath={currentDataPath}
                    />
                  )}
                  {/* Buttons like CopyButton, DeleteItemButton, ClearArrayButton go here */}
                  {valueType === "array" && activeQuery !== undefined && (
                    <ClearArrayButton
                      currentUser={currentUser}
                      socket={socket}
                      activeQuery={activeQuery!}
                      dataPath={currentDataPath}
                    />
                  )}
                </div>
              )}
            </div>
            {/*<Show when={expanded()}> */}
            {isExpanded && (
              <>
                {/* <Show when={subEntryPages().length === 1}> */}
                {subEntryPages.length === 1 && (
                  <>
                    <div className="ml-2 pl-3 border-l-2 border-gray-300">
                      {subEntries.map((entry, index) => (
                        <Explorer
                          currentUser={currentUser}
                          socket={socket}
                          key={entry.label + index}
                          defaultExpanded={defaultExpanded}
                          label={entry.label}
                          value={entry.value}
                          editable={editable}
                          dataPath={[...currentDataPath, entry.label]}
                          activeQuery={activeQuery}
                          itemsDeletable={
                            valueType === "array" ||
                            valueType === "Iterable" ||
                            valueType === "object"
                          }
                        />
                      ))}
                    </div>
                  </>
                )}
                {/*  */}
                {subEntryPages.length > 1 && (
                  <div className="ml-2 pl-3 border-l-2 border-gray-300">
                    {subEntryPages.map((entries, index) => (
                      <div key={index}>
                        <div className="relative outline-none break-words">
                          <button
                            onClick={() =>
                              setExpandedPages((old) =>
                                old.includes(index)
                                  ? old.filter((d) => d !== index)
                                  : [...old, index]
                              )
                            }
                            className="cursor-pointer bg-transparent border-none p-0 inline-flex items-center gap-1 relative"
                          >
                            <Expander
                              expanded={expandedPages.includes(index)}
                            />
                            [{index * 100}...{index * 100 + 99}]
                          </button>
                          {expandedPages.includes(index) && (
                            <div className="ml-2 pl-3 border-l-2 border-gray-300">
                              {entries.map((entry) => (
                                <Explorer
                                  currentUser={currentUser}
                                  socket={socket}
                                  key={entry.label}
                                  defaultExpanded={defaultExpanded}
                                  label={entry.label}
                                  value={entry.value}
                                  editable={editable}
                                  dataPath={[...currentDataPath, entry.label]}
                                  activeQuery={activeQuery}
                                />
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}
          </>
        )}

        {/* <Show when={subEntryPages().length === 0}> */}
        {subEntryPages.length === 0 && (
          <div className="inline-flex gap-2 w-full my-1 leading-11 items-center">
            <span className="text-[#344054] flex-grow-1 whitespace-nowrap">
              {label}:
            </span>{" "}
            {editable &&
            activeQuery !== undefined &&
            (valueType === "string" ||
              valueType === "number" ||
              valueType === "boolean") ? (
              <>
                {editable &&
                  activeQuery &&
                  (valueType === "string" || valueType === "number") && (
                    <input
                      type={valueType === "number" ? "number" : "text"}
                      className="border-none h-[22px]   m-[1px] py-[2px] pl-[6px] pr-[4px] flex-grow rounded-sm bg-[#eaecf0] dark:bg-gray-700 hover:bg-[#D0D5DD] dark:hover:bg-gray-800 text-[#6938EF] dark:text-[#6938EF]"
                      value={value.toString()}
                      onChange={handleChange} // Define this function to handle changes
                    />
                  )}
                {/* Boolean toggle */}
                {valueType === "boolean" && (
                  <span className="border-none p-1 flex-grow rounded-xs bg-gray-200 dark:bg-gray-700 hover:bg-[#D0D5DD] dark:hover:bg-gray-800 text-[#6938EF] dark:text-[#6938EF] inline-flex gap-2 items-center">
                    <ToggleValueButton
                      currentUser={currentUser}
                      socket={socket}
                      activeQuery={activeQuery}
                      dataPath={currentDataPath}
                      value={value}
                    />
                    {myDisplayValue}
                  </span>
                )}
              </>
            ) : (
              <span className="flex-grow text-[#6938EF] dark:text-[#6938EF]  ">
                {myDisplayValue}
              </span>
            )}
            {/*  */}
            {editable && itemsDeletable && activeQuery !== undefined && (
              <DeleteItemButton
                currentUser={currentUser}
                socket={socket}
                activeQuery={activeQuery}
                dataPath={currentDataPath}
              />
            )}
          </div>
        )}
      </div>
    </div>
  );
}
