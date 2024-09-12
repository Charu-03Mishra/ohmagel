const express = require("express");
const path = require("path");
const app = express();
const router = require("./Router/chatRouter");

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.set("view engine", "ejs");
app.use(express.static(path.join(__dirname, "public")));

const http = require("http");
const socketIo = require("socket.io");
const server = http.createServer(app);
const io = socketIo(server);

let waitingRoom = [];
let Rooms = {};
// Rooms ek object hai uske ander hai properties jo hold karegi array

io.on("connection", function (socket) {
	socket.on("joinroom", function () {
		if (waitingRoom.length > 0) {
			let patner = waitingRoom.shift();
			let RoomName = `${socket.id}- ${patner.id}`;
			socket.join(RoomName);
			patner.join(RoomName);

			io.to(RoomName).emit("joined", RoomName);
			// do group ko jo RoomNmane banaya hai us room bhejo
		} else {
			waitingRoom.push(socket);
		}
	});
	socket.on("message", function (data) {
		socket.broadcast.to(data.room).emit("message", data.message);
	});

	socket.on("signalMessage", function (data) {
		socket.broadcast.to(data.room).emit("signalMessage", data.message);
	});

	socket.on("startvideocall", function ({ room }) {
		socket.broadcast.to(room).emit("incomingcall");
	});

	socket.on("Acceptcall", function ({ room }) {
		socket.broadcast.to(room).emit("callAccepted");
	});

	socket.on("rejectcall", function ({ room }) {
		socket.broadcast.to(room).emit("rejectcall");
	});
	socket.on("disconnect", function () {
		let index = waitingRoom.findIndex(
			(waitingRooms) => waitingRooms.id === socket.id
		);
		waitingRoom.splice(index, 1);
	});
});

app.use("/", router);

server.listen(process.env.PORT || 3000);
