const mongoose = require("mongoose") 
const Document = require("./Document")

// Creating an online database
const mongodbUrl ="mongodb+srv://redamohsen:texteditor1234@cluster0.4rr3koo.mongodb.net/?retryWrites=true&w=majority";

mongoose.connect(mongodbUrl, { useNewUrlParser: true, useUnifiedTopology: true }).catch((err) => console.log(err));


const io = require("socket.io")(3001, { //set port number of server to 3001
  cors: {
    origin: "http://localhost:3000", //cleint address
    methods: ["GET", "POST"], //allow send and receive req
  },
})

const defaultValue = "" // set default value to new created doc to empty
//set socket connection 
io.on("connection", socket => {
  //get data from doc with id
  socket.on("get-document", async documentId => { 
    const document = await findOrCreateDocument(documentId)
    socket.join(documentId) //put server in this doc
    socket.emit("load-document", document.data) //load data
    //save document 
    socket.on("send-changes", delta => {
      socket.broadcast.to(documentId).emit("receive-changes", delta)
    })
    //update doc data
    socket.on("save-document", async data => {
      await Document.findByIdAndUpdate(documentId, { data })
    })
  })
})
//find doc by its id
async function findOrCreateDocument(id) {
  if (id == null) return
  const document = await Document.findById(id)
  if (document) return document //if you find doc with specific id return it to user
  return await Document.create({ _id: id, data: defaultValue }) //if there is now doc create an empty one
}
