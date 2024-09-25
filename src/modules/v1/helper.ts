export const AddressFormatter = (address: string) => {
  if (!address) return "";
  return (
    address.substring(0, 4) +
    "..." +
    address.substring(address.length - 4, address.length)
  );
};

export const PathFormatter = (index: number) => {
  return `44'/60'/0'/0/${index}`; //m /chain'/coin_type'/account'/change/address_index
};

export const UserIndexFinder = (senderAdr: string): number | undefined => {
  return undefined;
};

