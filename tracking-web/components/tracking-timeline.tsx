type DeliveryStatus = 'READY_FOR_DISPATCH' | 'OUT_FOR_DELIVERY' | 'DELIVERED' | 'FAILED' | 'CANCELLED';

const stages: { status: DeliveryStatus; label: string; description: string }[] = [
  { status: 'READY_FOR_DISPATCH', label: 'Order received', description: 'Your delivery is being prepared.' },
  { status: 'OUT_FOR_DELIVERY', label: 'Out for delivery', description: 'Your order is on its way.' },
  { status: 'DELIVERED', label: 'Delivered', description: 'Your order has arrived.' }
];

const progressIndex = (status: DeliveryStatus): number => {
  if (status === 'DELIVERED') return 2;
  if (status === 'OUT_FOR_DELIVERY') return 1;
  return 0;
};

export function TrackingTimeline({ status }: { status: DeliveryStatus }) {
  const activeIndex = progressIndex(status);
  const isException = status === 'FAILED' || status === 'CANCELLED';

  return (
    <ol className="space-y-0" aria-label="Delivery progress">
      {stages.map((stage, index) => {
        const complete = index <= activeIndex && !isException;
        const current = index === activeIndex && !isException;
        return (
          <li className="relative flex gap-4 pb-8 last:pb-0" key={stage.status}>
            {index < stages.length - 1 && <span className={`absolute left-3 top-7 h-full w-0.5 ${complete && index < activeIndex ? 'bg-emerald-500' : 'bg-slate-200'}`} />}
            <span className={`z-10 grid h-6 w-6 shrink-0 place-items-center rounded-full text-xs font-bold ${complete ? 'bg-emerald-500 text-white' : 'bg-slate-200 text-slate-500'}`}>
              {complete ? '✓' : index + 1}
            </span>
            <div className="pt-0.5">
              <p className={`font-semibold ${current ? 'text-emerald-700' : 'text-slate-700'}`}>{stage.label}</p>
              <p className="mt-1 text-sm text-slate-500">{stage.description}</p>
            </div>
          </li>
        );
      })}
    </ol>
  );
}
