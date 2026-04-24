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
      <section className="rounded-[2rem] bg-white p-5 shadow-sm ring-1 ring-black/5 sm:p-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-sm text-neutral-500">Conversation</p>
            <h2 className="mt-1 text-xl font-semibold">Messages</h2>
          </div>

          <Link
            href={`/messages/${bookingId}`}
            className="rounded-full bg-neutral-950 px-4 py-2 text-sm font-medium text-white"
          >
            Open chat
          </Link>
        </div>

        <div className="mt-5 space-y-3">
          {latest.length === 0 ? (
            <p className="rounded-3xl bg-neutral-50 p-4 text-sm text-neutral-500">
              No messages yet.
            </p>
          ) : (
            latest.map((message) => (
              <div key={message.id} className="rounded-3xl bg-neutral-50 p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-neutral-400">
                  {message.sender_role}
                </p>
                <p className="mt-2 line-clamp-2 text-sm leading-6 text-neutral-700">
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
    <section className="rounded-[2rem] bg-white p-5 shadow-sm ring-1 ring-black/5 sm:p-8">
      <div>
        <p className="text-sm text-neutral-500">Platform chat</p>
        <h2 className="mt-1 text-2xl font-semibold">Conversation</h2>
      </div>

      <div className="mt-6 space-y-4">
        {messages.length === 0 ? (
          <div className="rounded-3xl bg-neutral-50 p-5 text-sm text-neutral-500">
            No messages yet. Send the first message below.
          </div>
        ) : (
          messages.map((message) => {
            const isVendor = message.sender_role === "vendor";

            return (
              <div
                key={message.id}
                className={`flex ${isVendor ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[88%] rounded-[1.5rem] p-4 sm:max-w-[70%] ${
                    isVendor
                      ? "bg-neutral-950 text-white"
                      : "bg-neutral-100 text-neutral-950"
                  }`}
                >
                  <div className="flex items-center justify-between gap-4">
                    <p className="text-xs font-semibold uppercase tracking-wide opacity-70">
                      {message.sender_role}
                    </p>

                    <p className="text-xs opacity-60">
                      {new Date(message.created_at).toLocaleString()}
                    </p>
                  </div>

                  <p className="mt-3 whitespace-pre-line text-sm leading-6">
                    {message.message}
                  </p>
                </div>
              </div>
            );
          })
        )}
      </div>

      <form
        action={`/api/bookings/${bookingId}/messages`}
        method="post"
        className="mt-6 rounded-3xl bg-neutral-50 p-3"
      >
        <textarea
          name="message"
          rows={4}
          placeholder="Write a message..."
          className="w-full resize-none rounded-2xl border-0 bg-white px-4 py-3 text-sm shadow-sm ring-1 ring-black/5 focus:shadow-none"
          required
        />

        <div className="mt-3 flex justify-end">
          <button className="rounded-full bg-neutral-950 px-5 py-3 text-sm font-medium text-white">
            Send message
          </button>
        </div>
      </form>
    </section>
  );
}