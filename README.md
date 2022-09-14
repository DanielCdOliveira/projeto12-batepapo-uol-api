<div align="center"><img style = "width:100%;"src="https://i.imgur.com/dqfydBE.png"></img></div>
<hr>
<h2 align=center>UOL chat room API</h2>
<h3 align=center>Web development Project</h3>
<hr>
<h4 align=center>A Api for a chat room made in honor of an old brazilian chat made with Node.js</h4>
<h4 align=center>First application using MongoDB database (NoSQL)</h4>
<hr>

## Features

- User can:
  - Login using a unique name
  - Send private and public messages
  - Direct messages (they can be private or public) for a specific user
- Status message for when the users enter or leave the chat
- Data persistence using mongoDB
- Inactive user removal
- Data validation with joi library

## Requirements

- General
     - [x] Use dotenv.
- Data storage
     - [x] To persist data (participants and messages), use Mongo collections with the `mongodb` library.

- **POST** `/participants`
    - [x] Must receive (through the request body), a **name** parameter, containing the name of the participant to be registered:
        
        ```jsx
        {
            name: "John"
        }
        ```
    - [x] Validate: (if an error is found, return **status 422**)
        - [x] **name** must be non-empty strings
    - [x] Validations should be done with the `joi` library
    - [x] Prevent the registration of a name that is already being used (if it exists, return **status 409**)
    - [x] Save the participant with MongoDB, in the format:
        
        ```jsx
        {name: 'xxx', lastStatus: Date.now()}
        ```       
    - [x] Save with MongoDB a message in the format:
        
        ```jsx
        {from: 'xxx', to: 'All', text: 'enter the room...', type: 'status', time: 'HH:mm:ss'}
        ```
        
        To generate the time in this format, (use the `dayjs` library)
        
    - [x] Finally, return **status 201**. It is not necessary to return any messages other than the status.
- **GET** `/participants`
    - [x] Return the list of all participants
- **POST** `/messages`
    - [x] It must receive (by the request body), the `to`, `text` and `type` parameters:
        
        ```jsx
        {
            to: "Mary",
            text: "hi missing lol",
            type: "private_message"
        }
        ```
        
    - [x] The `from` of the message, that is, the sender, will **not be sent by the body**. It will be sent from the front through a **header** in the request, called `User`.
    - [x] Validate: (if an error is found, return **status 422**)
        - [x] **to** and **text** must be non-empty strings
        - [x] **type** can only be 'message' or 'private_message'
        - [x] **from** must be an existing participant in the participant list
    - [x] Validations should be done with the `joi` library
    - [x] When saving this message, the **time** attribute must be added, containing the current time in the format HH:mm:ss (use the `dayjs` library)
    - [x] Finally, return **status 201**. It is not necessary to return any messages other than the status.
- **GET** `/messages`
    - [x] Return messages
    - [x] This route must accept a parameter via **query string** (which comes after the interrogation in a URL), indicating the number of messages it would like to get. This parameter must be called `limit`. That is, the front request will be made to the URL:
        
        ```jsx
        http://localhost:4000/messages?limit=100
        ```
        
    - [x] If a `limit` is not specified, all messages must be returned. If a `limit` has been given, for example 100, only the last 100 most recent messages should be returned
    - [x] Also, the backend should only deliver messages that that user could see. That is, it must deliver all public messages, all private messages sent to and by him. For this, the front sends a `User` header to identify who is making the request.
- **POST** `/status`
     - [x] Must receive a **header** in the request, called `User`, containing the name of the participant to be updated
     - [x] If this participant is not in the participant list, a **404 status should be returned.** No messages need to be returned beyond the status.
     - [x] Update the **lastStatus** attribute of the informed participant to the current timestamp, using `Date.now()`
     - [x] Finally, return **status 200**
- Automatic removal of inactive users
     - [x] Every 15 seconds, remove from the participant list participants who have a **lastStatus** of more than 10 seconds ago.
     - [x] For each removed participant, save a new message with MongoDB, in the format:

## Bonus
- Data sanitization
    - [x] When saving a participant, sanitize the **name** parameter (remove possible HTML tags for safety)
    - [x] When saving a message, sanitize all parameters (remove possible HTML tags for safety)
    - [x] Also, remove possible whitespace at the beginning and end of strings (search for **trim**)
    - [x] Return sanitized username to frontend in **POST** `/participants` along with status 201

- **DELETE** `/messages/MESSAGE_ID`
    - [x] Must receive a **header** in the request, called `User`, containing the name of the participant who wants to delete the message
    - [x] Must receive by **path params** the ID of the message to be deleted
    - [x] Must search the `messages` collection if any message exists with the id received, and, if not, return **status 404**
    - [x] If the header user is not the owner of the message, return **status 401**
    - [x] Remove message from `messages` collection
- **PUT** `/messages/MESSAGE_ID`
    - [x] It must receive (by the request body), the `to`, `text` and `type` parameters:
        
        ```jsx
        {
            to: "Mary",
            text: "hi missing lol",
            type: "private_message"
        }
        ```
        
    - [x] The `from` of the message, that is, the sender, will **not be sent by the body**. It will be sent from the front through a **header** in the request, called `User`.
    - [x] Must receive a **header** in the request, called `User`, containing the name of the participant who wants to update the message
    - [x] Validate: (if an error is found, return **status 422**)
        - [x] **to** and **text** must be non-empty strings
        - [x] **type** can only be 'message' or 'private_message'
        - [x] **from** must be an existing participant in the participant list
    - [x] Validations should be done with the `joi` library
    - [x] Must receive by **path params** the ID of the message to be updated
    - [x] Must search the `messages` collection if any message exists with the id received, and, if not, return **status 404**
    - [x] If the header user is not the owner of the message, return **status 401**
    - [x] Update message from `messages` collection with body data

## Usage

> Clone the repository:

```bash
  git clone git@github.com:DanielCdOliveira/projeto12-batepapo-uol-api.git
```
- on folder /Back

>Install dependences:

```bash
  npm install
```
> Run aplication:

```bash
  npm run start
```

### Built with

![Node](https://img.shields.io/badge/Node.js-43853D?style=for-the-badge&logo=node.js&logoColor=white)
![MongoDB](https://img.shields.io/badge/MongoDB-4EA94B?style=for-the-badge&logo=mongodb&logoColor=white)
![Javascript](https://img.shields.io/badge/JavaScript-F7DF1E?style=for-the-badge&logo=javascript&logoColor=black)
![Visual Studio Code](https://img.shields.io/badge/Visual%20Studio%20Code-0078d7.svg?style=for-the-badge&logo=visual-studio-code&logoColor=white)
![Git](https://img.shields.io/badge/git-%23F05033.svg?style=for-the-badge&logo=git&logoColor=white)

### Contact

[![LinkedIn][linkedin-shield]][linkedin-url]

[linkedin-shield]: https://img.shields.io/badge/-LinkedIn-black.svg?style=for-the-badge&logo=linkedin&colorB=blue
[linkedin-url]: https://www.linkedin.com/in/danielcdoliveira/
