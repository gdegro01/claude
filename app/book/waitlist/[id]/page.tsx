import { GuestClaim } from "./GuestClaim";

interface Props {
  params: Promise<{ id: string }>;
}

export function generateStaticParams() {
  return [{ id: "demo" }, { id: "1" }, { id: "2" }];
}

export default async function WaitlistClaimPage({ params }: Props) {
  const { id } = await params;
  return <GuestClaim id={id} />;
}
