import { apiSlice } from "./apiSlice";

export const chatApiSlice = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getMyRooms: builder.query({
      query: () => "/chat/rooms",
      providesTags: ["Chat"],
    }),

    createRoom: builder.mutation({
      query: (body: { productId: string; sellerId: string }) => ({
        url: "/chat/rooms",
        method: "POST",
        body,
      }),
      invalidatesTags: ["Chat"],
    }),

    getRoomMessages: builder.query({
      query: ({ roomId, limit = 50 }: { roomId: string; limit?: number }) => ({
        url: `/chat/rooms/${roomId}/messages`,
        params: { limit },
      }),
    }),

    markRoomRead: builder.mutation({
      query: (roomId: string) => ({
        url: `/chat/rooms/${roomId}/read`,
        method: "PATCH",
      }),
      invalidatesTags: ["Chat"],
    }),

    getChatUnread: builder.query({
      query: () => "/chat/unread",
      providesTags: ["Chat"],
    }),
  }),
});

export const {
  useGetMyRoomsQuery,
  useCreateRoomMutation,
  useGetRoomMessagesQuery,
  useMarkRoomReadMutation,
  useGetChatUnreadQuery,
} = chatApiSlice;
