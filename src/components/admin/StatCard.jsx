export function StatCard({ label, value, icon: Icon, color }) {
  return (
    <div className="p-5 rounded-2xl bg-white/10 border border-white/10">
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-3 ${color}`}>
        <Icon className="w-5 h-5 text-white" />
      </div>
      <div className="font-playfair text-3xl font-bold text-white mb-1">{value}</div>
      <div className="font-inter text-sm text-white/60">{label}</div>
    </div>
  );
}
