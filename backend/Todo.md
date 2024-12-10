### **HTTP Endpoints**

These endpoints handle user authentication, room management, and fetching history. Here’s how they can be structured:

---

#### 1. **`POST /api/login`**

- **Purpose**: Authenticate a user and provide a token/session for future requests.
- **Request**:
  ```json
  {
    "username": "john_doe",
    "password": "securepassword"
  }
  ```
- **Response**:
  ```json
  {
    "status": "success",
    "token": "abcd1234"
  }
  ```
- **Flow**:
  1. The user logs in using a username/password.
  2. The server validates the credentials and generates a session token or JWT.
  3. The token is sent back and used for subsequent requests (like joining a room).

---

#### 2. **`POST /api/create-room`**

- **Purpose**: Create a new chat room.
- **Request**:
  ```json
  {
    "roomName": "TechTalk",
    "creator": "john_doe"
  }
  ```
- **Response**:
  ```json
  {
    "status": "success",
    "roomId": "room_12345"
  }
  ```
- **Flow**:
  1. A user requests a new room to be created.
  2. The server generates a unique `roomId` and stores it in the database.
  3. Returns the `roomId` to the client.

---

#### 3. **`GET /api/rooms`**

- **Purpose**: Retrieve a list of available chat rooms.
- **Request**:
  - **Headers**: Include authentication token.
- **Response**:
  ```json
  [
    { "roomId": "room_12345", "roomName": "TechTalk" },
    { "roomId": "room_67890", "roomName": "GamingZone" }
  ]
  ```
- **Flow**:
  1. The user requests the list of active chat rooms.
  2. The server fetches all room details from the database and returns them.

---

#### 4. **`POST /api/join-room`**

- **Purpose**: Allow a user to join an existing room.
- **Request**:
  ```json
  {
    "roomId": "room_12345",
    "username": "john_doe"
  }
  ```
- **Response**:
  ```json
  {
    "status": "success",
    "message": "Joined room TechTalk"
  }
  ```
- **Flow**:
  1. The client sends the `roomId` and `username`.
  2. The server verifies if the room exists and adds the user to the room's member list.

---

#### 5. **`GET /api/chat-history/:roomId`**

- **Purpose**: Fetch chat history for a specific room.
- **Request**:
  - **Headers**: Include authentication token.
  - **Path Params**: `roomId`
- **Response**:
  ```json
  {
    "roomId": "room_12345",
    "messages": [
      {
        "sender": "john_doe",
        "message": "Hello!",
        "timestamp": "2024-12-10T12:00:00Z"
      },
      {
        "sender": "jane_doe",
        "message": "Hi!",
        "timestamp": "2024-12-10T12:01:00Z"
      }
    ]
  }
  ```
- **Flow**:
  1. The server queries the database for messages from the specified `roomId`.
  2. Returns the message history.

---

### **WebSocket Handlers**

These handle the real-time messaging part.

#### **Connection Flow**

1. The client opens a WebSocket connection to `ws://server_address/chat`.
2. Upon connection, the client sends a message to identify the user and room:
   ```json
   {
     "action": "join",
     "username": "john_doe",
     "roomId": "room_12345"
   }
   ```

---

#### 1. **Action: `join`**

- **Purpose**: Add a user to a chat room.
- **Message from Client**:
  ```json
  {
    "action": "join",
    "username": "john_doe",
    "roomId": "room_12345"
  }
  ```
- **Response**:
  - Acknowledgment to the user:
    ```json
    {
      "action": "joined",
      "roomId": "room_12345",
      "message": "Welcome to TechTalk!"
    }
    ```
  - Notify others in the room:
    ```json
    {
      "action": "user-joined",
      "username": "john_doe"
    }
    ```

---

#### 2. **Action: `send-message`**

- **Purpose**: Send a message to the chat room.
- **Message from Client**:
  ```json
  {
    "action": "send-message",
    "roomId": "room_12345",
    "message": "Hello, everyone!"
  }
  ```
- **Broadcast to Room**:
  ```json
  {
    "action": "new-message",
    "roomId": "room_12345",
    "sender": "john_doe",
    "message": "Hello, everyone!",
    "timestamp": "2024-12-10T12:10:00Z"
  }
  ```

---

#### 3. **Action: `leave`**

- **Purpose**: Disconnect a user from a room.
- **Message from Client**:
  ```json
  {
    "action": "leave",
    "username": "john_doe",
    "roomId": "room_12345"
  }
  ```
- **Broadcast to Room**:
  ```json
  {
    "action": "user-left",
    "username": "john_doe"
  }
  ```

---

### **Overall Request Flow**

1. **Login**:
   - Client logs in via `/api/login` to get a token.
2. **Fetch Rooms**:
   - Fetch rooms via `/api/rooms` or create a new room via `/api/create-room`.
3. **Join Room**:
   - Join a room via `/api/join-room` and establish a WebSocket connection.
4. **Chat**:
   - Send and receive messages via WebSocket.
5. **Fetch History**:
   - Retrieve chat history using `/api/chat-history/:roomId`.
