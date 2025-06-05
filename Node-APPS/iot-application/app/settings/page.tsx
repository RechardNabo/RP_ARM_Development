import { SettingsHeader } from "@/components/settings/settings-header"
import { ProtocolSettings } from "@/components/settings/protocol-settings"
import { SystemSettings } from "@/components/settings/system-settings"
import { DatabaseSettings } from "@/components/settings/database-settings"

export default function SettingsPage() {
  return (
    <div className="p-6 space-y-6">
      <SettingsHeader />
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <ProtocolSettings />
        </div>
        <div className="space-y-6">
          <SystemSettings />
          <DatabaseSettings />
        </div>
      </div>
    </div>
  )
}
