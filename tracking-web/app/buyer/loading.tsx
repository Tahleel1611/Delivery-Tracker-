export default function BuyerLoading() {
  return <div aria-label="Loading buyer orders" className="animate-pulse space-y-4"><div className="h-10 w-48 rounded bg-slate-200" />{[1, 2, 3].map((item) => <div className="h-28 rounded-2xl bg-slate-200" key={item} />)}</div>;
}