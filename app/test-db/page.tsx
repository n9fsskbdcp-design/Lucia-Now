import { createClient } from "@/lib/supabase/server";

export default async function TestDbPage() {
  const supabase = await createClient();

  const { data: regions, error } = await supabase
    .from("regions")
    .select("*")
    .order("name");

  return (
    <main className="p-8">
      <h1 className="text-2xl font-semibold mb-4">Database Test</h1>

      {error ? (
        <pre className="text-red-600">{JSON.stringify(error, null, 2)}</pre>
      ) : (
        <pre>{JSON.stringify(regions, null, 2)}</pre>
      )}
    </main>
  );
}