import { prisma } from '@/lib/prisma'
import NotificationBanner from '@/components/NotificationBanner'

interface Props {
  userId: string
}

// Dashboard warns user when no notification method is configured — async Server Component
export default async function NotificationStatus({ userId }: Props) {
  const notificationSetting = await prisma.notificationSetting.findUnique({
    where: { userId },
  })

  const hasNotification =
    !!notificationSetting?.discordWebhookUrl || !!notificationSetting?.emailEnabled

  if (hasNotification) return null
  return <NotificationBanner />
}
