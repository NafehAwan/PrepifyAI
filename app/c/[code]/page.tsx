import { redirect } from "next/navigation";

// Invite links look like /c/ABC234. The app itself lives on "/", so hand the
// code over as ?join= and let the page open the challenge screen. Signed-out
// friends are sent through /login first by the middleware, which remembers
// this path and returns here afterwards.
export default function ChallengeInvite({ params }: { params: { code: string } }) {
  const code = params.code.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 6);
  redirect(code ? `/?join=${code}` : "/");
}
