const CryptoJS = require("crypto-js");

class Block {
  constructor(index, hash, previousHash, timestamp, data) {
    this.index = index; //순서
    this.hash = hash; //해쉬값
    this.previousHash = previousHash; //이전 해쉬값
    this.timestamp = timestamp; //만든 시간
    this.data = data; //넣는 데이터
  }
}

//최초 제니시스 블록이라고 최초 블럭을 뜻한다. 
const genesisBlock = new Block(
  0,
  "2C4CEB90344F20CC4C77D626247AED3ED530C1AEE3E6E85AD494498B17414CAC", //createH
  null,
  1520312194926,
  "This is the genesis!!"
);

//제니시스 블록체인 가져오는 것 같음
let blockchain = [genesisBlock];

//마지막 블럭을 가져온다.
const getLastBlock = () => blockchain[blockchain.length - 1];

//시간을 가져온다. 
const getTimestamp = () => new Date().getTime() / 1000;

//블록체인을 가져온다.
const getBlockchain = () => blockchain;

//Hash를 만든다. 
const createHash = (index, previousHash, timestamp, data) =>
  CryptoJS.SHA256(
    index + previousHash + timestamp + JSON.stringify(data)
  ).toString();

//새로운 블럭을 만든다. 
const createNewBlock = data => {
  const previousBlock = getLastBlock(); //이전블럭 = 생선된 마지막 블럭
  const newBlockIndex = previousBlock.index + 1; //이전 블럭 index + 1
  const newTimestamp = getTimestamp(); //시간
  const newHash = createHash( 
    newBlockIndex,
    previousBlock.hash,
    newTimestamp,
    data
  );
  const newBlock = new Block(
    newBlockIndex,
    newHash,
    previousBlock.hash,
    newTimestamp,
    data
  );
  //블록체인에 새로운 블럭을 추가
  addBlockToChain(newBlock);
  return newBlock;
};

const getBlocksHash = block =>
  createHash(block.index, block.previousHash, block.timestamp, block.data);

const isNewBlockValid = (candidateBlock, latestBlock) => {  
  if (!isNewStructureValid(candidateBlock)) {//새로운 구조인지 체크
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
  }
  return true;
};

const isNewStructureValid = block => {
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
    if (!isNewBlockValid(candidateChain[i], candidateChain[i - 1])) {
      return false;
    }
  }
  return true;
};
//체인을 바꾸는 함수
const replaceChain = candidateChain => {
  if (
    //체인이 맞는 지 체크
    isChainValid(candidateChain) &&
    candidateChain.length > getBlockchain().length
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
  if (isNewBlockValid(candidateBlock, getLastBlock())) {
    //블럭을 체인에 푸시한다. 
    blockchain.push(candidateBlock);
    return true;
  } else {
    return false;
  }
};

module.exports = {
  getLastBlock,
  getBlockchain,
  createNewBlock
};