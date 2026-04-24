import Link from "next/link";

type Message = {
  id: string;
  sender_role: string;
  message: string;
  created_at: string;
};

export default function MessageThread({
  bookingId,
  messages,
  compact = false,
}: {
  bookingId: string;
  messages: Message[];
  compact?: boolean;
}) {
  const latest = messages.slice(-3);

  if (compact) {
    return (
      <section className="rounded-3xl bg-white p-6 shadow-sm">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-semibold">Messages</h2>
            <p className="mt-1 text-sm text-neutral-500">
              {messages.length} message{messages.length === 1 ? "" : "s"}
            </p>
          </div>

          <Link
            href={`/messages/${bookingId}`}
            className="rounded-xl bg-black px-4 py-2 text-sm text-white"
          >
            Open conversation
          </Link>
        </div>

        <div className="mt-5 space-y-3">
          {latest.length === 0 ? (
            <p className="rounded-2xl bg-neutral-50 p-4 text-sm text-neutral-500">
              No messages yet.
            </p>
          ) : (
            latest.map((message) => (
              <div key={message.id} className="rounded-2xl bg-neutral-50 p-4">
                <p className="text-xs font-medium uppercase text-neutral-500">
                  {message.sender_role}
                </p>
                <p className="mt-2 line-clamp-2 text-sm text-neutral-700">
                  {message.message}
                </p>
              </div>
            ))
          )}
        </div>
      </section>
    );
  }

  return (
    <section className="rounded-3xl bg-white p-8 shadow-sm">
      <h2 className="text-2xl font-semibold">Conversation</h2>

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