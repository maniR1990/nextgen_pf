// Shown immediately on any /dashboard/* navigation while the server component resolves.
// One file covers Dashboard, Budget, Transactions, Goals, Reports, Settings.
export default function DashboardLoading() {
  return (
    <div className="page-skeleton" aria-busy="true" aria-label="Loading…">
      {/* Sub-navigation bar placeholder */}
      <div className="page-skeleton__subnav">
        <span className="page-skeleton__pill" />
        <span className="page-skeleton__pill" />
        <span className="page-skeleton__pill" />
        <span className="page-skeleton__pill" />
        <span className="page-skeleton__pill" />
      </div>

      {/* Content area rows */}
      <div className="page-skeleton__body">
        <div className="page-skeleton__group-header" />

        <div className="page-skeleton__row page-skeleton__row--wide" />
        <div className="page-skeleton__row" />
        <div className="page-skeleton__row page-skeleton__row--narrow" />

        <div className="page-skeleton__group-header" />

        <div className="page-skeleton__row page-skeleton__row--wide" />
        <div className="page-skeleton__row page-skeleton__row--narrow" />

        <div className="page-skeleton__group-header" />

        <div className="page-skeleton__row" />
        <div className="page-skeleton__row page-skeleton__row--wide" />
        <div className="page-skeleton__row page-skeleton__row--narrow" />
      </div>
    </div>
  );
}
