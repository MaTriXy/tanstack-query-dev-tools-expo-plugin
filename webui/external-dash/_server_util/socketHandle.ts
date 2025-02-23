import { Socket, Server as SocketIOServer } from "socket.io";
import { DefaultEventsMap } from "socket.io/dist/typed-events";
import { Query } from "@tanstack/react-query";
import { User } from "../_types/User";
import { ExtendedQuery } from "../_types/QueryExternal";

interface Props {
  io: SocketIOServer<DefaultEventsMap, DefaultEventsMap, DefaultEventsMap, any>;
}
let users = [] as User[]; // Connected users

export default function socketHandle({ io }: Props) {
  function handleClose(id: string, username: string) {
    // Remove user from the list
    users = users.filter((user: User) => user.id !== id);
    // Sends new list of users to everyone connected
    io.emit("users-update", users);
  }
  function addNewUser({
    id,
    clientType = "unkown",
    username = "unkown",
    userType = "unkown",
    allQueries,
  }: User) {
    const extractNumber = (name) => {
      const match = name.match(/(\d+)$/);
      return match ? parseInt(match[1], 10) : 1;
    };
    let highestNumber = 0;
    users.forEach((user) => {
      if (user.username.startsWith(username)) {
        const number = extractNumber(user.username);
        if (number >= highestNumber) {
          highestNumber = number;
        }
      }
    });
    if (highestNumber > 0) {
      username = `${username} #${highestNumber + 1}`;
    }
    id &&
      users.push({
        id: id,
        clientType: clientType,
        username: username,
        userType: userType,
        allQueries: allQueries,
      });
    io.emit("users-update", users);
  }
  function handleUserMessage(message: string, username: string) {
    io.emit("message", `User ${username} sent message: ${message}`);
  }
  io.on("connection", (socket: Socket) => {
    let { clientType, username, userType, allQueries } = socket.handshake.query;
    const typeddUsername = Array.isArray(username) ? username[0] : username;
    const typedClientType = Array.isArray(clientType)
      ? clientType[0]
      : clientType;
    const typedUserType = Array.isArray(userType) ? userType[0] : userType;
    let typedAllQueries = allQueries as any as ExtendedQuery[];
    typedAllQueries = !Array.isArray(typedAllQueries) ? [] : typedAllQueries;

    addNewUser({
      id: socket.id,
      clientType: typedClientType,
      username: typeddUsername,
      userType: typedUserType,
      allQueries: typedAllQueries,
    });
    socket.on("disconnect", () => handleClose(socket.id, typeddUsername));
    socket.on("message", (msg: any) => {
      handleUserMessage(msg, typeddUsername);
    });
    // Listening for a message from a server dashboard client to a user client
    socket.on(
      "sendToSpecificClient",
      ({
        targetClientId,
        message,
      }: {
        targetClientId: string;
        message: string;
      }) => {
        io.to(targetClientId).emit("message", message);
      }
    );
    // React Query all queries listener from users
    socket.on("allQueries", (allQueries: Query[]) => {
      // Replace allQueries with empty array if not array
      if (!Array.isArray(allQueries)) {
        allQueries = [];
      }
      // Update allQueries user objecet
      const user = users.find((user) => user.id === socket.id);
      user && (user.allQueries = allQueries);
      // Broadcast updated user list to all connected users
      // TODO: Broadcoast query list of this user only to Server dashboard client users who have subscribred for updates
      io.emit("users-update", users);
    });
  });
}
