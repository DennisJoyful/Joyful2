export default function HilfePage() {
  return (
    <div className="p-6 space-y-4">
      <h1 className="text-2xl font-semibold">Hilfe</h1>
      <ul className="list-disc pl-5 text-sm space-y-1">
        <li>Leads findest du unter <code>/dashboard/manager/leads</code>.</li>
        <li>Werber anlegen vorbereiteter Platz: <code>/dashboard/manager/werber</code>.</li>
        <li>Bei Layout- oder Datenproblemen bitte Inkognito testen und ggf. neu anmelden.</li>
      </ul>
    </div>
  )
}
