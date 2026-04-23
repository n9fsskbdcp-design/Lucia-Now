type Message = {
  id: string;
  sender_role: string;
  message: string;
  created_at: string;
};

export default function MessageThread({
  bookingId,
  messages,
}: {
  bookingId: string;
  messages: Message[];
}) {
  return (
    <section className="rounded-3xl bg-white p-8 shadow-sm">
      <h2 className="text-xl font-semibold">Messages</h2>

      <div className="mt-6 space-y-4">
        {messages.length === 0 ? (
          <p className="text-neutral-500">No messages yet.</p>
        ) : (
          messages.map((message) => (
            <div
              key={message.id}
              className="rounded-2xl bg-neutral-50 p-4"
            >
              <div className="flex items-center justify-between gap-3">
                <p className="text-sm font-medium capitalize">
                  {message.sender_role}
                </p>
                <p className="text-xs text-neutral-500">
                  {new Date(message.created_at).toLocaleString()}
                </p>
              </div>

              <p className="mt-3 whitespace-pre-line text-sm text-neutral-700">
                {message.message}
              </p>
            </div>
          ))
        )}
      </div>

      <form
        action={`/api/bookings/${bookingId}/messages`}
        method="post"
        className="mt-6 space-y-3"
      >
        <textarea
          name="message"
          rows={4}
          placeholder="Write a message..."
          className="w-full rounded-2xl border px-4 py-3"
          required
        />

        <button className="rounded-xl bg-black px-5 py-3 text-white">
          Send message
        </button>
      </form>
    </section>
  );
}