const CryptoJS = require("crypto-js"),
  hexToBinary = require("hex-to-binary");

//BLOCK_GENERATION_INTERVAL 생성때마다 난이도를 조절한다.
const BLOCK_GENERATION_INTERVAL = 10;
const DIFFICULTY_ADJUSTMENT_INTERVAL = 10; //난이도 조절

class Block {
  constructor(index, hash, previousHash, timestamp, data, difficulty, nonce) {
    this.index = index; //순서
    this.hash = hash; //해쉬값
    this.previousHash = previousHash; //이전 해쉬값
    this.timestamp = timestamp; //만든 시간
    this.data = data; //넣는 데이터
    this.difficulty = difficulty;
    this.nonce = nonce;
  }
}

//최초 제니시스 블록이라고 최초 블럭을 뜻한다.
const genesisBlock = new Block(
  0,
  "2C4CEB90344F20CC4C77D626247AED3ED530C1AEE3E6E85AD494498B17414CAC", //createH
  null,
  1522015307,
  "This is the genesis!!",
  0,
  0
);

//제니시스 블록체인 가져오는 것 같음
let blockchain = [genesisBlock];

//마지막 블럭을 가져온다.
const getNewestBlock = () => blockchain[blockchain.length - 1];

//시간을 가져온다.
const getTimestamp = () => Math.round(new Date().getTime() / 1000); //반올림 올림

//블록체인을 가져온다.
const getBlockchain = () => blockchain;

//Hash를 만든다.
const createHash = (index, previousHash, timestamp, data, difficulty, nonce) =>
  CryptoJS.SHA256(
    index + previousHash + timestamp + JSON.stringify(data) + difficulty + nonce
  ).toString();

//새로운 블럭을 만든다.
const createNewBlock = data => {
  const oldBlock = getNewestBlock(); //이전블럭 = 생선된 마지막 블럭
  const newBlockIndex = oldBlock.index + 1; //이전 블럭 index + 1
  const newTimestamp = getTimestamp(); //시간
  const difficulty = findDifficulty();
  const newBlock = findBlock(
    newBlockIndex,
    oldBlock.hash,
    newTimestamp,
    data,
    difficulty
  );
  //블록체인에 새로운 블럭을 추가
  addBlockToChain(newBlock);
  require("./p2p").broadcastNewBlock();
  return newBlock;
};

const findDifficulty = blockchain => {
  const newestBlock = getNewestBlock();
  if (
    newestBlock.index % DIFFICULTY_ADJUSTMENT_INTERVAL === 0 &&
    newestBlock.index !== 0
  ) {
    return calculateNewDifficulty(newestBlock, getBlockchain());
  } else {
    return newestBlock.difficulty;
  }
};

const calculateNewDifficulty = (newestBlock, blockchain) => {
  const lastCalculatedBlock =
    blockchain[blockchain.length - DIFFICULTY_ADJUSTMENT_INTERVAL];
  const timeExpected =
    BLOCK_GENERATION_INTERVAL * DIFFICULTY_ADJUSTMENT_INTERVAL;
  const timeTaken = newestBlock.timestamp - lastCalculatedBlock.timestamp;
  if (timeTaken < timeExpected / 2) {
    return lastCalculatedBlock.difficulty + 1;
  } else if (timeTaken > timeExpected * 2) {
    return lastCalculatedBlock.difficulty - 1;
  } else {
    return lastCalculatedBlock.difficulty;
  }
};

const findBlock = (index, previousHash, timestamp, data, difficulty) => {
  let nonce = 0;
  while (true) {
    const hash = createHash(
      index,
      previousHash,
      timestamp,
      data,
      difficulty,
      nonce
    );
    console.log("Current nonce", nonce);
    if (hashMatchesDifficulty(hash, difficulty)) {
      return new Block(
        index,
        hash,
        previousHash,
        timestamp,
        data,
        difficulty,
        nonce
      );
    }
    nonce++;
  }
};

