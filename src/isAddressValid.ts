export const isAddressValid = (address: string) => {
  return address.length >= 44 && address.length <= 46;
};
