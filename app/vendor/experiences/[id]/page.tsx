import Container from "@/components/layout/container";
import ExperienceForm from "@/components/vendor/experience-form";
import { requireRole } from "@/lib/auth/guards";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { notFound } from "next/navigation";

type Props = {
  params: Promise<{ id: string }>;
};

export default async function Page({ params }: Props) {
  await requireRole(["vendor", "admin"]);

  const { id } = await params;

  const { data } = await supabaseAdmin
    .from("experiences")
    .select("*")
    .eq("id", id)
    .single();

  if (!data) notFound();

  return (
    <main className="py-12">
      <Container className="max-w-3xl">
        <h1 className="text-3xl font-semibold mb-8">
          Edit Experience
        </h1>

        <ExperienceForm
          mode="edit"
          experienceId={id}
          initialValues={data}
        />
      </Container>
    </main>
  );
}