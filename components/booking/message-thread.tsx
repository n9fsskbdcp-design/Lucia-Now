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
    <section className="rounded-3xl border-2 border-black bg-white p-8 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-medium uppercase tracking-[0.2em] text-neutral-500">
            In-app chat
          </p>

          <h2 className="mt-2 text-2xl font-semibold">
            Messages about this booking
          </h2>

          <p className="mt-2 text-sm text-neutral-600">
            Tourist and vendor can message each other here. Messages stay attached
            to this booking request.
          </p>
        </div>

        <span className="rounded-full bg-black px-4 py-2 text-sm text-white">
          {messages.length} message{messages.length === 1 ? "" : "s"}
        </span>
      </div>

      <div className="mt-6 space-y-4">
        {messages.length === 0 ? (
          <div className="rounded-2xl bg-neutral-50 p-5 text-neutral-600">
            No messages yet. Send the first message below.
          </div>
        ) : (
          messages.map((message) => (
            <div
              key={message.id}
              className={`rounded-2xl p-4 ${
                message.sender_role === "vendor"
                  ? "bg-black text-white"
                  : "bg-neutral-100 text-neutral-900"
              }`}
            >
              <div className="flex items-center justify-between gap-3">
                <p className="text-sm font-medium capitalize">
                  {message.sender_role}
                </p>

                <p
                  className={`text-xs ${
                    message.sender_role === "vendor"
                      ? "text-white/60"
                      : "text-neutral-500"
                  }`}
                >
                  {new Date(message.created_at).toLocaleString()}
                </p>
              </div>

              <p className="mt-3 whitespace-pre-line text-sm">
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
          placeholder="Write a message to the other party..."
          className="w-full rounded-2xl border px-4 py-3"
          required
        />

        <button className="rounded-xl bg-black px-5 py-3 text-white">
          Send in-app message
        </button>
      </form>
    </section>
  );
}