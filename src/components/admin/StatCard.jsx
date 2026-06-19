export function StatCard({ label, value, icon: Icon, color }) {
  return (
    <div className="p-3 md:p-5 rounded-2xl bg-white/10 border border-white/10 flex flex-col justify-between">
      <div>
        <div className={`w-8 h-8 md:w-10 md:h-10 rounded-xl flex items-center justify-center mb-2 md:mb-3 ${color}`}>
          <Icon className="w-4 h-4 md:w-5 md:h-5 text-white" />
        </div>
        <div className="font-playfair text-xl md:text-3xl font-bold text-white mb-0.5 md:mb-1">{value}</div>
      </div>
      <div className="font-inter text-[10px] md:text-sm text-white/60 truncate" title={label}>{label}</div>
    </div>
  );
}
