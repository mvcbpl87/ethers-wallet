import moduleV1 from "./modules/v1";

moduleV1.createMultipleChildWallet();

/* ---- Withdrawal Test ----- */
moduleV1.displayMasterNodeInfo();

// flows master wallet -> external wallet
// const senderAdr = address.masterWalletAdr;
// const receipientAdr = address.walletAddress; // your external address
// const value = "0.00002";
// moduleV1.doWithdrawal(senderAdr, receipientAdr, value);

// moduleV1.displayMasterNodeInfo();
/* ---- End Withdrawal Test ----- */