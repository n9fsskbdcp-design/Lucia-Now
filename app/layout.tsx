import "./globals.css";
import { Toaster } from "sonner";
import Navbar from "@/components/layout/navbar";

export const metadata = {
  title: "Lucia Now",
  description: "Premium experiences in St Lucia",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="bg-white text-neutral-900 antialiased">
        <Navbar />

        <main>{children}</main>

        <footer className="border-t bg-neutral-50">
          <div className="mx-auto grid max-w-7xl gap-10 px-6 py-14 md:grid-cols-3">
            <div>
              <h3 className="font-semibold">Lucia Now</h3>
              <p className="mt-3 text-sm text-neutral-500">
                Premium last-minute experiences in St Lucia. Trusted vendors,
                smooth browsing, better island bookings.
              </p>
            </div>

            <div>
              <h4 className="font-medium">Explore</h4>
              <div className="mt-3 space-y-2 text-sm text-neutral-500">
                <p>Boat Trips</p>
                <p>Private Drivers</p>
                <p>Island Tours</p>
              </div>
            </div>

            <div>
              <h4 className="font-medium">Partners</h4>
              <div className="mt-3 space-y-2 text-sm text-neutral-500">
                <p>Become a Partner</p>
                <p>Manage Listings</p>
                <p>Grow Revenue</p>
              </div>
            </div>
          </div>

          <div className="border-t px-6 py-6 text-center text-sm text-neutral-500">
            © 2026 Lucia Now
          </div>
        </footer>

        <Toaster richColors position="top-right" />
      </body>
    </html>
  );
}