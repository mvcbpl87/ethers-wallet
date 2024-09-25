import type { UserInstances } from "../../interfaces/global";
import { ethers } from "ethers";
import * as bip39 from "bip39";
import * as helper from "./helper";
import users from "../../test/users";
import dotenv from "dotenv";

dotenv.config();

const PROVIDER_API_URL = process.env.PROVIDER_API_URL;
const MASTER_MNEMONIC = process.env.MASTER_MNEMONIC;

// Error handlers if provider not exist
if (!PROVIDER_API_URL) throw new Error("Missing Provider API Url");
if (!MASTER_MNEMONIC) throw new Error("Missing Master wallet dependecies!");

const provider = new ethers.JsonRpcProvider(PROVIDER_API_URL);

/* ------------------------------------------------------------------------------------------------------------------ */

// CheckBalance
const checkBalance = async (walletAdr: string) => {
  try {
    const balance = await provider.getBalance(walletAdr);

    const balanceEther = ethers.formatEther(balance);
    console.log(
      `The balance of ${helper.AddressFormatter(
        walletAdr
      )} is: ${balanceEther} ETH`
    );
  } catch (err: Error | any) {
    console.log("Error fetching balance: ", err);
  }
};

const getBalance = async (walletAdr: string) => {
  let balance: string | undefined;
  try {
    const _balance = await provider.getBalance(walletAdr);
    balance = ethers.formatEther(_balance);
    return balance;
  } catch (err) {
    console.log("Failed get balance", err);
    return balance;
  }
};

// Generate Random mnemonic (!Important for pre-create)
const generateRandMnemonic = () => {
  // 128 bits for a 12-word mnemonic
  const mnemonic = bip39.generateMnemonic(128);

  console.log("12-word secret mnemonic : ", mnemonic);
  return mnemonic;
};

// Create Master Wallet/Central Wallet
const createMasterNode = () => {
  const mnemonic = generateRandMnemonic();
  const mnenomicObj = ethers.Mnemonic.fromPhrase(mnemonic);
  const masterNode = ethers.HDNodeWallet.fromMnemonic(mnenomicObj);

  const { address } = masterNode;

  // // create to provider blockchain (currently on sepolia)
  const _deployedWallet = masterNode.connect(provider);

  console.log(
    `Created ${helper.AddressFormatter(
      address
    )}; Deployed : ${helper.AddressFormatter(_deployedWallet.address)}`
  );
  console.log("Full address : ", _deployedWallet.address);
  checkBalance(_deployedWallet.address);
};

// Existing Master Wallet / Central Wallet
const getMasterNode = (): ethers.HDNodeWallet => {
  const mnenomicObj = ethers.Mnemonic.fromPhrase(MASTER_MNEMONIC);
  const masterNode = ethers.HDNodeWallet.fromMnemonic(mnenomicObj);
  return masterNode;
};

const masterWallet = (): ethers.Wallet => {
  const mnenomicObj = ethers.Mnemonic.fromPhrase(MASTER_MNEMONIC);
  const masterNode = ethers.HDNodeWallet.fromMnemonic(mnenomicObj);
  return new ethers.Wallet(masterNode.privateKey, provider);
};

const displayMasterNodeInfo = () => {
  const masterNode = getMasterNode();
  const _address = masterNode.address;
  checkBalance(_address);
};

// (init) create Child Wallet (User Wallet)
const getUniqueChildNode = (index: number) => {
  const master = getMasterNode();
  const _node = master.derivePath(helper.PathFormatter(index));
  return _node.connect(provider);
};

const childWallet = (index: number) => {
  const master = getMasterNode();
  const _node = master.derivePath(helper.PathFormatter(index));
  return new ethers.Wallet(_node.privateKey, provider);
};

const createChildWallet = async (
  master: ethers.HDNodeWallet,
  user: UserInstances
) => {
  try {
    // alt master.deriveChild(index:number)
    const childNode = master.derivePath(helper.PathFormatterV2(user.id));
    const _wallet = childNode;
    // const _wallet = childNode.connect(provider);

    console.log(` ${user.name}'s wallet address : ${_wallet.address}`);
    console.log(`${user.name}'s private key : ${_wallet.privateKey}`);
    checkBalance(_wallet.address);
  } catch (err) {
    console.log("Unable to create child waller", err);
  }
};

const createMultipleChildWallet = () => {
  const masterNode = getMasterNode();
  for (let user of users) {
    createChildWallet(masterNode, user);
  }
};

/* ---- Transaction Actions (Deposit / Withdrawals) ---- */

// (Function) Transactions
const sendTransactions = async (
  nodeWallet: ethers.HDNodeWallet | ethers.Wallet,
  receipientAdr: string,
  value: string
) => {
  const tx = (
    receipient: string,
    value: string
  ): ethers.TransactionRequest => ({
    to: receipient,
    value: ethers.parseEther(value),
  });

  try {
    const _transactions = await nodeWallet.sendTransaction(
      tx(receipientAdr, value)
    );
    const receipt = await _transactions.wait();

    if (!receipt) throw new Error("Receipt not found"); // Not normal if receipt not exist after transaction
    console.log(`Transaction successful with hash: ${receipt.hash}`);
  } catch (error) {
    console.error("Error making transactions", error);
  }
};

// (Flows : Deposit) child wallet > master wallet
const doDeposit = async (
  senderAdr: string,
  receipientAdr: string,
  value: string
) => {
  // Check balance of external wallet
  const balance = await getBalance(senderAdr);

  if (!balance) return; // Error get balance
  if (Number(value) > Number(balance)) return; // Insufficient balance

  /* ---- Idea? : Try to figure which user (player) making deposit (WebSocket || Pooling) */

  const user = users.find((user) => user.address === senderAdr);
  if (!user) return;

  const child = childWallet(user.index);

  await sendTransactions(child, receipientAdr, value);
};

// (Flows : Withdrawal) From master wallet to external wallet
const doWithdrawal = async (
  senderAdr: string,
  receipientAdr: string,
  value: string
) => {
  // Check Master/Central wallet balance
  const balance = await getBalance(senderAdr);

  if (!balance) return; // Error get balance
  if (Number(value) > Number(balance)) return; // Insufficient balance
  const master = masterWallet();
  await sendTransactions(master, receipientAdr, value);
};

/* ---- (Advanced) Transactions Errors (Failed Deposit / Withdrawals) ---- */

export {
  checkBalance,
  generateRandMnemonic,
  createMasterNode,
  displayMasterNodeInfo,
  createMultipleChildWallet,
  doDeposit,
  doWithdrawal,
};
