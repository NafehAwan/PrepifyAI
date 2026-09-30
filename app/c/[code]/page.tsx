import { redirect } from "next/navigation";

// Short invite links (/c/ABC234) forward to the challenge's own address.
// Signed-out friends are sent through /login first by the middleware, which
// remembers this path and returns here afterwards.
export default function ChallengeInvite({ params }: { params: { code: string } }) {
  const code = params.code.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 6);
  redirect(code.length === 6 ? `/challenges/${code}` : "/");
}
