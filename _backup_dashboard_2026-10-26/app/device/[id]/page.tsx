import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { DevicePlayer } from "@/components/player/device-player";
import { requireUser } from "@/lib/auth";
import { getMyDevice } from "@/lib/devices/queries";

export const metadata: Metadata = { title: "Device" };

export default async function DevicePage({ params }: { params: Promise<{ id: string }> }) {
  await requireUser();
  const { id } = await params;
  const device = await getMyDevice(id);
  if (!device) notFound();
  return <DevicePlayer deviceId={device.id} name={device.name} />;
}
