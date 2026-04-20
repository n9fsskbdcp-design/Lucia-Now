import Container from "@/components/layout/container";
import ExperienceForm from "@/components/vendor/experience-form";
import { requireRole } from "@/lib/auth/guards";

export default async function Page() {
  await requireRole(["vendor", "admin"]);

  return (
    <main className="py-12">
      <Container className="max-w-3xl">
        <h1 className="text-3xl font-semibold mb-8">Create Experience</h1>
        <ExperienceForm mode="create" />
      </Container>
    </main>
  );
}