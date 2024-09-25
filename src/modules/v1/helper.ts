import { ethers } from "ethers";

export const AddressFormatter = (address: string) => {
  if (!address) return "";
  return (
    address.substring(0, 4) +
    "..." +
    address.substring(address.length - 4, address.length)
  );
};

/**
 * PathFormatter accept user index number
 * and indexes will increment every
 * user sign up.
 */
export const PathFormatter = (index: number) => {
  return `44'/60'/0'/0/${index}`; //m /chain'/coin_type'/account'/change/address_index
};

export const UserIndexFinder = (senderAdr: string): number | undefined => {
  return undefined;
};

/**
 * PathFormatterV2 accept user uuidV4 then convert
 * into category index and local index.
 */
export const PathFormatterV2 = (id: string) => {
  const hash = ethers.keccak256(ethers.toUtf8Bytes(id));

  // convert hash to an integer
  const index = parseInt(hash.slice(0, 16), 16);

  // use module operation to ensure valid index
  const validIndex = index % 2 ** 31; // Index limitations limited to 31 bits approx 2.14 billion indexes

  // Hierarchical indexing
  const categoryIndex = Math.floor(validIndex / 1000);

  const localIndex = validIndex % 1000;

  return `44'/60'/0'/${categoryIndex}/${localIndex}`;
};
