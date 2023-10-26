export const isBrowserProviderValid = (obj: any) => {
  if (obj && typeof obj.request === "function") {
    return true;
  }
  return true;
};
