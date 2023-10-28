export const useWaku = () => {
  const onDial = console.log;
  const onSend = console.log;
  const messages: string[] = [];

  return { onDial, onSend, messages };
};