const hashMatchesDifficulty = (hash, difficulty) => {
  const hashInBinary = hexToBinary(hash);
  const requiredZeros = "0".repeat(difficulty); //0 * difficulty 갯수로 나옴
  console.log("Trying difficulty:", difficulty, "with hash", hashInBinary);
  return hashInBinary.startsWith(requiredZeros);
};

const getBlocksHash = block =>
  createHash(
    block.index,
    block.previousHash,
    block.timestamp,
    block.data,
    block.difficulty,
    block.nonce
  );

//난이도를 조절하기 위해 타임스탬프를 조절하는 걸 막는다.
const isTimeStampValid = (newBlock, oldBlock) => {
  return (
    //예전 시간에서 1분을 뺀 값이 새로운 시간보다 작고
    oldBlock.timestamp - 60 < newBlock.timestamp &&
    newBlock.timestamp - 60 < getTimestamp()
  );
};

const isBlockValid = (candidateBlock, latestBlock) => {
  if (!isBlockStructureValid(candidateBlock)) {
    //새로운 구조인지 체크
    console.log("The candidate block structure is not valid");
    return false;
  } else if (latestBlock.index + 1 !== candidateBlock.index) {
    //마지막 블록 인덱스가 +1이 된 게 맞는 지 체크
    console.log("The candidate block doesnt have a valid index");
    return false;
  } else if (latestBlock.hash !== candidateBlock.previousHash) {
    //마지막 블럭이 이전 블럭 해쉬값이랑 비교해서 맞는 지 체크
    console.log(
      "The previousHash of the candidate block is not the hash of the latest block"
    );
    return false;
  } else if (getBlocksHash(candidateBlock) !== candidateBlock.hash) {
    //주어진 블럭해쉬가 블럭의 해쉬와 일치 하지 않을 경우
    console.log("The hash of this block is invalid");
    return false;
  } else if (!isTimeStampValid(candidateBlock, latestBlock)) {
    console.log("The timestamp of this block is dogy");
    return false;
  }
  return true;
};

const isBlockStructureValid = block => {
  return (
    typeof block.index === "number" &&
    typeof block.hash === "string" &&
    typeof block.previousHash === "string" &&
    typeof block.timestamp === "number" &&
    typeof block.data === "string"
  );
};
//체인 유효성 체크
const isChainValid = candidateChain => {
  const isGenesisValid = block => {
    //최초 만들어진 제니시스 블럭이 맞는지 체크
    return JSON.stringify(block) === JSON.stringify(genesisBlock);
  };
  if (!isGenesisValid(candidateChain[0])) {
    console.log(
      "The candidateChains's genesisBlock is not the same as our genesisBlock"
    );
    return false;
  }
  for (let i = 1; i < candidateChain.length; i++) {
    //다음 블럭이 이전 블럭의 새로운 블럭이 맞는 지 체크
    if (!isBlockValid(candidateChain[i], candidateChain[i - 1])) {
      return false;
    }
  }
  return true;
};

const sumDifficulty = anyBlockchain =>
  anyBlockchain
    .map(block => block.difficulty)
    .map(difficulty => Math.pow(2, difficulty))
    .reduce((a,b) => a + b)

//체인을 바꾸는 함수
const replaceChain = candidateChain => {
  if (
    //체인이 맞는 지 체크
    isChainValid(candidateChain) &&
    sumDifficulty(candidateChain) > sumDifficulty(getBlockchain())
  ) {
    blockchain = candidateChain;
    return true;
  } else {
    return false;
  }
};

//체인에 블럭을 추가
const addBlockToChain = candidateBlock => {
  //새로운 블럭이 맞는지 유호성 체크 , 마지막 블럭을 가져오고
  if (isBlockValid(candidateBlock, getNewestBlock())) {
    //블럭을 체인에 푸시한다.
    blockchain.push(candidateBlock);
    return true;
  } else {
    return false;
  }
};

module.exports = {
  getNewestBlock,
  getBlockchain,
  createNewBlock,
  isBlockStructureValid,
  addBlockToChain,
  replaceChain
};
