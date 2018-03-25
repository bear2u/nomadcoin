const express = require("express"),
    bodyParser = require("body-parser"),
    morgan = require("morgan"), //express http 로깅
    Blockchain = require("./blockchain"),
    P2P = require("./p2p");


const { getBlockchain, createNewBlock } = Blockchain;
const { startP2PServer, connectToPeers } = P2P;

const PORT = process.env.HTTP_PORT || 3000;

const app = express();
app.use(bodyParser.json());
app.use(morgan("combine"));

app.get("/blocks",(req,res) => {
    res.send(getBlockchain()); //블록체인을 가져온다. 
});

//블록을 새로만든다.
app.post("/blocks", (req,res) => {
    const { body: { data } } = req;
    const newBlock = createNewBlock(data);
    res.send(newBlock);
});

//p2p 서비스를 진행한다. 
app.post("/peers", (req, res) => {
    const { body : { peer }} = req;
    connectToPeers(peer);
    res.send();
});

const server = app.listen(PORT, () => console.log(`Nomadcoin Server running on ${PORT}`));

startP2PServer(server);