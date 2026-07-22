let activeSupportChatId: string | null = null;

export const getActiveSupportChatId = () => activeSupportChatId;
export const setActiveSupportChatId = (id: string | null) => {
  activeSupportChatId = id;
};
