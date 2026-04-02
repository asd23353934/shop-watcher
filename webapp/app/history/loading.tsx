import { Skeleton } from '@/components/ui/skeleton'

export default function HistoryLoading() {
  return (
    <>
      <div className="mb-6">
        <Skeleton className="h-8 w-28 rounded" />
        <Skeleton className="mt-1 h-4 w-48 rounded" />
      </div>

      <div className="overflow-hidden rounded-xl border bg-white shadow-sm">
        <table className="w-full text-sm">
          <thead className="border-b bg-gray-50">
            <tr>
              {['關鍵字', '平台', '商品 ID', '首次通知時間', '操作'].map((col) => (
                <th key={col} className="px-4 py-3 text-left font-medium text-gray-600">{col}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y">
            {Array.from({ length: 8 }).map((_, i) => (
              <tr key={i}>
                {Array.from({ length: 5 }).map((__, j) => (
                  <td key={j} className="px-4 py-3">
                    <Skeleton className="h-4 w-full rounded" />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  )
}
