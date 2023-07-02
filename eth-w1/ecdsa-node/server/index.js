const secp = require("ethereum-cryptography/secp256k1");
const { keccak256 } = require("ethereum-cryptography/keccak");
const { toHex, utf8ToBytes } = require("ethereum-cryptography/utils");
const express = require("express");
const app = express();
const cors = require("cors");
const port = 3042;

app.use(cors());
app.use(express.json());

const balances = {
  "0x90560a7072e2a204dfa6fe34ecc0e7090b95f8ab": 100,
  "0xee35ab89acd212a64108a550bc19d7e24b227e81": 50,
  "0x33f7bf598d0f2190dfca3e9704c2344f9d306d5d": 75,
};

app.get("/balance/:address", (req, res) => {
  const { address } = req.params;
  const balance = balances[address] || 0;
  res.send({ balance });
});

app.post("/send", (req, res) => {
  const { sender, recipient, amount, signature, recoveryBit } = req.body;

  const hashedMessage = keccak256(utf8ToBytes(recipient + amount));
  const publicKey = secp.recoverPublicKey(
    hashedMessage,
    Uint8Array.from(Object.values(signature)),
    recoveryBit
  );

  if (!secp.verify(signature, hashedMessage, publicKey)) {
    res.status(401).send({ message: "Unable to validate sender." });
  } else {
    setInitialBalance(sender);
    setInitialBalance(recipient);

    if (balances[sender] < amount) {
      res.status(400).send({ message: "Not enough funds!" });
    } else {
      balances[sender] -= amount;
      balances[recipient] += amount;
      res.send({ balance: balances[sender] });
    }
  }
});

app.listen(port, () => {
  console.log(`Listening on port ${port}!`);
});

function setInitialBalance(address) {
  if (!balances[address]) {
    balances[address] = 0;
  }
}
